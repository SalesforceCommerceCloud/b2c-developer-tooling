/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createSafetyMiddleware} from '@salesforce/b2c-tooling-sdk/clients';
import {SafetyBlockedError} from '@salesforce/b2c-tooling-sdk';

describe('clients/middleware - createSafetyMiddleware', () => {
  describe('HTTP request interception', () => {
    it('allows safe operations to pass through', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_DELETE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://api.example.com/items', {method: 'GET'});
      const result = await middleware.onRequest!({request} as unknown as OnRequestParams);

      expect(result).to.equal(request);
    });

    it('throws SafetyBlockedError for blocked operations', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_DELETE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://api.example.com/items/1', {method: 'DELETE'});

      try {
        await middleware.onRequest!({request} as unknown as OnRequestParams);
        throw new Error('Expected SafetyBlockedError to be thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
        expect((error as SafetyBlockedError).method).to.equal('DELETE');
        expect((error as SafetyBlockedError).url).to.equal('https://api.example.com/items/1');
        expect((error as SafetyBlockedError).safetyLevel).to.equal('NO_DELETE');
        expect((error as SafetyBlockedError).message).to.include('Delete operation blocked');
      }
    });
  });

  describe('NO_DELETE level middleware', () => {
    it('blocks DELETE requests', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_DELETE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://api.example.com/sandboxes/123', {method: 'DELETE'});

      try {
        await middleware.onRequest!({request} as unknown as OnRequestParams);
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
        expect((error as SafetyBlockedError).message).to.include('Delete operation blocked');
      }
    });

    it('allows GET, POST, PUT, PATCH requests', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_DELETE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const methods = ['GET', 'POST', 'PUT', 'PATCH'];

      for (const method of methods) {
        const request = new Request('https://api.example.com/items', {method});
        const result = await middleware.onRequest!({request} as unknown as OnRequestParams);
        expect(result).to.equal(request);
      }
    });
  });

  describe('NO_UPDATE level middleware', () => {
    it('blocks DELETE requests', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_UPDATE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://api.example.com/items/1', {method: 'DELETE'});

      try {
        await middleware.onRequest!({request} as unknown as OnRequestParams);
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
      }
    });

    it('blocks destructive POST operations', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_UPDATE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const destructivePaths = [
        'https://api.example.com/sandboxes/123/reset',
        'https://api.example.com/sandboxes/123/stop',
        'https://api.example.com/sandboxes/123/restart',
        'https://api.example.com/sandboxes/123/operations',
      ];

      for (const url of destructivePaths) {
        const request = new Request(url, {method: 'POST'});

        try {
          await middleware.onRequest!({request} as unknown as OnRequestParams);
          throw new Error(`Expected SafetyBlockedError for ${url}`);
        } catch (error) {
          expect(error).to.be.instanceOf(SafetyBlockedError);
          expect((error as SafetyBlockedError).message).to.include('Destructive operation blocked');
        }
      }
    });

    it('allows normal POST operations', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_UPDATE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const safePaths = [
        'https://api.example.com/sandboxes',
        'https://api.example.com/items',
        'https://api.example.com/users',
      ];

      for (const url of safePaths) {
        const request = new Request(url, {method: 'POST'});
        const result = await middleware.onRequest!({request} as unknown as OnRequestParams);
        expect(result).to.equal(request);
      }
    });
  });

  describe('READ_ONLY level middleware', () => {
    it('blocks all write operations', async () => {
      const middleware = createSafetyMiddleware({level: 'READ_ONLY'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

      for (const method of writeMethods) {
        const request = new Request('https://api.example.com/items', {method});

        try {
          await middleware.onRequest!({request} as unknown as OnRequestParams);
          throw new Error(`Expected SafetyBlockedError for ${method}`);
        } catch (error) {
          expect(error).to.be.instanceOf(SafetyBlockedError);
          expect((error as SafetyBlockedError).message).to.include('Write operation blocked');
          expect((error as SafetyBlockedError).message).to.include('READ_ONLY mode');
        }
      }
    });

    it('allows GET operations', async () => {
      const middleware = createSafetyMiddleware({level: 'READ_ONLY'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://api.example.com/items', {method: 'GET'});
      const result = await middleware.onRequest!({request} as unknown as OnRequestParams);

      expect(result).to.equal(request);
    });
  });

  describe('NONE level middleware', () => {
    it('allows all operations', async () => {
      const middleware = createSafetyMiddleware({level: 'NONE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const allMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      for (const method of allMethods) {
        const request = new Request('https://api.example.com/items', {method});
        const result = await middleware.onRequest!({request} as unknown as OnRequestParams);
        expect(result).to.equal(request);
      }
    });
  });

  describe('real-world scenarios', () => {
    it('protects against accidental sandbox deletion', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_DELETE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://api.example.com/sandboxes/prod-123', {method: 'DELETE'});

      try {
        await middleware.onRequest!({request} as unknown as OnRequestParams);
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
        expect((error as SafetyBlockedError).method).to.equal('DELETE');
        expect((error as SafetyBlockedError).url).to.include('prod-123');
      }
    });

    it('protects against destructive operations on production', async () => {
      const middleware = createSafetyMiddleware({level: 'NO_UPDATE'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const resetRequest = new Request('https://api.example.com/sandboxes/prod-123/reset', {method: 'POST'});

      try {
        await middleware.onRequest!({request: resetRequest} as unknown as OnRequestParams);
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
        expect((error as SafetyBlockedError).message).to.include('Destructive operation blocked');
      }
    });

    it('enforces read-only access for audit/investigation scenarios', async () => {
      const middleware = createSafetyMiddleware({level: 'READ_ONLY'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      // Reading should work
      const getRequest = new Request('https://api.example.com/logs', {method: 'GET'});
      const getResult = await middleware.onRequest!({request: getRequest} as unknown as OnRequestParams);
      expect(getResult).to.equal(getRequest);

      // Writing should be blocked
      const postRequest = new Request('https://api.example.com/logs', {method: 'POST'});
      try {
        await middleware.onRequest!({request: postRequest} as unknown as OnRequestParams);
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
      }
    });
  });
});
