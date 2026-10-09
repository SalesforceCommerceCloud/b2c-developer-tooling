/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Streaming reads must advance sequentially. */

import {open} from 'node:fs/promises';
import {WEBDAV_ROOTS} from '@salesforce/b2c-tooling-sdk/cli';

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
      : 'Server exceeded the requested byte range. Use outputPath to download the file.';
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

/** Decode complete UTF-8 characters and leave any split trailing character for the next range. */
export async function readTextRange(response: Response, offset: number, maxBytes: number) {
  const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range') ?? '');
  const beyondEnd = /^bytes \*\/(\d+)$/.exec(response.headers.get('content-range') ?? '');
  if (response.status === 416 && beyondEnd && offset >= Number(beyondEnd[1])) {
    await response.body?.cancel();
    return {content: '', size: Number(beyondEnd[1]), offset, bytesRead: 0, nextOffset: null};
  }
  if (
    (response.status === 206 && (!range || Number(range[1]) !== offset)) ||
    (response.status === 200 && offset !== 0)
  ) {
    await response.body?.cancel();
    throw new Error('Server did not honor the requested byte range. Use outputPath to download the file.');
  }
  const data = await readFileResponse(response, maxBytes);
  const size = range ? Number(range[3]) : data.length;
  if (range && (Number(range[2]) + 1 !== offset + data.length || Number(range[2]) >= size)) {
    throw new Error('Incomplete or invalid WebDAV byte range. Inspect the file size before retrying.');
  }
  let content: string;
  try {
    content = new TextDecoder('utf8', {fatal: true, ignoreBOM: true}).decode(data, {
      stream: offset + data.length < size,
    });
  } catch {
    throw new Error('Range is not valid UTF-8 text. Use a returned nextOffset, or outputPath for a binary download.');
  }
  if (content.includes('\0')) throw new Error('File appears binary. Use outputPath to download it.');
  const end = offset + Buffer.byteLength(content);
  return {content, size, offset, bytesRead: data.length, nextOffset: end < size ? end : null};
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
