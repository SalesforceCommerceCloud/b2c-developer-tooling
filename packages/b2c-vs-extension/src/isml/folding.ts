/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {VOID_TAGS} from './constants.js';
import {scanIsmlTags, type IsmlTagToken} from './tags.js';

export interface IsmlFoldingRange {
  startOffset: number;
  endOffset: number;
}

export function collectIsmlFoldingRanges(text: string): IsmlFoldingRange[] {
  const ranges: IsmlFoldingRange[] = [];
  const stack: IsmlTagToken[] = [];

  for (const token of scanIsmlTags(text)) {
    if (!token.isClosing) {
      if (!token.isSelfClosing && !VOID_TAGS.has(token.name)) {
        stack.push(token);
      }
      continue;
    }

    if (VOID_TAGS.has(token.name)) continue;

    const matchingIndex = stack.map((entry) => entry.name).lastIndexOf(token.name);
    if (matchingIndex < 0) continue;

    for (let i = stack.length - 1; i >= matchingIndex; i--) {
      const opening = stack[i];
      ranges.push({
        startOffset: opening.startOffset,
        endOffset: token.endOffset,
      });
      stack.pop();
    }
  }

  return ranges;
}
