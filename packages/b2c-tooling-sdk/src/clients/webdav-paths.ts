/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * WebDAV roots, path normalization and bounded text range reads.
 *
 * @module clients/webdav-paths
 */

/* eslint-disable no-await-in-loop -- Streaming reads must advance sequentially. */

/**
 * WebDAV root location identifiers.
 *
 * These map to the standard B2C Commerce WebDAV directories.
 */
export const WEBDAV_ROOTS = {
  IMPEX: 'Impex',
  TEMP: 'Temp',
  CARTRIDGES: 'Cartridges',
  REALMDATA: 'Realmdata',
  CATALOGS: 'Catalogs',
  LIBRARIES: 'Libraries',
  STATIC: 'Static',
  DYNAMIC: 'Dynamic',
  LOGS: 'Logs',
  SECURITYLOGS: 'Securitylogs',
} as const;

/** Key of {@link WEBDAV_ROOTS}. */
export type WebDavRootKey = keyof typeof WEBDAV_ROOTS;

/** Why a WebDAV path or text read was rejected. */
export type WebDavReadErrorCode =
  | 'binary'
  | 'invalid-path'
  | 'invalid-range'
  | 'invalid-utf8'
  | 'no-complete-character'
  | 'range-ignored'
  | 'too-large';

/** Thrown by {@link normalizeWebDavPath}, {@link readWebDavResponse} and {@link readWebDavTextRange}. */
export class WebDavReadError extends Error {
  readonly code: WebDavReadErrorCode;

  constructor(code: WebDavReadErrorCode, message: string) {
    super(message);
    this.name = 'WebDavReadError';
    this.code = code;
  }
}

const INVALID_PATH = 'Use a WebDAV path without URLs, traversal, or query parameters.';
const CONTENT_RANGE = /^bytes (\d+)-(\d+)\/(\d+)$/;
const UNSATISFIED_RANGE = /^bytes \*\/(\d+)$/;

/**
 * Normalizes a WebDAV path to the form {@link WebDavClient} methods take:
 * relative to `/webdav/Sites/`, starting with a known root (matched without
 * case, returned in its canonical case), each segment URL-encoded.
 *
 * Accepts server-returned paths (`/Sites/LOGS/jobs/...`,
 * `/on/demandware.servlet/webdav/Sites/...`). Rejects traversal (`.`, `..`),
 * empty segments, control characters, and `%`, `?`, `#`, `:` or `\` in a segment.
 *
 * @throws WebDavReadError with code `invalid-path`
 */
export function normalizeWebDavPath(input: string): string {
  const stripped = input.replace(/^\/(?:on\/demandware.servlet\/webdav\/)?Sites\//i, '').replace(/^\//, '');
  let parts: string[];
  try {
    parts = stripped
      .replace(/\/$/, '')
      .split('/')
      .map((part) => decodeURIComponent(part));
  } catch {
    throw new WebDavReadError('invalid-path', INVALID_PATH);
  }
  // eslint-disable-next-line no-control-regex -- Reject control characters in remote paths.
  if (parts.some((part) => !part || part === '.' || part === '..' || /[\\/\u0000-\u001F%?#:]/.test(part))) {
    throw new WebDavReadError('invalid-path', INVALID_PATH);
  }
  const root = Object.values(WEBDAV_ROOTS).find((value) => value.toLowerCase() === parts[0].toLowerCase());
  if (!root)
    throw new WebDavReadError('invalid-path', `Start the path with ${Object.values(WEBDAV_ROOTS).join(', ')}.`);
  return [root, ...parts.slice(1)].map((part) => encodeURIComponent(part)).join('/');
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`WebDAV HTTP ${response.status} ${response.statusText}. Check the path and WebDAV permissions.`);
  }
}

/**
 * Reads a WebDAV response body, failing once it exceeds `maxBytes` even when
 * the server omits or misstates `Content-Length`.
 *
 * @throws Error for a non-2xx response; WebDavReadError (`too-large`) past `maxBytes`
 */
export async function readWebDavResponse(response: Response, maxBytes: number): Promise<Buffer> {
  const limitMessage = 'Server exceeded the requested byte range.';
  await assertOk(response);
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) {
    await response.body?.cancel();
    throw new WebDavReadError('too-large', limitMessage);
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
      if (size > maxBytes) throw new WebDavReadError('too-large', limitMessage);
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks, size);
}

/** One range of text read by {@link readWebDavTextRange}. */
export interface WebDavTextRange {
  /** Decoded text: complete UTF-8 characters only. */
  content: string;
  /** Total file size in bytes. */
  size: number;
  /** Byte offset where `content` starts. */
  offset: number;
  /** Bytes received, including any partial character left for the next read. */
  bytesRead: number;
  /** Offset to continue from, or `null` at the end of the file. */
  nextOffset: number | null;
}

/**
 * Decodes a ranged WebDAV text response, leaving a split trailing UTF-8
 * character for the next range. With `offset` undefined the response is a
 * suffix (tail) range, and the start comes from `Content-Range`.
 *
 * @throws WebDavReadError when the range is ignored or invalid, or the bytes are not UTF-8 text
 */
export async function readWebDavTextRange(
  response: Response,
  offset: number | undefined,
  maxBytes: number,
): Promise<WebDavTextRange> {
  const tail = offset === undefined;
  const contentRange = response.headers.get('content-range') ?? '';
  const range = CONTENT_RANGE.exec(contentRange);
  const beyondEnd = UNSATISFIED_RANGE.exec(contentRange);
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
    throw new WebDavReadError('range-ignored', 'Server did not honor the requested byte range.');
  }
  const data = await readWebDavResponse(response, maxBytes);
  const size = range ? Number(range[3]) : data.length;
  const end = start + data.length;
  if (range && (Number(range[2]) + 1 !== end || Number(range[2]) >= size || (tail && end !== size))) {
    throw new WebDavReadError(
      'invalid-range',
      'Incomplete or invalid WebDAV byte range. Inspect the file size before retrying.',
    );
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
    throw new WebDavReadError('invalid-utf8', 'Range is not valid UTF-8 text. Continue from a returned nextOffset.');
  }
  if (content.includes('\0')) throw new WebDavReadError('binary', 'File appears binary.');
  const next = begin + Buffer.byteLength(content);
  if (next === begin && data.length > skipped) {
    throw new WebDavReadError('no-complete-character', 'Range contains no complete UTF-8 character. Retry later.');
  }
  return {content, size, offset: begin, bytesRead: data.length, nextOffset: next < size ? next : null};
}

/** Options for {@link WebDavClient.getTextRange}. */
export interface WebDavTextRangeOptions {
  /** Byte offset to read from (default `0`). Ignored when `tail` is set. */
  offset?: number;
  /** Read the last `maxBytes` of the file instead, e.g. recent log lines. */
  tail?: boolean;
  /** Most bytes to read. */
  maxBytes: number;
  /** Cancels the request. */
  signal?: AbortSignal;
}
