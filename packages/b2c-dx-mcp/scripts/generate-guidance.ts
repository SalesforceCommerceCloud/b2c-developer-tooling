/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {mkdirSync, readFileSync, readdirSync, lstatSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve, sep, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  guidanceHeadings,
  GUIDANCE_MAX_FILE_BYTES,
  type GuidanceCollection,
  type GuidanceEntry,
  type GuidanceManifest,
} from '@salesforce/b2c-tooling-sdk/guidance';
import {parseSkillFrontmatter} from '@salesforce/b2c-tooling-sdk/skills';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const destination = join(packageRoot, 'content/guidance');
const config = JSON.parse(readFileSync(join(repoRoot, 'guidance/collections.json'), 'utf8')) as {
  version: number;
  featuredResources?: string[];
  collections: (GuidanceCollection & {plugin?: string; directory?: string})[];
};
const plugins = JSON.parse(readFileSync(join(repoRoot, 'skills/plugins.json'), 'utf8')) as {plugins: {name: string}[]};
const manifest: GuidanceManifest = {version: 1, collections: [], entries: []};
const contentFiles = new Map<string, Buffer>();

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

if (config.version !== 1) throw new Error('Unsupported guidance collections manifest');
for (const {plugin, directory, ...collection} of config.collections) {
  if (
    !/^[a-z0-9-]+$/.test(collection.id) ||
    Boolean(plugin) === Boolean(directory) ||
    manifest.collections.some((existing) => existing.id === collection.id)
  ) {
    throw new Error(`Invalid guidance collection ${collection.id}`);
  }
  if (plugin && !plugins.plugins.some((item) => item.name === plugin)) throw new Error(`Unknown plugin ${plugin}`);
  const source = plugin ? join(repoRoot, 'skills', plugin, 'skills') : resolve(repoRoot, directory!);
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
  for (const folder of readdirSync(source, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
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

const resources = config.featuredResources ?? [];
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

// Generate only after all sources validate, so failures preserve the last bundle.
rmSync(destination, {recursive: true, force: true});
mkdirSync(destination, {recursive: true});
for (const [file, bytes] of contentFiles) {
  const target = join(destination, file);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, bytes);
}
writeFileSync(join(destination, 'index.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Bundled ${manifest.entries.length} guidance entries and ${contentFiles.size} Markdown files.\n`);
