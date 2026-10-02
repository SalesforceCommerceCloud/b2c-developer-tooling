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
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, readdirSync, lstatSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, posix, relative, resolve, sep, isAbsolute} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import yaml from 'js-yaml';
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
  /**
   * Require every `skill://` URI to name a bundled file. Disable for a partial
   * bundle whose skills reference collections bundled elsewhere. Defaults to `true`.
   */
  checkSkillUris?: boolean;
  /** Output directory; replaced entirely on success. */
  destination: string;
}

export interface BundleGuidanceResult {
  entries: number;
  files: number;
}

const DOCS_SITE = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/';

/** Agent Skills frontmatter, kept verbatim as JSON for the MCP skills extension. */
function skillFrontmatter(content: string, folder: string, where: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(content);
  if (!match) throw new Error(`Missing SKILL.md frontmatter: ${where}`);
  let parsed: unknown;
  try {
    parsed = yaml.load(match[1]);
  } catch (error) {
    throw new Error(`Invalid SKILL.md frontmatter YAML: ${where}: ${(error as Error).message}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`SKILL.md frontmatter must be a mapping: ${where}`);
  }
  const frontmatter = parsed as Record<string, unknown>;
  // The JSON round-trip is the check; structuredClone would keep Dates.
  if (!isDeepStrictEqual(JSON.parse(JSON.stringify(frontmatter)), frontmatter)) {
    throw new Error(`SKILL.md frontmatter must be JSON-compatible (quote dates and similar values): ${where}`);
  }
  const {name, description} = frontmatter;
  if (typeof name !== 'string' || name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Skill name must be 1-64 lowercase letters, digits, and single hyphens: ${where}`);
  }
  if (name !== folder) throw new Error(`Skill name "${name}" must equal its directory "${folder}": ${where}`);
  if (typeof description !== 'string' || !description.trim() || description.length > 1024) {
    throw new Error(`Skill description must be 1-1024 characters: ${where}`);
  }
  return frontmatter;
}

/** Link targets outside fenced code: [text](target). */
function markdownLinks(content: string): string[] {
  return [...content.replaceAll(/^(```|~~~)[\s\S]*?^\1/gm, '').matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]);
}

/**
 * Skills install and serve independently: relative links stay inside the skill,
 * other skills are referenced by name or skill:// URI, and tooling docs use Markdown URLs.
 */
function validateLinks(manifest: GuidanceManifest, contentFiles: Map<string, Buffer>, checkSkillUris: boolean): void {
  const bundled = new Set([...contentFiles.keys()].map((file) => `skill://${file}`));
  for (const entry of manifest.entries) {
    for (const {path} of entry.files) {
      const where = `${entry.id}/${path}`;
      const content = contentFiles.get(where)!.toString('utf8');
      for (const [uri] of content.matchAll(/skill:\/\/[\w./-]*\w/g)) {
        if (checkSkillUris && uri !== 'skill://index' && !bundled.has(uri))
          throw new Error(`Unknown skill URI ${uri} in ${where}`);
      }
      for (const target of markdownLinks(content)) {
        const [location] = target.split('#');
        if (!location || location.startsWith('skill://')) continue;
        if (location.startsWith(DOCS_SITE)) {
          const page = location.slice(DOCS_SITE.length);
          if (page && page !== 'llms.txt' && !page.endsWith('.md')) {
            throw new Error(`Link tooling docs to the Markdown page (${page}.md) in ${where}`);
          }
        } else if (!/^[a-z][a-z0-9+.-]*:/i.test(location)) {
          const resolved = posix.normalize(posix.join(posix.dirname(path), location));
          if (resolved.startsWith('../') || !entry.files.some((file) => file.path === resolved)) {
            throw new Error(
              `Relative link ${target} in ${where} must resolve to a file in the same skill; reference other skills by name`,
            );
          }
        }
      }
    }
  }
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
      const id = `${collection.id}/${folder.name}`;
      const frontmatter = skillFrontmatter(readFileSync(join(root, entrypoint), 'utf8'), folder.name, id);
      const entry: GuidanceEntry = {
        id,
        collection: collection.id,
        title: frontmatter.name as string,
        description: frontmatter.description as string,
        entrypoint,
        frontmatter,
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
        entry.files.push({
          path: file,
          bytes: bytes.length,
          digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
        });
        contentFiles.set(`${id}/${file}`, bytes);
      }
      entry.headings = headings.join(' | ');
      manifest.entries.push(entry);
    }
  }

  // Names label skills for hosts; keep them unique across every bundled collection.
  const names = new Map<string, string>();
  for (const entry of manifest.entries) {
    const other = names.get(entry.title);
    if (other) throw new Error(`Duplicate skill name "${entry.title}": ${other} and ${entry.id}`);
    names.set(entry.title, entry.id);
  }
  validateLinks(manifest, contentFiles, options.checkSkillUris ?? true);

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
