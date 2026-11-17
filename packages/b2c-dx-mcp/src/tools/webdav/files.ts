/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Streaming reads must advance sequentially. */

import {open, realpath, rm} from 'node:fs/promises';
import path from 'node:path';
/** Accept server-returned job paths as well as paths relative to WebDAV Sites. */
export {normalizeWebDavPath as webdavPath} from '@salesforce/b2c-tooling-sdk/clients';
import {
  readWebDavResponse,
  readWebDavTextRange,
  WebDavReadError,
  type WebDavReadErrorCode,
} from '@salesforce/b2c-tooling-sdk/clients';
import type {Services} from '../../services.js';
import {isPathWithin} from '../../utils/paths.js';

export const MAX_FILE_BYTES = 64 * 1024 * 1024;

/**
 * Largest webdav_get text range. Even dense text (~2 bytes per token after JSON escaping) stays well under
 * Claude Code's default 25,000-token MCP tool output limit.
 */
export const MAX_TEXT_BYTES = 32_000;

/** MCP wording for SDK read errors: say which tool to use instead. */
const TOOL_HINTS: Partial<Record<WebDavReadErrorCode, string>> = {
  binary: 'File appears binary. Use webdav_get_to_file to download it.',
  'invalid-utf8':
    'Range is not valid UTF-8 text. Use a returned nextOffset, or webdav_get_to_file for a binary download.',
  'no-complete-character':
    'Range contains no complete UTF-8 character. Retry later, or use webdav_get_to_file for a binary download.',
  'range-ignored': 'Server did not honor the requested byte range. Use webdav_get_to_file to download the file.',
  'too-large': 'Server exceeded the requested byte range. Use webdav_get_to_file to download the file.',
};

async function withToolHints<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    const hint = error instanceof WebDavReadError ? TOOL_HINTS[error.code] : undefined;
    throw hint ? new Error(hint, {cause: error}) : error;
  }
}

/** Bound range reads even when the response omits or misstates Content-Length. */
export function readFileResponse(response: Response, maxBytes: number): Promise<Buffer> {
  return withToolHints(() => readWebDavResponse(response, maxBytes));
}

/** See `readWebDavTextRange` in the SDK; errors name the MCP tool to use instead. */
export function readTextRange(response: Response, offset: number | undefined, maxBytes: number) {
  return withToolHints(() => readWebDavTextRange(response, offset, maxBytes));
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`WebDAV HTTP ${response.status} ${response.statusText}. Check the path and WebDAV permissions.`);
  }
}

/**
 * Stream a download of any size to a new file (exclusive create, owner-only) and return its size.
 * `onChunk` runs per received chunk, e.g. to refresh an idle timeout. A failed download removes the partial file.
 */
export async function writeResponseToFile(response: Response, outputPath: string, onChunk?: () => void) {
  await assertOk(response);
  const file = await open(outputPath, 'wx', 0o600);
  let size = 0;
  try {
    const reader = response.body?.getReader();
    if (reader) {
      try {
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          onChunk?.();
          await file.writeFile(value);
          size += value.byteLength;
        }
      } finally {
        await reader.cancel();
      }
    }
    await file.close();
  } catch (error) {
    await file.close().catch(() => {});
    await rm(outputPath, {force: true});
    throw error;
  }
  return size;
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
