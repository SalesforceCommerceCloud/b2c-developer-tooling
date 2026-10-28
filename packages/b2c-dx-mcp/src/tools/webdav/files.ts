/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Streaming reads must advance sequentially. */

import {open, realpath} from 'node:fs/promises';
import path from 'node:path';
import {WEBDAV_ROOTS} from '@salesforce/b2c-tooling-sdk/cli';
import type {Services} from '../../services.js';
import {isPathWithin} from '../../utils/paths.js';

export const MAX_FILE_BYTES = 64 * 1024 * 1024;

/** Accept server-returned job paths as well as paths relative to WebDAV Sites. */
export function webdavPath(input: string): string {
  const stripped = input.replace(/^\/(?:on\/demandware.servlet\/webdav\/)?Sites\//i, '').replace(/^\//, '');
  const parts = stripped
    .replace(/\/$/, '')
    .split('/')
    .map((part) => decodeURIComponent(part));
  // eslint-disable-next-line no-control-regex -- Reject control characters in remote paths.
  if (parts.some((part) => !part || part === '.' || part === '..' || /[\\/\u0000-\u001F%?#:]/.test(part))) {
    throw new Error('Use a WebDAV path without URLs, traversal, or query parameters.');
  }
  const root = Object.values(WEBDAV_ROOTS).find((value) => value.toLowerCase() === parts[0].toLowerCase());
  if (!root) throw new Error(`Start the path with ${Object.values(WEBDAV_ROOTS).join(', ')}.`);
  return [root, ...parts.slice(1)].map((part) => encodeURIComponent(part)).join('/');
}

/** Bound downloads even when the response omits or misstates Content-Length. */
export async function readFileResponse(response: Response, maxBytes = MAX_FILE_BYTES): Promise<Buffer> {
  const limitMessage =
    maxBytes === MAX_FILE_BYTES
      ? 'File exceeds the 64 MiB transfer limit.'
      : 'Server exceeded the requested byte range. Use webdav_get_to_file to download the file.';
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`WebDAV HTTP ${response.status} ${response.statusText}. Check the path and WebDAV permissions.`);
  }
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) {
    await response.body?.cancel();
    throw new Error(limitMessage);
  }
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error(limitMessage);
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks, size);
}

/**
 * Decode complete UTF-8 characters and leave any split trailing character for the next range.
 * With `offset` undefined, the response is a suffix (tail) range and the start comes from Content-Range.
 */
export async function readTextRange(response: Response, offset: number | undefined, maxBytes: number) {
  const tail = offset === undefined;
  const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range') ?? '');
  const beyondEnd = /^bytes \*\/(\d+)$/.exec(response.headers.get('content-range') ?? '');
  if (response.status === 416 && beyondEnd && (tail || offset >= Number(beyondEnd[1]))) {
    await response.body?.cancel();
    const size = Number(beyondEnd[1]);
    return {content: '', size, offset: offset ?? size, bytesRead: 0, nextOffset: null};
  }
  const start = range ? Number(range[1]) : 0;
  if (
    (response.status === 206 && (!range || (!tail && start !== offset))) ||
    (response.status === 200 && !tail && offset !== 0)
  ) {
    await response.body?.cancel();
    throw new Error('Server did not honor the requested byte range. Use webdav_get_to_file to download the file.');
  }
  const data = await readFileResponse(response, maxBytes);
  const size = range ? Number(range[3]) : data.length;
  const end = start + data.length;
  if (range && (Number(range[2]) + 1 !== end || Number(range[2]) >= size || (tail && end !== size))) {
    throw new Error('Incomplete or invalid WebDAV byte range. Inspect the file size before retrying.');
  }
  // A tail range can begin inside a multi-byte character; skip its continuation bytes (0x80-0xBF).
  let skipped = 0;
  if (tail && start > 0) {
    while (skipped < Math.min(3, data.length) && data[skipped] >= 0x80 && data[skipped] <= 0xbf) skipped++;
  }
  const begin = start + skipped;
  let content: string;
  try {
    // Always stream: a trailing partial character (next range, or a log mid-append) is left for nextOffset.
    content = new TextDecoder('utf8', {fatal: true, ignoreBOM: true}).decode(data.subarray(skipped), {stream: true});
  } catch {
    throw new Error(
      'Range is not valid UTF-8 text. Use a returned nextOffset, or webdav_get_to_file for a binary download.',
    );
  }
  if (content.includes('\0')) throw new Error('File appears binary. Use webdav_get_to_file to download it.');
  const next = begin + Buffer.byteLength(content);
  if (next === begin && data.length > skipped) {
    throw new Error(
      'Range contains no complete UTF-8 character. Retry later, or use webdav_get_to_file for a binary download.',
    );
  }
  return {content, size, offset: begin, bytesRead: data.length, nextOffset: next < size ? next : null};
}

/**
 * Resolve a local MCP-host path inside the project directory, following symlinks.
 * For `create`, the parent directory must exist inside the project; the file itself must not exist
 * (callers open it with the exclusive `wx` flag, which also refuses a symlink at that name).
 */
export async function resolveLocalPath(
  services: Services,
  pathArg: string,
  projectDirectory: string | undefined,
  {create = false}: {create?: boolean} = {},
): Promise<string> {
  const resolved = services.resolveWithProjectDirectory(pathArg, projectDirectory);
  const root = await realpath(services.resolveProjectDirectory(projectDirectory).path);
  const actual = create
    ? path.join(await realpath(path.dirname(resolved)), path.basename(resolved))
    : await realpath(resolved);
  if (!isPathWithin(root, actual)) {
    throw new Error(`Path must be within the project directory (${root}): ${pathArg}`);
  }
  return actual;
}

export async function readLocalFile(path: string): Promise<Buffer> {
  const file = await open(path, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_FILE_BYTES) throw new Error('Source must be a file of at most 64 MiB.');
    // Read one byte past the limit to detect a growing file without unbounded allocation.
    const chunks: Buffer[] = [];
    let size = 0;
    while (true) {
      const buffer = Buffer.alloc(Math.min(64 * 1024, MAX_FILE_BYTES + 1 - size));
      const {bytesRead} = await file.read(buffer);
      if (!bytesRead) break;
      size += bytesRead;
      if (size > MAX_FILE_BYTES) throw new Error('Source exceeds the 64 MiB transfer limit.');
      chunks.push(buffer.subarray(0, bytesRead));
    }
    return Buffer.concat(chunks, size);
  } finally {
    await file.close();
  }
}
