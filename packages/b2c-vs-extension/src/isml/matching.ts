/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {VOID_TAGS} from './constants.js';
import {scanIsmlTags, type IsmlTagToken} from './tags.js';

export interface IsmlTagNameMatch {
  name: string;
  openingNameStartOffset: number;
  openingNameEndOffset: number;
  closingNameStartOffset: number;
  closingNameEndOffset: number;
}

function isWithinName(offset: number, startOffset: number, endOffset: number): boolean {
  return offset >= startOffset && offset <= endOffset;
}

function findIsmlTagNameMatchInternal(
  text: string,
  offset: number,
  strictTagNameMatching: boolean,
): IsmlTagNameMatch | undefined {
  const stack: IsmlTagToken[] = [];
  const matches: IsmlTagNameMatch[] = [];

  for (const token of scanIsmlTags(text)) {
    if (!token.isClosing) {
      if (!token.isSelfClosing && !VOID_TAGS.has(token.name)) {
        stack.push(token);
      }
      continue;
    }

    if (VOID_TAGS.has(token.name)) continue;

    const matchingIndex = strictTagNameMatching
      ? stack.map((item) => item.name).lastIndexOf(token.name)
      : stack.length - 1;
    if (matchingIndex < 0) continue;

    const opening = stack[matchingIndex];
    matches.push({
      name: strictTagNameMatching ? token.name : opening.name,
      openingNameStartOffset: opening.nameStartOffset,
      openingNameEndOffset: opening.nameEndOffset,
      closingNameStartOffset: token.nameStartOffset,
      closingNameEndOffset: token.nameEndOffset,
    });

    stack.length = matchingIndex;
  }

  return matches.find(
    (match) =>
      isWithinName(offset, match.openingNameStartOffset, match.openingNameEndOffset) ||
      isWithinName(offset, match.closingNameStartOffset, match.closingNameEndOffset),
  );
}

export function findIsmlTagNameMatch(text: string, offset: number): IsmlTagNameMatch | undefined {
  return findIsmlTagNameMatchInternal(text, offset, true);
}

export function findIsmlLinkedEditingTagNameMatch(text: string, offset: number): IsmlTagNameMatch | undefined {
  return findIsmlTagNameMatchInternal(text, offset, false);
}
