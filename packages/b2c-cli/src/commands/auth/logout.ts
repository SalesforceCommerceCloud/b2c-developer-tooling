/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {clearStoredSession} from '@salesforce/b2c-tooling-sdk/auth';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Clear the stored OAuth session (stateful auth).
 * Uses the same storage as sfcc-ci; after logout, commands use stateless auth
 * (client credentials or implicit) when configured.
 */
export default class AuthLogout extends BaseCommand<typeof AuthLogout> {
  static description = withDocs(
    t('commands.auth.logout.description', 'Clear stored session (stateful auth)'),
    '/cli/auth.html#b2c-auth-logout',
  );

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    clearStoredSession();
    this.log(t('commands.auth.logout.success', 'Logged out. Stored session cleared.'));
  }
}
