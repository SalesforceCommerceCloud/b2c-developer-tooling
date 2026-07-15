/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createSitesBackend} from '../../../src/operations/sites/sites-backend.js';
import {OcapiSitesBackend} from '../../../src/operations/sites/ocapi-sites-backend.js';
import {ScapiSitesBackend} from '../../../src/operations/sites/scapi-sites-backend.js';
import {SCAPI_SITES_READ_AND_RW_SCOPES} from '../../../src/operations/sites/sites-scopes.js';
import {OcapiDeprecatedError} from '../../../src/clients/error-utils.js';
import type {B2CInstance, ScapiClientConfig} from '../../../src/instance/index.js';
import type {AuthStrategy} from '../../../src/auth/types.js';

const fakeAuth = {} as AuthStrategy;

/**
 * Builds a fake {@link B2CInstance}. SCAPI resolution now flows from the
 * instance: `apiBackend` is the preference and `scapiClientConfig` carries the
 * shortCode/tenantId/auth (undefined → SCAPI not available).
 */
function fakeInstance(
  getImpl: (path: string, init: unknown) => unknown,
  opts: {apiBackend?: 'ocapi' | 'scapi' | 'auto'; scapiClientConfig?: ScapiClientConfig} = {},
): B2CInstance {
  return {
    ocapi: {GET: async (path: string, init: unknown) => getImpl(path, init)},
    apiBackend: opts.apiBackend ?? 'auto',
    scapiClientConfig: opts.scapiClientConfig,
  } as unknown as B2CInstance;
}

const fakeScapiConfig: ScapiClientConfig = {shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth};

