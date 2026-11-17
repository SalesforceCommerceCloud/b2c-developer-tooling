/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {MrtLogWatch} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {MrtLogWatchRegistry, mrtWatchKey} from '../../../src/tools/diagnostics/mrt-log-watch-registry.js';

// Buffering, filters, caps and stream-close handling are covered by the SDK's watchMrtLogs tests.
function createWatch(lastActivityAt = Date.now(), stop = sinon.stub().resolves()): MrtLogWatch {
  return {poll: sinon.stub(), info: sinon.stub().returns({lastActivityAt}), stop} as never;
}

describe('MrtLogWatchRegistry', () => {
  let registry: MrtLogWatchRegistry;

  beforeEach(() => {
    registry = new MrtLogWatchRegistry();
  });

  afterEach(async () => {
    await registry.destroyAll();
  });

  it('keys watches by project, environment and origin', () => {
    expect(mrtWatchKey('p', 'e', 'https://o')).to.not.equal(mrtWatchKey('p', 'e', 'https://other'));
    expect(mrtWatchKey('p', 'e')).to.equal(mrtWatchKey('p', 'e', undefined));
  });

  it('registers a watch and rejects a duplicate key, allowing another origin', () => {
    const entry = registry.registerWatch({project: 'p', environment: 'e', watch: createWatch()});
    expect(entry.watchId).to.match(/^[\da-f-]{36}$/);
    expect(registry.findByKey('p', 'e')).to.equal(entry);
    expect(() => registry.registerWatch({project: 'p', environment: 'e', watch: createWatch()})).to.throw(
      /already exists for p\/e/,
    );
    registry.registerWatch({project: 'p', environment: 'e', origin: 'https://other.example.com', watch: createWatch()});
    expect(registry.listWatches()).to.have.length(2);
  });

  it('throws for an unknown watchId', () => {
    expect(() => registry.getWatchOrThrow('nope')).to.throw(/No MRT log watch found/);
  });

  it('stops and removes a watch, ignoring stop failures', async () => {
    const stop = sinon.stub().rejects(new Error('ignored'));
    const entry = registry.registerWatch({project: 'p', environment: 'e', watch: createWatch(Date.now(), stop)});
    await registry.destroyWatch(entry.watchId);
    await registry.destroyWatch('nope');
    expect(stop.calledOnce).to.equal(true);
    expect(registry.getWatch(entry.watchId)).to.equal(undefined);
  });

  it('reaps watches idle past the TTL', async () => {
    const stop = sinon.stub().resolves();
    const idle = registry.registerWatch({
      project: 'p',
      environment: 'e',
      watch: createWatch(Date.now() - 31 * 60 * 1000, stop),
    });
    await (registry as unknown as {cleanupIdleWatches: () => Promise<void>}).cleanupIdleWatches();
    expect(registry.getWatch(idle.watchId)).to.equal(undefined);
    expect(stop.calledOnce).to.equal(true);
  });
});
