/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {getActiveCodeVersion} from './versions.js';

const ZIP_BODY = new URLSearchParams({method: 'ZIP'}).toString();

// 10 minutes — server-side zipping and large downloads can take a long time
const LONG_OPERATION_TIMEOUT_MS = 600_000;

/** Progress info passed to the onProgress callback. */
export interface DownloadProgressInfo {
  /** Current operation phase */
  phase: 'zipping' | 'downloading' | 'cleanup' | 'extracting';
  /** Seconds elapsed since the current phase started */
  elapsedSeconds: number;
}

/**
 * Options for downloading cartridges.
 */
export interface DownloadOptions {
  /** Cartridge names to include (if empty/undefined, all are included) */
  include?: string[];
  /** Cartridge names to exclude */
  exclude?: string[];
  /** When provided, maps cartridge names to local paths for mirror extraction */
  mirror?: Map<string, string>;
  /** Callback for progress updates. Called when a phase starts (elapsedSeconds=0) and periodically thereafter. */
  onProgress?: (info: DownloadProgressInfo) => void;
}

/**
 * Result of a cartridge download.
 */
export interface DownloadResult {
  /** Cartridge names that were extracted */
  cartridges: string[];
  /** Code version downloaded from */
  codeVersion: string;
  /** Output directory where cartridges were extracted (empty string if mirror-only) */
  outputDirectory: string;
}

/**
 * Downloads cartridges from an instance via WebDAV.
 *
 * This function:
 * 1. Triggers server-side zipping of the code version
 * 2. Downloads the zip archive
 * 3. Cleans up the server-side zip (best-effort)
 * 4. Extracts cartridges locally with optional filtering
 *
 * If `instance.config.codeVersion` is not set, attempts to discover the active
 * code version via OCAPI. If that also fails, throws an error.
 *
 * @param instance - B2C instance to download from
 * @param outputDirectory - Directory to extract cartridges into
 * @param options - Download options (filters, mirror)
 * @returns Download result with cartridge names and metadata
 * @throws Error if code version cannot be determined or download fails
 *
 * @example
 * ```typescript
 * // Download all cartridges
 * const result = await downloadCartridges(instance, './output');
 *
 * // Download specific cartridges
 * const result = await downloadCartridges(instance, './output', {
 *   include: ['app_storefront_base'],
 * });
 *
 * // Mirror to local project locations
 * const mirror = new Map([['app_storefront_base', '/project/cartridges/app_storefront_base']]);
 * const result = await downloadCartridges(instance, '.', { mirror });
 * ```
 */
