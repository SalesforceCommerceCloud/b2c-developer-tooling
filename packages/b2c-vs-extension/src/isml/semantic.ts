/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

import {findTemplateLinks, resolveTemplate} from './document-links.js';

type SemanticCompletionKind = 'resource' | 'resourceKey' | 'resourceBundle' | 'urlutils' | 'res' | 'require';

export interface SemanticCompletionContext {
  kind: SemanticCompletionKind;
  partial: string;
  startOffset: number;
  bundle?: string;
}

export interface SemanticCompletionEntry {
  label: string;
  insertText: string;
  detail: string;
}

export interface IsmlDefinitionTarget {
  startOffset: number;
  endOffset: number;
  targetPath: string;
}

export interface IsmlReferenceRange {
  startOffset: number;
  endOffset: number;
}

const RESOURCE_METHODS: SemanticCompletionEntry[] = [
  {label: 'msg', insertText: 'msg', detail: 'Resource.msg(key, bundle, defaultValue)'},
  {label: 'msgf', insertText: 'msgf', detail: 'Resource.msgf(key, bundle, defaultValue, ...args)'},
];

const URLUTILS_METHODS: SemanticCompletionEntry[] = [
  {label: 'url', insertText: 'url', detail: 'URLUtils.url(controllerAction, ...params)'},
  {label: 'http', insertText: 'http', detail: 'URLUtils.http(controllerAction, ...params)'},
  {label: 'https', insertText: 'https', detail: 'URLUtils.https(controllerAction, ...params)'},
  {label: 'abs', insertText: 'abs', detail: 'URLUtils.abs(controllerAction, ...params)'},
];

const RES_METHODS: SemanticCompletionEntry[] = [
  {label: 'render', insertText: 'render', detail: 'res.render(templatePath, model)'},
];

const REQUIRE_PREFIX_METHODS: SemanticCompletionEntry[] = [
  {
    label: '*/cartridge/',
    insertText: '*/cartridge/',
    detail: 'Require module from first matching cartridge in cartridge path order',
  },
  {
    label: '~/cartridge/',
    insertText: '~/cartridge/',
    detail: 'Require module from the current cartridge',
  },
  {
    label: '*/cartridge/scripts/',
    insertText: '*/cartridge/scripts/',
    detail: 'Require script module from first matching cartridge in cartridge path order',
  },
  {
    label: '~/cartridge/scripts/',
    insertText: '~/cartridge/scripts/',
    detail: 'Require script module from the current cartridge',
  },
];

