/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * ISML document formatting.
 *
 * ISML is HTML-with-extra-tags, so we let VS Code's HTML formatter engine
 * (`vscode-html-languageservice`'s public `getLanguageService().format()`) own
 * HTML/attribute reflow, then run our own ISML-aware passes on top for the parts
 * the HTML engine cannot know about. Import ONLY from the package root — do NOT
 * deep-import `vscode-html-languageservice/lib/esm/...` (extensionless internal
 * imports crash under native Node ESM).
 *
 * All ISML-tag rewriting is driven by `scanIsmlTags` (our ISML tokenizer), never
 * by context-free regex. This matters for correctness: a regex cannot tell a real
 * `<iselse>` from the text `"</iselse>"` inside an `<isscript>` string literal, an
 * attribute value, or an `<iscomment>` — and would silently corrupt those. The
 * tokenizer already skips string/comment/raw-content regions, so gating every
 * edit on a real token is what makes the formatter safe.
 *
 * ISML-specific handling:
 *  - `<isscript>` bodies and `${...}` expressions are left verbatim (isscript via
 *    contentUnformatted; `${}` is never touched).
 *  - Void ISML tags are normalized `<x />` → `<x/>` (token-gated).
 *  - `<iselse>` / `<iselseif>` are control-flow DIVIDERS inside `<isif>` (like an
 *    `else`), not containers. The HTML formatter mis-indents them; we recompute
 *    their indentation from the ISML token nesting so they align with their
 *    parent `<isif>` and their following body indents one level in.
 */
import {getLanguageService} from 'vscode-html-languageservice';
import type {HTMLFormatConfiguration} from 'vscode-html-languageservice';
import {TextDocument as LspTextDocument} from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode';

import {VOID_TAGS} from './constants.js';
import {scanIsmlTags, type IsmlTagToken} from './tags.js';

// Tags whose bodies must never be reformatted (dw-script / preformatted text).
const CONTENT_UNFORMATTED = ['isscript', 'pre'];

// Control-flow dividers: rendered at their parent <isif>'s indent, with the body
// that follows indented one level in — but they do NOT open/close a block.
const CONTROL_DIVIDERS = new Set(['iselse', 'iselseif']);

// Raw-content blocks: their closing tag is stranded by content_unformatted (the
// beautifier preserves the body — including the closer's leading whitespace —
// verbatim), so we realign the closer to its opener. Mirrors CONTENT_UNFORMATTED.
const RAW_CONTENT_CLOSERS = new Set(['isscript']);

const htmlLanguageService = getLanguageService();

/**
 * Convert VS Code formatting options + config into the language-service's
 * HTMLFormatConfiguration.
 */
function buildFormatConfig(options: vscode.FormattingOptions): HTMLFormatConfiguration {
  const config = vscode.workspace.getConfiguration('b2c-dx.isml.format');
  return {
    tabSize: options.tabSize,
    insertSpaces: options.insertSpaces,
    // Sensible ISML defaults, overridable via settings.
    wrapLineLength: config.get<number>('wrapLineLength', 120),
    wrapAttributes: config.get<HTMLFormatConfiguration['wrapAttributes']>('wrapAttributes', 'auto'),
    contentUnformatted: CONTENT_UNFORMATTED.join(','),
    preserveNewLines: config.get<boolean>('preserveNewLines', true),
    indentInnerHtml: config.get<boolean>('indentInnerHtml', false),
  };
}

/**
 * Normalize void ISML tags from `<isxxx ... />` to `<isxxx.../>` (drop the space
 * before the self-close) to match B2C convention. Token-gated: only rewrites
 * real void-ISML tag tokens, so it never touches a `<x />`-looking substring
 * inside a string/attribute/comment. Applies edits right-to-left to keep offsets
 * stable.
 *
 * Exported for unit testing.
 */
export function normalizeVoidTagSpacing(text: string): string {
  const edits: Array<{start: number; end: number; replacement: string}> = [];
  for (const token of scanIsmlTags(text)) {
    if (token.isClosing || !token.isSelfClosing) continue;
    if (!VOID_TAGS.has(token.name)) continue;
    const raw = text.slice(token.startOffset, token.endOffset);
    // Collapse whitespace immediately before the closing `/>`.
    const fixed = raw.replace(/\s+\/>$/, '/>');
    if (fixed !== raw) {
      edits.push({start: token.startOffset, end: token.endOffset, replacement: fixed});
    }
  }
  let out = text;
  for (const edit of edits.reverse()) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return out;
}

/**
 * Prepare ISML for the HTML formatter, token-gated so it only rewrites real ISML
 * tags (never string/attribute/comment substrings):
 *  - Drop stray `</iselse>` / `</iselseif>` close tags (invalid ISML, seen in the
 *    wild) — otherwise the HTML parser treats them as real containers.
 *  - Force a bare void-ISML open tag (`<iselse>`, `<isprint ...>`, …) to
 *    self-closing so the HTML parser does not treat it as a block opener.
 *
 * Offset-shifting → only safe for a full-document format (we replace the whole
 * document), never for a range format.
 */
function preNormalizeControlTags(text: string): string {
  const edits: Array<{start: number; end: number; replacement: string}> = [];
  for (const token of scanIsmlTags(text)) {
    const raw = text.slice(token.startOffset, token.endOffset);
    if (token.isClosing) {
      if (CONTROL_DIVIDERS.has(token.name)) {
        // Drop the stray close tag plus surrounding blank space on its line so no
        // empty line is left behind.
        let start = token.startOffset;
        let end = token.endOffset;
        while (start > 0 && (text[start - 1] === ' ' || text[start - 1] === '\t')) start--;
        while (end < text.length && (text[end] === ' ' || text[end] === '\t')) end++;
        if (text[end] === '\r') end++;
        if (text[end] === '\n') end++;
        edits.push({start, end, replacement: ''});
      }
      continue;
    }
    if (!token.isSelfClosing && VOID_TAGS.has(token.name)) {
      const fixed = raw.replace(/\s*>$/, '/>');
      edits.push({start: token.startOffset, end: token.endOffset, replacement: fixed});
    }
  }
  let out = text;
  for (const edit of edits.reverse()) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return out;
}

/**
 * Fix the indentation of ISML tags the HTML formatter can't place correctly,
 * driven by the ISML token nesting (same push/pop walk used by folding/symbols),
 * rewriting only each affected tag line's leading whitespace:
 *
 *  - `<iselse>` / `<iselseif>` dividers → aligned to their enclosing `<isif>`
 *    (they read like an `else`; the formatter leaves them one level too deep).
 *  - Closing tags of raw-content blocks (`</isscript>`, `</iscomment>`) → aligned
 *    to their opener. Because the body is `content_unformatted`, the beautifier
 *    treats the closer's leading whitespace as preserved content and strands it
 *    at the original column (often 0). The body itself stays verbatim.
 *
 * Both are whitespace-only, token-anchored edits — never touching tag internals,
 * string/attribute/comment content, or the (verbatim) script body.
 */
function reindentIsmlTags(text: string): string {
  const lineStarts = buildLineStarts(text);
  const indentColumnAt = (offset: number): string => {
    const lineStart = lineStarts[lineOfOffset(lineStarts, offset)];
    const lineIndentMatch = /^[ \t]*/.exec(text.slice(lineStart));
    return lineIndentMatch ? lineIndentMatch[0] : '';
  };
  /** True when `offset` is the first non-whitespace on its line (safe to reindent). */
  const startsLine = (offset: number): boolean => {
    const lineStart = lineStarts[lineOfOffset(lineStarts, offset)];
    return /^[ \t]*$/.test(text.slice(lineStart, offset));
  };

  const stack: IsmlTagToken[] = [];
  // token startOffset -> target indent string.
  const targetIndent = new Map<number, string>();

  for (const token of scanIsmlTags(text)) {
    if (token.isClosing) {
      const matchIndex = stack.map((t) => t.name).lastIndexOf(token.name);
      if (matchIndex >= 0) {
        const opener = stack[matchIndex];
        // Raw-content closers get stranded by content_unformatted — realign them
        // to their opener when they sit on their own line.
        if (RAW_CONTENT_CLOSERS.has(token.name) && startsLine(token.startOffset)) {
          targetIndent.set(token.startOffset, indentColumnAt(opener.startOffset));
        }
        stack.length = matchIndex;
      }
      continue;
    }
    if (CONTROL_DIVIDERS.has(token.name)) {
      const enclosing = stack[stack.length - 1];
      if (enclosing && enclosing.name === 'isif' && startsLine(token.startOffset)) {
        targetIndent.set(token.startOffset, indentColumnAt(enclosing.startOffset));
      }
      continue;
    }
    if (!token.isSelfClosing && !VOID_TAGS.has(token.name)) {
      stack.push(token);
    }
  }

  if (targetIndent.size === 0) return text;

  const edits: Array<{start: number; end: number; replacement: string}> = [];
  for (const [offset, indent] of targetIndent) {
    const lineStart = lineStarts[lineOfOffset(lineStarts, offset)];
    const existing = /^[ \t]*/.exec(text.slice(lineStart))![0];
    if (existing !== indent) {
      edits.push({start: lineStart, end: lineStart + existing.length, replacement: indent});
    }
  }
  let out = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return out;
}

function buildLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineOfOffset(lineStarts: number[], offset: number): number {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Format a whole ISML document as a string: token-gated pre-normalize → HTML
 * format → token-driven divider re-indent → token-gated void-tag spacing.
 * Exported so it can be unit-tested without a VS Code document/host.
 */
export function formatIsmlText(text: string, options: vscode.FormattingOptions): string {
  const lspDoc = LspTextDocument.create('file:///format.isml', 'html', 1, preNormalizeControlTags(text));
  const edits = htmlLanguageService.format(lspDoc, undefined, buildFormatConfig(options));
  if (edits.length === 0) return text;
  const formatted = edits[0].newText;
  return normalizeVoidTagSpacing(reindentIsmlTags(formatted));
}

/**
 * Run ONLY the underlying HTML formatter (no ISML pre/post passes). Exported for
 * the corpus idempotency probe, which uses it to attribute instability to the
 * upstream engine vs. our ISML passes. Not used in the extension runtime path.
 */
export function rawHtmlFormat(text: string, options: vscode.FormattingOptions): string {
  const lspDoc = LspTextDocument.create('file:///raw.isml', 'html', 1, text);
  const edits = htmlLanguageService.format(lspDoc, undefined, buildFormatConfig(options));
  return edits.length === 0 ? text : edits[0].newText;
}

/**
 * Run the formatter over `document` (or `range`) and return VS Code text edits.
 * Returns [] on any failure so a formatter error never breaks "Format Document".
 */
function formatIsml(
  document: vscode.TextDocument,
  range: vscode.Range | undefined,
  options: vscode.FormattingOptions,
): vscode.TextEdit[] {
  try {
    const original = document.getText();

    if (!range) {
      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(original.length));
      return [vscode.TextEdit.replace(fullRange, formatIsmlText(original, options))];
    }

    // Range format: the token-gated pre-normalize shifts offsets and would
    // invalidate the returned ranges, so skip it and apply only the output
    // passes (which operate on the replacement text).
    const lspDoc = LspTextDocument.create(document.uri.toString(), 'html', document.version, original);
    const lspRange = {
      start: {line: range.start.line, character: range.start.character},
      end: {line: range.end.line, character: range.end.character},
    };
    const edits = htmlLanguageService.format(lspDoc, lspRange, buildFormatConfig(options));

    return edits.map((edit) => {
      const vscodeRange = new vscode.Range(
        edit.range.start.line,
        edit.range.start.character,
        edit.range.end.line,
        edit.range.end.character,
      );
      return vscode.TextEdit.replace(vscodeRange, normalizeVoidTagSpacing(reindentIsmlTags(edit.newText)));
    });
  } catch {
    return [];
  }
}

/** True when ISML formatting is enabled in settings (default on). */
function isFormattingEnabled(): boolean {
  return vscode.workspace.getConfiguration('b2c-dx').get<boolean>('features.ismlFormatting', true);
}

export function registerFormatting(context: vscode.ExtensionContext): void {
  if (!isFormattingEnabled()) return;

  const selector: vscode.DocumentSelector = {language: 'isml'};

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selector, {
      provideDocumentFormattingEdits(document, options) {
        return formatIsml(document, undefined, options);
      },
    }),
    vscode.languages.registerDocumentRangeFormattingEditProvider(selector, {
      provideDocumentRangeFormattingEdits(document, range, options) {
        return formatIsml(document, range, options);
      },
    }),
  );
}
