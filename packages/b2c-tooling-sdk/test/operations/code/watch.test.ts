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
import {watchCartridges, type WatchResult} from '../../../src/operations/code/watch.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

describe('operations/code/watch', () => {
  const server = setupServer();
  let mockInstance: any;
  let tempDir: string;
  let watchResult: WatchResult | null = null;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    // Create temp directory for test cartridges
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-watch-'));

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

    watchResult = null;
  });

  afterEach(async () => {
    server.resetHandlers();

    // Stop any active watcher
    if (watchResult) {
      await watchResult.stop();
      watchResult = null;
    }

    // Clean up temp directory
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  after(() => {
    server.close();
  });

  describe('watchCartridges', () => {
    it('should throw error when no cartridges found', async () => {
      // Empty directory - no cartridges
      try {
        await watchCartridges(mockInstance, tempDir);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('No cartridges found');
      }
    });

    it('should throw error when no code version specified and no active version', async () => {
      mockInstance.config.codeVersion = undefined;

      // Create a cartridge directory
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');

      server.use(
        http.get(`${OCAPI_BASE}/code_versions`, () => {
          return HttpResponse.json({data: [{id: 'v1', active: false}]}); // No active version
        }),
      );

      try {
        await watchCartridges(mockInstance, tempDir);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('no active code version found');
      }
    });

    it('should use active code version when not specified', async () => {
      mockInstance.config.codeVersion = undefined;

      // Create a cartridge directory
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');

      server.use(
        http.get(`${OCAPI_BASE}/code_versions`, () => {
          return HttpResponse.json({
            data: [
              {id: 'v2', active: true},
              {id: 'v1', active: false},
            ],
          });
        }),
      );

      watchResult = await watchCartridges(mockInstance, tempDir);

      expect(watchResult.codeVersion).to.equal('v2');
      expect(mockInstance.config.codeVersion).to.equal('v2');
    });

    it('should start watching cartridges', async () => {
      // Create a cartridge directory
      const cartridgeDir = path.join(tempDir, 'app_storefront');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');

      watchResult = await watchCartridges(mockInstance, tempDir);

      expect(watchResult.cartridges).to.have.lengthOf(1);
      expect(watchResult.cartridges[0].name).to.equal('app_storefront');
      expect(watchResult.codeVersion).to.equal('v1');
      expect(watchResult.watcher).to.exist;
      expect(watchResult.stop).to.be.a('function');
    });

    it('should apply include filter', async () => {
      // Create multiple cartridges
      const cart1 = path.join(tempDir, 'app_storefront');
      const cart2 = path.join(tempDir, 'app_core');

      fs.mkdirSync(cart1, {recursive: true});
      fs.mkdirSync(cart2, {recursive: true});
      fs.writeFileSync(path.join(cart1, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cart2, '.project'), '<projectDescription/>');

      watchResult = await watchCartridges(mockInstance, tempDir, {
        include: ['app_storefront'],
      });

      expect(watchResult.cartridges).to.have.lengthOf(1);
      expect(watchResult.cartridges[0].name).to.equal('app_storefront');
    });

    it('should apply exclude filter', async () => {
      // Create multiple cartridges
      const cart1 = path.join(tempDir, 'app_storefront');
      const cart2 = path.join(tempDir, 'app_core');

      fs.mkdirSync(cart1, {recursive: true});
      fs.mkdirSync(cart2, {recursive: true});
      fs.writeFileSync(path.join(cart1, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cart2, '.project'), '<projectDescription/>');

      watchResult = await watchCartridges(mockInstance, tempDir, {
        exclude: ['app_core'],
      });

      expect(watchResult.cartridges).to.have.lengthOf(1);
      expect(watchResult.cartridges[0].name).to.equal('app_storefront');
    });

    it('should watch and upload file changes', async function () {
      this.timeout(5000);

      // Create a cartridge directory with initial files
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');
      fs.writeFileSync(path.join(cartridgeDir, 'initial.js'), '// initial');

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async () => {
          return new HttpResponse(null, {
            status: 201, // All requests succeed
          });
        }),
      );

      const uploadPromise = new Promise<void>((resolve, reject) => {
        watchCartridges(mockInstance, tempDir, {
          debounceTime: 50, // Short debounce for testing
          onUpload: (files) => {
            try {
              expect(files.length).to.be.greaterThan(0);
              // Check if test.js is in the uploaded files (not initial.js)
              if (files.some((f) => f.includes('test.js'))) {
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            reject(error);
          },
        }).then((result) => {
          watchResult = result;
        });
      });

      // Wait for watcher to be ready
      await new Promise((resolve) => setTimeout(resolve, 300));

      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'console.log("test");');

      await uploadPromise;
    });

    it('should watch and delete files', async function () {
      this.timeout(5000);

      // Create a cartridge directory with a file
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');
      const testFile = path.join(cartridgeDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      server.use(
        http.all(`${WEBDAV_BASE}/*`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      const deletePromise = new Promise<void>((resolve, reject) => {
        watchCartridges(mockInstance, tempDir, {
          debounceTime: 50, // Short debounce for testing
          onDelete: (files) => {
            try {
              expect(files).to.have.lengthOf(1);
              expect(files[0]).to.include('test.js');
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            reject(error);
          },
        }).then((result) => {
          watchResult = result;
        });
      });

      // Wait for watcher to be ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Delete the file
      fs.unlinkSync(testFile);

      await deletePromise;
    });

    it('should handle upload errors', async function () {
      this.timeout(5000);

      // Create a cartridge directory
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'PUT') {
            return new HttpResponse('Upload failed', {status: 500});
          }
          return new HttpResponse(null, {status: 204});
        }),
      );

      const errorPromise = new Promise<void>((resolve, reject) => {
        watchCartridges(mockInstance, tempDir, {
          debounceTime: 50,
          onError: (error) => {
            try {
              expect(error.message).to.include('PUT failed');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        }).then((result) => {
          watchResult = result;
        });
      });

      // Wait for watcher to be ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger a file change
      fs.writeFileSync(path.join(cartridgeDir, 'test.js'), 'console.log("test");');

      await errorPromise;
    });

    it('should stop watching when stop() is called', async () => {
      // Create a cartridge directory
      const cartridgeDir = path.join(tempDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');

      watchResult = await watchCartridges(mockInstance, tempDir);

      expect(watchResult.watcher).to.exist;

      await watchResult.stop();
      watchResult = null; // Prevent double cleanup
    });
  });
});