export function detectSemanticCompletionContext(linePrefix: string): SemanticCompletionContext | null {
  const resourceBundle = /(Resource\.msgf?\(\s*['"][^'"]*['"]\s*,\s*['"])([^'"]*)$/.exec(linePrefix);
  if (resourceBundle) {
    return {
      kind: 'resourceBundle',
      partial: resourceBundle[2],
      startOffset: linePrefix.length - resourceBundle[2].length,
    };
  }

  const resourceKey = /(Resource\.msgf?\(\s*['"])([^'"]*)$/.exec(linePrefix);
  if (resourceKey) {
    return {
      kind: 'resourceKey',
      partial: resourceKey[2],
      startOffset: linePrefix.length - resourceKey[2].length,
    };
  }

  const resource = /(Resource\.)([a-zA-Z]*)$/.exec(linePrefix);
  if (resource) {
    return {
      kind: 'resource',
      partial: resource[2],
      startOffset: linePrefix.length - resource[2].length,
    };
  }

  const urlutils = /(URLUtils\.)([a-zA-Z]*)$/.exec(linePrefix);
  if (urlutils) {
    return {
      kind: 'urlutils',
      partial: urlutils[2],
      startOffset: linePrefix.length - urlutils[2].length,
    };
  }

  const res = /(res\.)([a-zA-Z]*)$/.exec(linePrefix);
  if (res) {
    return {
      kind: 'res',
      partial: res[2],
      startOffset: linePrefix.length - res[2].length,
    };
  }

  const requirePath = /(require\(\s*['"])([^'"]*)$/.exec(linePrefix);
  if (requirePath) {
    return {
      kind: 'require',
      partial: requirePath[2],
      startOffset: linePrefix.length - requirePath[2].length,
    };
  }

  return null;
}

interface RequireModuleCompletion {
  modulePath: string;
  cartridgeName: string;
  cartridgeRoot: string;
  cartridgeIndex: number;
}

let cachedRequireModulesKey: string | undefined;
let cachedRequireModules: RequireModuleCompletion[] | undefined;

function isFile(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function normalizePathLike(value: string): string {
  return value.replace(/\\/g, '/');
}

function findContainingCartridgeRoot(documentPath: string | undefined, cartridgeRoots: string[]): string | undefined {
  if (!documentPath) return undefined;

  const containing = cartridgeRoots
    .filter((root) => documentPath === root || documentPath.startsWith(`${root}${path.sep}`))
    .sort((a, b) => b.length - a.length);
  return containing[0];
}

function collectRequireModules(cartridgeRoots: string[]): RequireModuleCompletion[] {
  const cacheKey = cartridgeRoots.join('|');
  if (cachedRequireModulesKey === cacheKey && cachedRequireModules) {
    return cachedRequireModules;
  }

  const seen = new Set<string>();
  const modules: RequireModuleCompletion[] = [];

  for (const [cartridgeIndex, root] of cartridgeRoots.entries()) {
    const cartridgeRoot = path.join(root, 'cartridge');
    const pending: string[] = [''];

    while (pending.length > 0) {
      const relativeDir = pending.pop() ?? '';
      const absoluteDir = path.join(cartridgeRoot, relativeDir);

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(absoluteDir, {withFileTypes: true});
      } catch {
        continue;
      }

      for (const entry of entries) {
        const relativePath = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
        if (entry.isDirectory()) {
          pending.push(relativePath);
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (ext !== '.js' && ext !== '.ts') continue;

        let modulePath = relativePath.replace(/\.(js|ts)$/i, '');
        if (modulePath.endsWith('/index')) {
          modulePath = modulePath.slice(0, -'/index'.length);
        }
        if (!modulePath) continue;

        const dedupeKey = `${root}::${modulePath}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        modules.push({
          modulePath,
          cartridgeName: path.basename(root),
          cartridgeRoot: root,
          cartridgeIndex,
        });
      }
    }
  }

  modules.sort((a, b) => a.cartridgeIndex - b.cartridgeIndex || a.modulePath.localeCompare(b.modulePath));
  cachedRequireModulesKey = cacheKey;
  cachedRequireModules = modules;
  return modules;
}

interface RankedSemanticCompletionEntry {
  entry: SemanticCompletionEntry;
  rank: number;
  cartridgeIndex: number;
}

function parsePropertiesKeys(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const keys: string[] = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;
    const separatorIndex = line.search(/[:=]/);
    const key = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : line;
    if (!key) continue;
    keys.push(key);
  }
  return keys;
}

function getResourceBundleCompletionEntries(partial: string, cartridgeRoots: string[]): SemanticCompletionEntry[] {
  const seen = new Set<string>();
  const entries: SemanticCompletionEntry[] = [];

  for (const root of cartridgeRoots) {
    const resourceRoot = path.join(root, 'cartridge', 'templates', 'resources');

    let files: string[];
    try {
      files = fs.readdirSync(resourceRoot);
    } catch {
      continue;
    }

    for (const fileName of files) {
      if (!fileName.endsWith('.properties')) continue;
      const bundleName = fileName.replace(/\.properties$/i, '').replace(/_.+$/, '');
      if (!bundleName || seen.has(bundleName)) continue;
      seen.add(bundleName);
      if (!bundleName.startsWith(partial)) continue;
      entries.push({
        label: bundleName,
        insertText: bundleName,
        detail: `Resource bundle (${path.basename(root)})`,
      });
    }
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

function getResourceKeyCompletionEntries(
  partial: string,
  cartridgeRoots: string[],
  bundle?: string,
): SemanticCompletionEntry[] {
  const keysByBundle = new Map<string, Set<string>>();

  for (const root of cartridgeRoots) {
    const resourceRoot = path.join(root, 'cartridge', 'templates', 'resources');

    let files: string[];
    try {
      files = fs.readdirSync(resourceRoot);
    } catch {
      continue;
    }

    for (const fileName of files) {
      if (!fileName.endsWith('.properties')) continue;
      const canonicalBundleName = fileName.replace(/\.properties$/i, '').replace(/_.+$/, '');
      if (bundle && canonicalBundleName !== bundle) continue;

      const filePath = path.join(resourceRoot, fileName);
      for (const key of parsePropertiesKeys(filePath)) {
        if (!key.startsWith(partial)) continue;
        if (!keysByBundle.has(canonicalBundleName)) keysByBundle.set(canonicalBundleName, new Set<string>());
        keysByBundle.get(canonicalBundleName)?.add(key);
      }
    }
  }

  const entries: SemanticCompletionEntry[] = [];
  for (const [bundleName, keys] of [...keysByBundle.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    for (const key of [...keys].sort()) {
      entries.push({
        label: key,
        insertText: key,
        detail: `Resource key (${bundleName})`,
      });
    }
  }

  return entries;
}

function getRequireCompletionEntries(
  partial: string,
  cartridgeRoots: string[],
  documentPath: string | undefined,
): SemanticCompletionEntry[] {
  const normalizedPartial = normalizePathLike(partial);
  const currentRoot = findContainingCartridgeRoot(documentPath, cartridgeRoots);
  const cartridgePathMatch = /(?:^|\/)cartridge\/(.*)$/.exec(normalizedPartial);
  const cartridgePathPartial = (cartridgePathMatch?.[1] ?? '').toLowerCase();
  const includeNonScriptsModules =
    cartridgePathPartial.length > 0 &&
    !'scripts/'.startsWith(cartridgePathPartial) &&
    !'scripts'.startsWith(cartridgePathPartial);
  const entries = new Map<string, RankedSemanticCompletionEntry>();

  const upsertEntry = (candidate: RankedSemanticCompletionEntry): void => {
    const existing = entries.get(candidate.entry.label);
    if (!existing) {
      entries.set(candidate.entry.label, candidate);
      return;
    }

    if (candidate.rank < existing.rank) {
      entries.set(candidate.entry.label, candidate);
      return;
    }

    if (candidate.rank === existing.rank && candidate.cartridgeIndex < existing.cartridgeIndex) {
      entries.set(candidate.entry.label, candidate);
    }
  };

  for (const entry of REQUIRE_PREFIX_METHODS) {
    if (entry.label.startsWith(normalizedPartial)) {
      upsertEntry({entry, rank: entry.label.startsWith('~/') ? 0 : 1, cartridgeIndex: Number.MAX_SAFE_INTEGER});
    }
  }

  for (const module of collectRequireModules(cartridgeRoots)) {
    const isScriptsModule = module.modulePath.startsWith('scripts/');
    if (!isScriptsModule && !includeNonScriptsModules) continue;

    const labels: SemanticCompletionEntry[] = [
      {
        label: `*/cartridge/${module.modulePath}`,
        insertText: `*/cartridge/${module.modulePath}`,
        detail: `Require module from cartridge path (${module.cartridgeName})`,
      },
      {
        label: `${module.cartridgeName}/cartridge/${module.modulePath}`,
        insertText: `${module.cartridgeName}/cartridge/${module.modulePath}`,
        detail: `Require module from cartridge ${module.cartridgeName}`,
      },
    ];

    if (currentRoot && module.cartridgeRoot === currentRoot) {
      labels.push({
        label: `~/cartridge/${module.modulePath}`,
        insertText: `~/cartridge/${module.modulePath}`,
        detail: 'Require module from current cartridge',
      });
    }

    for (const candidate of labels) {
      if (candidate.label.startsWith(normalizedPartial)) {
        const rank = candidate.label.startsWith('~/') ? 0 : candidate.label.startsWith('*/') ? 1 : 2;
        upsertEntry({entry: candidate, rank, cartridgeIndex: module.cartridgeIndex});
      }
    }
  }

  return [...entries.values()]
    .sort(
      (a, b) => a.rank - b.rank || a.cartridgeIndex - b.cartridgeIndex || a.entry.label.localeCompare(b.entry.label),
    )
    .map((item) => item.entry);
}

export function getSemanticCompletionEntries(
  context: SemanticCompletionContext,
  cartridgeRoots: string[] = [],
  documentPath?: string,
): SemanticCompletionEntry[] {
  if (context.kind === 'resourceKey') {
    return getResourceKeyCompletionEntries(context.partial, cartridgeRoots, context.bundle);
  }
  if (context.kind === 'resourceBundle') {
    return getResourceBundleCompletionEntries(context.partial, cartridgeRoots);
  }
  if (context.kind === 'resource') {
    return RESOURCE_METHODS.filter((entry) => entry.label.startsWith(context.partial));
  }
  if (context.kind === 'urlutils') {
    return URLUTILS_METHODS.filter((entry) => entry.label.startsWith(context.partial));
  }
  if (context.kind === 'res') {
    return RES_METHODS.filter((entry) => entry.label.startsWith(context.partial));
  }
  return getRequireCompletionEntries(context.partial, cartridgeRoots, documentPath);
}

function resolveResourceBundle(bundle: string, cartridgeRoots: string[]): string | undefined {
  for (const root of cartridgeRoots) {
    const resourceRoot = path.join(root, 'cartridge', 'templates', 'resources');
    const canonical = path.join(resourceRoot, `${bundle}.properties`);
    try {
      if (fs.statSync(canonical).isFile()) return canonical;
    } catch {
      // continue
    }

    try {
      const candidates = fs
        .readdirSync(resourceRoot)
        .filter(
          (name) => name === `${bundle}.properties` || (name.startsWith(`${bundle}_`) && name.endsWith('.properties')),
        )
        .sort();
      if (candidates.length > 0) {
        return path.join(resourceRoot, candidates[0]);
      }
    } catch {
      // continue
    }
  }

  return undefined;
}

function collectResolvedSemanticTargets(
  text: string,
  cartridgeRoots: string[],
  documentPath?: string,
): IsmlDefinitionTarget[] {
  const targets: IsmlDefinitionTarget[] = [];

  for (const link of findTemplateLinks(text)) {
    const targetPath = resolveTemplate(link.template, cartridgeRoots);
    if (!targetPath) continue;
    targets.push({startOffset: link.startOffset, endOffset: link.endOffset, targetPath});
  }

  const resRenderRe = /res\.render\(\s*(['"])([^'"]+)\1/g;
  for (const match of text.matchAll(resRenderRe)) {
    const full = match[0];
    const template = match[2];
    const matchStart = match.index ?? 0;
    const templateStart = matchStart + full.indexOf(template);
    const templateEnd = templateStart + template.length;
    const targetPath = resolveTemplate(template, cartridgeRoots);
    if (!targetPath) continue;
    targets.push({startOffset: templateStart, endOffset: templateEnd, targetPath});
  }

  const requireCallRe = /require\(\s*(['"])([^'"]+)\1\s*\)/g;
  for (const match of text.matchAll(requireCallRe)) {
    const full = match[0];
    const modulePath = match[2];
    const matchStart = match.index ?? 0;
    const moduleStart = matchStart + full.indexOf(modulePath);
    const moduleEnd = moduleStart + modulePath.length;
    const targetPath = resolveRequireModule(modulePath, cartridgeRoots, documentPath);
    if (!targetPath) continue;
    targets.push({startOffset: moduleStart, endOffset: moduleEnd, targetPath});
  }

  return targets;
}

export function findIsmlReferenceRanges(
  text: string,
  offset: number,
  cartridgeRoots: string[],
  documentPath?: string,
): IsmlReferenceRange[] {
  const current = findIsmlDefinitionTarget(text, offset, cartridgeRoots, documentPath);
  if (!current) return [];

  const seen = new Set<string>();
  const ranges: IsmlReferenceRange[] = [];
  for (const candidate of collectResolvedSemanticTargets(text, cartridgeRoots, documentPath)) {
    if (candidate.targetPath !== current.targetPath) continue;
    const key = `${candidate.startOffset}:${candidate.endOffset}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ranges.push({startOffset: candidate.startOffset, endOffset: candidate.endOffset});
  }

  ranges.sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);
  return ranges;
}

function resolveRequireModule(
  modulePath: string,
  cartridgeRoots: string[],
  documentPath: string | undefined,
): string | undefined {
  const normalized = normalizePathLike(modulePath).trim();
  if (!normalized) return undefined;

  const resolveScriptCandidate = (basePath: string): string | undefined => {
    if (basePath.endsWith('.js') || basePath.endsWith('.ts')) {
      if (isFile(basePath)) return basePath;
      return undefined;
    }

    const candidates = [
      `${basePath}.js`,
      `${basePath}.ts`,
      path.join(basePath, 'index.js'),
      path.join(basePath, 'index.ts'),
    ];
    return candidates.find((candidate) => isFile(candidate));
  };

  if (normalized.startsWith('~/')) {
    const currentRoot = findContainingCartridgeRoot(documentPath, cartridgeRoots);
    if (!currentRoot) return undefined;
    return resolveScriptCandidate(path.join(currentRoot, normalized.slice(2)));
  }

  if (normalized.startsWith('*/')) {
    const relative = normalized.slice(2);
    for (const root of cartridgeRoots) {
      const resolved = resolveScriptCandidate(path.join(root, relative));
      if (resolved) return resolved;
    }
    return undefined;
  }

  const cartridgePathMatch = /^([^/]+)\/(cartridge\/.+)$/.exec(normalized);
  if (cartridgePathMatch) {
    const cartridgeName = cartridgePathMatch[1];
    const relative = cartridgePathMatch[2];
    const cartridgeRoot = cartridgeRoots.find((root) => path.basename(root) === cartridgeName);
    if (!cartridgeRoot) return undefined;
    return resolveScriptCandidate(path.join(cartridgeRoot, relative));
  }

  return undefined;
}

function resolveController(controllerAction: string, cartridgeRoots: string[]): string | undefined {
  const controllerName = controllerAction.split('-')[0]?.trim();
  if (!controllerName) return undefined;

  for (const root of cartridgeRoots) {
    const controllerRoot = path.join(root, 'cartridge', 'controllers');
    const jsCandidate = path.join(controllerRoot, `${controllerName}.js`);
    try {
      if (fs.statSync(jsCandidate).isFile()) return jsCandidate;
    } catch {
      // continue
    }

    const tsCandidate = path.join(controllerRoot, `${controllerName}.ts`);
    try {
      if (fs.statSync(tsCandidate).isFile()) return tsCandidate;
    } catch {
      // continue
    }
  }

  return undefined;
}

function isWithin(offset: number, startOffset: number, endOffset: number): boolean {
  return offset >= startOffset && offset <= endOffset;
}

export function findIsmlDefinitionTarget(
  text: string,
  offset: number,
  cartridgeRoots: string[],
  documentPath?: string,
): IsmlDefinitionTarget | undefined {
  for (const link of findTemplateLinks(text)) {
    const quoteBeforeValue = link.startOffset > 0 ? text[link.startOffset - 1] : undefined;
    const quoteAfterValue = link.endOffset < text.length ? text[link.endOffset] : undefined;
    const onOpeningQuote = (quoteBeforeValue === '"' || quoteBeforeValue === "'") && offset === link.startOffset - 1;
    const onClosingQuote = (quoteAfterValue === '"' || quoteAfterValue === "'") && offset === link.endOffset;

    const tagStart = text.lastIndexOf('<', link.startOffset);
    const templateAttrStart = text.lastIndexOf('template', link.startOffset);
    const onTemplateAttributeName =
      templateAttrStart >= tagStart && isWithin(offset, templateAttrStart, templateAttrStart + 'template'.length);

    if (
      !isWithin(offset, link.startOffset, link.endOffset) &&
      !onOpeningQuote &&
      !onClosingQuote &&
      !onTemplateAttributeName
    ) {
      continue;
    }

    const targetPath = resolveTemplate(link.template, cartridgeRoots);
    if (!targetPath) return undefined;
    return {startOffset: link.startOffset, endOffset: link.endOffset, targetPath};
  }

  const resourceCallRe = /Resource\.msgf?\(\s*(['"])([^'"]+)\1\s*,\s*(['"])([^'"]+)\3/g;
  for (const match of text.matchAll(resourceCallRe)) {
    const full = match[0];
    const key = match[2];
    const bundle = match[4];
    const matchStart = match.index ?? 0;

    const keyStart = matchStart + full.indexOf(key);
    const keyEnd = keyStart + key.length;
    const bundleStart = matchStart + full.lastIndexOf(bundle);
    const bundleEnd = bundleStart + bundle.length;

    if (!isWithin(offset, keyStart, keyEnd) && !isWithin(offset, bundleStart, bundleEnd)) continue;

    const targetPath = resolveResourceBundle(bundle, cartridgeRoots);
    if (!targetPath) return undefined;
    return {startOffset: keyStart, endOffset: keyEnd, targetPath};
  }

  const urlUtilsCallRe = /URLUtils\.(?:url|http|https|abs)\(\s*(['"])([^'"]+)\1/g;
  for (const match of text.matchAll(urlUtilsCallRe)) {
    const full = match[0];
    const action = match[2];
    const matchStart = match.index ?? 0;
    const actionStart = matchStart + full.indexOf(action);
    const actionEnd = actionStart + action.length;
    if (!isWithin(offset, actionStart, actionEnd)) continue;

    const targetPath = resolveController(action, cartridgeRoots);
    if (!targetPath) return undefined;
    return {startOffset: actionStart, endOffset: actionEnd, targetPath};
  }

  const resRenderRe = /res\.render\(\s*(['"])([^'"]+)\1/g;
  for (const match of text.matchAll(resRenderRe)) {
    const full = match[0];
    const template = match[2];
    const matchStart = match.index ?? 0;
    const templateStart = matchStart + full.indexOf(template);
    const templateEnd = templateStart + template.length;
    if (!isWithin(offset, templateStart, templateEnd)) continue;

    const targetPath = resolveTemplate(template, cartridgeRoots);
    if (!targetPath) return undefined;
    return {startOffset: templateStart, endOffset: templateEnd, targetPath};
  }

  const requireCallRe = /require\(\s*(['"])([^'"]+)\1\s*\)/g;
  for (const match of text.matchAll(requireCallRe)) {
    const full = match[0];
    const modulePath = match[2];
    const matchStart = match.index ?? 0;
    const moduleStart = matchStart + full.indexOf(modulePath);
    const moduleEnd = moduleStart + modulePath.length;
    if (!isWithin(offset, moduleStart, moduleEnd)) continue;

    const targetPath = resolveRequireModule(modulePath, cartridgeRoots, documentPath);
    if (!targetPath) return undefined;
    return {startOffset: moduleStart, endOffset: moduleEnd, targetPath};
  }

  return undefined;
}
