/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {LogWatch} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {LogWatchRegistry} from '../../../src/tools/diagnostics/log-watch-registry.js';

// Buffering, filters and caps are covered by the SDK's watchLogs tests.
function createWatch(lastActivityAt = Date.now(), stop = sinon.stub().resolves()): LogWatch {
  return {prefixes: ['error'], poll: sinon.stub(), info: sinon.stub().returns({lastActivityAt}), stop} as never;
}

describe('LogWatchRegistry', () => {
  let registry: LogWatchRegistry;

  beforeEach(() => {
    registry = new LogWatchRegistry();
  });

  afterEach(async () => {
    await registry.destroyAll();
  });

  it('registers a watch under a UUID and rejects a second watch for the same hostname', () => {
    const entry = registry.registerWatch({hostname: 'h', watch: createWatch()});
    expect(entry.watchId).to.match(/^[\da-f-]{36}$/);
    expect(registry.getWatchOrThrow(entry.watchId)).to.equal(entry);
    expect(registry.findByHostname('h')).to.equal(entry);
    expect(() => registry.registerWatch({hostname: 'h', watch: createWatch()})).to.throw(/already exists for h/);
  });

  it('throws for an unknown watchId', () => {
    expect(() => registry.getWatchOrThrow('nope')).to.throw(/No log watch found/);
  });

  it('stops and removes a watch; destroying twice or an unknown id is a no-op', async () => {
    const stop = sinon.stub().rejects(new Error('ignored'));
    const entry = registry.registerWatch({hostname: 'h', watch: createWatch(Date.now(), stop)});
    await registry.destroyWatch(entry.watchId);
    await registry.destroyWatch(entry.watchId);
    await registry.destroyWatch('nope');
    expect(stop.calledOnce).to.equal(true);
    expect(registry.listWatches()).to.deep.equal([]);
  });

  it('reaps watches idle past the TTL and keeps active ones', async () => {
    const idleStop = sinon.stub().resolves();
    const idle = registry.registerWatch({hostname: 'idle', watch: createWatch(Date.now() - 31 * 60 * 1000, idleStop)});
    const active = registry.registerWatch({hostname: 'active', watch: createWatch()});
    await (registry as unknown as {cleanupIdleWatches: () => Promise<void>}).cleanupIdleWatches();
    expect(registry.getWatch(idle.watchId)).to.equal(undefined);
    expect(idleStop.calledOnce).to.equal(true);
    expect(registry.getWatch(active.watchId)).to.equal(active);
  });

  it('destroys all watches', async () => {
    const s1 = sinon.stub().resolves();
    const s2 = sinon.stub().resolves();
    registry.registerWatch({hostname: 'h1', watch: createWatch(Date.now(), s1)});
    registry.registerWatch({hostname: 'h2', watch: createWatch(Date.now(), s2)});
    await registry.destroyAll();
    expect(s1.calledOnce && s2.calledOnce).to.equal(true);
    expect(registry.listWatches()).to.deep.equal([]);
  });
});
