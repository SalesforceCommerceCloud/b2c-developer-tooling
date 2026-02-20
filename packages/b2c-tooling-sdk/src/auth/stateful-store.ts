/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Stateful auth store using the same storage mechanism and keys as sfcc-ci.
 * Uses the `conf` package with projectName 'sfcc-ci' so tokens persist across
 * sfcc-ci and b2c-cli when present and valid.
 *
 * @module auth/stateful-store
 */
import Conf from 'conf';
import {decodeJWT} from './oauth.js';
import {getLogger} from '../logging/logger.js';

/** Config keys matching sfcc-ci lib/config usage */
const SFCC_CLIENT_ID = 'SFCC_CLIENT_ID';
const SFCC_CLIENT_TOKEN = 'SFCC_CLIENT_TOKEN';
const SFCC_REFRESH_TOKEN = 'SFCC_REFRESH_TOKEN';
const SFCC_CLIENT_RENEW_BASE = 'SFCC_CLIENT_RENEW_BASE';
const SFCC_USER = 'SFCC_USER';

/** Default buffer (seconds) before token exp to consider it expired */
const EXPIRY_BUFFER_SEC = 60;

let storeInstance: Conf | null = null;

/**
 * Returns the conf store instance (projectName 'sfcc-ci' for compatibility with sfcc-ci).
 * Uses 'sfcc-ci-test' when NODE_ENV === 'test' so tests do not touch user config.
 */
function getStore(): Conf {
  if (!storeInstance) {
    const projectName = process.env.NODE_ENV === 'test' ? 'sfcc-ci-test' : 'sfcc-ci';
    storeInstance = new Conf({projectName});
  }
  return storeInstance;
}

/**
 * Stored session read from stateful store.
 * Matches sfcc-ci persisted keys.
 */
export interface StatefulSession {
  clientId: string;
  accessToken: string;
  refreshToken?: string | null;
  /** Base64-encoded "clientId:clientSecret" for token renewal (client_credentials or refresh_token). */
  renewBase?: string | null;
  user?: string | null;
}

/**
 * Reads the current stateful session from store if present.
 * Returns null if no access token is stored.
 */
export function getStoredSession(): StatefulSession | null {
  const store = getStore();
  const accessToken = store.get(SFCC_CLIENT_TOKEN) as string | undefined;
  if (!accessToken) {
    return null;
  }
  const clientId = store.get(SFCC_CLIENT_ID) as string | undefined;
  if (!clientId) {
    return null;
  }
  return {
    clientId,
    accessToken,
    refreshToken: (store.get(SFCC_REFRESH_TOKEN) as string | undefined) ?? null,
    renewBase: (store.get(SFCC_CLIENT_RENEW_BASE) as string | undefined) ?? null,
    user: (store.get(SFCC_USER) as string | undefined) ?? null,
  };
}

/**
 * Writes a session to the stateful store (same keys as sfcc-ci).
 */
export function setStoredSession(session: StatefulSession): void {
  const store = getStore();
  store.set(SFCC_CLIENT_ID, session.clientId);
  store.set(SFCC_CLIENT_TOKEN, session.accessToken);
  if (session.refreshToken != null) {
    store.set(SFCC_REFRESH_TOKEN, session.refreshToken);
  } else {
    store.delete(SFCC_REFRESH_TOKEN);
  }
  if (session.renewBase != null) {
    store.set(SFCC_CLIENT_RENEW_BASE, session.renewBase);
  } else {
    store.delete(SFCC_CLIENT_RENEW_BASE);
  }
  if (session.user != null) {
    store.set(SFCC_USER, session.user);
  } else {
    store.delete(SFCC_USER);
  }
}

/**
 * Clears all stateful auth data (same keys as sfcc-ci clear()).
 */
export function clearStoredSession(): void {
  const store = getStore();
  store.delete(SFCC_CLIENT_ID);
  store.delete(SFCC_CLIENT_TOKEN);
  store.delete(SFCC_REFRESH_TOKEN);
  store.delete(SFCC_CLIENT_RENEW_BASE);
  store.delete(SFCC_USER);
}

/**
 * Checks whether the stored access token is present and valid: not expired
 * (with a small buffer), optionally satisfies required scopes, and optionally
 * matches the expected client ID.
 * Does not perform network calls.
 *
 * @param session - Session from getStoredSession()
 * @param requiredScopes - If provided, token must include all of these scopes
 * @param expiryBufferSec - Seconds before exp to treat token as expired (default 60)
 * @param requiredClientId - If provided, session clientId must match
 * @returns true if token is present and valid for use
 */
export function isStatefulTokenValid(
  session: StatefulSession,
  requiredScopes: string[] = [],
  expiryBufferSec: number = EXPIRY_BUFFER_SEC,
  requiredClientId?: string,
): boolean {
  const logger = getLogger();
  try {
    if (requiredClientId && session.clientId !== requiredClientId) {
      logger.debug({storedClientId: session.clientId, requiredClientId}, '[StatefulAuth] Token client ID mismatch');
      return false;
    }
    const decoded = decodeJWT(session.accessToken);
    const exp = decoded.payload.exp;
    if (typeof exp !== 'number') {
      logger.debug('[StatefulAuth] Token has no exp claim; treating as invalid');
      return false;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= exp - expiryBufferSec) {
      logger.debug('[StatefulAuth] Token expired or within buffer');
      return false;
    }
    if (requiredScopes.length > 0) {
      const tokenScopes = (decoded.payload.scope as string | string[] | undefined) ?? [];
      const scopeList = Array.isArray(tokenScopes) ? tokenScopes : tokenScopes.split(' ');
      const hasAll = requiredScopes.every((s) => scopeList.includes(s));
      if (!hasAll) {
        logger.debug({requiredScopes, tokenScopes: scopeList}, '[StatefulAuth] Token missing required scopes');
        return false;
      }
    }
    return true;
  } catch (e) {
    logger.debug({err: e}, '[StatefulAuth] Token invalid (e.g. not a JWT)');
    return false;
  }
}

/**
 * Resets the store instance (for tests).
 * @internal
 */
export function resetStatefulStoreForTesting(): void {
  storeInstance = null;
}
