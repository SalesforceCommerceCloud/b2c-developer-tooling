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

  describe('breakpoint tracking', () => {
    it('adds breakpoints to the current set, replacing the same script and line', async () => {
      const sent: unknown[] = [];
      server.use(
        http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.delete(`${BASE_URL}/breakpoints`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/breakpoints`, async ({request}) => {
          const body = (await request.json()) as {breakpoints: Array<{line_number: number; script_path: string}>};
          sent.push(body.breakpoints);
          return HttpResponse.json({
            _v: '2.0',
            breakpoints: body.breakpoints.map((bp, index) => ({id: index + 1, ...bp})),
          });
        }),
      );
      const session = new DebugSessionManager(makeConfig());
      await session.connect();
      await session.setBreakpoints([{line_number: 10, script_path: '/a.js'}]);
      const result = await session.addBreakpoints([
        {line_number: 20, script_path: '/b.js'},
        {line_number: 10, script_path: '/a.js', condition: 'x > 1'},
      ]);
      expect(result.map((bp) => `${bp.script_path}:${bp.line_number}`)).to.deep.equal(['/b.js:20', '/a.js:10']);
      expect(session.getBreakpoints()).to.deep.equal(result);
      expect(sent).to.have.length(2);

      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));
      await session.disconnect();
      expect(session.getBreakpoints()).to.deep.equal([]);
    });
  });

  describe('waitForHalt', () => {
    const halted = {id: 7, status: 'halted', call_stack: []};

    function connectWithThreads(threads: () => unknown[]) {
      server.use(
        http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
        http.get(`${BASE_URL}/threads`, () => HttpResponse.json({_v: '2.0', script_threads: threads()})),
      );
      return new DebugSessionManager(makeConfig({pollInterval: 10}));
    }

    it('resolves with the next halted thread and times out with null', async () => {
      let threads: unknown[] = [];
      const session = connectWithThreads(() => threads);
      await session.connect();
      expect(await session.waitForHalt(30)).to.equal(null);
      setTimeout(() => {
        threads = [halted];
      }, 20);
      expect((await session.waitForHalt(5000))?.id).to.equal(7);
      // Already halted: resolves at once.
      expect((await session.waitForHalt(1))?.id).to.equal(7);
      await session.disconnect();
    });

    it('rejects pending waits when the session disconnects or the signal aborts', async () => {
      const session = connectWithThreads(() => []);
      await session.connect();
      const ended = session.waitForHalt(5000);
      await session.disconnect();
      let error: unknown;
      try {
        await ended;
      } catch (caught) {
        error = caught;
      }
      expect((error as Error).message).to.equal('Debug session ended');

      await session.connect();
      const controller = new AbortController();
      const aborted = session.waitForHalt(5000, controller.signal);
      controller.abort(new Error('cancelled'));
      error = undefined;
      try {
        await aborted;
      } catch (caught) {
        error = caught;
      }
      expect((error as Error).message).to.equal('cancelled');
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
