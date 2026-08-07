/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {findAuthSession, listAuthSessions, isAuthSessionTokenValid, decodeJWT} from '@salesforce/b2c-tooling-sdk/auth';
import {t} from '../../../i18n/index.js';

/**
 * JSON output structure for the auth client token command.
 */
interface AuthClientTokenOutput {
  accessToken: string;
  clientId: string;
  expires: string;
  scopes: string[];
  user: null | string;
}

/**
 * Return the stored authentication token. With multiple stored sessions
 * (e.g. one from `auth client`, one from `auth login`), pass `--client-id`
 * to disambiguate.
 */
export default class AuthClientToken extends BaseCommand<typeof AuthClientToken> {
  static description = t('commands.auth.client.token.description', 'Return the stored authentication token');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --client-id <id>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    'client-id': Flags.string({
      description: 'Client ID for the stored session to read',
      env: 'SFCC_CLIENT_ID',
      helpGroup: 'AUTH',
    }),
  };

  static hiddenAliases = ['client:auth:token'];

  async run(): Promise<AuthClientTokenOutput> {
    const requestedClientId = this.flags['client-id'];
    let session = requestedClientId ? findAuthSession(requestedClientId) : null;

    if (!session && !requestedClientId) {
      const all = listAuthSessions();
      if (all.length === 1) {
        session = all[0];
      } else if (all.length > 1) {
        this.error(
          t('commands.auth.client.token.ambiguous', 'Multiple stored sessions found. Pass --client-id to choose one.'),
        );
      }
    }

    if (!session?.accessToken) {
      this.error(
        t(
          'commands.auth.client.token.noToken',
          'No authentication token found. Run `auth client` or `auth login` to authenticate first.',
        ),
      );
    }

    let expires = '';
    let scopes: string[] = session.scopes ?? [];
    try {
      const decoded = decodeJWT(session.accessToken);
      const exp = decoded.payload.exp as number | undefined;
      if (typeof exp === 'number') {
        expires = new Date(exp * 1000).toISOString();
      }
      if (scopes.length === 0) {
        const scope = decoded.payload.scope as string | string[] | undefined;
        scopes = scope === null || scope === undefined ? [] : Array.isArray(scope) ? scope : scope.split(' ');
      }
    } catch {
      // not a JWT; ignore
    }

    const valid = isAuthSessionTokenValid(session);

    const output: AuthClientTokenOutput = {
      accessToken: session.accessToken,
      clientId: session.clientId,
      expires,
      scopes,
      user: session.sub ?? null,
    };

    if (this.jsonEnabled()) {
      if (!valid) {
        this.warn(
          t(
            'commands.auth.client.token.expired',
            'Token is expired or invalid. Run `auth client` or `auth login` to re-authenticate.',
          ),
        );
      }
      return output;
    }

    ux.stdout(session.accessToken);

    return output;
  }
}
