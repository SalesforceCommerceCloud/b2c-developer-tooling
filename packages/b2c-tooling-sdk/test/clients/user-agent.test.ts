/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  createUserAgentMiddleware,
  setUserAgent,
  getUserAgent,
  resetUserAgent,
  userAgentProvider,
} from '@salesforce/b2c-tooling-sdk/clients';
import {SDK_USER_AGENT} from '@salesforce/b2c-tooling-sdk';

describe('clients/user-agent', () => {
  afterEach(() => {
    // Reset to default after each test
    resetUserAgent();
  });

  describe('createUserAgentMiddleware', () => {
    it('sets User-Agent header on request', async () => {
      const middleware = createUserAgentMiddleware({userAgent: 'test-agent/1.0.0'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/ping', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('User-Agent')).to.equal('test-agent/1.0.0');
    });

    it('sets sfdc_user_agent header with same value', async () => {
      const middleware = createUserAgentMiddleware({userAgent: 'test-agent/1.0.0'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/ping', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('sfdc_user_agent')).to.equal('test-agent/1.0.0');
    });

    it('overwrites existing User-Agent header', async () => {
      const middleware = createUserAgentMiddleware({userAgent: 'new-agent/2.0.0'});
      type OnRequestParams = Parameters<NonNullable<typeof middleware.onRequest>>[0];

      const request = new Request('https://example.com/ping', {
        method: 'GET',
        headers: {'User-Agent': 'old-agent/1.0.0'},
      });
      const modifiedRequest = await middleware.onRequest!({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('User-Agent')).to.equal('new-agent/2.0.0');
    });
  });

  describe('setUserAgent/getUserAgent', () => {
    it('defaults to SDK_USER_AGENT', () => {
      expect(getUserAgent()).to.equal(SDK_USER_AGENT);
    });

    it('setUserAgent changes the current User-Agent', () => {
      setUserAgent('b2c-cli/1.0.0');
      expect(getUserAgent()).to.equal('b2c-cli/1.0.0');
    });
  });

  describe('resetUserAgent', () => {
    it('resets to SDK_USER_AGENT', () => {
      setUserAgent('custom-agent/1.0.0');
      expect(getUserAgent()).to.equal('custom-agent/1.0.0');

      resetUserAgent();
      expect(getUserAgent()).to.equal(SDK_USER_AGENT);
    });
  });

  describe('userAgentProvider', () => {
    it('has name "user-agent"', () => {
      expect(userAgentProvider.name).to.equal('user-agent');
    });

    it('returns middleware with current User-Agent', async () => {
      setUserAgent('provider-test/1.0.0');

      const middleware = userAgentProvider.getMiddleware('ocapi');
      if (!middleware || !middleware.onRequest) {
        throw new Error('Expected provider to return middleware with onRequest');
      }

      type OnRequestParams = Parameters<typeof middleware.onRequest>[0];
      const request = new Request('https://example.com/ping', {method: 'GET'});
      const modifiedRequest = await middleware.onRequest({request} as unknown as OnRequestParams);

      if (!modifiedRequest) {
        throw new Error('Expected middleware to return a Request');
      }

      expect(modifiedRequest.headers.get('User-Agent')).to.equal('provider-test/1.0.0');
    });

    it('returns middleware for different client types', () => {
      const clientTypes = ['ocapi', 'slas', 'ods', 'mrt', 'webdav'] as const;
      for (const clientType of clientTypes) {
        const middleware = userAgentProvider.getMiddleware(clientType);
        expect(middleware).to.not.equal(undefined, `Expected middleware for ${clientType}`);
      }
    });
  });
});
