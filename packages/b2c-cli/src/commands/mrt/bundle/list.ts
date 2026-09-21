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
import {listMrtBundles, type MrtBundleView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtBundleView>> = {
  id: {
    header: 'ID',
    get: (bundle) => bundle.id?.toString() ?? '-',
  },
  message: {
    header: 'Message',
    get: (bundle) => bundle.message ?? '-',
  },
  status: {
    header: 'Status',
    get: (bundle) => bundle.status?.toString() ?? '-',
  },
  user: {
    header: 'User',
    get: (bundle) => bundle.user ?? '-',
  },
  created: {
    header: 'Created',
    get: (bundle) => (bundle.created ? new Date(bundle.created).toLocaleString() : '-'),
  },
  backend: {
    header: 'Backend',
    get: (bundle) => bundle.backend,
  },
};

const DEFAULT_COLUMNS = ['id', 'message', 'status', 'user', 'created'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * List bundles for an MRT project.
 */
export default class MrtBundleList extends MrtCommand<typeof MrtBundleList> {
  static description = withDocs(
    t('commands.mrt.bundle.list.description', 'List bundles for a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-bundle-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --limit 10',
    '<%= config.bin %> <%= command.id %> -p my-storefront --mrt-backend scapi',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
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
    listMrtBundles,
  };

  async run(): Promise<unknown> {
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();
    const {limit, offset} = this.flags;

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.bundle.list.fetching', 'Fetching bundles for {{project}}...', {project}));
    }

    const result = await this.operations.listMrtBundles({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      limit,
      offset,
      origin: this.resolvedConfig.values.mrtOrigin,
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Listing bundles via backend'),
    });

    if (!this.jsonEnabled()) {
      if (result.bundles.length === 0) {
        this.log(t('commands.mrt.bundle.list.empty', 'No bundles found.'));
      } else {
        this.log(t('commands.mrt.bundle.list.count', 'Found {{count}} bundle(s):', {count: result.count}));
        tableRenderer.render(
          result.bundles,
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
