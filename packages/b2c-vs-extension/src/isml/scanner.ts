/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Direct ES imports so esbuild bundles the scanner code into the extension
// bundle. The previous createRequire()-based deep-imports were left as runtime
// requires by the bundler, which broke activation under `vsce --no-dependencies`
// (no node_modules in the VSIX).
import * as scannerModule from 'vscode-html-languageservice/lib/esm/parser/htmlScanner.js';
import * as typesModule from 'vscode-html-languageservice/lib/esm/htmlLanguageTypes.js';

export type IsmlScannerTokenType =
  | 'startTag'
  | 'startTagClose'
  | 'startTagSelfClose'
  | 'attributeName'
  | 'attributeValue'
  | 'other';

export interface IsmlScannerToken {
  type: IsmlScannerTokenType;
  offset: number;
  length: number;
  text: string;
}

export function scanIsml(text: string, onToken: (token: IsmlScannerToken) => void): void {
  const scanner = scannerModule.createScanner(text, 0, typesModule.ScannerState.WithinContent);
  const tokenType = typesModule.TokenType;

  while (true) {
    const scannedType = scanner.scan();
    if (scannedType === tokenType.EOS) return;

    let type: IsmlScannerTokenType = 'other';
    if (scannedType === tokenType.StartTag) type = 'startTag';
    else if (scannedType === tokenType.StartTagClose) type = 'startTagClose';
    else if (scannedType === tokenType.StartTagSelfClose) type = 'startTagSelfClose';
    else if (scannedType === tokenType.AttributeName) type = 'attributeName';
    else if (scannedType === tokenType.AttributeValue) type = 'attributeValue';

    onToken({
      type,
      offset: scanner.getTokenOffset(),
      length: scanner.getTokenLength(),
      text: scanner.getTokenText(),
    });
  }
}
