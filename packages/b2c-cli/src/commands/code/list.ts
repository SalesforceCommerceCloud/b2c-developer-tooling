import {ux} from '@oclif/core';
import {InstanceCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listCodeVersions, type CodeVersion, type CodeVersionResult} from '@salesforce/b2c-tooling-sdk/operations/code';
import {t} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<CodeVersion>> = {
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
    get: (v) => (v.last_modification_time ? new Date(v.last_modification_time).toLocaleString() : '-'),
  },
  cartridges: {
    header: 'Cartridges',
    get: (v) => String(v.cartridges?.length ?? 0),
  },
};

const DEFAULT_COLUMNS = ['id', 'active', 'rollback', 'lastModified', 'cartridges'];

export default class CodeList extends InstanceCommand<typeof CodeList> {
  static description = t('commands.code.list.description', 'List code versions on a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  async run(): Promise<CodeVersionResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.hostname!;

    this.log(t('commands.code.list.fetching', 'Fetching code versions from {{hostname}}...', {hostname}));

    const versions = await listCodeVersions(this.instance);

    const result: CodeVersionResult = {
      count: versions.length,
      data: versions,
      total: versions.length,
    };

    // In JSON mode, just return the data - oclif handles output to stdout
    if (this.jsonEnabled()) {
      return result;
    }

    // Human-readable table output to stdout
    if (versions.length === 0) {
      ux.stdout(t('commands.code.list.noVersions', 'No code versions found.'));
      return result;
    }

    createTable(COLUMNS).render(versions, DEFAULT_COLUMNS);

    return result;
  }
}
