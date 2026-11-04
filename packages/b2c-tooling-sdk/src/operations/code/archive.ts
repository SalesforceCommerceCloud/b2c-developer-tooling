/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Streaming cartridge archives and split planning for code deploy.
 *
 * Archives are streamed to a temporary file instead of built in memory, so a
 * multi-gigabyte code version doesn't need multiple gigabytes of RAM. Large
 * deploys are split into several archives that each stay under a byte budget;
 * each is uploaded and unzipped into the same code version.
 *
 * @module operations/code/archive
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import zlib from 'node:zlib';
import JSZip from 'jszip';
import {getLogger} from '../../logging/logger.js';
import {parseByteSize} from '../../utils/byte-size.js';
import type {CartridgeMapping} from './cartridges.js';

/**
 * Default per-archive size limit for code deploy (200 MiB).
 *
 * Salesforce documents a 500 MB limit for a WebDAV push, and some instances
 * reject anything larger outright. Uploads well below that can still be cut
 * off when they take too long, so the default leaves room for slower links.
 */
export const DEFAULT_MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;

/**
 * Largest supported archive. Archives are written without zip64 extensions,
 * so one archive must stay under 4 GiB and {@link MAX_ARCHIVE_ENTRIES} files.
 */
export const MAX_ARCHIVE_BYTES = 4 * 1024 * 1024 * 1024 - 1;

/** Most files one archive can hold without zip64 extensions. */
const MAX_ARCHIVE_ENTRIES = 65_535;

/**
 * Converts the `maxArchiveSize` config value (e.g. `"200mb"`, `"150"`) to
 * bytes, or `undefined` to use {@link DEFAULT_MAX_ARCHIVE_BYTES}.
 *
 * @throws Error if the value is not a valid size
 */
export function maxArchiveBytesFromConfig(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const bytes = parseByteSize(value);
  if (bytes < 1024 * 1024) {
    throw new Error(`Invalid max archive size "${value}": must be at least 1 MiB.`);
  }
  if (bytes > MAX_ARCHIVE_BYTES) {
    throw new Error(`Invalid max archive size "${value}": must be less than 4 GiB.`);
  }
  return bytes;
}

/** Extensions stored without compression: already-compressed formats where DEFLATE only costs time. */
const STORED_EXTENSIONS = new Set([
  '.7z',
  '.aac',
  '.avif',
  '.br',
  '.bz2',
  '.gif',
  '.gz',
  '.jar',
  '.jpeg',
  '.jpg',
  '.m4a',
  '.m4v',
  '.mov',
  '.mp3',
  '.mp4',
  '.ogg',
  '.pdf',
  '.png',
  '.rar',
  '.tgz',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.xz',
  '.zip',
]);

/** Local header + central directory record + data descriptor, without the name. */
const ZIP_ENTRY_OVERHEAD = 30 + 46 + 16;
/** End-of-central-directory record. */
const ZIP_END_OVERHEAD = 22;

/** A file to place in a cartridge archive. */
export interface ArchiveEntry {
  /** Absolute path on disk */
  abs: string;
  /** Path inside the archive (POSIX separators), e.g. `version1/app_custom/cartridge/scripts/a.js` */
  name: string;
  /** On-disk size in bytes */
  size: number;
  /** Whether to DEFLATE this entry (false for already-compressed formats) */
  compress: boolean;
  /** Estimated contribution to the archive size, including headers */
  packedSize: number;
}

/** One archive in a deploy plan. */
export interface ArchivePart {
  /** Entries in this archive */
  entries: ArchiveEntry[];
  /** Destination names of the cartridges with files in this archive */
  cartridges: string[];
  /** Estimated archive size in bytes */
  estimatedBytes: number;
}

/** Options for {@link collectArchiveEntries}. */
export interface CollectEntriesOptions {
  /** Directory names to skip at any depth */
  ignoreDirs: ReadonlySet<string>;
  /**
   * Compute exact DEFLATE sizes for compressible files instead of a
   * conservative estimate. Only needed when planning a split (default: true).
   */
  measure?: boolean;
}

