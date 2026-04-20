/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import JSZip from 'jszip';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {
  getCartridgePath,
  addCartridge,
  removeCartridge,
  setCartridgePath,
} from '../../../src/operations/sites/cartridges.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/s/-/dw/data/v25_6`;
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;

/**
 * Creates MSW handlers for site archive import (upload zip + execute job + poll + cleanup).
 * The onImport callback receives the uploaded zip buffer so tests can inspect it.
 */
function createImportHandlers(onImport?: (buffer: Buffer) => void) {
  return [
    // WebDAV PUT - upload archive
    http.put(`${WEBDAV_BASE}/Impex/src/instance/:filename`, async ({request}) => {
      if (onImport) {
        const buffer = Buffer.from(await request.arrayBuffer());
        onImport(buffer);
      }
      return new HttpResponse(null, {status: 201});
    }),
    // Job execution - start import
    http.post(`${BASE_URL}/jobs/sfcc-site-archive-import/executions`, () => {
      return HttpResponse.json({id: 'exec-1', execution_status: 'running'});
    }),
    // Job polling - complete immediately
    http.get(`${BASE_URL}/jobs/sfcc-site-archive-import/executions/exec-1`, () => {
      return HttpResponse.json({
        id: 'exec-1',
        execution_status: 'finished',
        exit_status: {code: 'OK'},
      });
    }),
    // WebDAV DELETE - cleanup archive
    http.delete(`${WEBDAV_BASE}/Impex/src/instance/:filename`, () => {
      return new HttpResponse(null, {status: 204});
    }),
  ];
}

