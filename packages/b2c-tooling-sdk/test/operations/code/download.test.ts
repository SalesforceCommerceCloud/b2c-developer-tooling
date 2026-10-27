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
import JSZip from 'jszip';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {downloadCartridges, ZIP_WAIT} from '../../../src/operations/code/download.js';
import {NetworkError} from '../../../src/errors/network-error.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

async function createTestZip(codeVersion: string, cartridges: Record<string, Record<string, string>>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [cartridgeName, files] of Object.entries(cartridges)) {
    for (const [filePath, content] of Object.entries(files)) {
      zip.file(`${codeVersion}/${cartridgeName}/${filePath}`, content);
    }
  }
  return zip.generateAsync({type: 'nodebuffer'});
}

async function createCartridgeZip(cartridgeName: string, files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(`${cartridgeName}/${filePath}`, content);
  }
  return zip.generateAsync({type: 'nodebuffer'});
}

describe('operations/code/download', () => {
  const server = setupServer();
  let mockInstance: any;
  let tempDir: string;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-download-'));

    const auth = new MockAuthStrategy();
    const webdav = new WebDavClient(TEST_HOST, auth);
    const ocapi = createOcapiClient(TEST_HOST, auth);

    mockInstance = {
      config: {
        hostname: TEST_HOST,
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

  describe('downloadCartridges', () => {
    it('should download and extract cartridges', async () => {
      const zipBuffer = await createTestZip('v1', {
        app_storefront: {
          'cartridge/scripts/main.js': 'console.log("hello");',
          'cartridge/templates/page.isml': '<div/>',
        },
        app_core: {'cartridge/scripts/core.js': 'module.exports = {};'},
      });

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'POST' && url.pathname.includes('/Cartridges/v1')) {
            return new HttpResponse(null, {status: 204});
          }
          if (request.method === 'GET' && url.pathname.endsWith('/Cartridges/v1.zip')) {
            return new HttpResponse(zipBuffer, {status: 200, headers: {'Content-Type': 'application/zip'}});
          }
          if (request.method === 'DELETE' && url.pathname.endsWith('/Cartridges/v1.zip')) {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await downloadCartridges(mockInstance, tempDir);

      expect(result.cartridges).to.have.members(['app_core', 'app_storefront']);
      expect(result.codeVersion).to.equal('v1');

      const mainJs = fs.readFileSync(path.join(tempDir, 'app_storefront/cartridge/scripts/main.js'), 'utf-8');
      expect(mainJs).to.equal('console.log("hello");');

      const coreJs = fs.readFileSync(path.join(tempDir, 'app_core/cartridge/scripts/core.js'), 'utf-8');
      expect(coreJs).to.equal('module.exports = {};');
    });

    it('should apply include filter with per-cartridge download', async () => {
      const cartridgeZip = await createCartridgeZip('app_storefront', {'main.js': 'storefront'});

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'POST' && url.pathname.includes('/Cartridges/v1/app_storefront')) {
            return new HttpResponse(null, {status: 204});
          }
          if (request.method === 'GET' && url.pathname.endsWith('/Cartridges/v1/app_storefront.zip')) {
            return new HttpResponse(cartridgeZip, {status: 200});
          }
          if (request.method === 'DELETE' && url.pathname.endsWith('/Cartridges/v1/app_storefront.zip')) {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await downloadCartridges(mockInstance, tempDir, {include: ['app_storefront']});

      expect(result.cartridges).to.deep.equal(['app_storefront']);
      expect(fs.existsSync(path.join(tempDir, 'app_storefront/main.js'))).to.be.true;
      expect(fs.existsSync(path.join(tempDir, 'app_core'))).to.be.false;
    });

    it('should apply exclude filter', async () => {
      const zipBuffer = await createTestZip('v1', {
        app_storefront: {'main.js': 'storefront'},
        app_core: {'core.js': 'core'},
      });

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'POST') return new HttpResponse(null, {status: 204});
          if (request.method === 'GET') return new HttpResponse(zipBuffer, {status: 200});
          if (request.method === 'DELETE') return new HttpResponse(null, {status: 204});
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await downloadCartridges(mockInstance, tempDir, {exclude: ['app_core']});

      expect(result.cartridges).to.deep.equal(['app_storefront']);
      expect(fs.existsSync(path.join(tempDir, 'app_storefront/main.js'))).to.be.true;
      expect(fs.existsSync(path.join(tempDir, 'app_core'))).to.be.false;
    });

    it('should extract to mirror paths when mirror map is provided', async () => {
      const mirrorDir = path.join(tempDir, 'mirror_target');
      fs.mkdirSync(mirrorDir, {recursive: true});

      const zipBuffer = await createTestZip('v1', {
        app_storefront: {'scripts/main.js': 'mirrored'},
      });

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'POST') return new HttpResponse(null, {status: 204});
          if (request.method === 'GET') return new HttpResponse(zipBuffer, {status: 200});
          if (request.method === 'DELETE') return new HttpResponse(null, {status: 204});
          return new HttpResponse(null, {status: 404});
        }),
      );

      const mirror = new Map([['app_storefront', mirrorDir]]);
      const result = await downloadCartridges(mockInstance, tempDir, {mirror});

      expect(result.cartridges).to.deep.equal(['app_storefront']);
      const content = fs.readFileSync(path.join(mirrorDir, 'scripts/main.js'), 'utf-8');
      expect(content).to.equal('mirrored');
    });

    it('should throw error when code version cannot be determined', async () => {
      mockInstance.config.codeVersion = undefined;

      server.use(
        http.get(`${OCAPI_BASE}/code_versions`, () => {
          return HttpResponse.json({data: [{id: 'v1', active: false}]});
        }),
      );

      try {
        await downloadCartridges(mockInstance, tempDir);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Code version required');
      }
    });

    it('should auto-discover code version when not set', async () => {
      mockInstance.config.codeVersion = undefined;

      const zipBuffer = await createTestZip('active_v', {
        app_storefront: {'main.js': 'content'},
      });

      server.use(
        http.get(`${OCAPI_BASE}/code_versions`, () => {
          return HttpResponse.json({data: [{id: 'active_v', active: true}]});
        }),
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'POST') return new HttpResponse(null, {status: 204});
          if (request.method === 'GET') return new HttpResponse(zipBuffer, {status: 200});
          if (request.method === 'DELETE') return new HttpResponse(null, {status: 204});
          return new HttpResponse(null, {status: 404});
        }),
      );

      const result = await downloadCartridges(mockInstance, tempDir);

      expect(result.codeVersion).to.equal('active_v');
      expect(result.cartridges).to.deep.equal(['app_storefront']);
    });

    it('should handle server-side zip failure', async () => {
      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'POST') {
            return new HttpResponse('Internal Server Error', {status: 500});
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      try {
        await downloadCartridges(mockInstance, tempDir);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to create server-side zip');
      }
    });

    describe('when the zip request drops before the server answers', () => {
      const saved = {...ZIP_WAIT};

      beforeEach(() => {
        Object.assign(ZIP_WAIT, {intervalMs: 1, timeoutMs: 2000});
        const request = mockInstance.webdav.request.bind(mockInstance.webdav);
        mockInstance.webdav.request = (p: string, init?: RequestInit) =>
          init?.method === 'POST'
            ? Promise.reject(new NetworkError('headers timeout', {kind: 'timeout'}))
            : request(p, init);
      });

      afterEach(() => Object.assign(ZIP_WAIT, saved));

      function serveGrowingZip(zipBuffer: Buffer, partialPolls: number) {
        let polls = 0;
        const ranges: string[] = [];
        server.use(
          http.all(`${WEBDAV_BASE}/*`, ({request}) => {
            if (request.method === 'PROPFIND') {
              polls++;
              // Still being written: the first part of the file, without the central directory.
              const size = polls <= partialPolls ? Math.floor(zipBuffer.length / 2) : zipBuffer.length;
              return new HttpResponse(
                `<?xml version="1.0"?><multistatus xmlns="DAV:"><response><href>/x/v1.zip</href><propstat><prop><getcontentlength>${size}</getcontentlength><resourcetype/></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`,
                {status: 207},
              );
            }
            if (request.method === 'GET') {
              const range = request.headers.get('Range');
              const body = polls <= partialPolls ? zipBuffer.subarray(0, zipBuffer.length / 2) : zipBuffer;
              if (!range) return new HttpResponse(body, {status: 200});
              ranges.push(range);
              const start = Number(/bytes=(\d+)-/.exec(range)![1]);
              return new HttpResponse(body.subarray(start), {status: 206});
            }
            if (request.method === 'DELETE') return new HttpResponse(null, {status: 204});
            return new HttpResponse(null, {status: 404});
          }),
        );
        return {polls: () => polls, ranges};
      }

      it('waits for the server to finish the zip, then downloads it', async () => {
        const zipBuffer = await createTestZip('v1', {app_storefront: {'main.js': 'content'}});
        const state = serveGrowingZip(zipBuffer, 2);

        const result = await downloadCartridges(mockInstance, tempDir);

        expect(result.cartridges).to.deep.equal(['app_storefront']);
        expect(state.polls()).to.equal(3);
        expect(state.ranges).to.have.length(3);
        expect(fs.readFileSync(path.join(tempDir, 'app_storefront/main.js'), 'utf8')).to.equal('content');
      });

      it('waits for a single cartridge zip too', async () => {
        const zipBuffer = await createCartridgeZip('app_storefront', {'main.js': 'storefront'});
        serveGrowingZip(zipBuffer, 1);

        const result = await downloadCartridges(mockInstance, tempDir, {include: ['app_storefront']});

        expect(result.cartridges).to.deep.equal(['app_storefront']);
        expect(fs.readFileSync(path.join(tempDir, 'app_storefront/main.js'), 'utf8')).to.equal('storefront');
      });

      it('fails when the server deletes the zip', async () => {
        server.use(http.all(`${WEBDAV_BASE}/*`, () => new HttpResponse(null, {status: 404})));

        const error = (await downloadCartridges(mockInstance, tempDir).catch((e: Error) => e)) as Error;
        expect(error.message).to.include('Failed to create server-side zip');
        expect(error.message).to.include('is gone');
      });

      it('gives up when the zip never finishes', async () => {
        Object.assign(ZIP_WAIT, {intervalMs: 1, timeoutMs: 50});
        serveGrowingZip(await createTestZip('v1', {app: {'a.js': 'a'}}), Infinity);

        const error = (await downloadCartridges(mockInstance, tempDir).catch((e: Error) => e)) as Error;
        expect(error.message).to.include('was not finished');
      });
    });

    it('should handle cleanup failure gracefully', async () => {
      const zipBuffer = await createTestZip('v1', {
        app_storefront: {'main.js': 'content'},
      });

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'POST') return new HttpResponse(null, {status: 204});
          if (request.method === 'GET') return new HttpResponse(zipBuffer, {status: 200});
          if (request.method === 'DELETE') return new HttpResponse('Server Error', {status: 500});
          return new HttpResponse(null, {status: 404});
        }),
      );

      // Should succeed even though cleanup fails
      const result = await downloadCartridges(mockInstance, tempDir);
      expect(result.cartridges).to.deep.equal(['app_storefront']);
    });

    it('should preserve existing file permissions', async function () {
      // NTFS does not honor POSIX permission bits: fs.chmod(0o755) silently
      // leaves the mode as 0o666, so this assertion can only be validated on
      // POSIX platforms.
      if (process.platform === 'win32') {
        this.skip();
      }
      const cartridgeDir = path.join(tempDir, 'app_storefront');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      const filePath = path.join(cartridgeDir, 'main.js');
      fs.writeFileSync(filePath, 'old content');
      fs.chmodSync(filePath, 0o755);

      const zipBuffer = await createTestZip('v1', {
        app_storefront: {'main.js': 'new content'},
      });

      server.use(
        http.all(`${WEBDAV_BASE}/*`, ({request}) => {
          if (request.method === 'POST') return new HttpResponse(null, {status: 204});
          if (request.method === 'GET') return new HttpResponse(zipBuffer, {status: 200});
          if (request.method === 'DELETE') return new HttpResponse(null, {status: 204});
          return new HttpResponse(null, {status: 404});
        }),
      );

      await downloadCartridges(mockInstance, tempDir);

      const stat = fs.statSync(filePath);

      expect(stat.mode & 0o777).to.equal(0o755);
      expect(fs.readFileSync(filePath, 'utf-8')).to.equal('new content');
    });
  });
});
