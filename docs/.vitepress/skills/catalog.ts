/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SKILL_NAME_LENGTH = 64;
const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const EXCLUDED_DIRECTORIES = new Set(['evals', '.git', 'node_modules']);

interface SkillFile {
  name: string;
  bytes: Buffer;
}

interface CatalogEntry {
  name: string;
  version: string;
  files: string[];
}

/** Reject links and special files before traversing the source tree */
function requireType(file: string, directory = false): void {
  const info = fs.lstatSync(file);
  if (info.isSymbolicLink()) throw new Error(`Cannot publish symbolic link: ${file}`);
  if (directory ? !info.isDirectory() : !info.isFile()) throw new Error(`Invalid skill source: ${file}`);
}

/** Keep names compatible with native skill IDs and collection URL segments */
function validName(name: unknown): name is string {
  return typeof name === 'string' && name.length <= MAX_SKILL_NAME_LENGTH && NAME.test(name);
}

/** Inventory verbatim assets in a deterministic order, excluding release evaluations */
function readFiles(directory: string, prefix = ''): SkillFile[] {
  requireType(directory, true);
  const files: SkillFile[] = [];
  for (const name of fs.readdirSync(directory).sort()) {
    if (EXCLUDED_DIRECTORIES.has(name)) continue;
    const relative = prefix + name;
    if (name.trim() !== name || /[\\?#%:\x00-\x1f\x7f]/.test(relative)) {
      throw new Error(`Unsafe skill file path: ${relative}`);
    }
    const source = path.join(directory, name);
    const info = fs.lstatSync(source);
    if (info.isSymbolicLink()) throw new Error(`Cannot publish symbolic link: ${source}`);
    if (info.isDirectory()) files.push(...readFiles(source, relative + '/'));
    else {
      requireType(source);
      files.push({name: relative, bytes: fs.readFileSync(source)});
    }
  }
  return files;
}

/** Generate native OpenCode catalogs without modifying authored skill sources */
export function generateSkillCatalogs(sourceDirectory: string, outputDirectory: string): void {
  requireType(sourceDirectory, true);
  const packageFile = path.join(sourceDirectory, 'package.json');
  const registryFile = path.join(sourceDirectory, 'plugins.json');
  requireType(packageFile);
  requireType(registryFile);
  const {version} = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (typeof version !== 'string' || !STABLE_VERSION.test(version)) throw new Error('Invalid skills package version');
  const {plugins} = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  if (!Array.isArray(plugins) || !plugins.length) throw new Error('Invalid or empty skills registry');
  const collections = new Set<string>();
  const skillNames = new Set<string>();
  const catalogs: {collection: string; entries: CatalogEntry[]; assets: {name: string; files: SkillFile[]}[]}[] = [];
  for (const plugin of plugins) {
    const collection = plugin?.name;
    if (!validName(collection)) throw new Error('Invalid skill collection name');
    if (collections.has(collection)) throw new Error(`Duplicate skill collection: ${collection}`);
    collections.add(collection);
    const collectionDirectory = path.join(sourceDirectory, collection);
    requireType(collectionDirectory, true);
    const skillsDirectory = path.join(collectionDirectory, 'skills');
    requireType(skillsDirectory, true);
    const entries: CatalogEntry[] = [];
    const assets: {name: string; files: SkillFile[]}[] = [];
    for (const name of fs.readdirSync(skillsDirectory).sort()) {
      if (name === 'index.json') {
        requireType(path.join(skillsDirectory, name));
        continue;
      }
      if (EXCLUDED_DIRECTORIES.has(name)) continue;
      if (!validName(name)) throw new Error(`Invalid skill name: ${name}`);
      if (skillNames.has(name)) throw new Error(`Duplicate skill name across collections: ${name}`);
      const files = readFiles(path.join(skillsDirectory, name));
      const instructions = files.find((file) => file.name === 'SKILL.md');
      const metadata = instructions ? matter(instructions.bytes.toString('utf8')).data : {};
      if (metadata.name !== name || typeof metadata.description !== 'string' || !metadata.description.trim()) {
        throw new Error(`Invalid skill metadata: ${collection}/${name}`);
      }
      skillNames.add(name);
      const digest = createHash('sha256');
      for (const file of files) {
        digest.update(JSON.stringify([file.name, file.bytes.length]) + '\n');
        digest.update(file.bytes);
      }
      entries.push({name, version: `${version}-${digest.digest('hex')}`, files: files.map((file) => file.name)});
      assets.push({name, files});
    }
    if (!entries.length) throw new Error(`Empty skill collection: ${collection}`);
    catalogs.push({collection, entries, assets});
  }

  // Validate every collection before replacing any generated output
  fs.mkdirSync(path.dirname(outputDirectory), {recursive: true});
  const staging = fs.mkdtempSync(path.join(path.dirname(outputDirectory), '.opencode-catalog-'));
  try {
    for (const {collection, entries, assets} of catalogs) {
      const destination = path.join(staging, collection);
      fs.mkdirSync(destination);
      for (const skill of assets) {
        for (const file of skill.files) {
          const target = path.join(destination, skill.name, file.name);
          fs.mkdirSync(path.dirname(target), {recursive: true});
          fs.writeFileSync(target, file.bytes);
        }
      }
      fs.writeFileSync(path.join(destination, 'index.json'), JSON.stringify({skills: entries}, null, 2) + '\n');
    }
    fs.rmSync(outputDirectory, {recursive: true, force: true});
    fs.renameSync(staging, outputDirectory);
  } finally {
    fs.rmSync(staging, {recursive: true, force: true});
  }
}
