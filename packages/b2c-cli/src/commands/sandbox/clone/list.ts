/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

type SandboxCloneGetModel = OdsComponents['schemas']['SandboxCloneGetModel'];

const COLUMNS: Record<string, ColumnDef<SandboxCloneGetModel>> = {
  cloneId: {
    header: 'Clone ID',
    get: (c) => c.cloneId || '-',
  },
  status: {
    header: 'Status',
    get: (c) => c.status || '-',
  },
  sourceInstance: {
    header: 'Source Instance',
    get: (c) => c.sourceInstance || '-',
  },
  targetInstance: {
    header: 'Target Instance',
    get: (c) => c.targetInstance || '-',
  },
  targetProfile: {
    header: 'Profile',
    get: (c) => c.targetProfile || '-',
  },
  progressPercentage: {
    header: 'Progress %',
    get: (c) => (c.progressPercentage === undefined ? '-' : `${c.progressPercentage}%`),
  },
  createdAt: {
    header: 'Created At',
    get: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'),
  },
  createdBy: {
    header: 'Created By',
    get: (c) => c.createdBy || '-',
  },
  lastUpdated: {
    header: 'Last Updated',
    get: (c) => (c.lastUpdated ? new Date(c.lastUpdated).toLocaleString() : '-'),
  },
  elapsedTimeInSec: {
    header: 'Elapsed Time (sec)',
    get: (c) => (c.elapsedTimeInSec === undefined ? '-' : c.elapsedTimeInSec.toString()),
  },
  realm: {
    header: 'Realm',
    get: (c) => c.realm || '-',
  },
};

const DEFAULT_COLUMNS = ['cloneId', 'status', 'sourceInstance', 'targetInstance', 'progressPercentage', 'createdAt'];

/**
 * Command to list sandbox clones for a specific sandbox.
 */
export default class CloneList extends OdsCommand<typeof CloneList> {
  static aliases = ['ods:clone:list'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or friendly format like realm-instance)',
      required: true,
    }),
  };

  static description = t('commands.clone.list.description', 'List all clones for a specific sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <sandboxId>',
    '<%= config.bin %> <%= command.id %> <sandboxId> --status COMPLETED',
    '<%= config.bin %> <%= command.id %> <sandboxId> --from 2024-01-01 --to 2024-12-31',
    '<%= config.bin %> <%= command.id %> <sandboxId> --extended',
  ];

  static flags = {
    from: Flags.string({
      description: 'Filter clones created on or after this date (ISO 8601 date format, e.g., 2024-01-01)',
      required: false,
    }),
    to: Flags.string({
      description: 'Filter clones created on or before this date (ISO 8601 date format, e.g., 2024-12-31)',
      required: false,
    }),
    status: Flags.string({
      description: 'Filter clones by status',
      required: false,
      options: ['Pending', 'InProgress', 'Failed', 'Completed'],
    }),
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show all columns',
      default: false,
    }),
  };

  async run(): Promise<{data?: SandboxCloneGetModel[]}> {
    const {sandboxId: rawSandboxId} = this.args;
    const {from: fromDate, to: toDate, status} = this.flags;

    // Resolve sandbox ID (handles both UUID and friendly format)
    const sandboxId = await this.resolveSandboxId(rawSandboxId);

    this.log(t('commands.clone.list.fetching', 'Fetching sandbox clones...'));

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/clones', {
      params: {
        path: {sandboxId},
        query: {
          fromDate,
          toDate,
          status: status as 'Completed' | 'Failed' | 'InProgress' | 'Pending' | undefined,
        },
      },
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(t('commands.clone.list.error', 'Failed to list sandbox clones: {{message}}', {message}));
    }

    if (this.jsonEnabled()) {
      return {data: result.data.data || []};
    }

    const clones = result.data.data || [];
    if (clones.length === 0) {
      this.log(t('commands.clone.list.noClones', 'No clones found for this sandbox.'));
      return {data: clones};
    }

    const columns = this.getSelectedColumns();
    const tableRenderer = new TableRenderer(COLUMNS);
    tableRenderer.render(clones, columns);

    return {data: clones};
  }

  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      return columnsFlag.split(',').map((c) => c.trim());
    }

    if (extended) {
      return Object.keys(COLUMNS);
    }

    return DEFAULT_COLUMNS;
  }
}
