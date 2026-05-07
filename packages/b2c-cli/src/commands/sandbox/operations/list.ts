/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type SandboxOperationModel = OdsComponents['schemas']['SandboxOperationModel'];
type SandboxOperationListResponse = OdsComponents['schemas']['SandboxOperationListResponse'];

export const OPERATION_COLUMNS: Record<string, ColumnDef<SandboxOperationModel>> = {
  id: {
    header: 'Operation ID',
    get: (o) => o.id || '-',
  },
  operation: {
    header: 'Operation',
    get: (o) => o.operation || '-',
  },
  operationState: {
    header: 'Op state',
    get: (o) => o.operationState || '-',
  },
  status: {
    header: 'Status',
    get: (o) => o.status || '-',
  },
  sandboxState: {
    header: 'Sandbox',
    get: (o) => o.sandboxState || '-',
  },
  createdAt: {
    header: 'Created',
    get: (o) => (o.createdAt ? new Date(o.createdAt).toISOString() : '-'),
  },
  operationBy: {
    header: 'By',
    get: (o) => o.operationBy || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['operation', 'operationState', 'status', 'sandboxState', 'createdAt', 'id'];

const tableRenderer = new TableRenderer(OPERATION_COLUMNS);

/**
 * List past and current operations for a sandbox (ODS API GET /sandboxes/{id}/operations).
 */
export default class SandboxOperationsList extends OdsCommand<typeof SandboxOperationsList> {
  static aliases = ['ods:operations:list'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., zzzz-001)',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.sandbox.operations.list.description',
      'List operations performed on a sandbox (start, stop, restart, reset, etc.)',
    ),
    '/cli/sandbox.html#b2c-sandbox-operations-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz-001',
    '<%= config.bin %> <%= command.id %> zzzz-001 --operation-state finished',
    '<%= config.bin %> <%= command.id %> zzzz-001 --from 2025-01-01 --to 2025-12-31',
    '<%= config.bin %> <%= command.id %> zzzz-001 --page 0 --per-page 50',
    '<%= config.bin %> <%= command.id %> zzzz-001 --json',
  ];

  static flags = {
    from: Flags.string({
      description: 'Earliest operation time (ISO 8601); default is about 30 days ago',
    }),
    to: Flags.string({
      description: 'Latest operation time (ISO 8601); default is now',
    }),
    'operation-state': Flags.string({
      description: 'Filter by operation lifecycle state',
      options: ['pending', 'running', 'finished'],
    }),
    status: Flags.string({
      description: 'Filter by outcome (finished operations)',
      options: ['success', 'failure'],
    }),
    operation: Flags.string({
      description: 'Filter by operation type',
      options: ['start', 'stop', 'restart', 'reset', 'create', 'delete', 'upgrade'],
    }),
    'sort-order': Flags.string({
      description: 'Sort order for results',
      options: ['asc', 'desc'],
    }),
    'sort-by': Flags.string({
      description: 'Field to sort by',
      options: ['created', 'operation_state', 'status', 'operation'],
    }),
    page: Flags.integer({
      description: 'Page index (0-based)',
      min: 0,
    }),
    'per-page': Flags.integer({
      description: 'Page size (default from API is 20)',
      min: 1,
    }),
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(OPERATION_COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Include extended columns (e.g. operationBy)',
      default: false,
    }),
  };

  async run(): Promise<SandboxOperationListResponse | undefined> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);

    this.log(
      t('commands.sandbox.operations.list.fetching', 'Fetching operations for sandbox {{sandboxId}}...', {
        sandboxId: this.args.sandboxId,
      }),
    );

    const q = this.buildQuery();

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/operations', {
      params: {
        path: {sandboxId},
        query: q,
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.operations.list.error', 'Failed to list sandbox operations: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const payload = result.data;
    if (!payload) {
      this.log(t('commands.sandbox.operations.list.empty', 'No operation data returned.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return payload;
    }

    const operations = payload.data ?? [];
    if (operations.length === 0) {
      this.log(t('commands.sandbox.operations.list.none', 'No operations found for this sandbox.'));
      return payload;
    }

    const meta = payload.metadata;
    if (meta && (meta.page !== undefined || meta.pageCount !== undefined || meta.totalCount !== undefined)) {
      const parts: string[] = [];
      if (meta.page !== undefined) parts.push(`page ${meta.page}`);
      if (meta.perPage !== undefined) parts.push(`${meta.perPage} per page`);
      if (meta.pageCount !== undefined) parts.push(`${meta.pageCount} page(s)`);
      if (meta.totalCount !== undefined) parts.push(`${meta.totalCount} total`);
      if (parts.length > 0) {
        this.log(parts.join(', '));
      }
    }

    tableRenderer.render(operations, this.getSelectedColumns());

    return payload;
  }

  private buildQuery(): Record<string, number | string> {
    const f = this.flags;
    const q: Record<string, number | string> = {};
    if (f.from) q.from = f.from;
    if (f.to) q.to = f.to;
    if (f['operation-state']) q.operation_state = f['operation-state'];
    if (f.status) q.status = f.status;
    if (f.operation) q.operation = f.operation;
    if (f['sort-order']) q.sort_order = f['sort-order'];
    if (f['sort-by']) q.sort_by = f['sort-by'];
    if (f.page !== undefined) q.page = f.page;
    if (f['per-page'] !== undefined) q.per_page = f['per-page'];
    return q;
  }

  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      return tableRenderer.getColumnKeys();
    }

    return DEFAULT_COLUMNS;
  }
}
