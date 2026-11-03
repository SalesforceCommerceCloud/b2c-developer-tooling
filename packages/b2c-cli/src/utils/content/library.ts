/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import {Flags} from '@oclif/core';
import type {NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import {resolveLibraryEntries} from '@salesforce/b2c-tooling-sdk/config';
import type {LibraryItemInput} from '@salesforce/b2c-tooling-sdk/operations/content';

export const LIBRARY_FLAG = {
  library: Flags.string({
    description:
      'Library ID, or a site ID for a site-private library (defaults to dw.json "content-library" or the first "libraries" entry)',
  }),
};

/** Library from `--library`, then `content-library`, then the first `libraries` entry. */
export function resolveLibraryId(flag: string | undefined, values: NormalizedConfig): string | undefined {
  return flag ?? values.contentLibrary ?? resolveLibraryEntries(values.libraries)[0]?.id;
}

export const LIBRARY_REQUIRED = 'Library is required. Use --library or set "content-library" in dw.json.';

/** Flags shared by content asset and folder put/update. */
export const LIBRARY_ITEM_FLAGS = {
  file: Flags.string({char: 'f', description: 'JSON file with the body (flags override its fields)'}),
  name: Flags.string({description: 'Name for --locale'}),
  description: Flags.string({description: 'Description for --locale'}),
  online: Flags.boolean({description: 'Online (for assets, in --locale)', allowNo: true}),
  'page-title': Flags.string({description: 'SEO page title for --locale'}),
  'page-description': Flags.string({description: 'SEO page description for --locale'}),
  template: Flags.string({description: 'Rendering template'}),
  attribute: Flags.string({
    char: 'a',
    description: 'Localized string custom attribute as c_id=value for --locale (repeatable)',
    multiple: true,
  }),
  markup: Flags.string({
    description: 'Localized HTML (markup) custom attribute as c_id=<html> for --locale, e.g. c_body (repeatable)',
    multiple: true,
  }),
  locale: Flags.string({description: 'Locale for localized values', default: 'default'}),
};

export type LibraryItemFlags = {
  attribute?: string[];
  description?: string;
  file?: string;
  locale?: string;
  markup?: string[];
  name?: string;
  online?: boolean;
  'page-description'?: string;
  'page-title'?: string;
  template?: string;
};

/**
 * Builds an asset or folder body from `--file` plus flags. Localized fields
 * become `{<locale>: value}` maps merged into the file's maps. Folder
 * `online` is a plain boolean (`localizedOnline: false`).
 */
export async function buildLibraryItemInput(
  flags: LibraryItemFlags,
  {localizedOnline}: {localizedOnline: boolean},
): Promise<LibraryItemInput> {
  let input: LibraryItemInput = {};
  if (flags.file) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.promises.readFile(flags.file, 'utf8'));
    } catch (error) {
      throw new Error(`${flags.file}: ${(error as Error).message}`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${flags.file} must contain a JSON object`);
    }
    input = parsed as LibraryItemInput;
  }
  const locale = flags.locale ?? 'default';
  const localize = (key: string, value: unknown) => {
    const current = input[key];
    const map = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
    input[key] = {...map, [locale]: value};
  };

  if (flags.name !== undefined) localize('name', flags.name);
  if (flags.description !== undefined) localize('description', flags.description);
  if (flags['page-title'] !== undefined) localize('pageTitle', flags['page-title']);
  if (flags['page-description'] !== undefined) localize('pageDescription', flags['page-description']);
  if (flags.template !== undefined) input.template = flags.template;
  if (flags.online !== undefined) {
    if (localizedOnline) localize('online', flags.online);
    else input.online = flags.online;
  }
  for (const pair of flags.attribute ?? []) {
    const [key, value] = splitAttribute(pair, 'attribute');
    localize(key, value);
  }
  // Markup attributes are written as {source}; the platform renders `markup` on read.
  for (const pair of flags.markup ?? []) {
    const [key, value] = splitAttribute(pair, 'markup');
    localize(key, {source: value});
  }
  return input;
}

function splitAttribute(pair: string, flag: string): [string, string] {
  const eq = pair.indexOf('=');
  const key = eq === -1 ? '' : pair.slice(0, eq);
  if (!key.startsWith('c_') || key.length <= 2) throw new Error(`--${flag} must be c_<id>=<value>, got "${pair}"`);
  return [key, pair.slice(eq + 1)];
}

/** Default-locale (or first) value of a localized map. */
export function localizedValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'object') return String(value);
  const map = value as Record<string, unknown>;
  const v = map.default ?? Object.values(map)[0];
  return v === undefined ? '' : String(v);
}
