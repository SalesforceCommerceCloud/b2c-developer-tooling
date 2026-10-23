/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Hostname from what a user pastes as their server: a bare hostname, or any
 * URL on the instance such as a Business Manager link. Undefined when the
 * input isn't a hostname.
 */
export function parseServerHostname(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.host.toLowerCase();
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/.test(host) ? host : undefined;
  } catch {
    return undefined;
  }
}

/** Default config name for a server: its first DNS label (e.g. `my-sandbox` for `my-sandbox.example.com`). */
export function instanceNameForHostname(hostname: string): string {
  const label = hostname.split('.')[0]?.replace(/[^A-Za-z0-9_-]/g, '');
  return label || 'dev';
}
