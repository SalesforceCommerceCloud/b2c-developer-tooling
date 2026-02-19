/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getStoredSession, setStoredSession} from '@salesforce/b2c-tooling-sdk/auth';
import {t} from '../../../i18n/index.js';

/**
 * Renew the client authentication token using stored credentials.
 * Mirrors sfcc-ci `client:auth:renew` command behavior. Requires that the initial
 * authentication was done with the --renew flag (which stores the credentials needed
 * for renewal).
 *
 * Uses refresh_token grant when a refresh token is stored, otherwise falls back
 * to client_credentials grant using the stored base64-encoded client:secret.
 */
export default class AuthClientRenew extends OAuthCommand<typeof AuthClientRenew> {
  static description = t('commands.auth.client.renew.description', 'Renew the client authentication token');

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    const session = getStoredSession();

    if (!session?.renewBase) {
      this.error(
        t(
          'commands.auth.client.renew.notRenewable',
          'Authentication renewal not possible. Ensure initial authentication is done with --renew flag.',
        ),
      );
    }

    const accountManagerHost = this.accountManagerHost;
    const url = `https://${accountManagerHost}/dwsso/oauth2/access_token`;

    // Use refresh_token grant if available, otherwise client_credentials
    const grantPayload: Record<string, string> =
      session.refreshToken !== null && session.refreshToken !== undefined && session.refreshToken !== ''
        ? {grant_type: 'refresh_token', refresh_token: session.refreshToken}
        : {grant_type: 'client_credentials'};

    const method = 'POST';
    const body = new URLSearchParams(grantPayload).toString();

    this.logger.debug(
      {grantType: grantPayload.grant_type, clientId: session.clientId},
      `[StatefulAuth] Renewing token using OAuth ${grantPayload.grant_type} grant for client: ${session.clientId}`,
    );
    this.logger.debug({method, url}, `[StatefulAuth REQ] ${method} ${url}`);
    this.logger.trace({method, url, body}, `[StatefulAuth REQ BODY] ${method} ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${session.renewBase}`,
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
      this.error(t('commands.auth.client.renew.failed', 'Authentication renewal failed: {{error}}', {error: errorMsg}));
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope?: string;
    };

    this.logger.trace({method, url, body: data}, `[StatefulAuth RESP BODY] ${method} ${url}`);

    // Update stored session with new token (server may issue a new refresh token)
    setStoredSession({
      clientId: session.clientId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? session.refreshToken ?? null,
      renewBase: session.renewBase,
      user: session.user ?? null,
    });

    this.log(t('commands.auth.client.renew.success', 'Authentication renewal succeeded.'));
  }
}