function isStored(fileName: string): boolean {
  return STORED_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

/**
 * Size of `content` after DEFLATE at level 9 (what the archive uses).
 */
function deflatedSize(content: Buffer): number {
  return zlib.deflateRawSync(content, {level: 9}).length;
}

/**
 * Walks each cartridge and returns one entry per file, with its archive name
 * under `<codeVersion>/<dest>/` and its estimated packed size.
 */
export async function collectArchiveEntries(
  cartridges: CartridgeMapping[],
  codeVersion: string,
  options: CollectEntriesOptions,
): Promise<ArchiveEntry[]> {
  const logger = getLogger();
  const measure = options.measure ?? true;
  const entries: ArchiveEntry[] = [];

  async function walk(dir: string, prefix: string): Promise<void> {
    const dirents = await fs.promises.readdir(dir, {withFileTypes: true});
    for (const dirent of dirents) {
      const abs = path.join(dir, dirent.name);
      const name = `${prefix}/${dirent.name}`;
      if (dirent.isDirectory()) {
        if (options.ignoreDirs.has(dirent.name)) {
          logger.debug({path: abs}, `Skipping ignored directory ${abs}`);
          continue;
        }
        await walk(abs, name);
      } else if (dirent.isFile()) {
        const {size} = await fs.promises.stat(abs);
        const compress = !isStored(dirent.name);
        let data = size;
        if (compress && measure && size > 0) {
          data = deflatedSize(await fs.promises.readFile(abs));
        }
        entries.push({
          abs,
          name,
          size,
          compress,
          packedSize: data + ZIP_ENTRY_OVERHEAD + Buffer.byteLength(name) * 2,
        });
      }
    }
  }

  for (const c of cartridges) {
    await walk(c.src, `${codeVersion}/${c.dest}`);
  }
  return entries;
}

/** Destination cartridge name of an archive entry (second path segment). */
function cartridgeOf(entry: ArchiveEntry): string {
  return entry.name.split('/')[1];
}

/**
 * Splits archive entries into parts that each stay under `maxBytes` (and
 * under the per-archive file count limit).
 *
 * Whole cartridges are kept together where they fit, packed in the given
 * cartridge order. A cartridge larger than the budget on its own is split
 * across several parts at file boundaries; this is safe because each part is
 * unzipped into the same code version directory.
 *
 * @throws Error if a single file is larger than `maxBytes`
 */
export function planArchiveParts(entries: ArchiveEntry[], maxBytes: number): ArchivePart[] {
  // Sizes are estimated with zlib; the archive writer's DEFLATE output runs
  // slightly larger (under 0.5%), so keep 1% in reserve.
  const budget = Math.floor(maxBytes * 0.99) - ZIP_END_OVERHEAD;
  const groups = new Map<string, ArchiveEntry[]>();
  for (const entry of entries) {
    const key = cartridgeOf(entry);
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }

  const parts: ArchivePart[] = [];
  let current: ArchivePart = {entries: [], cartridges: [], estimatedBytes: 0};
  const flush = () => {
    if (current.entries.length > 0) {
      current.estimatedBytes += ZIP_END_OVERHEAD;
      parts.push(current);
    }
    current = {entries: [], cartridges: [], estimatedBytes: 0};
  };
  const fits = (bytes: number, count: number) =>
    current.estimatedBytes + bytes <= budget && current.entries.length + count <= MAX_ARCHIVE_ENTRIES;
  const add = (cartridge: string, entry: ArchiveEntry) => {
    current.entries.push(entry);
    current.estimatedBytes += entry.packedSize;
    if (current.cartridges.at(-1) !== cartridge) current.cartridges.push(cartridge);
  };

  for (const [cartridge, group] of groups) {
    const groupBytes = group.reduce((sum, e) => sum + e.packedSize, 0);
    if (groupBytes <= budget && group.length <= MAX_ARCHIVE_ENTRIES) {
      if (!fits(groupBytes, group.length)) flush();
      for (const entry of group) add(cartridge, entry);
      continue;
    }
    // Cartridge larger than one archive: split it at file boundaries.
    for (const entry of group) {
      if (entry.packedSize > budget) {
        throw new Error(
          `File too large for a single deploy archive: ${entry.abs} ` +
            `(${formatBytes(entry.packedSize)} compressed, limit ${formatBytes(maxBytes)}). ` +
            `Raise the archive size limit or remove the file from the cartridge.`,
        );
      }
      if (!fits(entry.packedSize, 1)) flush();
      add(cartridge, entry);
    }
  }
  flush();
  return parts;
}

/** Result of {@link writeArchive}. */
export interface WrittenArchive {
  /** Path of the archive file */
  path: string;
  /** Archive size in bytes */
  bytes: number;
}

/**
 * A readable stream of a file's contents that opens the file only when the
 * archive reaches it, so a large archive never holds every file open at once.
 */
function lazyFileStream(abs: string): Readable {
  return Readable.from(
    (async function* () {
      yield* fs.createReadStream(abs);
    })(),
    {objectMode: false},
  );
}

/**
 * Streams entries into a zip file at `outPath`.
 */
export async function writeArchive(entries: ArchiveEntry[], outPath: string): Promise<WrittenArchive> {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.name, lazyFileStream(entry.abs), {
      binary: true,
      createFolders: false,
      compression: entry.compress ? 'DEFLATE' : 'STORE',
      compressionOptions: entry.compress ? {level: 9} : null,
    });
  }
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    output.on('close', resolve);
    output.on('error', reject);
    zip
      .generateNodeStream({type: 'nodebuffer', streamFiles: true})
      .on('error', (error: Error) => {
        output.destroy();
        reject(error);
      })
      .pipe(output);
  });
  const {size} = await fs.promises.stat(outPath);
  return {path: outPath, bytes: size};
}

/** Creates a private temporary directory for deploy archives. */
export async function createArchiveTempDir(): Promise<string> {
  return fs.promises.mkdtemp(path.join(os.tmpdir(), 'b2c-deploy-'));
}

/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}
