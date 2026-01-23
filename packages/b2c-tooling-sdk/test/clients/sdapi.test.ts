/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {SdapiClient} from '@salesforce/b2c-tooling-sdk/clients';
import {HTTPError} from '@salesforce/b2c-tooling-sdk/errors';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/s/-/dw/debugger/v2_0`;

describe('clients/sdapi', () => {
  describe('SdapiClient', () => {
    let client: SdapiClient;
    let mockAuth: MockAuthStrategy;

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

    beforeEach(() => {
      mockAuth = new MockAuthStrategy();
      client = new SdapiClient(TEST_HOST, mockAuth);
    });

    describe('buildUrl', () => {
      it('builds correct URL for path without leading slash', () => {
        const url = client.buildUrl('client');
        expect(url).to.equal(`${BASE_URL}/client`);
      });

      it('builds correct URL for path with leading slash', () => {
        const url = client.buildUrl('/client');
        expect(url).to.equal(`${BASE_URL}/client`);
      });
    });

    describe('enableDebugger', () => {
      it('enables debugger successfully', async () => {
        server.use(
          http.post(`${BASE_URL}/client`, async ({request}) => {
            requests.push({method: request.method, url: request.url, headers: request.headers});
            return new HttpResponse(null, {status: 204});
          }),
        );

        await client.enableDebugger();

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('POST');
        expect(requests[0].url).to.equal(`${BASE_URL}/client`);
      });

      it('accepts 409 Conflict (already enabled)', async () => {
        server.use(
          http.post(`${BASE_URL}/client`, () => {
            return new HttpResponse(null, {status: 409});
          }),
        );

        // Should not throw
        await client.enableDebugger();
      });

      it('throws HTTPError on failure', async () => {
        server.use(
          http.post(`${BASE_URL}/client`, () => {
            return new HttpResponse(null, {status: 500, statusText: 'Internal Server Error'});
          }),
        );

        try {
          await client.enableDebugger();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
          expect((error as HTTPError).response.status).to.equal(500);
        }
      });
    });

    describe('disableDebugger', () => {
      it('disables debugger successfully', async () => {
        server.use(
          http.delete(`${BASE_URL}/client`, async ({request}) => {
            requests.push({method: request.method, url: request.url, headers: request.headers});
            return new HttpResponse(null, {status: 204});
          }),
        );

        await client.disableDebugger();

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('DELETE');
      });

      it('accepts 404 Not Found (already disabled)', async () => {
        server.use(
          http.delete(`${BASE_URL}/client`, () => {
            return new HttpResponse(null, {status: 404});
          }),
        );

        // Should not throw
        await client.disableDebugger();
      });
    });

    describe('setBreakpoints', () => {
      it('sets breakpoints successfully', async () => {
        const breakpoints = [
          {line_number: 10, script_path: 'controllers/Default.js'},
          {line_number: 20, script_path: 'scripts/helpers.js'},
        ];

        server.use(
          http.post(`${BASE_URL}/breakpoints`, async ({request}) => {
            const body = await request.text();
            requests.push({method: request.method, url: request.url, headers: request.headers, body});
            return HttpResponse.json({
              breakpoints: breakpoints.map((bp, i) => ({...bp, id: i + 1})),
            });
          }),
        );

        const result = await client.setBreakpoints(breakpoints);

        expect(requests).to.have.length(1);
        expect(JSON.parse(requests[0].body!)).to.deep.equal({breakpoints});
        expect(result).to.have.length(2);
        expect(result[0].id).to.equal(1);
        expect(result[1].id).to.equal(2);
      });

      it('returns empty array when no breakpoints in response', async () => {
        server.use(
          http.post(`${BASE_URL}/breakpoints`, () => {
            return HttpResponse.json({});
          }),
        );

        const result = await client.setBreakpoints([]);
        expect(result).to.deep.equal([]);
      });
    });

    describe('deleteBreakpoints', () => {
      it('deletes breakpoints successfully', async () => {
        server.use(
          http.delete(`${BASE_URL}/breakpoints`, async ({request}) => {
            requests.push({method: request.method, url: request.url, headers: request.headers});
            return new HttpResponse(null, {status: 204});
          }),
        );

        await client.deleteBreakpoints();

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('DELETE');
      });

      it('accepts 404 Not Found (no breakpoints)', async () => {
        server.use(
          http.delete(`${BASE_URL}/breakpoints`, () => {
            return new HttpResponse(null, {status: 404});
          }),
        );

        // Should not throw
        await client.deleteBreakpoints();
      });
    });

    describe('getThreads', () => {
      it('gets threads successfully', async () => {
        const threads = [
          {id: 1, status: 'halted'},
          {id: 2, status: 'running'},
        ];

        server.use(
          http.get(`${BASE_URL}/threads`, () => {
            return HttpResponse.json({script_threads: threads});
          }),
        );

        const result = await client.getThreads();

        expect(result).to.have.length(2);
        expect(result[0].id).to.equal(1);
        expect(result[0].status).to.equal('halted');
      });

      it('returns empty array when no threads', async () => {
        server.use(
          http.get(`${BASE_URL}/threads`, () => {
            return HttpResponse.json({});
          }),
        );

        const result = await client.getThreads();
        expect(result).to.deep.equal([]);
      });
    });

    describe('evaluate', () => {
      it('evaluates expression successfully', async () => {
        server.use(
          http.get(`${BASE_URL}/threads/1/frames/0/eval`, async ({request}) => {
            requests.push({method: request.method, url: request.url, headers: request.headers});
            const url = new URL(request.url);
            expect(url.searchParams.get('expr')).to.equal('1+1');
            return HttpResponse.json({result: '"2"'});
          }),
        );

        const result = await client.evaluate(1, 0, '1+1');

        expect(result.result).to.equal('"2"');
        expect(result.error).to.be.undefined;
      });

      it('returns error when evaluation fails', async () => {
        server.use(
          http.get(`${BASE_URL}/threads/1/frames/0/eval`, () => {
            return HttpResponse.json({error_message: 'ReferenceError: x is not defined'});
          }),
        );

        const result = await client.evaluate(1, 0, 'x');

        expect(result.result).to.be.undefined;
        expect(result.error).to.equal('ReferenceError: x is not defined');
      });

      it('URL encodes expression', async () => {
        server.use(
          http.get(`${BASE_URL}/threads/1/frames/0/eval`, async ({request}) => {
            const url = new URL(request.url);
            // The expression should be URL encoded
            expect(url.searchParams.get('expr')).to.equal('dw.system.Site.getCurrent()');
            return HttpResponse.json({result: '"site"'});
          }),
        );

        await client.evaluate(1, 0, 'dw.system.Site.getCurrent()');
      });
    });

    describe('resumeThread', () => {
      it('resumes thread successfully', async () => {
        server.use(
          http.post(`${BASE_URL}/threads/1/resume`, async ({request}) => {
            requests.push({method: request.method, url: request.url, headers: request.headers});
            return new HttpResponse(null, {status: 200});
          }),
        );

        await client.resumeThread(1);

        expect(requests).to.have.length(1);
        expect(requests[0].url).to.equal(`${BASE_URL}/threads/1/resume`);
      });

      it('throws HTTPError on failure', async () => {
        server.use(
          http.post(`${BASE_URL}/threads/1/resume`, () => {
            return new HttpResponse(null, {status: 404, statusText: 'Thread not found'});
          }),
        );

        try {
          await client.resumeThread(1);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
        }
      });
    });

    describe('resetThreadTimeouts', () => {
      it('resets thread timeouts successfully', async () => {
        server.use(
          http.post(`${BASE_URL}/threads/reset`, () => {
            return new HttpResponse(null, {status: 200});
          }),
        );

        await client.resetThreadTimeouts();
      });
    });

    describe('stepInto', () => {
      it('steps into successfully', async () => {
        server.use(
          http.post(`${BASE_URL}/threads/1/into`, () => {
            return new HttpResponse(null, {status: 200});
          }),
        );

        await client.stepInto(1);
      });
    });

    describe('stepOver', () => {
      it('steps over successfully', async () => {
        server.use(
          http.post(`${BASE_URL}/threads/1/over`, () => {
            return new HttpResponse(null, {status: 200});
          }),
        );

        await client.stepOver(1);
      });
    });

    describe('stepOut', () => {
      it('steps out successfully', async () => {
        server.use(
          http.post(`${BASE_URL}/threads/1/out`, () => {
            return new HttpResponse(null, {status: 200});
          }),
        );

        await client.stepOut(1);
      });
    });
  });
});
