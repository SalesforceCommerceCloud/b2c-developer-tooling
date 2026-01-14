/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import type {UnifiedMiddleware} from '@salesforce/b2c-tooling-sdk/clients';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';

describe('clients/middleware-registry', () => {
  it('register() adds providers and getProviderNames() returns them', () => {
    const registry = new MiddlewareRegistry();

    registry.register({
      name: 'p1',
      getMiddleware() {
        return undefined;
      },
    });

    registry.register({
      name: 'p2',
      getMiddleware() {
        return undefined;
      },
    });

    expect(registry.size).to.equal(2);
    expect(registry.getProviderNames()).to.deep.equal(['p1', 'p2']);
  });

  it('unregister() removes an existing provider by name', () => {
    const registry = new MiddlewareRegistry();

    registry.register({
      name: 'p1',
      getMiddleware() {
        return undefined;
      },
    });

    expect(registry.size).to.equal(1);
    expect(registry.unregister('p1')).to.equal(true);
    expect(registry.size).to.equal(0);
  });

  it('unregister() returns false when provider does not exist', () => {
    const registry = new MiddlewareRegistry();
    registry.register({
      name: 'p1',
      getMiddleware() {
        return undefined;
      },
    });

    expect(registry.unregister('missing')).to.equal(false);
    expect(registry.size).to.equal(1);
  });

  it('getMiddleware() returns middleware in registration order and skips undefined', () => {
    const registry = new MiddlewareRegistry();

    const m1: UnifiedMiddleware = {
      async onRequest({request}) {
        request.headers.set('x-m1', '1');
        return request;
      },
    };

    const m2: UnifiedMiddleware = {
      async onRequest({request}) {
        request.headers.set('x-m2', '2');
        return request;
      },
    };

    registry.register({
      name: 'skip',
      getMiddleware() {
        return undefined;
      },
    });

    registry.register({
      name: 'p1',
      getMiddleware() {
        return m1;
      },
    });

    registry.register({
      name: 'p2',
      getMiddleware() {
        return m2;
      },
    });

    const middlewares = registry.getMiddleware('ocapi');
    expect(middlewares).to.have.length(2);
    expect(middlewares[0]).to.equal(m1);
    expect(middlewares[1]).to.equal(m2);
  });

  it('clear() removes all providers', () => {
    const registry = new MiddlewareRegistry();
    registry.register({
      name: 'p1',
      getMiddleware() {
        return undefined;
      },
    });

    expect(registry.size).to.equal(1);
    registry.clear();
    expect(registry.size).to.equal(0);
    expect(registry.getProviderNames()).to.deep.equal([]);
  });
});
