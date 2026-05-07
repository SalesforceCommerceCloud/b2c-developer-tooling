/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DebugSessionManager, type DebugSessionConfig} from '@salesforce/b2c-tooling-sdk/operations/debug';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/s/-/dw/debugger/v2_0`;

const server = setupServer();

function makeConfig(overrides?: Partial<DebugSessionConfig>): DebugSessionConfig {
  return {
    hostname: TEST_HOST,
    username: 'admin',
    password: 'password',
    cartridgeRoots: [],
    // Use very long intervals so timers don't fire during tests
    pollInterval: 100_000,
    keepaliveInterval: 100_000,
    ...overrides,
  };
}

describe('operations/debug/debug-session', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => {
    server.resetHandlers();
    sinon.restore();
  });
  after(() => server.close());

  describe('connect', () => {
    it('deletes existing client, creates new client, and starts timers', async () => {
      const calls: string[] = [];

      server.use(
        http.delete(`${BASE_URL}/client`, () => {
          calls.push('delete-client');
          return new HttpResponse(null, {status: 204});
        }),
        http.post(`${BASE_URL}/client`, () => {
          calls.push('create-client');
          return new HttpResponse(null, {status: 204});
        }),
      );

      const session = new DebugSessionManager(makeConfig());
      await session.connect();

      expect(calls).to.deep.equal(['delete-client', 'create-client']);

      // Cleanup
      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));
      await session.disconnect();
    });

    it('ignores error when deleting non-existent client', async () => {
      server.use(
        http.delete(`${BASE_URL}/client`, () =>
          HttpResponse.json({_v: '2.0', type: 'ClientNotFound', message: 'No client'}, {status: 404}),
        ),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
      );

      const session = new DebugSessionManager(makeConfig());
      await session.connect();

      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));
      await session.disconnect();
    });
  });

  describe('disconnect', () => {
    it('deletes the client and clears known threads', async () => {
      server.use(
        http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
      );

      const session = new DebugSessionManager(makeConfig());
      await session.connect();
      await session.disconnect();

      expect(session.getKnownThreads()).to.have.length(0);
    });
  });

  describe('setBreakpoints', () => {
    it('deletes all breakpoints then sets new ones', async () => {
      const calls: string[] = [];

      server.use(
        http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.delete(`${BASE_URL}/breakpoints`, () => {
          calls.push('delete-bp');
          return new HttpResponse(null, {status: 204});
        }),
        http.post(`${BASE_URL}/breakpoints`, () => {
          calls.push('set-bp');
          return HttpResponse.json({
            _v: '2.0',
            breakpoints: [{id: 1, line_number: 10, script_path: '/cart/Cart.js'}],
          });
        }),
      );

      const session = new DebugSessionManager(makeConfig());
      await session.connect();

      const result = await session.setBreakpoints([{line_number: 10, script_path: '/cart/Cart.js'}]);

      expect(calls).to.deep.equal(['delete-bp', 'set-bp']);
      expect(result).to.have.length(1);

      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));
      await session.disconnect();
    });

    it('returns empty array for empty breakpoints', async () => {
      server.use(
        http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.delete(`${BASE_URL}/breakpoints`, () => new HttpResponse(null, {status: 204})),
      );

      const session = new DebugSessionManager(makeConfig());
      await session.connect();

      const result = await session.setBreakpoints([]);
      expect(result).to.have.length(0);

      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));
      await session.disconnect();
    });
  });

  describe('execution control', () => {
    it('forwards resume to SDAPI client', async () => {
      server.use(
        http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/threads/1/resume`, () =>
          HttpResponse.json({_v: '2.0', id: 1, status: 'running', call_stack: []}),
        ),
      );

      const session = new DebugSessionManager(makeConfig());
      await session.connect();
      await session.resume(1);

      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));
      await session.disconnect();
    });
  });
});
