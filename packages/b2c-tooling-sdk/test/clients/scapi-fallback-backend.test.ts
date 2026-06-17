/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {createFallbackBackend} from '../../src/clients/scapi-fallback-backend.js';
import {ScapiCapabilityUnsupportedError} from '../../src/clients/scapi-backend-utils.js';

interface TestBackend {
  readonly name: 'ocapi' | 'scapi';
  doRead(): Promise<string>;
  doWrite(input: string): Promise<void>;
  multiArg(a: string, b: number, c?: boolean): Promise<string>;
}

function makeBackend(name: 'ocapi' | 'scapi', impl: Partial<TestBackend>): TestBackend {
  return {
    name,
    doRead: impl.doRead ?? (async () => `${name}-read`),
    doWrite: impl.doWrite ?? (async () => undefined),
    multiArg: impl.multiArg ?? (async (a, b, c) => `${name}:${a}:${b}:${c}`),
  };
}

const invalidScopeError = () => new Error('Failed to get access token: 400 invalid_scope');

describe('createFallbackBackend', () => {
  describe('happy path: SCAPI works', () => {
    it('returns SCAPI result on first call and caches the choice', async () => {
      let scapiCalls = 0;
      let ocapiCalls = 0;
      const scapi = makeBackend('scapi', {
        doRead: async () => {
          scapiCalls++;
          return 'scapi-read';
        },
      });
      const ocapi = makeBackend('ocapi', {
        doRead: async () => {
          ocapiCalls++;
          return 'ocapi-read';
        },
      });

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      expect(await backend.doRead()).to.equal('scapi-read');
      expect(await backend.doRead()).to.equal('scapi-read');
      expect(scapiCalls).to.equal(2);
      expect(ocapiCalls).to.equal(0);
    });

    it('reflects scapi.name before any call resolves and after success', async () => {
      const scapi = makeBackend('scapi', {});
      const ocapi = makeBackend('ocapi', {});

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      expect(backend.name).to.equal('scapi');
      await backend.doRead();
      expect(backend.name).to.equal('scapi');
    });
  });

  describe('fallback path: SCAPI fails with invalid_scope', () => {
    it('falls back to OCAPI and caches the choice', async () => {
      let scapiCalls = 0;
      let ocapiCalls = 0;
      const scapi = makeBackend('scapi', {
        doRead: async () => {
          scapiCalls++;
          throw invalidScopeError();
        },
      });
      const ocapi = makeBackend('ocapi', {
        doRead: async () => {
          ocapiCalls++;
          return 'ocapi-read';
        },
      });

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      expect(await backend.doRead()).to.equal('ocapi-read');
      expect(await backend.doRead()).to.equal('ocapi-read');
      // SCAPI tried once on the first call; OCAPI handles all subsequent
      expect(scapiCalls).to.equal(1);
      expect(ocapiCalls).to.equal(2);
    });

    it('reflects ocapi.name after fallback', async () => {
      const scapi = makeBackend('scapi', {
        doRead: async () => {
          throw invalidScopeError();
        },
      });
      const ocapi = makeBackend('ocapi', {});

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      expect(backend.name).to.equal('scapi');
      await backend.doRead();
      expect(backend.name).to.equal('ocapi');
    });

    it('routes a different method to the cached OCAPI backend after fallback', async () => {
      let ocapiWriteCalls = 0;
      const scapi = makeBackend('scapi', {
        doRead: async () => {
          throw invalidScopeError();
        },
        doWrite: async () => {
          throw new Error('SCAPI doWrite should not be called after fallback');
        },
      });
      const ocapi = makeBackend('ocapi', {
        doRead: async () => 'ocapi-read',
        doWrite: async () => {
          ocapiWriteCalls++;
        },
      });

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      await backend.doRead();
      await backend.doWrite('payload');
      expect(ocapiWriteCalls).to.equal(1);
    });
  });

  describe('fallback after SCAPI was pinned by a prior success', () => {
    it('falls back to OCAPI when a later SCAPI call hits a capability gap', async () => {
      // Simulates: read succeeds under SCAPI → wrapper pins SCAPI → write
      // fails because the scope tier downgraded to read-only → wrapper must
      // still route the write through OCAPI rather than propagating.
      let scapiWriteCalls = 0;
      let ocapiWriteCalls = 0;
      const scapi = makeBackend('scapi', {
        doRead: async () => 'scapi-read',
        doWrite: async () => {
          scapiWriteCalls++;
          throw new ScapiCapabilityUnsupportedError('downgraded to read-only');
        },
      });
      const ocapi = makeBackend('ocapi', {
        doWrite: async () => {
          ocapiWriteCalls++;
        },
      });

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      // First call resolves to SCAPI.
      expect(await backend.doRead()).to.equal('scapi-read');
      expect(backend.name).to.equal('scapi');

      // Write hits a capability gap under SCAPI; wrapper routes to OCAPI.
      await backend.doWrite('payload');
      expect(scapiWriteCalls).to.equal(1);
      expect(ocapiWriteCalls).to.equal(1);
      expect(backend.name).to.equal('ocapi');
    });
  });

  describe('non-fallback errors', () => {
    it('rethrows non-invalid_scope errors without falling back', async () => {
      const scapi = makeBackend('scapi', {
        doRead: async () => {
          throw new Error('something else broke');
        },
      });
      const ocapi = makeBackend('ocapi', {
        doRead: async () => 'should-not-reach-this',
      });

      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');
      try {
        await backend.doRead();
        expect.fail('should have thrown');
      } catch (e) {
        expect((e as Error).message).to.equal('something else broke');
      }
      // Subsequent calls still try SCAPI since fallback didn't trigger
      expect(backend.name).to.equal('scapi');
    });
  });

  describe('argument forwarding', () => {
    it('forwards positional and optional args correctly', async () => {
      const scapi = makeBackend('scapi', {});
      const ocapi = makeBackend('ocapi', {});
      const backend = createFallbackBackend<TestBackend>(scapi, ocapi, 'test');

      expect(await backend.multiArg('x', 7, true)).to.equal('scapi:x:7:true');
      expect(await backend.multiArg('y', 0)).to.equal('scapi:y:0:undefined');
    });
  });

  describe('property access', () => {
    it('returns non-method properties from the SCAPI target', () => {
      const scapi = {...makeBackend('scapi', {}), customProp: 'scapi-value'};
      const ocapi = {...makeBackend('ocapi', {}), customProp: 'ocapi-value'};
      const backend = createFallbackBackend<TestBackend & {customProp: string}>(scapi, ocapi, 'test');
      // Documented contract: non-method properties are not switched between backends
      expect(backend.customProp).to.equal('scapi-value');
    });
  });

  describe('SCAPI-only methods (capability extension)', () => {
    interface ExtendedBackend extends TestBackend {
      scapiOnlyMethod(): Promise<string>;
    }

    it('routes SCAPI-only methods directly to SCAPI without attempting fallback', async () => {
      let scapiCalls = 0;
      const scapi: ExtendedBackend = {
        ...makeBackend('scapi', {}),
        scapiOnlyMethod: async () => {
          scapiCalls++;
          return 'scapi-only-result';
        },
      };
      const ocapi = makeBackend('ocapi', {}); // no scapiOnlyMethod

      const backend = createFallbackBackend<ExtendedBackend>(scapi, ocapi as ExtendedBackend, 'test');
      expect(await backend.scapiOnlyMethod()).to.equal('scapi-only-result');
      expect(scapiCalls).to.equal(1);
    });

    it('does not fall back on invalid_scope for SCAPI-only methods', async () => {
      const scapi: ExtendedBackend = {
        ...makeBackend('scapi', {}),
        scapiOnlyMethod: async () => {
          throw invalidScopeError();
        },
      };
      const ocapi = makeBackend('ocapi', {}); // no scapiOnlyMethod

      const backend = createFallbackBackend<ExtendedBackend>(scapi, ocapi as ExtendedBackend, 'test');
      try {
        await backend.scapiOnlyMethod();
        expect.fail('should have thrown');
      } catch (e) {
        // Should be the original invalid_scope error, not a "method not found" error
        expect((e as Error).message).to.include('invalid_scope');
      }
    });
  });
});
