/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {SdapiClient, SdapiError} from '@salesforce/b2c-tooling-sdk/operations/debug';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/s/-/dw/debugger/v2_0`;

const server = setupServer();

describe('operations/debug/sdapi-client', () => {
  let client: SdapiClient;

  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  beforeEach(() => {
    client = new SdapiClient({
      hostname: TEST_HOST,
      username: 'admin',
      password: 'password123',
      clientId: 'test-client',
    });
  });

  describe('client lifecycle', () => {
    it('creates a debugger client', async () => {
      server.use(
        http.post(`${BASE_URL}/client`, ({request}) => {
          expect(request.headers.get('x-dw-client-id')).to.equal('test-client');
          expect(request.headers.get('Authorization')).to.match(/^Basic /);
          return new HttpResponse(null, {status: 204});
        }),
      );

      await client.createClient();
    });

    it('deletes a debugger client', async () => {
      server.use(http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})));

      await client.deleteClient();
    });
  });

  describe('breakpoints', () => {
    it('sets breakpoints', async () => {
      server.use(
        http.post(`${BASE_URL}/breakpoints`, async ({request}) => {
          const body = (await request.json()) as {breakpoints: unknown[]};
          expect(body.breakpoints).to.have.length(2);
          return HttpResponse.json({
            _v: '2.0',
            breakpoints: [
              {id: 1, line_number: 10, script_path: '/cart/controllers/Cart.js'},
              {id: 2, line_number: 20, script_path: '/cart/controllers/Cart.js'},
            ],
          });
        }),
      );

      const result = await client.setBreakpoints([
        {line_number: 10, script_path: '/cart/controllers/Cart.js'},
        {line_number: 20, script_path: '/cart/controllers/Cart.js'},
      ]);

      expect(result).to.have.length(2);
      expect(result[0].id).to.equal(1);
    });

    it('gets breakpoints', async () => {
      server.use(
        http.get(`${BASE_URL}/breakpoints`, () =>
          HttpResponse.json({
            _v: '2.0',
            breakpoints: [{id: 1, line_number: 10, script_path: '/cart/controllers/Cart.js'}],
          }),
        ),
      );

      const result = await client.getBreakpoints();
      expect(result).to.have.length(1);
      expect(result[0].script_path).to.equal('/cart/controllers/Cart.js');
    });

    it('deletes all breakpoints', async () => {
      server.use(http.delete(`${BASE_URL}/breakpoints`, () => new HttpResponse(null, {status: 204})));

      await client.deleteBreakpoints();
    });

    it('deletes a specific breakpoint', async () => {
      server.use(http.delete(`${BASE_URL}/breakpoints/5`, () => new HttpResponse(null, {status: 204})));

      await client.deleteBreakpoint(5);
    });
  });

  describe('threads', () => {
    it('gets all threads', async () => {
      server.use(
        http.get(`${BASE_URL}/threads`, () =>
          HttpResponse.json({
            _v: '2.0',
            script_threads: [
              {
                id: 1,
                status: 'halted',
                call_stack: [
                  {index: 0, location: {function_name: 'main', line_number: 10, script_path: '/cart/Cart.js'}},
                ],
              },
              {id: 2, status: 'running', call_stack: []},
            ],
          }),
        ),
      );

      const threads = await client.getThreads();
      expect(threads).to.have.length(2);
      expect(threads[0].status).to.equal('halted');
      expect(threads[1].status).to.equal('running');
    });

    it('gets a specific thread', async () => {
      server.use(
        http.get(`${BASE_URL}/threads/3`, () =>
          HttpResponse.json({
            _v: '2.0',
            id: 3,
            status: 'halted',
            call_stack: [{index: 0, location: {function_name: 'doGet', line_number: 25, script_path: '/cart/Cart.js'}}],
          }),
        ),
      );

      const thread = await client.getThread(3);
      expect(thread.id).to.equal(3);
      expect(thread.call_stack).to.have.length(1);
    });

    it('resets thread timeouts', async () => {
      server.use(http.post(`${BASE_URL}/threads/reset`, () => new HttpResponse(null, {status: 204})));

      await client.resetThreads();
    });
  });

  describe('execution control', () => {
    const threadResponse = {
      _v: '2.0',
      id: 1,
      status: 'halted' as const,
      call_stack: [{index: 0, location: {function_name: 'main', line_number: 11, script_path: '/cart/Cart.js'}}],
    };

    it('resumes a thread', async () => {
      server.use(http.post(`${BASE_URL}/threads/1/resume`, () => HttpResponse.json(threadResponse)));
      const result = await client.resume(1);
      expect(result.id).to.equal(1);
    });

    it('steps over', async () => {
      server.use(http.post(`${BASE_URL}/threads/1/over`, () => HttpResponse.json(threadResponse)));
      const result = await client.stepOver(1);
      expect(result.id).to.equal(1);
    });

    it('steps into', async () => {
      server.use(http.post(`${BASE_URL}/threads/1/into`, () => HttpResponse.json(threadResponse)));
      const result = await client.stepInto(1);
      expect(result.id).to.equal(1);
    });

    it('steps out', async () => {
      server.use(http.post(`${BASE_URL}/threads/1/out`, () => HttpResponse.json(threadResponse)));
      const result = await client.stepOut(1);
      expect(result.id).to.equal(1);
    });
  });

  describe('variables and evaluation', () => {
    it('gets variables for a frame', async () => {
      server.use(
        http.get(`${BASE_URL}/threads/1/frames/0/variables`, () =>
          HttpResponse.json({
            _v: '2.0',
            count: 2,
            start: 0,
            total: 2,
            object_members: [
              {name: 'basket', parent: '', type: 'dw.order.Basket', value: '[Basket uuid=abc]', scope: 'local'},
              {name: 'request', parent: '', type: 'dw.system.Request', value: '[Request]', scope: 'global'},
            ],
          }),
        ),
      );

      const result = await client.getVariables(1, 0);
      expect(result.object_members).to.have.length(2);
      expect(result.object_members[0].scope).to.equal('local');
    });

    it('gets object members with path', async () => {
      server.use(
        http.get(`${BASE_URL}/threads/1/frames/0/members`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('object_path')).to.equal('basket.items');
          return HttpResponse.json({
            _v: '2.0',
            count: 1,
            start: 0,
            total: 1,
            object_members: [{name: 'length', parent: 'items', type: 'number', value: '3'}],
          });
        }),
      );

      const result = await client.getMembers(1, 0, 'basket.items');
      expect(result.object_members).to.have.length(1);
    });

    it('evaluates an expression', async () => {
      server.use(
        http.get(`${BASE_URL}/threads/1/frames/0/eval`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('expr')).to.equal('basket.getProductLineItems().size()');
          return HttpResponse.json({
            _v: '2.0',
            expression: 'basket.getProductLineItems().size()',
            result: '3',
          });
        }),
      );

      const result = await client.evaluate(1, 0, 'basket.getProductLineItems().size()');
      expect(result.result).to.equal('3');
    });
  });

  describe('error handling', () => {
    it('throws SdapiError on debugger disabled (412)', async () => {
      server.use(
        http.get(`${BASE_URL}/threads`, () =>
          HttpResponse.json(
            {_v: '2.0', type: 'DebuggerDisabledException', message: 'Debugger is not enabled'},
            {status: 412},
          ),
        ),
      );

      try {
        await client.getThreads();
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(SdapiError);
        expect((error as SdapiError).status).to.equal(412);
        expect((error as SdapiError).fault.type).to.equal('DebuggerDisabledException');
      }
    });

    it('throws SdapiError on thread not found (404)', async () => {
      server.use(
        http.get(`${BASE_URL}/threads/999`, () =>
          HttpResponse.json(
            {_v: '2.0', type: 'ScriptThreadNotFoundException', message: 'Thread 999 not found'},
            {status: 404},
          ),
        ),
      );

      try {
        await client.getThread(999);
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(SdapiError);
        expect((error as SdapiError).status).to.equal(404);
      }
    });

    it('handles non-JSON error responses', async () => {
      server.use(http.post(`${BASE_URL}/client`, () => new HttpResponse('Internal Server Error', {status: 500})));

      try {
        await client.createClient();
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(SdapiError);
        expect((error as SdapiError).status).to.equal(500);
      }
    });
  });
});
