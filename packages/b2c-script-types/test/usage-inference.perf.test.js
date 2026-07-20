/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');
const {describe, it} = require('node:test');

const ts = require('typescript');

const {
  createInferenceContext,
  describeTypes,
  inferParameterType,
  inferReturnType,
} = require('../plugin/usage-inference');
const init = require('../plugin/index');
const {
  createFixtureHost,
  createFixtureLanguageService,
  findFunctionDeclaration,
} = require('./helpers/fixture-language-service');

// ---------------------------------------------------------------------------
// Performance baselines.
//
// The engine runs synchronously inside tsserver on every hover/completion
// keystroke, so its worst-case cost has to stay bounded. The dominant cost by
// far is languageService.getReferencesAtPosition — a project-wide scan per
// call — so the STRICT baselines below are deterministic *counters* of how
// many such searches a pathological input may trigger. Counters don't flake
// on slow CI runners and pinpoint exactly which cap stopped working.
//
// The wall-clock ceilings are deliberately generous (they'd pass on a very
// slow machine) and exist only as tripwires for catastrophic regressions —
// an accidental exponential blowup, a lost cap, an infinite loop that the
// counters can't see. If one of these fails, the engine got MUCH slower, not
// slightly slower. Do not "fix" a failure by raising a ceiling without
// understanding which bound was lost.
// ---------------------------------------------------------------------------
const WALL_CLOCK_CEILING_MS = 5000;

// Baseline: how many reference searches each scenario is allowed to trigger.
// These trace directly to the engine's caps (MAX_REFERENCES_PER_CALL,
// MAX_REFERENCE_HOPS, MAX_CHAIN_HOPS, MAX_INFERENCE_DEPTH, request memo).
const BASELINE = {
  // One search from the function name plus at most a couple of indirection
  // hops (export binding / property name) — independent of call-site count.
  widelyReferencedHelper: 4,
  // The chain cap aborts before ever reaching the parameter at the receiver
  // end, so an overlong method chain must trigger NO reference search.
  overlongMethodChain: 0,
  // A no-parameter helper chain is resolved natively by TypeScript — the
  // engine's direct-type check returns it without any search.
  nativeHelperChain: 0,
  // Return-direction chasing of a parameter-forwarding chain is bounded by
  // the depth cap without any search; parameter-direction chasing performs
  // one small search cluster per in-cap level.
  deepForwardingChainReturns: 0,
  deepForwardingChainParam: 6,
  // Twenty sibling branches through the same sub-helper must share ONE
  // memoized search set, not repeat it per branch.
  wideFanOutMemoized: 4,
  // A repeated identical request at the same project version must be served
  // entirely from the plugin's position cache.
  repeatedHoverCached: 0,
};

/**
 * Wraps a LanguageService so every getReferencesAtPosition call is counted —
 * the deterministic cost proxy the baselines assert on.
 */
