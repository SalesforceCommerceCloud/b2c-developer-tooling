/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createRequire} from 'node:module';

interface Scanner {
  scan: () => number;
  getTokenOffset: () => number;
  getTokenLength: () => number;
  getTokenText: () => string;
}

interface HtmlScannerModule {
  createScanner: (input: string, initialOffset?: number, initialState?: number) => Scanner;
}

interface HtmlLanguageTypesModule {
  TokenType: {
    EOS: number;
    StartTag: number;
    StartTagClose: number;
    StartTagSelfClose: number;
    AttributeName: number;
    AttributeValue: number;
  };
  ScannerState: {
    WithinContent: number;
  };
}

const require = createRequire(import.meta.url);
const scannerModule = require('vscode-html-languageservice/lib/umd/parser/htmlScanner.js') as HtmlScannerModule;
const typesModule = require('vscode-html-languageservice/lib/umd/htmlLanguageTypes.js') as HtmlLanguageTypesModule;

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
