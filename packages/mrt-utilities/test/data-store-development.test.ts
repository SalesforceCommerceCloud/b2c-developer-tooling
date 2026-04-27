/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';

import {DataStore, DataStoreNotFoundError} from '../src/data-store/development.js';

describe('DataStore (development)', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = {...process.env};
    (DataStore as unknown as {_instance: DataStore | null})._instance = null;
  });

  afterEach(() => {
    process.env = originalEnv;
    (DataStore as unknown as {_instance: DataStore | null})._instance = null;
    sinon.restore();
  });

  it('is always available in development mode', () => {
    const store = DataStore.getDataStore();
    expect(store.isDataStoreAvailable()).to.equal(true);
  });

  it('returns entries from SFNEXT_DATA_STORE_DEFAULTS', async () => {
    process.env.SFNEXT_DATA_STORE_DEFAULTS = JSON.stringify({
      'my-key': {theme: 'dark'},
    });

    const store = DataStore.getDataStore();
    const result = await store.getEntry('my-key');

    expect(result).to.deep.equal({
      key: 'my-key',
      value: {theme: 'dark'},
    });
  });

  it('throws DataStoreNotFoundError for missing keys by default', async () => {
    process.env.SFNEXT_DATA_STORE_DEFAULTS = JSON.stringify({
      'other-key': {theme: 'dark'},
    });

    const store = DataStore.getDataStore();

    try {
      await store.getEntry('my-key');
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.an.instanceOf(DataStoreNotFoundError);
      expect((error as Error).message).to.include("Data store entry 'my-key' not found");
    }
  });

  it('warns once per missing key when warnings are enabled', async () => {
    process.env.SFNEXT_DATA_STORE_DEFAULTS = '{}';
    const warnStub = sinon.stub(console, 'warn');
    const store = DataStore.getDataStore();

    for (let i = 0; i < 2; i++) {
      try {
        await store.getEntry('my-key');
      } catch {
        // expected
      }
    }

    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.firstArg).to.include("Local data-store provider did not find 'my-key'");
  });

  it('does not warn for missing keys when SFNEXT_DATA_STORE_WARN_ON_MISSING=false', async () => {
    process.env.SFNEXT_DATA_STORE_DEFAULTS = '{}';
    process.env.SFNEXT_DATA_STORE_WARN_ON_MISSING = 'false';

    const warnStub = sinon.stub(console, 'warn');
    const store = DataStore.getDataStore();

    try {
      await store.getEntry('my-key');
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.an.instanceOf(DataStoreNotFoundError);
    }

    expect(warnStub.called).to.equal(false);
  });

  it('warns when SFNEXT_DATA_STORE_DEFAULTS is invalid JSON', async () => {
    process.env.SFNEXT_DATA_STORE_DEFAULTS = '{"my-key": ';
    process.env.SFNEXT_DATA_STORE_WARN_ON_MISSING = 'false';

    const warnStub = sinon.stub(console, 'warn');
    const store = DataStore.getDataStore();

    try {
      await store.getEntry('my-key');
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.an.instanceOf(DataStoreNotFoundError);
    }

    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.firstArg).to.equal('Failed to parse SFNEXT_DATA_STORE_DEFAULTS JSON.');
  });
});
