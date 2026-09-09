/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {lstatSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import type MiniSearch from 'minisearch';
import {createRankedIndex} from '../search/ranking.js';
import {guidanceHeadings} from './markdown.js';
import {GuidanceError} from './types.js';
import type {GuidanceEntry, GuidanceManifest, GuidancePage, GuidanceRead, GuidanceRequest} from './types.js';

const PREFIX = 'skill://';
export const GUIDANCE_MAX_FILE_BYTES = 64 * 1024;
export const GUIDANCE_INDEX_URI = 'skill://index';

/** Canonical resource URI for an inventoried skill file. */
export function guidanceUri(id: string, file: string): string {
  return `${PREFIX}${id}/${file}`;
}

function fail(code: string, message: string): never {
  throw new GuidanceError(code, message);
}

function safePath(value: string): boolean {
  return value.split('/').every((part) => /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(part));
}

/** Reject symlinks at every path component, even when the leaf is inventoried. */
function readSafe(root: string, relative: string): Buffer {
  if (!safePath(relative)) fail('INVALID_PATH', 'Use an inventoried relative Markdown path.');
  let current = root;
  try {
    for (const part of ['', ...relative.split('/')]) {
      current = join(current, part);
      if (lstatSync(current).isSymbolicLink()) fail('INVALID_PATH', 'Symbolic links are not skill files.');
    }
    return readFileSync(current);
  } catch (error) {
    if (error instanceof GuidanceError) throw error;
    return fail('CONTENT_UNAVAILABLE', 'Packaged skills are unavailable; rebuild or reinstall the MCP package.');
  }
}

/**
 * Manifest-backed, offline guidance resolver. Exposure applies to every read,
 * including resource URIs and section reads.
 */
export class GuidanceCatalog {
  private readonly root: string;
  private readonly manifest: GuidanceManifest;
  private readonly entries: Map<string, GuidanceEntry>;
  private searchIndex?: MiniSearch;

  constructor(root: string, options: {allowNonGa?: boolean; collections?: readonly string[]} = {}) {
    this.root = resolve(root);
    const parsed = JSON.parse(readSafe(this.root, 'index.json').toString('utf8')) as GuidanceManifest;
    if (parsed.version !== 1 || !Array.isArray(parsed.collections) || !Array.isArray(parsed.entries)) {
      fail('INVALID_MANIFEST', 'Unsupported skill manifest.');
    }
    const collectionIds = new Set<string>();
    for (const collection of parsed.collections) {
      if (!safePath(collection.id) || collection.id.includes('/') || collectionIds.has(collection.id)) {
        fail('INVALID_MANIFEST', 'Invalid or duplicate skill collection.');
      }
      collectionIds.add(collection.id);
    }
    const ids = new Set<string>();
    for (const entry of parsed.entries) {
      if (
        !safePath(entry.id) ||
        entry.id.split('/').length !== 2 ||
        ids.has(entry.id) ||
        !collectionIds.has(entry.collection) ||
        entry.id.split('/')[0] !== entry.collection ||
        (entry.featured !== undefined && typeof entry.featured !== 'boolean') ||
        !entry.files.some((file) => file.path === entry.entrypoint)
      ) {
        fail('INVALID_MANIFEST', 'Invalid or duplicate skill entry.');
      }
      const paths = new Set<string>();
      for (const file of entry.files) {
        if (!safePath(file.path) || !file.path.endsWith('.md') || paths.has(file.path)) {
          fail('INVALID_MANIFEST', 'Invalid or duplicate skill file.');
        }
        paths.add(file.path);
      }
      ids.add(entry.id);
    }
    const collections = parsed.collections.filter(
      (c) => (c.isGA || options.allowNonGa) && (!options.collections || options.collections.includes(c.id)),
    );
    this.manifest = {
      ...parsed,
      collections,
      entries: parsed.entries.filter((entry) => collections.some((collection) => collection.id === entry.collection)),
    };
    this.entries = new Map(this.manifest.entries.map((entry) => [entry.id, entry]));
  }

  /** Featured entrypoints only; all catalog files remain readable through the template. */
  resources(): {name: string; uri: string; title: string; description: string; mimeType: string}[] {
    return [...this.entries.values()]
      .filter((entry) => entry.featured)
      .map((entry) => ({
        name: entry.id,
        title: entry.title,
        description: entry.description.slice(0, 200),
        uri: guidanceUri(entry.id, entry.entrypoint),
        mimeType: 'text/markdown',
      }));
  }

  /** Resources and tool reads share full-file semantics and the same size limit. */
  readResource(uri: string): string {
    if (uri === GUIDANCE_INDEX_URI) return this.resourceIndex();
    const {id, file} = this.parseUri(uri);
    const {content} = this.resolveFile(id, file);
    return content;
  }

  /** On-demand inventory; descriptions and links only, filtered like every other read. */
  private resourceIndex(): string {
    const lines = ['# B2C Skills', '', `${this.entries.size} skills. Read a linked URI for content.`];
    for (const collection of this.manifest.collections) {
      lines.push('', `## ${collection.id}`, '');
      for (const entry of this.entries.values()) {
        if (entry.collection !== collection.id) continue;
        const words = Array.from(entry.description.replace(/\s+/g, ' ').trim());
        const description =
          words.length > 120
            ? `${words
                .slice(0, 117)
                .join('')
                .replace(/\s+\S*$/, '')}...`
            : words.join('');
        lines.push(`- [${entry.id}](${guidanceUri(entry.id, entry.entrypoint)}): ${description}`);
      }
    }
    const content = `${lines.join('\n')}\n`;
    if (Buffer.byteLength(content) > 64 * 1024)
      fail('CONTENT_TOO_LARGE', 'Skill index exceeds the resource budget. Use skills_read to browse by collection.');
    return content;
  }

  /** List, search, or read with unambiguous selectors and bounded responses. */
  read(request: GuidanceRequest = {}): GuidancePage | GuidanceRead {
    const supplied = Object.keys(request).filter((key) => request[key as keyof GuidanceRequest] !== undefined);
    if (request.uri === GUIDANCE_INDEX_URI) {
      if (supplied.length !== 1)
        fail('INVALID_REQUEST', 'Use the index URI alone; use collection/query to filter the catalog.');
      return this.page({});
    }
    if (request.id !== undefined || request.uri !== undefined) {
      if (request.id !== undefined && request.uri !== undefined) fail('INVALID_REQUEST', 'Use id or uri, not both.');
      if (
        supplied.some((key) => !['id', 'uri', 'file', 'section', 'offset', 'maxLength'].includes(key)) ||
        (request.uri !== undefined && request.file !== undefined)
      ) {
        fail('INVALID_REQUEST', 'Exact reads accept id/file/section or uri/section.');
      }
      const selector = request.uri !== undefined ? this.parseUri(request.uri) : {id: request.id!, file: request.file};
      return this.readContent({
        ...selector,
        section: request.section,
        offset: request.offset,
        maxLength: request.maxLength,
      });
    }
    if (request.file !== undefined || request.section !== undefined || request.maxLength !== undefined)
      fail('INVALID_REQUEST', 'Supply id or uri to read a file or section.');
    return this.page(request);
  }

  private parseUri(uri: string): {id: string; file: string} {
    // Do not URL-normalize dot segments or decode alternate spellings into valid paths.
    if (!uri.startsWith(PREFIX)) fail('INVALID_URI', 'Use a skill:// resource URI.');
    const relative = uri.slice(PREFIX.length);
    if (!safePath(relative) || relative.split('/').length < 3) fail('INVALID_URI', 'Use a canonical skill URI.');
    const [collection, entry, ...parts] = relative.split('/');
    return {id: `${collection}/${entry}`, file: parts.join('/')};
  }

  private resolveFile(id: string, file?: string): {entry: GuidanceEntry; file: string; content: string} {
    if (!safePath(id)) fail('INVALID_PATH', 'Use an exact skill ID from the directory.');
    const entry = this.entries.get(id);
    if (!entry) fail('NOT_FOUND', 'Skill ID is not available. Use skills_read to list or search.');
    const selected = file ?? entry.entrypoint;
    if (!safePath(selected)) fail('INVALID_PATH', 'Use an inventoried relative Markdown path.');
    const metadata = entry.files.find((item) => item.path === selected);
    if (!metadata) fail('NOT_FOUND', 'File is not available. Read the entrypoint to list references.');
    const bytes = readSafe(this.root, `${id}/${selected}`);
    if (bytes.length > GUIDANCE_MAX_FILE_BYTES) {
      fail('CONTENT_TOO_LARGE', 'Skill file exceeds 64 KiB; split the authored skill into references and rebuild.');
    }
    return {entry, file: selected, content: bytes.toString('utf8')};
  }

  private readContent(selector: {
    id: string;
    file?: string;
    section?: string;
    offset?: number;
    maxLength?: number;
  }): GuidanceRead {
    if (
      (selector.offset !== undefined && (!Number.isSafeInteger(selector.offset) || selector.offset < 0)) ||
      (selector.maxLength !== undefined && (!Number.isSafeInteger(selector.maxLength) || selector.maxLength <= 0))
    ) {
      fail('INVALID_REQUEST', 'Use a nonnegative integer offset and a positive integer maxLength.');
    }
    const {entry, file, content} = this.resolveFile(selector.id, selector.file);
    const headings = guidanceHeadings(content);
    const section =
      selector.section === undefined ? undefined : headings.find((heading) => heading.id === selector.section);
    if (selector.section !== undefined && !section)
      fail('SECTION_NOT_FOUND', 'Unknown section. Read the file to list section IDs.');
    const selected = section ? content.slice(section.start, section.end) : content;
    const totalLength = selected.length;
    const offset = Math.min(selector.offset ?? 0, totalLength);
    const slice = selected.slice(offset, offset + (selector.maxLength ?? totalLength));
    const end = offset + slice.length;
    return {
      kind: 'read',
      id: entry.id,
      uri: guidanceUri(entry.id, file),
      source: entry.source.replace(/[^/]+$/, file),
      content: slice,
      totalLength,
      offset,
      ...(end < totalLength && {truncated: true, nextOffset: end}),
      sections: headings.map(({id, title}) => ({id, title})),
      references: entry.files.filter((item) => item.path !== file).map((item) => item.path),
    };
  }

  private page(request: GuidanceRequest): GuidancePage {
    const limit = request.limit ?? (request.query === undefined ? 20 : 5);
    const offset = request.offset ?? 0;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20 || !Number.isSafeInteger(offset) || offset < 0) {
      fail('INVALID_REQUEST', 'Use limit 1-20 and a nonnegative integer offset.');
    }
    if (request.query !== undefined && (!request.query.trim() || request.query.length > 512)) {
      fail('INVALID_REQUEST', 'Use a nonempty query of at most 512 characters.');
    }
    if (request.collection !== undefined && !this.manifest.collections.some((c) => c.id === request.collection)) {
      fail('NOT_FOUND', 'Skill collection is not available.');
    }
    let candidates = [...this.entries.values()].map((entry) => ({entry, score: undefined as number | undefined}));
    if (request.query !== undefined) {
      this.searchIndex ??= createRankedIndex(
        [...this.entries.values()].map((entry) => ({
          id: entry.id,
          title: entry.title,
          category: entry.collection,
          headings: entry.headings,
          summary: entry.description,
        })),
      );
      candidates = this.searchIndex
        .search(request.query)
        .map((hit) => ({
          entry: this.entries.get(String(hit.id))!,
          score:
            hit.score *
            (this.manifest.collections
              .find((c) => c.id === hit.category)
              ?.workspaces?.some((workspace) =>
                (Array.isArray(request.workspace) ? request.workspace : [request.workspace]).includes(workspace),
              )
              ? 1.4
              : 1),
        }))
        .sort((a, b) => b.score! - a.score! || a.entry.id.localeCompare(b.entry.id));
    }
    candidates = candidates.filter(({entry}) => !request.collection || entry.collection === request.collection);
    const result: GuidancePage = {
      kind: request.query === undefined ? 'directory' : 'search',
      collections: this.manifest.collections,
      total: candidates.length,
      offset,
      entries: [],
    };
    for (const {entry, score} of candidates.slice(offset, offset + limit)) {
      result.entries.push({
        id: entry.id,
        title: entry.title,
        description: entry.description.slice(0, 200),
        uri: guidanceUri(entry.id, entry.entrypoint),
        ...(score !== undefined && {score}),
      });
      if (Buffer.byteLength(JSON.stringify(result)) > 7000) {
        result.entries.pop();
        break;
      }
    }
    if (result.entries.length === 0 && offset < candidates.length) {
      fail('CONTENT_TOO_LARGE', 'Skill directory metadata exceeds the response budget; shorten the authored metadata.');
    }
    if (offset + result.entries.length < candidates.length) result.nextOffset = offset + result.entries.length;
    return result;
  }
}
