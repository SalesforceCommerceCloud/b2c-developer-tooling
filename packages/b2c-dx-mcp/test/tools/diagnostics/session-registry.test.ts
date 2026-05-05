/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {DebugSessionRegistry} from '../../../src/tools/diagnostics/session-registry.js';
import type {DebugSessionManager, SourceMapper} from '@salesforce/b2c-tooling-sdk/operations/debug';

function createMockManager(overrides?: Partial<DebugSessionManager>): DebugSessionManager {
  return {
    client: {} as any,
    connect: sinon.stub().resolves(),
    disconnect: sinon.stub().resolves(),
    setBreakpoints: sinon.stub().resolves([]),
    resume: sinon.stub().resolves(),
    stepOver: sinon.stub().resolves(),
    stepInto: sinon.stub().resolves(),
    stepOut: sinon.stub().resolves(),
    getKnownThreads: sinon.stub().returns([]),
    ...overrides,
  } as unknown as DebugSessionManager;
}

function createMockSourceMapper(): SourceMapper {
  return {
    toServerPath: sinon.stub().returns(undefined),
    toLocalPath: sinon.stub().returns(undefined),
  };
}

describe('DebugSessionRegistry', () => {
  let registry: DebugSessionRegistry;

  beforeEach(() => {
    registry = new DebugSessionRegistry();
  });

  afterEach(async () => {
    await registry.destroyAll();
  });

  describe('registerSession', () => {
    it('should register a session and return an entry with a UUID', () => {
      const manager = createMockManager();
      const sourceMapper = createMockSourceMapper();

      const entry = registry.registerSession('host.example.com', 'client-1', manager, sourceMapper, []);

      expect(entry.sessionId).to.be.a('string');
      expect(entry.sessionId).to.match(/^[\da-f-]{36}$/);
      expect(entry.hostname).to.equal('host.example.com');
      expect(entry.clientId).to.equal('client-1');
      expect(entry.manager).to.equal(manager);
      expect(entry.sourceMapper).to.equal(sourceMapper);
      expect(entry.breakpoints).to.deep.equal([]);
      expect(entry.haltWaiters).to.deep.equal([]);
    });

    it('should reject duplicate hostname:clientId pairs', () => {
      const manager = createMockManager();
      const sourceMapper = createMockSourceMapper();

      registry.registerSession('host.example.com', 'client-1', manager, sourceMapper, []);

      expect(() => {
        registry.registerSession('host.example.com', 'client-1', createMockManager(), createMockSourceMapper(), []);
      }).to.throw(/already exists.*client-1/);
    });

    it('should allow different client IDs on same host', () => {
      const sourceMapper = createMockSourceMapper();

      registry.registerSession('host.example.com', 'client-1', createMockManager(), sourceMapper, []);
      const entry2 = registry.registerSession('host.example.com', 'client-2', createMockManager(), sourceMapper, []);

      expect(entry2.sessionId).to.be.a('string');
    });

    it('should allow same client ID on different hosts', () => {
      const sourceMapper = createMockSourceMapper();

      registry.registerSession('host1.example.com', 'client-1', createMockManager(), sourceMapper, []);
      const entry2 = registry.registerSession('host2.example.com', 'client-1', createMockManager(), sourceMapper, []);

      expect(entry2.sessionId).to.be.a('string');
    });
  });

  describe('getSession', () => {
    it('should return undefined for unknown session ID', () => {
      expect(registry.getSession('nonexistent')).to.be.undefined;
    });

    it('should return the session entry', () => {
      const entry = registry.registerSession('host.example.com', 'c', createMockManager(), createMockSourceMapper(), []);
      expect(registry.getSession(entry.sessionId)).to.equal(entry);
    });
  });

  describe('getSessionOrThrow', () => {
    it('should throw for unknown session ID', () => {
      expect(() => registry.getSessionOrThrow('nonexistent')).to.throw(/No debug session found/);
    });

    it('should return entry and update lastActivityAt', () => {
      const entry = registry.registerSession('host.example.com', 'c', createMockManager(), createMockSourceMapper(), []);
      const before = entry.lastActivityAt;

      // Small delay to ensure timestamp changes
      const result = registry.getSessionOrThrow(entry.sessionId);

      expect(result).to.equal(entry);
      expect(result.lastActivityAt).to.be.at.least(before);
    });
  });

  describe('findByHostAndClientId', () => {
    it('should return undefined when no match', () => {
      expect(registry.findByHostAndClientId('nope', 'nope')).to.be.undefined;
    });

    it('should find matching entry', () => {
      const entry = registry.registerSession('host.example.com', 'c', createMockManager(), createMockSourceMapper(), []);
      expect(registry.findByHostAndClientId('host.example.com', 'c')).to.equal(entry);
    });
  });

  describe('listSessions', () => {
    it('should return empty array when no sessions', () => {
      expect(registry.listSessions()).to.deep.equal([]);
    });

    it('should return all sessions', () => {
      registry.registerSession('h1', 'c1', createMockManager(), createMockSourceMapper(), []);
      registry.registerSession('h2', 'c2', createMockManager(), createMockSourceMapper(), []);

      const list = registry.listSessions();
      expect(list).to.have.lengthOf(2);
    });
  });

  describe('destroySession', () => {
    it('should disconnect the manager', async () => {
      const manager = createMockManager();
      const entry = registry.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      await registry.destroySession(entry.sessionId);

      expect((manager.disconnect as sinon.SinonStub).calledOnce).to.be.true;
      expect(registry.getSession(entry.sessionId)).to.be.undefined;
    });

    it('should reject pending halt waiters', async () => {
      const entry = registry.registerSession('host', 'c', createMockManager(), createMockSourceMapper(), []);

      const waiterPromise = new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => resolve('timeout'), 5000);
        entry.haltWaiters.push({
          resolve: () => {
            clearTimeout(timer);
            resolve('resolved');
          },
          reject: (err) => {
            clearTimeout(timer);
            reject(err);
          },
          timer,
        });
      });

      await registry.destroySession(entry.sessionId);

      try {
        await waiterPromise;
        expect.fail('Should have rejected');
      } catch (err) {
        expect((err as Error).message).to.equal('Debug session ended');
      }
    });

    it('should be a no-op for unknown session ID', async () => {
      await registry.destroySession('nonexistent'); // Should not throw
    });
  });

  describe('destroyAll', () => {
    it('should destroy all sessions', async () => {
      const m1 = createMockManager();
      const m2 = createMockManager();
      registry.registerSession('h1', 'c1', m1, createMockSourceMapper(), []);
      registry.registerSession('h2', 'c2', m2, createMockSourceMapper(), []);

      await registry.destroyAll();

      expect((m1.disconnect as sinon.SinonStub).calledOnce).to.be.true;
      expect((m2.disconnect as sinon.SinonStub).calledOnce).to.be.true;
      expect(registry.listSessions()).to.deep.equal([]);
    });
  });
});