describe('operations/sites/cartridges', () => {
  const server = setupServer();
  let mockInstance: any;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    const auth = new MockAuthStrategy();
    const ocapi = createOcapiClient(TEST_HOST, auth);
    const webdav = new WebDavClient(TEST_HOST, auth);
    mockInstance = {ocapi, webdav};
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  describe('getCartridgePath', () => {
    it('should return cartridge path from site details', async () => {
      server.use(
        http.get(`${BASE_URL}/sites/RefArch`, () => {
          return HttpResponse.json({id: 'RefArch', cartridges: 'app_storefront_base:plugin_applepay'});
        }),
      );

      const result = await getCartridgePath(mockInstance, 'RefArch');

      expect(result.siteId).to.equal('RefArch');
      expect(result.cartridges).to.equal('app_storefront_base:plugin_applepay');
      expect(result.cartridgeList).to.deep.equal(['app_storefront_base', 'plugin_applepay']);
    });

    it('should handle empty cartridge path', async () => {
      server.use(
        http.get(`${BASE_URL}/sites/RefArch`, () => {
          return HttpResponse.json({id: 'RefArch'});
        }),
      );

      const result = await getCartridgePath(mockInstance, 'RefArch');

      expect(result.cartridges).to.equal('');
      expect(result.cartridgeList).to.deep.equal([]);
    });

    it('should work for Business Manager site', async () => {
      server.use(
        http.get(`${BASE_URL}/sites/Sites-Site`, () => {
          return HttpResponse.json({id: 'Sites-Site', cartridges: 'bm_app_storefront_base'});
        }),
      );

      const result = await getCartridgePath(mockInstance, 'Sites-Site');

      expect(result.siteId).to.equal('Sites-Site');
      expect(result.cartridgeList).to.deep.equal(['bm_app_storefront_base']);
    });

    it('should throw on error', async () => {
      server.use(
        http.get(`${BASE_URL}/sites/BadSite`, () => {
          return HttpResponse.json({fault: {message: 'Site not found'}}, {status: 404});
        }),
      );

      try {
        await getCartridgePath(mockInstance, 'BadSite');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Failed to get cartridge path');
        expect(error.message).to.include('BadSite');
      }
    });
  });

  describe('addCartridge', () => {
    it('should add cartridge via OCAPI for regular sites', async () => {
      server.use(
        http.post(`${BASE_URL}/sites/RefArch/cartridges`, async ({request}) => {
          const body = (await request.json()) as any;
          expect(body.name).to.equal('my_cartridge');
          expect(body.position).to.equal('last');
          return HttpResponse.json({cartridges: 'app_storefront_base:my_cartridge', site_id: 'RefArch'});
        }),
      );

      const result = await addCartridge(mockInstance, 'RefArch', {name: 'my_cartridge', position: 'last'});

      expect(result.cartridges).to.equal('app_storefront_base:my_cartridge');
      expect(result.cartridgeList).to.deep.equal(['app_storefront_base', 'my_cartridge']);
    });

    it('should use import/export for Business Manager', async () => {
      let importedBuffer: Buffer | undefined;

      server.use(
        // GET site to read current path
        http.get(`${BASE_URL}/sites/Sites-Site`, () => {
          return HttpResponse.json({id: 'Sites-Site', cartridges: 'existing_cart'});
        }),
        ...createImportHandlers((buf) => {
          importedBuffer = buf;
        }),
      );

      const result = await addCartridge(mockInstance, 'Sites-Site', {name: 'new_cart', position: 'first'});

      expect(result.cartridges).to.equal('new_cart:existing_cart');
      expect(importedBuffer).to.exist;

      // Verify the imported zip has BM preferences XML
      const zip = await JSZip.loadAsync(importedBuffer!);
      const files = Object.keys(zip.files);
      const prefsFile = files.find((f) => f.endsWith('preferences.xml'));
      expect(prefsFile).to.exist;
      const prefsXml = await zip.file(prefsFile!)!.async('text');
      expect(prefsXml).to.include('CustomCartridges');
      expect(prefsXml).to.include('new_cart:existing_cart');
    });

    it('should fall back to import/export when OCAPI fails', async () => {
      server.use(
        // OCAPI POST fails with 403
        http.post(`${BASE_URL}/sites/RefArch/cartridges`, () => {
          return HttpResponse.json({fault: {message: 'Access denied'}}, {status: 403});
        }),
        // Fallback reads current path via GET
        http.get(`${BASE_URL}/sites/RefArch`, () => {
          return HttpResponse.json({id: 'RefArch', cartridges: 'cart_a:cart_b'});
        }),
        ...createImportHandlers(),
      );

      const result = await addCartridge(mockInstance, 'RefArch', {name: 'cart_c', position: 'last'});

      expect(result.cartridges).to.equal('cart_a:cart_b:cart_c');
    });
  });

  describe('removeCartridge', () => {
    it('should remove cartridge via OCAPI for regular sites', async () => {
      server.use(
        http.delete(`${BASE_URL}/sites/RefArch/cartridges/old_cart`, () => {
          return HttpResponse.json({cartridges: 'cart_a', site_id: 'RefArch'});
        }),
      );

      const result = await removeCartridge(mockInstance, 'RefArch', 'old_cart');

      expect(result.cartridges).to.equal('cart_a');
    });

    it('should use import/export for Business Manager', async () => {
      server.use(
        http.get(`${BASE_URL}/sites/Sites-Site`, () => {
          return HttpResponse.json({id: 'Sites-Site', cartridges: 'cart_a:cart_b'});
        }),
        ...createImportHandlers(),
      );

      const result = await removeCartridge(mockInstance, 'Sites-Site', 'cart_a');

      expect(result.cartridges).to.equal('cart_b');
    });

    it('should throw when cartridge not found via import/export path', async () => {
      server.use(
        http.get(`${BASE_URL}/sites/Sites-Site`, () => {
          return HttpResponse.json({id: 'Sites-Site', cartridges: 'cart_a:cart_b'});
        }),
      );

      try {
        await removeCartridge(mockInstance, 'Sites-Site', 'nonexistent');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('not found');
        expect(error.message).to.include('nonexistent');
      }
    });
  });

  describe('setCartridgePath', () => {
    it('should set cartridge path via OCAPI for regular sites', async () => {
      server.use(
        http.put(`${BASE_URL}/sites/RefArch/cartridges`, async ({request}) => {
          const body = (await request.json()) as any;
          expect(body.cartridges).to.equal('new_cart1:new_cart2');
          return HttpResponse.json({cartridges: 'new_cart1:new_cart2', site_id: 'RefArch'});
        }),
      );

      const result = await setCartridgePath(mockInstance, 'RefArch', 'new_cart1:new_cart2');

      expect(result.cartridges).to.equal('new_cart1:new_cart2');
      expect(result.cartridgeList).to.deep.equal(['new_cart1', 'new_cart2']);
    });

    it('should use import/export for Business Manager with correct XML', async () => {
      let importedBuffer: Buffer | undefined;

      server.use(
        ...createImportHandlers((buf) => {
          importedBuffer = buf;
        }),
      );

      const result = await setCartridgePath(mockInstance, 'Sites-Site', 'bm_cart1:bm_cart2');

      expect(result.cartridges).to.equal('bm_cart1:bm_cart2');

      const zip = await JSZip.loadAsync(importedBuffer!);
      const files = Object.keys(zip.files);
      const prefsFile = files.find((f) => f.endsWith('preferences.xml'));
      const prefsXml = await zip.file(prefsFile!)!.async('text');
      expect(prefsXml).to.include('CustomCartridges');
      expect(prefsXml).to.include('bm_cart1:bm_cart2');
    });

    it('should generate site descriptor XML for regular site fallback', async () => {
      let importedBuffer: Buffer | undefined;

      server.use(
        http.put(`${BASE_URL}/sites/RefArch/cartridges`, () => {
          return HttpResponse.json({fault: {message: 'Access denied'}}, {status: 403});
        }),
        ...createImportHandlers((buf) => {
          importedBuffer = buf;
        }),
      );

      await setCartridgePath(mockInstance, 'RefArch', 'cart1:cart2');

      const zip = await JSZip.loadAsync(importedBuffer!);
      const files = Object.keys(zip.files);
      const siteXmlFile = files.find((f) => f.endsWith('site.xml'));
      const siteXml = await zip.file(siteXmlFile!)!.async('text');
      expect(siteXml).to.include('site-id="RefArch"');
      expect(siteXml).to.include('<cartridges>cart1:cart2</cartridges>');
    });
  });

  describe('addCartridge position logic (via BM import path)', () => {
    // These tests use BM to exercise the internal position logic
    // since BM always goes through the import/export path.
    beforeEach(() => {
      server.use(
        http.get(`${BASE_URL}/sites/Sites-Site`, () => {
          return HttpResponse.json({id: 'Sites-Site', cartridges: 'cart_a:cart_b:cart_c'});
        }),
        ...createImportHandlers(),
      );
    });

    it('should add at first position', async () => {
      const result = await addCartridge(mockInstance, 'Sites-Site', {name: 'new', position: 'first'});
      expect(result.cartridgeList).to.deep.equal(['new', 'cart_a', 'cart_b', 'cart_c']);
    });

    it('should add at last position', async () => {
      const result = await addCartridge(mockInstance, 'Sites-Site', {name: 'new', position: 'last'});
      expect(result.cartridgeList).to.deep.equal(['cart_a', 'cart_b', 'cart_c', 'new']);
    });

    it('should add before target', async () => {
      const result = await addCartridge(mockInstance, 'Sites-Site', {
        name: 'new',
        position: 'before',
        target: 'cart_b',
      });
      expect(result.cartridgeList).to.deep.equal(['cart_a', 'new', 'cart_b', 'cart_c']);
    });

    it('should add after target', async () => {
      const result = await addCartridge(mockInstance, 'Sites-Site', {
        name: 'new',
        position: 'after',
        target: 'cart_b',
      });
      expect(result.cartridgeList).to.deep.equal(['cart_a', 'cart_b', 'new', 'cart_c']);
    });

    it('should throw when target not found', async () => {
      try {
        await addCartridge(mockInstance, 'Sites-Site', {name: 'new', position: 'before', target: 'nonexistent'});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Target cartridge "nonexistent" not found');
      }
    });

    it('should throw when cartridge already exists', async () => {
      try {
        await addCartridge(mockInstance, 'Sites-Site', {name: 'cart_a', position: 'last'});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('already exists');
      }
    });
  });
});
