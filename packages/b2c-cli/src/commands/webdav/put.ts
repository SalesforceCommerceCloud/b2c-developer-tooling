/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import {basename, extname, resolve} from 'node:path';
import {Args} from '@oclif/core';
import {WebDavCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

/**
 * Common content type mappings by file extension.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.zip': 'application/zip',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

/**
 * Gets the content type for a file based on its extension.
 */
function getContentType(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext];
}

interface PutResult {
  localPath: string;
  remotePath: string;
  size: number;
  contentType?: string;
}

export default class WebDavPut extends WebDavCommand<typeof WebDavPut> {
  static args = {
    local: Args.string({
      description: 'Local file path to upload',
      required: true,
    }),
    remote: Args.string({
      description: 'Remote destination (directory or file path). If ending with / or is /, uses source filename.',
      required: true,
    }),
  };

  static description = t('commands.webdav.put.description', 'Upload a file to WebDAV');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./export.zip /  # uploads to root as export.zip',
    '<%= config.bin %> <%= command.id %> ./export.zip src/instance/  # uploads to src/instance/export.zip',
    '<%= config.bin %> <%= command.id %> ./data.xml src/instance/renamed.xml  # uploads with new name',
    '<%= config.bin %> <%= command.id %> ./file.tar.gz / --root=temp  # uploads to Temp/file.tar.gz',
  ];

  async run(): Promise<PutResult> {
    this.ensureWebDavAuth();

    const localPath = resolve(this.args.local);
    const localFilename = basename(localPath);

    // Verify local file exists
    if (!fs.existsSync(localPath)) {
      this.error(t('commands.webdav.put.fileNotFound', 'Local file not found: {{path}}', {path: localPath}));
    }

    // Determine remote path - if it looks like a directory, append the source filename
    let remotePath = this.args.remote;
    if (remotePath === '/' || remotePath === '' || remotePath.endsWith('/')) {
      // Treat as directory, append source filename
      remotePath = remotePath === '/' || remotePath === '' ? localFilename : `${remotePath}${localFilename}`;
    }
    const fullPath = this.buildPath(remotePath);

    // Read local file
    const content = fs.readFileSync(localPath);
    const contentType = getContentType(localPath);

    this.log(
      t('commands.webdav.put.uploading', 'Uploading {{local}} to {{remote}}...', {local: localPath, remote: fullPath}),
    );

    // Create parent directories if needed
    await this.ensureParentDirectories(fullPath);

    // Upload the file
    await this.instance.webdav.put(fullPath, content, contentType);

    const result: PutResult = {
      localPath,
      remotePath: fullPath,
      size: content.length,
      contentType,
    };

    this.log(
      t('commands.webdav.put.success', 'Uploaded {{size}} bytes to {{path}}', {
        size: result.size,
        path: result.remotePath,
      }),
    );

    return result;
  }

  /**
   * Ensures all parent directories exist for the given path.
   * Note: Sequential await is required here as each directory depends on its parent existing.
   */
  private async ensureParentDirectories(fullPath: string): Promise<void> {
    const parts = fullPath.split('/').filter(Boolean);
    // Remove the filename, keep only directory parts
    parts.pop();

    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      // eslint-disable-next-line no-await-in-loop
      await this.instance.webdav.mkcol(currentPath);
    }
  }
}
