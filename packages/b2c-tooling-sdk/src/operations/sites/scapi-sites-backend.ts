/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../../auth/types.js';
import type {SitesBackend, SiteInfo, ListSitesOptions} from './sites-types.js';
import {
  createScapiSitesClient,
  toOrganizationId,
  type ScapiSitesClient,
  type ScapiSitesClientConfig,
  type Site as ScapiSite,
} from '../../clients/scapi-sites.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';

const READ_HEADERS = {[SCOPE_MODE_HEADER]: 'read'};

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
 * SCAPI Sites backend. Reads sites and per-site detail via the
 * `site/sites/v1` Admin API. Read-only — cartridge-path writes have no SCAPI
 * equivalent and are not part of this backend.
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
    // `getSites` and `site-search` return only site IDs — display name,
    // storefront status, and cartridges live on the per-site detail endpoint.
    // Fetch IDs first, then enrich each concurrently via `getSite` so the
    // list matches the rich shape the OCAPI `/sites?select=(**)` path returned.
    const {count, start} = options;
    const {data, error} = await this.client.GET('/organizations/{organizationId}/sites', {
      params: {path: {organizationId: this.organizationId}},
      headers: READ_HEADERS,
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, 'Failed to list sites'));
    }
    let ids = ((data as unknown as {data?: ScapiSite[]}).data ?? [])
      .map((s) => s.id)
      .filter((id): id is string => !!id);
    if (start !== undefined) ids = ids.slice(start);
    if (count !== undefined) ids = ids.slice(0, count);
    return Promise.all(ids.map((id) => this.getSite(id)));
  }

  async getSite(siteId: string): Promise<SiteInfo> {
    const {data, error} = await this.client.GET('/organizations/{organizationId}/sites/{siteId}', {
      params: {path: {organizationId: this.organizationId, siteId}},
      headers: READ_HEADERS,
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, `Failed to get site ${siteId}`));
    }
    return mapScapiSite(data as ScapiSite);
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  const e = error as {detail?: string; title?: string} | undefined;
  return e?.detail ?? e?.title ?? fallback;
}
