/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import fs from 'node:fs';
import {watch, type FSWatcher} from 'chokidar';
import JSZip from 'jszip';
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {findCartridges, type CartridgeMapping, type FindCartridgesOptions} from './cartridges.js';
import {getActiveCodeVersion} from './versions.js';

const UNZIP_BODY = new URLSearchParams({method: 'UNZIP'}).toString();

/** Default debounce time in ms for batching file uploads */
const DEFAULT_DEBOUNCE_TIME = parseInt(process.env.SFCC_UPLOAD_DEBOUNCE_TIME ?? '100', 10);

/**
 * Options for watching cartridges.
 */
export interface WatchOptions extends FindCartridgesOptions {
  /** Debounce time in ms for batching file changes */
  debounceTime?: number;
  /** Callback when files are uploaded */
  onUpload?: (files: string[]) => void;
  /** Callback when files are deleted */
  onDelete?: (files: string[]) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Result of starting a watcher.
 */
export interface WatchResult {
  /** The chokidar watcher instance */
  watcher: FSWatcher;
  /** Cartridges being watched */
  cartridges: CartridgeMapping[];
  /** Code version being deployed to */
  codeVersion: string;
  /** Stop watching */
  stop: () => Promise<void>;
}

/**
 * Maps an absolute file path to its cartridge-relative destination.
 */
function fileToCartridgePath(
  absolutePath: string,
  cartridges: CartridgeMapping[],
): {src: string; dest: string} | undefined {
  const cartridge = cartridges.find((c) => absolutePath.startsWith(c.src));

  if (!cartridge) {
    return undefined;
  }

  const relativePath = absolutePath.substring(cartridge.src.length);
  const destPath = path.join(cartridge.dest, relativePath);

  return {
    src: absolutePath,
    dest: destPath,
  };
}

/**
 * Creates a debounced function that batches calls.
 */
function debounce<T extends () => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (() => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      fn();
    }, delay);
  }) as T;
}

/**
 * Watches cartridge directories and syncs changes to an instance.
 *
 * This function:
 * 1. Finds cartridges in the specified directory
 * 2. Sets up file watchers on those directories
 * 3. Batches file changes and uploads them via WebDAV
 * 4. Handles file deletions
 *
 * The watcher uses debouncing to batch rapid changes into single uploads.
 *
 * @param instance - B2C instance to sync to
 * @param directory - Directory containing cartridges
 * @param options - Watch options (filters, callbacks, debounce)
 * @returns Watch result with control methods
 * @throws Error if no cartridges found or watch setup fails
 *
 * @example
 * ```typescript
 * const result = await watchCartridges(instance, './cartridges', {
 *   onUpload: (files) => console.log('Uploaded:', files),
 *   onError: (error) => console.error('Error:', error),
 * });
 *
 * // Later, to stop watching:
 * await result.stop();
 * ```
 */
