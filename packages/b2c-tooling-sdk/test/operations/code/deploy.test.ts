/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {deleteCartridges, uploadCartridges, findAndDeployCartridges} from '../../../src/operations/code/deploy.js';
import type {CartridgeMapping} from '../../../src/operations/code/cartridges.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

describe('operations/code/deploy', () => {
  const server = setupServer();
  let mockInstance: any;
  let tempDir: string;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    // Create temp directory for test cartridges
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-deploy-'));

    // Create a real instance with mocked HTTP
    const auth = new MockAuthStrategy();
    const webdav = new WebDavClient(TEST_HOST, auth);
    const ocapi = createOcapiClient(TEST_HOST, auth);

    mockInstance = {
      config: {
        codeVersion: 'v1',
      },
      webdav,
      ocapi,
    };
  });

  afterEach(() => {
    server.resetHandlers();
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  after(() => {
    server.close();
  });

  describe('deleteCartridges', () => {
    it('should delete all cartridges from WebDAV', async () => {
      const cartridges: CartridgeMapping[] = [
        {name: 'app_storefront', src: '/path/to/app', dest: 'app_storefront'},
        {name: 'app_core', src: '/path/to/core', dest: 'app_storefront_core'},
      ];

      const deletedPaths: string[] = [];

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'DELETE') {
            deletedPaths.push(new URL(request.url).pathname);
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      await deleteCartridges(mockInstance, cartridges);

      expect(deletedPaths).to.have.lengthOf(2);
      expect(deletedPaths[0]).to.include('app_storefront');
      expect(deletedPaths[1]).to.include('app_storefront_core');
    });

    it('should not delete when cartridges array is empty', async () => {
      // No HTTP handlers needed - if any request is made, MSW will error
      await deleteCartridges(mockInstance, []);
      // Success - no requests made
    });

    it('should throw error when code version is not set', async () => {
      mockInstance.config.codeVersion = undefined;
      const cartridges: CartridgeMapping[] = [{name: 'app', src: '/path', dest: 'app'}];

      try {
        await deleteCartridges(mockInstance, cartridges);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Code version required');
      }
    });

    it('should handle 404 errors gracefully (cartridge does not exist)', async () => {
      const cartridges: CartridgeMapping[] = [{name: 'app', src: '/path', dest: 'app'}];

      server.use(
        http.all(`${WEBDAV_BASE}/*`, () => {
          return new HttpResponse(null, {status: 404});
        }),
      );

      // Should not throw - 404 is expected when cartridge doesn't exist
      await deleteCartridges(mockInstance, cartridges);
    });
  });

  describe('uploadCartridges', () => {
    it('should upload and unzip cartridges', async () => {
      // Create a test cartridge directory
      const cartridgeDir = path.join(tempDir, 'app_storefront_base');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'console.log("test");');

      const cartridges: CartridgeMapping[] = [
        {name: 'app_storefront_base', src: cartridgeDir, dest: 'app_storefront_base'},
      ];

      let uploadedZip: Buffer | null = null;
      let unzipRequested = false;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          // uploadCartridges uses a temporary _sync-*.zip file
          if (request.method === 'PUT' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'POST' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            unzipRequested = true;
            return new HttpResponse(null, {status: 204});
          }
          if (request.method === 'DELETE' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      await uploadCartridges(mockInstance, cartridges);

      expect(uploadedZip).to.not.be.null;
      expect(uploadedZip!.length).to.be.greaterThan(0);
      expect(unzipRequested).to.be.true;
    });

    it('should throw error when cartridges array is empty', async () => {
      try {
        await uploadCartridges(mockInstance, []);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('No cartridges to upload');
      }
    });

    it('should throw error when code version is missing', async () => {
      mockInstance.config.codeVersion = undefined;
      const cartridges: CartridgeMapping[] = [{name: 'app', src: tempDir, dest: 'app'}];

      try {
        await uploadCartridges(mockInstance, cartridges);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Code version required');
      }
    });

    it('should handle upload failures', async () => {
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'test');

      const cartridges: CartridgeMapping[] = [{name: 'app_test', src: cartridgeDir, dest: 'app_test'}];

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'PUT') {
            return new HttpResponse('Upload failed', {status: 500});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      try {
        await uploadCartridges(mockInstance, cartridges);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('PUT failed');
      }
    });
  });

  describe('findAndDeployCartridges', () => {
    it('should deploy cartridges from directory', async () => {
      // Create test cartridge structure
      const cartridgeDir = path.join(tempDir, 'my_cartridge');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'console.log("test");');

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          // Handle _sync-*.zip uploads
          if (request.method === 'PUT' || request.method === 'POST' || request.method === 'DELETE') {
            return new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await findAndDeployCartridges(mockInstance, tempDir, {reload: false, delete: false});

      expect(result.cartridges).to.have.lengthOf(1);
      expect(result.cartridges[0].name).to.equal('my_cartridge');
      expect(result.codeVersion).to.equal('v1');
      expect(result.reloaded).to.be.false;
    });

    it('should reload code version when reload option is true', async () => {
      const cartridgeDir = path.join(tempDir, 'my_cartridge');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'test');

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'PUT' || request.method === 'POST' || request.method === 'DELETE') {
            return new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        // Mock reloadCodeVersion (which calls listCodeVersions and activateCodeVersion)
        http.get(`${OCAPI_BASE}/code_versions`, () => {
          return HttpResponse.json({
            data: [
              {id: 'v1', active: true},
              {id: 'v2', active: false},
            ],
          });
        }),
        http.patch(`${OCAPI_BASE}/code_versions/v2`, () => {
          return HttpResponse.json({id: 'v2', active: true});
        }),
        http.patch(`${OCAPI_BASE}/code_versions/v1`, () => {
          return HttpResponse.json({id: 'v1', active: true});
        }),
      );

      const result = await findAndDeployCartridges(mockInstance, tempDir, {reload: true, delete: false});

      expect(result.reloaded).to.be.true;
    });

    it('should delete existing cartridges when delete option is true', async () => {
      const cartridgeDir = path.join(tempDir, 'my_cartridge');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'test');

      let deleteRequested = false;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          const url = new URL(request.url);
          if (
            request.method === 'DELETE' &&
            url.pathname.includes('/v1/my_cartridge') &&
            !url.pathname.includes('.zip')
          ) {
            deleteRequested = true;
          }
          if (request.method === 'PUT' || request.method === 'POST' || request.method === 'DELETE') {
            return new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await findAndDeployCartridges(mockInstance, tempDir, {reload: false, delete: true});

      expect(deleteRequested).to.be.true;
      expect(result.cartridges).to.have.lengthOf(1);
    });

    it('should apply include filter when provided', async () => {
      // Create multiple cartridges
      const cart1 = path.join(tempDir, 'app_storefront');
      const cart2 = path.join(tempDir, 'app_core');

      fs.mkdirSync(cart1, {recursive: true});
      fs.mkdirSync(cart2, {recursive: true});
      fs.writeFileSync(path.join(cart1, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cart2, '.project'), '<projectDescription/>');

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'PUT' || request.method === 'POST' || request.method === 'DELETE') {
            return new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await findAndDeployCartridges(mockInstance, tempDir, {
        reload: false,
        delete: false,
        include: ['app_storefront'],
      });

      expect(result.cartridges).to.have.lengthOf(1);
      expect(result.cartridges[0].name).to.equal('app_storefront');
    });

    it('should throw error when no cartridges found', async () => {
      // No cartridges in tempDir
      try {
        await findAndDeployCartridges(mockInstance, tempDir, {reload: false, delete: false});
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('No cartridges found');
      }
    });
  });
});
