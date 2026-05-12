/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared helpers for working with decoded JWT access tokens. Centralizes the
 * `exp` / `scope` extraction patterns that previously lived in multiple auth
 * strategy files.
 *
 * @module auth/jwt-utils
 */
import {decodeJWT} from './oauth.js';

/** Default buffer (seconds) before token `exp` to consider the token expired. */
export const DEFAULT_EXPIRY_BUFFER_SEC = 60;

/**
 * Extract `scope` from a decoded JWT payload. Tolerates both the (legacy)
 * space-delimited string form and the array form.
 */
export function extractJwtScopes(payload: Record<string, unknown>): string[] {
  const scope = payload.scope as string | string[] | undefined;
  if (scope == null) return [];
  return Array.isArray(scope) ? scope : scope.split(' ');
}

/**
 * Decode a JWT and return its `expires` Date and `scopes` array. Errors from
 * `decodeJWT` propagate to the caller — callers that want a soft-fail should
 * wrap this in try/catch.
 */
export function decodeJwtTokenInfo(token: string): {expires: Date; scopes: string[]} {
  const decoded = decodeJWT(token);
  const exp = typeof decoded.payload.exp === 'number' ? decoded.payload.exp : 0;
  return {
    expires: new Date(exp * 1000),
    scopes: extractJwtScopes(decoded.payload as Record<string, unknown>),
  };
}

/**
 * Returns `true` if the token is non-empty, decodes successfully, has not
 * expired (with a small buffer), and includes all required scopes.
 *
 * @param token - The JWT access token
 * @param requiredScopes - Scopes that must all be present in the token (default: none)
 * @param expiryBufferSec - Treat token as expired this many seconds before its real `exp`
 */
export function isJwtTokenValid(
  token: string,
  requiredScopes: string[] = [],
  expiryBufferSec: number = DEFAULT_EXPIRY_BUFFER_SEC,
): boolean {
  if (!token) return false;
  let info: {expires: Date; scopes: string[]};
  try {
    info = decodeJwtTokenInfo(token);
  } catch {
    return false;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = Math.floor(info.expires.getTime() / 1000);
  if (expSec === 0 || nowSec >= expSec - expiryBufferSec) return false;
  if (requiredScopes.length > 0 && !requiredScopes.every((s) => info.scopes.includes(s))) {
    return false;
  }
  return true;
}
