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
import {listEnvironmentsWithBackend, type MrtEnvironmentView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtEnvironmentView>> = {
  name: {
    header: 'Name',
    get: (env) => env.name,
  },
  slug: {
    header: 'Slug',
    get: (env) => env.id || '-',
  },
  state: {
    header: 'State',
    get: (env) => env.status ?? '-',
  },
  region: {
    header: 'Region',
    get: (env) => env.region ?? '-',
  },
  production: {
    header: 'Prod',
    get: (env) => (env.isProduction ? 'Yes' : 'No'),
  },
  // Primary is a SCAPI-only concept; renders '-' on legacy where it is undefined.
  primary: {
    header: 'Primary',
    get: (env) => (env.isPrimary === undefined ? '-' : env.isPrimary ? 'Yes' : 'No'),
  },
  backend: {
    header: 'Backend',
    get: (env) => env.backend,
  },
};

const DEFAULT_COLUMNS = ['name', 'slug', 'state', 'region', 'production'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * List environments (targets) for an MRT project.
 */
export default class MrtEnvList extends MrtCommand<typeof MrtEnvList> {
  static description = withDocs(
    t('commands.mrt.env.list.description', 'List Managed Runtime environments'),
    '/cli/mrt.html#b2c-mrt-env-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
    '<%= config.bin %> <%= command.id %> -p my-storefront --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    limit: Flags.integer({
      description: 'Maximum number of results to return (SCAPI backend only)',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination (SCAPI backend only)',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {
    listEnvironmentsWithBackend,
  };

  protected renderTable(environments: MrtEnvironmentView[]): void {
    tableRenderer.render(environments, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
  }

  async run(): Promise<unknown> {
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {limit, offset} = this.flags;
    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.env.list.fetching', 'Fetching environments for {{project}}...', {project}));

    const result = await this.operations.listEnvironmentsWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      limit,
      offset,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Listing environments via backend'),
    });

    if (!this.jsonEnabled()) {
      if (result.environments.length === 0) {
        this.log(t('commands.mrt.env.list.empty', 'No environments found.'));
      } else {
        this.log(t('commands.mrt.env.list.count', 'Found {{count}} environment(s):', {count: result.count}));
        this.renderTable(result.environments);
      }
    }

    // Under --json, emit the backend's native list response verbatim (legacy MRT
    // Cloud API list shape, or the SCAPI paginated envelope). The normalized rows
    // feed the human table only.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
