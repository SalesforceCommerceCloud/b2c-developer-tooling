/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {siteArchiveExportToBuffer} from '../jobs/site-archive.js';
import {Library, LibraryNode} from './library.js';
import type {
  FetchContentLibraryOptions,
  FetchContentLibraryResult,
  ContentExportOptions,
  ContentExportResult,
} from './types.js';

/**
 * Fetch and parse a content library from an instance (or local file).
 *
 * Returns the parsed Library and optionally the raw archive data.
 * No filesystem side effects.
 *
 * @param instance - B2C instance to fetch from
 * @param libraryId - Library ID (or site ID if isSiteLibrary is true)
 * @param options - Fetch options
 * @returns Parsed library and optional archive data
 *
 * @example
 * ```typescript
 * // Fetch from instance
 * const { library } = await fetchContentLibrary(instance, 'SharedLibrary');
 *
 * // Filter and traverse
 * library.filter(n => n.id === 'homepage');
 * const xml = await library.toXMLString({ traverseHidden: false });
 *
 * // Use local file instead
 * const { library } = await fetchContentLibrary(instance, 'SharedLibrary', {
 *   libraryFile: './library.xml'
 * });
 * ```
 */
export async function fetchContentLibrary(
  instance: B2CInstance,
  libraryId: string,
  options: FetchContentLibraryOptions = {},
): Promise<FetchContentLibraryResult> {
  const logger = getLogger();
  const {libraryFile, isSiteLibrary = false, assetQuery = ['image.path'], keepOrphans = false, waitOptions} = options;

  const libraryEntry = isSiteLibrary ? `sites/${libraryId}/library/library.xml` : `libraries/${libraryId}/library.xml`;

  let libraryXML: string;
  let archiveData: Buffer | undefined;

  if (libraryFile) {
    logger.info({libraryFile}, `Reading library from local file: ${libraryFile}`);
    libraryXML = await fs.promises.readFile(libraryFile, 'utf8');
  } else {
    logger.info(
      {libraryId, isSiteLibrary, hostname: instance.config.hostname},
      `Exporting library ${libraryId} from ${instance.config.hostname}...`,
    );

    const dataUnits = isSiteLibrary ? {sites: {[libraryId]: {content: true}}} : {libraries: {[libraryId]: true}};

    const result = await siteArchiveExportToBuffer(instance, dataUnits, {waitOptions});

    archiveData = result.data;
    const zip = await JSZip.loadAsync(result.data);

    // Find the library XML in the archive (it's nested under a timestamped directory)
    let libraryFile_: JSZip.JSZipObject | null = null;
    for (const [filePath, entry] of Object.entries(zip.files)) {
      if (filePath.endsWith(libraryEntry)) {
        libraryFile_ = entry;
        break;
      }
    }

    if (!libraryFile_) {
      throw new Error(
        `Library ${libraryId} not found in archive; for non-shared libraries use the --site-library option`,
      );
    }

    libraryXML = await libraryFile_.async('string');
  }

  logger.debug('Parsing library content...');
  const library = await Library.parse(libraryXML, {assetQuery, keepOrphans});

  return {library, archiveData};
}

/**
 * Export specific pages (with component trees and assets) to a local directory.
 *
 * This is a convenience function that:
 * 1. Fetches/parses the library via {@link fetchContentLibrary}
 * 2. Filters by page ID (exact or regex), optionally by folder
 * 3. Downloads static assets via WebDAV (concurrent, with progress)
 * 4. Writes filtered XML and assets to the output directory
 *
 * @param instance - B2C instance
 * @param pageIds - Page content IDs to export
 * @param libraryId - Library ID (or site ID if isSiteLibrary)
 * @param outputPath - Output directory path
 * @param options - Export options
 * @returns Export result with statistics
 *
 * @example
 * ```typescript
 * const result = await exportContent(
 *   instance,
 *   ['homepage', 'about-us'],
 *   'SharedLibrary',
 *   './export',
 * );
 * console.log(`Exported ${result.pageCount} pages, ${result.componentCount} components`);
 * ```
 */
