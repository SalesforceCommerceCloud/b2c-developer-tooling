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
import {listMrtDeployments, type MrtDeploymentView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtDeploymentView>> = {
  bundleId: {
    header: 'Bundle ID',
    get: (deploy) => deploy.bundleId?.toString() ?? '-',
  },
  bundleMessage: {
    header: 'Message',
    get: (deploy) => deploy.bundleMessage ?? '-',
  },
  status: {
    header: 'Status',
    get: (deploy) => deploy.status ?? '-',
  },
  type: {
    header: 'Type',
    get: (deploy) => deploy.deploymentType ?? '-',
  },
  user: {
    header: 'User',
    get: (deploy) => deploy.createdBy ?? '-',
  },
  created: {
    header: 'Created',
    get: (deploy) => (deploy.creationDate ? new Date(deploy.creationDate).toLocaleString() : '-'),
  },
  deploymentId: {
    header: 'Deployment ID',
    get: (deploy) => deploy.deploymentId ?? '-',
  },
  backend: {
    header: 'Backend',
    get: (deploy) => deploy.backend,
  },
};

const DEFAULT_COLUMNS = ['bundleId', 'bundleMessage', 'status', 'type', 'created'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * List deployment history for an MRT environment.
 */
export default class MrtBundleHistory extends MrtCommand<typeof MrtBundleHistory> {
  static description = withDocs(
    t('commands.mrt.bundle.history.description', 'List deployment history for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-bundle-history',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --limit 5',
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
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {
    listMrtDeployments,
  };

  async run(): Promise<unknown> {
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error('MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.');
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();
    const {limit, offset} = this.flags;

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.bundle.history.fetching', 'Fetching deployment history for {{project}}/{{environment}}...', {
          project,
          environment,
        }),
      );
    }

    const result = await this.operations.listMrtDeployments({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      targetSlug: environment,
      limit,
      offset,
      origin: this.resolvedConfig.values.mrtOrigin,
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Listing deployment history via backend'),
    });

    if (!this.jsonEnabled()) {
      if (result.deployments.length === 0) {
        this.log(t('commands.mrt.bundle.history.empty', 'No deployments found.'));
      } else {
        this.log(t('commands.mrt.bundle.history.count', 'Found {{count}} deployment(s):', {count: result.count}));
        tableRenderer.render(
          result.deployments,
          selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)),
        );
      }
    }

    // Under --json, emit the backend's native response verbatim (legacy MRT
    // Cloud API list shape, or the SCAPI Storefront Deployments response) so the
    // machine contract stays backend-specific and backward-compatible. The
    // normalized rows above are for the human table only.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
