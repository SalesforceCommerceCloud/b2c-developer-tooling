/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {InstanceAuthPath, InstanceAuthSession} from '@salesforce/b2c-tooling-sdk/auth';
import {t} from '../../i18n/index.js';

/** Client label: the built-in public client by name, others by ID. */
export function clientLabel(clientId: string, builtInClient?: boolean): string {
  return builtInClient ? t('auth.describe.builtInClient', 'built-in client') : clientId;
}

/** How a request type authenticates, e.g. "browser login (built-in client)". */
export function describeAuthPath(path: InstanceAuthPath): string {
  const client = path.clientId ? clientLabel(path.clientId, path.builtInClient) : '';
  switch (path.method) {
    case 'basic': {
      return t('auth.describe.basic', 'Basic (username and access key)');
    }
    case 'client-credentials': {
      return t('auth.describe.clientCredentials', 'client credentials ({{client}})', {client});
    }
    case 'jwt': {
      return t('auth.describe.jwt', 'JWT ({{client}})', {client});
    }
    case 'none': {
      return '-';
    }
    case 'user': {
      return t('auth.describe.user', 'browser login ({{client}})', {client});
    }
  }
}

/** Sign-in state of a browser-login path, e.g. "signed in as dev@example.com". */
export function describeSessionState(path: InstanceAuthPath, session: InstanceAuthSession | undefined): string {
  if (path.method !== 'user' && !session) return '';
  if (!session) return t('auth.describe.notSignedIn', 'not signed in; first use opens a browser');
  const user = session.user ?? t('auth.describe.unknownUser', 'unknown user');
  if (session.accessTokenValid) return t('auth.describe.signedIn', 'signed in as {{user}}', {user});
  if (session.canRefresh) {
    return t('auth.describe.renews', 'signed in as {{user}}; renews on next use', {user});
  }
  return t('auth.describe.expired', 'session expired; next use signs in again');
}

/** Access-token state for session listings. */
export function describeAccessToken(session: Pick<InstanceAuthSession, 'accessTokenExpiresAt' | 'accessTokenValid'>) {
  if (!session.accessTokenExpiresAt) return session.accessTokenValid ? t('auth.describe.valid', 'valid') : '-';
  const when = new Date(session.accessTokenExpiresAt).toLocaleString();
  return session.accessTokenValid
    ? t('auth.describe.validUntil', 'valid until {{when}}', {when})
    : t('auth.describe.expiredAt', 'expired {{when}}', {when});
}
