/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Stateful auth store backed by a JSON file in the oclif data directory
 * (e.g. ~/Library/Application Support/@salesforce/b2c-cli/auth-session.json on macOS).
 *
 * Initialize via initializeStatefulStore(dataDir) from BaseCommand.init() so the
 * session file is co-located with other CLI data. Falls back to an OS-appropriate
 * default path when used standalone (outside a CLI command).
 *
 * The stateful auth workflow (b2c auth client / b2c auth login / b2c auth logout)
 * is compatible with sfcc-ci command patterns. Session data is stored internally
 * in the CLI data directory, not in the sfcc-ci config store.
 *
 * @module auth/stateful-store
 */
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {homedir, platform} from 'node:os';
import {decodeJWT} from './oauth.js';
import {getLogger} from '../logging/logger.js';

const STATEFUL_AUTH_SESSION_STORE = 'auth-session.json';

/** Default buffer (seconds) before token exp to consider it expired */
const EXPIRY_BUFFER_SEC = 60;

let storePath: string | null = null;

/**
 * Computes the oclif-compatible data directory for @salesforce/b2c-cli.
 * Used as a fallback when initializeStatefulStore() has not been called.
 */
function getDefaultDataDir(): string {
  const home = homedir();
  const name = '@salesforce/b2c-cli';
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', name);
    case 'win32':
      return join(process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local'), name);
    default:
      return join(process.env.XDG_DATA_HOME ?? join(home, '.local', 'share'), name);
  }
}

function getSessionFilePath(): string {
  return join(storePath ?? getDefaultDataDir(), STATEFUL_AUTH_SESSION_STORE);
}

/**
 * Initialize the stateful store with the oclif data directory.
 * Call this from BaseCommand.init() with this.config.dataDir so the session
 * file is stored alongside other CLI data (e.g. ~/Library/Application Support/@salesforce/b2c-cli).
 */
export function initializeStatefulStore(dataDir: string): void {
  storePath = dataDir;
}

/**
 * Stored session persisted by stateful auth commands.
 */
export interface StatefulSession {
  clientId: string;
  accessToken: string;
  refreshToken?: string | null;
  /** Base64-encoded "clientId:clientSecret" for token renewal. */
  renewBase?: string | null;
  user?: string | null;
}

/**
 * Reads the current stateful session from the JSON file.
 * Returns null if no session file exists or the file is invalid.
 */
export function getStoredSession(): StatefulSession | null {
  const filePath = getSessionFilePath();
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<StatefulSession>;
    if (!data.clientId || !data.accessToken) {
      return null;
    }
    return {
      clientId: data.clientId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      renewBase: data.renewBase ?? null,
      user: data.user ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Writes a session to the JSON file, creating the directory if needed.
 */
export function setStoredSession(session: StatefulSession): void {
  const filePath = getSessionFilePath();
  const dir = join(filePath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true});
  }
  const data: StatefulSession = {
    clientId: session.clientId,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken ?? null,
    renewBase: session.renewBase ?? null,
    user: session.user ?? null,
  };
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Clears the stored session by removing the session file.
 */
export function clearStoredSession(): void {
  const filePath = getSessionFilePath();
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch {
      // ignore — file may have already been removed
    }
  }
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
      logger.debug('[StatefulAuth] Token missing or expired');
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
 * Resets the store path (for tests). After calling this, the next operation
 * will use the default data directory unless initializeStatefulStore() is called again.
 * @internal
 */
export function resetStatefulStoreForTesting(): void {
  storePath = null;
}
