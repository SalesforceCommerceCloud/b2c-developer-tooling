/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
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
  /** Reject missing/unreadable files instead of skipping them. */
  strict?: boolean;
  /** Maximum total uncompressed upload bytes. */
  maxBytes?: number;
  /** Report cleanup failures after a successful upload without replaying writes. */
  onWarning?: (message: string) => void;
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
export function fileToCartridgePath(absolutePath: string, cartridges: CartridgeMapping[]): FileChange | undefined {
  const cartridge = cartridges.find((c) => {
    const relative = path.relative(c.src, absolutePath);
    return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  });

  if (!cartridge) {
    return undefined;
  }

  const relativePath = path.relative(cartridge.src, absolutePath);
  const destPath = path.join(cartridge.dest, relativePath).split(path.sep).join('/');

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
 * @returns Resolves when uploads and deletes complete
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
      if (options?.strict) throw new Error(`Upload source does not exist: ${f.src}`);
      logger.debug({file: f.src}, 'Skipping missing file');
      return false;
    }
    return true;
  });

  if (validUploadFiles.length > 0) {
    const uploadPath = `${webdavLocation}/_upload-${randomUUID()}.zip`;
    let stage = 'preparing';

    try {
      const zip = new JSZip();
      let totalBytes = 0;

      for (const f of validUploadFiles) {
        try {
          let content: Buffer;
          if (options?.maxBytes !== undefined) {
            const handle = await fs.promises.open(f.src, 'r');
            try {
              const stat = await handle.stat();
              const remaining = options.maxBytes - totalBytes;
              if (!stat.isFile() || stat.size > remaining) throw new Error('Upload exceeds the file/byte limit.');
              // A bounded read detects growth after stat without allocating an unbounded file.
              const buffer = Buffer.alloc(stat.size + 1);
              let length = 0;
              while (length < buffer.length) {
                const {bytesRead} = await handle.read(buffer, length, buffer.length - length);
                if (!bytesRead) break;
                length += bytesRead;
              }
              if (length !== stat.size) throw new Error(`Upload source changed while reading: ${f.src}`);
              content = buffer.subarray(0, length);
            } finally {
              await handle.close();
            }
          } else {
            content = await fs.promises.readFile(f.src);
          }
          totalBytes += content.length;
          zip.file(f.dest, content);
        } catch (error) {
          if (options?.strict) throw error;
          logger.warn({file: f.src, error}, 'Failed to add file to archive');
        }
      }

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {level: 5},
      });

      stage = 'uploading';
      await webdav.put(uploadPath, buffer, 'application/zip');
      logger.debug({uploadPath}, 'Archive uploaded');

      stage = 'extracting';
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

      stage = 'cleaning';
      try {
        await webdav.delete(uploadPath);
      } catch (error) {
        if (!options?.onWarning) throw error;
        options.onWarning(`Files uploaded, but temporary archive cleanup failed at ${uploadPath}: ${String(error)}`);
      }

      logger.debug(
        {fileCount: validUploadFiles.length, server: instance.config.hostname},
        `Uploaded ${validUploadFiles.length} file(s)`,
      );

      options?.onUpload?.(validUploadFiles.map((f) => f.dest));
    } catch (error) {
      const original = error instanceof Error ? error : new Error(String(error));
      const err =
        options?.strict && stage !== 'preparing'
          ? new Error(
              `Failed while ${stage} ${uploadPath}: ${original.message}. Remote files may have changed; inspect before retrying.`,
              {cause: original},
            )
          : original;
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
