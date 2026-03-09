/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * PKCE (Proof Key for Code Exchange) helpers for SLAS authentication.
 *
 * @module slas/pkce
 */
import {randomBytes, createHash} from 'node:crypto';

/**
 * Encodes a buffer as a base64url string (RFC 7636).
 */
function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

/**
 * Generates a cryptographically random PKCE code verifier.
 *
 * @returns A 128-character base64url-encoded random string
 */
export function generateCodeVerifier(): string {
  return base64url(randomBytes(96));
}

/**
 * Generates a PKCE code challenge from a code verifier using S256.
 *
 * @param verifier - The code verifier to hash
 * @returns The base64url-encoded SHA-256 hash of the verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return base64url(createHash('sha256').update(verifier).digest());
}
