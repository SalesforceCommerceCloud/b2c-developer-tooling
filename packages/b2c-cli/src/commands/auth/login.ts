/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, loadConfig} from '@salesforce/b2c-tooling-sdk/cli';
import {PkceOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Log in via browser (Authorization Code + PKCE) and persist the session for
 * stateful auth. Uses the same storage as sfcc-ci; when valid, subsequent
 * commands use this token until it expires or you run auth:logout.
 */
export default class AuthLogin extends BaseCommand<typeof AuthLogin> {
  static args = {
    clientId: Args.string({
      description: 'Client ID for OAuth (falls back to SFCC_CLIENT_ID env var)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.auth.login.description', 'Log in via browser and save session (stateful auth)'),
    '/cli/auth.html#b2c-auth-login',
  );

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> your-client-id'];

  static flags = {
    'account-manager-host': Flags.string({
      description: `Account Manager hostname for OAuth (default: ${DEFAULT_ACCOUNT_MANAGER_HOST})`,
      env: 'SFCC_ACCOUNT_MANAGER_HOST',
      default: async () => process.env.SFCC_LOGIN_URL || undefined,
      helpGroup: 'AUTH',
    }),
    'auth-scope': Flags.string({
      description: 'OAuth scopes to request (comma-separated)',
      env: 'SFCC_OAUTH_SCOPES',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
      helpGroup: 'AUTH',
    }),
  };

  static hiddenAliases = ['auth:login'];

  protected override loadConfiguration() {
    const scopes = this.flags['auth-scope'] as string[] | undefined;
    return loadConfig(
      {
        clientId: this.args.clientId ?? process.env.SFCC_CLIENT_ID,
        accountManagerHost: this.flags['account-manager-host'] as string | undefined,
        scopes: scopes && scopes.length > 0 ? scopes : undefined,
      },
      this.getBaseConfigOptions(),
    );
  }

  async run(): Promise<void> {
    const clientId = this.resolvedConfig.values.clientId;
    if (!clientId) {
      this.error(
        t(
          'error.oauthClientIdRequired',
          'OAuth client ID required. Provide a client ID argument or set SFCC_CLIENT_ID.',
        ),
      );
    }

    const accountManagerHost = this.resolvedConfig.values.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST;
    const scopes = this.resolvedConfig.values.scopes;

    const strategy = new PkceOAuthStrategy({
      clientId,
      scopes,
      accountManagerHost,
    });

    // PkceOAuthStrategy persists the session (with refresh token) to the
    // unified auth-session store on its own.
    await strategy.getTokenResponse();

    this.log(t('commands.auth.login.success', 'Login succeeded. Session saved for stateful auth.'));
  }
}
