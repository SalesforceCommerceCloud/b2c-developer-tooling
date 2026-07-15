/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import * as path from 'path';

import type {CartridgeService} from '../cartridges/cartridge-service.js';
import {VOID_TAGS} from './constants.js';
import {collectIsmlDiagnostics, getIsmlQuickFixes, DEFAULT_DISABLED_RULES} from './diagnostics.js';
import type {IsmlDiagnosticCode} from './diagnostics.js';
import {findTemplateLinks, resolveTemplateWithLocaleCache} from './document-links.js';
import {registerFormatting} from './formatting.js';
import {collectIsmlFoldingRanges} from './folding.js';
import {findIsmlHoverInfo} from './hover.js';
import {findIsmlLinkedEditingTagNameMatch, findIsmlTagNameMatch} from './matching.js';
import {
  detectSemanticCompletionContext,
  clearIsmlSemanticCaches,
  findIsmlDefinitionTarget,
  findIsmlReferenceRanges,
  getSemanticCompletionEntries,
} from './semantic.js';
import {TAG_SNIPPETS, detectCompletionContext} from './snippets.js';
import {collectIsmlSymbols, type IsmlSymbol} from './symbols.js';
import {registerTagHighlighting} from './tag-highlight.js';
import {scanIsmlTags} from './tags.js';

export interface AutoCloseResult {
  tagName: string;
}

function registerSemanticCompletions(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  const provider: vscode.CompletionItemProvider = {
    provideCompletionItems(document, position) {
      if (document.languageId !== 'isml') return undefined;

      const offset = document.offsetAt(position);
      const semanticWindowStart = Math.max(0, offset - 4000);
      const semanticPrefix = document.getText(new vscode.Range(document.positionAt(semanticWindowStart), position));
      const semantic = detectSemanticCompletionContext(semanticPrefix);
      if (!semantic) return undefined;

      const replaceStart = document.positionAt(semanticWindowStart + semantic.startOffset);
      const range = new vscode.Range(replaceStart, position);

      return getSemanticCompletionEntries(semantic, cartridgeService.getCartridgeRoots(), document.uri.fsPath).map(
        (entry) => {
          const item = new vscode.CompletionItem(entry.label, vscode.CompletionItemKind.Method);
          item.insertText = entry.insertText;
          item.detail = entry.detail;
          item.range = range;
          item.sortText = `0_${entry.label}`;
          return item;
        },
      );
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      {language: 'isml'},
      provider,
      '.',
      'm',
      'u',
      'r',
      '/',
      '~',
      '*',
      '"',
      "'",
      ',',
    ),
  );

  const semanticFileWatcher = vscode.workspace.createFileSystemWatcher('**/cartridge/**/*.{js,ts}');
  const clearCaches = () => clearIsmlSemanticCaches();
  context.subscriptions.push(
    semanticFileWatcher,
    semanticFileWatcher.onDidCreate(clearCaches),
    semanticFileWatcher.onDidChange(clearCaches),
    semanticFileWatcher.onDidDelete(clearCaches),
  );
}

