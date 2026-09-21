/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {ScapiRequestError} from '../../../src/clients/scapi-backend-utils.js';
import {resolveMrtBackend, runMrtWithFallback, type MrtBackend} from '../../../src/operations/mrt/mrt-backend.js';

describe('operations/mrt/mrt-backend', () => {
  describe('resolveMrtBackend', () => {
    it('legacy preference always resolves to legacy', () => {
      expect(resolveMrtBackend({preference: 'legacy', hasScapiConfig: true})).to.equal('legacy');
      expect(resolveMrtBackend({preference: 'legacy', hasScapiConfig: false})).to.equal('legacy');
    });

    it('scapi preference resolves to scapi when config is present', () => {
      expect(resolveMrtBackend({preference: 'scapi', hasScapiConfig: true})).to.equal('scapi');
    });

    it('scapi preference throws when config is missing', () => {
      expect(() => resolveMrtBackend({preference: 'scapi', hasScapiConfig: false})).to.throw(
        /SCAPI MRT backend requires/,
      );
    });

    it('auto resolves to scapi when config is present, else legacy', () => {
      expect(resolveMrtBackend({preference: 'auto', hasScapiConfig: true})).to.equal('scapi');
      expect(resolveMrtBackend({preference: 'auto', hasScapiConfig: false})).to.equal('legacy');
    });
  });

  describe('runMrtWithFallback', () => {
    /** Records which branches ran, in order. */
    function makeBranches(overrides?: {scapi?: () => Promise<string>; legacy?: () => Promise<string>}) {
      const calls: string[] = [];
      const branches = {
        scapi:
          overrides?.scapi ??
          (async () => {
            calls.push('scapi');
            return 'scapi-result';
          }),
        legacy:
          overrides?.legacy ??
          (async () => {
            calls.push('legacy');
            return 'legacy-result';
          }),
      };
      return {calls, branches};
    }

    it('legacy preference runs the legacy branch only', async () => {
      const {calls, branches} = makeBranches();
      const run = await runMrtWithFallback({preference: 'legacy', hasScapiConfig: true}, branches);
      expect(run.backend).to.equal('legacy');
      expect(run.value).to.equal('legacy-result');
      expect(calls).to.deep.equal(['legacy']);
    });

    it('auto with no SCAPI config runs legacy without attempting SCAPI', async () => {
      const {calls, branches} = makeBranches();
      const run = await runMrtWithFallback({preference: 'auto', hasScapiConfig: false}, branches);
      expect(run.backend).to.equal('legacy');
      expect(calls).to.deep.equal(['legacy']);
    });

    it('auto with SCAPI config prefers SCAPI on success (legacy never runs)', async () => {
      const {calls, branches} = makeBranches();
      const run = await runMrtWithFallback({preference: 'auto', hasScapiConfig: true}, branches);
      expect(run.backend).to.equal('scapi');
      expect(run.value).to.equal('scapi-result');
      expect(calls).to.deep.equal(['scapi']);
    });

    it('explicit scapi runs SCAPI with no fallback (safe status still propagates)', async () => {
      const {calls, branches} = makeBranches({
        scapi: async () => {
          throw new ScapiRequestError('not found', 404);
        },
      });
      let threw: unknown;
      try {
        await runMrtWithFallback({preference: 'scapi', hasScapiConfig: true}, branches);
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect(calls).to.not.include('legacy');
    });

    it('auto falls back to legacy on a safe client-error status, invoking onFallback', async () => {
      const {calls, branches} = makeBranches({
        scapi: async () => {
          calls.push('scapi');
          throw new ScapiRequestError('bad request', 400);
        },
      });
      const fallbackReasons: string[] = [];
      const resolved: MrtBackend[] = [];
      const run = await runMrtWithFallback(
        {
          preference: 'auto',
          hasScapiConfig: true,
          onFallback: (reason) => fallbackReasons.push(reason),
          onResolve: (backend) => resolved.push(backend),
        },
        branches,
      );
      expect(run.backend).to.equal('legacy');
      expect(run.value).to.equal('legacy-result');
      expect(calls).to.deep.equal(['scapi', 'legacy']);
      expect(fallbackReasons).to.have.length(1);
      expect(fallbackReasons[0]).to.include('bad request');
      expect(resolved).to.deep.equal(['scapi', 'legacy']);
    });

    it('auto falls back on an invalid_scope error', async () => {
      const {calls, branches} = makeBranches({
        scapi: async () => {
          calls.push('scapi');
          throw new Error('Failed to get access token: 400 invalid_scope');
        },
      });
      const run = await runMrtWithFallback({preference: 'auto', hasScapiConfig: true}, branches);
      expect(run.backend).to.equal('legacy');
      expect(calls).to.deep.equal(['scapi', 'legacy']);
    });

    it('auto rethrows the SCAPI error (never runs legacy) when there is no legacy fallback target', async () => {
      // A safe status (403) that would normally fall back — but with no legacy
      // credentials the legacy branch would only throw a misleading "provide an
      // API key" error, burying the real SCAPI failure the user must fix.
      const {calls, branches} = makeBranches({
        scapi: async () => {
          calls.push('scapi');
          throw new ScapiRequestError('forbidden', 403);
        },
      });
      const fallbackReasons: string[] = [];
      let threw: unknown;
      try {
        await runMrtWithFallback(
          {
            preference: 'auto',
            hasScapiConfig: true,
            canFallbackToLegacy: false,
            onFallback: (reason) => fallbackReasons.push(reason),
          },
          branches,
        );
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(403);
      expect(calls).to.deep.equal(['scapi']);
      expect(fallbackReasons).to.have.length(0);
    });

    for (const status of [429, 500, 503]) {
      it(`auto does NOT fall back on an ambiguous ${status} status`, async () => {
        const {calls, branches} = makeBranches({
          scapi: async () => {
            calls.push('scapi');
            throw new ScapiRequestError('ambiguous', status);
          },
        });
        let threw: unknown;
        try {
          await runMrtWithFallback({preference: 'auto', hasScapiConfig: true}, branches);
        } catch (error) {
          threw = error;
        }
        expect(threw).to.be.instanceOf(ScapiRequestError);
        expect(calls).to.deep.equal(['scapi']);
      });
    }

    it('auto does NOT fall back on 409 Conflict (a create must not cross backends)', async () => {
      const {calls, branches} = makeBranches({
        scapi: async () => {
          calls.push('scapi');
          throw new ScapiRequestError('conflict', 409);
        },
      });
      let threw: unknown;
      try {
        await runMrtWithFallback({preference: 'auto', hasScapiConfig: true}, branches);
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect(calls).to.deep.equal(['scapi']);
    });

    it('auto does NOT fall back on a raw network error', async () => {
      const {calls, branches} = makeBranches({
        scapi: async () => {
          calls.push('scapi');
          throw new TypeError('fetch failed');
        },
      });
      let threw: unknown;
      try {
        await runMrtWithFallback({preference: 'auto', hasScapiConfig: true}, branches);
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(TypeError);
      expect(calls).to.deep.equal(['scapi']);
    });
  });
});
