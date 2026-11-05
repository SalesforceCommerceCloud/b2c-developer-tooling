/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Finds the project files behind a Page Designer page or component type:
 *
 * - every project: the meta definition JSON in a cartridge
 *   (`experience/components/<group>/<id>.json` or `experience/pages/<id>.json`)
 * - cartridge (SFRA-style) projects: the render script next to it and the ISML
 *   template the script renders
 * - Storefront Next projects: the TypeScript source whose `@Component` or
 *   `@PageType` decorator the cartridge JSON is generated from
 */
import * as fs from 'fs';
import * as path from 'path';

export type TypeKind = 'component' | 'page';

export interface TypeSourceFile {
  /** What the file is, for example "Meta definition" or "Render script". */
  label: string;
  /** Absolute path. */
  file: string;
  /** Zero-based line to reveal, when known. */
  line?: number;
  /** Cartridge or project-relative location, for display. */
  detail: string;
}

export interface FindTypeSourcesOptions {
  kind: TypeKind;
  /** Cartridges to search, in cartridge path order. */
  cartridges: Array<{name: string; src: string}>;
  /** Storefront Next only: TypeScript files that may hold the decorator. */
  sourceFiles?: string[];
  /** Base for display paths of source files. */
  projectRoot?: string;
}

/** Default component group of Storefront Next (`@Component` without `group`). */
const SFNEXT_DEFAULT_GROUP = 'storefrontnext_base';

/**
 * Normalizes a type ID from the live API (`commerce_assets.photoTile`) or
 * library XML (`component.commerce_assets.photoTile`, `page.storePage`).
 */
export function normalizeTypeId(typeId: string): {kind?: TypeKind; id: string} {
  if (typeId.startsWith('component.')) return {kind: 'component', id: typeId.slice('component.'.length)};
  if (typeId.startsWith('page.')) return {kind: 'page', id: typeId.slice('page.'.length)};
  return {id: typeId};
}

/** Relative path of a type's meta definition without extension (`components/commerce_assets/photoTile`). */
function metaPath(kind: TypeKind, typeId: string): string {
  return path.join(kind === 'page' ? 'pages' : 'components', ...typeId.split('.'));
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length - 1;
}

/** Template paths a render script passes to `new Template('...')`. */
export function templatesRenderedBy(script: string): Array<{template: string; line: number}> {
  const out: Array<{template: string; line: number}> = [];
  for (const match of script.matchAll(/new\s+Template\(\s*(['"])([^'"]+)\1/g)) {
    out.push({template: match[2], line: lineOf(script, match.index ?? 0)});
  }
  return out;
}

/** Camel-cases a page type name the way the Storefront Next cartridge generator names files. */
export function sfnextPageTypeId(name: string): string {
  if (!/[\s-]/.test(name)) return name;
  return name
    .split(/[\s-]+/)
    .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
}

function stringProperty(objectText: string, key: string): string | undefined {
  return new RegExp(`\\b${key}\\s*:\\s*(['"\`])([^'"\`]+)\\1`).exec(objectText)?.[2];
}

/** The `{...}` argument starting at `start` (balanced braces, ignoring braces in strings). */
function objectLiteralAt(text: string, start: number): string | undefined {
  if (text[start] !== '{') return undefined;
  let depth = 0;
  let quote: string | undefined;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = undefined;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return undefined;
}

/**
 * Storefront Next decorators in a source file, as the type IDs they generate:
 * `@Component('hero', {group: 'Content'})` is `Content.hero`;
 * `@PageType({name: 'Home Page'})` is `homePage` (or its `id`).
 */
export function sfnextDecoratedTypes(source: string): Array<{kind: TypeKind; typeId: string; line: number}> {
  const out: Array<{kind: TypeKind; typeId: string; line: number}> = [];
  for (const match of source.matchAll(/@(Component|PageType)\(\s*/g)) {
    const kind: TypeKind = match[1] === 'PageType' ? 'page' : 'component';
    let rest = (match.index ?? 0) + match[0].length;
    let id: string | undefined;
    const literal = /^(['"`])([^'"`]+)\1\s*,?\s*/.exec(source.slice(rest));
    if (literal) {
      id = literal[2];
      rest += literal[0].length;
    }
    const config = objectLiteralAt(source, rest) ?? '';
    id ??= stringProperty(config, 'id');
    const line = lineOf(source, match.index ?? 0);
    if (kind === 'component') {
      if (id) out.push({kind, typeId: `${stringProperty(config, 'group') ?? SFNEXT_DEFAULT_GROUP}.${id}`, line});
    } else {
      const name = stringProperty(config, 'name');
      const pageId = id ?? (name ? sfnextPageTypeId(name) : undefined);
      if (pageId) out.push({kind, typeId: pageId, line});
    }
  }
  return out;
}

async function exists(file: string): Promise<boolean> {
  try {
    return (await fs.promises.stat(file)).isFile();
  } catch {
    return false;
  }
}

/**
 * Finds a type's files in the project. Storefront Next sources come first (they
 * are what developers edit), then each cartridge's JSON, script and templates.
 */
export async function findTypeSources(typeIdInput: string, options: FindTypeSourcesOptions): Promise<TypeSourceFile[]> {
  const {id: typeId, kind: prefixedKind} = normalizeTypeId(typeIdInput);
  const kind = prefixedKind ?? options.kind;
  const results: TypeSourceFile[] = [];

  // Shallowest first, so a base implementation sorts before overrides such
  // as `src/verticals/<name>/components/...`.
  const sourceFiles = [...(options.sourceFiles ?? [])].sort(
    (a, b) => a.split(path.sep).length - b.split(path.sep).length || a.localeCompare(b),
  );
  for (const file of sourceFiles) {
    let text: string;
    try {
      text = await fs.promises.readFile(file, 'utf8');
    } catch {
      continue;
    }
    if (!text.includes(kind === 'page' ? '@PageType' : '@Component')) continue;
    for (const decorated of sfnextDecoratedTypes(text)) {
      if (decorated.kind === kind && decorated.typeId === typeId) {
        results.push({
          label: kind === 'page' ? 'Page type source' : 'Component source',
          file,
          line: decorated.line,
          detail: options.projectRoot ? path.relative(options.projectRoot, file) : file,
        });
      }
    }
  }

  const relative = metaPath(kind, typeId);
  for (const cartridge of options.cartridges) {
    const experience = path.join(cartridge.src, 'cartridge', 'experience');
    const json = path.join(experience, `${relative}.json`);
    const script = path.join(experience, `${relative}.js`);
    if (await exists(json)) {
      results.push({label: 'Meta definition', file: json, detail: cartridge.name});
    }
    if (!(await exists(script))) continue;
    results.push({label: 'Render script', file: script, detail: cartridge.name});
    const templates = templatesRenderedBy(await fs.promises.readFile(script, 'utf8'));
    for (const {template} of templates) {
      const isml = template.endsWith('.isml') ? template : `${template}.isml`;
      // Templates resolve along the cartridge path, so look in every cartridge.
      for (const other of options.cartridges) {
        const file = path.join(other.src, 'cartridge', 'templates', 'default', isml);
        if ((await exists(file)) && !results.some((r) => r.file === file)) {
          results.push({label: 'Template', file, detail: other.name});
        }
      }
    }
  }
  return results;
}
