/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {BasicAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

describe('auth/basic', () => {
  describe('BasicAuthStrategy', () => {
    it('getAuthorizationHeader returns a Basic header with base64 encoded user:pass', async () => {
      const auth = new BasicAuthStrategy('user', 'pass');
      const header = await auth.getAuthorizationHeader();
      expect(header).to.equal(`Basic ${Buffer.from('user:pass').toString('base64')}`);
    });

    it('fetch injects Authorization header and preserves existing headers', async () => {
      const originalFetch = globalThis.fetch;
      try {
        let seenHeader: string | null = null;
        let seenCustom: string | null = null;

        globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          seenHeader = headers.get('Authorization');
          seenCustom = headers.get('x-custom');
          return new Response('ok', {status: 200});
        }) as typeof fetch;

        const auth = new BasicAuthStrategy('user', 'pass');
        const res = await auth.fetch('https://example.com', {headers: {'x-custom': '1'}});

        expect(res.status).to.equal(200);
        expect(seenCustom).to.equal('1');
        expect(seenHeader).to.equal(`Basic ${Buffer.from('user:pass').toString('base64')}`);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