function withReferenceCounter(languageService) {
  let count = 0;
  const proxy = new Proxy(languageService, {
    get(target, prop) {
      if (prop === 'getReferencesAtPosition') {
        return (...args) => {
          count++;
          return target.getReferencesAtPosition(...args);
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return {languageService: proxy, referenceSearches: () => count, reset: () => (count = 0)};
}

function timed(fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  return {result, elapsedMs};
}

describe('usage-inference — performance baselines', () => {
  it(`caps the cost of a widely-referenced helper (300 call sites, <= ${BASELINE.widelyReferencedHelper} searches)`, () => {
    const callSites = Array.from({length: 300}, () => 'helper(getProduct());').join('\n');
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/helper.js': `
        function helper(product) {
          return product.ID;
        }
        ${callSites}
        module.exports = {helper};
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/helper.js'), 'helper');

    const {result: types, elapsedMs} = timed(() => inferParameterType(ctx, fn.parameters[0]));

    // Correctness must survive the cap: the first <=50 processed references
    // are more than enough to type this parameter.
    assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    assert.ok(
      counter.referenceSearches() <= BASELINE.widelyReferencedHelper,
      `expected <= ${BASELINE.widelyReferencedHelper} reference searches, got ${counter.referenceSearches()}`,
    );
    // The per-call reference budget must actually engage.
    const spent = 200 - ctx.referenceBudget;
    assert.ok(spent <= 50, `expected the per-call cap (50) to bound processed references, spent ${spent}`);
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it('aborts an overlong method chain before any reference search', () => {
    const chain = '.next()'.repeat(60);
    const files = {
      '/types.d.ts': `
        interface Chainable { next(): Chainable; value: string; }
        declare function getChainable(): Chainable;
      `,
      '/chain.js': `
        function resolveChain(x) {
          return x${chain}.value;
        }
        function useHelper() { return resolveChain(getChainable()); }
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/chain.js'), 'resolveChain');

    const {result: types, elapsedMs} = timed(() => inferReturnType(ctx, fn));

    assert.equal(types.length, 0);
    assert.equal(
      counter.referenceSearches(),
      BASELINE.overlongMethodChain,
      'the chain cap must fire before the receiver parameter is ever reference-searched',
    );
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it("delegates a no-parameter helper chain to TypeScript's own inference (0 searches)", () => {
    // h1() -> h2() -> ... -> h12() -> getProduct(): with no implicit-any
    // parameters involved, TypeScript resolves the whole chain natively and
    // the engine's direct-type check returns it without any work of its own.
    const helpers = Array.from(
      {length: 12},
      (_, i) => `function h${i + 1}() { return ${i + 1 < 12 ? `h${i + 2}()` : 'getProduct()'}; }`,
    ).join('\n');
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/deep.js': `${helpers}\nmodule.exports = {h1};`,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/deep.js'), 'h1');

    const {result: types, elapsedMs} = timed(() => inferReturnType(ctx, fn));

    assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    assert.equal(counter.referenceSearches(), BASELINE.nativeHelperChain);
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it('bounds a 12-level parameter-forwarding chain by the depth cap, in both directions', () => {
    // f1(x) -> f2(x) -> ... -> f12(x) -> x: parameters are implicit any, so
    // TypeScript can't resolve this natively — the engine's own caps are all
    // that bounds the cost, and it must stay flat no matter how deep the
    // forwarding stack goes.
    const N = 12;
    const helpers = Array.from({length: N}, (_, i) => {
      const n = i + 1;
      return n < N ? `function f${n}(x) { return f${n + 1}(x); }` : `function f${n}(x) { return x; }`;
    }).join('\n');
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/deep.js': `${helpers}\nf1(getProduct());\nmodule.exports = {f1};`,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);

    // Return direction (hover on f1): the depth cap truncates before the
    // chain's deep end ever resolves a parameter, so no search happens.
    const ctx = createInferenceContext(ts, counter.languageService);
    const sourceFile = ctx.program.getSourceFile('/deep.js');
    const {result: returnTypes, elapsedMs: returnMs} = timed(() =>
      inferReturnType(ctx, findFunctionDeclaration(sourceFile, 'f1')),
    );
    assert.equal(returnTypes.length, 0, 'truncated by the depth cap — flat cost regardless of chain length');
    assert.equal(counter.referenceSearches(), BASELINE.deepForwardingChainReturns);
    assert.ok(returnMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(returnMs)}ms`);

    // Parameter direction (hover on f12's x): each in-cap level costs one
    // small reference-search cluster, then the depth cap stops the climb.
    counter.reset();
    const ctx2 = createInferenceContext(ts, counter.languageService);
    const {elapsedMs: paramMs} = timed(() =>
      inferParameterType(ctx2, findFunctionDeclaration(sourceFile, 'f12').parameters[0]),
    );
    assert.ok(
      counter.referenceSearches() <= BASELINE.deepForwardingChainParam,
      `expected <= ${BASELINE.deepForwardingChainParam} searches from the deep end, got ${counter.referenceSearches()}`,
    );
    assert.ok(paramMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(paramMs)}ms`);
  });

  it(`memoizes a shared sub-helper across 20 sibling branches (<= ${BASELINE.wideFanOutMemoized} searches total)`, () => {
    const branches = Array.from({length: 20}, (_, i) => `if (mode === ${i}) { return shared(getProduct()); }`).join(
      '\n          ',
    );
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/fanout.js': `
        function shared(x) {
          return x;
        }
        function caller(mode) {
          ${branches}
          return null;
        }
        shared(getProduct());
        module.exports = {caller, shared};
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/fanout.js'), 'caller');

    const {result: types, elapsedMs} = timed(() => inferReturnType(ctx, fn));

    assert.ok(describeTypes(ctx.checker, types).includes('ID'), 'fan-out must still infer the shared type');
    assert.ok(
      counter.referenceSearches() <= BASELINE.wideFanOutMemoized,
      `expected the request memo to collapse 20 branches into <= ${BASELINE.wideFanOutMemoized} searches, got ${counter.referenceSearches()}`,
    );
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it('serves a repeated identical hover from the position cache (0 new searches at the same project version)', () => {
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/helper.js': `
        function helper(product) {
          return product.ID;
        }
        helper(getProduct());
        module.exports = {helper};
      `,
    };
    const host = createFixtureHost(files);
    const baseLs = ts.createLanguageService(host, ts.createDocumentRegistry());
    const counter = withReferenceCounter(baseLs);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService: counter.languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: [{name: 'c', src: '/'}], inferUsage: true},
    });
    const paramPos = files['/helper.js'].indexOf('product)');

    const first = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    assert.ok((first?.documentation ?? []).some((p) => p.text.includes('Inferred from usage')));
    counter.reset();

    const {result: second, elapsedMs} = timed(() => proxy.getQuickInfoAtPosition('/helper.js', paramPos));

    assert.ok((second?.documentation ?? []).some((p) => p.text.includes('Inferred from usage')));
    assert.equal(
      counter.referenceSearches(),
      BASELINE.repeatedHoverCached,
      'an unchanged project version must be served from the inference cache without re-searching',
    );
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it('terminates promptly on mutual recursion combined with heavy call-site fan-in', () => {
    // Worst of both worlds: a cycle whose members are also widely referenced.
    const calls = Array.from({length: 100}, (_, i) => `a(${i}); b(${i});`).join('\n');
    const files = {
      '/recursive.js': `
        function a(x) { return b(x); }
        function b(y) { return a(y); }
        ${calls}
        module.exports = {a, b};
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/recursive.js'), 'a');

    const {elapsedMs} = timed(() => inferReturnType(ctx, fn));

    assert.ok(ctx.referenceBudget >= 0, 'the shared reference budget must never go negative');
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });
});
