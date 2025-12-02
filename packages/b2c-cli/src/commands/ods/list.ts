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

    this.printSandboxesTable(sandboxes);

    return response;
  }

  private printSandboxesTable(sandboxes: SandboxModel[]): void {
    const ui = cliui({width: process.stdout.columns || 120});

    // Header
    ui.div(
      {text: 'Realm', width: 8, padding: [0, 1, 0, 0]},
      {text: 'Instance', width: 10, padding: [0, 1, 0, 0]},
      {text: 'State', width: 12, padding: [0, 1, 0, 0]},
      {text: 'Profile', width: 10, padding: [0, 1, 0, 0]},
      {text: 'Created', width: 12, padding: [0, 1, 0, 0]},
      {text: 'EOL', width: 12, padding: [0, 1, 0, 0]},
      {text: 'ID'},
    );

    // Separator
    ui.div({text: '─'.repeat(100), padding: [0, 0, 0, 0]});

    // Rows
    for (const sandbox of sandboxes) {
      const createdAt = sandbox.createdAt ? new Date(sandbox.createdAt).toISOString().slice(0, 10) : '-';
      const eol = sandbox.eol ? new Date(sandbox.eol).toISOString().slice(0, 10) : '-';

      ui.div(
        {text: sandbox.realm || '-', width: 8, padding: [0, 1, 0, 0]},
        {text: sandbox.instance || '-', width: 10, padding: [0, 1, 0, 0]},
        {text: sandbox.state || '-', width: 12, padding: [0, 1, 0, 0]},
        {text: sandbox.resourceProfile || '-', width: 10, padding: [0, 1, 0, 0]},
        {text: createdAt, width: 12, padding: [0, 1, 0, 0]},
        {text: eol, width: 12, padding: [0, 1, 0, 0]},
        {text: sandbox.id || '-'},
      );
    }

    ux.stdout(ui.toString());
  }
}
