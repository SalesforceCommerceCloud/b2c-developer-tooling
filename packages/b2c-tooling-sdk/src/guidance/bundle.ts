/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Build-time bundler for skill guidance. Copies authored skills into a
 * self-contained directory (Markdown files plus `index.json`) that
 * {@link GuidanceCatalog} reads at runtime. Used by the MCP server and the CLI
 * so both package the same skills in the same format.
 *
 * @module guidance/bundle
 */
import {mkdirSync, readFileSync, readdirSync, lstatSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve, sep, isAbsolute} from 'node:path';
import {parseSkillFrontmatter} from '../skills/parser.js';
import {GUIDANCE_MAX_FILE_BYTES} from './catalog.js';
import {guidanceHeadings} from './markdown.js';
import type {GuidanceEntry, GuidanceManifest} from './types.js';

/** A collection source: a repo plugin (`skills/<plugin>/skills`) or a directory. */
export type GuidanceCollectionSource = GuidanceManifest['collections'][number] & {
  /** Plugin name from `skills/plugins.json`. Mutually exclusive with `directory`. */
  plugin?: string;
  /** Directory of skill folders, relative to `baseDirectory`. Mutually exclusive with `plugin`. */
  directory?: string;
};

export interface BundleGuidanceOptions {
  /** Repository root; every source must be inside it. */
  repoRoot: string;
  /** Base for resolving `directory` sources. Defaults to `repoRoot`. */
  baseDirectory?: string;
  collections: GuidanceCollectionSource[];
  /** Entry IDs advertised individually as MCP resources. */
  featuredResources?: string[];
  /** Output directory; replaced entirely on success. */
  destination: string;
}

export interface BundleGuidanceResult {
  entries: number;
  files: number;
}

function markdownFiles(root: string, prefix = ''): string[] {
  if (lstatSync(root).isSymbolicLink()) throw new Error(`Symlink in guidance source: ${root}`);
  const files: string[] = [];
  for (const item of readdirSync(root, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (item.name === 'evals' || item.name.startsWith('.')) continue;
    if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(item.name)) throw new Error(`Invalid guidance path: ${item.name}`);
    if (item.isSymbolicLink()) throw new Error(`Symlink in guidance source: ${item.name}`);
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) files.push(...markdownFiles(join(root, item.name), path));
    else if (item.isFile() && item.name.endsWith('.md')) files.push(path);
  }
  return files;
}

/**
 * Validates skill sources and writes the bundle. Validation completes before
 * anything is written, so a failure preserves the previous bundle.
 */
export function bundleGuidance(options: BundleGuidanceOptions): BundleGuidanceResult {
  const {repoRoot, destination} = options;
  const baseDirectory = options.baseDirectory ?? repoRoot;
  const plugins = JSON.parse(readFileSync(join(repoRoot, 'skills/plugins.json'), 'utf8')) as {
    plugins: {name: string}[];
  };
  const manifest: GuidanceManifest = {version: 1, collections: [], entries: []};
  const contentFiles = new Map<string, Buffer>();

  for (const {plugin, directory, ...collection} of options.collections) {
    if (
      !/^[a-z0-9-]+$/.test(collection.id) ||
      Boolean(plugin) === Boolean(directory) ||
      manifest.collections.some((existing) => existing.id === collection.id)
    ) {
      throw new Error(`Invalid guidance collection ${collection.id}`);
    }
    if (plugin && !plugins.plugins.some((item) => item.name === plugin)) throw new Error(`Unknown plugin ${plugin}`);
    const source = plugin ? join(repoRoot, 'skills', plugin, 'skills') : resolve(baseDirectory, directory!);
    const relativeSource = relative(repoRoot, source);
    if (
      !relativeSource ||
      relativeSource.startsWith(`..${sep}`) ||
      relativeSource === '..' ||
      isAbsolute(relativeSource)
    ) {
      throw new Error('Guidance source must be inside the repository');
    }
    let component = repoRoot;
    for (const part of relativeSource.split(sep)) {
      component = join(component, part);
      if (lstatSync(component).isSymbolicLink()) throw new Error(`Symlink in guidance source: ${component}`);
    }
    manifest.collections.push(collection);
    for (const folder of readdirSync(source, {withFileTypes: true}).sort((a, b) =>
      a.name.localeCompare(b.name, 'en'),
    )) {
      if (folder.isSymbolicLink()) throw new Error(`Symlink in guidance collection: ${folder.name}`);
      if (!folder.isDirectory() || folder.name.startsWith('.')) continue;
      if (!/^[a-z0-9_-]+$/.test(folder.name)) throw new Error(`Invalid guidance entry: ${folder.name}`);
      const entrypoint = 'SKILL.md';
      const root = join(source, folder.name);
      const files = markdownFiles(root);
      if (!files.includes(entrypoint)) throw new Error(`Missing ${entrypoint}: ${root}`);
      const content = readFileSync(join(root, entrypoint), 'utf8');
      const metadata = parseSkillFrontmatter(content);
      if (!metadata) throw new Error(`Invalid guidance frontmatter: ${root}`);
      const id = `${collection.id}/${folder.name}`;
      const entry: GuidanceEntry = {
        id,
        collection: collection.id,
        title: metadata.name,
        description: metadata.description,
        entrypoint,
        source: relative(repoRoot, join(root, entrypoint)).split('\\').join('/'),
        headings: '',
        files: [],
      };
      const headings: string[] = [];
      for (const file of files) {
        const bytes = readFileSync(join(root, file));
        if (bytes.length > GUIDANCE_MAX_FILE_BYTES) {
          throw new Error(`Skill file exceeds 64 KiB: ${id}/${file}. Split it into focused references.`);
        }
        headings.push(...guidanceHeadings(bytes.toString('utf8')).map((heading) => heading.title));
        entry.files.push({path: file, bytes: bytes.length});
        contentFiles.set(`${id}/${file}`, bytes);
      }
      entry.headings = headings.join(' | ');
      manifest.entries.push(entry);
    }
  }

  const resources = options.featuredResources ?? [];
  if (
    !Array.isArray(resources) ||
    new Set(resources).size !== resources.length ||
    resources.some((id) => !manifest.entries.some((entry) => entry.id === id))
  ) {
    throw new Error('Guidance resources must name unique, existing entries');
  }
  for (const entry of manifest.entries) {
    if (resources.includes(entry.id)) entry.featured = true;
  }

  rmSync(destination, {recursive: true, force: true});
  mkdirSync(destination, {recursive: true});
  for (const [file, bytes] of contentFiles) {
    const target = join(destination, file);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, bytes);
  }
  writeFileSync(join(destination, 'index.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return {entries: manifest.entries.length, files: contentFiles.size};
}
