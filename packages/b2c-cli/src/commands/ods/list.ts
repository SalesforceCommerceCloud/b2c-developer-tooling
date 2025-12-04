import {Flags} from '@oclif/core';
import {OdsCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];

/**
 * Response type for the list command.
 */
interface OdsListResponse {
  count: number;
  data: SandboxModel[];
}

const COLUMNS: Record<string, ColumnDef<SandboxModel>> = {
  realm: {
    header: 'Realm',
    get: (s) => s.realm || '-',
  },
  instance: {
    header: 'Num',
    get: (s) => s.instance || '-',
  },
  state: {
    header: 'State',
    get: (s) => s.state || '-',
  },
  profile: {
    header: 'Profile',
    get: (s) => s.resourceProfile || '-',
  },
  created: {
    header: 'Created',
    get: (s) => (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '-'),
  },
  eol: {
    header: 'EOL',
    get: (s) => (s.eol ? new Date(s.eol).toISOString().slice(0, 10) : '-'),
  },
  id: {
    header: 'ID',
    get: (s) => s.id || '-',
  },
  hostname: {
    header: 'Hostname',
    get: (s) => s.hostName || '-',
    extended: true,
  },
  createdBy: {
    header: 'Created By',
    get: (s) => s.createdBy || '-',
    extended: true,
  },
  autoScheduled: {
    header: 'Auto',
    get: (s) => (s.autoScheduled ? 'Yes' : 'No'),
    extended: true,
  },
};

/** Default columns shown without --extended */
const DEFAULT_COLUMNS = ['realm', 'instance', 'state', 'profile', 'created', 'eol', 'id'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list all on-demand sandboxes.
 */
export default class OdsList extends OdsCommand<typeof OdsList> {
  static description = t('commands.ods.list.description', 'List all on-demand sandboxes');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --realm abcd',
    '<%= config.bin %> <%= command.id %> --filter-params "realm=abcd&state=started"',
    '<%= config.bin %> <%= command.id %> --show-deleted',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --columns realm,instance,state,hostname',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    realm: Flags.string({
      char: 'r',
      description: 'Filter by realm ID (four-letter ID)',
    }),
    'filter-params': Flags.string({
      description: 'Raw filter parameters (e.g., "realm=abcd&state=started&resourceProfile=medium")',
    }),
    'show-deleted': Flags.boolean({
      description: 'Include deleted sandboxes in the list',
      default: false,
    }),
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show all columns including extended fields',
      default: false,
    }),
  };

  async run(): Promise<OdsListResponse> {
    const host = this.odsHost;
    const includeDeleted = this.flags['show-deleted'];
    const realm = this.flags.realm;
    const rawFilterParams = this.flags['filter-params'];

    // Build filter params string
    let filterParams: string | undefined;
    if (realm || rawFilterParams) {
      const parts: string[] = [];
      if (realm) {
        parts.push(`realm=${realm}`);
      }
      if (rawFilterParams) {
        parts.push(rawFilterParams);
      }
      filterParams = parts.join('&');
    }

    this.log(t('commands.ods.list.fetching', 'Fetching sandboxes from {{host}}...', {host}));

    const result = await this.odsClient.GET('/sandboxes', {
      params: {
        query: {
          // eslint-disable-next-line camelcase
          include_deleted: includeDeleted,
          // eslint-disable-next-line camelcase
          filter_params: filterParams,
        },
      },
    });

    if (!result.data?.data) {
      this.error(
        t('commands.ods.list.error', 'Failed to fetch sandboxes: {{message}}', {
          message: result.response?.statusText || 'Unknown error',
        }),
      );
    }

    const sandboxes = result.data.data;
    const response: OdsListResponse = {
      count: sandboxes.length,
      data: sandboxes,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (sandboxes.length === 0) {
      this.log(t('commands.ods.list.noSandboxes', 'No sandboxes found.'));
      return response;
    }

    tableRenderer.render(sandboxes, this.getSelectedColumns());

    return response;
  }

  /**
   * Determines which columns to display based on flags.
   */
  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      // User specified explicit columns
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      // Show all columns
      return tableRenderer.getColumnKeys();
    }

    // Default columns (non-extended)
    return DEFAULT_COLUMNS;
  }
}
