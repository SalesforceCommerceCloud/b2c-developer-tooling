/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Encoding of OAuth client credentials for the HTTP Basic `Authorization` header.
 *
 * @module auth/client-credentials
 */

/**
 * Form-url-encode a single value per the `application/x-www-form-urlencoded`
 * escaping rules that RFC 6749 Appendix B references (W3C HTML 4.01, UTF-8
 * first). `URLSearchParams` implements exactly these rules -- notably a space
 * becomes `+` (not `%20`), matching Appendix B's own worked example. This is
 * intentionally the same encoder the token-request body uses, so a credential
 * is encoded identically whether it is sent in the Basic header or the body.
 */
function formUrlEncodeComponent(value: string): string {
  // The name is empty, so the serialized "=value" is sliced to just the value.
  return new URLSearchParams([['', value]]).toString().slice(1);
}

/**
 * Builds the base64 payload for an `Authorization: Basic` header carrying OAuth
 * client credentials, per RFC 6749 §2.3.1.
 *
 * The client identifier and client password are each form-url-encoded (RFC 6749
 * Appendix B) *before* being joined with a colon and Base64-encoded (RFC 7617
 * §2, the HTTP Basic scheme). Skipping the per-component encoding corrupts any
 * credential containing characters the server form-url-decodes -- most commonly
 * `+` (which a compliant server reads as a space) or a `%xx` sequence -- causing
 * `invalid_client` even though the same credential succeeds when sent in the
 * request body (which is form-url-encoded by construction).
 *
 * @param clientId - The OAuth client identifier
 * @param clientSecret - The OAuth client password/secret
 * @returns The Base64 string to place after `Basic ` in the `Authorization` header
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
 * @see https://datatracker.ietf.org/doc/html/rfc6749#appendix-B
 */
export function encodeBasicClientCredentials(clientId: string, clientSecret: string): string {
  const userPass = `${formUrlEncodeComponent(clientId)}:${formUrlEncodeComponent(clientSecret)}`;
  return Buffer.from(userPass).toString('base64');
}
