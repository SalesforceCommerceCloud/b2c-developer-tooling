/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {watch, type FSWatcher} from 'chokidar';
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {findCartridges, type CartridgeMapping, type FindCartridgesOptions} from './cartridges.js';
import {fileToCartridgePath, uploadFiles} from './upload-files.js';
import {getActiveCodeVersion} from './versions.js';

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
    logger.info({cartridgeName: c.name, path: c.src}, `  ${c.name}`);
  }

  // Re-bind as const so TypeScript knows it's a string inside closures
  const resolvedCodeVersion = codeVersion;
  const cwd = process.cwd();

  // Sets for batching file changes
  const filesToUpload = new Set<string>();
  const filesToDelete = new Set<string>();
  let lastErrorTime = 0;
  let isProcessing = false;

  /**
   * Processes all pending file changes, serializing WebDAV operations.
   * Only one instance runs at a time — if new changes accumulate during
   * processing, the while loop picks them up in the next iteration.
   */
  async function runProcessing(): Promise<void> {
    if (isProcessing) return;
    isProcessing = true;

    try {
      while (filesToUpload.size > 0 || filesToDelete.size > 0) {
        // Rate limit on errors — wait instead of dropping items
        const timeSinceError = Date.now() - lastErrorTime;
        if (timeSinceError < 5000) {
          const waitTime = 5000 - timeSinceError;
          logger.debug({waitTime}, 'Rate limiting after recent error, waiting...');
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        const uploadChanges = Array.from(filesToUpload)
          .map((f) => fileToCartridgePath(f, cartridges))
          .filter((f): f is NonNullable<typeof f> => f !== undefined);

        const deleteChanges = Array.from(filesToDelete)
          .map((f) => fileToCartridgePath(f, cartridges))
          .filter((f): f is NonNullable<typeof f> => f !== undefined);

        filesToUpload.clear();
        filesToDelete.clear();

        try {
          await uploadFiles(instance, resolvedCodeVersion, uploadChanges, deleteChanges, {
            onUpload: options.onUpload,
            onDelete: options.onDelete,
            onError: options.onError,
          });
        } catch {
          lastErrorTime = Date.now();
          // Re-queue so the while loop retries after rate-limit wait
          for (const f of uploadChanges) {
            filesToUpload.add(f.src);
          }
        }
      }
    } finally {
      isProcessing = false;
    }
  }

  const scheduleProcessing = debounce(() => {
    void runProcessing();
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
      filesToDelete.delete(fullPath);
      scheduleProcessing();
    } else if (event === 'unlink') {
      filesToDelete.add(fullPath);
      filesToUpload.delete(fullPath);
      scheduleProcessing();
    }
  });

  watcher.on('error', (err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({error}, 'Watcher error');
    options.onError?.(error);
  });

  logger.debug({server: instance.config.hostname, codeVersion: resolvedCodeVersion}, 'Watching for changes...');

  return {
    watcher,
    cartridges,
    codeVersion: resolvedCodeVersion,
    stop: async () => {
      await watcher.close();
      logger.debug('Watcher stopped');
    },
  };
}
