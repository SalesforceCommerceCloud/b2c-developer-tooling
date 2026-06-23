/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {MrtLogEntry, TailMrtLogsResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {MrtLogWatchRegistry, mrtWatchKey} from '../../../src/tools/diagnostics/mrt-log-watch-registry.js';

function createTailResult(overrides?: Partial<TailMrtLogsResult>): TailMrtLogsResult {
  return {
    stop: sinon.stub(),
    done: Promise.resolve(),
    ...overrides,
  };
}

function makeEntry(message: string, level = 'INFO'): MrtLogEntry {
  return {
    timestamp: '2026-01-01T10:00:00.000Z',
    level,
    message,
    raw: `2026-01-01T10:00:00.000Z\tabc\t${level}\t${message}`,
  };
}

describe('MrtLogWatchRegistry', () => {
  let registry: MrtLogWatchRegistry;

  beforeEach(() => {
    registry = new MrtLogWatchRegistry();
  });

  afterEach(async () => {
    await registry.destroyAll();
  });

  describe('mrtWatchKey', () => {
    it('combines project, environment, and origin', () => {
      expect(mrtWatchKey('p', 'e', 'https://o')).to.not.equal(mrtWatchKey('p', 'e', 'https://other'));
      expect(mrtWatchKey('p', 'e')).to.equal(mrtWatchKey('p', 'e', undefined));
    });
  });

  describe('registerWatch', () => {
    it('returns an entry with a UUID and metadata', () => {
      const entry = registry.registerWatch({
        project: 'my-storefront',
        environment: 'staging',
        origin: 'https://cloud.mobify.com',
        tailResult: createTailResult(),
      });
      expect(entry.watchId).to.match(/^[\da-f-]{36}$/);
      expect(entry.project).to.equal('my-storefront');
      expect(entry.environment).to.equal('staging');
      expect(entry.origin).to.equal('https://cloud.mobify.com');
      expect(entry.buffer).to.deep.equal([]);
      expect(entry.stopped).to.be.false;
    });

    it('rejects duplicate project/environment/origin', () => {
      registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      expect(() => registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()})).to.throw(
        /already exists for p\/e/,
      );
    });

    it('allows the same project/environment with a different origin', () => {
      registry.registerWatch({project: 'p', environment: 'e', origin: 'https://a', tailResult: createTailResult()});
      expect(() =>
        registry.registerWatch({project: 'p', environment: 'e', origin: 'https://b', tailResult: createTailResult()}),
      ).to.not.throw();
      expect(registry.listWatches()).to.have.lengthOf(2);
    });
  });

  describe('appendEntry', () => {
    it('buffers entries and updates totalEntriesSeen', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.appendEntry(e.watchId, makeEntry('boom'));
      expect(e.buffer).to.have.lengthOf(1);
      expect(e.totalEntriesSeen).to.equal(1);
    });

    it('evicts oldest when over bufferCap and counts dropped', () => {
      const e = registry.registerWatch({
        project: 'p',
        environment: 'e',
        tailResult: createTailResult(),
        bufferCap: 2,
      });
      registry.appendEntry(e.watchId, makeEntry('a'));
      registry.appendEntry(e.watchId, makeEntry('b'));
      registry.appendEntry(e.watchId, makeEntry('c'));
      expect(e.buffer.map((x) => x.message)).to.deep.equal(['b', 'c']);
      expect(e.droppedEntries).to.equal(1);
    });

    it('is a no-op for unknown watchId', () => {
      expect(() => registry.appendEntry('nope', makeEntry('x'))).to.not.throw();
    });

    it('is a no-op once stopped', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.markStreamClosed(e.watchId);
      registry.appendEntry(e.watchId, makeEntry('x'));
      expect(e.buffer).to.have.lengthOf(0);
    });

    it('resolves pending poll waiters', async () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 5000);
      registry.appendEntry(e.watchId, makeEntry('x'));
      await wait;
    });

    it('evicts oldest when over byte cap and counts dropped', () => {
      const big = 'x'.repeat(100);
      const e = registry.registerWatch({
        project: 'p',
        environment: 'e',
        tailResult: createTailResult(),
        bufferCap: 1000,
        bufferBytesCap: 250,
      });
      registry.appendEntry(e.watchId, makeEntry(big));
      registry.appendEntry(e.watchId, makeEntry(big));
      registry.appendEntry(e.watchId, makeEntry(big));
      expect(e.buffer.length).to.be.lessThan(3);
      expect(e.droppedEntries).to.be.greaterThan(0);
    });

    it('always keeps at least one entry even if it exceeds the byte cap', () => {
      const e = registry.registerWatch({
        project: 'p',
        environment: 'e',
        tailResult: createTailResult(),
        bufferBytesCap: 10,
      });
      registry.appendEntry(e.watchId, makeEntry('x'.repeat(10_000)));
      expect(e.buffer).to.have.lengthOf(1);
    });
  });

  describe('appendError', () => {
    it('stores errors with timestamp and resolves waiters', async () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 5000);
      registry.appendError(e.watchId, new Error('nope'));
      await wait;
      expect(e.errors).to.have.lengthOf(1);
      expect(e.errors[0].message).to.equal('nope');
    });

    it('records errors even after the stream is stopped (close-time failure)', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.markStreamClosed(e.watchId);
      registry.appendError(e.watchId, new Error('connection lost'));
      expect(e.errors).to.have.lengthOf(1);
    });

    it('caps the number of buffered errors', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      for (let i = 0; i < 40; i++) {
        registry.appendError(e.watchId, new Error(`err-${i}`));
      }
      expect(e.errors.length).to.equal(25);
      // Oldest evicted, newest retained.
      expect(e.errors.at(-1)!.message).to.equal('err-39');
    });

    it('is a no-op for unknown watchId', () => {
      expect(() => registry.appendError('nope', new Error('x'))).to.not.throw();
    });
  });

  describe('markStreamClosed', () => {
    it('sets stopped and resolves blocked pollers', async () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 10_000);
      registry.markStreamClosed(e.watchId);
      await wait; // resolves, not hangs
      expect(e.stopped).to.be.true;
    });

    it('is a no-op when already stopped', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.markStreamClosed(e.watchId);
      expect(() => registry.markStreamClosed(e.watchId)).to.not.throw();
    });
  });

  describe('drain', () => {
    it('removes drained entries and reports truncated', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.appendEntry(e.watchId, makeEntry('a'));
      registry.appendEntry(e.watchId, makeEntry('b'));
      registry.appendEntry(e.watchId, makeEntry('c'));
      const result = registry.drain(e.watchId, 2);
      expect(result.entries.map((x) => x.message)).to.deep.equal(['a', 'b']);
      expect(result.truncated).to.be.true;
      expect(e.buffer).to.have.lengthOf(1);
    });

    it('drains errors', () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.appendError(e.watchId, new Error('x'));
      const result = registry.drain(e.watchId, 100);
      expect(result.errors).to.have.lengthOf(1);
      expect(e.errors).to.have.lengthOf(0);
    });
  });

  describe('waitForActivity', () => {
    it('returns immediately if buffer non-empty', async () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      registry.appendEntry(e.watchId, makeEntry('x'));
      const start = Date.now();
      await registry.waitForActivity(e.watchId, 10_000);
      expect(Date.now() - start).to.be.lessThan(50);
    });

    it('resolves on timeout when no activity', async () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      const start = Date.now();
      await registry.waitForActivity(e.watchId, 50);
      expect(Date.now() - start).to.be.at.least(40);
    });
  });

  describe('destroyWatch', () => {
    it('calls stop and removes the entry', async () => {
      const stop = sinon.stub();
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult({stop})});
      await registry.destroyWatch(e.watchId);
      expect(stop.calledOnce).to.be.true;
      expect(registry.getWatch(e.watchId)).to.be.undefined;
    });

    it('resolves pending waiters during destroy', async () => {
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 10_000);
      await registry.destroyWatch(e.watchId);
      await wait; // should resolve, not hang
    });

    it('swallows stop errors', async () => {
      const e = registry.registerWatch({
        project: 'p',
        environment: 'e',
        tailResult: createTailResult({
          stop: sinon.stub().throws(new Error('boom')),
        }),
      });
      await registry.destroyWatch(e.watchId); // should not throw
    });

    it('swallows a rejected done promise', async () => {
      const rejected = Promise.reject(new Error('WebSocket connection failed: close code 1006'));
      const e = registry.registerWatch({
        project: 'p',
        environment: 'e',
        tailResult: createTailResult({done: rejected}),
      });
      await registry.destroyWatch(e.watchId); // must not throw / unhandled-reject
      expect(registry.getWatch(e.watchId)).to.be.undefined;
    });

    it('is a no-op for unknown id', async () => {
      await registry.destroyWatch('nonexistent');
    });
  });

  describe('getWatchOrThrow', () => {
    it('throws for unknown watchId', () => {
      expect(() => registry.getWatchOrThrow('nope')).to.throw(/No MRT log watch found/);
    });
  });

  describe('cleanupIdleWatches', () => {
    it('destroys idle watches past TTL', async () => {
      const stop = sinon.stub();
      const e = registry.registerWatch({project: 'p', environment: 'e', tailResult: createTailResult({stop})});
      e.lastActivityAt = Date.now() - 31 * 60 * 1000;
      await (registry as unknown as {cleanupIdleWatches: () => Promise<void>}).cleanupIdleWatches();
      expect(registry.getWatch(e.watchId)).to.be.undefined;
      expect(stop.calledOnce).to.be.true;
    });
  });

  describe('destroyAll', () => {
    it('destroys all watches', async () => {
      const s1 = sinon.stub();
      const s2 = sinon.stub();
      registry.registerWatch({project: 'p1', environment: 'e', tailResult: createTailResult({stop: s1})});
      registry.registerWatch({project: 'p2', environment: 'e', tailResult: createTailResult({stop: s2})});
      await registry.destroyAll();
      expect(s1.calledOnce).to.be.true;
      expect(s2.calledOnce).to.be.true;
      expect(registry.listWatches()).to.deep.equal([]);
    });
  });
});
