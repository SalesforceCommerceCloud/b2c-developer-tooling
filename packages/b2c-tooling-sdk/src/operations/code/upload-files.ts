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
import type {CartridgeMapping} from './cartridges.js';

const UNZIP_BODY = new URLSearchParams({method: 'UNZIP'}).toString();

/**
 * Represents a file to upload or delete, with source and destination paths.
 */
export interface FileChange {
  /** Absolute path to the file on disk */
  src: string;
  /** Cartridge-relative destination path (e.g. "cartridgeName/path/to/file.js") */
  dest: string;
}

/**
 * Callbacks for file upload/delete operations.
 */
export interface UploadFilesOptions {
  /** Called after files are successfully uploaded */
  onUpload?: (files: string[]) => void;
  /** Called after files are successfully deleted */
  onDelete?: (files: string[]) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Maps an absolute file path to its cartridge-relative destination.
 *
 * @param absolutePath - The absolute path to a file
 * @param cartridges - The list of discovered cartridge mappings
 * @returns The file change with src and dest, or undefined if the path is not inside any cartridge
 */
export function fileToCartridgePath(
  absolutePath: string,
  cartridges: CartridgeMapping[],
): FileChange | undefined {
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
 * Uploads and deletes files on an instance via WebDAV.
 *
 * This is the core batch-upload pipeline used by both `watchCartridges` and
 * the VS Code extension. It:
 * 1. Filters out non-existent upload files
 * 2. Creates a ZIP archive of upload files
 * 3. Uploads via WebDAV PUT and unzips on server
 * 4. Deletes files (skipping any that were also uploaded in the same batch)
 *
 * @param instance - B2C instance to sync to
 * @param codeVersion - Code version to deploy to
 * @param uploads - Files to upload
 * @param deletes - Files to delete
 * @param options - Callbacks for upload/delete/error events
 */
export async function uploadFiles(
  instance: B2CInstance,
  codeVersion: string,
  uploads: FileChange[],
  deletes: FileChange[],
  options?: UploadFilesOptions,
): Promise<void> {
  const logger = getLogger();
  const webdav = instance.webdav;
  const webdavLocation = `Cartridges/${codeVersion}`;

  const validUploadFiles = uploads.filter((f) => {
    if (!fs.existsSync(f.src)) {
      logger.debug({file: f.src}, 'Skipping missing file');
      return false;
    }
    return true;
  });

  if (validUploadFiles.length > 0) {
    const uploadPath = `${webdavLocation}/_upload-${Date.now()}.zip`;

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
        {fileCount: validUploadFiles.length, server: instance.config.hostname},
        `Uploaded ${validUploadFiles.length} file(s)`,
      );

      options?.onUpload?.(validUploadFiles.map((f) => f.dest));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error({error: err}, `Upload error: ${err.message}`);
      options?.onError?.(err);
      throw err;
    }
  }

  // Skip deletes for any file that was also uploaded in this batch (disk state wins)
  const uploadedPaths = new Set(validUploadFiles.map((f) => f.dest));
  const filesToDeleteFiltered = deletes.filter((f) => !uploadedPaths.has(f.dest));

  if (filesToDeleteFiltered.length > 0) {
    logger.debug({fileCount: filesToDeleteFiltered.length}, `Deleting ${filesToDeleteFiltered.length} file(s)`);

    for (const f of filesToDeleteFiltered) {
      const deletePath = `${webdavLocation}/${f.dest}`;
      try {
        await webdav.delete(deletePath);
        logger.info({path: deletePath}, `Deleted: ${deletePath}`);
      } catch (error) {
        logger.debug({path: deletePath, error}, `Failed to delete ${deletePath}`);
      }
    }

    options?.onDelete?.(filesToDeleteFiltered.map((f) => f.dest));
  }
}
