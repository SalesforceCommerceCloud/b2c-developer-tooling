/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getStoredSession, isStatefulTokenValid, decodeJWT} from '@salesforce/b2c-tooling-sdk/auth';
import {t} from '../../../i18n/index.js';

/**
 * JSON output structure for the auth client token command.
 */
interface AuthClientTokenOutput {
  accessToken: string;
  clientId: string;
  expires: string;
  renewable: boolean;
  scopes: string[];
  user: null | string;
}

/**
 * Return the current authentication token from the stateful store.
 * Mirrors sfcc-ci `client:auth:token` command behavior.
 */
export default class AuthClientToken extends BaseCommand<typeof AuthClientToken> {
  static description = t(
    'commands.auth.client.token.description',
    'Return the current authentication token (stateful)',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  async run(): Promise<AuthClientTokenOutput> {
    this.logger.debug('[StatefulAuth] Reading stored session from stateful store');

    const session = getStoredSession();

    if (!session?.accessToken) {
      this.logger.debug('[StatefulAuth] No stored session found');
      this.error(
        t(
          'commands.auth.client.token.noToken',
          'No authentication token found. Run `auth client` to authenticate first.',
        ),
      );
    }

    this.logger.debug(
      {clientId: session.clientId, user: session.user},
      `[StatefulAuth] Found session for client: ${session.clientId}`,
    );

    // Decode JWT to extract metadata
    let expires = '';
    let scopes: string[] = [];
    try {
      const decoded = decodeJWT(session.accessToken);
      const exp = decoded.payload.exp as number | undefined;
      if (typeof exp === 'number') {
        expires = new Date(exp * 1000).toISOString();
      }
      const scope = decoded.payload.scope as string | string[] | undefined;
      scopes = scope === null || scope === undefined ? [] : Array.isArray(scope) ? scope : scope.split(' ');
      this.logger.debug({expires, scopes}, '[StatefulAuth] Decoded JWT claims');
    } catch {
      this.logger.debug('[StatefulAuth] Token is not a valid JWT; returning raw token');
    }

    const valid = isStatefulTokenValid(session);
    const renewable = session.renewBase !== null && session.renewBase !== undefined && session.renewBase !== '';

    this.logger.debug({valid, renewable}, `[StatefulAuth] Token valid: ${valid}, renewable: ${renewable}`);

    const output: AuthClientTokenOutput = {
      accessToken: session.accessToken,
      clientId: session.clientId,
      expires,
      renewable,
      scopes,
      user: session.user ?? null,
    };

    if (this.jsonEnabled()) {
      if (!valid) {
        this.warn(
          t(
            'commands.auth.client.token.expired',
            'Token is expired or invalid. Run `auth client renew` or `auth client` to refresh.',
          ),
        );
      }
      return output;
    }

    // In normal mode, output just the raw token to stdout (matches sfcc-ci behavior)
    ux.stdout(session.accessToken);

    return output;
  }
}
