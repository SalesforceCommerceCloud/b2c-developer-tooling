/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {ImplicitOAuthStrategy, setStoredSession, decodeJWT} from '@salesforce/b2c-tooling-sdk/auth';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Log in via browser (implicit OAuth) and persist the session for stateful auth.
 * Uses the same storage as sfcc-ci; when valid, subsequent commands use this token
 * until it expires or you run auth:logout.
 */
export default class AuthLogin extends OAuthCommand<typeof AuthLogin> {
  static description = withDocs(
    t('commands.auth.login.description', 'Log in via browser and save session (stateful auth)'),
    '/cli/auth.html#b2c-auth-login',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --client-id your-client-id',
  ];

  async run(): Promise<void> {
    const clientId = this.resolvedConfig.values.clientId ?? this.getDefaultClientId();
    if (!clientId) {
      this.error(
        t('error.oauthClientIdRequired', 'OAuth client ID required. Provide --client-id or set SFCC_CLIENT_ID.'),
      );
    }

    const accountManagerHost = this.accountManagerHost;
    const scopes = this.resolvedConfig.values.scopes;

    const strategy = new ImplicitOAuthStrategy({
      clientId,
      scopes,
      accountManagerHost,
    });

    const tokenResponse = await strategy.getTokenResponse();

    let user: null | string = null;
    try {
      const decoded = decodeJWT(tokenResponse.accessToken);
      if (typeof decoded.payload.sub === 'string') {
        user = decoded.payload.sub;
      }
    } catch {
      // ignore
    }

    setStoredSession({
      clientId,
      accessToken: tokenResponse.accessToken,
      refreshToken: null,
      renewBase: null,
      user,
    });

    this.log(t('commands.auth.login.success', 'Login succeeded. Session saved for stateful auth.'));
  }
}
