/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import JSZip from 'jszip';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {
  deleteCartridges,
  uploadCartridges,
  findAndDeployCartridges,
  UNZIP_WAIT,
} from '../../../src/operations/code/deploy.js';
import {HTTPError} from '../../../src/errors/http-error.js';
import type {CartridgeMapping} from '../../../src/operations/code/cartridges.js';
import {NetworkError} from '../../../src/errors/network-error.js';
import type {AuthStrategy} from '../../../src/auth/index.js';

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
        hostname: TEST_HOST,
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

    it('should exclude node_modules and other ignored dirs from the archive', async () => {
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(path.join(cartridgeDir, 'cartridge', 'scripts'), {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'cartridge', 'scripts', 'a.js'), 'console.log("a");');
      fs.mkdirSync(path.join(cartridgeDir, 'node_modules', 'x'), {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'node_modules', 'x', 'index.js'), 'module.exports = {};');
      const templatesDir = path.join(cartridgeDir, 'cartridge', 'templates', 'default');
      fs.mkdirSync(path.join(templatesDir, 'build'), {recursive: true});
      fs.writeFileSync(path.join(templatesDir, 'build', 'b.isml'), '<div></div>');
      fs.mkdirSync(path.join(templatesDir, 'dist'), {recursive: true});
      fs.writeFileSync(path.join(templatesDir, 'dist', 'd.isml'), '<div></div>');

      const cartridges: CartridgeMapping[] = [{name: 'app_test', src: cartridgeDir, dest: 'app_test'}];

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'POST' || request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      await uploadCartridges(mockInstance, cartridges);

      expect(uploadedZip).to.not.be.null;
      const zip = await JSZip.loadAsync(uploadedZip!);
      const entryPaths = Object.keys(zip.files).map((p) => p.replaceAll('\\', '/'));
      expect(entryPaths.some((p) => p.endsWith('cartridge/scripts/a.js'))).to.be.true;
      expect(entryPaths.some((p) => p.includes('node_modules/'))).to.be.false;
      expect(entryPaths.some((p) => p.endsWith('templates/default/build/b.isml'))).to.be.true;
      expect(entryPaths.some((p) => p.endsWith('templates/default/dist/d.isml'))).to.be.true;
    });

    it('should replace the default ignore list with ignoreDirs', async () => {
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(path.join(cartridgeDir, 'cartridge', 'scripts'), {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'cartridge', 'scripts', 'a.js'), 'console.log("a");');
      fs.mkdirSync(path.join(cartridgeDir, 'node_modules', 'x'), {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'node_modules', 'x', 'index.js'), 'module.exports = {};');
      const templatesDir = path.join(cartridgeDir, 'cartridge', 'templates', 'default');
      fs.mkdirSync(path.join(templatesDir, 'build'), {recursive: true});
      fs.writeFileSync(path.join(templatesDir, 'build', 'b.isml'), '<div></div>');
      fs.mkdirSync(path.join(templatesDir, 'dist'), {recursive: true});
      fs.writeFileSync(path.join(templatesDir, 'dist', 'd.isml'), '<div></div>');

      const cartridges: CartridgeMapping[] = [{name: 'app_test', src: cartridgeDir, dest: 'app_test'}];

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'POST' || request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      await uploadCartridges(mockInstance, cartridges, {ignoreDirs: ['build']});

      expect(uploadedZip).to.not.be.null;
      const zip = await JSZip.loadAsync(uploadedZip!);
      const entryPaths = Object.keys(zip.files).map((p) => p.replaceAll('\\', '/'));
      expect(entryPaths.some((p) => p.endsWith('cartridge/scripts/a.js'))).to.be.true;
      expect(entryPaths.some((p) => p.includes('node_modules/x/index.js'))).to.be.true;
      expect(entryPaths.some((p) => p.endsWith('templates/default/build/b.isml'))).to.be.false;
      expect(entryPaths.some((p) => p.endsWith('templates/default/dist/d.isml'))).to.be.true;
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
      expect(result.activated).to.be.false;
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

      expect(result.activated).to.be.true;
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

  describe('uploadCartridges network resilience', () => {
    it('should include abort signal on unzip POST request', async () => {
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'test');

      const cartridges: CartridgeMapping[] = [{name: 'app_test', src: cartridgeDir, dest: 'app_test'}];

      let postSignal: AbortSignal | undefined;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'POST' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            postSignal = request.signal;
            return new HttpResponse(null, {status: 204});
          }
          if (request.method === 'DELETE' && url.pathname.includes('_sync-') && url.pathname.endsWith('.zip')) {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      await uploadCartridges(mockInstance, cartridges);

      expect(postSignal).to.be.instanceOf(AbortSignal);
    });

    describe('when the unzip request drops', () => {
      const saved = {...UNZIP_WAIT};
      beforeEach(() => Object.assign(UNZIP_WAIT, {intervalMs: 1, timeoutMs: 500}));
      afterEach(() => Object.assign(UNZIP_WAIT, saved));

      /**
       * Drops the first `drops` unzip POSTs, then answers the rest from
       * `statuses` in order (the last status repeats). Everything else goes to MSW.
       */
      function unzipInstance(script: {drops: number; statuses: number[]; posts: number}): any {
        class ScriptedUnzipAuth implements AuthStrategy {
          async fetch(url: string, init?: RequestInit): Promise<Response> {
            if (init?.method === 'POST' && url.includes('_sync-') && url.endsWith('.zip')) {
              const n = script.posts++;
              if (n < script.drops) {
                const cause = Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'});
                throw Object.assign(new TypeError('fetch failed'), {cause});
              }
              const status = script.statuses[Math.min(n - script.drops, script.statuses.length - 1)];
              return new Response(null, {status});
            }
            return fetch(url, init);
          }

          async getAuthorizationHeader(): Promise<string> {
            return 'Bearer test-token';
          }
        }
        return {...mockInstance, webdav: new WebDavClient(TEST_HOST, new ScriptedUnzipAuth())};
      }

      function testCartridge(): CartridgeMapping[] {
        const cartridgeDir = path.join(tempDir, 'app_test');
        fs.mkdirSync(cartridgeDir, {recursive: true});
        fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'test');
        return [{name: 'app_test', src: cartridgeDir, dest: 'app_test'}];
      }

      beforeEach(() => {
        server.use(
          http.all(`${WEBDAV_BASE}/*`, ({request}) => {
            if (request.method === 'PUT') return new HttpResponse(null, {status: 201});
            if (request.method === 'DELETE') return new HttpResponse(null, {status: 204});
            return new HttpResponse(null, {status: 404});
          }),
        );
      });

      it('waits while the server reports the unzip as locked, then succeeds', async () => {
        const script = {drops: 1, statuses: [423, 423, 201], posts: 0};

        await uploadCartridges(unzipInstance(script), testCartridge());

        expect(script.posts).to.equal(4);
      });

      it('fails immediately when the server cannot extract the archive', async () => {
        const script = {drops: 1, statuses: [500], posts: 0};

        try {
          await uploadCartridges(unzipInstance(script), testCartridge());
          expect.fail('Should have thrown');
        } catch (error: any) {
          expect(error.message).to.match(/could not extract the archive/);
        }
        expect(script.posts).to.equal(2);
      });

      it('gives up after repeated drops instead of re-extracting indefinitely', async () => {
        const script = {drops: 100, statuses: [201], posts: 0};

        try {
          await uploadCartridges(unzipInstance(script), testCartridge());
          expect.fail('Should have thrown');
        } catch (error: any) {
          expect(error).to.be.instanceOf(NetworkError);
          expect(error.message).to.match(/may still be extracting/i);
          expect(error.message).to.include('_sync-');
        }
        // The first request plus at most UNZIP_MAX_DROPS (2) more that may each start an extraction.
        expect(script.posts).to.equal(4);
      });

      it('gives up when the unzip stays locked past the wait limit', async () => {
        Object.assign(UNZIP_WAIT, {intervalMs: 5, timeoutMs: 40});
        const script = {drops: 1, statuses: [423], posts: 0};

        try {
          await uploadCartridges(unzipInstance(script), testCartridge());
          expect.fail('Should have thrown');
        } catch (error: any) {
          expect(error).to.be.instanceOf(NetworkError);
          expect(error.message).to.match(/still extracting it after/i);
        }
      });
    });
  });

  describe('uploadCartridges split archives', () => {
    function makeCartridge(name: string, files: number, bytesPerFile: number): CartridgeMapping {
      const dir = path.join(tempDir, name);
      fs.mkdirSync(path.join(dir, 'cartridge', 'static'), {recursive: true});
      for (let i = 0; i < files; i++) {
        // Random bytes in a .png are stored, so archive size is predictable.
        fs.writeFileSync(
          path.join(dir, 'cartridge', 'static', `f${i}.png`),
          Buffer.alloc(bytesPerFile, i + name.length),
        );
      }
      return {name, src: dir, dest: name};
    }

    function recordingHandlers(record: {puts: {path: string; zip: Buffer}[]; unzips: string[]; deletes: string[]}) {
      return http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
        const url = new URL(request.url);
        if (request.method === 'PUT') {
          record.puts.push({path: url.pathname, zip: Buffer.from(await request.arrayBuffer())});
          return new HttpResponse(null, {status: 201});
        }
        if (request.method === 'POST') {
          record.unzips.push(url.pathname);
          return new HttpResponse(null, {status: 201});
        }
        if (request.method === 'DELETE') {
          record.deletes.push(url.pathname);
          return new HttpResponse(null, {status: 204});
        }
        return new HttpResponse(null, {status: 404});
      });
    }

    it('splits cartridges into several archives under the size limit, in order', async () => {
      const cartridges = [
        makeCartridge('a_one', 3, 20_000),
        makeCartridge('b_two', 3, 20_000),
        makeCartridge('c_three', 3, 20_000),
      ];
      const record = {puts: [] as {path: string; zip: Buffer}[], unzips: [] as string[], deletes: [] as string[]};
      server.use(recordingHandlers(record));
      const plans: any[] = [];

      await uploadCartridges(mockInstance, cartridges, {maxArchiveBytes: 70_000, onPlan: (p) => plans.push(p)});

      expect(plans).to.have.length(1);
      expect(plans[0].parts).to.equal(3);
      expect(record.puts).to.have.length(3);
      expect(record.unzips).to.deep.equal(record.puts.map((p) => p.path));
      for (const [i, put] of record.puts.entries()) {
        expect(put.zip.length).to.be.at.most(70_000);
        const zip = await JSZip.loadAsync(put.zip);
        const names = Object.keys(zip.files);
        // Each archive holds one whole cartridge.
        expect(names.filter((n) => n.includes('/cartridge/')).every((n) => n.startsWith(`v1/${cartridges[i].dest}/`)))
          .to.be.true;
      }
      // Uploaded archives are deleted.
      expect(record.deletes.filter((d) => d.endsWith('.zip'))).to.have.length(3);
    });

    it('splits a cartridge larger than the limit at file boundaries', async () => {
      const cartridges = [makeCartridge('big_one', 6, 20_000)];
      const record = {puts: [] as {path: string; zip: Buffer}[], unzips: [] as string[], deletes: [] as string[]};
      server.use(recordingHandlers(record));

      await uploadCartridges(mockInstance, cartridges, {maxArchiveBytes: 50_000});

      expect(record.puts.length).to.be.at.least(3);
      const files = new Set<string>();
      for (const put of record.puts) {
        expect(put.zip.length).to.be.at.most(50_000);
        const zip = await JSZip.loadAsync(put.zip);
        for (const n of Object.keys(zip.files)) if (n.includes('/cartridge/')) files.add(n);
      }
      expect(files.size).to.equal(6);
    });

    it('fails before uploading when a single file is larger than the limit', async () => {
      const cartridges = [makeCartridge('huge', 1, 60_000)];
      const record = {puts: [] as {path: string; zip: Buffer}[], unzips: [] as string[], deletes: [] as string[]};
      server.use(recordingHandlers(record));

      try {
        await uploadCartridges(mockInstance, cartridges, {maxArchiveBytes: 50_000});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('File too large for a single deploy archive');
      }
      expect(record.puts).to.have.length(0);
    });

    it('retries an upload whose connection drops', async () => {
      const cartridges = [makeCartridge('a_one', 1, 1000)];
      let putAttempts = 0;
      class DropFirstPutAuth implements AuthStrategy {
        async fetch(url: string, init?: RequestInit): Promise<Response> {
          if (init?.method === 'PUT' && ++putAttempts === 1) {
            const cause = Object.assign(new Error('socket hang up'), {code: 'EPIPE'});
            throw Object.assign(new TypeError('fetch failed'), {cause});
          }
          return fetch(url, init);
        }

        async getAuthorizationHeader(): Promise<string> {
          return 'Bearer test-token';
        }
      }
      const record = {puts: [] as {path: string; zip: Buffer}[], unzips: [] as string[], deletes: [] as string[]};
      server.use(recordingHandlers(record));

      await uploadCartridges(
        {...mockInstance, webdav: new WebDavClient(TEST_HOST, new DropFirstPutAuth())},
        cartridges,
      );

      expect(putAttempts).to.equal(2);
      expect(record.puts).to.have.length(1);
      expect(record.unzips).to.have.length(1);
    });

    it('explains a 413 for a small archive as a likely stopped sandbox', async () => {
      const cartridges = [makeCartridge('a_one', 1, 1000)];
      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) =>
          request.method === 'PUT'
            ? new HttpResponse('<html><body><h2>Request Entity Too Large</h2></body></html>', {status: 413})
            : new HttpResponse(null, {status: 404}),
        ),
      );

      try {
        await uploadCartridges(mockInstance, cartridges);
        expect.fail('Should have thrown');
      } catch (error: any) {
        // A tiny archive rejected with 413 points at a stopped sandbox.
        expect(error).to.be.instanceOf(HTTPError);
        expect(error.message).to.match(/sandbox may be stopped/);
      }
    });
  });
});
