/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, listFromEnv, loadConfig} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ImplicitOAuthStrategy,
  createUserAuthStrategy,
  describeSignIn,
  findAuthSession,
  type AccessTokenResponse,
} from '@salesforce/b2c-tooling-sdk/auth';
import {
  DEFAULT_ACCOUNT_MANAGER_HOST,
  getDefaultPublicClientId,
  getLegacyImplicitPublicClientId,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

const LOGIN_AUTH_METHODS = ['user', 'implicit'] as const;

type LoginAuthMethod = (typeof LOGIN_AUTH_METHODS)[number];

/** Command-line flags that contradict --default-client. */
const DEFAULT_CLIENT_CONFLICTS = ['--client-id', '--auth-methods'];

/**
 * Log in via browser (Authorization Code + PKCE) and persist the session for
 * stateful auth. PKCE sessions use the CLI's unified multi-session store; old
 * sfcc-ci-compatible renewal records are intentionally not reused.
 */
export default class AuthLogin extends BaseCommand<typeof AuthLogin> {
  static args = {
    clientId: Args.string({
      description: 'Client ID for OAuth (same as --client-id)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.auth.login.description', 'Sign in to Account Manager in your browser and stay signed in'),
    '/cli/auth.html#b2c-auth-login',
  );

  static examples = [
    {description: 'Sign in with your Account Manager account', command: '<%= config.bin %> <%= command.id %>'},
    {
      description: 'Sign in with your own API client',
      command: '<%= config.bin %> <%= command.id %> --client-id your-client-id',
    },
    {
      description: 'Sign in with the built-in client even when a client is configured',
      command: '<%= config.bin %> <%= command.id %> --default-client',
    },
    {
      description: 'Use the deprecated implicit flow for a client not yet migrated to PKCE',
      command: '<%= config.bin %> <%= command.id %> --client-id your-client-id --auth-methods implicit',
    },
  ];

  static flags = {
    'client-id': Flags.string({
      description: 'Client ID for OAuth (default: configured client, then the built-in client)',
      env: 'SFCC_CLIENT_ID',
      default: async () => process.env.SFCC_OAUTH_CLIENT_ID || undefined,
      helpGroup: 'AUTH',
    }),
    'default-client': Flags.boolean({
      description: 'Sign in with the built-in client, ignoring any configured client (env: SFCC_DEFAULT_CLIENT)',
      env: 'SFCC_DEFAULT_CLIENT',
      default: false,
      helpGroup: 'AUTH',
    }),
    'account-manager-host': Flags.string({
      description: `Account Manager hostname for OAuth (default: ${DEFAULT_ACCOUNT_MANAGER_HOST})`,
      env: 'SFCC_ACCOUNT_MANAGER_HOST',
      default: async () => process.env.SFCC_LOGIN_URL || undefined,
      helpGroup: 'AUTH',
    }),
    'auth-scope': Flags.string({
      description: 'OAuth scopes to request (comma-separated; env: SFCC_OAUTH_SCOPES)',
      default: listFromEnv('SFCC_OAUTH_SCOPES'),
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
      helpGroup: 'AUTH',
    }),
    'auth-methods': Flags.string({
      description:
        'Browser-based auth flow to use. Defaults to "user" (Authorization Code + PKCE). Env: SFCC_AUTH_METHODS.',
      default: listFromEnv('SFCC_AUTH_METHODS'),
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
    // SFCC_AUTH_METHODS may list methods for other commands; keep only the browser flows.
    const authMethods = (this.flags['auth-methods'] as string[] | undefined)?.filter(
      (method): method is LoginAuthMethod => (LOGIN_AUTH_METHODS as readonly string[]).includes(method),
    );
    return loadConfig(
      {
        // The positional argument predates --client-id and wins when both are given.
        clientId: this.args.clientId ?? (this.flags['client-id'] as string | undefined),
        accountManagerHost: this.flags['account-manager-host'] as string | undefined,
        scopes: scopes && scopes.length > 0 ? scopes : undefined,
        authMethods: authMethods && authMethods.length > 0 ? authMethods : undefined,
      },
      this.getBaseConfigOptions(),
    );
  }

  async run(): Promise<void> {
    const accountManagerHost = this.resolvedConfig.values.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST;
    const {scopes, selfSignedApi} = this.resolvedConfig.values;
    if (this.flags['default-client']) this.rejectDefaultClientConflicts();
    const method = this.flags['default-client'] ? 'user' : this.selectMethod();
    // Without a configured client, sign in with the built-in client that WebDAV, sandbox, and
    // Account Manager commands use, so they don't prompt again. --default-client ignores a
    // configured client from any source.
    const configuredClientId = this.flags['default-client'] ? undefined : this.resolvedConfig.values.clientId;
    const clientId =
      configuredClientId ??
      (method === 'implicit'
        ? getLegacyImplicitPublicClientId(accountManagerHost)
        : getDefaultPublicClientId(accountManagerHost));

    // The SDK reports new and renewed sign-ins; only a still-valid sign-in that can't renew is reported here.
    const previous = findAuthSession(clientId);
    let token: AccessTokenResponse;
    if (method === 'implicit') {
      this.warn(
        t(
          'warning.implicitFlowDeprecated',
          'The OAuth implicit flow is deprecated. Create a new public OAuth client in Account Manager ' +
            'and use Authorization Code + PKCE (the default) instead. ' +
            'See https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#implicit-flow-deprecation',
        ),
      );
      const strategy = new ImplicitOAuthStrategy({clientId, scopes, accountManagerHost, selfSignedApi});
      token = await strategy.getTokenResponse();
    } else {
      // PKCE with an automatic, WARN-logged fallback to the implicit flow for
      // clients not yet registered for PKCE (see oauth-pkce-fallback in the SDK).
      const strategy = createUserAuthStrategy({
        clientId,
        scopes,
        accountManagerHost,
        selfSignedApi,
        forceRefresh: true,
      });
      token = await strategy.getTokenResponse();
    }

    if (previous && token.accessToken === previous.accessToken) {
      this.log(
        describeSignIn({
          action: 'reused',
          clientId,
          accountManagerHost,
          user: previous.sub,
          expiresAt: token.expires,
          refreshToken: previous.refreshToken,
        }),
      );
    }
  }

  /**
   * --default-client overrides a client from env vars or config, but not one given on the command line.
   */
  private rejectDefaultClientConflicts(): void {
    const conflict =
      this.args.clientId === undefined
        ? DEFAULT_CLIENT_CONFLICTS.find((flag) => this.argv.some((arg) => arg === flag || arg.startsWith(`${flag}=`)))
        : 'CLIENTID';
    if (conflict) {
      this.error(
        t('error.defaultClientConflict', '{{flag}} cannot also be provided when using --default-client', {
          flag: conflict,
        }),
      );
    }
  }

  private selectMethod(): LoginAuthMethod {
    // CLI/env values are merged into resolvedConfig by loadConfiguration(), so
    // this also honors an explicit dw.json `auth-methods` selection. Ignore
    // non-browser methods because `auth login` is browser-only; absent an
    // explicit browser method, PKCE remains the absolute default.
    const method = this.resolvedConfig.values.authMethods?.find((candidate): candidate is LoginAuthMethod =>
      LOGIN_AUTH_METHODS.includes(candidate as LoginAuthMethod),
    );
    return method ?? 'user';
  }
}
