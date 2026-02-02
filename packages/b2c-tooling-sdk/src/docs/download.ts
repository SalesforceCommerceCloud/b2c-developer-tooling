/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import type {B2CInstance} from '../instance/index.js';
import {BasicAuthStrategy} from '../auth/basic.js';
import {getLogger} from '../logging/logger.js';

/**
 * Options for downloading documentation.
 */
export interface DownloadDocsOptions {
  /** Output directory for extracted docs */
  outputDir: string;
  /** Keep the downloaded archive file (default: false) */
  keepArchive?: boolean;
}

/**
 * Result of a documentation download.
 */
export interface DownloadDocsResult {
  /** Path where docs were extracted */
  outputPath: string;
  /** Number of files extracted */
  fileCount: number;
  /** Archive filename if kept */
  archivePath?: string;
}

/**
 * Downloads documentation archive from a B2C instance.
 *
 * The archive is available at a special URL:
 * `https://{hostname}:443/on/demandware.servlet/WFS/Studio/Sites/mock/demandware-mock.zip`
 *
 * The outer zip contains `DWAPP-*.API-doc.zip` which contains `sfdocs/script-api/` with markdown docs.
 *
 * @param instance - B2C instance to download from
 * @param options - Download options
 * @returns Download result with extraction details
 * @throws Error if download fails or credentials are missing
 *
 * @example
 * ```typescript
 * const instance = B2CInstance.fromEnvironment();
 * const result = await downloadDocs(instance, {
 *   outputDir: './docs',
 *   keepArchive: true,
 * });
 * console.log(`Downloaded ${result.fileCount} files`);
 * ```
 */
export async function downloadDocs(instance: B2CInstance, options: DownloadDocsOptions): Promise<DownloadDocsResult> {
  const logger = getLogger();
  const {outputDir, keepArchive = false} = options;

  // Require basic auth for this endpoint
  if (!instance.auth.basic) {
    throw new Error('WebDAV credentials (username/password) required for docs download');
  }

  const authStrategy = new BasicAuthStrategy(instance.auth.basic.username, instance.auth.basic.password);

  // Build the special docs URL (not standard WebDAV path)
  const hostname = instance.config.webdavHostname || instance.config.hostname;
  const docsUrl = `https://${hostname}:443/on/demandware.servlet/WFS/Studio/Sites/mock/demandware-mock.zip`;

  logger.debug({url: docsUrl}, 'Downloading documentation archive');

  const response = await authStrategy.fetch(docsUrl);

  if (!response.ok) {
    throw new Error(`Failed to download docs: ${response.status} ${response.statusText}`);
  }

  const outerZipBuffer = Buffer.from(await response.arrayBuffer());
  logger.debug({size: outerZipBuffer.length}, 'Downloaded outer archive');

  // Extract outer zip to find DWAPP-*.API-doc.zip
  const outerZip = await JSZip.loadAsync(outerZipBuffer);

  // Find the API doc zip file
  const apiDocEntry = Object.keys(outerZip.files).find((name) => name.match(/DWAPP-.*API-doc\.zip$/i));

  if (!apiDocEntry) {
    throw new Error('API documentation archive not found in downloaded package');
  }

  logger.debug({entry: apiDocEntry}, 'Found API documentation archive');

  // Extract inner zip content
  const innerZipBuffer = await outerZip.files[apiDocEntry].async('nodebuffer');
  const innerZip = await JSZip.loadAsync(innerZipBuffer);

  // Create output directory
  await fs.promises.mkdir(outputDir, {recursive: true});

  // Extract sfdocs/script-api/*.md files (flat, no subdirectories)
  let fileCount = 0;
  const scriptApiPrefix = 'sfdocs/script-api/';

  for (const [relativePath, zipEntry] of Object.entries(innerZip.files)) {
    if (!relativePath.startsWith(scriptApiPrefix) || zipEntry.dir) {
      continue;
    }

    // Only extract .md files
    if (!relativePath.endsWith('.md')) {
      continue;
    }

    // Get just the filename (strip the prefix)
    const filename = relativePath.slice(scriptApiPrefix.length);
    const outputPath = path.join(outputDir, filename);

    const content = await zipEntry.async('nodebuffer');
    await fs.promises.writeFile(outputPath, content);
    fileCount++;
  }

  logger.debug({fileCount}, 'Extracted documentation files');

  const result: DownloadDocsResult = {
    outputPath: outputDir,
    fileCount,
  };

  if (keepArchive) {
    const archivePath = path.join(outputDir, 'demandware-mock.zip');
    await fs.promises.writeFile(archivePath, outerZipBuffer);
    result.archivePath = archivePath;
    logger.debug({archivePath}, 'Saved archive');
  }

  return result;
}
