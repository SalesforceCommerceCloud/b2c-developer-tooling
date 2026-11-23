/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Names that hold secrets. Matches the end of the name, so `apiKeyPreference` doesn't match. */
export const SECRET_NAME =
  /(password|passwd|passphrase|secret|apikey|api_key|accesstoken|access_token|authtoken|auth_token|privatekey|private_key)$/i;

/** Values that are clearly not secrets: placeholders, dotted IDs (preference or resource keys), form field names. */
const NOT_A_SECRET =
  /^(\*+|x+|\.+|<[^>]*>|\$\{[^}]*\}|\{\{[^}]*\}\}|changeme|change_me|password|secret|todo|tbd|none|null|undefined|your[-_ ].*|[A-Za-z_][\w-]*(\.[A-Za-z_][\w-]*)+|dwfrm_\w+)$/i;

/** Whether a literal value looks like a real credential rather than a placeholder or an identifier. */
export function looksLikeSecret(value: string): boolean {
  const v = value.trim();
  if (v.length < 8 || /\s/.test(v) || NOT_A_SECRET.test(v)) return false;
  // Require some entropy: a digit or symbol, or a long value.
  return /[\d+/=_\-!@#$%^&*]/.test(v) || v.length >= 16;
}
