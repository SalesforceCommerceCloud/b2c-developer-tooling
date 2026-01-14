/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';

describe('auth/api-key', () => {
  describe('ApiKeyStrategy', () => {
    it('getAuthorizationHeader returns Bearer token when headerName is Authorization', async () => {
      const auth = new ApiKeyStrategy('my-key', 'Authorization');
      const header = await auth.getAuthorizationHeader();
      expect(header).to.equal('Bearer my-key');
    });

    it('getAuthorizationHeader returns raw key when headerName is not Authorization', async () => {
      const auth = new ApiKeyStrategy('my-key', 'x-api-key');
      const header = await auth.getAuthorizationHeader();
      expect(header).to.equal('my-key');
    });

    it('fetch injects configured header and preserves existing headers', async () => {
      const originalFetch = globalThis.fetch;
      try {
        let seenAuth: string | null = null;
        let seenCustom: string | null = null;

        globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          seenAuth = headers.get('Authorization');
          seenCustom = headers.get('x-custom');
          return new Response('ok', {status: 200});
        }) as typeof fetch;

        const auth = new ApiKeyStrategy('my-key', 'Authorization');
        const res = await auth.fetch('https://example.com', {headers: {'x-custom': '1'}});

        expect(res.status).to.equal(200);
        expect(seenCustom).to.equal('1');
        expect(seenAuth).to.equal('Bearer my-key');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('fetch injects raw key for non-Authorization headerName', async () => {
      const originalFetch = globalThis.fetch;
      try {
        let seenKey: string | null = null;

        globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          seenKey = headers.get('x-api-key');
          return new Response('ok', {status: 200});
        }) as typeof fetch;

        const auth = new ApiKeyStrategy('my-key', 'x-api-key');
        await auth.fetch('https://example.com');

        expect(seenKey).to.equal('my-key');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
