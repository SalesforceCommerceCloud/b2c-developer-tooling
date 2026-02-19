/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {setStoredSession, decodeJWT} from '@salesforce/b2c-tooling-sdk/auth';
import {t} from '../../../i18n/index.js';

/**
 * Authenticate an API client (client_credentials or password grant) and persist the session.
 * Mirrors sfcc-ci `client:auth` command behavior. Uses the same stateful store so tokens
 * are shared with sfcc-ci, b2c auth:login, and subsequent CLI commands.
 *
 * Grant type is auto-detected based on credentials provided:
 *   - client_credentials: when only --client-id + --client-secret are given
 *   - password: when --user + --user-password are also provided
 *
 * Use --renew to enable automatic token renewal for later use with `auth client renew`.
 */
export default class AuthClient extends OAuthCommand<typeof AuthClient> {
  static description = t('commands.auth.client.description', 'Authenticate an API client and save session');

  static examples = [
    '<%= config.bin %> <%= command.id %> --client-id <id> --client-secret <secret>',
    '<%= config.bin %> <%= command.id %> --client-id <id> --client-secret <secret> --renew',
    '<%= config.bin %> <%= command.id %> --client-id <id> --client-secret <secret> --user <email> --user-password <pwd>',
    '<%= config.bin %> <%= command.id %> --client-id <id> --client-secret <secret> --grant-type client_credentials',
  ];

  static flags = {
    renew: Flags.boolean({
      char: 'r',
      description: 'Enable automatic token renewal (stores credentials for later refresh)',
      default: false,
    }),
    'grant-type': Flags.string({
      char: 't',
      description: 'OAuth grant type (default: auto-detect based on provided credentials)',
      options: ['client_credentials', 'password'],
    }),
    user: Flags.string({
      description: 'Username for resource owner password credentials grant',
      env: 'SFCC_OAUTH_USER_NAME',
    }),
    'user-password': Flags.string({
      description: 'Password for resource owner password credentials grant',
      env: 'SFCC_OAUTH_USER_PASSWORD',
    }),
  };

  async run(): Promise<void> {
    const clientId = this.resolvedConfig.values.clientId;
    const clientSecret = this.resolvedConfig.values.clientSecret;

    if (!clientId || !clientSecret) {
      this.error(
        t(
          'commands.auth.client.credentialsRequired',
          'Client ID and client secret are required. Provide --client-id and --client-secret or set SFCC_CLIENT_ID and SFCC_CLIENT_SECRET.',
        ),
      );
    }

    const user = this.flags.user;
    const userPassword = this.flags['user-password'];
    const grantTypeFlag = this.flags['grant-type'];
    const autoRenew = this.flags.renew;

    // Determine grant type: explicit flag > auto-detect from user/password > client_credentials
    let grantType: string;
    if (grantTypeFlag) {
      grantType = grantTypeFlag;
    } else if (user) {
      grantType = 'password';
    } else {
      grantType = 'client_credentials';
    }

    if (grantType === 'password' && (!user || !userPassword)) {
      this.error(
        t(
          'commands.auth.client.userRequired',
          'Username and password are required for password grant. Provide --user and --user-password.',
        ),
      );
    }

    const accountManagerHost = this.accountManagerHost;
    const scopes = this.resolvedConfig.values.scopes;

    const grantPayload: Record<string, string> = {grant_type: grantType};
    if (grantType === 'password') {
      grantPayload.username = user!;
      grantPayload.password = userPassword!;
    }
    if (scopes && scopes.length > 0) {
      grantPayload.scope = scopes.join(' ');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = `https://${accountManagerHost}/dwsso/oauth2/access_token`;

    const method = 'POST';
    const body = new URLSearchParams(grantPayload).toString();

    this.logger.debug({grantType, clientId}, `[StatefulAuth] Using OAuth ${grantType} grant for client: ${clientId}`);
    this.logger.debug({method, url}, `[StatefulAuth REQ] ${method} ${url}`);
    this.logger.trace({method, url, body}, `[StatefulAuth REQ BODY] ${method} ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const duration = Date.now() - startTime;

    this.logger.debug(
      {method, url, status: response.status, duration},
      `[StatefulAuth RESP] ${method} ${url} ${response.status} ${duration}ms`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.trace({method, url, body: errorText}, `[StatefulAuth RESP BODY] ${method} ${url}`);
      let errorMsg: string;
      try {
        const parsed = JSON.parse(errorText) as {error_description?: string};
        errorMsg = parsed.error_description ?? errorText;
      } catch {
        errorMsg = errorText;
      }
      this.error(t('commands.auth.client.failed', 'Authentication failed: {{error}}', {error: errorMsg}));
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      id_token?: string;
      scope?: string;
    };

    this.logger.trace({method, url, body: data}, `[StatefulAuth RESP BODY] ${method} ${url}`);

    // Extract user from id_token JWT if issued (matches sfcc-ci behavior)
    let sessionUser: null | string = null;
    if (data.id_token) {
      try {
        const decoded = decodeJWT(data.id_token);
        if (typeof decoded.payload.sub === 'string') {
          sessionUser = decoded.payload.sub;
        }
      } catch {
        // Ignore JWT decode errors for id_token
      }
    }

    setStoredSession({
      clientId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      renewBase: autoRenew ? credentials : null,
      user: sessionUser,
    });

    const renewMsg = autoRenew ? ' Auto-renewal enabled.' : '';
    this.log(t('commands.auth.client.success', 'Authentication succeeded.{{renewMsg}}', {renewMsg}));
  }
}
