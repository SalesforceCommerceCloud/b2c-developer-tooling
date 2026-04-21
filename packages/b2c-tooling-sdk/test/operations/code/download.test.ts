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
import {downloadCartridges} from '../../../src/operations/code/download.js';

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

    it('should apply include filter', async () => {
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

      const result = await downloadCartridges(mockInstance, tempDir, {include: ['app_storefront']});

      expect(result.cartridges).to.deep.equal(['app_storefront']);
      expect(fs.existsSync(path.join(tempDir, 'app_storefront/main.js'))).to.be.true;
      expect(fs.existsSync(path.join(tempDir, 'app_core/core.js'))).to.be.false;
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
      // eslint-disable-next-line no-bitwise
      expect(stat.mode & 0o777).to.equal(0o755);
      expect(fs.readFileSync(filePath, 'utf-8')).to.equal('new content');
    });
  });
});
