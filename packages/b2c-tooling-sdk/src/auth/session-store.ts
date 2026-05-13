/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Persistent auth-session store, shared by every flow that wants to remember
 * a token across CLI invocations:
 *
 * - `auth login` / PKCE — stores access + refresh tokens; refresh runs silently.
 * - Implicit (legacy `--auth-methods implicit`) — stores access token only.
 * - `auth client` — stores access token only. The client secret is NEVER
 *   persisted; client_credentials sessions do not auto-renew. When the
 *   stored access token expires, the user re-runs `b2c auth client <id> <secret>`.
 *
 * Sessions are keyed by `clientId`, one record per client. Backends are
 * pluggable via {@link AuthSessionBackend}: the CLI uses
 * {@link FileAuthSessionBackend}; the VS Code extension registers a
 * SecretStorage-backed backend. The interface is intentionally synchronous
 * because session lookups happen on the hot path of every authenticated
 * command. Backends with async-only native storage (VS Code SecretStorage,
 * OS keychain) maintain an in-memory snapshot and persist asynchronously.
 *
 * @module auth/session-store
 */
import {existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {homedir, platform} from 'node:os';
import {DEFAULT_EXPIRY_BUFFER_SEC, decodeJwtTokenInfo} from './jwt-utils.js';
import {getLogger} from '../logging/logger.js';

const SESSION_FILE = 'auth-sessions.json';

/**
 * The auth flow that produced a stored session.
 *
 * - `pkce`: Authorization Code + PKCE; has refresh tokens.
 * - `implicit`: legacy implicit grant; no refresh token.
 * - `client-credentials`: non-interactive `auth client`; no refresh, no
 *   stored secret. When the access token expires, the user re-runs
 *   `auth client <id> <secret>`.
 */
export type AuthSessionFlow = 'pkce' | 'implicit' | 'client-credentials';

export interface AuthSession {
  clientId: string;
  /** Which flow produced this session (informational; controls refresh policy). */
  flow: AuthSessionFlow;
  accessToken: string;
  /** Only set for PKCE. Implicit and client-credentials never have a refresh token. */
  refreshToken?: string | null;
  /** JWT `sub` claim, when available. Recorded for diagnostics. */
  sub?: string | null;
  /** ISO timestamp of access-token expiry (informational; JWT exp is authoritative). */
  expiresAt?: string | null;
  /** Scopes recorded with the access token. */
  scopes?: string[];
  /** Account Manager host the session was minted against. */
  accountManagerHost?: string | null;
  /** ISO timestamp of the most recent write. */
  lastUsedAt?: string | null;
}

/**
 * Pluggable backend for the unified auth-session store. Synchronous on the
 * read path so command initialization can decide auth flow without awaiting.
 * Backends with async-only native storage (VS Code SecretStorage, OS keychain)
 * maintain an in-memory snapshot hydrated at startup and persist writes
 * asynchronously via {@link write}; callers do not await write completion.
 */
export interface AuthSessionBackend {
  find(clientId: string): AuthSession | null;
  save(session: AuthSession): void;
  delete(clientId: string): void;
  list(): AuthSession[];
  clearAll(): void;
}

interface SessionFile {
  version: 1;
  sessions: AuthSession[];
}

/**
 * Default JSON-file-backed implementation. Path defaults to
 * `<oclif data dir>/auth-sessions.json`. Atomic writes via tmp + rename.
 */
export class FileAuthSessionBackend implements AuthSessionBackend {
  constructor(private dataDir: string) {}

  find(clientId: string): AuthSession | null {
    return this.read().sessions.find((s) => s.clientId === clientId) ?? null;
  }

  save(session: AuthSession): void {
    const store = this.read();
    const idx = store.sessions.findIndex((s) => s.clientId === session.clientId);
    const persisted: AuthSession = {...session, lastUsedAt: new Date().toISOString()};
    if (idx >= 0) {
      store.sessions[idx] = persisted;
    } else {
      store.sessions.push(persisted);
    }
    this.write(store);
  }

  delete(clientId: string): void {
    const store = this.read();
    const next = store.sessions.filter((s) => s.clientId !== clientId);
    if (next.length !== store.sessions.length) {
      this.write({version: 1, sessions: next});
    }
  }

  list(): AuthSession[] {
    return this.read().sessions;
  }

  clearAll(): void {
    const filePath = this.filePath();
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (error) {
        getLogger().debug({err: error, filePath}, '[AuthStore] Failed to remove session file');
      }
    }
  }

  private filePath(): string {
    return join(this.dataDir, SESSION_FILE);
  }

  private read(): SessionFile {
    const filePath = this.filePath();
    if (!existsSync(filePath)) return {version: 1, sessions: []};
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<SessionFile>;
      if (data && Array.isArray(data.sessions)) {
        return {version: 1, sessions: data.sessions as AuthSession[]};
      }
    } catch (error) {
      getLogger().debug({err: error, filePath}, '[AuthStore] Failed to read store');
    }
    return {version: 1, sessions: []};
  }

  private write(store: SessionFile): void {
    const filePath = this.filePath();
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, {recursive: true});
    }
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
    renameSync(tmpPath, filePath);
  }
}

