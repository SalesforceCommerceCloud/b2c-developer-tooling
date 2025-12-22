/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {WebDavCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {PropfindEntry} from '@salesforce/b2c-tooling-sdk/clients';
import {t} from '../../i18n/index.js';

/**
 * Formats bytes into human-readable sizes.
 */
function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / k ** i;

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Extracts the display name from a PropfindEntry.
 */
function getDisplayName(entry: PropfindEntry): string {
  if (entry.displayName) {
    return entry.displayName;
  }
  // Extract filename from href
  const parts = entry.href.split('/').filter(Boolean);
  return parts.at(-1) || entry.href;
}

const COLUMNS: Record<string, ColumnDef<PropfindEntry>> = {
  name: {
    header: 'Name',
    get: (e) => getDisplayName(e),
  },
  type: {
    header: 'Type',
    get: (e) => (e.isCollection ? 'dir' : 'file'),
  },
  size: {
    header: 'Size',
    get: (e) => formatBytes(e.contentLength),
  },
  modified: {
    header: 'Modified',
    get: (e) => (e.lastModified ? e.lastModified.toLocaleString() : '-'),
    extended: true,
  },
  contentType: {
    header: 'Content-Type',
    get: (e) => e.contentType || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['name', 'type', 'size'];

interface LsResult {
  path: string;
  count: number;
  entries: PropfindEntry[];
}

export default class WebDavLs extends WebDavCommand<typeof WebDavLs> {
  static args = {
    path: Args.string({
      description: 'Path relative to root (defaults to root directory)',
      default: '',
    }),
  };

  static description = t('commands.webdav.ls.description', 'List files and directories in a WebDAV location');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> src/instance',
    '<%= config.bin %> <%= command.id %> --root=cartridges',
    '<%= config.bin %> <%= command.id %> --root=logs --json',
  ];

  async run(): Promise<LsResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.path);

    this.log(t('commands.webdav.ls.listing', 'Listing {{path}}...', {path: fullPath}));

    const entries = await this.instance.webdav.propfind(fullPath, '1');

    // Filter out the parent directory itself (first entry is usually the queried path)
    const filteredEntries = entries.filter((entry) => {
      const entryPath = decodeURIComponent(entry.href);
      const normalizedFullPath = fullPath.replace(/\/$/, '');
      return !entryPath.endsWith(`/${normalizedFullPath}`) && !entryPath.endsWith(`/${normalizedFullPath}/`);
    });

    const result: LsResult = {
      path: fullPath,
      count: filteredEntries.length,
      entries: filteredEntries,
    };

    if (this.jsonEnabled()) {
      return result;
    }

    if (filteredEntries.length === 0) {
      this.log(t('commands.webdav.ls.empty', 'No files or directories found.'));
      return result;
    }

    createTable(COLUMNS).render(filteredEntries, DEFAULT_COLUMNS);

    return result;
  }
}
