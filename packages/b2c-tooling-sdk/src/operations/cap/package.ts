/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Commerce App Package (CAP) packaging.
 *
 * Zips a CAP directory into a distributable .zip file with the correct
 * root directory naming convention ({id}-v{version}/).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import {getLogger} from '../../logging/logger.js';
import {type Logger} from '../../logging/types.js';
import {addDirectoryToZip} from '../util/zip.js';
import {readManifest} from './install.js';
import {type CommerceAppManifest} from './validate.js';

/** Cartridge group directories, relative to `cartridges/`, that CAPs may contain. */
const CARTRIDGE_GROUP_DIRS = ['site_cartridges', 'bm_cartridges'] as const;

/**
 * Options for CAP packaging.
 */
export interface CommerceAppPackageOptions {
  /**
   * Output path for the zip file.
   * - If a directory: zip is written to `{outputPath}/{id}-v{version}.zip`
   * - If a .zip path: written to that exact location
   * - Default: current working directory
   */
  outputPath?: string;
}

/**
 * Result of CAP packaging.
 */
export interface CommerceAppPackageResult {
  /** Absolute path to the produced zip file. */
  outputPath: string;
  /** Parsed manifest. */
  manifest: CommerceAppManifest;
}

/**
 * Packages a CAP directory into a distributable .zip file.
 *
 * The zip root directory is named `{id}-v{version}/` as required by the CAP spec.
 * Reads commerce-app.json to determine the app name and version.
 *
 * @param sourceDir - Path to the CAP directory
 * @param options - Packaging options
 * @returns Result with the output zip path and manifest
 *
 * @example
 * ```typescript
 * const result = await commerceAppPackage('./commerce-avalara-tax-app-v0.2.5');
 * console.log(`Packaged to: ${result.outputPath}`);
 * ```
 */
export async function commerceAppPackage(
  sourceDir: string,
  options: CommerceAppPackageOptions = {},
): Promise<CommerceAppPackageResult> {
  const logger = getLogger();

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }
  if (!fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Source must be a directory: ${sourceDir}`);
  }

  const manifest = readManifest(sourceDir);

  if (!manifest.id || !manifest.version) {
    throw new Error('commerce-app.json must have "id" and "version" fields');
  }

  const archiveDirName = `${manifest.id}-v${manifest.version}`;
  const zipFilename = `${archiveDirName}.zip`;

  // Determine output path
  let outputZipPath: string;
  if (!options.outputPath) {
    outputZipPath = path.resolve(process.cwd(), zipFilename);
  } else {
    const resolved = path.resolve(options.outputPath);
    if (resolved.endsWith('.zip')) {
      outputZipPath = resolved;
    } else {
      outputZipPath = path.join(resolved, zipFilename);
    }
  }

  // Ensure output directory exists
  await fs.promises.mkdir(path.dirname(outputZipPath), {recursive: true});

  ensureCartridgeProjectFiles(sourceDir, logger);

  logger.debug({sourceDir, outputPath: outputZipPath}, `Packaging CAP: ${archiveDirName}`);

  const zip = new JSZip();
  const rootFolder = zip.folder(archiveDirName)!;
  await addDirectoryToZip(rootFolder, sourceDir);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
  });

  await fs.promises.writeFile(outputZipPath, buffer);
  logger.debug({outputPath: outputZipPath}, `CAP packaged to: ${outputZipPath}`);

  return {outputPath: outputZipPath, manifest};
}

/**
 * Ensures every cartridge directory under `cartridges/site_cartridges/` and
 * `cartridges/bm_cartridges/` has a `.project` file, auto-creating an empty
 * one when missing. Existing `.project` files (empty or full Eclipse XML)
 * are left untouched.
 */
function ensureCartridgeProjectFiles(sourceDir: string, logger: Logger): void {
  const cartridgesDir = path.join(sourceDir, 'cartridges');
  if (!fs.existsSync(cartridgesDir)) return;

  for (const groupDir of CARTRIDGE_GROUP_DIRS) {
    const groupPath = path.join(cartridgesDir, groupDir);
    if (!fs.existsSync(groupPath)) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(groupPath, {withFileTypes: true});
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const projectFile = path.join(groupPath, entry.name, '.project');
      if (!fs.existsSync(projectFile)) {
        fs.writeFileSync(projectFile, '');
        logger.debug({projectFile}, `Auto-created empty .project for cartridge: ${groupDir}/${entry.name}`);
      }
    }
  }
}
