import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
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

/**
 * Column definition for table output.
 */
interface ColumnDef {
  /** Column header label */
  header: string;
  /** Minimum width in characters */
  minWidth?: number;
  /** Function to extract value from sandbox */
  get: (s: SandboxModel) => string;
  /** Whether this column is only shown with --extended */
  extended?: boolean;
}

/**
 * Available columns for sandbox list output.
 */
const COLUMNS: Record<string, ColumnDef> = {
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

    this.printSandboxesTable(sandboxes, this.getSelectedColumns());

    return response;
  }

  /**
   * Calculate dynamic column widths based on content.
   * Each column width = max(header length, max data length) + padding
   */
  private calculateColumnWidths(sandboxes: SandboxModel[], columnKeys: string[]): Map<string, number> {
    const widths = new Map<string, number>();
    const padding = 2; // Space between columns

    for (const key of columnKeys) {
      const col = COLUMNS[key];
      // Start with header length
      let maxWidth = col.header.length;

      // Check all data values
      for (const sandbox of sandboxes) {
        const value = col.get(sandbox);
        maxWidth = Math.max(maxWidth, value.length);
      }

      // Apply minimum width if specified, add padding
      const minWidth = col.minWidth || 0;
      widths.set(key, Math.max(maxWidth, minWidth) + padding);
    }

    return widths;
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
      const valid = requested.filter((c) => c in COLUMNS);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${Object.keys(COLUMNS).join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      // Show all columns
      return Object.keys(COLUMNS);
    }

    // Default columns (non-extended)
    return DEFAULT_COLUMNS;
  }

  private printSandboxesTable(sandboxes: SandboxModel[], columnKeys: string[]): void {
    const termWidth = process.stdout.columns || 120;
    const ui = cliui({width: termWidth});

    // Calculate dynamic widths based on content
    const widths = this.calculateColumnWidths(sandboxes, columnKeys);

    // Build header row
    const headerCols = columnKeys.map((key) => {
      const col = COLUMNS[key];
      return {
        text: col.header,
        width: widths.get(key),
        padding: [0, 1, 0, 0] as [number, number, number, number],
      };
    });
    ui.div(...headerCols);

    // Separator
    const totalWidth = [...widths.values()].reduce((sum, w) => sum + w, 0);
    ui.div({text: '─'.repeat(Math.min(totalWidth, termWidth)), padding: [0, 0, 0, 0]});

    // Rows
    for (const sandbox of sandboxes) {
      const rowCols = columnKeys.map((key) => {
        const col = COLUMNS[key];
        return {
          text: col.get(sandbox),
          width: widths.get(key),
          padding: [0, 1, 0, 0] as [number, number, number, number],
        };
      });
      ui.div(...rowCols);
    }

    ux.stdout(ui.toString());
  }
}
