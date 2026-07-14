/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {VOID_TAGS} from './constants.js';
import {scanIsmlTags} from './tags.js';

export interface IsmlSymbol {
  name: string;
  startOffset: number;
  endOffset: number;
  selectionStartOffset: number;
  selectionEndOffset: number;
  children: IsmlSymbol[];
}

interface StackEntry {
  symbol: IsmlSymbol;
  children: IsmlSymbol[];
}

export function collectIsmlSymbols(text: string): IsmlSymbol[] {
  const roots: IsmlSymbol[] = [];
  const stack: StackEntry[] = [];

  for (const token of scanIsmlTags(text)) {
    if (token.isClosing) {
      const matchingIndex = stack.map((entry) => entry.symbol.name).lastIndexOf(token.name);
      if (matchingIndex < 0) continue;

      for (let i = stack.length - 1; i >= matchingIndex; i--) {
        const current = stack[i];
        current.symbol.endOffset = token.endOffset;
        current.symbol.children = current.children;
        stack.pop();

        if (stack.length > 0) {
          stack[stack.length - 1].children.push(current.symbol);
        } else {
          roots.push(current.symbol);
        }
      }
      continue;
    }

    const symbol: IsmlSymbol = {
      name: token.name,
      startOffset: token.startOffset,
      endOffset: token.endOffset,
      selectionStartOffset: token.nameStartOffset,
      selectionEndOffset: token.nameEndOffset,
      children: [],
    };

    if (token.isSelfClosing || VOID_TAGS.has(token.name)) {
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(symbol);
      } else {
        roots.push(symbol);
      }
      continue;
    }

    stack.push({symbol, children: []});
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    current.symbol.children = current.children;
    current.symbol.endOffset = text.length;
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(current.symbol);
    } else {
      roots.push(current.symbol);
    }
  }

  return roots;
}