function registerCodeActions(context: vscode.ExtensionContext): void {
  const provider: vscode.CodeActionProvider = {
    provideCodeActions(document, _range, codeActionContext) {
      if (document.languageId !== 'isml') return [];

      const text = document.getText();
      const actions: vscode.CodeAction[] = [];

      for (const diagnostic of codeActionContext.diagnostics) {
        if (diagnostic.source !== 'b2c-dx-isml') continue;
        // Our diagnostics always carry a string rule code (see registerDiagnostics).
        if (typeof diagnostic.code !== 'string') continue;

        const quickFixes = getIsmlQuickFixes(text, {
          code: diagnostic.code as IsmlDiagnosticCode,
          message: diagnostic.message,
          startOffset: document.offsetAt(diagnostic.range.start),
          endOffset: document.offsetAt(diagnostic.range.end),
          severity:
            diagnostic.severity === vscode.DiagnosticSeverity.Warning
              ? 'warning'
              : diagnostic.severity === vscode.DiagnosticSeverity.Information
                ? 'info'
                : 'error',
        });

        for (const quickFix of quickFixes) {
          const action = new vscode.CodeAction(quickFix.title, vscode.CodeActionKind.QuickFix);
          const edit = new vscode.WorkspaceEdit();
          for (const quickEdit of quickFix.edits) {
            edit.replace(
              document.uri,
              new vscode.Range(document.positionAt(quickEdit.startOffset), document.positionAt(quickEdit.endOffset)),
              quickEdit.newText,
            );
          }
          action.edit = edit;
          action.diagnostics = [diagnostic];
          action.isPreferred = true;
          actions.push(action);
        }
      }

      return actions;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider({language: 'isml'}, provider, {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }),
  );
}

/**
 * Decide whether typing `>` after the given line content should auto-insert a closing tag.
 * `linePrefixIncludingBracket` must include the just-typed `>` as its final character.
 */
export function detectAutoCloseTag(linePrefixIncludingBracket: string): AutoCloseResult | null {
  if (!linePrefixIncludingBracket.endsWith('>')) return null;

  const beforeBracket = linePrefixIncludingBracket.slice(0, -1);
  const lastOpen = beforeBracket.lastIndexOf('<');
  if (lastOpen < 0) return null;

  const tagBody = beforeBracket.slice(lastOpen + 1);
  if (!tagBody || tagBody.startsWith('/')) return null;

  const first = tagBody.match(/^\s*(is[a-zA-Z][\w-]*)\b/);
  if (!first) return null;

  const tagName = first[1];
  const rest = tagBody.slice(first[0].length);

  let quote: '"' | "'" | null = null;
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '<' || ch === '>') {
      return null;
    }
  }
  if (quote) return null;

  if (/\/\s*$/.test(rest)) return null;
  if (VOID_TAGS.has(tagName.toLowerCase())) return null;
  return {tagName};
}

function isInsideAutoCloseExcludedTag(text: string, offset: number): boolean {
  const stack: string[] = [];
  const EXCLUDED = new Set(['isscript', 'iscomment']);

  for (const token of scanIsmlTags(text)) {
    if (token.startOffset >= offset) break;

    if (token.isClosing) {
      const current = stack[stack.length - 1];
      if (current === token.name) {
        stack.pop();
      }
      continue;
    }

    if (token.isSelfClosing || VOID_TAGS.has(token.name)) continue;
    if (!EXCLUDED.has(token.name)) continue;
    stack.push(token.name);
  }

  return stack.length > 0;
}

function registerAutoCloseTag(context: vscode.ExtensionContext): void {
  const disposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
    if (event.document.languageId !== 'isml') return;
    if (event.contentChanges.length !== 1) return;

    const change = event.contentChanges[0];
    if (change.text !== '>') return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    const insertedAt = change.range.start;
    const positionAfterBracket = insertedAt.translate(0, 1);

    const linePrefix = event.document.getText(
      new vscode.Range(new vscode.Position(insertedAt.line, 0), positionAfterBracket),
    );

    const insertedOffset = event.document.offsetAt(positionAfterBracket);
    if (isInsideAutoCloseExcludedTag(event.document.getText(), insertedOffset)) return;

    const result = detectAutoCloseTag(linePrefix);
    if (!result) return;

    const closing = `</${result.tagName}>`;

    const ok = await editor.edit(
      (edit) => {
        edit.insert(positionAfterBracket, closing);
      },
      {undoStopBefore: false, undoStopAfter: false},
    );

    if (ok) {
      const cursor = positionAfterBracket;
      editor.selection = new vscode.Selection(cursor, cursor);
    }
  });

  context.subscriptions.push(disposable);
}

