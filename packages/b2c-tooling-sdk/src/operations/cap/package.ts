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
import {addDirectoryToZip} from '../util/zip.js';
import {readManifest} from './install.js';
import {type CommerceAppManifest} from './validate.js';

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
