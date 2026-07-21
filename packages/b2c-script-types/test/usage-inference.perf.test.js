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
const {realTypesPrelude} = require('./helpers/real-dw-types');

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
  // A helper whose call sites feed it results of many DISTINCT sub-helpers:
  // the memo can't collapse anything (every name is different) and each
  // sub-helper costs its own full-project scan while draining the result
  // budget by only 2-3 — so the SEARCH budget (MAX_SEARCHES_PER_REQUEST) is
  // the bound that has to engage. Before that cap existed this scenario ran
  // 76 scans (~115ms measured on an SFRA-sized program).
  distinctSubHelperTree: 12,
  // Two implicit-any parameters of the same function must share one
  // reference-search set (the request-scoped call-site memo), not re-run the
  // identical searches once per parameter.
  multiParamHelper: 2,
  // Thousands of call sites packed into one generated file: one scan, and
  // the per-call result budget must bound how many of its hits get processed.
  hugeGeneratedFile: 2,
  // A project-version bump WITHOUT a program change (the version string moves
  // on events that don't produce a new Program) must not evict the inference
  // cache — invalidation keys on Program identity.
  versionBumpSameProgram: 0,
  // Candidate types propagating up a forwarding chain get deduplicated (by
  // display string) at every recursion level; the request-scoped
  // typeToString memo must keep that to ONE stringification per unique type
  // per request. 30 unique candidates + slack — without the memo this
  // scenario stringifies each candidate once per level (4x, 120 calls).
  nestedForwardingStringifications: 32,
  // The no-call-site usage-match fallback's ambient-class index (every
  // dw.* class's member-name set) is built once per LanguageService and
  // cached — a second hover/completion request against the same project
  // must add zero further getPropertiesOfType calls, not rebuild the index.
  ambientClassIndexRebuildOnRepeatedRequest: 0,
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

/**
 * Counts calls to `checker.getPropertiesOfType` — the per-candidate cost of
 * building the ambient-class index the no-call-site usage-match fallback
 * (matchAmbientTypesByUsage) matches against. That index is cached per
 * LanguageService (see buildAmbientClassIndex's WeakMap), so a warm cache
 * must add zero further calls on a repeated request.
 */