export async function watchCartridges(
  instance: B2CInstance,
  directory: string,
  options: WatchOptions = {},
): Promise<WatchResult> {
  const logger = getLogger();
  let codeVersion = instance.config.codeVersion;
  const debounceTime = options.debounceTime ?? DEFAULT_DEBOUNCE_TIME;

  // If no code version specified, get the active one
  if (!codeVersion) {
    logger.debug('No code version specified, getting active version...');
    const active = await getActiveCodeVersion(instance);
    if (!active?.id) {
      throw new Error('No code version specified and no active code version found');
    }
    codeVersion = active.id;
    instance.config.codeVersion = codeVersion;
  }

  logger.debug({directory}, 'Finding cartridges to watch...');
  const cartridges = findCartridges(directory, {
    include: options.include,
    exclude: options.exclude,
  });

  if (cartridges.length === 0) {
    throw new Error(`No cartridges found in ${directory}`);
  }

  logger.debug({count: cartridges.length}, `Watching ${cartridges.length} cartridge(s)`);
  for (const c of cartridges) {
    logger.info({cartridge: c.name, path: c.src}, `  ${c.name}`);
  }

  const webdav = instance.webdav;
  const webdavLocation = `Cartridges/${codeVersion}`;
  const cwd = process.cwd();

  // Sets for batching file changes
  const filesToUpload = new Set<string>();
  const filesToDelete = new Set<string>();
  let lastErrorTime = 0;

  /**
   * Processes batched file changes.
   */
  const processChanges = debounce(async () => {
    const now = Date.now();

    // Rate limit on errors
    if (now - lastErrorTime < 5000) {
      logger.debug('Rate limiting after recent error, waiting...');
      return;
    }

    const uploadFiles = Array.from(filesToUpload)
      .map((f) => fileToCartridgePath(f, cartridges))
      .filter((f): f is NonNullable<typeof f> => f !== undefined);

    const deleteFiles = Array.from(filesToDelete)
      .map((f) => fileToCartridgePath(f, cartridges))
      .filter((f): f is NonNullable<typeof f> => f !== undefined);

    filesToUpload.clear();
    filesToDelete.clear();

    // Filter out files that no longer exist
    const validUploadFiles = uploadFiles.filter((f) => {
      if (!fs.existsSync(f.src)) {
        logger.debug({file: f.src}, 'Skipping missing file');
        return false;
      }
      return true;
    });

    // Upload files
    if (validUploadFiles.length > 0) {
      const uploadPath = `${webdavLocation}/_upload-${now}.zip`;

      try {
        const zip = new JSZip();

        for (const f of validUploadFiles) {
          try {
            const content = await fs.promises.readFile(f.src);
            zip.file(f.dest, content);
          } catch (error) {
            logger.warn({file: f.src, error}, 'Failed to add file to archive');
          }
        }

        const buffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: {level: 5},
        });

        await webdav.put(uploadPath, buffer, 'application/zip');
        logger.debug({uploadPath}, 'Archive uploaded');

        const response = await webdav.request(uploadPath, {
          method: 'POST',
          body: UNZIP_BODY,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          throw new Error(`Unzip failed: ${response.status}`);
        }

        await webdav.delete(uploadPath);

        logger.debug(
          {fileCount: validUploadFiles.length, hostname: instance.config.hostname},
          `Uploaded ${validUploadFiles.length} file(s)`,
        );

        options.onUpload?.(validUploadFiles.map((f) => f.dest));
      } catch (error) {
        lastErrorTime = now;
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error({error: err}, `Upload error: ${err.message}`);
        options.onError?.(err);
      }
    }

    // Delete files (filter out recently uploaded to prevent conflicts)
    const recentlyUploadedPaths = new Set(validUploadFiles.map((f) => f.dest));
    const filesToDeleteFiltered = deleteFiles.filter((f) => !recentlyUploadedPaths.has(f.dest));

    if (filesToDeleteFiltered.length > 0) {
      logger.debug({fileCount: filesToDeleteFiltered.length}, `Deleting ${filesToDeleteFiltered.length} file(s)`);

      for (const f of filesToDeleteFiltered) {
        const deletePath = `${webdavLocation}/${f.dest}`;
        try {
          await webdav.delete(deletePath);
          logger.info({file: deletePath}, `Deleted: ${deletePath}`);
        } catch (error) {
          logger.debug({file: deletePath, error}, `Failed to delete ${deletePath}`);
        }
      }

      options.onDelete?.(filesToDeleteFiltered.map((f) => f.dest));
    }
  }, debounceTime);

  // Set up file watcher
  const watcher = watch(
    cartridges.map((c) => c.src),
    {
      ignoreInitial: true,
      cwd,
    },
  );

  watcher.on('all', (event, p) => {
    const fullPath = path.resolve(cwd, p);
    logger.info({event, path: fullPath}, `File event: ${event} ${fullPath}`);

    if (event === 'change' || event === 'add') {
      filesToUpload.add(fullPath);
      processChanges();
    } else if (event === 'unlink') {
      filesToDelete.add(fullPath);
      processChanges();
    }
  });

  watcher.on('error', (err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({error}, 'Watcher error');
    options.onError?.(error);
  });

  logger.debug({hostname: instance.config.hostname, codeVersion}, 'Watching for changes...');

  return {
    watcher,
    cartridges,
    codeVersion,
    stop: async () => {
      await watcher.close();
      logger.debug('Watcher stopped');
    },
  };
}
