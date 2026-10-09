/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../../auth/types.js';
import type {SitesBackend, SiteInfo, ListSitesOptions, CartridgePosition} from './sites-types.js';
import {
  createScapiSitesClient,
  toOrganizationId,
  type ScapiSitesClient,
  type ScapiSitesClientConfig,
  type Site as ScapiSite,
} from '../../clients/scapi-sites.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';

const READ_HEADERS = {[SCOPE_MODE_HEADER]: 'read'};
const WRITE_HEADERS = {[SCOPE_MODE_HEADER]: 'write'};

/** SCAPI `getSites` caps `limit` at 50 (spec `site-sites-v1.yaml`). */
const SCAPI_SITES_MAX_PAGE = 50;

/** Concurrency for per-site detail enrichment; bounds rate-limit pressure. */
const ENRICH_CONCURRENCY = 5;

function defaultLocaleValue(map?: {[key: string]: string}): string | undefined {
  if (!map) return undefined;
  return map.default ?? Object.values(map)[0];
}

function mapScapiSite(scapi: ScapiSite): SiteInfo {
  return {
    id: scapi.id,
    displayName: defaultLocaleValue(scapi.displayName) ?? scapi.id,
    storefrontStatus: scapi.storefrontStatus,
    cartridges: scapi.cartridges,
    _raw: scapi,
  };
}

export interface ScapiSitesBackendConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
  /** Unused by Sites; accepted for compatibility with the dual-backend factory. */
  instance?: unknown;
}

/**
 * SCAPI Sites backend. Reads sites and manages custom cartridge paths via the
 * `site/sites/v1` Admin API.
 */
export class ScapiSitesBackend implements SitesBackend {
  readonly name = 'scapi' as const;

  private organizationId: string;
  private client: ScapiSitesClient;

  constructor(config: ScapiSitesBackendConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    const clientConfig: ScapiSitesClientConfig = {shortCode: config.shortCode, tenantId: config.tenantId};
    this.client = createScapiSitesClient(clientConfig, config.auth);
  }

  async listSites(options: ListSitesOptions = {}): Promise<SiteInfo[]> {
    // Page through `getSites` on the server (limit capped at 50) rather than
    // relying on the default single 25-item page — otherwise instances with
    // more than 25 sites silently lose the rest. The caller's start/count map
    // to SCAPI offset/limit.
    const rawSites = await this.fetchSitePage(options);

    // `getSites` returns items that carry only the id (display name, storefront
    // status, and cartridges live on the per-site detail endpoint). Enrich any
    // sparse item via `getSite`, with bounded concurrency to limit rate-limit
    // pressure. Items that already arrive rich (future-proofing if the platform
    // starts populating list fields) are mapped directly with no extra call.
    return this.enrichSites(rawSites);
  }

  /**
   * Fetches the requested window of sites, paginating across 50-item SCAPI
   * pages. `start` is the offset into the full result set; `count` bounds how
   * many are returned (unbounded when omitted).
   */
  private async fetchSitePage(options: ListSitesOptions): Promise<ScapiSite[]> {
    const startOffset = options.start ?? 0;
    const target = options.count; // undefined → all remaining
    const collected: ScapiSite[] = [];
    let offset = startOffset;

    while (true) {
      const remaining = target === undefined ? SCAPI_SITES_MAX_PAGE : target - collected.length;
      if (remaining <= 0) break;
      const limit = Math.min(SCAPI_SITES_MAX_PAGE, remaining);

      const {data, error, response} = await this.client.GET('/organizations/{organizationId}/sites', {
        params: {path: {organizationId: this.organizationId}, query: {limit, offset}},
        headers: READ_HEADERS,
      });
      if (error || !data) {
        throw createScapiRequestError(error, response, 'Failed to list sites');
      }

      const page = data as unknown as {data?: ScapiSite[]; total?: number};
      const items = page.data ?? [];
      collected.push(...items);
      offset += items.length;

      // Stop when the server has no more items, or we've reached the reported
      // total, or the page came back short (defensive against a missing total).
      const total = page.total ?? startOffset + collected.length;
      if (items.length === 0 || offset >= total) break;
    }

    return collected;
  }

