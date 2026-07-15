/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface IsmlTagToken {
  name: string;
  isClosing: boolean;
  isSelfClosing: boolean;
  startOffset: number;
  endOffset: number;
  nameStartOffset: number;
  nameEndOffset: number;
}

function isNameStartChar(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}

function isNameChar(ch: string): boolean {
  return /[\w-]/.test(ch);
}

// Raw-content ISML elements: their bodies are not markup, so any `<...>` inside
// them must not be scanned as tags (e.g. commented-out ISML inside <iscomment>,
// or `a < b` inside <isscript>). We emit the open and close tokens but skip the
// content between, mirroring how <!-- --> comments are skipped.
const RAW_CONTENT_TAGS = new Set(['iscomment', 'isscript']);

export function scanIsmlTags(text: string): IsmlTagToken[] {
  const tokens: IsmlTagToken[] = [];
  let i = 0;

  while (i < text.length) {
    const start = text.indexOf('<', i);
    if (start < 0) break;

    if (text.startsWith('<!--', start)) {
      const endComment = text.indexOf('-->', start + 4);
      i = endComment >= 0 ? endComment + 3 : text.length;
      continue;
    }

    let cursor = start + 1;
    let isClosing = false;

    while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
    if (text[cursor] === '/') {
      isClosing = true;
      cursor++;
      while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
    }

    if (!isNameStartChar(text[cursor] ?? '')) {
      i = start + 1;
      continue;
    }

    const nameStart = cursor;
    cursor++;
    while (cursor < text.length && isNameChar(text[cursor])) cursor++;
    const rawName = text.slice(nameStart, cursor);
    if (!rawName.toLowerCase().startsWith('is')) {
      i = start + 1;
      continue;
    }

    let quote: '"' | "'" | null = null;
    let end = -1;
    for (let j = cursor; j < text.length; j++) {
      const ch = text[j];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        end = j;
        break;
      }
    }

    if (end < 0) break;

    const inner = text.slice(cursor, end);
    const isSelfClosing = !isClosing && /\/\s*$/.test(inner);

    const name = rawName.toLowerCase();

    tokens.push({
      name,
      isClosing,
      isSelfClosing,
      startOffset: start,
      endOffset: end + 1,
      nameStartOffset: nameStart,
      nameEndOffset: cursor,
    });

    // For a raw-content element, jump past its body to the matching close tag so
    // `<...>` inside it is never scanned as markup. If no close tag exists, stop
    // scanning entirely (the rest of the document is inside the unterminated
    // raw element). The close tag itself is picked up by the next iteration.
    if (!isClosing && !isSelfClosing && RAW_CONTENT_TAGS.has(name)) {
      const closeRe = new RegExp(`</\\s*${name}\\b`, 'i');
      const rest = text.slice(end + 1);
      const closeMatch = closeRe.exec(rest);
      if (closeMatch) {
        i = end + 1 + closeMatch.index;
      } else {
        break;
      }
      continue;
    }

    i = end + 1;
  }

  return tokens;
}
