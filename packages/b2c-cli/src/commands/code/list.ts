/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {
  CodeCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {type CodeVersionInfo} from '@salesforce/b2c-tooling-sdk/operations/code';
import {t, withDocs} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<CodeVersionInfo>> = {
  id: {
    header: 'ID',
    get: (v) => v.id || '-',
  },
  active: {
    header: 'Active',
    get: (v) => (v.active ? 'Yes' : 'No'),
  },
  rollback: {
    header: 'Rollback',
    get: (v) => (v.rollback ? 'Yes' : 'No'),
  },
  lastModified: {
    header: 'Last Modified',
    get: (v) => (v.lastModificationTime ? new Date(v.lastModificationTime).toLocaleString() : '-'),
  },
  cartridges: {
    header: 'Cartridges',
    get: (v) => String(v.cartridges?.length ?? 0),
  },
};

const DEFAULT_COLUMNS = ['id', 'active', 'rollback', 'lastModified', 'cartridges'];

const tableRenderer = new TableRenderer(COLUMNS);

interface CodeListResult {
  count: number;
  data: CodeVersionInfo[];
  total: number;
}

export default class CodeList extends CodeCommand<typeof CodeList> {
  static description = withDocs(
    t('commands.code.list.description', 'List code versions on a B2C Commerce instance'),
    '/cli/code.html#b2c-code-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --columns id,active,lastModified',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...columnFlagsFor(COLUMNS),
  };

  static hiddenAliases = ['code:list'];

  async run(): Promise<CodeListResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const backend = this.createScriptsBackend();
    this.logger.debug(`Using ${backend.name} backend for code list`);

    this.log(t('commands.code.list.fetching', 'Fetching code versions from {{hostname}}...', {hostname}));

    const versions = await backend.listCodeVersions();

    const result: CodeListResult = {
      count: versions.length,
      data: versions,
      total: versions.length,
    };

    if (this.jsonEnabled()) {
      return result;
    }

    if (versions.length === 0) {
      ux.stdout(t('commands.code.list.noVersions', 'No code versions found.'));
      return result;
    }

    tableRenderer.render(versions, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return result;
  }
}
