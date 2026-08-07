/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared redaction utilities for resolved configuration.
 *
 * Used by any surface that displays resolved config to a user or agent — the
 * CLI `setup inspect` command and the MCP `config_inspect` tool — so masking
 * behaviour stays consistent. Redaction is on by default; callers may opt into
 * unmasked output explicitly.
 *
 * @module config/redaction
 */
import type {NormalizedConfig} from './types.js';

/**
 * Config fields whose values are secrets and are masked by default.
 */
export const SENSITIVE_CONFIG_FIELDS: ReadonlySet<keyof NormalizedConfig> = new Set<keyof NormalizedConfig>([
  'certificatePassphrase',
  'clientSecret',
  'jwtPassphrase',
  'mrtApiKey',
  'password',
  'slasClientSecret',
]);

/**
 * Returns true when a field name holds a secret that should be masked.
 */
export function isSensitiveConfigField(field: string): boolean {
  return SENSITIVE_CONFIG_FIELDS.has(field as keyof NormalizedConfig);
}

/**
 * Mask a sensitive value, showing the first 4 characters when long enough to
 * aid identification without disclosing the secret. Matches the convention
 * used by the SDK logger (`<first4>...REDACTED`).
 *
 * @param value - The raw value to mask
 * @returns The masked representation
 */
export function maskConfigValue(value: string): string {
  if (value.length > 10) {
    return `${value.slice(0, 4)}...REDACTED`;
  }
  return 'REDACTED';
}

/**
 * Produce a shallow copy of resolved config values with sensitive fields
 * masked. Undefined values are omitted.
 *
 * @param values - Resolved configuration values
 * @param options - `unmask: true` disables masking (secrets shown verbatim)
 * @returns A new record safe to display, unless `unmask` was set
 */
export function redactConfigValues(
  values: NormalizedConfig,
  options: {unmask?: boolean} = {},
): Record<string, unknown> {
  const {unmask = false} = options;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }
    output[key] = !unmask && isSensitiveConfigField(key) ? maskConfigValue(String(value)) : value;
  }
  return output;
}
