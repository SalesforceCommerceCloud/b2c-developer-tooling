/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {MockAgent} from 'undici';
import {BasicAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

/**
 * Regression tests for issue #468: when a request carries an undici `dispatcher`
 * (mTLS / self-signed TLS Agent), it must be routed through undici's OWN `fetch`,
 * not `global.fetch`, so the Agent and the fetch share one undici instance.
 *
 * The discriminating assertion is *which* fetch is used:
 *  - dispatcher present  -> undici's fetch (NOT global.fetch)
 *  - dispatcher absent    -> global.fetch
 *
 * We detect a global.fetch call by replacing globalThis.fetch with a counting
 * stub. The pre-fix code (`fetch(url, ...)` with the dispatcher) would call that
 * stub even when a dispatcher is present; the fixed code must not. A real undici
 * MockAgent stands in for the dispatcher so the undici path resolves without
 * touching the network. Asserting on the global.fetch count (rather than only on
 * a successful response) is what makes this fail for the buggy code: at the
 * current undici version global.fetch happens to honor a per-call dispatcher, so
 * a response-only assertion would pass for the old code too.
 */
describe('auth/dispatch-fetch (issue #468)', () => {
  const realGlobalFetch = globalThis.fetch;
  let globalFetchCalls = 0;

  beforeEach(() => {
    globalFetchCalls = 0;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      globalFetchCalls++;
      return realGlobalFetch(...args);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realGlobalFetch;
  });

  it('routes dispatcher-bearing requests through undici fetch, not global.fetch', async () => {
    const mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    let interceptedAuth: string | undefined;
    mockAgent
      .get('https://example.test')
      .intercept({path: '/file.txt', method: 'PUT'})
      .reply((opts) => {
        interceptedAuth = (opts.headers as Record<string, string>)?.authorization;
        return {statusCode: 201, data: 'created'};
      });

    const auth = new BasicAuthStrategy('user', 'pass');
    const res = await auth.fetch('https://example.test/file.txt', {
      method: 'PUT',
      body: 'hello',
      dispatcher: mockAgent,
    });

    expect(res.status, 'request resolved via the undici dispatcher path').to.equal(201);
    // Core regression assertion: the dispatcher path must NOT use global.fetch.
    expect(globalFetchCalls, 'global.fetch must not be used when a dispatcher is present').to.equal(0);
    // Auth header is still injected on the dispatcher path.
    expect(interceptedAuth).to.equal(`Basic ${Buffer.from('user:pass').toString('base64')}`);

    mockAgent.assertNoPendingInterceptors();
    await mockAgent.close();
  });

  it('uses global.fetch when no dispatcher is present', async () => {
    const mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    mockAgent.get('https://example.test').intercept({path: '/', method: 'GET'}).reply(200, 'ok');

    // Route the stub through the mock so no real network is touched, while still
    // counting that global.fetch was the entry point for the no-dispatcher case.
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      globalFetchCalls++;
      const {fetch: undiciFetch} = await import('undici');
      return undiciFetch(url as string, {...init, dispatcher: mockAgent} as RequestInit) as unknown as Response;
    }) as typeof fetch;

    const auth = new BasicAuthStrategy('user', 'pass');
    const res = await auth.fetch('https://example.test/');

    expect(res.status).to.equal(200);
    expect(globalFetchCalls, 'no-dispatcher requests use global.fetch').to.equal(1);

    await mockAgent.close();
  });
});
