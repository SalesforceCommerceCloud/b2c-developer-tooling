/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listLogFiles, type LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {t} from '../../i18n/index.js';

/**
 * Formats bytes into human-readable sizes.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / k ** i;

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const COLUMNS: Record<string, ColumnDef<LogFile>> = {
  name: {
    header: 'Name',
    get: (f) => f.name,
  },
  prefix: {
    header: 'Type',
    get: (f) => f.prefix,
  },
  size: {
    header: 'Size',
    get: (f) => formatBytes(f.size),
  },
  modified: {
    header: 'Modified',
    get: (f) => f.lastModified.toLocaleString(),
  },
};

const DEFAULT_COLUMNS = ['name', 'prefix', 'size', 'modified'];

interface LogsListResult {
  count: number;
  files: LogFile[];
}

export default class LogsList extends InstanceCommand<typeof LogsList> {
  static description = t('commands.logs.list.description', 'List log files on a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --prefix error customerror',
    '<%= config.bin %> <%= command.id %> --sort size --order asc',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    prefix: Flags.string({
      char: 'p',
      description: 'Filter by log prefix (can specify multiple)',
      multiple: true,
    }),
    sort: Flags.string({
      char: 's',
      description: 'Sort field',
      options: ['name', 'date', 'size'],
      default: 'date',
    }),
    order: Flags.string({
      char: 'o',
      description: 'Sort order',
      options: ['asc', 'desc'],
      default: 'desc',
    }),
  };

  async run(): Promise<LogsListResult> {
    this.requireServer();
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.logs.list.fetching', 'Fetching log files from {{hostname}}...', {hostname}));

    const files = await listLogFiles(this.instance, {
      prefixes: this.flags.prefix,
      sortBy: this.flags.sort as 'date' | 'name' | 'size',
      sortOrder: this.flags.order as 'asc' | 'desc',
    });

    const result: LogsListResult = {
      count: files.length,
      files,
    };

    if (this.jsonEnabled()) {
      return result;
    }

    if (files.length === 0) {
      ux.stdout(t('commands.logs.list.noFiles', 'No log files found.'));
      return result;
    }

    createTable(COLUMNS).render(files, DEFAULT_COLUMNS);

    return result;
  }
}
