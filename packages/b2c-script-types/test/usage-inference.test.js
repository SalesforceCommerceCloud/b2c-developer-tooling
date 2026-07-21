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
const {realTypesPrelude} = require('./helpers/real-dw-types');

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

    it('infers a parameter type from a `new Helper(x)` constructor call site (SFRA constructor-function model pattern)', () => {
      // Real-world shape from omoda-core/mul-core: `function StoreModel(storeObject, location) {...}`
      // invoked as `new StoreModel(store, location)`, never a plain call — a
      // widely-used SFRA idiom for "class" models that plain call-site
      // collection (which only recognized ordinary CallExpressions) missed
      // entirely.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function StoreModel(storeObject) {
            this.id = storeObject.ID;
          }
          new StoreModel(getProduct());
          module.exports = StoreModel;
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'StoreModel');
      const param = fn.parameters[0];

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('stays silent when plain-call and `new` constructor call sites disagree on the argument type', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function Wrapper(input) {
            this.value = input;
          }
          Wrapper(getProduct());
          new Wrapper(getInventory());
          module.exports = Wrapper;
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'Wrapper');
      const param = fn.parameters[0];

      const types = inferParameterType(ctx, param);

      assert.deepEqual(types, []);
    });

    it('infers through a mix of plain-call and `new` when every site passes the same type', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function Wrapper(input) {
            this.value = input;
          }
          Wrapper(getProduct());
          new Wrapper(getProduct());
          module.exports = Wrapper;
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'Wrapper');
      const param = fn.parameters[0];

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('does not throw on a bare `new Helper` constructor call with no parentheses/arguments', () => {
      // `new Helper` (no parens) is valid JS whose `arguments` is `undefined`,
      // unlike a plain call's — always-present, possibly-empty — array.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function Helper(input) {
            this.value = input;
          }
          new Helper;
          module.exports = Helper;
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'Helper');
      const param = fn.parameters[0];

      const types = inferParameterType(ctx, param);

      assert.deepEqual(types, []);
    });

    it('stays silent when call-site argument types conflict (no noisy union)', () => {
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

      assert.deepEqual(types, []);
    });

    it('keeps a single converged type when every call site agrees', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function helper(input) {
            return input;
          }
          helper(getProduct());
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

    it('resolves the SFRA-canonical alias-map export (`module.exports = {helper: helper}`) called from another file', () => {
      // References on the *function* name dead-end at the alias-map
      // initializer; reaching the cross-file `productHelpers.helper(x)` call
      // requires hopping to the property *name* and searching from there.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function helper(product) {
            return product.ID;
          }
          module.exports = {
            helper: helper
          };
        `,
        '/consumer.js': `var productHelpers = require('./helper'); productHelpers.helper(getProduct());`,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'helper');

      const types = inferParameterType(ctx, fn.parameters[0]);

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

  describe('inferParameterType — weak SFRA placeholder JSDoc does not block inference', () => {
    // Real storefronts (and IntelliJ's happy path) often write `@param {Object}`
    // / `{obj}` / `{*}` instead of a real dw.* type. Those placeholders must
    // not permanently silence usage inference the way a deliberate `{any}` does.
    for (const annotation of ['Object', 'obj', '*', '{}']) {
      it(`infers through @param {${annotation}} on a named customer parameter`, () => {
        const files = {
          '/types.d.ts': realTypesPrelude(['Customer', 'ServiceConfig'], ''),
          '/helper.js': `
            /**
             * @param {${annotation}} customer
             */
            function getPasswordResetToken(customer) {
              return customer.profile.credentials.createResetPasswordToken();
            }
          `,
        };
        const languageService = createFixtureLanguageService(files);
        const ctx = createInferenceContext(ts, languageService);
        const sourceFile = ctx.program.getSourceFile('/helper.js');
        const fn = findFunctionDeclaration(sourceFile, 'getPasswordResetToken');

        assert.equal(describeTypes(ctx.checker, inferParameterType(ctx, fn.parameters[0])), 'Customer');
      });
    }

    it('still respects a real @param {Customer} annotation (does not second-guess dw.* JSDoc)', () => {
      // If we ignored the Customer annotation we'd chase the Product call site.
      // Respecting dw.* JSDoc matches IntelliJ and leaves the author's type alone.
      const languageService = createFixtureLanguageService({
        '/types.d.ts': realTypesPrelude(['Customer', 'Product'], '  function getSomeProduct(): Product<any>;'),
        '/helper.js': `
          /**
           * @param {Customer} product
           */
          function misnamed(product) {
            return product.getID();
          }
          misnamed(getSomeProduct());
        `,
      });
      const ctx = createInferenceContext(ts, languageService);
      const fn = findFunctionDeclaration(ctx.program.getSourceFile('/helper.js'), 'misnamed');

      assert.deepEqual(inferParameterType(ctx, fn.parameters[0]), []);
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

    it('chases both branches of a ternary return (collections.first shape)', () => {
      // Stock SFRA `collections.first`: `return it.hasNext() ? it.next() : null`.
      // Without ConditionalExpression chasing the whole helper stays `any`
      // even when the call-site collection is fully typed.
      const files = {
        '/types.d.ts': `
          interface FixtureIterator {
            hasNext(): boolean;
            next(): {ID: string};
          }
          interface FixtureCollection {
            iterator(): FixtureIterator;
          }
          declare function getCollection(): FixtureCollection;
        `,
        '/collections.js': `
          function first(collection) {
            var iterator = collection.iterator();
            return iterator.hasNext() ? iterator.next() : null;
          }
          function caller() {
            return first(getCollection());
          }
          first(getCollection());
          module.exports = {first: first, caller: caller};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/collections.js');
      const caller = findFunctionDeclaration(sourceFile, 'caller');

      const described = describeTypes(ctx.checker, inferReturnType(ctx, caller));
      assert.ok(described.includes('{ ID: string; }'), `expected element type, got: ${described}`);
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

  describe('local-variable indirection', () => {
    it('chases a return value through an intermediate local variable, same as the inline expression', () => {
      // Idiomatic SFCC style: the chain is split across a `var` instead of
      // written inline. Regression test — the identifier branch of
      // resolveExpressionTypes used to dead-end on anything that wasn't a
      // parameter declaration, so this inferred nothing while the inline
      // one-liner version inferred fine.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function pick(input) {
            var intermediate = input;
            return intermediate;
          }
          pick(getProduct());
          module.exports = {pick};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      const fn = findFunctionDeclaration(sourceFile, 'pick');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('infers the type of a variable initialized from a property access on an undocumented parameter', () => {
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function pick(product) {
            var id = product.ID;
            return id;
          }
          pick(getProduct());
          module.exports = {pick};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      let idIdentifier;
      const visit = (node) => {
        if (ts.isIdentifier(node) && node.text === 'id' && ts.isReturnStatement(node.parent)) {
          idIdentifier = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      const types = inferTypeForNode(ctx, idIdentifier);

      assert.equal(describeTypes(ctx.checker, types), 'string');
    });

    it('leaves a variable with an explicit `@type {any}` JSDoc annotation alone', () => {
      // Same rule as parameters and return types: an annotated `any` is a
      // deliberate choice, not an inference failure.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/helper.js': `
          function pick(product) {
            /** @type {any} */
            var id = product.ID;
            return id;
          }
          pick(getProduct());
          module.exports = {pick};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/helper.js');
      let idIdentifier;
      const visit = (node) => {
        if (ts.isIdentifier(node) && node.text === 'id' && ts.isReturnStatement(node.parent)) {
          idIdentifier = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      const types = inferTypeForNode(ctx, idIdentifier);

      assert.equal(types.length, 0);
    });

    it('does not hang on mutually-referencing variable initializers (`var a = b; var b = a;`)', () => {
      const files = {
        '/cycle.js': `
          function g() {
            var a = b;
            var b = a;
            return a;
          }
          g();
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/cycle.js');
      let aIdentifier;
      const visit = (node) => {
        if (ts.isIdentifier(node) && node.text === 'a' && ts.isReturnStatement(node.parent)) {
          aIdentifier = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      // Must return promptly (not hang) with no candidates.
      const types = inferTypeForNode(ctx, aIdentifier);
      assert.equal(types.length, 0);
    });
  });

  describe('module.superModule overlays', () => {
    // The SFRA plugin-cartridge pattern: an overlay module at the same path
    // as a base-cartridge module reaches the base via `module.superModule`.
    // The engine resolves it through ctx.resolveSuperModulePath (supplied by
    // the plugin host, which owns the cartridge order).
    const SUPER_RESOLVER = (containingFile) =>
      containingFile === '/custom/cartridge/scripts/helpers/x.js' ? '/base/cartridge/scripts/helpers/x.js' : undefined;

    const OVERLAY_FILES = {
      '/types.d.ts': AMBIENT_TYPES,
      '/base/cartridge/scripts/helpers/x.js': `
        function getThing(input) {
          return input;
        }
        getThing(getProduct());
        module.exports = {
          getThing: getThing
        };
      `,
      '/custom/cartridge/scripts/helpers/x.js': `
        var base = module.superModule;
        function wrapped() {
          return base.getThing(getProduct());
        }
        module.exports = base;
        module.exports.wrapped = wrapped;
      `,
    };

    function findIdentifier(sourceFile, text, parentPredicate) {
      let found;
      const visit = (node) => {
        if (ts.isIdentifier(node) && node.text === text && parentPredicate(node)) {
          found = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      return found;
    }

    it("resolves `module.superModule` to the overridden module's export type", () => {
      const languageService = createFixtureLanguageService(OVERLAY_FILES);
      const ctx = createInferenceContext(ts, languageService, SUPER_RESOLVER);
      const overlay = ctx.program.getSourceFile('/custom/cartridge/scripts/helpers/x.js');
      // `base` in `base.getThing(...)` — an identifier whose declaration is
      // the `var base = module.superModule` initializer.
      const baseUse = findIdentifier(overlay, 'base', (n) => ts.isPropertyAccessExpression(n.parent));

      const types = inferTypeForNode(ctx, baseUse);
      const entries = typesToCompletionEntries(ts, ctx.checker, types);

      assert.deepEqual(
        entries.map((e) => e.name),
        ['getThing'],
      );
    });

    it("chases a call through superModule into the base module's own undocumented helper", () => {
      // base.getThing's declared return type is `any` (undocumented), so the
      // member lookup alone isn't enough — the engine must recurse into the
      // base function's declaration and infer its return from usage.
      const languageService = createFixtureLanguageService(OVERLAY_FILES);
      const ctx = createInferenceContext(ts, languageService, SUPER_RESOLVER);
      const overlay = ctx.program.getSourceFile('/custom/cartridge/scripts/helpers/x.js');
      const wrapped = findFunctionDeclaration(overlay, 'wrapped');

      const types = inferReturnType(ctx, wrapped);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('returns no candidates when no lower cartridge provides the module', () => {
      const languageService = createFixtureLanguageService(OVERLAY_FILES);
      const ctx = createInferenceContext(ts, languageService, () => undefined);
      const overlay = ctx.program.getSourceFile('/custom/cartridge/scripts/helpers/x.js');
      const baseUse = findIdentifier(overlay, 'base', (n) => ts.isPropertyAccessExpression(n.parent));

      assert.equal(inferTypeForNode(ctx, baseUse).length, 0);
    });

    it('returns no candidates without a resolver (plain LSP host that never supplied one)', () => {
      const languageService = createFixtureLanguageService(OVERLAY_FILES);
      const ctx = createInferenceContext(ts, languageService);
      const overlay = ctx.program.getSourceFile('/custom/cartridge/scripts/helpers/x.js');
      const baseUse = findIdentifier(overlay, 'base', (n) => ts.isPropertyAccessExpression(n.parent));

      assert.equal(inferTypeForNode(ctx, baseUse).length, 0);
    });

    it('recurses through a pass-through overlay (`module.exports = base`) to the cartridge below it', () => {
      // Three-cartridge path: top -> mid -> base. mid re-exports its own
      // superModule untouched, so resolving top's `module.superModule` must
      // chase through mid's `module.exports = base` to base's concrete type.
      const files = {
        '/types.d.ts': AMBIENT_TYPES,
        '/base/cartridge/scripts/helpers/x.js': `
          function getThing(input) {
            return input;
          }
          module.exports = {
            getThing: getThing
          };
        `,
        '/mid/cartridge/scripts/helpers/x.js': `
          var base = module.superModule;
          module.exports = base;
        `,
        '/top/cartridge/scripts/helpers/x.js': `
          var base = module.superModule;
          function useIt() {
            return base;
          }
          module.exports = base;
        `,
      };
      const order = {
        '/top/cartridge/scripts/helpers/x.js': '/mid/cartridge/scripts/helpers/x.js',
        '/mid/cartridge/scripts/helpers/x.js': '/base/cartridge/scripts/helpers/x.js',
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService, (f) => order[f]);
      const top = ctx.program.getSourceFile('/top/cartridge/scripts/helpers/x.js');
      const baseUse = findIdentifier(top, 'base', (n) => ts.isReturnStatement(n.parent));

      const types = inferTypeForNode(ctx, baseUse);
      const entries = typesToCompletionEntries(ts, ctx.checker, types);

      assert.deepEqual(
        entries.map((e) => e.name),
        ['getThing'],
      );
    });
  });

  describe('callback parameters (function expression in argument position)', () => {
    // A callback has no name to run a reference search on; its first
    // parameter is instead inferred from the element type of a
    // collection-like sibling argument (something with iterator()/next()).
    const COLLECTION_TYPES = `
      interface FixtureIterator {
        hasNext(): boolean;
        next(): {ID: string; name: string};
      }
      interface FixtureCollection {
        iterator(): FixtureIterator;
      }
      declare function getCollection(): FixtureCollection;
    `;

    function findCallbackParam(sourceFile, paramIndex = 0) {
      let param;
      const visit = (node) => {
        if (ts.isFunctionExpression(node) && !param) {
          param = node.parameters[paramIndex];
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      return param;
    }

    it('infers the element type from a collection sibling argument (collections.forEach style)', () => {
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/consumer.js': `
          function forEach(collection, callback) {
            var it = collection.iterator();
            while (it.hasNext()) { callback(it.next()); }
          }
          forEach(getCollection(), function (item) {
            return item.ID;
          });
          module.exports = {forEach: forEach};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const param = findCallbackParam(sourceFile);

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('infers the element type for collections.first(coll, function (item) …) predicates', () => {
      // Stock SFRA `first` takes only the collection, but calculate.js ports
      // call it with a find-style predicate — still element-first.
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/consumer.js': `
          function first(collection, callback) {}
          first(getCollection(), function (item) {
            return item.ID === 'x';
          });
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const param = findCallbackParam(sourceFile);

      assert.equal(describeTypes(ctx.checker, inferParameterType(ctx, param)), '{ ID: string; name: string; }');
    });

    it('resolves the collection argument through inference when it is itself undocumented', () => {
      // The collection travels through an undocumented parameter — the
      // sibling argument must be resolved by the engine, not just read off
      // the checker.
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/consumer.js': `
          function eachItem(coll) {
            forEach(coll, function (item) {
              return item.name;
            });
          }
          function forEach(collection, callback) {}
          eachItem(getCollection());
          module.exports = {eachItem: eachItem};
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const param = findCallbackParam(sourceFile);

      const types = inferParameterType(ctx, param);

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('does not apply the element heuristic to reduce-style callbacks (accumulator comes first)', () => {
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/consumer.js': `
          function reduce(collection, callback, initial) {}
          reduce(getCollection(), function (acc) {
            return acc;
          }, 0);
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const param = findCallbackParam(sourceFile);

      assert.equal(inferParameterType(ctx, param).length, 0);
    });

    it('does not apply the element heuristic to unknown callees outside the element-first allowlist', () => {
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/consumer.js': `
          function each(collection, callback) {}
          each(getCollection(), function (item) {
            return item.ID;
          });
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const param = findCallbackParam(sourceFile);

      assert.equal(inferParameterType(ctx, param).length, 0);
    });

    for (const callee of ['map', 'filter', 'every', 'some', 'find']) {
      it(`infers the element type for collections.${callee}-style callbacks`, () => {
        const files = {
          '/types.d.ts': COLLECTION_TYPES,
          '/consumer.js': `
            function ${callee}(collection, callback) {}
            ${callee}(getCollection(), function (item) {
              return item.ID;
            });
          `,
        };
        const languageService = createFixtureLanguageService(files);
        const ctx = createInferenceContext(ts, languageService);
        const sourceFile = ctx.program.getSourceFile('/consumer.js');
        const param = findCallbackParam(sourceFile);

        assert.equal(describeTypes(ctx.checker, inferParameterType(ctx, param)), '{ ID: string; name: string; }');
      });
    }

    it('only maps the first callback parameter to the element type', () => {
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/consumer.js': `
          function forEach(collection, callback) {}
          forEach(getCollection(), function (item, index) {
            return index;
          });
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const indexParam = findCallbackParam(sourceFile, 1);

      assert.equal(inferParameterType(ctx, indexParam).length, 0);
    });

    it('infers nothing when no sibling argument is collection-like', () => {
      const files = {
        '/consumer.js': `
          function run(name, callback) {}
          run('label', function (item) {
            return item;
          });
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/consumer.js');
      const param = findCallbackParam(sourceFile);

      assert.equal(inferParameterType(ctx, param).length, 0);
    });
  });

  describe('module.superModule across multiple cartridges (pass-through + augmentation)', () => {
    // The dominant real-world plugin stack: every level does
    // `module.exports = base; module.exports.extra = fn;`. Members added at
    // an intermediate level live only in those augmentation assignments —
    // no candidate type can carry them — so both the member walk and the
    // completion listing have dedicated handling.
    const STACK_FILES = {
      '/types.d.ts': AMBIENT_TYPES,
      '/base/x.js': `
        function getSalePrice(p) { return p; }
        getSalePrice(getProduct());
        module.exports = { getSalePrice: getSalePrice };
      `,
      '/mid/x.js': `
        var base = module.superModule;
        function getMemberPrice(p) { return 'member'; }
        module.exports = base;
        module.exports.getMemberPrice = getMemberPrice;
      `,
      '/top/x.js': `
        var base = module.superModule;
        function promo(p) {
          var memberPrice = base.getMemberPrice(p);
          var salePrice = base.getSalePrice(p);
          return memberPrice;
        }
        module.exports = base;
        module.exports.promo = promo;
      `,
    };
    const STACK_ORDER = {
      '/top/x.js': '/mid/x.js',
      '/mid/x.js': '/base/x.js',
    };

    function findVarUse(sourceFile, text) {
      let found;
      const visit = (node) => {
        if (ts.isIdentifier(node) && node.text === text && ts.isVariableDeclaration(node.parent)) {
          found = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      return found;
    }

    it("resolves a member augmented at an intermediate overlay level (mid's getMemberPrice from top)", () => {
      const languageService = createFixtureLanguageService(STACK_FILES);
      const ctx = createInferenceContext(ts, languageService, (f) => STACK_ORDER[f]);
      const top = ctx.program.getSourceFile('/top/x.js');

      const types = inferTypeForNode(ctx, findVarUse(top, 'memberPrice'));

      assert.equal(describeTypes(ctx.checker, types), 'string');
    });

    it('still resolves a deep base member through the pass-through levels (base getSalePrice from top)', () => {
      const languageService = createFixtureLanguageService(STACK_FILES);
      const ctx = createInferenceContext(ts, languageService, (f) => STACK_ORDER[f]);
      const top = ctx.program.getSourceFile('/top/x.js');

      const types = inferTypeForNode(ctx, findVarUse(top, 'salePrice'));

      assert.equal(describeTypes(ctx.checker, types), '{ ID: string; name: string; }');
    });

    it('lists augmented members from every pass-through level for completions', () => {
      const {collectSuperModuleAugmentedMembers} = require('../plugin/usage-inference');
      const languageService = createFixtureLanguageService(STACK_FILES);
      const ctx = createInferenceContext(ts, languageService, (f) => STACK_ORDER[f]);
      const top = ctx.program.getSourceFile('/top/x.js');
      let baseUse;
      const visit = (node) => {
        if (
          ts.isIdentifier(node) &&
          node.text === 'base' &&
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node &&
          !baseUse
        ) {
          baseUse = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(top);

      const members = collectSuperModuleAugmentedMembers(ctx, baseUse);

      assert.deepEqual(members, [{name: 'getMemberPrice', isMethod: true}]);
    });
  });

  describe('cycle-truncated results and the memo', () => {
    it('does not memoize a result whose computation hit a cycle guard', () => {
      // b's result computed *inside* the a->b->a cycle is truncated by what
      // happened to be on the call stack; caching it would let a later,
      // out-of-cycle query in the same request get the truncated answer.
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

      inferReturnType(ctx, fnA);

      assert.ok(ctx.cycleHits > 0, 'expected the mutual recursion to actually trip a cycle guard');
      assert.equal(ctx.memo.size, 0, 'cycle-truncated results must not be memoized');
    });

    it('still memoizes results whose computation never hit a cycle guard', () => {
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

      inferParameterType(ctx, fn.parameters[0]);

      assert.equal(ctx.cycleHits, 0);
      assert.ok(ctx.memo.has(fn.parameters[0]), 'a clean computation should be memoized');
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