  /** Maps sites, fetching per-site detail (bounded concurrency) for sparse items. */
  private async enrichSites(sites: ScapiSite[]): Promise<SiteInfo[]> {
    const results: SiteInfo[] = [];
    for (let i = 0; i < sites.length; i += ENRICH_CONCURRENCY) {
      const batch = sites.slice(i, i + ENRICH_CONCURRENCY);
      const mapped = await Promise.all(
        batch.map((site) => {
          // If the list item is already rich, avoid the extra detail call.
          if (site.displayName !== undefined || site.storefrontStatus !== undefined) {
            return Promise.resolve(mapScapiSite(site));
          }
          return site.id ? this.getSite(site.id) : Promise.resolve(mapScapiSite(site));
        }),
      );
      results.push(...mapped);
    }
    return results;
  }

  async getSite(siteId: string): Promise<SiteInfo> {
    const {data, error, response} = await this.client.GET('/organizations/{organizationId}/sites/{siteId}', {
      params: {path: {organizationId: this.organizationId, siteId}},
      headers: READ_HEADERS,
    });
    if (error || !data) {
      throw createScapiRequestError(error, response, `Failed to get site ${siteId}`);
    }
    return mapScapiSite(data as ScapiSite);
  }

  async getCartridgePath(siteId: string): Promise<string> {
    const {data, error, response} = await this.client.GET(
      '/organizations/{organizationId}/sites/{siteId}/custom-cartridges',
      {
        params: {path: {organizationId: this.organizationId, siteId}},
        headers: READ_HEADERS,
      },
    );
    if (error || !data) {
      throw createScapiRequestError(error, response, `Failed to get cartridge path for site ${siteId}`);
    }
    return data.customCartridges;
  }

  async setCartridgePath(siteId: string, cartridges: string): Promise<string> {
    const {data, error, response} = await this.client.PUT(
      '/organizations/{organizationId}/sites/{siteId}/custom-cartridges',
      {
        params: {path: {organizationId: this.organizationId, siteId}},
        headers: WRITE_HEADERS,
        body: {customCartridges: cartridges},
      },
    );
    if (error || !data) {
      throw createScapiRequestError(error, response, `Failed to set cartridge path for site ${siteId}`);
    }
    return data.customCartridges;
  }

  async addCartridge(siteId: string, name: string, position: CartridgePosition, target?: string): Promise<string> {
    const current = await this.getCartridgePath(siteId);
    const cartridges = current ? current.split(':') : [];
    if (cartridges.includes(name)) {
      throw new Error(`Cartridge "${name}" already exists in the cartridge path for site "${siteId}"`);
    }
    insertCartridge(cartridges, name, position, target);
    return this.setCartridgePath(siteId, cartridges.join(':'));
  }

  async removeCartridge(siteId: string, name: string): Promise<string> {
    const current = await this.getCartridgePath(siteId);
    const cartridges = current ? current.split(':') : [];
    const index = cartridges.indexOf(name);
    if (index < 0) throw new Error(`Cartridge "${name}" not found in the cartridge path for site "${siteId}"`);
    cartridges.splice(index, 1);
    return this.setCartridgePath(siteId, cartridges.join(':'));
  }
}

function insertCartridge(cartridges: string[], name: string, position: CartridgePosition, target?: string): void {
  if (position === 'first') {
    cartridges.unshift(name);
    return;
  }
  if (position === 'last') {
    cartridges.push(name);
    return;
  }
  if (!target) throw new Error(`Target cartridge is required for position "${position}"`);
  const targetIndex = cartridges.indexOf(target);
  if (targetIndex < 0) throw new Error(`Target cartridge "${target}" not found in cartridge path`);
  cartridges.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, name);
}