function registerTagCompletions(context: vscode.ExtensionContext): void {
  const provider: vscode.CompletionItemProvider = {
    provideCompletionItems(document, position) {
      if (document.languageId !== 'isml') return undefined;

      const linePrefix = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
      const ctx = detectCompletionContext(linePrefix);
      if (!ctx) return undefined;

      const typedPartial = ctx.partial.replace(/^</, '').toLowerCase();

      const replaceStart = new vscode.Position(position.line, ctx.startOffset);
      const range = new vscode.Range(replaceStart, position);

      return TAG_SNIPPETS.filter((snippet) => snippet.prefix.toLowerCase().startsWith(typedPartial)).map((snippet) => {
        const item = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
        const body = snippet.body.join('\n');
        item.insertText = new vscode.SnippetString(body);
        item.detail = snippet.description;
        item.documentation = new vscode.MarkdownString().appendCodeblock(body, 'isml');
        item.range = range;
        item.filterText = ctx.hasLeadingBracket ? `<${snippet.prefix}` : snippet.prefix;
        item.sortText = snippet.prefix;
        return item;
      });
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider({language: 'isml'}, provider, '<', 'i', 's'),
  );
}

function registerDocumentLinks(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  const provider: vscode.DocumentLinkProvider = {
    provideDocumentLinks(document) {
      if (document.languageId !== 'isml') return [];
      const text = document.getText();
      const cartridgeRoots = cartridgeService.getCartridgeRoots();
      const localeCache = new Map<string, string[]>();
      const links: vscode.DocumentLink[] = [];

      for (const link of findTemplateLinks(text)) {
        const range = new vscode.Range(document.positionAt(link.startOffset), document.positionAt(link.endOffset));
        const resolved = resolveTemplateWithLocaleCache(link.template, cartridgeRoots, localeCache);
        if (resolved) {
          const docLink = new vscode.DocumentLink(range, vscode.Uri.file(resolved));
          docLink.tooltip = `Open ${link.template}`;
          links.push(docLink);
        } else if (cartridgeRoots.length > 0) {
          const args = encodeURIComponent(JSON.stringify([link.template]));
          const docLink = new vscode.DocumentLink(
            range,
            vscode.Uri.parse(`command:b2c-dx.isml.createTemplate?${args}`),
          );
          docLink.tooltip = `Template "${link.template}" not found in any cartridge — click to create it`;
          links.push(docLink);
        }
      }

      return links;
    },
  };

  context.subscriptions.push(vscode.languages.registerDocumentLinkProvider({language: 'isml'}, provider));

  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.isml.createTemplate', async (template: string) => {
      // This command is contributed to the palette, so it can be invoked with no
      // argument. Reject a non-string template before prompting, otherwise the
      // cartridge QuickPick would render "Create "undefined.isml" in which...".
      if (typeof template !== 'string' || template.trim().length === 0) {
        await vscode.window.showErrorMessage(
          'This command opens an ISML template from a link and cannot be run directly.',
        );
        return;
      }

      const cartridges = cartridgeService.getCartridges();
      if (cartridges.length === 0) {
        await vscode.window.showWarningMessage('No cartridges found in this workspace.');
        return;
      }

      const picked =
        cartridges.length === 1
          ? cartridges[0]
          : await vscode.window.showQuickPick(
              cartridges.map((c) => ({label: c.name, description: c.src, cartridge: c})),
              {placeHolder: `Create "${template}.isml" in which cartridge?`},
            );
      if (!picked) return;
      const chosen = 'cartridge' in picked ? picked.cartridge : picked;

      const normalizedTemplate = template.trim().replace(/\\/g, '/').replace(/^\/+/, '');
      const isInvalidSegment = normalizedTemplate
        .split('/')
        .some((segment) => segment === '..' || segment.length === 0);
      if (!normalizedTemplate || path.isAbsolute(normalizedTemplate) || isInvalidSegment) {
        await vscode.window.showErrorMessage(`Invalid template path: ${template}`);
        return;
      }

      const withExt = normalizedTemplate.endsWith('.isml') ? normalizedTemplate : `${normalizedTemplate}.isml`;
      const targetPath = vscode.Uri.file(
        path.join(chosen.src, 'cartridge', 'templates', 'default', ...withExt.split('/')),
      );

      try {
        await vscode.workspace.fs.stat(targetPath);
        // exists — just open it
      } catch {
        const dirUri = vscode.Uri.file(path.dirname(targetPath.fsPath));
        await vscode.workspace.fs.createDirectory(dirUri);
        const stub = new TextEncoder().encode(`<iscomment>\n    ${normalizedTemplate}\n</iscomment>\n`);
        await vscode.workspace.fs.writeFile(targetPath, stub);
      }
      const doc = await vscode.workspace.openTextDocument(targetPath);
      await vscode.window.showTextDocument(doc);
    }),
  );
}

