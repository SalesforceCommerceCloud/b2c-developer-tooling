/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';

import {scanIsmlTags} from './tags.js';

const TEMPLATE_TAGS = new Set(['isinclude', 'isdecorate', 'ismodule']);

// Matches a `template="..."` / `template='...'` / `template=bare` attribute.
// Capture group 1 is the raw value including any surrounding quotes; the regex
// is anchored on a word boundary so it never matches a longer attribute name
// ending in "template". Bounded quantifiers only — no catastrophic backtracking.
const TEMPLATE_ATTR_RE = /\btemplate\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/gi;

export interface TemplateLink {
  template: string;
  startOffset: number;
  endOffset: number;
}

type LocaleCache = Map<string, string[]>;

/**
 * Find every `template="..."` attribute on `<isinclude>`, `<isdecorate>`, or `<ismodule>`
 * in the given document text. Returned offsets cover the unquoted template path so the
 * resulting link only underlines the path itself, not the quotes.
 *
 * Uses the hand-written ISML tag scanner (tags.ts) to locate the relevant open
 * tags, then extracts the `template` attribute from each tag's own text — no
 * external HTML-language-service dependency, and it inherits the scanner's
 * comment / iscomment / isscript skipping so template refs inside those are
 * ignored.
 */
export function findTemplateLinks(text: string): TemplateLink[] {
  const links: TemplateLink[] = [];

  for (const tag of scanIsmlTags(text)) {
    if (tag.isClosing || !TEMPLATE_TAGS.has(tag.name)) continue;

    // Scan only the attribute region: after the tag name, up to the closing `>`.
    const attrsStart = tag.nameEndOffset;
    const attrsText = text.slice(attrsStart, tag.endOffset);

    TEMPLATE_ATTR_RE.lastIndex = 0;
    const match = TEMPLATE_ATTR_RE.exec(attrsText);
    if (!match) continue;

    const rawValue = match[1];
    // Offset of the raw value within the full document.
    const rawValueStart = attrsStart + match.index + match[0].length - rawValue.length;
    let valueStart = rawValueStart;
    let valueEnd = rawValueStart + rawValue.length;
    let value = rawValue;

    const first = rawValue[0];
    const last = rawValue[rawValue.length - 1];
    if (rawValue.length >= 2 && (first === '"' || first === "'") && first === last) {
      valueStart++;
      valueEnd--;
      value = rawValue.slice(1, -1);
    } else if (last === '/') {
      // Unquoted value abutting a self-close, e.g. `template=common/header/>`.
      // The trailing slash belongs to the tag's `/>`, not the path — the tag
      // scanner already told us this tag self-closes, so drop that one slash.
      if (tag.isSelfClosing) {
        valueEnd--;
        value = rawValue.slice(0, -1);
      }
    }

    // Skip dynamic values (expressions) — we can't resolve a path from them.
    if (value.length === 0 || value.startsWith('$') || value.startsWith('${')) continue;

    links.push({template: value, startOffset: valueStart, endOffset: valueEnd});
  }

  return links;
}

/**
 * Resolve a template reference to an absolute file path on disk by searching
 * each cartridge's `cartridge/templates/<locale>/...isml` tree, in cartridge-path order.
 *
 * Templates without an `.isml` extension automatically have one appended.
 * Locale defaults to `default` plus any directories under `cartridge/templates`
 * that exist on disk (e.g. `en_US`, `fr_FR`).
 */
export function resolveTemplate(template: string, cartridgeRoots: string[]): string | undefined {
  return resolveTemplateWithLocaleCache(template, cartridgeRoots, new Map<string, string[]>());
}

function getOrderedLocales(templatesRoot: string, localeCache: LocaleCache): string[] | undefined {
  const cached = localeCache.get(templatesRoot);
  if (cached) return cached;

  let locales: string[];
  try {
    locales = fs
      .readdirSync(templatesRoot, {withFileTypes: true})
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return undefined;
  }

  // `default` always wins; remaining locales are sorted so template resolution
  // is deterministic across platforms (readdir order is filesystem-dependent).
  const ordered = ['default', ...locales.filter((l) => l !== 'default').sort()];
  localeCache.set(templatesRoot, ordered);
  return ordered;
}

export function resolveTemplateWithLocaleCache(
  template: string,
  cartridgeRoots: string[],
  localeCache: LocaleCache,
): string | undefined {
  const trimmed = template.replace(/^\/+/, '');
  const withExt = trimmed.endsWith('.isml') ? trimmed : `${trimmed}.isml`;

  for (const root of cartridgeRoots) {
    const templatesRoot = path.join(root, 'cartridge', 'templates');
    const ordered = getOrderedLocales(templatesRoot, localeCache);
    if (!ordered) continue;

    for (const locale of ordered) {
      const candidate = path.join(templatesRoot, locale, withExt);
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) return candidate;
      } catch {
        // not found in this locale, keep looking
      }
    }
  }
  return undefined;
}
