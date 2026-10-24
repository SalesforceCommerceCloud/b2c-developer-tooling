/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Which credentials and stored sessions an instance configuration can use,
 * for display in `setup inspect`, `auth status`, and MCP tool results.
 *
 * Mirrors the resolution order of {@link B2CInstance}: WebDAV prefers Basic
 * auth, then the API client, then (where the caller allows it) a browser
 * login with the built-in public client. OCAPI uses the API client; SCAPI
 * Admin APIs additionally need a stateless flow (client credentials or JWT)
 * until they accept browser logins.
 *
 * Stored sessions are keyed by Account Manager client ID, not by instance, so
 * a session listed here may also serve other instances. Session matching is
 * internal to this module so that it can account for tenant-scoped tokens
 * later without changing the output.
 *
 * @module auth/instance-auth
 */
import type {AuthMethod} from './types.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST, getDefaultPublicClientId} from '../defaults.js';
import {decodeJwtTokenInfo} from './jwt-utils.js';
import {listAuthSessions, type AuthSession, type AuthSessionFlow} from './session-store.js';

/** How a request is authenticated. `user` is an Account Manager browser login. */
export type InstanceAuthMethod = 'basic' | 'client-credentials' | 'jwt' | 'none' | 'user';

/** A stored session that the instance configuration can use. */
export interface InstanceAuthSession {
  clientId: string;
  /** Whether this is the toolkit's built-in public client. */
  builtInClient: boolean;
  flow: AuthSessionFlow;
  /** Account Manager user (JWT `sub`), when recorded. */
  user?: string;
  /** Access-token expiry (ISO timestamp), when it can be read. */
  accessTokenExpiresAt?: string;
  /** Whether the access token is still valid. */
  accessTokenValid: boolean;
  /** Whether an expired access token is renewed silently (PKCE refresh token). */
  canRefresh: boolean;
  lastUsedAt?: string;
  /** Scopes recorded with the access token. */
  scopes?: string[];
  /** Request types the session serves with this configuration. */
  usedFor: InstanceAuthTarget[];
}

/** Request types that authenticate separately. */
export type InstanceAuthTarget = 'ocapi' | 'scapi' | 'webdav';

/** How one kind of request authenticates. */
export interface InstanceAuthPath {
  method: InstanceAuthMethod;
  /** Client ID for OAuth methods. */
  clientId?: string;
  /** Whether `clientId` is the toolkit's built-in public client. */
  builtInClient?: boolean;
}

/** Which credentials and sessions an instance configuration can use. */
export interface InstanceAuthSummary {
  /** OCAPI Data API requests. */
  ocapi: InstanceAuthPath;
  /** SCAPI Admin API requests. */
  scapi: InstanceAuthPath;
  /** WebDAV requests (code upload, logs, files). */
  webdav: InstanceAuthPath;
  /** Stored sessions the paths above can use. */
  sessions: InstanceAuthSession[];
}

/** Configuration fields that decide authentication. */
export interface InstanceAuthConfig {
  accountManagerHost?: string;
  authMethods?: AuthMethod[];
  clientId?: string;
  clientSecret?: string;
  jwtCertPath?: string;
  jwtKeyPath?: string;
  password?: string;
  shortCode?: string;
  tenantId?: string;
  username?: string;
}

export interface DescribeInstanceAuthOptions {
  /**
   * Whether WebDAV may fall back to a browser login with the built-in public
   * client (CLI WebDAV and code commands, the MCP server, VS Code code sync).
   */
  defaultWebDavClient?: boolean;
  /** Stored sessions to consider; defaults to the active session store. */
  sessions?: AuthSession[];
  /**
   * Whether API requests without a configured client ID reuse the only stored
   * session (the CLI does; the MCP server and VS Code don't).
   */
  reuseUnconfiguredSession?: boolean;
}

function allows(methods: AuthMethod[] | undefined, method: AuthMethod): boolean {
  return !methods || methods.includes(method);
}

