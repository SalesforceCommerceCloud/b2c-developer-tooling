/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Site archive import/export operations for B2C Commerce.
 *
 * Provides functions for importing and exporting site archives using
 * the sfcc-site-archive-import and sfcc-site-archive-export system jobs.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import {glob, hasMagic} from 'glob';
import JSZip from 'jszip';
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {addDirectoryToZip} from '../util/zip.js';
import {waitForJob, JobExecutionError, getJobLog, type JobExecution, type WaitForJobOptions} from './run.js';

const IMPORT_JOB_ID = 'sfcc-site-archive-import';
const EXPORT_JOB_ID = 'sfcc-site-archive-export';

/**
 * Options for site archive import.
 */
export interface SiteArchiveImportOptions {
  /** Keep archive on instance after import (default: false) */
  keepArchive?: boolean;
  /** Whether to wait for job completion (default: true) */
  wait?: boolean;
  /** Wait options for job completion */
  waitOptions?: WaitForJobOptions;
  /**
   * Optional list of paths or glob patterns to include in the archive when
   * importing from a directory. Each entry may be:
   * - An absolute path under the root directory
   * - A path relative to the root directory
   * - A glob pattern (relative to the root) — magic chars `* ? [ ] { }`
   *
   * When omitted, the entire root directory is archived (current behavior).
   * Entries that resolve outside the root directory throw an error.
   * Ignored when target is a zip file, Buffer, or remote filename.
   */
  paths?: string[];
  /**
   * Optional soft size ceiling (in bytes) for the assembled archive. When set
   * along with {@link SiteArchiveImportOptions.onOversize} and the archive
   * exceeds it, the callback is invoked before upload — the import still
   * proceeds. The SDK itself does not warn or block; the consumer decides how
   * to react. Use {@link siteArchiveImportSplit} to split oversized imports.
   */
  maxBytes?: number;
  /**
   * Called before upload when the assembled archive exceeds `maxBytes`. Lets
   * the consumer (e.g. the CLI) surface its own guidance. Receives the archive
   * size and the configured ceiling.
   */
  onOversize?: (info: {bytes: number; maxBytes: number}) => void;
}

/**
 * Result of a site archive import.
 */
export interface SiteArchiveImportResult {
  /** Job execution details */
  execution: JobExecution;
  /** Archive filename on instance */
  archiveFilename: string;
  /** Whether archive was kept on instance */
  archiveKept: boolean;
}

/**
 * Imports a site archive to a B2C Commerce instance.
 *
 * Supports importing from:
 * - A local directory (will be zipped automatically)
 * - A local zip file
 * - A Buffer containing zip data
 * - A filename already on the instance (in Impex/src/instance/)
 *
 * **Buffer handling:** When passing a Buffer, the `archiveName` option controls
 * the contract:
 * - **Without `archiveName`:** The buffer should contain archive entries without
 *   a root directory (e.g. `libraries/mylib/library.xml`). The SDK generates
 *   an archive name and wraps the contents under it.
 * - **With `archiveName`:** The buffer must already be correctly structured with
 *   `archiveName/` as the top-level directory. It is uploaded as-is.
 *
 * @param instance - B2C instance to import to
 * @param target - Source to import (directory path, zip file path, Buffer, or remote filename)
 * @param options - Import options
 * @returns Import result with execution details
 * @throws JobExecutionError if import job fails
 *
 * @example
 * ```typescript
 * // Import from a local directory
 * const result = await siteArchiveImport(instance, './my-site-data');
 *
 * // Import from a zip file
 * const result = await siteArchiveImport(instance, './export.zip');
 *
 * // Import from a buffer (SDK wraps contents automatically)
 * const zip = new JSZip();
 * zip.file('libraries/mylib/library.xml', xmlContent);
 * const buffer = await zip.generateAsync({type: 'nodebuffer'});
 * const result = await siteArchiveImport(instance, buffer);
 *
 * // Import from a buffer with explicit archive name (caller owns structure)
 * const zip = new JSZip();
 * zip.file('my-import/libraries/mylib/library.xml', xmlContent);
 * const buffer = await zip.generateAsync({type: 'nodebuffer'});
 * const result = await siteArchiveImport(instance, buffer, {
 *   archiveName: 'my-import'
 * });
 *
 * // Import from existing file on instance
 * const result = await siteArchiveImport(instance, {
 *   remoteFilename: 'existing-archive.zip'
 * });
 * ```
 */
