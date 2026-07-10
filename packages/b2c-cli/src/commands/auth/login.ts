/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, loadConfig} from '@salesforce/b2c-tooling-sdk/cli';
import {ImplicitOAuthStrategy, createUserAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

const LOGIN_AUTH_METHODS = ['user', 'implicit'] as const;
type LoginAuthMethod = (typeof LOGIN_AUTH_METHODS)[number];

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

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> your-client-id',
    '<%= config.bin %> <%= command.id %> --auth-methods implicit',
  ];

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
    'auth-methods': Flags.string({
      description: 'Browser-based auth flow to use. Defaults to "user" (Authorization Code + PKCE).',
      options: [...LOGIN_AUTH_METHODS],
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
    const method = this.selectMethod();

    if (method === 'implicit') {
      this.warn(
        t(
          'warning.implicitFlowDeprecated',
          'The OAuth implicit flow is deprecated. Create a new public OAuth client in Account Manager ' +
            'and use Authorization Code + PKCE (the default) instead. ' +
            'See https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#implicit-flow-deprecation',
        ),
      );
      const strategy = new ImplicitOAuthStrategy({clientId, scopes, accountManagerHost});
      await strategy.getTokenResponse();
    } else {
      // PKCE with an automatic, WARN-logged fallback to the implicit flow for
      // clients not yet registered for PKCE (see oauth-pkce-fallback in the SDK).
      const strategy = createUserAuthStrategy({clientId, scopes, accountManagerHost});
      await strategy.getTokenResponse();
    }

    this.log(t('commands.auth.login.success', 'Login succeeded. Session saved for stateful auth.'));
  }

  private selectMethod(): LoginAuthMethod {
    const methods = this.flags['auth-methods'] as string[] | undefined;
    if (!methods || methods.length === 0) return 'user';
    // oclif's `options` constraint already restricts values to LOGIN_AUTH_METHODS.
    // Pick the first one as the chosen flow — login is single-flow by nature.
    return methods[0] as LoginAuthMethod;
  }
}
