/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Canonical types and backend interface for site read operations.
 *
 * The OCAPI Data API (`/sites`) and the SCAPI Sites API (`site/sites/v1`)
 * both expose site listing and per-site detail (including the cartridge
 * path). We expose a single canonical shape here so command code is agnostic
 * to which backend serves the request.
 *
 * The SCAPI Sites API is read-only; cartridge-path **writes** have no SCAPI
 * equivalent and remain OCAPI / site-archive-import only (see
 * {@link module:operations/sites/cartridges}).
 *
 * @module operations/sites/sites-types
 */
import type {BackendBase} from '../../clients/scapi-backend-utils.js';

/**
 * Canonical site. CamelCase fields match SCAPI; the OCAPI backend maps from
 * snake_case. `displayName` is the default-locale display name (both APIs
 * return a locale map; we surface the default for table output and keep the
 * full object on `_raw`).
 */
export interface SiteInfo {
  id: string;
  displayName?: string;
  storefrontStatus?: string;
  cartridges?: string;
  /** Original backend response, for advanced consumers. */
  _raw?: unknown;
}

/** Options for listing sites. */
export interface ListSitesOptions {
  /** Max sites to return (SCAPI `limit`; OCAPI `count`). */
  count?: number;
  /** Offset (SCAPI `offset`; OCAPI `start`). */
  start?: number;
}

/**
 * Backend contract for site read operations.
 *
 * Only reads are modeled — the SCAPI Sites API has no write surface, and
 * cartridge-path mutation is handled separately by the OCAPI/import path.
 */
export interface SitesBackend extends BackendBase {
  listSites(options?: ListSitesOptions): Promise<SiteInfo[]>;
  getSite(siteId: string): Promise<SiteInfo>;
}
