/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {LogEntry, LogFile, TailLogsResult} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {LogWatchRegistry} from '../../../src/tools/diagnostics/log-watch-registry.js';

function createTailResult(overrides?: Partial<TailLogsResult>): TailLogsResult {
  return {
    stop: sinon.stub().resolves(),
    files: [],
    entries: [],
    done: Promise.resolve(),
    ...overrides,
  };
}

function makeEntry(message: string): LogEntry {
  return {file: 'error.log', message, raw: message, level: 'ERROR', timestamp: '2026-01-01 10:00:00.000 GMT'};
}

function makeFile(name: string): LogFile {
  return {name, prefix: 'error', size: 100, lastModified: new Date(), path: `/Logs/${name}`};
}

describe('LogWatchRegistry', () => {
  let registry: LogWatchRegistry;

  beforeEach(() => {
    registry = new LogWatchRegistry();
  });

  afterEach(async () => {
    await registry.destroyAll();
  });

  describe('registerWatch', () => {
    it('returns an entry with a UUID and metadata', () => {
      const tail = createTailResult();
      const entry = registry.registerWatch({
        hostname: 'host.example.com',
        prefixes: ['error'],
        tailResult: tail,
      });
      expect(entry.watchId).to.match(/^[\da-f-]{36}$/);
      expect(entry.hostname).to.equal('host.example.com');
      expect(entry.prefixes).to.deep.equal(['error']);
      expect(entry.buffer).to.deep.equal([]);
      expect(entry.stopped).to.be.false;
    });

    it('rejects duplicate hostname', () => {
      registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      expect(() => registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()})).to.throw(
        /already exists for h/,
      );
    });
  });

  describe('appendEntry', () => {
    it('buffers entries and updates totalEntriesSeen', () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendEntry(e.watchId, makeEntry('boom'));
      expect(e.buffer).to.have.lengthOf(1);
      expect(e.totalEntriesSeen).to.equal(1);
    });

    it('evicts oldest when over bufferCap and counts dropped', () => {
      const e = registry.registerWatch({
        hostname: 'h',
        prefixes: [],
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

    it('resolves pending poll waiters', async () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 5000);
      registry.appendEntry(e.watchId, makeEntry('x'));
      await wait;
    });

    it('evicts oldest when over byte cap and counts dropped', () => {
      // bufferBytesCap small enough that 2 entries exceed it, forcing eviction
      // even though the count cap is high.
      const big = 'x'.repeat(100);
      const e = registry.registerWatch({
        hostname: 'h',
        prefixes: [],
        tailResult: createTailResult(),
        bufferCap: 1000,
        bufferBytesCap: 250, // makeEntry raw+message ≈ 2*len; ~200 bytes each
      });
      registry.appendEntry(e.watchId, makeEntry(big));
      registry.appendEntry(e.watchId, makeEntry(big));
      registry.appendEntry(e.watchId, makeEntry(big));
      // Only the most recent entries that fit under the byte cap remain.
      expect(e.buffer.length).to.be.lessThan(3);
      expect(e.droppedEntries).to.be.greaterThan(0);
    });

    it('always keeps at least one entry even if it exceeds the byte cap', () => {
      const e = registry.registerWatch({
        hostname: 'h',
        prefixes: [],
        tailResult: createTailResult(),
        bufferBytesCap: 10,
      });
      registry.appendEntry(e.watchId, makeEntry('x'.repeat(10_000)));
      expect(e.buffer).to.have.lengthOf(1);
    });
  });

  describe('appendFileDiscovered', () => {
    it('dedups by name', () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendFileDiscovered(e.watchId, makeFile('error.log'));
      registry.appendFileDiscovered(e.watchId, makeFile('error.log'));
      expect(e.filesDiscovered).to.have.lengthOf(1);
    });

    it('reports each file once on poll but keeps the cumulative list', () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendFileDiscovered(e.watchId, makeFile('error-1.log'));
      // First drain returns the newly-discovered file.
      expect(registry.drain(e.watchId, 100).filesDiscovered.map((f) => f.name)).to.deep.equal(['error-1.log']);
      // Second drain (no new files) returns nothing — not the same file again.
      expect(registry.drain(e.watchId, 100).filesDiscovered).to.deep.equal([]);
      // A newly discovered file shows up on the next drain only.
      registry.appendFileDiscovered(e.watchId, makeFile('error-2.log'));
      expect(registry.drain(e.watchId, 100).filesDiscovered.map((f) => f.name)).to.deep.equal(['error-2.log']);
      // Cumulative list (used by logs_watch_list) still has both.
      expect(e.filesDiscovered.map((f) => f.name)).to.deep.equal(['error-1.log', 'error-2.log']);
    });
  });

  describe('appendError / appendRotation', () => {
    it('stores errors with timestamp', () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendError(e.watchId, new Error('nope'));
      expect(e.errors).to.have.lengthOf(1);
      expect(e.errors[0].message).to.equal('nope');
    });

    it('stores rotations and resolves waiters', async () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 5000);
      registry.appendRotation(e.watchId, makeFile('error.log'));
      await wait;
      expect(e.rotations).to.have.lengthOf(1);
    });
  });

  describe('drain', () => {
    it('removes drained entries and reports truncated', () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendEntry(e.watchId, makeEntry('a'));
      registry.appendEntry(e.watchId, makeEntry('b'));
      registry.appendEntry(e.watchId, makeEntry('c'));
      const result = registry.drain(e.watchId, 2);
      expect(result.entries.map((x) => x.message)).to.deep.equal(['a', 'b']);
      expect(result.truncated).to.be.true;
      expect(e.buffer).to.have.lengthOf(1);
    });

    it('drains rotations and errors', () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendRotation(e.watchId, makeFile('error.log'));
      registry.appendError(e.watchId, new Error('x'));
      const result = registry.drain(e.watchId, 100);
      expect(result.rotations).to.have.lengthOf(1);
      expect(result.errors).to.have.lengthOf(1);
      expect(e.rotations).to.have.lengthOf(0);
      expect(e.errors).to.have.lengthOf(0);
    });
  });

  describe('waitForActivity', () => {
    it('returns immediately if buffer non-empty', async () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      registry.appendEntry(e.watchId, makeEntry('x'));
      const start = Date.now();
      await registry.waitForActivity(e.watchId, 10_000);
      expect(Date.now() - start).to.be.lessThan(50);
    });

    it('resolves on timeout when no activity', async () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      const start = Date.now();
      await registry.waitForActivity(e.watchId, 50);
      expect(Date.now() - start).to.be.at.least(40);
    });
  });

  describe('destroyWatch', () => {
    it('calls stop and removes the entry', async () => {
      const stop = sinon.stub().resolves();
      const e = registry.registerWatch({
        hostname: 'h',
        prefixes: [],
        tailResult: createTailResult({stop}),
      });
      await registry.destroyWatch(e.watchId);
      expect(stop.calledOnce).to.be.true;
      expect(registry.getWatch(e.watchId)).to.be.undefined;
    });

    it('resolves pending waiters during destroy', async () => {
      const e = registry.registerWatch({hostname: 'h', prefixes: [], tailResult: createTailResult()});
      const wait = registry.waitForActivity(e.watchId, 10_000);
      await registry.destroyWatch(e.watchId);
      await wait; // should resolve, not hang
    });

    it('swallows stop errors', async () => {
      const e = registry.registerWatch({
        hostname: 'h',
        prefixes: [],
        tailResult: createTailResult({stop: sinon.stub().rejects(new Error('boom'))}),
      });
      await registry.destroyWatch(e.watchId); // should not throw
    });

    it('is a no-op for unknown id', async () => {
      await registry.destroyWatch('nonexistent');
    });
  });

  describe('getWatchOrThrow', () => {
    it('throws for unknown watchId', () => {
      expect(() => registry.getWatchOrThrow('nope')).to.throw(/No log watch found/);
    });
  });

  describe('cleanupIdleWatches', () => {
    it('destroys idle watches past TTL', async () => {
      const stop = sinon.stub().resolves();
      const e = registry.registerWatch({
        hostname: 'h',
        prefixes: [],
        tailResult: createTailResult({stop}),
      });
      e.lastActivityAt = Date.now() - 31 * 60 * 1000;
      await (registry as unknown as {cleanupIdleWatches: () => Promise<void>}).cleanupIdleWatches();
      expect(registry.getWatch(e.watchId)).to.be.undefined;
      expect(stop.calledOnce).to.be.true;
    });
  });

  describe('destroyAll', () => {
    it('destroys all watches', async () => {
      const s1 = sinon.stub().resolves();
      const s2 = sinon.stub().resolves();
      registry.registerWatch({hostname: 'h1', prefixes: [], tailResult: createTailResult({stop: s1})});
      registry.registerWatch({hostname: 'h2', prefixes: [], tailResult: createTailResult({stop: s2})});
      await registry.destroyAll();
      expect(s1.calledOnce).to.be.true;
      expect(s2.calledOnce).to.be.true;
      expect(registry.listWatches()).to.deep.equal([]);
    });
  });
});
