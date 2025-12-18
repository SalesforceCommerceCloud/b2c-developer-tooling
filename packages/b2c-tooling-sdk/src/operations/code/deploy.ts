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
import {findCartridges, type CartridgeMapping, type FindCartridgesOptions} from './cartridges.js';
import {reloadCodeVersion} from './versions.js';

const UNZIP_BODY = new URLSearchParams({method: 'UNZIP'}).toString();

/**
 * Options for deploying cartridges.
 */
export interface DeployOptions extends FindCartridgesOptions {
  /** Reload (re-activate) the code version after deploy */
  reload?: boolean;
  /** Delete existing cartridges before uploading */
  delete?: boolean;
}

/**
 * Result of a cartridge deployment.
 */
export interface DeployResult {
  /** Cartridges that were deployed */
  cartridges: CartridgeMapping[];
  /** Code version deployed to */
  codeVersion: string;
  /** Whether the code version was reloaded */
  reloaded: boolean;
}

/**
 * Recursively adds a directory to a JSZip instance.
 */
async function addDirectoryToZip(zip: JSZip, dirPath: string, zipPath: string): Promise<void> {
  const entries = await fs.promises.readdir(dirPath, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryZipPath = path.join(zipPath, entry.name);

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, entryZipPath);
    } else if (entry.isFile()) {
      const content = await fs.promises.readFile(fullPath);
      zip.file(entryZipPath, content);
    }
  }
}

/**
 * Deletes cartridges from an instance via WebDAV.
 *
 * This is a low-level function that deletes cartridge directories
 * from the specified code version. Errors are silently ignored for
 * cartridges that don't exist.
 *
 * Requires `instance.config.codeVersion` to be set.
 *
 * @param instance - B2C instance to delete from
 * @param cartridges - Cartridge mappings to delete
 * @throws Error if code version not set
 *
 * @example
 * ```typescript
 * const cartridges = findCartridges('./cartridges');
 * await deleteCartridges(instance, cartridges);
 * ```
 */
export async function deleteCartridges(instance: B2CInstance, cartridges: CartridgeMapping[]): Promise<void> {
  const logger = getLogger();
  const codeVersion = instance.config.codeVersion;

  if (!codeVersion) {
    throw new Error('Code version required for cartridge deletion');
  }

  if (cartridges.length === 0) {
    return;
  }

  const webdav = instance.webdav;

  logger.debug({count: cartridges.length}, `Deleting ${cartridges.length} cartridge(s)...`);
  for (const c of cartridges) {
    const cartridgePath = `Cartridges/${codeVersion}/${c.dest}`;
    try {
      await webdav.delete(cartridgePath);
      logger.debug({cartridge: c.dest}, `Deleted ${cartridgePath}`);
    } catch {
      // Ignore errors - cartridge may not exist
      logger.debug({cartridge: c.dest}, `Could not delete ${cartridgePath} (may not exist)`);
    }
  }
}

/**
 * Uploads cartridges to an instance via WebDAV.
 *
 * This is a low-level upload function that:
 * 1. Creates a zip archive of the cartridges
 * 2. Uploads it to WebDAV
 * 3. Unzips on the server
 * 4. Cleans up the temporary zip file
 *
 * Requires `instance.config.codeVersion` to be set.
 *
 * @param instance - B2C instance to upload to
 * @param cartridges - Cartridge mappings to upload
 * @throws Error if code version not set or upload fails
 *
 * @example
 * ```typescript
 * const cartridges = findCartridges('./cartridges');
 * await uploadCartridges(instance, cartridges);
 * ```
 */
