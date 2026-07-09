/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * ISML document formatting.
 *
 * ISML is HTML-with-extra-tags, so we format it with the SAME engine VS Code's
 * built-in HTML formatter uses: `vscode-html-languageservice`'s public
 * `getLanguageService().format()`. Using the standard language-service means
 * ISML formats consistently with HTML and honors the familiar wrap/indent
 * options, and it gives us range formatting for free.
 *
 * IMPORTANT: import ONLY from the package root (`vscode-html-languageservice`).
 * Do NOT deep-import `vscode-html-languageservice/lib/esm/...` — those internal
 * paths use extensionless imports that crash under native Node ESM (that is why
 * an earlier scanner deep-import was removed). The root entry resolves cleanly.
 *
 * ISML-specific handling:
 *  - `<isscript>` bodies are dw-script, not markup — marked contentUnformatted so
 *    the beautifier leaves them alone. (`<isscript>` is added to whatever the
 *    user configured.)
 *  - `${...}` expressions are left verbatim; we deliberately do not reformat
 *    dw-script inside them.
 *  - Void ISML tags are normalized from `<x />` to `<x/>` (no space) to match
 *    B2C convention — the one place ISML output differs from HTML.
 */
import {getLanguageService} from 'vscode-html-languageservice';
import type {HTMLFormatConfiguration} from 'vscode-html-languageservice';
import {TextDocument as LspTextDocument} from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode';

import {VOID_TAGS} from './constants.js';

// Tags whose bodies must never be reformatted (dw-script / preformatted text).
const CONTENT_UNFORMATTED = ['isscript', 'pre'];

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
 * Normalize void ISML tags from `<isxxx ... />` to `<isxxx .../>` (drop the
 * space before the self-close) to match B2C/Prophet convention. Only touches
 * tags in VOID_TAGS so ordinary self-closed HTML like `<br />` is untouched.
 *
 * Exported for unit testing.
 */
export function normalizeVoidTagSpacing(text: string): string {
  return text.replace(/<(is[\w-]+)\b([^<>]*?)\s+\/>/g, (whole, name: string, attrs: string) =>
    VOID_TAGS.has(name.toLowerCase()) ? `<${name}${attrs}/>` : whole,
  );
}

/**
 * Run the HTML language service formatter over `document` (or `range`) and
 * return VS Code text edits. Returns [] on any failure so a formatter error
 * never surfaces as a broken "Format Document" for the user.
 */
function formatIsml(
  document: vscode.TextDocument,
  range: vscode.Range | undefined,
  options: vscode.FormattingOptions,
): vscode.TextEdit[] {
  try {
    const lspDoc = LspTextDocument.create(document.uri.toString(), 'html', document.version, document.getText());
    const lspRange = range
      ? {
          start: {line: range.start.line, character: range.start.character},
          end: {line: range.end.line, character: range.end.character},
        }
      : undefined;

    const edits = htmlLanguageService.format(lspDoc, lspRange, buildFormatConfig(options));
    return edits.map((edit) => {
      const vscodeRange = new vscode.Range(
        edit.range.start.line,
        edit.range.start.character,
        edit.range.end.line,
        edit.range.end.character,
      );
      return vscode.TextEdit.replace(vscodeRange, normalizeVoidTagSpacing(edit.newText));
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
