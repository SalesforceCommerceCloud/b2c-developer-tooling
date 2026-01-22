/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getEmailPreferences,
  updateEmailPreferences,
  type MrtEmailPreferences,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

type PrefsEntry = {field: string; value: string};

const COLUMNS: Record<string, ColumnDef<PrefsEntry>> = {
  field: {
    header: 'Preference',
    get: (e) => e.field,
  },
  value: {
    header: 'Value',
    get: (e) => e.value,
  },
};

const DEFAULT_COLUMNS = ['field', 'value'];

/**
 * View or update email notification preferences.
 */
export default class MrtUserEmailPrefs extends MrtCommand<typeof MrtUserEmailPrefs> {
  static description = t('commands.mrt.user.email-prefs.description', 'View or update email notification preferences');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --node-deprecation=true',
    '<%= config.bin %> <%= command.id %> --node-deprecation=false --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    'node-deprecation': Flags.boolean({
      description: 'Enable/disable Node.js deprecation notifications',
      allowNo: true,
    }),
  };

  async run(): Promise<MrtEmailPreferences> {
    this.requireMrtCredentials();

    const nodeDeprecation = this.flags['node-deprecation'];

    // If flag is provided, update preferences
    if (nodeDeprecation !== undefined) {
      this.log(t('commands.mrt.user.email-prefs.updating', 'Updating email preferences...'));

      const result = await updateEmailPreferences(
        {
          nodeDeprecationNotifications: nodeDeprecation,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.user.email-prefs.updated', 'Email preferences updated successfully.'));
        this.displayPreferences(result);
      }

      return result;
    }

    // Otherwise, get current preferences
    this.log(t('commands.mrt.user.email-prefs.fetching', 'Fetching email preferences...'));

    const prefs = await getEmailPreferences(
      {
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.displayPreferences(prefs);
    }

    return prefs;
  }

  private displayPreferences(prefs: MrtEmailPreferences): void {
    const entries: PrefsEntry[] = [
      {
        field: 'Node.js Deprecation Notifications',
        value: prefs.node_deprecation_notifications ? 'Enabled' : 'Disabled',
      },
      {
        field: 'Created',
        value: prefs.created_at ? new Date(prefs.created_at).toLocaleString() : '-',
      },
      {
        field: 'Updated',
        value: prefs.updated_at ? new Date(prefs.updated_at).toLocaleString() : '-',
      },
    ];
    createTable(COLUMNS).render(entries, DEFAULT_COLUMNS);
  }
}
