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
import type {B2CInstance} from '../../../src/instance/index.js';
import type {AuthStrategy} from '../../../src/auth/types.js';

function fakeInstance(getImpl: (path: string, init: unknown) => unknown): B2CInstance {
  return {ocapi: {GET: async (path: string, init: unknown) => getImpl(path, init)}} as unknown as B2CInstance;
}

const fakeAuth = {} as AuthStrategy;

describe('operations/sites backend', () => {
  describe('createSitesBackend resolution', () => {
    it('resolves to OCAPI when no SCAPI config is present', () => {
      const backend = createSitesBackend({
        preference: 'auto',
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}})),
      });
      expect(backend.name).to.equal('ocapi');
    });

    it('resolves to SCAPI (with OCAPI fallback wrapper) when SCAPI config is present', () => {
      const backend = createSitesBackend({
        preference: 'auto',
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}})),
        shortCode: 'abcd1234',
        tenantId: 'zzxy_dev',
        auth: fakeAuth,
      });
      // Before any call resolves, the fallback wrapper reports the SCAPI name.
      expect(backend.name).to.equal('scapi');
    });

    it('honors explicit ocapi preference even with SCAPI config', () => {
      const backend = createSitesBackend({
        preference: 'ocapi',
        instance: fakeInstance(() => ({data: {data: []}, error: undefined, response: {status: 200}})),
        shortCode: 'abcd1234',
        tenantId: 'zzxy_dev',
        auth: fakeAuth,
      });
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
});
