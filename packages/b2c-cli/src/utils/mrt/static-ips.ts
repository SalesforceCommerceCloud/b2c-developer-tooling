/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type cliui from 'cliui';

/**
 * Static IP fields of an MRT environment.
 */
export interface EnvStaticIps {
  ssr_static_ips?: boolean | null;
  ssr_static_outbound_ips?: unknown;
}

function stringify(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Turns the (loosely typed) `ssr_static_outbound_ips` value into display lines.
 *
 * The API types this field as a free-form JSON value, so an array of IPs is rendered one per line
 * an object as `key: value` lines, and any other non-empty value as-is. Empty or missing values yield no lines.
 */
export function formatOutboundIps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((ip) => stringify(ip));
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).map(([key, ip]) => `${key}: ${stringify(ip)}`);
  }

  if (value !== null && value !== undefined && value !== '') {
    return [stringify(value)];
  }

  return [];
}

/**
 * Adds the "Static IPs" and "Outbound IPs" rows of an environment to a cliui layout.
 *
 * "Static IPs" is shown whenever the API reports a value (Enabled or Disabled); "Outbound IPs" only
 * when there are addresses to list.
 */
export function addStaticIpRows(ui: ReturnType<typeof cliui>, env: EnvStaticIps, labelWidth: number): void {
  if (env.ssr_static_ips !== undefined && env.ssr_static_ips !== null) {
    ui.div({text: 'Static IPs:', width: labelWidth}, {text: env.ssr_static_ips ? 'Enabled' : 'Disabled'});
  }

  const outboundIps = formatOutboundIps(env.ssr_static_outbound_ips);
  for (const [index, line] of outboundIps.entries()) {
    ui.div({text: index === 0 ? 'Outbound IPs:' : '', width: labelWidth}, {text: line});
  }
}
