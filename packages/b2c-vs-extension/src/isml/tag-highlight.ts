/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import {scanIsmlTags} from './tags.js';

// Single semantic token type: every ISML tag name is emitted as `ismlTag`.
// The color is supplied by the theme via the `ismlTag` semantic token color;
// contributes.semanticTokenScopes maps it to `support.class` (teal in most
// themes) so tags are distinct from HTML markup without writing into the
// user's settings.json. When the toggle is off we register nothing, and tags
// fall back to their normal grammar (HTML) color.
const TOKEN_TYPE = 'ismlTag';
export const ISML_TAG_HIGHLIGHT_LEGEND = new vscode.SemanticTokensLegend([TOKEN_TYPE], []);

function highlightEnabled(): boolean {
  return vscode.workspace.getConfiguration('b2c-dx').get<boolean>('isml.highlightTags', true);
}

const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(document) {
    const builder = new vscode.SemanticTokensBuilder(ISML_TAG_HIGHLIGHT_LEGEND);
    for (const token of scanIsmlTags(document.getText())) {
      // Color only the tag name (e.g. `isloop`), not the angle brackets.
      const start = document.positionAt(token.nameStartOffset);
      const end = document.positionAt(token.nameEndOffset);
      // Semantic tokens must be single-line; ISML tag names never span lines.
      if (start.line !== end.line) continue;
      builder.push(start.line, start.character, end.character - start.character, 0, 0);
    }
    return builder.build();
  },
};

// Registers the ISML tag-name semantic-token provider, gated by the
// `b2c-dx.isml.highlightTags` setting. Toggling the setting re-registers or
// disposes the provider so the change takes effect without a reload.
export function registerTagHighlighting(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = {language: 'isml'};
  let registration: vscode.Disposable | undefined;

  const sync = () => {
    if (highlightEnabled() && !registration) {
      registration = vscode.languages.registerDocumentSemanticTokensProvider(
        selector,
        provider,
        ISML_TAG_HIGHLIGHT_LEGEND,
      );
      context.subscriptions.push(registration);
    } else if (!highlightEnabled() && registration) {
      registration.dispose();
      registration = undefined;
    }
  };

  sync();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('b2c-dx.isml.highlightTags')) sync();
    }),
  );
}
