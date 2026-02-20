/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {OdsCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];

/**
 * Response type for the list command.
 */
interface OdsListResponse {
  count: number;
  data: SandboxModel[];
}

export const COLUMNS: Record<string, ColumnDef<SandboxModel>> = {
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
    get(s) {
      if (!s.eol) return '-';
      const d = new Date(s.eol);
      const date = d.toISOString().slice(0, 10);
      const msUntilEol = d.getTime() - Date.now();
      if (msUntilEol <= 24 * 60 * 60 * 1000) {
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${date} ${hh}:${mm}`;
      }
      return date;
    },
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
export default class SandboxList extends OdsCommand<typeof SandboxList> {
  static aliases = ['ods:list'];

  static description = withDocs(
    t('commands.sandbox.list.description', 'List all on-demand sandboxes'),
    '/cli/sandbox.html#b2c-sandbox-list',
  );

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

    this.log(t('commands.sandbox.list.fetching', 'Fetching sandboxes from {{host}}...', {host}));

    const result = await this.odsClient.GET('/sandboxes', {
      params: {
        query: {
          include_deleted: includeDeleted,

          filter_params: filterParams,
        },
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.list.error', 'Failed to fetch sandboxes: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const sandboxes = result.data?.data ?? [];
    const response: OdsListResponse = {
      count: sandboxes.length,
      data: sandboxes,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (sandboxes.length === 0) {
      this.log(t('commands.sandbox.list.noSandboxes', 'No sandboxes found.'));
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
