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

  it('replaces only scoped providers and preserves exclusions and registration order', () => {
    const registry = new MiddlewareRegistry();
    const original: UnifiedMiddleware = {onRequest: ({request}) => request};
    const scoped: UnifiedMiddleware = {onRequest: ({request}) => request};
    const plugin: UnifiedMiddleware = {onRequest: ({request}) => request};
    registry.register({name: 'policy', getMiddleware: () => original});
    registry.register({name: 'plugin', getMiddleware: () => plugin});
    registry.runWithOverrides([{name: 'policy', getMiddleware: () => scoped}], () => {
      expect(registry.getMiddleware('webdav')).to.have.length(2);
      expect(registry.getMiddleware('webdav')[0]).to.equal(scoped);
      expect(registry.getMiddleware('webdav')[1]).to.equal(plugin);
      expect(registry.getMiddleware('scapi', {exclude: ['policy']})).to.deep.equal([plugin]);
    });
    expect(registry.getMiddleware('webdav')[0]).to.equal(original);
  });

  it('isolates concurrent async scopes and restores outer policy after a nested failure', async () => {
    const registry = new MiddlewareRegistry();
    const outer = {onRequest: () => undefined};
    const nested = {onResponse: () => undefined};
    const concurrent = {onError: () => undefined};
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    await Promise.all([
      registry.runWithOverrides([{name: 'policy', getMiddleware: () => outer}], async () => {
        await ready;
        expect(() =>
          registry.runWithOverrides([{name: 'policy', getMiddleware: () => nested}], () => {
            expect(registry.getMiddleware('webdav')[0]).to.equal(nested);
            throw new Error('nested failure');
          }),
        ).to.throw('nested failure');
        expect(registry.getMiddleware('webdav')[0]).to.equal(outer);
      }),
      registry.runWithOverrides([{name: 'policy', getMiddleware: () => concurrent}], async () => {
        release();
        await ready;
        expect(registry.getMiddleware('webdav')[0]).to.equal(concurrent);
      }),
    ]);
    expect(registry.getMiddleware('webdav')).to.deep.equal([]);
    expect(registry.size).to.equal(0);
  });
});
