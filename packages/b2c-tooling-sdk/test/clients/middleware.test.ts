/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  createAuthMiddleware,
  createExtraParamsMiddleware,
  createLoggingMiddleware,
} from '@salesforce/b2c-tooling-sdk/clients';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {configureLogger, resetLogger} from '@salesforce/b2c-tooling-sdk/logging';

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
});
