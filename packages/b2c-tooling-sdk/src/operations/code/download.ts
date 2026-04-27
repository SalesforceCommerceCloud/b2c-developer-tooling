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

// Progress helper: fires immediately (0s) then every 5s until stopped
const PROGRESS_INTERVAL_MS = 5_000;
function startProgress(
  phase: DownloadProgressInfo['phase'],
  onProgress?: (info: DownloadProgressInfo) => void,
): () => void {
  const start = Date.now();
  onProgress?.({phase, elapsedSeconds: 0});
  if (!onProgress) return () => {};
  const interval = setInterval(() => {
    onProgress({phase, elapsedSeconds: Math.round((Date.now() - start) / 1000)});
  }, PROGRESS_INTERVAL_MS);
  return () => clearInterval(interval);
}

/**
 * Resolves code version from instance config or OCAPI auto-discovery.
 */
async function resolveCodeVersion(instance: B2CInstance): Promise<string> {
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

  return codeVersion;
}

/**
 * Extracts files from a ZIP archive to disk.
 *
 * @param zip - Loaded JSZip instance
 * @param options - Extraction options
 * @param options.stripPrefix - Number of path segments to strip from ZIP entry paths (e.g. 1 to remove codeVersion, 2 to remove codeVersion + cartridgeName)
 * @param options.outputDirectory - Base output directory
 * @param options.mirror - Map of cartridge names to local paths for mirror extraction
 * @param options.include - Cartridge names to include
 * @param options.exclude - Cartridge names to exclude
 * @returns Set of extracted cartridge names
 */
async function extractZip(
  zip: JSZip,
  options: {
    stripPrefix: number;
    outputDirectory: string;
    cartridgeName?: string;
    mirror?: Map<string, string>;
    include?: string[];
    exclude?: string[];
  },
): Promise<Set<string>> {
  const extractedCartridges = new Set<string>();
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  for (const entry of entries) {
    const parts = entry.name.split('/');
    if (parts.length < options.stripPrefix + 1) {
      continue;
    }

    // Strip the prefix segments
    for (let i = 0; i < options.stripPrefix; i++) {
      parts.shift();
    }

    // Determine cartridge name: either from the next segment or from the option
    const cartridgeName = options.cartridgeName ?? parts.shift()!;
    const relativePath = options.cartridgeName ? parts.join('/') : parts.join('/');

    // Apply filters
    if (options.include?.length && !options.include.includes(cartridgeName)) {
      continue;
    }
    if (options.exclude?.length && options.exclude.includes(cartridgeName)) {
      continue;
    }

    let targetPath: string;
    if (options.mirror?.has(cartridgeName)) {
      targetPath = path.join(options.mirror.get(cartridgeName)!, relativePath);
    } else {
      targetPath = path.join(options.outputDirectory, cartridgeName, relativePath);
    }

    // Preserve existing file permissions
    let existingMode: number | null = null;
    try {
      const stat = await fs.promises.stat(targetPath);
      existingMode = stat.mode;
    } catch {
      // File doesn't exist yet
    }

    await fs.promises.mkdir(path.dirname(targetPath), {recursive: true});
    const content = await entry.async('nodebuffer');
    await fs.promises.writeFile(targetPath, content);

    if (existingMode !== null) {
      await fs.promises.chmod(targetPath, existingMode);
    }

    extractedCartridges.add(cartridgeName);
  }

  return extractedCartridges;
}

/**
 * Downloads a single cartridge from an instance via WebDAV.
 *
 * This is more efficient than downloading the entire code version when only
 * one cartridge is needed, as it ZIPs only the cartridge subdirectory on the server.
 *
 * @param instance - B2C instance to download from
 * @param codeVersion - Code version containing the cartridge
 * @param cartridgeName - Name of the cartridge to download
 * @param outputPath - Local path to extract the cartridge into
 * @param onProgress - Optional progress callback
 */
