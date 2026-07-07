/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {VOID_TAGS} from './constants.js';
import {scanIsmlTags} from './tags.js';

export type IsmlDiagnosticSeverity = 'error' | 'warning';

export interface IsmlDiagnostic {
  message: string;
  startOffset: number;
  endOffset: number;
  severity: IsmlDiagnosticSeverity;
}

export interface IsmlQuickFixEdit {
  startOffset: number;
  endOffset: number;
  newText: string;
}

export interface IsmlQuickFix {
  title: string;
  edits: IsmlQuickFixEdit[];
}

interface OpenTag {
  name: string;
  startOffset: number;
  endOffset: number;
}

export function collectIsmlDiagnostics(text: string): IsmlDiagnostic[] {
  const diagnostics: IsmlDiagnostic[] = [];
  const stack: OpenTag[] = [];

  for (const token of scanIsmlTags(text)) {
    if (!token.isClosing) {
      if (VOID_TAGS.has(token.name) && !token.isSelfClosing) {
        diagnostics.push({
          message: `ISML void tag <${token.name}> should be self-closing.`,
          startOffset: token.startOffset,
          endOffset: token.endOffset,
          severity: 'warning',
        });
      }

      if (!token.isSelfClosing && !VOID_TAGS.has(token.name)) {
        stack.push({name: token.name, startOffset: token.startOffset, endOffset: token.endOffset});
      }
      continue;
    }

    if (VOID_TAGS.has(token.name)) {
      diagnostics.push({
        message: `ISML void tag </${token.name}> is not valid.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
      continue;
    }

    if (stack.length === 0) {
      diagnostics.push({
        message: `Unexpected closing tag </${token.name}>.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
      continue;
    }

    const matchingIndex = stack.map((item) => item.name).lastIndexOf(token.name);
    if (matchingIndex < 0) {
      diagnostics.push({
        message: `Unexpected closing tag </${token.name}>.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
      continue;
    }

    if (matchingIndex !== stack.length - 1) {
      const expected = stack[stack.length - 1];
      diagnostics.push({
        message: `Mismatched closing tag </${token.name}>. Expected </${expected.name}>.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
    }

    for (let i = stack.length - 1; i > matchingIndex; i--) {
      const unclosed = stack[i];
      diagnostics.push({
        message: `Tag <${unclosed.name}> is not closed.`,
        startOffset: unclosed.startOffset,
        endOffset: unclosed.endOffset,
        severity: 'error',
      });
    }

    stack.length = matchingIndex;
  }

  for (const unclosed of stack) {
    diagnostics.push({
      message: `Tag <${unclosed.name}> is not closed.`,
      startOffset: unclosed.startOffset,
      endOffset: unclosed.endOffset,
      severity: 'error',
    });
  }

  return diagnostics;
}

function extractTagName(message: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(message);
  return match?.[1];
}

function makeSelfClosingTagSnippet(tagSource: string): string | undefined {
  if (!tagSource.endsWith('>') || /\/\s*>$/.test(tagSource)) return undefined;

  const gtIndex = tagSource.lastIndexOf('>');
  let insertIndex = gtIndex;
  while (insertIndex > 0 && /\s/.test(tagSource[insertIndex - 1])) {
    insertIndex--;
  }

  return `${tagSource.slice(0, insertIndex)}/${tagSource.slice(insertIndex)}`;
}

export function getIsmlQuickFixes(text: string, diagnostic: IsmlDiagnostic): IsmlQuickFix[] {
  const shouldSelfCloseTagName = extractTagName(
    diagnostic.message,
    /^ISML void tag <([a-z][\w-]*)> should be self-closing\.$/i,
  );
  if (shouldSelfCloseTagName) {
    const source = text.slice(diagnostic.startOffset, diagnostic.endOffset);
    const replacement = makeSelfClosingTagSnippet(source);
    if (!replacement) return [];

    return [
      {
        title: `Make <${shouldSelfCloseTagName}> self-closing`,
        edits: [{startOffset: diagnostic.startOffset, endOffset: diagnostic.endOffset, newText: replacement}],
      },
    ];
  }

  const invalidVoidClosingTagName = extractTagName(
    diagnostic.message,
    /^ISML void tag <\/([a-z][\w-]*)> is not valid\.$/i,
  );
  if (invalidVoidClosingTagName) {
    return [
      {
        title: `Replace </${invalidVoidClosingTagName}> with <${invalidVoidClosingTagName}/>`,
        edits: [
          {
            startOffset: diagnostic.startOffset,
            endOffset: diagnostic.endOffset,
            newText: `<${invalidVoidClosingTagName}/>`,
          },
        ],
      },
    ];
  }

  return [];
}