function withPropertiesOfTypeCounter(checker) {
  let count = 0;
  const original = checker.getPropertiesOfType.bind(checker);
  checker.getPropertiesOfType = (type) => {
    count++;
    return original(type);
  };
  return {count: () => count};
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

  it(`caps full-project scans when call sites route through many DISTINCT sub-helpers (<= ${BASELINE.distinctSubHelperTree} searches)`, () => {
    // hot(x) is called 40 times, each time with the result of a DIFFERENT
    // exported sub-helper that just returns its own parameter. Nothing here
    // repeats, so neither the request memo nor the call-site memo can help,
    // and every sub-helper's reference search returns only 2-3 results —
    // draining the result budget far too slowly to bound the number of
    // project scans. Only the dedicated search budget stops this one.
    const N = 40;
    const subs = Array.from({length: N}, (_, i) => `function sub${i}(a${i}) { return a${i}; }`).join('\n');
    const calls = Array.from({length: N}, (_, i) => `hot(sub${i}(getProduct()));`).join('\n');
    const exportsMap = Array.from({length: N}, (_, i) => `  sub${i}: sub${i},`).join('\n');
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/tree.js': `
        function hot(x) {
          return x.ID;
        }
        ${subs}
        ${calls}
        module.exports = {
          hot: hot,
        ${exportsMap}
        };
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/tree.js'), 'hot');

    const {result: types, elapsedMs} = timed(() => inferParameterType(ctx, fn.parameters[0]));

    // Correctness must survive the cap: the first in-budget sub-helpers are
    // enough to resolve the parameter's type.
    assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    assert.ok(
      counter.referenceSearches() <= BASELINE.distinctSubHelperTree,
      `expected the search budget to bound project scans at <= ${BASELINE.distinctSubHelperTree}, got ${counter.referenceSearches()}`,
    );
    // The scenario must genuinely pressure the cap — if it stops needing to,
    // it no longer guards anything and needs rebuilding.
    assert.equal(ctx.searchBudget, 0, 'expected the search budget to be fully consumed by this scenario');
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it(`shares one reference-search set across sibling parameters of the same function (<= ${BASELINE.multiParamHelper} searches)`, () => {
    // Return-type inference of pick() chases BOTH parameters; without the
    // request-scoped call-site memo each parameter re-ran the identical
    // searches (4 total instead of 2: the function name plus its alias-map
    // property, twice).
    const files = {
      '/types.d.ts':
        'declare function getProduct(): {ID: string}; declare function getCategory(): {displayName: string};',
      '/pick.js': `
        function pick(a, b) {
          if (a) { return a; }
          return b;
        }
        pick(getProduct(), getCategory());
        module.exports = {pick: pick};
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/pick.js'), 'pick');

    const {result: types, elapsedMs} = timed(() => inferReturnType(ctx, fn));

    assert.equal(describeTypes(ctx.checker, types), '{ ID: string; } | { displayName: string; }');
    assert.ok(
      counter.referenceSearches() <= BASELINE.multiParamHelper,
      `expected the call-site memo to dedupe sibling-parameter searches to <= ${BASELINE.multiParamHelper}, got ${counter.referenceSearches()}`,
    );
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it(`bounds a helper with thousands of call sites in one generated file (<= ${BASELINE.hugeGeneratedFile} searches, <= 50 hits processed)`, () => {
    // A generated data file whose big array literal contains a call site per
    // row. One scan finds all of them; the per-call result budget must stop
    // processing at 50, and each processed hit's root-to-position AST walk
    // must not degrade on the huge sibling list (getNodeAtPosition stops
    // scanning a sibling list once past the target position).
    const rows = Array.from({length: 2000}, (_, i) => `  {sku: 'sku-${i}', price: hotPrice(getProduct())},`).join('\n');
    const files = {
      '/types.d.ts': 'declare function getProduct(): {ID: string; name: string};',
      '/huge.js': `
        function hotPrice(product) {
          return product.ID;
        }
        var ROWS = [
        ${rows}
        ];
        module.exports = {ROWS: ROWS, hotPrice: hotPrice};
      `,
    };
    const base = createFixtureLanguageService(files);
    const counter = withReferenceCounter(base);
    const ctx = createInferenceContext(ts, counter.languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/huge.js'), 'hotPrice');

    const {result: types, elapsedMs} = timed(() => inferParameterType(ctx, fn.parameters[0]));

    assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    assert.ok(
      counter.referenceSearches() <= BASELINE.hugeGeneratedFile,
      `expected <= ${BASELINE.hugeGeneratedFile} searches, got ${counter.referenceSearches()}`,
    );
    const spent = 200 - ctx.referenceBudget;
    assert.ok(spent <= 50, `expected the per-call cap (50) to bound processed hits, spent ${spent}`);
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it('keeps the inference cache across a project-version bump that produces no new program (0 new searches)', () => {
    // tsserver bumps the project version string on events that don't change
    // the program. Invalidation keys on Program identity, so such a bump must
    // NOT force a full re-inference.
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
    let projectVersion = 1;
    const proxy = create({
      languageService: counter.languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => String(projectVersion),
      },
      config: {enabled: true, autoDiscover: false, cartridges: [{name: 'c', src: '/'}], inferUsage: true},
    });
    const paramPos = files['/helper.js'].indexOf('product)');

    const first = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    assert.ok((first?.documentation ?? []).some((p) => p.text.includes('Inferred from usage')));
    counter.reset();
    projectVersion++; // bump WITHOUT any host/script change — same program

    const {result: second, elapsedMs} = timed(() => proxy.getQuickInfoAtPosition('/helper.js', paramPos));

    assert.ok((second?.documentation ?? []).some((p) => p.text.includes('Inferred from usage')));
    assert.equal(
      counter.referenceSearches(),
      BASELINE.versionBumpSameProgram,
      'a version bump with an unchanged program must be served from the inference cache',
    );
    assert.ok(elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(elapsedMs)}ms`);
  });

  it(`stringifies each unique candidate type at most once per request (<= ${BASELINE.nestedForwardingStringifications} typeToString calls)`, () => {
    // fmtOpts forwards its parameter; wrap1/wrap2 forward through it. Hover
    // on wrap2 pulls all 30 distinct large object-literal candidates up
    // through three dedupe levels — each level re-rendered every type before
    // the typeToString memo existed (120 calls, measured at 13ms of a 34ms
    // request with 50x150-property literals).
    const N = 30;
    const literal = (i) => '{' + Array.from({length: 40}, (_, p) => `k${i}_${p}: ${p}`).join(', ') + '}';
    const calls = Array.from({length: N}, (_, i) => `fmtOpts(${literal(i)});`).join('\n');
    const files = {
      '/opts.js': `
        function fmtOpts(opts) {
          return opts;
        }
        function wrap1(o) { return fmtOpts(o); }
        function wrap2(o) { return wrap1(o); }
        ${calls}
        module.exports = {fmtOpts: fmtOpts, wrap1: wrap1, wrap2: wrap2};
      `,
    };
    const base = createFixtureLanguageService(files);
    const ctx = createInferenceContext(ts, base);
    // Count typeToString calls made THROUGH the public checker method — the
    // deterministic cost proxy for dedupe/render work (checker-internal
    // rendering doesn't route through this, so the counter is exactly ours).
    let stringifications = 0;
    const origTypeToString = ctx.checker.typeToString.bind(ctx.checker);
    ctx.checker.typeToString = (...args) => {
      stringifications++;
      return origTypeToString(...args);
    };
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/opts.js'), 'wrap2');

    const {result: types, elapsedMs} = timed(() => inferReturnType(ctx, fn));

    assert.equal(types.length, N, 'all candidate object-literal types must survive dedupe');
    assert.ok(
      stringifications <= BASELINE.nestedForwardingStringifications,
      `expected the typeToString memo to bound stringifications at <= ${BASELINE.nestedForwardingStringifications}, got ${stringifications}`,
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

  it('caches the ambient-class index across repeated hovers on a real dw.* no-call-site parameter (addressBook.addresses)', () => {
    // Real-world shape from neuhaus-core's addressHelpers.js: an uncalled
    // (from this file's perspective) helper whose only parameter usage is a
    // single, globally-unique member access — the ambient-class matching
    // fallback this scenario exercises, against the real bundled dw.* types
    // rather than a small stand-in shape.
    const files = {
      '/types.d.ts': realTypesPrelude(['AddressBook'], ''),
      '/addressHelpers.js': `
        function getAddressBookAddressByForm(addressBook, form) {
          var collections = require('*/cartridge/scripts/util/collections');
          return collections.find(addressBook.addresses, function (address) {
            return address.postalCode === form.postalCode.value;
          });
        }
      `,
    };
    const languageService = createFixtureLanguageService(files, {strict: true});
    const ctx = createInferenceContext(ts, languageService);
    const fn = findFunctionDeclaration(ctx.program.getSourceFile('/addressHelpers.js'), 'getAddressBookAddressByForm');
    const counter = withPropertiesOfTypeCounter(ctx.checker);

    const first = timed(() => inferParameterType(ctx, fn.parameters[0]));
    assert.equal(describeTypes(ctx.checker, first.result), 'AddressBook');
    const scansAfterFirstHover = counter.count();
    assert.ok(scansAfterFirstHover > 0, 'expected the cold ambient-class index build to scan at least one candidate');
    assert.ok(first.elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(first.elapsedMs)}ms`);

    // A second hover at the same position (the cursor lingering, or a
    // completion request right after the hover) must reuse the cached index
    // instead of re-scanning every ambient class's property list.
    const second = timed(() => inferParameterType(ctx, fn.parameters[0]));
    assert.equal(describeTypes(ctx.checker, second.result), 'AddressBook');
    assert.equal(
      counter.count() - scansAfterFirstHover,
      BASELINE.ambientClassIndexRebuildOnRepeatedRequest,
      `expected the warm ambient-class index to add ${BASELINE.ambientClassIndexRebuildOnRepeatedRequest} getPropertiesOfType calls, got ${counter.count() - scansAfterFirstHover}`,
    );
    assert.ok(second.elapsedMs < WALL_CLOCK_CEILING_MS, `catastrophic slowdown: ${Math.round(second.elapsedMs)}ms`);
  });
});
