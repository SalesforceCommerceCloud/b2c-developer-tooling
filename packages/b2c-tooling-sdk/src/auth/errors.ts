/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Typed authentication errors.
 *
 * @module auth/errors
 */

/**
 * Thrown by a non-interactive user-auth strategy when it has no usable access
 * token and cannot renew one silently (no stored session, or the refresh token
 * expired or was revoked). The host decides when to ask the user to sign in
 * again; the strategy never opens a browser on its own.
 */
export class AuthRequiredError extends Error {
  /** Client the sign-in is for. */
  readonly clientId: string;
  /** Account Manager host the sign-in is for. */
  readonly accountManagerHost: string;
  /** Why sign-in is needed: there was no session, or the refresh token could not be used. */
  readonly reason: 'no-session' | 'refresh-failed';

  constructor(options: {clientId: string; accountManagerHost: string; reason: 'no-session' | 'refresh-failed'}) {
    super(
      options.reason === 'no-session'
        ? `Sign-in required: no Account Manager session for client ${options.clientId}.`
        : `Sign-in required: the Account Manager session for client ${options.clientId} could not be renewed.`,
    );
    this.name = 'AuthRequiredError';
    this.clientId = options.clientId;
    this.accountManagerHost = options.accountManagerHost;
    this.reason = options.reason;
  }
}

/** Whether `error` is an {@link AuthRequiredError} (also across duplicate SDK copies). */
export function isAuthRequiredError(error: unknown): error is AuthRequiredError {
  return error instanceof AuthRequiredError || (error instanceof Error && error.name === 'AuthRequiredError');
}
