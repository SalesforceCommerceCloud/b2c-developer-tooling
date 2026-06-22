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
    const {count, start} = options;
    const {data, error, response} = await this.instance.ocapi.GET('/sites', {
      params: {query: {start, count, select: '(**)'}},
    });
    if (error || !data) {
      throwOcapiError(error, response, 'Failed to list sites', SCAPI_SITES_READ_AND_RW_SCOPES);
    }
    return ((data as OcapiSites).data ?? []).map(mapOcapiSite);
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
