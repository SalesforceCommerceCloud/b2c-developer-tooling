/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {VariableStore} from '@salesforce/b2c-tooling-sdk/operations/debug';

describe('operations/debug/variable-store', () => {
  let store: VariableStore;

  beforeEach(() => {
    store = new VariableStore();
  });

  it('creates unique references starting at 1', () => {
    const ref1 = store.getOrCreateReference(1, 0, 'basket');
    const ref2 = store.getOrCreateReference(1, 0, 'order');

    expect(ref1).to.equal(1);
    expect(ref2).to.equal(2);
  });

  it('returns the same reference for identical parameters', () => {
    const ref1 = store.getOrCreateReference(1, 0, 'basket');
    const ref2 = store.getOrCreateReference(1, 0, 'basket');

    expect(ref1).to.equal(ref2);
  });

  it('distinguishes by scope', () => {
    const localRef = store.getOrCreateReference(1, 0, '', 'local');
    const closureRef = store.getOrCreateReference(1, 0, '', 'closure');

    expect(localRef).to.not.equal(closureRef);
  });

  it('resolves a reference back to its context', () => {
    const ref = store.getOrCreateReference(5, 2, 'basket.items', 'local');
    const resolved = store.resolve(ref);

    expect(resolved).to.deep.equal({
      threadId: 5,
      frameIndex: 2,
      objectPath: 'basket.items',
      scope: 'local',
    });
  });

  it('returns undefined for unknown references', () => {
    expect(store.resolve(999)).to.be.undefined;
  });

  it('clears all references', () => {
    const ref = store.getOrCreateReference(1, 0, 'foo');
    expect(store.resolve(ref)).to.not.be.undefined;

    store.clear();
    expect(store.resolve(ref)).to.be.undefined;
  });

  it('resets counter after clear', () => {
    store.getOrCreateReference(1, 0, 'a');
    store.getOrCreateReference(1, 0, 'b');
    store.clear();

    const ref = store.getOrCreateReference(1, 0, 'c');
    expect(ref).to.equal(1);
  });
});