export async function downloadSingleCartridge(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
  outputPath: string,
  onProgress?: (info: DownloadProgressInfo) => void,
): Promise<void> {
  const logger = getLogger();
  const webdav = instance.webdav;
  const cartridgePath = `Cartridges/${codeVersion}/${cartridgeName}`;
  const zipPath = `${cartridgePath}.zip`;

  let stopProgress = startProgress('zipping', onProgress);
  logger.debug({cartridgeName, codeVersion}, 'Requesting server-side zip for single cartridge...');
  const zipResponse = await webdav.request(cartridgePath, {
    method: 'POST',
    body: ZIP_BODY,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    signal: AbortSignal.timeout(LONG_OPERATION_TIMEOUT_MS),
  });
  stopProgress();

  if (!zipResponse.ok) {
    const text = await zipResponse.text();
    throw new Error(`Failed to create server-side zip: ${zipResponse.status} ${zipResponse.statusText} - ${text}`);
  }

  stopProgress = startProgress('downloading', onProgress);
  const dlResponse = await webdav.request(zipPath, {
    method: 'GET',
    signal: AbortSignal.timeout(LONG_OPERATION_TIMEOUT_MS),
  });
  if (!dlResponse.ok) {
    stopProgress();
    throw new Error(`Failed to download zip: ${dlResponse.status} ${dlResponse.statusText}`);
  }
  const buffer = await dlResponse.arrayBuffer();
  stopProgress();
  logger.debug({size: buffer.byteLength}, `Archive downloaded: ${buffer.byteLength} bytes`);

  // Cleanup server-side zip (best effort)
  onProgress?.({phase: 'cleanup', elapsedSeconds: 0});
  try {
    await webdav.delete(zipPath);
  } catch (error) {
    logger.warn({error, zipPath}, 'Failed to clean up server-side zip (non-fatal)');
  }

  // Extract
  onProgress?.({phase: 'extracting', elapsedSeconds: 0});
  const zip = await JSZip.loadAsync(buffer);
  // Single cartridge ZIP contains: cartridgeName/relative/path...
  await extractZip(zip, {
    stripPrefix: 1,
    outputDirectory: path.dirname(outputPath),
    cartridgeName,
  });

  logger.debug({cartridgeName, codeVersion}, `Downloaded cartridge ${cartridgeName}`);
}

/**
 * Downloads cartridges from an instance via WebDAV.
 *
 * When `include` specifies cartridges, each is downloaded individually using
 * per-cartridge server-side zipping for efficiency. When downloading all
 * cartridges (no include filter), the entire code version is zipped at once.
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
 * // Download specific cartridges (efficient per-cartridge download)
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
  const codeVersion = await resolveCodeVersion(instance);
  const resolvedOutput = path.resolve(outputDirectory);
  const {include, exclude, mirror, onProgress} = options;

  // When specific cartridges are requested, download each individually
  if (include?.length) {
    const allExtracted = new Set<string>();

    for (const cartridgeName of include) {
      if (exclude?.length && exclude.includes(cartridgeName)) continue;

      const outputPath = mirror?.has(cartridgeName)
        ? mirror.get(cartridgeName)!
        : path.join(resolvedOutput, cartridgeName);

      await downloadSingleCartridge(instance, codeVersion, cartridgeName, outputPath, onProgress);
      allExtracted.add(cartridgeName);
    }

    const cartridgeList = [...allExtracted].sort();
    return {cartridges: cartridgeList, codeVersion, outputDirectory: resolvedOutput};
  }

  // Full code version download
  const webdav = instance.webdav;
  const zipPath = `Cartridges/${codeVersion}.zip`;

  let stopProgress = startProgress('zipping', onProgress);
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

  stopProgress = startProgress('downloading', onProgress);
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

  // Cleanup server-side zip (best-effort)
  onProgress?.({phase: 'cleanup', elapsedSeconds: 0});
  try {
    await webdav.delete(zipPath);
    logger.debug('Server-side zip cleaned up');
  } catch (error) {
    logger.warn({error, zipPath}, 'Failed to clean up server-side zip (non-fatal)');
  }

  // Extract
  onProgress?.({phase: 'extracting', elapsedSeconds: 0});
  logger.debug('Extracting archive...');
  const zip = await JSZip.loadAsync(buffer);

  // Full code version ZIP: {codeVersion}/{cartridgeName}/{relativePath...}
  const extractedCartridges = await extractZip(zip, {
    stripPrefix: 1,
    outputDirectory: resolvedOutput,
    mirror,
    exclude,
  });

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