function registerHover(context: vscode.ExtensionContext): void {
  const provider: vscode.HoverProvider = {
    provideHover(document, position) {
      if (document.languageId !== 'isml') return undefined;
      const offset = document.offsetAt(position);
      const info = findIsmlHoverInfo(document.getText(), offset);
      if (!info) return undefined;
      const tagVariant = info.isClosing ? 'Closing tag' : info.isSelfClosing ? 'Self-closing tag' : 'Opening tag';
      const parts = [
        `**<${info.tagName}>**`,
        `${tagVariant}`,
        '',
        info.summary,
        '',
        '**Syntax**',
        '```isml',
        info.syntax,
        '```',
      ];

      if (info.attributes.length > 0) {
        parts.push('', `**Common attributes**: ${info.attributes.map((attr) => `\`${attr}\``).join(', ')}`);
      }

      if (info.tips.length > 0) {
        parts.push('', '**Tips**');
        for (const tip of info.tips) {
          parts.push(`- ${tip}`);
        }
      }

      const contents = new vscode.MarkdownString(parts.join('\n'));
      return new vscode.Hover(contents);
    },
  };

  context.subscriptions.push(vscode.languages.registerHoverProvider({language: 'isml'}, provider));
}

function toVscodeSeverity(severity: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
  if (severity === 'warning') return vscode.DiagnosticSeverity.Warning;
  if (severity === 'info') return vscode.DiagnosticSeverity.Information;
  return vscode.DiagnosticSeverity.Error;
}

// Delay before re-linting after a keystroke. collectIsmlDiagnostics does a full
// O(n) document scan, so re-running it on every content change is wasteful on
// large templates; coalesce bursts of edits into one pass.
const DIAGNOSTICS_DEBOUNCE_MS = 250;

function registerDiagnostics(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection('isml');
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const update = (document: vscode.TextDocument) => {
    if (document.languageId !== 'isml') {
      collection.delete(document.uri);
      return;
    }

    // Rules the user turned off (defaults to DEFAULT_DISABLED_RULES, e.g.
    // encoding-off). Global counterpart to inline `b2c-dx-disable-*` comments.
    const disabledRules = new Set(
      vscode.workspace
        .getConfiguration('b2c-dx.isml.diagnostics')
        .get<string[]>('disabledRules', [...DEFAULT_DISABLED_RULES]),
    );

    const diagnostics = collectIsmlDiagnostics(document.getText())
      .filter((entry) => !disabledRules.has(entry.code))
      .map((entry) => {
        const range = new vscode.Range(document.positionAt(entry.startOffset), document.positionAt(entry.endOffset));
        const diagnostic = new vscode.Diagnostic(range, entry.message, toVscodeSeverity(entry.severity));
        diagnostic.source = 'b2c-dx-isml';
        // The code (with the docs-less string form) is what the Problems panel
        // shows and what quick-fixes / suppression directives key off.
        diagnostic.code = entry.code;
        return diagnostic;
      });

    collection.set(document.uri, diagnostics);
  };

  const clearTimer = (key: string) => {
    const timer = debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(key);
    }
  };

  const scheduleUpdate = (document: vscode.TextDocument) => {
    const key = document.uri.toString();
    clearTimer(key);
    debounceTimers.set(
      key,
      setTimeout(() => {
        debounceTimers.delete(key);
        update(document);
      }, DIAGNOSTICS_DEBOUNCE_MS),
    );
  };

  for (const document of vscode.workspace.textDocuments) {
    update(document);
  }

  context.subscriptions.push(
    collection,
    // Open/initial: lint immediately. Edits: debounce.
    vscode.workspace.onDidOpenTextDocument(update),
    vscode.workspace.onDidChangeTextDocument((event) => scheduleUpdate(event.document)),
    vscode.workspace.onDidCloseTextDocument((document) => {
      clearTimer(document.uri.toString());
      collection.delete(document.uri);
    }),
    {dispose: () => debounceTimers.forEach((timer) => clearTimeout(timer))},
  );
}

function createDocumentSymbol(document: vscode.TextDocument, symbol: IsmlSymbol): vscode.DocumentSymbol {
  const range = new vscode.Range(document.positionAt(symbol.startOffset), document.positionAt(symbol.endOffset));
  const selectionRange = new vscode.Range(
    document.positionAt(symbol.selectionStartOffset),
    document.positionAt(symbol.selectionEndOffset),
  );
  const documentSymbol = new vscode.DocumentSymbol(
    symbol.name,
    'ISML tag',
    vscode.SymbolKind.Namespace,
    range,
    selectionRange,
  );
  documentSymbol.children = symbol.children.map((child) => createDocumentSymbol(document, child));
  return documentSymbol;
}

function registerDocumentSymbols(context: vscode.ExtensionContext): void {
  const provider: vscode.DocumentSymbolProvider = {
    provideDocumentSymbols(document) {
      if (document.languageId !== 'isml') return [];
      return collectIsmlSymbols(document.getText()).map((symbol) => createDocumentSymbol(document, symbol));
    },
  };

  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({language: 'isml'}, provider));
}

function registerFoldingRanges(context: vscode.ExtensionContext): void {
  const provider: vscode.FoldingRangeProvider = {
    provideFoldingRanges(document) {
      if (document.languageId !== 'isml') return [];

      return collectIsmlFoldingRanges(document.getText())
        .map((range) => {
          const start = document.positionAt(range.startOffset);
          const end = document.positionAt(range.endOffset);

          if (end.line <= start.line) return undefined;
          return new vscode.FoldingRange(start.line, end.line, vscode.FoldingRangeKind.Region);
        })
        .filter((range): range is vscode.FoldingRange => Boolean(range));
    },
  };

  context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({language: 'isml'}, provider));
}

function toNameRange(document: vscode.TextDocument, startOffset: number, endOffset: number): vscode.Range {
  return new vscode.Range(document.positionAt(startOffset), document.positionAt(endOffset));
}

function registerTagHighlights(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  const provider: vscode.DocumentHighlightProvider = {
    provideDocumentHighlights(document, position) {
      if (document.languageId !== 'isml') return [];
      const text = document.getText();
      const offset = document.offsetAt(position);
      const match = findIsmlTagNameMatch(text, offset);
      if (match) {
        const tagHighlights = [
          new vscode.DocumentHighlight(
            toNameRange(document, match.openingNameStartOffset, match.openingNameEndOffset),
            vscode.DocumentHighlightKind.Text,
          ),
          new vscode.DocumentHighlight(
            toNameRange(document, match.closingNameStartOffset, match.closingNameEndOffset),
            vscode.DocumentHighlightKind.Text,
          ),
        ];
        if (tagHighlights.length > 0) return tagHighlights;
      }

      const semanticRanges = findIsmlReferenceRanges(
        text,
        offset,
        cartridgeService.getCartridgeRoots(),
        document.uri.fsPath,
      );
      return semanticRanges.map(
        (range) =>
          new vscode.DocumentHighlight(
            new vscode.Range(document.positionAt(range.startOffset), document.positionAt(range.endOffset)),
            vscode.DocumentHighlightKind.Read,
          ),
      );
    },
  };

  context.subscriptions.push(vscode.languages.registerDocumentHighlightProvider({language: 'isml'}, provider));
}

function registerLinkedEditing(context: vscode.ExtensionContext): void {
  const provider: vscode.LinkedEditingRangeProvider = {
    provideLinkedEditingRanges(document, position) {
      if (document.languageId !== 'isml') return undefined;
      const match = findIsmlLinkedEditingTagNameMatch(document.getText(), document.offsetAt(position));
      if (!match) return undefined;

      return new vscode.LinkedEditingRanges([
        toNameRange(document, match.openingNameStartOffset, match.openingNameEndOffset),
        toNameRange(document, match.closingNameStartOffset, match.closingNameEndOffset),
      ]);
    },
  };

  context.subscriptions.push(vscode.languages.registerLinkedEditingRangeProvider({language: 'isml'}, provider));
}

function registerDefinitions(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  const provider: vscode.DefinitionProvider = {
    provideDefinition(document, position) {
      if (document.languageId !== 'isml') return undefined;
      const target = findIsmlDefinitionTarget(
        document.getText(),
        document.offsetAt(position),
        cartridgeService.getCartridgeRoots(),
        document.uri.fsPath,
      );
      if (!target) return undefined;
      return new vscode.Location(vscode.Uri.file(target.targetPath), new vscode.Position(0, 0));
    },
  };

  context.subscriptions.push(vscode.languages.registerDefinitionProvider({language: 'isml'}, provider));
}

function registerReferences(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  const provider: vscode.ReferenceProvider = {
    provideReferences(document, position) {
      if (document.languageId !== 'isml') return [];
      const ranges = findIsmlReferenceRanges(
        document.getText(),
        document.offsetAt(position),
        cartridgeService.getCartridgeRoots(),
        document.uri.fsPath,
      );

      return ranges.map(
        (range) =>
          new vscode.Location(
            document.uri,
            new vscode.Range(document.positionAt(range.startOffset), document.positionAt(range.endOffset)),
          ),
      );
    },
  };

  context.subscriptions.push(vscode.languages.registerReferenceProvider({language: 'isml'}, provider));
}

function registerReferencePickerCommand(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.isml.showReferences', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'isml') {
        await vscode.window.showInformationMessage('Open an ISML file and place the cursor on a reference path.');
        return;
      }

      const document = editor.document;
      const text = document.getText();
      const offset = document.offsetAt(editor.selection.active);
      const ranges = findIsmlReferenceRanges(text, offset, cartridgeService.getCartridgeRoots(), document.uri.fsPath);

      if (ranges.length === 0) {
        await vscode.window.showInformationMessage('No related ISML references found at cursor.');
        return;
      }

      const items = ranges.map((range) => {
        const start = document.positionAt(range.startOffset);
        const end = document.positionAt(range.endOffset);
        const lineText = document.lineAt(start.line).text.trim();
        const isCurrent = offset >= range.startOffset && offset <= range.endOffset;
        return {
          label: `${isCurrent ? 'Current' : 'Reference'} • Line ${start.line + 1}`,
          description: `Col ${start.character + 1}`,
          detail: lineText,
          range: new vscode.Range(start, end),
        };
      });

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `ISML references (${items.length})`,
        matchOnDescription: true,
        matchOnDetail: true,
      });
      if (!picked) return;

      editor.selection = new vscode.Selection(picked.range.start, picked.range.end);
      editor.revealRange(picked.range, vscode.TextEditorRevealType.InCenter);
    }),
  );
}

export function registerIsml(context: vscode.ExtensionContext, cartridgeService: CartridgeService): void {
  registerAutoCloseTag(context);
  registerTagCompletions(context);
  registerSemanticCompletions(context, cartridgeService);
  registerDocumentLinks(context, cartridgeService);
  registerHover(context);
  registerDiagnostics(context);
  registerCodeActions(context);
  registerDocumentSymbols(context);
  registerFoldingRanges(context);
  registerTagHighlights(context, cartridgeService);
  registerLinkedEditing(context);
  registerDefinitions(context, cartridgeService);
  registerReferences(context, cartridgeService);
  registerReferencePickerCommand(context, cartridgeService);
  registerFormatting(context);
  registerTagHighlighting(context);
}
