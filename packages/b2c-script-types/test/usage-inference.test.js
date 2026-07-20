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
  findEnclosingPropertyAccess,
  getNodeAtPosition,
  inferParameterType,
  inferReturnType,
  inferTypeForNode,
  typesToCompletionEntries,
} = require('../plugin/usage-inference');
const {createFixtureLanguageService, findFunctionDeclaration} = require('./helpers/fixture-language-service');

const AMBIENT_TYPES = `
declare function getProduct(): {ID: string; name: string};
declare function getInventory(): {quantity: number};
`;

describe('usage-inference', () => {
  describe('inferParameterType', () => {
    it('infers a parameter type from a single call site', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function helper(product) {
            return product.ID;
          }
          helper(getProduct());
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');
      const param = fn.parameters[0];

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('unions candidate types across multiple call sites', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function helper(input) {
            return input;
          }
          helper(getProduct());
          helper(getInventory());
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');
      const param = fn.parameters[0];

      const types = inferParameterType(ctx, param);

      assert.equal(types.length, 2);
      const rendered = types.map((t) => ctx.checker.typeToString(t)).sort();
      assert.deepEqual(rendered, ['{ ID: string; name: string; }', '{ quantity: number; }']);
    });

    it('resolves references through CommonJS `exports.foo = function(){}` assignment', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          exports.helper = function (product) {
            return product.ID;
          };
          exports.helper(getProduct());
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      let param;
      const visit = (node) => {
        if (ts.isFunctionExpression(node)) {
          param = node.parameters[0];
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('returns no candidates when the function is never called', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function helper(product) {
            return product.ID;
          }
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(types.length, 0);
    });
  });

  describe('inferParameterType — cross-file export patterns', () => {
    function findFunctionExpressionParam(sourceFile) {
      let param;
      const visit = (node) => {
        if (ts.isFunctionExpression(node)) {
          param = node.parameters[0];
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      return param;
    }

    function findMethodDeclarationParam(sourceFile) {
      let param;
      const visit = (node) => {
        if (ts.isMethodDeclaration(node)) {
          param = node.parameters[0];
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      return param;
    }

    it('resolves a bare `module.exports = function(){}` called via `require(...)` in another file', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `module.exports = function (product) { return product.ID; };`,
        '/consumer.js': `var helper = require('./helper'); helper(getProduct());`,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const param = findFunctionExpressionParam(ctx.program.getSourceFile('/helper.js'));

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('resolves an immediately-invoked `require(...)(x)` call', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `module.exports = function (product) { return product.ID; };`,
        '/consumer.js': `require('./helper')(getProduct());`,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const param = findFunctionExpressionParam(ctx.program.getSourceFile('/helper.js'));

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('resolves a destructured `const {helper} = require(...)` call site', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `module.exports = { helper: function (product) { return product.ID; } };`,
        '/consumer.js': `var { helper } = require('./helper'); helper(getProduct());`,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const param = findFunctionExpressionParam(ctx.program.getSourceFile('/helper.js'));

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('resolves a renamed destructure `const {helper: h} = require(...)`', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `module.exports = { helper: function (product) { return product.ID; } };`,
        '/consumer.js': `var { helper: h } = require('./helper'); h(getProduct());`,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const param = findFunctionExpressionParam(ctx.program.getSourceFile('/helper.js'));

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('resolves an ES6 method-shorthand export called via property access', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `module.exports = { helper(product) { return product.ID; } };`,
        '/consumer.js': `var helper = require('./helper'); helper.helper(getProduct());`,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const param = findMethodDeclarationParam(ctx.program.getSourceFile('/helper.js'));

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });
  });

  describe('inferParameterType — explicit `any` is left alone', () => {
    it('does not infer a type for a parameter with an explicit `@param {any}` JSDoc tag', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          /** @param {any} product */
          function helper(product) {
            return product.ID;
          }
          helper(getProduct());
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(types.length, 0);
    });

    it('does not infer a type for a parameter with an explicit `: any` TS annotation', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.ts': `
          function helper(product: any) {
            return product.ID;
          }
          helper(getProduct());
          export {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.ts');
      const fn = findFunctionDeclaration(sourceFile, 'helper');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(types.length, 0);
    });
  });

  describe('inferParameterType — reference budget', () => {
    it('stops collecting call sites once the request-scoped reference budget runs out', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function helper(product) {
            return product.ID;
          }
          helper(getProduct());
          helper(getInventory());
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');

      // Exhausted up front — even though the helper has usable call sites,
      // none should be processed once the shared budget is gone.
      ctx.referenceBudget = 0;
      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(types.length, 0);
    });

    it('caps how much of the shared budget a single call can spend, so one widely-referenced helper cannot starve sibling branches', () => {
      const callSites = Array.from({length: 60}, () => 'helper(1);').join('\n');
      const files = {
        '/helper.js': `
          function helper(product) {
            return product;
          }
          ${callSites}
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');
      const budgetBefore = ctx.referenceBudget;

      inferParameterType(ctx, fn.parameters[0]);

      const spent = budgetBefore - ctx.referenceBudget;
      assert.ok(spent <= 50, `expected at most 50 references spent by one call, got ${spent}`);
      assert.ok(spent < 60, 'expected the per-call cap to actually engage given 60+ available references');
    });
  });

  describe('inferReturnType', () => {
    it('chases a multi-hop undocumented call chain through a forwarding helper', () => {
      // `identity` forwards its own (undocumented, `any`) parameter, so TS's
      // own inference gives `identity` an `any` return type too. `caller`
      // calls `identity(getProduct())` — this only resolves if inference
      // recurses from caller -> identity's return -> identity's parameter.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/chain.js': `
          function identity(x) {
            return x;
          }
          function caller() {
            return identity(getProduct());
          }
          identity(getProduct());
          module.exports = {caller, identity};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/chain.js');
      const caller = findFunctionDeclaration(sourceFile, 'caller');

      const types = inferReturnType(ctx, caller);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('does not infinitely recurse on mutually recursive undocumented helpers', () => {
      const files = {
        '/recursive.js': `
          function a(x) {
            return b(x);
          }
          function b(y) {
            return a(y);
          }
          a(1);
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/recursive.js');
      const fnA = findFunctionDeclaration(sourceFile, 'a');

      // Must return (not hang) even though a() and b() call each other.
      const types = inferReturnType(ctx, fnA);
      assert.ok(Array.isArray(types));
    });

    it('chases a property access on an undocumented parameter (`return x.prop`)', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/chain.js': `
          function shared(x) {
            return x.ID;
          }
          function caller() {
            return shared(getProduct());
          }
          shared(getProduct());
          module.exports = {caller, shared};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/chain.js');
      const caller = findFunctionDeclaration(sourceFile, 'caller');

      const types = inferReturnType(ctx, caller);

      assert.equal(describeTypes(ctx.checker, types), 'string');
    });

    it('chases a method-chain (`x.next().next()...`) within MAX_CHAIN_HOPS', () => {
      const files = {
        '/types.d.ts': `
          interface Chainable {
            next(): Chainable;
            value: string;
          }
          declare function getChainable(): Chainable;
        `,
        '/chain.js': `
          function resolveChain(x) {
            return x.next().next().next().next().next().value;
          }
          function useHelper() {
            return resolveChain(getChainable());
          }
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/chain.js');
      const fn = findFunctionDeclaration(sourceFile, 'resolveChain');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), 'string');
    });

    it('gives up (without hanging) on a method-chain longer than MAX_CHAIN_HOPS, rather than chasing it unbounded', () => {
      // MAX_CHAIN_HOPS bounds in-expression chain-hopping (a.b().c().d()...)
      // separately from MAX_INFERENCE_DEPTH, which only bounds crossing into
      // another undocumented helper's own return-type inference — a chain
      // never crosses a function boundary, so without its own cap this would
      // be bounded only by how long an expression happens to be written.
      const files = {
        '/types.d.ts': `
          interface Chainable {
            next(): Chainable;
            value: string;
          }
          declare function getChainable(): Chainable;
        `,
        '/chain.js': `
          function resolveChain(x) {
            return x.next().next().next().next().next().next().next().next().next().next().next().next().value;
          }
          function useHelper() {
            return resolveChain(getChainable());
          }
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/chain.js');
      const fn = findFunctionDeclaration(sourceFile, 'resolveChain');

      const types = inferReturnType(ctx, fn);

      assert.equal(types.length, 0);
    });

    it('reuses a memoized result computed at a shallower depth even when a later call is over MAX_INFERENCE_DEPTH', () => {
      // `shared` is reached at depth 1 via `short` (well within budget, gets
      // memoized), then again at depth 4 via a longer forwarding chain, which
      // is over MAX_INFERENCE_DEPTH (3). The memoized, fully-resolved result
      // must still be returned rather than discarded just because this
      // particular path to it happens to run over the depth cap.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/chain.js': `
          function shared(x) { return x; }
          function short() { return shared(getProduct()); }
          function longChain0() { return longChain1(); }
          function longChain1() { return longChain2(); }
          function longChain2() { return shared(getProduct()); }
          function top() { return longChain0(); }
          short();
          top();
          module.exports = {short, top};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/chain.js');
      const shortFn = findFunctionDeclaration(sourceFile, 'short');
      const topFn = findFunctionDeclaration(sourceFile, 'top');

      const shortTypes = inferReturnType(ctx, shortFn);
      assert.equal(describeTypes(ctx.checker, shortTypes), '{ ID: string; name: string; }');

      const topTypes = inferReturnType(ctx, topFn);
      assert.equal(describeTypes(ctx.checker, topTypes), '{ ID: string; name: string; }');
    });
  });

  describe('inferParameterType — widening and cycle safety', () => {
    it('widens literal call-site arguments to their general type instead of a union of literals', () => {
      const files = {
        '/helper.js': `
          function helper(input) {
            return input;
          }
          helper('hello');
          helper('world');
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(describeTypes(ctx.checker, types), 'string');
    });

    it('does not hang on a self-forwarding helper called with itself as an argument', () => {
      const files = {
        '/helper.js': `
          function identity(x) {
            return x;
          }
          identity(identity(1));
          module.exports = {identity};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'identity');

      // Must return promptly (not hang) even though identity's own parameter
      // inference re-enters itself via the nested identity(...) argument.
      const types = inferParameterType(ctx, fn.parameters[0]);
      assert.ok(Array.isArray(types));
    });
  });

  describe('inferTypeForNode', () => {
    it('infers the type of a variable initialized from an undocumented call', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/consumer.js': `
          function getStuff() {
            return getProduct();
          }
          function useIt() {
            var result = getStuff();
            return result.ID;
          }
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      let resultIdentifier;
      const visit = (node) => {
        if (ts.isIdentifier(node) && node.text === 'result' && ts.isPropertyAccessExpression(node.parent)) {
          resultIdentifier = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      const types = inferTypeForNode(ctx, resultIdentifier);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });
  });

  describe('typesToCompletionEntries', () => {
    it('synthesizes deduplicated member completions from candidate types', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/consumer.js': `
          function pick(input) {
            return input;
          }
          pick(getProduct());
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const fn = findFunctionDeclaration(sourceFile, 'pick');
      const types = inferParameterType(ctx, fn.parameters[0]);

      const entries = typesToCompletionEntries(ts, ctx.checker, types);

      assert.deepEqual(entries.map((e) => e.name).sort(), ['ID', 'name']);
    });

    it('offers member completions for a candidate type that is nullable (`T | null`)', () => {
      // getPropertiesOfType on a union only returns members common to every
      // constituent; `null` contributes none, so a candidate like this one —
      // the common shape of an SFCC getter that can return nothing, e.g.
      // ProductMgr.getProduct(): Product | null — must have its nullable part
      // stripped first, or every entry disappears. Under the default
      // `strict: false` fixture settings TS collapses `T | null` down to just
      // `T` (strictNullChecks off), which would mask this bug entirely, so
      // this test opts into `strictNullChecks: true` — matching VS Code's own
      // implicit JS project default (`js/ts.implicitProjectConfig.strictNullChecks`),
      // which is what a real cartridge file actually type-checks under.
      const files = {
        '/types.d.ts': `
          declare function getProductOrNull(): {ID: string; name: string} | null;
        `,
        '/consumer.js': `
          function pick(input) {
            return input;
          }
          pick(getProductOrNull());
        `,
      };
      const languageService = createFixtureLanguageService(files, {strict: true});
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const fn = findFunctionDeclaration(sourceFile, 'pick');
      const types = inferParameterType(ctx, fn.parameters[0]);

      const entries = typesToCompletionEntries(ts, ctx.checker, types);

      assert.deepEqual(entries.map((e) => e.name).sort(), ['ID', 'name']);
    });

    it('offers member completions for a primitive candidate type via its apparent (wrapper-object) members', () => {
      const files = {
        '/helper.js': `
          function helper(input) {
            return input;
          }
          helper('hello');
          module.exports = {helper};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');
      const types = inferParameterType(ctx, fn.parameters[0]);

      const entries = typesToCompletionEntries(ts, ctx.checker, types);

      const names = entries.map((e) => e.name);
      assert.ok(names.includes('length'));
      assert.ok(names.includes('toUpperCase'));
    });
  });

  describe('getNodeAtPosition / findEnclosingPropertyAccess', () => {
    it('locates the property access expression enclosing a dotted completion position', () => {
      const files = {
        '/dotted.js': `var product = {}; product.ID;`,
      };
      const languageService = createFixtureLanguageService(files);
      const program = languageService.getProgram();
      const sourceFile = program.getSourceFile('/dotted.js');
      // Position of the `.` right after `product` in `product.ID`.
      const dotPos = files['/dotted.js'].indexOf('product.ID') + 'product'.length;

      const node = getNodeAtPosition(sourceFile, ts, dotPos - 1);
      const propAccess = findEnclosingPropertyAccess(node, ts);

      assert.ok(propAccess);
      assert.equal(propAccess.name.text, 'ID');
    });
  });
});
