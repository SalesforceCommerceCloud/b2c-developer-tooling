/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';

import {scanIsml} from './scanner.js';

const TEMPLATE_TAGS = new Set(['isinclude', 'isdecorate', 'ismodule']);

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
 */
export function findTemplateLinks(text: string): TemplateLink[] {
  const links: TemplateLink[] = [];

  let currentTagName: string | null = null;
  let currentAttributeName: string | null = null;

  scanIsml(text, (token) => {
    if (token.type === 'startTag') {
      currentTagName = token.text.toLowerCase();
      currentAttributeName = null;
      return;
    }

    if (token.type === 'startTagClose' || token.type === 'startTagSelfClose') {
      currentTagName = null;
      currentAttributeName = null;
      return;
    }

    if (token.type === 'attributeName') {
      if (!currentTagName || !TEMPLATE_TAGS.has(currentTagName)) {
        currentAttributeName = null;
        return;
      }
      currentAttributeName = token.text.toLowerCase();
      return;
    }

    if (token.type !== 'attributeValue') return;

    if (!currentTagName || !TEMPLATE_TAGS.has(currentTagName)) return;
    if (currentAttributeName !== 'template') return;

    const rawValue = token.text;
    let valueStart = token.offset;
    let valueEnd = token.offset + token.length;
    let value = rawValue;

    if (rawValue.length >= 2) {
      const first = rawValue[0];
      const last = rawValue[rawValue.length - 1];
      if ((first === '"' || first === "'") && first === last) {
        valueStart++;
        valueEnd--;
        value = rawValue.slice(1, -1);
      }
    }

    if (value.length === 0 || value.startsWith('$') || value.startsWith('${')) {
      currentAttributeName = null;
      return;
    }

    links.push({template: value, startOffset: valueStart, endOffset: valueEnd});
    currentAttributeName = null;
  });

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

  const ordered = ['default', ...locales.filter((l) => l !== 'default')];
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