describe('operations/sites backend', () => {
  describe('createSitesBackend resolution', () => {
    it('resolves to OCAPI when no SCAPI config is present', () => {
      const backend = createSitesBackend({
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}})),
      });
      expect(backend.name).to.equal('ocapi');
    });

    it('resolves to SCAPI (with OCAPI fallback wrapper) when SCAPI config is present', () => {
      const backend = createSitesBackend({
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}}), {
          scapiClientConfig: fakeScapiConfig,
        }),
      });
      // Before any call resolves, the fallback wrapper reports the SCAPI name.
      expect(backend.name).to.equal('scapi');
    });

    it('honors explicit ocapi preference even with SCAPI config', () => {
      const backend = createSitesBackend({
        preference: 'ocapi',
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}}), {
          scapiClientConfig: fakeScapiConfig,
        }),
      });
      expect(backend.name).to.equal('ocapi');
    });

    it("defaults the preference to the instance's apiBackend when omitted", () => {
      const backend = createSitesBackend({
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}}), {
          apiBackend: 'ocapi',
          scapiClientConfig: fakeScapiConfig,
        }),
      });
      // Instance prefers OCAPI, and no explicit preference overrides it.
      expect(backend.name).to.equal('ocapi');
    });
  });

  describe('OcapiSitesBackend', () => {
    it('maps OCAPI snake_case site fields to the canonical shape', async () => {
      const backend = new OcapiSitesBackend(
        fakeInstance((path) => {
          expect(path).to.equal('/sites');
          return {
            data: {data: [{id: 'RefArch', display_name: {default: 'Ref Arch'}, storefront_status: 'online'}]},
            error: undefined,
            response: {status: 200},
          };
        }),
      );
      const sites = await backend.listSites();
      expect(sites).to.have.length(1);
      expect(sites[0]).to.include({id: 'RefArch', displayName: 'Ref Arch', storefrontStatus: 'online'});
    });

    it('reads the cartridge path from getSite', async () => {
      const backend = new OcapiSitesBackend(
        fakeInstance((path) => {
          expect(path).to.equal('/sites/{site_id}');
          return {data: {id: 'RefArch', cartridges: 'app_a:app_b'}, error: undefined, response: {status: 200}};
        }),
      );
      const site = await backend.getSite('RefArch');
      expect(site.cartridges).to.equal('app_a:app_b');
    });

    it('throws an OcapiDeprecatedError naming the sites scope on a deprecated instance', async () => {
      const backend = new OcapiSitesBackend(
        fakeInstance(() => ({
          data: undefined,
          error: {fault: {type: 'OcapiDeprecatedException', message: 'deprecated'}},
          response: {status: 403},
        })),
      );
      try {
        await backend.listSites();
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(OcapiDeprecatedError);
        expect((e as Error).message).to.include('"sfcc.sites.rw"');
        expect((e as Error).message).to.include('"sfcc.sites"');
      }
    });
  });

  describe('sites scopes', () => {
    it('derives read+rw scopes from the cascade', () => {
      expect(SCAPI_SITES_READ_AND_RW_SCOPES).to.have.members(['sfcc.sites.rw', 'sfcc.sites']);
    });
  });

  describe('ScapiSitesBackend mapping', () => {
    it('maps SCAPI camelCase site fields (display name uses default locale)', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      // Replace the internal client with a stub.
      (backend as unknown as {client: unknown}).client = {
        async GET(path: string) {
          if (path.endsWith('/sites')) {
            return {data: {data: [{id: 'RefArch'}]}, error: undefined, response: {status: 200}};
          }
          return {
            data: {
              id: 'RefArch',
              displayName: {default: 'Ref Arch', fr: 'Réf'},
              storefrontStatus: 'online',
              cartridges: 'a:b',
            },
            error: undefined,
            response: {status: 200},
          };
        },
      };
      const sites = await backend.listSites();
      expect(sites).to.have.length(1);
      expect(sites[0]).to.include({
        id: 'RefArch',
        displayName: 'Ref Arch',
        storefrontStatus: 'online',
        cartridges: 'a:b',
      });
    });
  });

  describe('ScapiSitesBackend pagination + enrichment', () => {
    /**
     * Stubs the SCAPI client with an in-memory paginated `getSites` over
     * `total` id-only sites (`site-0`..), plus a per-site detail endpoint.
     * Tracks the (limit, offset) of each list page and every detail id fetched.
     */
    function stubPaginatedClient(backend: ScapiSitesBackend, total: number) {
      const listPages: Array<{limit?: number; offset?: number}> = [];
      const detailFetches: string[] = [];
      (backend as unknown as {client: unknown}).client = {
        async GET(path: string, opts: {params?: {path?: Record<string, string>; query?: Record<string, number>}}) {
          if (path.endsWith('/sites/{siteId}')) {
            const id = opts.params!.path!.siteId;
            detailFetches.push(id);
            return {
              data: {id, displayName: {default: `Name ${id}`}, storefrontStatus: 'online', cartridges: 'a:b'},
              error: undefined,
              response: {status: 200},
            };
          }
          // list page
          const {limit = 50, offset = 0} = opts.params?.query ?? {};
          listPages.push({limit, offset});
          const slice = Array.from({length: Math.max(0, Math.min(limit, total - offset))}, (_, i) => ({
            id: `site-${offset + i}`,
          }));
          return {data: {data: slice, limit, offset, total}, error: undefined, response: {status: 200}};
        },
      };
      return {listPages, detailFetches};
    }

    it('pages through all sites when total exceeds the 50-item page cap', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      const {listPages} = stubPaginatedClient(backend, 75);

      const sites = await backend.listSites();

      expect(sites).to.have.length(75);
      expect(sites[0].id).to.equal('site-0');
      expect(sites[74].id).to.equal('site-74');
      // Two list pages: offset 0 (limit 50) then offset 50 (limit 50).
      expect(listPages).to.deep.equal([
        {limit: 50, offset: 0},
        {limit: 50, offset: 50},
      ]);
    });

    it('honors start/count as SCAPI offset/limit', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      const {listPages} = stubPaginatedClient(backend, 100);

      const sites = await backend.listSites({start: 30, count: 10});

      expect(sites).to.have.length(10);
      expect(sites[0].id).to.equal('site-30');
      expect(sites[9].id).to.equal('site-39');
      expect(listPages).to.deep.equal([{limit: 10, offset: 30}]);
    });

    it('fetches multiple pages when count exceeds the page cap', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      const {listPages} = stubPaginatedClient(backend, 200);

      const sites = await backend.listSites({count: 75});

      expect(sites).to.have.length(75);
      expect(listPages).to.deep.equal([
        {limit: 50, offset: 0},
        {limit: 25, offset: 50},
      ]);
    });

    it('enriches each id-only site via a per-site detail call', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      const {detailFetches} = stubPaginatedClient(backend, 3);

      const sites = await backend.listSites();

      expect(detailFetches).to.deep.equal(['site-0', 'site-1', 'site-2']);
      expect(sites[0]).to.include({id: 'site-0', displayName: 'Name site-0', storefrontStatus: 'online'});
    });

    it('returns an empty list for an empty instance without a detail call', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      const {detailFetches, listPages} = stubPaginatedClient(backend, 0);

      const sites = await backend.listSites();

      expect(sites).to.have.length(0);
      expect(detailFetches).to.have.length(0);
      expect(listPages).to.deep.equal([{limit: 50, offset: 0}]);
    });

    it('does not fetch per-site detail when the list item is already rich', async () => {
      const backend = new ScapiSitesBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: fakeAuth});
      const detailFetches: string[] = [];
      (backend as unknown as {client: unknown}).client = {
        async GET(path: string, opts: {params?: {path?: Record<string, string>}}) {
          if (path.endsWith('/sites/{siteId}')) {
            detailFetches.push(opts.params!.path!.siteId);
            return {data: {id: 'x'}, error: undefined, response: {status: 200}};
          }
          return {
            data: {
              data: [{id: 'RefArch', displayName: {default: 'Ref Arch'}, storefrontStatus: 'online', cartridges: 'a'}],
              limit: 50,
              offset: 0,
              total: 1,
            },
            error: undefined,
            response: {status: 200},
          };
        },
      };

      const sites = await backend.listSites();

      expect(detailFetches).to.have.length(0);
      expect(sites[0]).to.include({id: 'RefArch', displayName: 'Ref Arch', storefrontStatus: 'online'});
    });
  });
});
