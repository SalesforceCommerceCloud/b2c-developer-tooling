/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {OcapiComponents} from '../../clients/index.js';
import {throwOcapiError} from '../../clients/error-utils.js';
import {SCAPI_SITES_READ_AND_RW_SCOPES} from './sites-scopes.js';
import type {SitesBackend, SiteInfo, ListSitesOptions} from './sites-types.js';

type OcapiSite = OcapiComponents['schemas']['site'];
type OcapiSites = OcapiComponents['schemas']['sites'];

function mapOcapiSite(ocapi: OcapiSite): SiteInfo {
  return {
    id: ocapi.id ?? '',
    displayName: ocapi.display_name?.default ?? ocapi.id ?? '',
    storefrontStatus: ocapi.storefront_status,
    cartridges: ocapi.cartridges,
    _raw: ocapi,
  };
}

/**
 * OCAPI Sites backend (legacy/fallback). Reads sites and per-site detail via
 * the OCAPI Data API `/sites` resource.
 */
export class OcapiSitesBackend implements SitesBackend {
  readonly name = 'ocapi' as const;

  constructor(private instance: B2CInstance) {}

  async listSites(options: ListSitesOptions = {}): Promise<SiteInfo[]> {
    // When the caller bounds the result (start/count), honor it as a single
    // page. Otherwise page through the whole collection so callers that need
    // *all* sites (export-unit discovery, CAP feature listing) don't silently
    // truncate at the OCAPI default page size.
    if (options.start !== undefined || options.count !== undefined) {
      return this.fetchSitePage(options.start, options.count);
    }

    const all: SiteInfo[] = [];
    const pageSize = 200;
    let start = 0;
    for (;;) {
      const {sites, total} = await this.fetchSitePageWithTotal(start, pageSize);
      all.push(...sites);
      start += pageSize;
      if (sites.length === 0 || start >= total) break;
    }
    return all;
  }

  private async fetchSitePage(start?: number, count?: number): Promise<SiteInfo[]> {
    return (await this.fetchSitePageWithTotal(start, count)).sites;
  }

  private async fetchSitePageWithTotal(start?: number, count?: number): Promise<{sites: SiteInfo[]; total: number}> {
    const {data, error, response} = await this.instance.ocapi.GET('/sites', {
      params: {query: {start, count, select: '(**)'}},
    });
    if (error || !data) {
      throwOcapiError(error, response, 'Failed to list sites', SCAPI_SITES_READ_AND_RW_SCOPES);
    }
    const body = data as OcapiSites;
    const sites = (body.data ?? []).map(mapOcapiSite);
    return {sites, total: body.total ?? (start ?? 0) + sites.length};
  }

  async getSite(siteId: string): Promise<SiteInfo> {
    const {data, error, response} = await this.instance.ocapi.GET('/sites/{site_id}', {
      params: {path: {site_id: siteId}},
    });
    if (error || !data) {
      throwOcapiError(error, response, `Failed to get site ${siteId}`, SCAPI_SITES_READ_AND_RW_SCOPES);
    }
    return mapOcapiSite(data as OcapiSite);
  }
}