export async function downloadCartridges(
  instance: B2CInstance,
  outputDirectory: string,
  options: DownloadOptions = {},
): Promise<DownloadResult> {
  const logger = getLogger();
  let codeVersion = instance.config.codeVersion;

  if (!codeVersion) {
    logger.debug('No code version configured, attempting to discover active version...');
    try {
      const activeVersion = await getActiveCodeVersion(instance);
      if (activeVersion?.id) {
        codeVersion = activeVersion.id;
        instance.config.codeVersion = codeVersion;
      }
    } catch (error) {
      logger.debug({error}, 'Failed to discover active code version');
    }
    if (!codeVersion) {
      throw new Error(
        'Code version required for download. Configure --code-version or ensure OAuth credentials are available for auto-discovery.',
      );
    }
  }

  const webdav = instance.webdav;
  const zipPath = `Cartridges/${codeVersion}.zip`;
  const resolvedOutput = path.resolve(outputDirectory);
  const {onProgress} = options;

  // Progress helper: fires immediately (0s) then every 5s until stopped
  const PROGRESS_INTERVAL_MS = 5_000;
  function startProgress(phase: DownloadProgressInfo['phase']): () => void {
    const start = Date.now();
    onProgress?.({phase, elapsedSeconds: 0});
    if (!onProgress) return () => {};
    const interval = setInterval(() => {
      onProgress({phase, elapsedSeconds: Math.round((Date.now() - start) / 1000)});
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(interval);
  }

  // Step 1: Trigger server-side zip (can take several minutes for large code versions)
  let stopProgress = startProgress('zipping');
  logger.debug({codeVersion}, 'Requesting server-side zip...');
  const zipResponse = await webdav.request(`Cartridges/${codeVersion}`, {
    method: 'POST',
    body: ZIP_BODY,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    signal: AbortSignal.timeout(LONG_OPERATION_TIMEOUT_MS),
  });
  stopProgress();

  if (!zipResponse.ok) {
    const text = await zipResponse.text();
    throw new Error(`Failed to create server-side zip: ${zipResponse.status} ${zipResponse.statusText} - ${text}`);
  }
  logger.debug('Server-side zip created');

  // Step 2: Download zip archive (can be large)
  stopProgress = startProgress('downloading');
  logger.debug({zipPath}, 'Downloading zip archive...');
  const downloadResponse = await webdav.request(zipPath, {
    method: 'GET',
    signal: AbortSignal.timeout(LONG_OPERATION_TIMEOUT_MS),
  });

  if (!downloadResponse.ok) {
    stopProgress();
    throw new Error(`Failed to download zip: ${downloadResponse.status} ${downloadResponse.statusText}`);
  }

  const buffer = await downloadResponse.arrayBuffer();
  stopProgress();
  logger.debug({size: buffer.byteLength}, `Archive downloaded: ${buffer.byteLength} bytes`);

  // Step 3: Cleanup server-side zip (best-effort)
  onProgress?.({phase: 'cleanup', elapsedSeconds: 0});
  try {
    await webdav.delete(zipPath);
    logger.debug('Server-side zip cleaned up');
  } catch (error) {
    logger.warn({error, zipPath}, 'Failed to clean up server-side zip (non-fatal)');
  }

  // Step 4: Extract locally
  onProgress?.({phase: 'extracting', elapsedSeconds: 0});
  logger.debug('Extracting archive...');
  const zip = await JSZip.loadAsync(buffer);
  const extractedCartridges = new Set<string>();
  const {include, exclude, mirror} = options;

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  for (const entry of entries) {
    const parts = entry.name.split('/');
    if (parts.length < 3) {
      continue;
    }

    // Format: {codeVersion}/{cartridgeName}/{relativePath...}
    parts.shift(); // remove codeVersion
    const cartridgeName = parts.shift()!;
    const relativePath = parts.join('/');

    // Apply filters
    if (include?.length && !include.includes(cartridgeName)) {
      continue;
    }
    if (exclude?.length && exclude.includes(cartridgeName)) {
      continue;
    }

    let targetPath: string;
    if (mirror?.has(cartridgeName)) {
      targetPath = path.join(mirror.get(cartridgeName)!, relativePath);
    } else {
      targetPath = path.join(resolvedOutput, cartridgeName, relativePath);
    }

    // Preserve existing file permissions
    let existingMode: number | null = null;
    try {
      const stat = await fs.promises.stat(targetPath);
      existingMode = stat.mode;
    } catch {
      // File doesn't exist yet
    }

    // Ensure parent directory exists
    await fs.promises.mkdir(path.dirname(targetPath), {recursive: true});

    // Write file
    const content = await entry.async('nodebuffer');
    await fs.promises.writeFile(targetPath, content);

    // Restore permissions if file existed
    if (existingMode !== null) {
      await fs.promises.chmod(targetPath, existingMode);
    }

    extractedCartridges.add(cartridgeName);
  }

  const cartridgeList = [...extractedCartridges].sort();
  logger.debug(
    {server: instance.config.hostname, codeVersion, cartridgeCount: cartridgeList.length},
    `Downloaded ${cartridgeList.length} cartridge(s) from ${instance.config.hostname}`,
  );

  return {
    cartridges: cartridgeList,
    codeVersion,
    outputDirectory: resolvedOutput,
  };
}
