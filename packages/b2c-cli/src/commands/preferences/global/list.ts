/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {PreferencesCommand} from '../../../utils/preferences.js';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type CustomPreference, type CustomPreferenceList} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<CustomPreference>> = {
  id: {header: 'ID', get: (p) => p.id || '-'},
  value: {header: 'Value', get: (p) => formatValue(p.value)},
  groupId: {header: 'Group ID', get: (p) => p.groupId || '-', extended: true},
};

const DEFAULT_COLUMNS = ['id', 'value'];
const tableRenderer = new TableRenderer(COLUMNS);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default class PreferencesGlobalList extends PreferencesCommand<typeof PreferencesGlobalList> {
  static description = withDocs(
    t('commands.preferences.global.list.description', 'List global custom preferences for the organization'),
    '/cli/preferences.html#list-global',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --limit 50',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --json',
  ];

  static flags = {
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results (1-200)',
      default: 200,
      min: 1,
      max: 200,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Result offset for pagination',
      default: 0,
      min: 0,
    }),
    'mask-password': Flags.boolean({
      description: 'Mask values of type password',
      default: false,
      allowNo: true,
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<CustomPreferenceList> {
    this.requireOAuthCredentials();

    const {limit, offset, 'mask-password': maskPassword} = this.flags;
    const organizationId = this.getOrganizationId();

    const result = await this.preferencesClient.GET('/organizations/{organizationId}/global-custom-preferences', {
      params: {
        path: {organizationId},
        query: {limit, offset, maskPassword},
      },
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.global.list.error', 'Failed to list global custom preferences: {{message}}', {message}),
      );
    }

    if (this.jsonEnabled()) return result.data;

    const data = result.data.data || [];
    ux.stdout('\n');
    tableRenderer.render(data, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    ux.stdout(
      t('commands.preferences.global.list.total', '\nTotal: {{total}} preferences\n', {
        total: result.data.total ?? data.length,
      }),
    );

    return result.data;
  }
}
