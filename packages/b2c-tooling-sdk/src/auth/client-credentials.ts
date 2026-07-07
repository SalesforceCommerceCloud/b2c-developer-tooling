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
 * Form-url-encode a single value using the `application/x-www-form-urlencoded`
 * escaping rules that RFC 6749 Appendix B references -- the W3C HTML form rules
 * (UTF-8 first), NOT RFC 3986 percent-encoding. `URLSearchParams` implements
 * exactly these rules.
 *
 * The two encodings differ only for a space (form rules -> `+`, RFC 3986 ->
 * `%20`) and a few punctuation chars (`!`, `~`, `(`, `)`). They agree on every
 * other byte, INCLUDING `+` and `%` -- the characters that actually trigger the
 * auth failure this module fixes -- so the encoder choice does not affect that
 * bug. We use the form rules (`URLSearchParams`) regardless because:
 *   1. they are precisely the Appendix B algorithm -- its worked example encodes
 *      U+0020 (space) as `+`, which `URLSearchParams` reproduces; and
 *   2. they are the same rules the token-request body uses, so a credential is
 *      byte-identical whether sent in the Basic header or in the body.
 * The two are only interchangeable against a server that form-url-decodes (as
 * Account Manager does); a strict RFC 3986 decoder would read a form-encoded
 * space (`+`) as a literal `+`, so matching the algorithm the RFC names is the
 * safe choice rather than a coincidence that happens to work.
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
 * credential containing characters the server form-url-decodes: a raw `+` is
 * read as a space and a valid `%xx` escape is decoded to another byte (both
 * yield `invalid_client` -- a wrong-but-valid secret), while an invalid escape
 * such as `%zz` makes a strict decoder error out (`unauthorized_client` /
 * "Unexpected error when authenticating client"). The same credential succeeds
 * when sent in the request body, which is form-url-encoded by construction --
 * the "body works, Basic fails" symptom.
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