function summarizeSession(session: AuthSession, builtInClientId: string): Omit<InstanceAuthSession, 'usedFor'> {
  let accessTokenExpiresAt = session.expiresAt ?? undefined;
  let accessTokenValid = false;
  try {
    const {expires} = decodeJwtTokenInfo(session.accessToken);
    if (expires.getTime() > 0) {
      accessTokenExpiresAt = expires.toISOString();
      accessTokenValid = expires.getTime() > Date.now();
    }
  } catch {
    // Not a JWT; fall back to the recorded expiry.
    if (accessTokenExpiresAt) accessTokenValid = Date.parse(accessTokenExpiresAt) > Date.now();
  }
  return {
    clientId: session.clientId,
    builtInClient: session.clientId === builtInClientId,
    flow: session.flow,
    user: session.sub ?? undefined,
    accessTokenExpiresAt,
    accessTokenValid,
    canRefresh: session.flow === 'pkce' && Boolean(session.refreshToken),
    lastUsedAt: session.lastUsedAt ?? undefined,
    scopes: session.scopes,
  };
}

/**
 * Describes how an instance configuration authenticates WebDAV and API
 * requests, and which stored sessions those can use.
 */
export function describeInstanceAuth(
  config: InstanceAuthConfig,
  options: DescribeInstanceAuthOptions = {},
): InstanceAuthSummary {
  const sessions = options.sessions ?? listAuthSessions();
  const builtInClientId = getDefaultPublicClientId(config.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST);
  const methods = config.authMethods;

  // API client: configured credentials, else (CLI) the only stored session that isn't the built-in client's.
  let api: InstanceAuthPath = {method: 'none'};
  if (config.clientId) {
    if (config.clientSecret && allows(methods, 'client-credentials')) {
      api = {method: 'client-credentials', clientId: config.clientId};
    } else if (config.jwtCertPath && config.jwtKeyPath && allows(methods, 'jwt')) {
      api = {method: 'jwt', clientId: config.clientId};
    } else if (allows(methods, 'user')) {
      api = {method: 'user', clientId: config.clientId};
    }
  } else if (options.reuseUnconfiguredSession && sessions.length === 1 && sessions[0].clientId !== builtInClientId) {
    const [only] = sessions;
    api = {method: only.flow === 'client-credentials' ? 'client-credentials' : 'user', clientId: only.clientId};
  }
  if (api.clientId) api.builtInClient = api.clientId === builtInClientId;

  // SCAPI Admin APIs don't accept browser-login tokens yet.
  const scapiReady =
    config.shortCode && config.tenantId && (api.method === 'client-credentials' || api.method === 'jwt');
  const scapi: InstanceAuthPath = scapiReady ? {...api} : {method: 'none'};

  let webdav: InstanceAuthPath = {method: 'none'};
  if (config.username && config.password && allows(methods, 'basic')) {
    webdav = {method: 'basic'};
  } else if (api.method !== 'none') {
    webdav = {...api};
  } else if (options.defaultWebDavClient && allows(methods, 'user')) {
    webdav = {method: 'user', clientId: builtInClientId, builtInClient: true};
  }

  const used: InstanceAuthSession[] = [];
  for (const [kind, path] of [
    ['ocapi', api],
    ['scapi', scapi],
    ['webdav', webdav],
  ] as const) {
    const session = path.clientId ? sessions.find((s) => s.clientId === path.clientId) : undefined;
    if (!session) continue;
    const existing = used.find((s) => s.clientId === session.clientId);
    if (existing) existing.usedFor.push(kind);
    else used.push({...summarizeSession(session, builtInClientId), usedFor: [kind]});
  }

  return {ocapi: api, scapi, webdav, sessions: used};
}

/** Summarizes a stored session for listings that aren't tied to an instance (`auth status`). */
export function describeAuthSession(
  session: AuthSession,
  accountManagerHost: string = DEFAULT_ACCOUNT_MANAGER_HOST,
): Omit<InstanceAuthSession, 'usedFor'> {
  return summarizeSession(session, getDefaultPublicClientId(accountManagerHost));
}
