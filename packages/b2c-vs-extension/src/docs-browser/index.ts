/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import {registerSafeCommand} from '../safety.js';
import {DocsIndexLoader} from './docs-index.js';
import {DocsRecents} from './docs-recents.js';
import {searchDocs} from './docs-search.js';
import {DocsTreeProvider} from './docs-tree-provider.js';
import {DocsWebviewManager} from './docs-webview.js';
import {
  deriveScriptApiQualifiedName,
  extractIdentifierAtOffset,
  extractScriptApiQualifiedName,
} from './symbol-resolver.js';

/**
 * Phase 5 surface:
 *   - Sidebar tree: `b2cDocsBrowser`.
 *   - Webview panel for entry detail.
 *   - Commands:
 *       - `b2c-dx.docs.search`         Quick-pick search across the index.
 *       - `b2c-dx.docs.open`           Invoked by tree clicks and the quick-pick picker.
 *       - `b2c-dx.docs.refresh`        Re-reads the bundled index from disk.
 *       - `b2c-dx.docs.viewSymbolDocs` Right-click in editor → resolve symbol/tag → open docs.
 */
export function registerDocsBrowser(context: vscode.ExtensionContext, log: vscode.OutputChannel): void {
  const loader = new DocsIndexLoader(context, log);
  context.subscriptions.push(loader);

  const tree = new DocsTreeProvider(loader);
  const treeView = vscode.window.createTreeView('b2cDocsBrowser', {
    treeDataProvider: tree,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  const recents = new DocsRecents(context.globalState);
  const webviewManager = new DocsWebviewManager(context, loader, log, recents);
  context.subscriptions.push(webviewManager);

  context.subscriptions.push(
    registerSafeCommand('b2c-dx.docs.refresh', () => {
      loader.reload();
    }),

    registerSafeCommand('b2c-dx.docs.search', async (initial?: string) => {
      await runSearch(loader, webviewManager, recents, typeof initial === 'string' ? initial : '');
    }),

    registerSafeCommand('b2c-dx.docs.open', async (id?: string) => {
      if (typeof id !== 'string' || id.length === 0) {
        await vscode.window.showWarningMessage('B2C DX Docs: missing entry id.');
        return;
      }
      if (!loader.getSearchEntryById(id)) {
        await vscode.window.showWarningMessage(`B2C DX Docs: entry not found (${id}).`);
        return;
      }
      await webviewManager.showEntry(id);
    }),

    registerSafeCommand('b2c-dx.docs.viewSymbolDocs', async () => {
      await runViewSymbolDocs(loader, webviewManager, recents, log);
    }),
  );
}

/**
 * Right-click handler for JavaScript/TypeScript editors. Resolves the symbol
 * under the cursor to a Script API entry and opens the docs panel at that
 * entry. If nothing resolves, opens the search quick-pick prefilled with the
 * best candidate string so the user has a one-keystroke recovery path.
 *
 * ISML editor support is intentionally not registered while the index is
 * Script-API-only; revisit when ISML data is sourced from the official ISML
 * grammar (see follow-up work).
 */
async function runViewSymbolDocs(
  loader: DocsIndexLoader,
  webviewManager: DocsWebviewManager,
  recents: DocsRecents,
  log: vscode.OutputChannel,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showInformationMessage('B2C DX Docs: open a JavaScript or TypeScript file to look up docs.');
    return;
  }

  const document = editor.document;
  const position = editor.selection.active;
  const offset = document.offsetAt(position);

  // JS/TS path. Resolve in order of reliability:
  //
  //   1. Go-to-Definition  → `b2c-script-types` ships one declaration per
  //      file, so the definition file path uniquely identifies the class.
  //      Combined with the bare identifier under the cursor, this maps
  //      cleanly to a single entry.
  //
  //   2. Hover scan        → fallback when the symbol has no Go-to-Definition
  //      target (e.g. cartridge-local types). Less reliable because a JSDoc
  //      body may mention unrelated `dw.*` symbols.
  //
  //   3. Bare identifier   → final fallback, opens the search picker so the
  //      user can pick the right entry themselves.
  const word = extractIdentifierAtOffset(document.getText(), offset);
  let qualified: string | undefined;

  try {
    const definitions =
      (await vscode.commands.executeCommand<Array<vscode.Location | vscode.LocationLink>>(
        'vscode.executeDefinitionProvider',
        document.uri,
        position,
      )) ?? [];
    for (const def of definitions) {
      const targetUri = 'targetUri' in def ? def.targetUri : def.uri;
      const candidate = deriveScriptApiQualifiedName(targetUri.fsPath, word);
      if (candidate) {
        qualified = candidate;
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.appendLine(`B2C DX docs: definition lookup failed: ${message}`);
  }

  if (qualified) {
    const entry = loader.findEntryByQualifiedName(qualified);
    if (entry) {
      await webviewManager.showEntry(entry.id);
      return;
    }
  }

  // Hover-scan fallback.
  if (!qualified) {
    try {
      const hovers =
        (await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', document.uri, position)) ??
        [];
      const text = collectHoverText(hovers);
      qualified = extractScriptApiQualifiedName(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.appendLine(`B2C DX docs: hover lookup failed: ${message}`);
    }
    if (qualified) {
      const entry = loader.findEntryByQualifiedName(qualified);
      if (entry) {
        await webviewManager.showEntry(entry.id);
        return;
      }
    }
  }

  // Nothing resolved — explain why and offer search as the recovery path.
  await reportUnresolved({
    loader,
    webviewManager,
    recents,
    cursorWord: word,
    qualified,
  });
}

/**
 * Show a one-click info toast when the cursor doesn't resolve to a Script
 * API entry. The message tries to be specific:
 *
 *   - No identifier under cursor   → "Place the cursor on a symbol …"
 *   - Identifier is not in dw.*    → "<word> is not in the B2C Script API."
 *   - dw.* qualifier but no match  → "<dw.foo.Bar> isn't in this docs index." (rare; stale index)
 *
 * Either path offers a "Search Docs" button that opens the picker prefilled
 * with the best candidate so the user gets one-keystroke recovery.
 */
async function reportUnresolved(args: {
  loader: DocsIndexLoader;
  webviewManager: DocsWebviewManager;
  recents: DocsRecents;
  cursorWord: string | undefined;
  qualified: string | undefined;
}): Promise<void> {
  const {loader, webviewManager, recents, cursorWord, qualified} = args;

  let message: string;
  if (qualified) {
    message = `B2C Docs: ${qualified} is not in this docs index.`;
  } else if (cursorWord) {
    message = `B2C Docs: ${cursorWord} is not in the B2C Script API.`;
  } else {
    message = 'B2C Docs: place the cursor on a symbol to look up docs.';
  }

  const initialQuery = qualified ?? cursorWord ?? '';
  const actions: string[] = [];
  if (initialQuery) actions.push('Search Docs');
  actions.push('Dismiss');

  const choice = await vscode.window.showInformationMessage(message, ...actions);
  if (choice === 'Search Docs') {
    await runSearch(loader, webviewManager, recents, initialQuery);
  }
}

function collectHoverText(hovers: vscode.Hover[]): string {
  const parts: string[] = [];
  for (const hover of hovers) {
    for (const content of hover.contents) {
      if (typeof content === 'string') {
        parts.push(content);
      } else if (content instanceof vscode.MarkdownString) {
        parts.push(content.value);
      } else {
        // MarkedString shape: {language, value}
        const value = (content as {value?: unknown}).value;
        if (typeof value === 'string') parts.push(value);
      }
    }
  }
  return parts.join('\n');
}

async function runSearch(
  loader: DocsIndexLoader,
  webviewManager: DocsWebviewManager,
  recents: DocsRecents,
  initialQuery: string,
): Promise<void> {
  const manifest = loader.getManifest();
  if (!manifest) {
    const error = loader.getManifestError() ?? 'Docs index unavailable.';
    await vscode.window.showWarningMessage(`B2C DX Docs: ${error}`);
    return;
  }

  const entries = loader.getSearchEntries();
  if (entries.length === 0) {
    await vscode.window.showInformationMessage('B2C DX Docs: index is empty.');
    return;
  }

  const quickPick = vscode.window.createQuickPick<DocsQuickPickItem>();
  quickPick.title = `B2C DX Docs · Script API v${manifest.scriptApiVersion}`;
  quickPick.placeholder = 'Search Script API classes, methods, properties…';
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  const recentItems = (): DocsQuickPickItem[] => {
    const recentIds = recents.list();
    if (recentIds.length === 0) return [];
    const items: DocsQuickPickItem[] = [];
    for (const id of recentIds) {
      const entry = loader.getSearchEntryById(id);
      if (!entry) continue;
      items.push({
        label: `$(history) ${entry.title}`,
        description: entry.qualifiedName,
        detail: `Recent · ${entry.kind}`,
        entryId: entry.id,
      });
    }
    return items;
  };

  const renderResults = (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      quickPick.items = recentItems();
      return;
    }
    const hits = searchDocs(entries, trimmed, {limit: 50});
    quickPick.items = hits.map((hit) => ({
      label: hit.entry.title,
      description: hit.entry.qualifiedName,
      detail: hit.entry.kind,
      entryId: hit.entry.id,
    }));
  };

  if (initialQuery) {
    quickPick.value = initialQuery;
    renderResults(initialQuery);
  } else {
    quickPick.items = recentItems();
  }

  quickPick.onDidChangeValue(renderResults);
  quickPick.onDidAccept(() => {
    const picked = quickPick.activeItems[0];
    quickPick.hide();
    if (picked) {
      void webviewManager.showEntry(picked.entryId);
    }
  });
  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}

interface DocsQuickPickItem extends vscode.QuickPickItem {
  entryId: string;
}