export async function siteArchiveImport(
  instance: B2CInstance,
  target: string | Buffer | {remoteFilename: string; archiveName?: string},
  options: SiteArchiveImportOptions & {archiveName?: string} = {},
): Promise<SiteArchiveImportResult> {
  const logger = getLogger();
  const {keepArchive = false, wait = true, waitOptions, archiveName, paths, maxBytes, onOversize} = options;

  let zipFilename: string;
  let needsUpload = true;
  let archiveContent: Buffer | NodeJS.ReadableStream | undefined;

  if (paths && paths.length > 0) {
    if (Buffer.isBuffer(target) || (typeof target === 'object' && 'remoteFilename' in target)) {
      throw new Error('paths option is only supported when target is a directory');
    }
  }

  // Handle different input types
  if (typeof target === 'object' && 'remoteFilename' in target) {
    // Remote filename - no upload needed
    zipFilename = target.remoteFilename;
    needsUpload = false;
  } else if (Buffer.isBuffer(target)) {
    if (archiveName) {
      // Caller provides name — buffer must already contain the correct
      // top-level directory structure (archiveName/...).
      const baseName = archiveName.endsWith('.zip') ? archiveName.slice(0, -4) : archiveName;
      zipFilename = `${baseName}.zip`;
      archiveContent = target;
    } else {
      // No name — SDK generates one and wraps the buffer contents under it.
      // The buffer should contain archive entries without a root directory
      // (e.g. libraries/mylib/library.xml, sites/RefArch/site.xml).
      const archiveDirName = `import-${Date.now()}`;
      zipFilename = `${archiveDirName}.zip`;
      archiveContent = await wrapArchiveContents(target, archiveDirName, logger);
    }
  } else {
    // File path - check if directory or zip file
    const targetPath = target as string;

    if (!fs.existsSync(targetPath)) {
      throw new Error(`Target not found: ${targetPath}`);
    }

    const stat = await fs.promises.stat(targetPath);

    if (stat.isFile()) {
      if (paths && paths.length > 0) {
        throw new Error('paths option is only supported when target is a directory');
      }
      // Existing zip file
      archiveContent = await fs.promises.readFile(targetPath);
      zipFilename = path.basename(targetPath);
    } else if (stat.isDirectory()) {
      // Directory - create zip archive
      const timestamp = Date.now();
      const archiveDirName = archiveName || `import-${timestamp}`;
      zipFilename = `${archiveDirName}.zip`;

      if (paths && paths.length > 0) {
        const resolved = await resolveSubsetPaths(targetPath, paths);
        logger.debug(
          {path: targetPath, count: resolved.length},
          `Creating archive from ${resolved.length} path(s) under: ${targetPath}`,
        );
        archiveContent = await createArchiveFromPaths(targetPath, resolved, archiveDirName);
      } else {
        logger.debug({path: targetPath}, `Creating archive from directory: ${targetPath}`);
        archiveContent = await createArchiveFromDirectory(targetPath, archiveDirName);
      }
    } else {
      throw new Error(`Target must be a file or directory: ${targetPath}`);
    }
  }

  // Upload archive if needed
  const uploadPath = `Impex/src/instance/${zipFilename}`;

  // Bubble (do not block, do not warn) when the assembled archive exceeds the
  // configured ceiling so the caller can advise the user. The SDK has no
  // opinion on how to react — that's the consumer's call. Buffers have a known
  // length; streams are not measured here.
  if (maxBytes && onOversize && Buffer.isBuffer(archiveContent) && archiveContent.length > maxBytes) {
    onOversize({bytes: archiveContent.length, maxBytes});
  }

  if (needsUpload && archiveContent) {
    logger.debug({path: uploadPath}, `Uploading archive to ${uploadPath}`);
    await instance.webdav.put(uploadPath, archiveContent as Buffer, 'application/zip');
    logger.debug({path: uploadPath}, `Archive uploaded: ${uploadPath}`);
  }

  // Execute the import job with file_name parameter
  logger.debug(
    {jobId: IMPORT_JOB_ID, file: zipFilename},
    `Executing ${IMPORT_JOB_ID} job with file_name: ${zipFilename}`,
  );

  let execution: JobExecution;

  // Try file_name format first (standard OCAPI format)
  const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
    params: {path: {job_id: IMPORT_JOB_ID}},
    body: {file_name: zipFilename} as unknown as string,
  });

  if (
    error?.fault?.type === 'UnknownPropertyException' &&
    (error.fault.arguments as Record<string, unknown>)?.document === 'job_execution_request'
  ) {
    // Retry with parameters format (internal/support users)
    logger.warn('Retrying with parameters format for internal users');

    const {data: retryData, error: retryError} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: IMPORT_JOB_ID}},
      body: {
        parameters: [{name: 'ImportFile', value: zipFilename}],
      } as unknown as string,
    });

    if (retryError || !retryData) {
      throw new Error(retryError?.fault?.message ?? 'Failed to execute import job');
    }

    execution = retryData;
  } else if (error || !data) {
    throw new Error(error?.fault?.message ?? 'Failed to execute import job');
  } else {
    execution = data;
  }

  logger.debug({jobId: IMPORT_JOB_ID, executionId: execution.id}, `Import job started: ${execution.id}`);

  if (wait) {
    // Wait for completion
    try {
      execution = await waitForJob(instance, IMPORT_JOB_ID, execution.id!, waitOptions);
    } catch (error) {
      if (error instanceof JobExecutionError) {
        // Try to get log file
        try {
          const log = await getJobLog(instance, error.execution);
          logger.error({jobId: IMPORT_JOB_ID, logFile: error.execution.log_file_path, log}, `Job log:\n${log}`);
        } catch {
          logger.error({jobId: IMPORT_JOB_ID}, 'Could not retrieve job log');
        }
      }
      throw error;
    }

    // Clean up archive if not keeping
    if (!keepArchive && needsUpload) {
      await instance.webdav.delete(uploadPath);
      logger.debug({path: uploadPath}, `Archive deleted: ${uploadPath}`);
    }
  }

  return {
    execution,
    archiveFilename: zipFilename,
    archiveKept: wait ? keepArchive : true,
  };
}

