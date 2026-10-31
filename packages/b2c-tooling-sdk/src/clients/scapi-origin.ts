/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Single source of the SCAPI origin for all SCAPI clients.
 *
 * Normally `https://{shortCode}.api.commercecloud.salesforce.com`. An internal
 * override (e.g. a local SCAPI worker at `https://localhost:25010`) replaces the
 * origin for every client; paths are unchanged.
 *
 * The override is resolved like other config (`--scapi-base-url` flag,
 * `SFCC_SCAPI_BASE_URL`, dw.json `scapi-base-url`) and applied process-wide by
 * the CLI, MCP server and VS Code extension after config resolution.
 *
 * @internal For local SCAPI development; not a supported public option.
 * @module clients/scapi-origin
 */

/** @internal */
export const SCAPI_BASE_URL_ENV_VAR = 'SFCC_SCAPI_BASE_URL';

let scapiBaseUrlOverride: string | undefined;

function normalizeBaseUrl(baseUrl: string | undefined): string | undefined {
  const trimmed = baseUrl?.trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Invalid SCAPI base URL "${baseUrl}": expected an http(s) origin such as https://localhost:25010`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Invalid SCAPI base URL "${baseUrl}": expected an http(s) origin such as https://localhost:25010`);
  }
  return trimmed;
}

/**
 * Sets (or clears, with `undefined`) the SCAPI base-URL override.
 * @internal
 */
export function setScapiBaseUrl(baseUrl: string | undefined): void {
  scapiBaseUrlOverride = normalizeBaseUrl(baseUrl);
}

/**
 * Returns the active SCAPI base-URL override, falling back to `SFCC_SCAPI_BASE_URL`.
 * @internal
 */
export function getScapiBaseUrl(): string | undefined {
  return scapiBaseUrlOverride ?? normalizeBaseUrl(process.env[SCAPI_BASE_URL_ENV_VAR]);
}

/**
 * Returns the SCAPI origin (no trailing slash) for a short code.
 * @internal
 */
export function getScapiOrigin(shortCode: string | undefined): string {
  return getScapiBaseUrl() ?? `https://${shortCode}.api.commercecloud.salesforce.com`;
}