export async function exportContent(
  instance: B2CInstance,
  pageIds: string[],
  libraryId: string,
  outputPath: string,
  options: ContentExportOptions = {},
): Promise<ContentExportResult> {
  const logger = getLogger();
  const {
    isSiteLibrary = false,
    assetQuery = ['image.path'],
    libraryFile,
    offline = false,
    folders = [],
    regex = false,
    keepOrphans = false,
    waitOptions,
    onAssetProgress,
  } = options;

  // Step 1: Fetch and parse library
  const {library} = await fetchContentLibrary(instance, libraryId, {
    libraryFile,
    isSiteLibrary,
    assetQuery,
    keepOrphans,
    waitOptions,
  });

  // Step 2: Build matchers from content IDs
  const matchers: Array<string | RegExp> = regex ? pageIds.map((p) => new RegExp(p)) : pageIds;

  function matchesId(id: string): boolean {
    return matchers.some((matcher) => (matcher instanceof RegExp ? matcher.test(id) : id === matcher));
  }

  // Step 3: Filter root children (pages/content) by ID and optionally by folder
  library.filter((node) => {
    if (node.type !== 'PAGE' && node.type !== 'CONTENT') {
      return false;
    }

    if (!matchesId(node.id)) {
      return false;
    }

    // Optional folder filtering
    if (folders.length > 0) {
      const xmlData = node.xml;
      if (!xmlData) return false;

      const folderLinks = xmlData['folder-links'] as Array<Record<string, unknown>> | undefined;
      const classificationLink = folderLinks?.find(
        (l) => (l['classification-link'] as Array<Record<string, unknown>>)?.[0],
      );
      const folderId = (
        (classificationLink?.['classification-link'] as Array<Record<string, unknown>>)?.[0]?.['$'] as Record<
          string,
          string
        >
      )?.['folder-id'];

      if (!folderId || !folders.includes(folderId)) {
        return false;
      }
    }

    return true;
  });

  // Step 3b: Promote matching components to root level
  const allNodes = [...library.nodes({traverseHidden: true, callbackHidden: true})];
  for (const node of allNodes) {
    if (node.type === 'COMPONENT' && matchesId(node.id)) {
      library.promoteToRoot(node as LibraryNode);
    }
  }

  // Step 4: Count pages, content, and components
  let pageCount = 0;
  let contentCount = 0;
  let componentCount = 0;
  library.traverse(
    (node) => {
      if (node.type === 'PAGE') pageCount++;
      else if (node.type === 'CONTENT') contentCount++;
      else if (node.type === 'COMPONENT') componentCount++;
    },
    {traverseHidden: false},
  );

  // Step 5: Collect static asset paths
  const filesToDownload = new Set<string>();
  library.traverse(
    (node) => {
      if (node.type === 'STATIC') {
        filesToDownload.add(node.id);
      }
    },
    {traverseHidden: false},
  );

  // Step 6: Generate output structure
  const libraryEntry = isSiteLibrary ? `sites/${libraryId}/library/library.xml` : `libraries/${libraryId}/library.xml`;

  const downloadedAssets: string[] = [];
  const failedAssets: {path: string; error: string}[] = [];

  // Step 7: Download assets (unless offline)
  if (!offline && filesToDownload.size > 0) {
    logger.info({count: filesToDownload.size}, `Downloading ${filesToDownload.size} asset(s)...`);

    const assetArray = [...filesToDownload];
    const concurrency = 5;

    // Process assets with limited concurrency
    for (let i = 0; i < assetArray.length; i += concurrency) {
      const batch = assetArray.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(async (filename) => {
          const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
          const webdavPath = isSiteLibrary
            ? `Libraries/${libraryId}/default/${cleanFilename}`
            : `Libraries/${libraryId}/default/${cleanFilename}`;

          logger.debug({filename: cleanFilename}, `Downloading ${cleanFilename}`);

          const data = await instance.webdav.get(webdavPath);

          // Write to output directory
          const outputFilePath = isSiteLibrary
            ? path.join(outputPath, 'sites', libraryId, 'library', 'static', 'default', cleanFilename)
            : path.join(outputPath, 'libraries', libraryId, 'static', 'default', cleanFilename);

          await fs.promises.mkdir(path.dirname(outputFilePath), {recursive: true});
          await fs.promises.writeFile(outputFilePath, Buffer.from(data));

          return cleanFilename;
        }),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const filename = batch[j];
        const idx = i + j;

        if (result.status === 'fulfilled') {
          downloadedAssets.push(result.value);
          onAssetProgress?.(filename, idx, assetArray.length, true);
        } else {
          const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
          logger.warn({filename, error: errorMessage}, `Failed to download asset: ${filename}`);
          failedAssets.push({path: filename, error: errorMessage});
          onAssetProgress?.(filename, idx, assetArray.length, false);
        }
      }
    }
  }

  // Step 8: Write filtered library XML
  const xmlString = await library.toXMLString({traverseHidden: false});
  const xmlOutputPath = path.join(outputPath, libraryEntry);
  await fs.promises.mkdir(path.dirname(xmlOutputPath), {recursive: true});
  await fs.promises.writeFile(xmlOutputPath, xmlString, 'utf8');

  return {
    library,
    outputPath,
    downloadedAssets,
    failedAssets,
    pageCount,
    contentCount,
    componentCount,
  };
}