/**
 * Resolves a list of user-provided paths/globs against a root directory.
 *
 * Each entry is matched in this order:
 * 1. If it exists as-is (absolute or cwd-relative), use it.
 * 2. Else if it exists when resolved against the root directory, use that.
 * 3. Else if it contains glob magic characters, expand against the root.
 *
 * All resolved paths must live under the root directory.
 */
async function resolveSubsetPaths(rootDir: string, entries: string[]): Promise<string[]> {
  const logger = getLogger();
  const rootAbs = path.resolve(rootDir);
  const matched = new Set<string>();

  for (const entry of entries) {
    const candidates: string[] = [];
    let resolutionMode: 'literal' | 'root-relative' | 'glob';

    // Try literal path resolution first (handles shell-expanded paths)
    const asGiven = path.resolve(entry);
    const asRootRelative = path.resolve(rootAbs, entry);
    if (fs.existsSync(asGiven)) {
      candidates.push(asGiven);
      resolutionMode = 'literal';
    } else if (asGiven !== asRootRelative && fs.existsSync(asRootRelative)) {
      candidates.push(asRootRelative);
      resolutionMode = 'root-relative';
    } else if (hasMagic(entry)) {
      // Glob expansion (always relative to root, not cwd)
      const matches = await glob(entry, {cwd: rootAbs, absolute: true, dot: true, nodir: false});
      if (matches.length === 0) {
        throw new Error(`No files matched pattern: ${entry}`);
      }
      candidates.push(...matches);
      resolutionMode = 'glob';
    } else {
      throw new Error(`Path not found: ${entry}`);
    }

    logger.debug(
      {entry, mode: resolutionMode, matches: candidates.map((c) => path.relative(rootAbs, c))},
      `Resolved "${entry}" (${resolutionMode}) → ${candidates.length} match(es)`,
    );

    for (const candidate of candidates) {
      const rel = path.relative(rootAbs, candidate);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error(`Path is outside import root (${rootAbs}): ${candidate}`);
      }
      matched.add(candidate);
    }
  }

  return [...matched];
}

/**
 * Creates a zip archive from a specific set of files/directories under a root.
 *
 * Each entry's path inside the archive is its location relative to `rootDir`,
 * preserved under `archiveDirName/`. Directories are recursed; files are added
 * as-is.
 */
async function createArchiveFromPaths(rootDir: string, entries: string[], archiveDirName: string): Promise<Buffer> {
  const logger = getLogger();
  const zip = new JSZip();
  const rootFolder = zip.folder(archiveDirName)!;
  const rootAbs = path.resolve(rootDir);

  for (const entry of entries) {
    const stat = await fs.promises.stat(entry);
    const rel = path.relative(rootAbs, entry);
    const relPosix = rel.split(path.sep).join('/');

    if (stat.isDirectory()) {
      // Create the nested folder hierarchy and recurse
      const folder = relPosix ? rootFolder.folder(relPosix)! : rootFolder;
      await addDirectoryToZip(folder, entry);
    } else if (stat.isFile()) {
      const content = await fs.promises.readFile(entry);
      rootFolder.file(relPosix, content);
    }
  }

  // After all entries are added, log the final list of files in the archive so
  // users can verify exactly what was included (especially after directory
  // recursion, which is otherwise opaque from the path arguments alone).
  const archivedFiles = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  logger.debug({count: archivedFiles.length, files: archivedFiles}, `Archive contains ${archivedFiles.length} file(s)`);

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
  });
}

/**
 * Creates a zip archive from a directory.
 */
async function createArchiveFromDirectory(dirPath: string, archiveDirName: string): Promise<Buffer> {
  const zip = new JSZip();
  const rootFolder = zip.folder(archiveDirName)!;

  await addDirectoryToZip(rootFolder, dirPath);

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
  });
}

/**
 * Wraps the contents of a zip buffer under a new top-level directory.
 *
 * The input buffer should contain archive entries without a root directory
 * (e.g. `libraries/mylib/library.xml`). The output will have all entries
 * nested under `archiveDirName/` (e.g. `archiveDirName/libraries/mylib/library.xml`).
 */
async function wrapArchiveContents(
  buffer: Buffer,
  archiveDirName: string,
  logger: ReturnType<typeof getLogger>,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  logger.debug({archiveDirName}, `Wrapping archive contents under ${archiveDirName}/`);

  const newZip = new JSZip();
  const rootFolder = newZip.folder(archiveDirName)!;

  for (const [filePath, entry] of Object.entries(zip.files)) {
    if (!entry.dir) {
      const content = await entry.async('nodebuffer');
      rootFolder.file(filePath, content);
    }
  }

  return newZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
  });
}

