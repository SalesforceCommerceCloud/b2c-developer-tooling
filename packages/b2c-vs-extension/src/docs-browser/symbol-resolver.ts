/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {scanIsmlTags} from '../isml/tags.js';

/**
 * Extract a Script API qualified name (e.g. `dw.order.BasketMgr.getCurrentBasket`)
 * from VS Code hover content. The TypeScript Server plugin shipped via
 * `b2c-script-types` produces hovers like:
 *
 *     (method) dw.order.BasketMgr.getCurrentBasket(): Basket | null
 *     (alias) class dw.order.Basket
 *     import('dw/order/BasketMgr')
 *
 * We accept any of those shapes — the regex matches `dw` followed by
 * dotted/slashed identifiers. When the slash form appears (require paths) we
 * return it as-is; the loader normalizes both forms.
 *
 * Returns the longest match in the input string. Hover output may contain a
 * shortened qualifier (e.g. `BasketMgr`) followed by the canonical full name —
 * we want the full one.
 */
export function extractScriptApiQualifiedName(hoverText: string): string | undefined {
  if (!hoverText) return undefined;
  // Greedy: dotted form (dw.order.BasketMgr) or slash form (dw/order/BasketMgr).
  const candidates: string[] = [];
  const dotted = hoverText.matchAll(/\bdw(?:\.[A-Za-z_][\w$]*)+\b/g);
  for (const match of dotted) candidates.push(match[0]);
  const slashed = hoverText.matchAll(/\bdw(?:\/[A-Za-z_][\w$]*)+\b/g);
  for (const match of slashed) candidates.push(match[0]);

  if (candidates.length === 0) return undefined;
  // Prefer the longest candidate so a class+method qualified name beats just the class.
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

/**
 * Extract the bare identifier under the cursor (used as a fallback when no
 * `dw.*` reference is present). Walks left and right from the offset over JS
 * identifier characters.
 */
export function extractIdentifierAtOffset(text: string, offset: number): string | undefined {
  if (offset < 0 || offset > text.length) return undefined;
  const isIdent = (ch: string) => /[A-Za-z0-9_$]/.test(ch);

  let start = offset;
  while (start > 0 && isIdent(text[start - 1])) start--;
  let end = offset;
  while (end < text.length && isIdent(text[end])) end++;
  if (end === start) return undefined;
  return text.slice(start, end);
}

/**
 * Find the ISML tag whose name span covers the offset. Returns the bare tag
 * name (e.g. `isloop`, `iscustom-foo`) so the caller can build an `isml:<name>`
 * id.
 */
export function findIsmlTagAtOffset(text: string, offset: number): string | undefined {
  for (const token of scanIsmlTags(text)) {
    if (offset >= token.nameStartOffset && offset <= token.nameEndOffset) {
      return token.name;
    }
  }
  return undefined;
}
