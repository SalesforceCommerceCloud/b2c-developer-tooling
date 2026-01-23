/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  BREAKPOINT_LINE,
  EVAL_CARTRIDGE_NAME,
  BREAKPOINT_CONTROLLER_CONTENT,
  cartridgeExists,
  controllerExists,
  injectController,
  createCartridgeWithController,
} from '@salesforce/b2c-tooling-sdk/operations/script';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const CODE_VERSION = 'v1';

describe('operations/script/controller', () => {
  // Track requests for assertions
  const requests: {method: string; url: string; headers: Headers; body?: string}[] = [];

  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
    requests.length = 0;
  });

  after(() => {
    server.close();
  });

  function createInstance(): B2CInstance {
    return new B2CInstance(
      {hostname: TEST_HOST, codeVersion: CODE_VERSION},
      {
        basic: {username: 'test', password: 'test'},
        oauth: {clientId: 'test-client'},
      },
    );
  }

  describe('constants', () => {
    it('BREAKPOINT_LINE should be 8', () => {
      expect(BREAKPOINT_LINE).to.equal(8);
    });

    it('EVAL_CARTRIDGE_NAME should be b2c_cli_eval', () => {
      expect(EVAL_CARTRIDGE_NAME).to.equal('b2c_cli_eval');
    });

    it('BREAKPOINT_CONTROLLER_CONTENT should contain exports.Start', () => {
      expect(BREAKPOINT_CONTROLLER_CONTENT).to.include('exports.Start');
      expect(BREAKPOINT_CONTROLLER_CONTENT).to.include('exports.Start.public = true');
    });

    it('BREAKPOINT_CONTROLLER_CONTENT should have breakpoint marker on correct line', () => {
      const lines = BREAKPOINT_CONTROLLER_CONTENT.split('\n');
      // Line 9 (0-indexed is 8) should contain the breakpoint marker
      expect(lines[BREAKPOINT_LINE - 1]).to.include('BREAKPOINT_LINE');
    });
  });

  describe('cartridgeExists', () => {
    it('returns true when cartridge exists', async () => {
      const instance = createInstance();
      const cartridgePath = `Cartridges/${CODE_VERSION}/app_storefront_base`;

      server.use(
        http.head(`${WEBDAV_BASE}/${cartridgePath}`, () => {
          return new HttpResponse(null, {status: 200});
        }),
      );

      const exists = await cartridgeExists(instance, CODE_VERSION, 'app_storefront_base');
      expect(exists).to.be.true;
    });

    it('returns false when cartridge does not exist', async () => {
      const instance = createInstance();
      const cartridgePath = `Cartridges/${CODE_VERSION}/nonexistent`;

      server.use(
        http.head(`${WEBDAV_BASE}/${cartridgePath}`, () => {
          return new HttpResponse(null, {status: 404});
        }),
      );

      const exists = await cartridgeExists(instance, CODE_VERSION, 'nonexistent');
      expect(exists).to.be.false;
    });
  });

  describe('controllerExists', () => {
    it('returns true when controller exists', async () => {
      const instance = createInstance();
      const controllerPath = `Cartridges/${CODE_VERSION}/app_storefront_base/cartridge/controllers/Default.js`;

      server.use(
        http.head(`${WEBDAV_BASE}/${controllerPath}`, () => {
          return new HttpResponse(null, {status: 200});
        }),
      );

      const exists = await controllerExists(instance, CODE_VERSION, 'app_storefront_base', 'Default');
      expect(exists).to.be.true;
    });

    it('returns false when controller does not exist', async () => {
      const instance = createInstance();
      const controllerPath = `Cartridges/${CODE_VERSION}/app_storefront_base/cartridge/controllers/Default.js`;

      server.use(
        http.head(`${WEBDAV_BASE}/${controllerPath}`, () => {
          return new HttpResponse(null, {status: 404});
        }),
      );

      const exists = await controllerExists(instance, CODE_VERSION, 'app_storefront_base', 'Default');
      expect(exists).to.be.false;
    });
  });

  describe('injectController', () => {
    it('injects controller without existing backup', async () => {
      const instance = createInstance();
      const cartridge = 'app_storefront_base';
      const controllerPath = `Cartridges/${CODE_VERSION}/${cartridge}/cartridge/controllers/Default.js`;

      server.use(
        // HEAD check for existing controller returns 404
        http.head(`${WEBDAV_BASE}/${controllerPath}`, () => {
          return new HttpResponse(null, {status: 404});
        }),
        // PUT to inject controller
        http.put(`${WEBDAV_BASE}/${controllerPath}`, async ({request}) => {
          const body = await request.text();
          requests.push({method: request.method, url: request.url, headers: request.headers, body});
          return new HttpResponse(null, {status: 201});
        }),
      );

      const result = await injectController(instance, CODE_VERSION, cartridge);

      expect(result.cartridge).to.equal(cartridge);
      expect(result.scriptPath).to.equal('/app_storefront_base/cartridge/controllers/Default.js');
      expect(result.backup).to.be.undefined;
      expect(result.createdCartridge).to.be.false;
      expect(requests).to.have.length(1);
      expect(requests[0].body).to.equal(BREAKPOINT_CONTROLLER_CONTENT);
    });

    it('backs up existing controller before injection', async () => {
      const instance = createInstance();
      const cartridge = 'app_storefront_base';
      const controllerPath = `Cartridges/${CODE_VERSION}/${cartridge}/cartridge/controllers/Default.js`;
      const originalContent = "'use strict'; exports.Start = function() { /* original */ };";

      server.use(
        // HEAD check for existing controller returns 200
        http.head(`${WEBDAV_BASE}/${controllerPath}`, () => {
          return new HttpResponse(null, {status: 200});
        }),
        // GET to backup existing controller
        http.get(`${WEBDAV_BASE}/${controllerPath}`, () => {
          return new HttpResponse(originalContent, {status: 200});
        }),
        // PUT to inject controller
        http.put(`${WEBDAV_BASE}/${controllerPath}`, async ({request}) => {
          const body = await request.text();
          requests.push({method: request.method, url: request.url, headers: request.headers, body});
          return new HttpResponse(null, {status: 200});
        }),
      );

      const result = await injectController(instance, CODE_VERSION, cartridge);

      expect(result.backup).to.not.be.undefined;
      expect(result.backup?.existed).to.be.true;
      expect(result.backup?.path).to.equal(controllerPath);
    });
  });

  describe('createCartridgeWithController', () => {
    it('creates cartridge structure and injects controller', async () => {
      const instance = createInstance();
      const cartridge = EVAL_CARTRIDGE_NAME;
      const basePath = `Cartridges/${CODE_VERSION}`;

      server.use(
        // MKCOL for directory creation (multiple calls)
        http.all(`${WEBDAV_BASE}/${basePath}`, ({request}) => {
          if (request.method === 'MKCOL') {
            return new HttpResponse(null, {status: 201});
          }
          return new HttpResponse(null, {status: 405});
        }),
        http.all(`${WEBDAV_BASE}/${basePath}/${cartridge}`, ({request}) => {
          if (request.method === 'MKCOL') {
            return new HttpResponse(null, {status: 201});
          }
          return new HttpResponse(null, {status: 405});
        }),
        http.all(`${WEBDAV_BASE}/${basePath}/${cartridge}/cartridge`, ({request}) => {
          if (request.method === 'MKCOL') {
            return new HttpResponse(null, {status: 201});
          }
          return new HttpResponse(null, {status: 405});
        }),
        http.all(`${WEBDAV_BASE}/${basePath}/${cartridge}/cartridge/controllers`, ({request}) => {
          if (request.method === 'MKCOL') {
            return new HttpResponse(null, {status: 201});
          }
          return new HttpResponse(null, {status: 405});
        }),
        // HEAD check for existing controller returns 404
        http.head(`${WEBDAV_BASE}/${basePath}/${cartridge}/cartridge/controllers/Default.js`, () => {
          return new HttpResponse(null, {status: 404});
        }),
        // PUT to inject controller
        http.put(`${WEBDAV_BASE}/${basePath}/${cartridge}/cartridge/controllers/Default.js`, async ({request}) => {
          const body = await request.text();
          requests.push({method: request.method, url: request.url, headers: request.headers, body});
          return new HttpResponse(null, {status: 201});
        }),
      );

      const result = await createCartridgeWithController(instance, CODE_VERSION);

      expect(result.cartridge).to.equal(cartridge);
      expect(result.createdCartridge).to.be.true;
      expect(result.scriptPath).to.equal('/b2c_cli_eval/cartridge/controllers/Default.js');
    });
  });
});