/**
 * In-memory backend, useful for tests and for IDE adapters that hydrate from
 * async native storage at startup and write through asynchronously.
 */
export class InMemoryAuthSessionBackend implements AuthSessionBackend {
  protected sessions: Map<string, AuthSession> = new Map();

  find(clientId: string): AuthSession | null {
    return this.sessions.get(clientId) ?? null;
  }

  save(session: AuthSession): void {
    this.sessions.set(session.clientId, {...session, lastUsedAt: new Date().toISOString()});
  }

  delete(clientId: string): void {
    this.sessions.delete(clientId);
  }

  list(): AuthSession[] {
    return [...this.sessions.values()];
  }

  clearAll(): void {
    this.sessions.clear();
  }
}

let activeBackend: AuthSessionBackend | null = null;

/**
 * Computes the oclif-compatible data directory for @salesforce/b2c-cli.
 * Used as a fallback when no backend has been registered.
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

function getBackend(): AuthSessionBackend {
  if (!activeBackend) {
    activeBackend = new FileAuthSessionBackend(getDefaultDataDir());
  }
  return activeBackend;
}

/** Register an auth-session backend. Pass `null` to fall back to the default file backend. */
export function setAuthSessionBackend(backend: AuthSessionBackend | null): void {
  activeBackend = backend;
}

/** Returns the active backend (lazily creating a file-backed default if none has been set). */
export function getAuthSessionBackend(): AuthSessionBackend {
  return getBackend();
}

/** Convenience: install a {@link FileAuthSessionBackend} pointed at `dataDir`. */
export function initializeFileAuthSessionStore(dataDir: string): void {
  setAuthSessionBackend(new FileAuthSessionBackend(dataDir));
}

/** Read the session for a clientId. Returns null when none is stored. */
export function findAuthSession(clientId: string): AuthSession | null {
  return getBackend().find(clientId);
}

/** Write a session, replacing any prior record for the same clientId. */
export function saveAuthSession(session: AuthSession): void {
  getBackend().save(session);
}

/** Delete the session for a clientId. */
export function deleteAuthSession(clientId: string): void {
  getBackend().delete(clientId);
}

/** List all stored sessions (for diagnostics). */
export function listAuthSessions(): AuthSession[] {
  return getBackend().list();
}

/** Remove every stored session. Used by `auth logout`. */
export function clearAllAuthSessions(): void {
  getBackend().clearAll();
}

/**
 * Returns `true` if the session's access token is present, decodes as a JWT,
 * has not expired (with a small buffer), and (optionally) satisfies the given
 * scope and clientId requirements. No network calls.
 */
export function isAuthSessionTokenValid(
  session: AuthSession,
  requiredScopes: string[] = [],
  expiryBufferSec: number = DEFAULT_EXPIRY_BUFFER_SEC,
  requiredClientId?: string,
): boolean {
  const logger = getLogger();
  if (requiredClientId && session.clientId !== requiredClientId) {
    logger.debug({storedClientId: session.clientId, requiredClientId}, '[AuthStore] Token client ID mismatch');
    return false;
  }
  let info: {expires: Date; scopes: string[]};
  try {
    info = decodeJwtTokenInfo(session.accessToken);
  } catch (error) {
    logger.debug({err: error}, '[AuthStore] Token invalid (e.g. not a JWT)');
    return false;
  }
  if (info.expires.getTime() === 0) {
    logger.debug('[AuthStore] Token has no exp claim; treating as invalid');
    return false;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = Math.floor(info.expires.getTime() / 1000);
  if (nowSec >= expSec - expiryBufferSec) {
    logger.debug('[AuthStore] Token missing or expired');
    return false;
  }
  if (requiredScopes.length > 0 && !requiredScopes.every((s) => info.scopes.includes(s))) {
    logger.debug({requiredScopes, tokenScopes: info.scopes}, '[AuthStore] Token missing required scopes');
    return false;
  }
  return true;
}

/**
 * Reset the active backend (for tests). After calling this, the next operation
 * falls back to a file-backed default unless the test re-registers a backend.
 * @internal
 */
export function resetAuthSessionStoreForTesting(): void {
  activeBackend = null;
}
