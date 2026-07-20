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
const {createFixtureLanguageService} = require('./helpers/fixture-language-service');

const AMBIENT_TYPES = `
declare function getProduct(): {ID: string; name: string};
declare function getInventory(): {quantity: number};
`;

function findFunctionDeclaration(sourceFile, name) {
  let found;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === name) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!found) throw new Error(`function ${name} not found`);
  return found;
}

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
