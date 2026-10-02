/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {
  MrtCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {listRedirectsWithBackend, type MrtRedirectView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtRedirectView>> = {
  id: {
    header: 'ID',
    get: (r) => r.id || '-',
  },
  source: {
    header: 'From',
    get: (r) => r.source || '-',
  },
  destination: {
    header: 'To',
    get: (r) => r.destination || '-',
  },
  status: {
    header: 'HTTP',
    get: (r) => r.httpStatusCode?.toString() ?? '301',
  },
  publishingStatus: {
    header: 'Status',
    get: (r) => r.status ?? '-',
  },
  forwardQs: {
    header: 'Fwd QS',
    get: (r) => (r.forwardQuerystring ? 'Yes' : 'No'),
  },
  backend: {
    header: 'Backend',
    get: (r) => r.backend,
  },
};

// The identifier differs by backend (from_path on legacy, UUID on SCAPI), so the
// default view leads with the human-readable source/destination; `id` and
// `backend` are opt-in columns.
const DEFAULT_COLUMNS = ['source', 'destination', 'status', 'publishingStatus'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * List redirects for an MRT environment.
 */
export default class MrtRedirectList extends MrtCommand<typeof MrtRedirectList> {
  static description = withDocs(
    t('commands.mrt.redirect.list.description', 'List redirects for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-redirect-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --search "/old"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --mrt-backend scapi',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
    search: Flags.string({
      description: 'Search term for filtering (legacy backend only)',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {
    listRedirectsWithBackend,
  };

  protected renderTable(redirects: MrtRedirectView[]): void {
    tableRenderer.render(redirects, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
  }

  async run(): Promise<unknown> {
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {limit, offset, search} = this.flags;
    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t('commands.mrt.redirect.list.fetching', 'Fetching redirects for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );

    const result = await this.operations.listRedirectsWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      limit,
      offset,
      search,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Listing redirects via backend'),
    });

    if (!this.jsonEnabled()) {
      if (result.redirects.length === 0) {
        this.log(t('commands.mrt.redirect.list.empty', 'No redirects found.'));
      } else {
        this.log(t('commands.mrt.redirect.list.count', 'Found {{count}} redirect(s):', {count: result.count}));
        this.renderTable(result.redirects);
      }
    }

    // Under --json, emit the backend's native list response verbatim (legacy MRT
    // Cloud API list shape, or the SCAPI paginated envelope) so the machine
    // contract stays backend-specific. The normalized rows feed the human table only.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