/**
 * A file discovered under the import root, with its on-disk and estimated
 * compressed sizes. Compressed size drives bin packing for split imports.
 */
interface SplitFileEntry {
  /** Absolute path on disk. */
  abs: string;
  /** Path relative to the import root, using POSIX separators. */
  rel: string;
  /** On-disk (uncompressed) size in bytes. */
  size: number;
  /** Estimated size contribution inside a zip (compressed + entry overhead). */
  packedSize: number;
}

/**
 * Result of classifying the files under an import root into the two tiers used
 * for split imports.
 */
interface ClassifiedFiles {
  /** Order-sensitive files (XML / metadata) — imported first, kept together. */
  xml: SplitFileEntry[];
  /** Order-independent static resources — deferred to later archive parts. */
  assets: SplitFileEntry[];
}

/**
 * Options for {@link siteArchiveImportSplit}.
 */
export interface SiteArchiveImportSplitOptions {
  /**
   * Maximum size in bytes for each archive part (default: 190 MiB). Parts are
   * packed by estimated compressed size to stay under this ceiling; the
   * instance import limit is the constraint this works around.
   */
  maxBytes?: number;
  /** Keep archive parts on the instance after import (default: false). */
  keepArchive?: boolean;
  /** Wait options applied to each part's import job. */
  waitOptions?: WaitForJobOptions;
  /** Base archive name; parts are suffixed (e.g. `<name>-core`, `<name>-assets-1`). */
  archiveName?: string;
  /** Called when the overall plan is known, before any upload. */
  onPlan?: (plan: SplitImportPlanInfo) => void;
  /** Called before each part begins uploading. */
  onPart?: (info: SplitImportPartInfo) => void;
}

/**
 * Summary of the computed split plan, surfaced via {@link SiteArchiveImportSplitOptions.onPlan}.
 */
export interface SplitImportPlanInfo {
  /** Total number of archive parts that will be imported. */
  partCount: number;
  /** Number of parts containing order-sensitive XML/metadata. */
  xmlPartCount: number;
  /** Number of parts containing deferred static assets. */
  assetPartCount: number;
  /** Per-archive byte ceiling used for packing. */
  maxBytes: number;
}

/**
 * Per-part progress info, surfaced via {@link SiteArchiveImportSplitOptions.onPart}.
 */
export interface SplitImportPartInfo {
  /** 1-based index of this part. */
  index: number;
  /** Total number of parts. */
  total: number;
  /** Tier of this part. */
  kind: 'xml' | 'assets';
  /** Archive filename for this part. */
  filename: string;
  /** Number of files in this part. */
  fileCount: number;
  /** Assembled archive size in bytes. */
  bytes: number;
}

/** Known-incompressible file extensions — packed/estimated as stored (size ≈ on-disk). */
const INCOMPRESSIBLE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.bmp',
  '.tif',
  '.tiff',
  '.zip',
  '.gz',
  '.tgz',
  '.bz2',
  '.xz',
  '.7z',
  '.rar',
  '.mp4',
  '.m4v',
  '.mov',
  '.avi',
  '.webm',
  '.mkv',
  '.mp3',
  '.m4a',
  '.aac',
  '.ogg',
  '.wav',
  '.flac',
  '.pdf',
  '.woff',
  '.woff2',
  '.jar',
  '.swf',
]);

/** Per-entry zip overhead estimate (local + central headers + descriptor), plus 2× name. */
const ZIP_ENTRY_OVERHEAD = 100;

/**
 * Dependency-ordered priority of top-level data-unit directories. Lower runs
 * first when XML must be split across multiple archive parts. Unlisted
 * directories sort after these (still before nothing — appended last).
 */
const UNIT_PRIORITY: Record<string, number> = {
  meta: 0,
  catalogs: 1,
  pricebooks: 2,
  'price-books': 2,
  'inventory-lists': 3,
  inventory: 3,
  libraries: 4,
  sites: 5,
};

