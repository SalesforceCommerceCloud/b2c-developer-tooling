/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import sinon from 'sinon';
import {
  createAuthMiddleware,
  createExtraParamsMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
} from '@salesforce/b2c-tooling-sdk/clients';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {configureLogger, getLogger, resetLogger} from '@salesforce/b2c-tooling-sdk/logging';

describe('clients/middleware', () => {
  describe('createAuthMiddleware', () => {
    it('adds Authorization header when auth strategy provides getAuthorizationHeader', async () => {
      const auth: AuthStrategy = {
        async fetch() {
          throw new Error('not used in this unit test');
        },
        async getAuthorizationHeader() {
          return 'Bearer test-token';
        },
      };

      const middleware = createAuthMiddleware(auth);
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/ping', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('Authorization')).to.equal('Bearer test-token');
    });

    it('does not set Authorization header when auth strategy does not provide getAuthorizationHeader', async () => {
      const auth: AuthStrategy = {
        async fetch() {
          throw new Error('not used in this unit test');
        },
      };

      const middleware = createAuthMiddleware(auth);
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/ping', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('Authorization')).to.equal(null);
    });
  });

  describe('createExtraParamsMiddleware', () => {
    it('adds extra query params without overriding explicit query params', async () => {
      const middleware = createExtraParamsMiddleware({query: {debug: true}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items?a=1', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      const url = new URL(modifiedRequest.url);
      expect(url.searchParams.get('a')).to.equal('1');
      expect(url.searchParams.get('debug')).to.equal('true');
    });

    it('merges extra body fields into JSON requests', async () => {
      const middleware = createExtraParamsMiddleware({body: {forced: true}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({name: 'x'}),
        duplex: 'half',
      } as RequestInit);

      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);
      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }
      const body = JSON.parse(await modifiedRequest.text()) as Record<string, unknown>;

      expect(body).to.deep.include({name: 'x'});
      expect(body).to.deep.include({forced: true});
    });

    it('creates a new JSON body when request has no body', async () => {
      const middleware = createExtraParamsMiddleware({body: {forced: true}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {
        method: 'POST',
        headers: {},
      });

      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);
      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }
      expect(modifiedRequest.headers.get('content-type')).to.include('application/json');

      const body = JSON.parse(await modifiedRequest.text()) as Record<string, unknown>;
      expect(body).to.deep.equal({forced: true});
    });

    it('does not throw if body is invalid JSON (skips merge)', async () => {
      // Stub logger.warn to avoid noise in test output for expected warning
      const warnStub = sinon.stub(getLogger(), 'warn');

      const middleware = createExtraParamsMiddleware({body: {forced: true}});

      const request = new Request('https://example.com/items', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: 'not-json',
        duplex: 'half',
      } as RequestInit);

      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);
      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }
      const text = await modifiedRequest.text();

      expect(text).to.equal('not-json');
      expect(text).to.not.include('forced');
      expect(warnStub.calledOnce).to.be.true;

      warnStub.restore();
    });

    it('does not merge extra body when request is not JSON', async () => {
      const middleware = createExtraParamsMiddleware({body: {forced: true}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {
        method: 'POST',
        headers: {'content-type': 'text/plain'},
        body: 'hello',
        duplex: 'half',
      } as RequestInit);

      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);
      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }
      const text = await modifiedRequest.text();

      expect(text).to.equal('hello');
      expect(text).to.not.include('forced');
    });

    it('skips adding query params when value is undefined', async () => {
      const middleware = createExtraParamsMiddleware({query: {debug: undefined}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items?a=1', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      const url = new URL(modifiedRequest.url);
      expect(url.searchParams.has('debug')).to.equal(false);
      expect(url.searchParams.get('a')).to.equal('1');
    });

    it('does nothing when config is empty', async () => {
      const middleware = createExtraParamsMiddleware({});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items?a=1', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.url).to.equal(request.url);
    });

    it('does nothing when query config is an empty object', async () => {
      const middleware = createExtraParamsMiddleware({query: {}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items?a=1', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.url).to.equal(request.url);
    });

    it('adds empty-string query values', async () => {
      const middleware = createExtraParamsMiddleware({query: {debug: ''}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      const url = new URL(modifiedRequest.url);
      expect(url.searchParams.has('debug')).to.equal(true);
      expect(url.searchParams.get('debug')).to.equal('');
    });

    it('overwrites existing query params when the same key is provided', async () => {
      const middleware = createExtraParamsMiddleware({query: {debug: true}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items?debug=false', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      const url = new URL(modifiedRequest.url);
      expect(url.searchParams.get('debug')).to.equal('true');
    });

    it('overwrites body fields when extra body contains same key', async () => {
      const middleware = createExtraParamsMiddleware({body: {forced: true}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({forced: false}),
        duplex: 'half',
      } as RequestInit);

      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      const body = JSON.parse(await modifiedRequest.text()) as Record<string, unknown>;
      expect(body.forced).to.equal(true);
    });

    it('adds extra headers to request', async () => {
      const middleware = createExtraParamsMiddleware({headers: {'X-Custom': 'value'}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('X-Custom')).to.equal('value');
    });

    it('overwrites existing headers with extra headers', async () => {
      const middleware = createExtraParamsMiddleware({headers: {'X-Custom': 'new-value'}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {
        method: 'GET',
        headers: {'X-Custom': 'old-value'},
      });
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('X-Custom')).to.equal('new-value');
    });

    it('preserves other headers when adding extra headers', async () => {
      const middleware = createExtraParamsMiddleware({headers: {'X-Custom': 'value'}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('X-Custom')).to.equal('value');
      expect(modifiedRequest.headers.get('Content-Type')).to.equal('application/json');
    });

    it('does nothing when headers config is empty', async () => {
      const middleware = createExtraParamsMiddleware({headers: {}});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.url).to.equal(request.url);
    });

    it('adds multiple extra headers', async () => {
      const middleware = createExtraParamsMiddleware({
        headers: {
          'CF-Access-Client-Id': 'client-id',
          'CF-Access-Client-Secret': 'client-secret',
        },
      });
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/items', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('CF-Access-Client-Id')).to.equal('client-id');
      expect(modifiedRequest.headers.get('CF-Access-Client-Secret')).to.equal('client-secret');
    });
  });

  describe('createLoggingMiddleware', () => {
    it('logs request and response metadata and masks configured body keys', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-logger-'));
      const logFile = path.join(tmpDir, 'log.jsonl');

      try {
        configureLogger({level: 'trace', json: true, redact: false, fd: fs.openSync(logFile, 'w')});

        const middleware = createLoggingMiddleware({prefix: 'TEST', maskBodyKeys: ['data']});
        type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];
        type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

        const request = new Request('https://example.com/items?x=1', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({data: 'SECRET', other: 1}),
          duplex: 'half',
        } as RequestInit);

        const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);
        if (!modifiedRequest) {
          throw new Error('Expected middleware to return a Request');
        }

        const response = new Response(JSON.stringify({data: 'SECRET2', ok: true}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });

        await middleware.onResponse!({request: modifiedRequest, response} as unknown as OnResponseParams);

        const lines = fs
          .readFileSync(logFile, 'utf-8')
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((l) => JSON.parse(l) as {msg?: string; body?: unknown});

        // We log debug + trace for request and response.
        // Validate that at least one line contains masked request body and masked response body.
        const requestBodyLog = lines.find(
          (l) => String(l.msg).includes('[TEST REQ]') && String(l.msg).includes('body'),
        );
        const responseBodyLog = lines.find(
          (l) => String(l.msg).includes('[TEST RESP]') && String(l.msg).includes('body'),
        );

        expect(requestBodyLog).to.not.equal(undefined);
        expect(responseBodyLog).to.not.equal(undefined);

        expect(requestBodyLog!.body).to.deep.include({data: '...', other: 1});
        expect(responseBodyLog!.body).to.deep.include({data: '...', ok: true});
      } finally {
        resetLogger();
        fs.rmSync(tmpDir, {recursive: true, force: true});
      }
    });

    it('logs non-JSON bodies as text', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-logger-'));
      const logFile = path.join(tmpDir, 'log.jsonl');

      try {
        configureLogger({level: 'trace', json: true, redact: false, fd: fs.openSync(logFile, 'w')});

        const middleware = createLoggingMiddleware('TEST');
        type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

        const request = new Request('https://example.com/items', {
          method: 'POST',
          headers: {'content-type': 'text/plain'},
          body: 'hello',
          duplex: 'half',
        } as RequestInit);

        const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);
        if (!modifiedRequest) {
          throw new Error('Expected middleware to return a Request');
        }

        const lines = fs
          .readFileSync(logFile, 'utf-8')
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((l) => JSON.parse(l) as {msg?: string; body?: unknown});

        const requestBodyLog = lines.find(
          (l) => String(l.msg).includes('[TEST REQ]') && String(l.msg).includes('body'),
        );
        expect(requestBodyLog).to.not.equal(undefined);
        expect(requestBodyLog!.body).to.equal('hello');
      } finally {
        resetLogger();
        fs.rmSync(tmpDir, {recursive: true, force: true});
      }
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('retries once on 429 with Retry-After header', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 1,
        prefix: 'TEST',
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      let callCount = 0;
      const request = new Request('https://example.com/rate', {method: 'GET'});

      const firstResponse = new Response('rate-limited', {
        status: 429,
        headers: {'Retry-After': '0'},
      });

      const successResponse = new Response('ok', {status: 200});

      const fetchFn = async () => {
        callCount += 1;
        return successResponse;
      };

      const finalResponse = (await middleware.onResponse!({
        request,
        response: firstResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      // ctx.fetch is only used for the retry; the initial 429 response already occurred.
      expect(callCount).to.equal(1);
      expect(finalResponse.status).to.equal(200);
    });

    it('retries even when Retry-After is large (Retry-After is respected by default)', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      const request = new Request('https://example.com/rate', {method: 'GET'});
      const firstResponse = new Response('rate-limited', {
        status: 429,
        headers: {'Retry-After': '0'},
      });

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        return new Response('ok', {status: 200});
      };

      const finalResponse = (await middleware.onResponse!({
        request,
        response: firstResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      expect(callCount).to.equal(1);
      expect(finalResponse.status).to.equal(200);
    });

    it('does not retry when the request is aborted', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 1000,
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      const controller = new AbortController();
      controller.abort();

      const request = new Request('https://example.com/rate', {method: 'GET', signal: controller.signal});
      const rateLimitedResponse = new Response('rate-limited', {
        status: 429,
        headers: {'Retry-After': '10'},
      });

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        return new Response('ok', {status: 200});
      };

      const finalResponse = (await middleware.onResponse!({
        request,
        response: rateLimitedResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      expect(callCount).to.equal(0);
      expect(finalResponse.status).to.equal(429);
    });

    it('does not retry when maxRetries is 0', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 0,
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      const request = new Request('https://example.com/rate', {method: 'GET'});
      const rateLimitedResponse = new Response('rate-limited', {status: 429});

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        return new Response('ok', {status: 200});
      };

      const finalResponse = (await middleware.onResponse!({
        request,
        response: rateLimitedResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      expect(callCount).to.equal(0);
      expect(finalResponse.status).to.equal(429);
    });

    it('does not retry when response status is not in statusCodes', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 2,
        statusCodes: [429],
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      const request = new Request('https://example.com/overloaded', {method: 'GET'});
      const overloadedResponse = new Response('overloaded', {status: 503});

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        return new Response('ok', {status: 200});
      };

      const finalResponse = (await middleware.onResponse!({
        request,
        response: overloadedResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      expect(callCount).to.equal(0);
      expect(finalResponse.status).to.equal(503);
    });

    it('retries using backoff when Retry-After header is missing', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
        prefix: 'TEST',
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      let callCount = 0;
      const request = new Request('https://example.com/rate', {method: 'GET'});

      const firstResponse = new Response('rate-limited', {
        status: 429,
      });

      const successResponse = new Response('ok', {status: 200});

      const fetchFn = async () => {
        callCount += 1;
        return successResponse;
      };

      const finalResponse = (await middleware.onResponse!({
        request,
        response: firstResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      // ctx.fetch is only used for the retry; the initial 429 response already occurred.
      expect(callCount).to.equal(1);
      expect(finalResponse.status).to.equal(200);
    });

    it('does not retry when openapi-fetch does not provide a fetch helper', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 2,
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      const request = new Request('https://example.com/rate', {method: 'GET'});
      const rateLimitedResponse = new Response('rate-limited', {status: 429});

      const originalFetch = (globalThis as unknown as {fetch?: unknown}).fetch;
      try {
        Object.defineProperty(globalThis, 'fetch', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        const finalResponse = (await middleware.onResponse!({
          request,
          response: rateLimitedResponse,
        } as unknown as OnResponseParams)) as Response;

        expect(finalResponse.status).to.equal(429);
      } finally {
        Object.defineProperty(globalThis, 'fetch', {
          value: originalFetch,
          writable: true,
          configurable: true,
        });
      }
    });

    it('stops retrying after maxRetries', async () => {
      const middleware = createRateLimitMiddleware({
        maxRetries: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
      });

      type OnResponseParams = Parameters<NonNullable<typeof middleware.onResponse>>[0];

      const request = new Request('https://example.com/rate', {method: 'GET'});
      const rateLimitedResponse = new Response('rate-limited', {status: 429});

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        return rateLimitedResponse;
      };

      // First 429 should trigger one retry
      const firstResult = (await middleware.onResponse!({
        request,
        response: rateLimitedResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      // Second 429 (after retry) should not trigger further retries
      const secondResult = (await middleware.onResponse!({
        request,
        response: rateLimitedResponse,
        fetch: fetchFn,
      } as unknown as OnResponseParams)) as Response;

      // Only the first onResponse triggers a single retry via ctx.fetch.
      expect(callCount).to.equal(1);
      expect(firstResult.status).to.equal(429);
      expect(secondResult.status).to.equal(429);
    });

    it('retries multiple times when ctx.fetch is missing and config.fetch is provided', async () => {
      type OnResponseParams = Parameters<NonNullable<ReturnType<typeof createRateLimitMiddleware>['onResponse']>>[0];

      const request = new Request('https://example.com/rate', {method: 'GET'});
      const firstResponse = new Response('rate-limited', {status: 429});

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        if (callCount === 1) {
          return new Response('rate-limited again', {status: 429});
        }
        return new Response('ok', {status: 200});
      };

      const fallbackMiddleware = createRateLimitMiddleware({
        maxRetries: 2,
        baseDelayMs: 0,
        maxDelayMs: 0,
        fetch: fetchFn,
      });

      const finalResponse = (await fallbackMiddleware.onResponse!({
        request,
        response: firstResponse,
      } as unknown as OnResponseParams)) as Response;

      expect(callCount).to.equal(2);
      expect(finalResponse.status).to.equal(200);
    });

    it('does not retry in fallback path when request is aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      type OnResponseParams = Parameters<NonNullable<ReturnType<typeof createRateLimitMiddleware>['onResponse']>>[0];

      const request = new Request('https://example.com/rate', {method: 'GET', signal: controller.signal});
      const rateLimitedResponse = new Response('rate-limited', {
        status: 429,
        headers: {'Retry-After': '10'},
      });

      let callCount = 0;
      const fetchFn = async () => {
        callCount += 1;
        return new Response('ok', {status: 200});
      };

      const fallbackMiddleware = createRateLimitMiddleware({
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 1000,
        fetch: fetchFn,
      });

      const finalResponse = (await fallbackMiddleware.onResponse!({
        request,
        response: rateLimitedResponse,
      } as unknown as OnResponseParams)) as Response;

      expect(callCount).to.equal(0);
      expect(finalResponse.status).to.equal(429);
    });
  });
});