export async function uploadCartridges(instance: B2CInstance, cartridges: CartridgeMapping[]): Promise<void> {
  const logger = getLogger();
  const codeVersion = instance.config.codeVersion;

  if (!codeVersion) {
    throw new Error('Code version required for cartridge upload');
  }

  if (cartridges.length === 0) {
    throw new Error('No cartridges to upload');
  }

  const webdav = instance.webdav;
  const now = Date.now();
  const uploadPath = `Cartridges/_sync-${now}.zip`;

  // Create zip archive
  logger.debug('Creating cartridge archive...');
  const zip = new JSZip();

  for (const c of cartridges) {
    await addDirectoryToZip(zip, c.src, path.join(codeVersion, c.dest));
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
  });
  logger.debug({size: buffer.length}, `Archive created: ${buffer.length} bytes`);

  // Upload archive
  logger.debug({uploadPath}, 'Uploading archive...');
  await webdav.put(uploadPath, buffer, 'application/zip');
  logger.debug('Archive uploaded');

  // Unzip on server
  logger.debug('Unzipping archive on server...');
  const response = await webdav.request(uploadPath, {
    method: 'POST',
    body: UNZIP_BODY,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to unzip archive: ${response.status} ${response.statusText} - ${text}`);
  }
  logger.debug('Archive unzipped');

  // Delete temporary archive
  await webdav.delete(uploadPath);
  logger.debug('Temporary archive deleted');

  logger.debug(
    {hostname: instance.config.hostname, codeVersion, cartridgeCount: cartridges.length},
    `Uploaded ${cartridges.length} cartridges to ${instance.config.hostname}`,
  );
}

/**
 * Finds and deploys cartridges from a directory to an instance.
 *
 * This is a high-level function that orchestrates the deployment process:
 * 1. Finds cartridges in the specified directory (by .project files)
 * 2. Applies include/exclude filters
 * 3. Optionally deletes existing cartridges first
 * 4. Creates a zip archive and uploads via WebDAV
 * 5. Optionally reloads the code version
 *
 * Requires `instance.config.codeVersion` to be set.
 *
 * @param instance - B2C instance to deploy to (must have codeVersion set)
 * @param directory - Directory to search for cartridges
 * @param options - Deploy options (filters, reload, delete)
 * @returns Deploy result with cartridges and status
 * @throws Error if code version not set, no cartridges found, or deployment fails
 *
 * @example
 * ```typescript
 * // Simple deploy
 * const result = await findAndDeployCartridges(instance, './cartridges');
 *
 * // Deploy specific cartridges with reload
 * const result = await findAndDeployCartridges(instance, '.', {
 *   include: ['app_storefront_base'],
 *   reload: true,
 * });
 *
 * // Delete existing cartridges before upload
 * const result = await findAndDeployCartridges(instance, './cartridges', {
 *   delete: true,
 *   reload: true,
 * });
 * ```
 */
export async function findAndDeployCartridges(
  instance: B2CInstance,
  directory: string,
  options: DeployOptions = {},
): Promise<DeployResult> {
  const logger = getLogger();
  const codeVersion = instance.config.codeVersion;

  if (!codeVersion) {
    throw new Error('Code version required for deployment');
  }

  logger.debug({directory}, 'Finding cartridges...');
  const cartridges = findCartridges(directory, {
    include: options.include,
    exclude: options.exclude,
  });

  if (cartridges.length === 0) {
    throw new Error(`No cartridges found in ${directory}`);
  }

  logger.debug({count: cartridges.length}, `Found ${cartridges.length} cartridge(s)`);
  for (const c of cartridges) {
    logger.debug({cartridge: c.name, path: c.src}, `  ${c.name}`);
  }

  // Optionally delete existing cartridges first
  if (options.delete) {
    await deleteCartridges(instance, cartridges);
  }

  // Upload cartridges
  await uploadCartridges(instance, cartridges);

  // Optionally reload
  let reloaded = false;
  if (options.reload) {
    logger.debug('Reloading code version...');
    try {
      await reloadCodeVersion(instance, codeVersion);
      reloaded = true;
    } catch (error) {
      logger.debug({error}, 'Could not reload code version');
    }
  }

  return {
    cartridges,
    codeVersion,
    reloaded,
  };
}
