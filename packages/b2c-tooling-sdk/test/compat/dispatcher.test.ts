/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {BackendDispatcher} from '../../src/compat/dispatcher.js';

interface FakeOps {
  doRead(): Promise<string>;
}

const makeOps = (): FakeOps => ({doRead: async () => 'scapi-result'});

const invalidScopeError = () => new Error('Failed to get access token: 400 invalid_scope');

describe('BackendDispatcher', () => {
  describe('preference handling', () => {
    it('throws when scapi is forced but not configured', () => {
      expect(() => new BackendDispatcher<FakeOps>('scapi', () => undefined, 'jobs')).to.throw(
        /shortCode, tenantId, and OAuth/,
      );
    });

    it('resolves to ocapi immediately when forced', () => {
      const d = new BackendDispatcher<FakeOps>('ocapi', () => makeOps(), 'jobs');
      expect(d.active).to.equal('ocapi');
    });

    it('resolves to scapi when forced and configured', () => {
      const d = new BackendDispatcher<FakeOps>('scapi', () => makeOps(), 'jobs');
      expect(d.active).to.equal('scapi');
    });

    it('resolves to ocapi in auto when scapi not configured', () => {
      const d = new BackendDispatcher<FakeOps>('auto', () => undefined, 'jobs');
      expect(d.active).to.equal('ocapi');
    });

    it('stays unresolved in auto when scapi configured', () => {
      const d = new BackendDispatcher<FakeOps>('auto', () => makeOps(), 'jobs');
      expect(d.active).to.equal(undefined);
    });
  });

  describe('run', () => {
    it('routes to scapi branch and caches the choice', async () => {
      const ops = makeOps();
      const d = new BackendDispatcher<FakeOps>('auto', () => ops, 'jobs');
      let scapiCalls = 0;
      const branches = {
        scapi: async (received: FakeOps) => {
          expect(received).to.equal(ops);
          scapiCalls++;
          return 'scapi';
        },
        ocapi: async () => 'ocapi',
      };
      expect(await d.run(branches)).to.equal('scapi');
      expect(await d.run(branches)).to.equal('scapi');
      expect(scapiCalls).to.equal(2);
      expect(d.active).to.equal('scapi');
    });

    it('falls back to ocapi on invalid_scope and caches the choice', async () => {
      let scapiCalls = 0;
      let ocapiCalls = 0;
      const d = new BackendDispatcher<FakeOps>('auto', () => makeOps(), 'jobs');
      const branches = {
        scapi: async () => {
          scapiCalls++;
          throw invalidScopeError();
        },
        ocapi: async () => {
          ocapiCalls++;
          return 'ocapi';
        },
      };
      expect(await d.run(branches)).to.equal('ocapi');
      expect(await d.run(branches)).to.equal('ocapi');
      expect(scapiCalls).to.equal(1);
      expect(ocapiCalls).to.equal(2);
      expect(d.active).to.equal('ocapi');
    });

    it('rethrows non-invalid_scope errors without falling back', async () => {
      const d = new BackendDispatcher<FakeOps>('auto', () => makeOps(), 'jobs');
      try {
        await d.run({
          scapi: async () => {
            throw new Error('something else broke');
          },
          ocapi: async () => 'should-not-reach',
        });
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.equal('something else broke');
      }
      // Did NOT cache scapi (the call did not succeed) — but also didn't cache ocapi.
      expect(d.active).to.equal(undefined);
    });

    it('routes directly to ocapi when forced', async () => {
      const d = new BackendDispatcher<FakeOps>('ocapi', () => makeOps(), 'jobs');
      let scapiCalls = 0;
      let ocapiCalls = 0;
      await d.run({
        scapi: async () => {
          scapiCalls++;
          return 's';
        },
        ocapi: async () => {
          ocapiCalls++;
          return 'o';
        },
      });
      expect(scapiCalls).to.equal(0);
      expect(ocapiCalls).to.equal(1);
    });
  });
});
