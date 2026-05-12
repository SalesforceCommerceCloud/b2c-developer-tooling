/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {GranularReplicationsCommand} from '../../../utils/scapi/replications.js';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getApiErrorMessage,
  type PublishProcessListResponse,
  type PublishProcessResponse,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<PublishProcessResponse>> = {
  id: {header: 'ID', get: (p) => p.id || '-'},
  status: {header: 'Status', get: (p) => p.status || '-'},
  startTime: {header: 'Started', get: (p) => p.startTime || '-'},
  endTime: {header: 'Completed', get: (p) => p.endTime || '-'},
  initiatedBy: {header: 'Initiated By', get: (p) => p.initiatedBy || '-'},
  entityType: {
    header: 'Entity Type',
    get(p) {
      if (p.productItem) return 'Product';
      if (p.priceTableItem) return 'Price Table';
      if (p.contentAssetItem) return 'Content Asset';
      return '-';
    },
  },
  entityId: {
    header: 'Entity ID',
    get(p) {
      if (p.productItem) return p.productItem.productId;
      if (p.priceTableItem) return p.priceTableItem.priceTableId;
      if (p.contentAssetItem) return p.contentAssetItem.contentId;
      return '-';
    },
  },
};

const DEFAULT_COLUMNS = ['id', 'status', 'entityType', 'entityId', 'startTime'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class ReplicationsList extends GranularReplicationsCommand<typeof ReplicationsList> {
  static description = withDocs(
    t('commands.replications.list.description', 'List granular replication processes'),
    '/cli/replications.html#list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 50',
    '<%= config.bin %> <%= command.id %> --extended',
  ];

  static flags = {
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 20,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Result offset for pagination',
      default: 0,
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<PublishProcessListResponse> {
    this.requireOAuthCredentials();

    const {limit, offset} = this.flags;
    const organizationId = this.getOrganizationId();

    const result = await this.granularReplicationsClient.GET('/organizations/{organizationId}/granular-processes', {
      params: {
        path: {organizationId},
        query: {limit, offset},
      },
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(t('commands.replications.list.error', 'Failed to list replication processes: {{message}}', {message}));
    }

    if (this.jsonEnabled()) return result.data;

    const processes = result.data.data || [];
    ux.stdout('\n');
    tableRenderer.render(processes, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    ux.stdout(t('commands.replications.list.total', '\nTotal: {{total}} processes', {total: result.data.total}) + '\n');

    return result.data;
  }
}
