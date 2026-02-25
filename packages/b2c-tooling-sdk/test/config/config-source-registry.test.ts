/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {ConfigSourceRegistry} from '@salesforce/b2c-tooling-sdk/config';
import type {ConfigSource} from '@salesforce/b2c-tooling-sdk/config';

function createStubSource(name: string, priority?: number): ConfigSource {
  return {
    name,
    priority,
    load() {
      return undefined;
    },
  };
}

describe('config/config-source-registry', () => {
  it('register() adds sources and getSourceNames() returns them', () => {
    const registry = new ConfigSourceRegistry();

    registry.register(createStubSource('s1'));
    registry.register(createStubSource('s2'));

    expect(registry.size).to.equal(2);
    expect(registry.getSourceNames()).to.deep.equal(['s1', 's2']);
  });

  it('unregister() removes an existing source by name', () => {
    const registry = new ConfigSourceRegistry();

    registry.register(createStubSource('s1'));

    expect(registry.size).to.equal(1);
    expect(registry.unregister('s1')).to.equal(true);
    expect(registry.size).to.equal(0);
  });

  it('unregister() returns false when source does not exist', () => {
    const registry = new ConfigSourceRegistry();
    registry.register(createStubSource('s1'));

    expect(registry.unregister('missing')).to.equal(false);
    expect(registry.size).to.equal(1);
  });

  it('getSources() returns a copy of registered sources', () => {
    const registry = new ConfigSourceRegistry();
    const source = createStubSource('s1');
    registry.register(source);

    const sources = registry.getSources();
    expect(sources).to.have.length(1);
    expect(sources[0]).to.equal(source);

    // Mutating the returned array should not affect the registry
    sources.push(createStubSource('s2'));
    expect(registry.size).to.equal(1);
  });

  it('clear() removes all sources', () => {
    const registry = new ConfigSourceRegistry();
    registry.register(createStubSource('s1'));
    registry.register(createStubSource('s2'));

    expect(registry.size).to.equal(2);
    registry.clear();
    expect(registry.size).to.equal(0);
    expect(registry.getSourceNames()).to.deep.equal([]);
  });
});
