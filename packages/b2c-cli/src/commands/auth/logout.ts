/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {clearAllAuthSessions, describeAuthSession, listAuthSessions} from '@salesforce/b2c-tooling-sdk/auth';
import {clientLabel} from '../../utils/auth/describe.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Clear all stored OAuth sessions, including the legacy sfcc-ci-compatible
 * renewal record. After logout, commands resolve a configured stateless flow
 * or start the default PKCE browser flow.
 */
export default class AuthLogout extends BaseCommand<typeof AuthLogout> {
  static description = withDocs(
    t('commands.auth.logout.description', 'Sign out of Account Manager and clear saved sign-ins'),
    '/cli/auth.html#b2c-auth-logout',
  );

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static hiddenAliases = ['auth:logout'];

  async run(): Promise<void> {
    const names = listAuthSessions().map((session) => {
      const {builtInClient, user} = describeAuthSession(session, this.resolvedConfig.values.accountManagerHost);
      return user ?? clientLabel(session.clientId, builtInClient);
    });
    clearAllAuthSessions();
    if (names.length === 0) {
      this.log(t('commands.auth.logout.none', 'You were not signed in.'));
      return;
    }
    this.log(t('commands.auth.logout.success', 'Signed out {{names}}.', {names: [...new Set(names)].join(', ')}));
  }
}
