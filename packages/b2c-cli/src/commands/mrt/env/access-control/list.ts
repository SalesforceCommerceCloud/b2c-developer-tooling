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
import {
  listAccessControlHeadersWithBackend,
  type MrtAccessControlHeaderView,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtAccessControlHeaderView>> = {
  id: {
    header: 'ID',
    get: (h) => h.id || '-',
  },
  value: {
    header: 'Value',
    get: (h) => h.value || '-',
  },
  status: {
    header: 'Status',
    get: (h) => h.status ?? '-',
  },
  created: {
    header: 'Created',
    get: (h) => (h.createdAt ? new Date(h.createdAt).toLocaleString() : '-'),
  },
  backend: {
    header: 'Backend',
    get: (h) => h.backend,
  },
};

const DEFAULT_COLUMNS = ['id', 'value', 'status', 'created'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * List access control headers for an MRT environment.
 */
export default class MrtAccessControlList extends MrtCommand<typeof MrtAccessControlList> {
  static description = withDocs(
    t('commands.mrt.access-control.list.description', 'List access control headers for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-access-control-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment production',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --mrt-backend scapi',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {
    listAccessControlHeadersWithBackend,
  };

  protected renderTable(headers: MrtAccessControlHeaderView[]): void {
    tableRenderer.render(headers, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
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

    const {limit, offset} = this.flags;
    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t(
        'commands.mrt.access-control.list.fetching',
        'Fetching access control headers for {{project}}/{{environment}}...',
        {project, environment},
      ),
    );

    const result = await this.operations.listAccessControlHeadersWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      limit,
      offset,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Listing access control headers via backend'),
    });

    if (!this.jsonEnabled()) {
      if (result.headers.length === 0) {
        this.log(t('commands.mrt.access-control.list.empty', 'No access control headers found.'));
      } else {
        this.log(
          t('commands.mrt.access-control.list.count', 'Found {{count}} access control header(s):', {
            count: result.count,
          }),
        );
        this.renderTable(result.headers);
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
