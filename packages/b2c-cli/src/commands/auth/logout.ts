/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {clearAllAuthSessions} from '@salesforce/b2c-tooling-sdk/auth';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Clear all stored OAuth sessions, including the legacy sfcc-ci-compatible
 * renewal record. After logout, commands resolve a configured stateless flow
 * or start the default PKCE browser flow.
 */
export default class AuthLogout extends BaseCommand<typeof AuthLogout> {
  static description = withDocs(
    t('commands.auth.logout.description', 'Clear stored session (stateful auth)'),
    '/cli/auth.html#b2c-auth-logout',
  );

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static hiddenAliases = ['auth:logout'];

  async run(): Promise<void> {
    clearAllAuthSessions();
    this.log(t('commands.auth.logout.success', 'Logged out. Stored session cleared.'));
  }
}