/** Human-readable byte size (MiB/KiB/B). */
function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${bytes} B`;
}

/**
 * Estimates the in-archive size of a file: its on-disk size for known
 * incompressible types (stored), or the exact DEFLATE size otherwise. A small
 * per-entry overhead is added to account for zip headers.
 */
async function estimateCompressedSize(abs: string, rel: string, size: number): Promise<number> {
  const ext = path.extname(abs).toLowerCase();
  const overhead = ZIP_ENTRY_OVERHEAD + Buffer.byteLength(rel) * 2;

  if (INCOMPRESSIBLE_EXTENSIONS.has(ext)) {
    return size + overhead;
  }

  const content = await fs.promises.readFile(abs);
  const deflated = zlib.deflateRawSync(content, {level: 9});
  return deflated.length + overhead;
}

/**
 * Walks the import root and classifies every file into the XML (order-sensitive)
 * or asset (deferrable static resource) tier, estimating each file's packed
 * size. A file is treated as a static asset when its path contains a `static/`
 * segment (the canonical location for catalog/library static resources).
 */
async function classifyFiles(rootDir: string): Promise<ClassifiedFiles> {
  const rootAbs = path.resolve(rootDir);
  const xml: SplitFileEntry[] = [];
  const assets: SplitFileEntry[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, {withFileTypes: true});
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const stat = await fs.promises.stat(full);
        const rel = path.relative(rootAbs, full).split(path.sep).join('/');
        const packedSize = await estimateCompressedSize(full, rel, stat.size);
        const fileEntry: SplitFileEntry = {abs: full, rel, size: stat.size, packedSize};
        const segments = rel.split('/');
        const isStatic = segments.includes('static');
        if (isStatic) {
          assets.push(fileEntry);
        } else {
          xml.push(fileEntry);
        }
      }
    }
  }

  await walk(rootAbs);
  return {xml, assets};
}

/**
 * Bin-packs files into groups whose total packed size stays under `budget`,
 * using first-fit-decreasing. Throws if any single file exceeds the budget on
 * its own (it cannot be placed in any archive and the file itself is not split).
 */
function packBySize(entries: SplitFileEntry[], budget: number): SplitFileEntry[][] {
  const sorted = [...entries].sort((a, b) => b.packedSize - a.packedSize);
  const bins: {entries: SplitFileEntry[]; used: number}[] = [];

  for (const entry of sorted) {
    if (entry.packedSize > budget) {
      throw new Error(
        `File too large to fit in a single archive part: ${entry.rel} ` +
          `(${formatBytes(entry.packedSize)} compressed exceeds ${formatBytes(budget)} budget). ` +
          `A single file cannot be split across archives.`,
      );
    }
    const bin = bins.find((b) => b.used + entry.packedSize <= budget);
    if (bin) {
      bin.entries.push(entry);
      bin.used += entry.packedSize;
    } else {
      bins.push({entries: [entry], used: entry.packedSize});
    }
  }

  return bins.map((b) => b.entries);
}

/**
 * Packs order-sensitive XML files into archive parts. When everything fits
 * under `budget`, returns a single part (the preferred outcome — all XML
 * together avoids cross-archive ordering concerns). Otherwise splits at
 * top-level data-unit directory boundaries (e.g. `catalogs`, `libraries`,
 * `sites`) in dependency order, keeping each unit's files together so internal
 * references (e.g. between catalogs) stay in one archive.
 *
 * @throws if a single top-level unit's XML alone exceeds the budget.
 */
function packXml(entries: SplitFileEntry[], budget: number): SplitFileEntry[][] {
  const total = entries.reduce((sum, e) => sum + e.packedSize, 0);
  if (total <= budget) {
    return [entries];
  }

  // Group by top-level directory (the data-unit boundary).
  const groups = new Map<string, SplitFileEntry[]>();
  for (const entry of entries) {
    const top = entry.rel.split('/')[0];
    const group = groups.get(top);
    if (group) {
      group.push(entry);
    } else {
      groups.set(top, [entry]);
    }
  }

  // Order groups by dependency priority, unlisted units last (alphabetical).
  const orderedKeys = [...groups.keys()].sort((a, b) => {
    const pa = UNIT_PRIORITY[a] ?? Number.MAX_SAFE_INTEGER;
    const pb = UNIT_PRIORITY[b] ?? Number.MAX_SAFE_INTEGER;
    return pa !== pb ? pa - pb : a.localeCompare(b);
  });

  const parts: SplitFileEntry[][] = [];
  let current: SplitFileEntry[] = [];
  let currentSize = 0;

  for (const key of orderedKeys) {
    const group = groups.get(key)!;
    const groupSize = group.reduce((sum, e) => sum + e.packedSize, 0);

    if (groupSize > budget) {
      throw new Error(
        `Data unit "${key}" is too large to fit in a single archive part ` +
          `(${formatBytes(groupSize)} compressed exceeds ${formatBytes(budget)} budget). ` +
          `Its XML cannot be split without risking broken internal references; ` +
          `reduce the export scope for this unit or raise --max-size.`,
      );
    }

    if (currentSize + groupSize > budget && current.length > 0) {
      parts.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(...group);
    currentSize += groupSize;
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}

/**
 * Imports a large site archive by splitting it into multiple archive parts that
 * each stay under a size ceiling, then importing them sequentially.
 *
 * This works around the instance-side limit on a single import archive. The
 * strategy:
 * 1. **Order-sensitive XML/metadata** is imported first, kept together in one
 *    archive when it fits (preferred). If it must be split, it splits at
 *    top-level data-unit boundaries in dependency order, never splitting a
 *    single unit — so catalogs (and their internal references) ride together.
 * 2. **Static assets** (catalog/library static resources) are deferred to
 *    subsequent archive parts, bin-packed by compressed size. They are
 *    order-independent and attach to the units created by the XML import.
 *
 * Parts are imported sequentially and the operation stops on the first failure.
 *
 * @param instance - B2C instance to import to
 * @param dir - Local directory to import (must be a directory)
 * @param options - Split import options
 * @returns One import result per archive part, in import order
 * @throws Error if a single file or data unit cannot fit under `maxBytes`
 * @throws JobExecutionError if any part's import job fails
 *
 * @example
 * ```typescript
 * const results = await siteArchiveImportSplit(instance, './big-site-data', {
 *   maxBytes: 190 * 1024 * 1024,
 *   onPart: (p) => console.log(`Part ${p.index}/${p.total}: ${p.kind} (${p.fileCount} files)`),
 * });
 * ```
 */
export async function siteArchiveImportSplit(
  instance: B2CInstance,
  dir: string,
  options: SiteArchiveImportSplitOptions = {},
): Promise<SiteArchiveImportResult[]> {
  const logger = getLogger();
  const {maxBytes = 190 * 1024 * 1024, keepArchive = false, waitOptions, archiveName, onPlan, onPart} = options;

  if (!fs.existsSync(dir)) {
    throw new Error(`Target not found: ${dir}`);
  }
  const stat = await fs.promises.stat(dir);
  if (!stat.isDirectory()) {
    throw new Error('siteArchiveImportSplit requires a directory target');
  }

  // Pack with a safety margin below the ceiling; the post-build assertion is
  // the real guard against estimation drift.
  const budget = Math.floor(maxBytes * 0.95);

  logger.debug({dir, maxBytes, budget}, `Classifying files under ${dir} for split import`);
  const {xml, assets} = await classifyFiles(dir);

  const xmlParts = xml.length > 0 ? packXml(xml, budget) : [];
  const assetParts = assets.length > 0 ? packBySize(assets, budget) : [];

  const baseName = archiveName ?? `import-${Date.now()}`;

  // Build the ordered list of parts: XML first, then assets.
  interface PlannedPart {
    kind: 'xml' | 'assets';
    entries: SplitFileEntry[];
    dirName: string;
  }
  const planned: PlannedPart[] = [];
  xmlParts.forEach((entries, i) => {
    const suffix = xmlParts.length > 1 ? `-xml-${i + 1}` : '-xml';
    planned.push({kind: 'xml', entries, dirName: `${baseName}${suffix}`});
  });
  assetParts.forEach((entries, i) => {
    planned.push({kind: 'assets', entries, dirName: `${baseName}-assets-${i + 1}`});
  });

  if (planned.length === 0) {
    throw new Error(`No files found to import under: ${dir}`);
  }

  onPlan?.({
    partCount: planned.length,
    xmlPartCount: xmlParts.length,
    assetPartCount: assetParts.length,
    maxBytes,
  });
  logger.debug(
    {partCount: planned.length, xmlParts: xmlParts.length, assetParts: assetParts.length},
    `Split plan: ${planned.length} part(s) (${xmlParts.length} xml, ${assetParts.length} asset)`,
  );

  const results: SiteArchiveImportResult[] = [];
  const rootAbs = path.resolve(dir);

  for (let i = 0; i < planned.length; i++) {
    const part = planned[i];
    const buffer = await createArchiveFromPaths(
      rootAbs,
      part.entries.map((e) => e.abs),
      part.dirName,
    );

    // Guard against estimation drift: a part must not exceed the ceiling.
    if (buffer.length > maxBytes) {
      throw new Error(
        `Archive part ${part.dirName} assembled to ${formatBytes(buffer.length)}, ` +
          `which exceeds the ${formatBytes(maxBytes)} limit. ` +
          `This can happen when incompressible data was under-estimated; ` +
          `try a lower --max-size.`,
      );
    }

    onPart?.({
      index: i + 1,
      total: planned.length,
      kind: part.kind,
      filename: `${part.dirName}.zip`,
      fileCount: part.entries.length,
      bytes: buffer.length,
    });
    logger.debug(
      {part: part.dirName, kind: part.kind, files: part.entries.length, bytes: buffer.length},
      `Importing part ${i + 1}/${planned.length}: ${part.dirName} (${formatBytes(buffer.length)})`,
    );

    const result = await siteArchiveImport(instance, buffer, {
      archiveName: part.dirName,
      keepArchive,
      wait: true,
      waitOptions,
    });
    results.push(result);
  }

  return results;
}

/**
 * Configuration for sites in export.
 */
export interface ExportSitesConfiguration {
  ab_tests?: boolean;
  active_data_feeds?: boolean;
  all?: boolean;
  cache_settings?: boolean;
  campaigns_and_promotions?: boolean;
  commerce_feature_states?: boolean;
  content?: boolean;
  coupons?: boolean;
  custom_objects?: boolean;
  customer_cdn_settings?: boolean;
  customer_groups?: boolean;
  distributed_commerce_extensions?: boolean;
  dynamic_file_resources?: boolean;
  gift_certificates?: boolean;
  ocapi_settings?: boolean;
  payment_methods?: boolean;
  payment_processors?: boolean;
  redirect_urls?: boolean;
  search_settings?: boolean;
  shipping?: boolean;
  site_descriptor?: boolean;
  site_preferences?: boolean;
  sitemap_settings?: boolean;
  slots?: boolean;
  sorting_rules?: boolean;
  source_codes?: boolean;
  static_dynamic_alias_mappings?: boolean;
  stores?: boolean;
  tax?: boolean;
  url_rules?: boolean;
}

/**
 * Configuration for global data in export.
 */
export interface ExportGlobalDataConfiguration {
  access_roles?: boolean;
  all?: boolean;
  csc_settings?: boolean;
  csrf_whitelists?: boolean;
  custom_preference_groups?: boolean;
  custom_quota_settings?: boolean;
  custom_types?: boolean;
  geolocations?: boolean;
  global_custom_objects?: boolean;
  job_schedules?: boolean;
  job_schedules_deprecated?: boolean;
  locales?: boolean;
  meta_data?: boolean;
  oauth_providers?: boolean;
  ocapi_settings?: boolean;
  page_meta_tags?: boolean;
  preferences?: boolean;
  price_adjustment_limits?: boolean;
  services?: boolean;
  sorting_rules?: boolean;
  static_resources?: boolean;
  system_type_definitions?: boolean;
  users?: boolean;
  webdav_client_permissions?: boolean;
}

/**
 * Data units configuration for export.
 */
export interface ExportDataUnitsConfiguration {
  /** Catalog static resources to export (catalog_id: true) */
  catalog_static_resources?: Record<string, boolean>;
  /** Catalogs to export (catalog_id: true) */
  catalogs?: Record<string, boolean>;
  /** Customer lists to export (list_id: true) */
  customer_lists?: Record<string, boolean>;
  /** Inventory lists to export (list_id: true) */
  inventory_lists?: Record<string, boolean>;
  /** Library static resources to export (library_id: true) */
  library_static_resources?: Record<string, boolean>;
  /** Libraries to export (library_id: true) */
  libraries?: Record<string, boolean>;
  /** Price books to export (pricebook_id: true) */
  price_books?: Record<string, boolean>;
  /** Sites to export (site_id: ExportSitesConfiguration) */
  sites?: Record<string, Partial<ExportSitesConfiguration> | boolean>;
  /** Global data to export */
  global_data?: Partial<ExportGlobalDataConfiguration>;
}

/**
 * Options for site archive export.
 */
export interface SiteArchiveExportOptions {
  /** Wait options for job completion */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of a site archive export.
 */
export interface SiteArchiveExportResult {
  /** Job execution details */
  execution: JobExecution;
  /** Archive filename on instance */
  archiveFilename: string;
}

/**
 * Exports a site archive from a B2C Commerce instance.
 *
 * @param instance - B2C instance to export from
 * @param dataUnits - Data units configuration specifying what to export
 * @param options - Export options
 * @returns Export result with archive data
 * @throws JobExecutionError if export job fails
 *
 * @example
 * ```typescript
 * // Export global meta data
 * const result = await siteArchiveExport(instance, {
 *   global_data: { meta_data: true }
 * });
 *
 * // Export a site's content
 * const result = await siteArchiveExport(instance, {
 *   sites: {
 *     'RefArch': { content: true, site_preferences: true }
 *   }
 * });
 *
 * // Export catalogs
 * const result = await siteArchiveExport(instance, {
 *   catalogs: { 'storefront-catalog': true }
 * });
 * ```
 */
export async function siteArchiveExport(
  instance: B2CInstance,
  dataUnits: Partial<ExportDataUnitsConfiguration>,
  options: SiteArchiveExportOptions = {},
): Promise<SiteArchiveExportResult> {
  const logger = getLogger();
  const {waitOptions} = options;

  // Generate archive filename
  const timestamp = new Date().toISOString().replace(/[:.-]+/g, '');
  const archiveDirName = `${timestamp}_export`;
  const zipFilename = `${archiveDirName}.zip`;

  logger.debug({jobId: EXPORT_JOB_ID, dataUnits}, `Executing ${EXPORT_JOB_ID} job`);

  let execution: JobExecution;

  // Execute export job - try export_file format first
  {
    const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: EXPORT_JOB_ID}},
      body: {
        export_file: zipFilename,
        data_units: dataUnits,
      } as unknown as string,
    });

    if (
      error?.fault?.type === 'UnknownPropertyException' &&
      (error.fault.arguments as Record<string, unknown>)?.document === 'job_execution_request'
    ) {
      // Retry with parameters format (internal/support users)
      logger.warn('Retrying with parameters format for internal users');

      const {data: retryData, error: retryError} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
        params: {path: {job_id: EXPORT_JOB_ID}},
        body: {
          parameters: [
            {name: 'ExportFile', value: zipFilename},
            {name: 'DataUnits', value: JSON.stringify(dataUnits)},
          ],
        } as unknown as string,
      });

      if (retryError || !retryData) {
        throw new Error(retryError?.fault?.message ?? 'Failed to execute export job');
      }

      execution = retryData;
    } else if (error || !data) {
      throw new Error(error?.fault?.message ?? 'Failed to execute export job');
    } else {
      execution = data;
    }
  }

  logger.debug({jobId: EXPORT_JOB_ID, executionId: execution.id}, `Export job started: ${execution.id}`);

  // Wait for completion
  try {
    execution = await waitForJob(instance, EXPORT_JOB_ID, execution.id!, waitOptions);
  } catch (error) {
    if (error instanceof JobExecutionError) {
      // Try to get log file
      try {
        const log = await getJobLog(instance, error.execution);
        logger.error({jobId: EXPORT_JOB_ID, logFile: error.execution.log_file_path, log}, `Job log:\n${log}`);
      } catch {
        logger.error({jobId: EXPORT_JOB_ID}, 'Could not retrieve job log');
      }
    }
    throw error;
  }

  return {
    execution,
    archiveFilename: zipFilename,
  };
}

/**
 * Exports a site archive and downloads it to memory.
 *
 * Runs the export job on the instance, downloads the archive via WebDAV,
 * and returns the data as a Buffer. Optionally keeps the archive on the instance.
 *
 * @param instance - B2C instance to export from
 * @param dataUnits - Data units configuration specifying what to export
 * @param options - Export and download options
 * @returns Export result with archive data buffer
 *
 * @example
 * ```typescript
 * const result = await siteArchiveExportDownload(instance, {
 *   global_data: { meta_data: true }
 * });
 * const zip = await JSZip.loadAsync(result.data);
 * ```
 */
export async function siteArchiveExportToBuffer(
  instance: B2CInstance,
  dataUnits: Partial<ExportDataUnitsConfiguration>,
  options: SiteArchiveExportOptions & {keepArchive?: boolean} = {},
): Promise<SiteArchiveExportResult & {data: Buffer; archiveKept: boolean}> {
  const logger = getLogger();
  const {keepArchive = false, ...exportOptions} = options;

  const result = await siteArchiveExport(instance, dataUnits, exportOptions);

  // Download archive from instance via WebDAV
  const webdavPath = `Impex/src/instance/${result.archiveFilename}`;
  logger.debug({path: webdavPath}, `Downloading archive: ${webdavPath}`);
  const data = Buffer.from(await instance.webdav.get(webdavPath));

  // Clean up from instance if not keeping
  if (!keepArchive) {
    await instance.webdav.delete(webdavPath);
    logger.debug({path: webdavPath}, `Archive deleted: ${webdavPath}`);
  }

  return {
    ...result,
    data,
    archiveKept: keepArchive,
  };
}

/**
 * Exports a site archive, downloads it, and saves it to a local path.
 *
 * Runs the export job on the instance, downloads the archive via WebDAV,
 * and saves it locally. Optionally keeps the archive on the instance.
 *
 * @param instance - B2C instance to export from
 * @param dataUnits - Data units configuration
 * @param outputPath - Local path to save the archive
 * @param options - Export and download options
 * @returns Export result with local path
 *
 * @example
 * ```typescript
 * // Export and save to a directory (extracts zip)
 * await siteArchiveExportToPath(instance, { global_data: { meta_data: true } }, './exports');
 *
 * // Export and save as zip
 * await siteArchiveExportToPath(instance, { global_data: { meta_data: true } }, './exports/archive.zip');
 * ```
 */
export async function siteArchiveExportToPath(
  instance: B2CInstance,
  dataUnits: Partial<ExportDataUnitsConfiguration>,
  outputPath: string,
  options: SiteArchiveExportOptions & {keepArchive?: boolean; extractZip?: boolean} = {},
): Promise<SiteArchiveExportResult & {localPath: string; archiveKept: boolean}> {
  const logger = getLogger();
  const {extractZip = true, ...downloadOptions} = options;

  const result = await siteArchiveExportToBuffer(instance, dataUnits, downloadOptions);

  // Determine output handling
  const isZipPath = outputPath.endsWith('.zip');

  if (isZipPath || !extractZip) {
    // Save as zip file
    const zipPath = isZipPath ? outputPath : path.join(outputPath, result.archiveFilename);

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(zipPath), {recursive: true});
    await fs.promises.writeFile(zipPath, result.data);

    logger.debug({path: zipPath}, `Archive saved to: ${zipPath}`);

    return {
      ...result,
      localPath: zipPath,
    };
  } else {
    // Extract to directory
    await fs.promises.mkdir(outputPath, {recursive: true});

    const zip = await JSZip.loadAsync(result.data);

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      const fullPath = path.join(outputPath, relativePath);

      if (zipEntry.dir) {
        await fs.promises.mkdir(fullPath, {recursive: true});
      } else {
        // Ensure parent directory exists
        await fs.promises.mkdir(path.dirname(fullPath), {recursive: true});
        const content = await zipEntry.async('nodebuffer');
        await fs.promises.writeFile(fullPath, content);
      }
    }

    logger.debug({path: outputPath}, `Archive extracted to: ${outputPath}`);

    return {
      ...result,
      localPath: outputPath,
    };
  }
}
