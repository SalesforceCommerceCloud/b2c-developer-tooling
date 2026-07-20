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
  typesToCompletionEntries,
} = require('../plugin/usage-inference');
const {createFixtureLanguageService, findFunctionDeclaration} = require('./helpers/fixture-language-service');
const {REAL_DW_TYPES, realTypesPrelude} = require('./helpers/real-dw-types');

// Builds the fixture LanguageService + inference context + target function
// node in one call, so each test body only has to state its fixture and its
// assertion.
function setupInference(files, jsFileName, fnName) {
  const languageService = createFixtureLanguageService(files, {strict: true});
  const ctx = createInferenceContext(ts, languageService);
  const sourceFile = ctx.program.getSourceFile(jsFileName);
  const fn = findFunctionDeclaration(sourceFile, fnName);
  return {ctx, fn};
}

function completionNames(ts_, checker, types) {
  return typesToCompletionEntries(ts_, checker, types)
    .map((e) => e.name)
    .sort();
}

// This whole suite exercises the engine against the *real*, bundled dw.*
// type declarations (Product, Order, Money, ...) rather than small stand-in
// ambient shapes, since that's what a real cartridge actually resolves
// against — the tests in usage-inference.test.js cover the engine's
// mechanics in isolation; these cover it against a realistic SFCC Script API
// surface: real generics, real overloads, real nullability, real deep
// chains, matching how b2c-vs-extension#script-types-infer-usage.test.ts
// exercises the same feature end-to-end in VS Code.
describe('usage-inference — real dw.* Script API types (Product, Order)', () => {
  describe('happy paths', () => {
    const PRODUCT_HELPER_FILES = {
      '/types.d.ts': realTypesPrelude(['Product', 'ProductMgr'], '  function getSomeProduct(): Product<any>;'),
      '/productHelpers.js': `
        function getDisplayName(product) {
          return product.getName();
        }
        function useHelper() {
          var product = getSomeProduct();
          return getDisplayName(product);
        }
      `,
    };

    it('infers dw.catalog.Product for an undocumented parameter from a single ProductMgr.getProduct() call site', () => {
      const {ctx, fn} = setupInference(PRODUCT_HELPER_FILES, '/productHelpers.js', 'getDisplayName');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(describeTypes(ctx.checker, types), 'Product<any>');
    });

    it('offers real dw.catalog.Product members (getID, getName, getPriceModel) as synthesized completions', () => {
      const {ctx, fn} = setupInference(PRODUCT_HELPER_FILES, '/productHelpers.js', 'getDisplayName');

      const types = inferParameterType(ctx, fn.parameters[0]);
      const names = completionNames(ts, ctx.checker, types);

      assert.ok(names.includes('getID'));
      assert.ok(names.includes('getName'));
      assert.ok(names.includes('getPriceModel'));
    });

    it('infers dw.order.Order for an undocumented parameter from an OrderMgr.getOrder() call site', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Order', 'OrderMgr'], '  function getSomeOrder(): Order;'),
        '/orderHelpers.js': `
          function getOrderNumber(order) {
            return order.getOrderNo();
          }
          function useHelper() {
            var order = getSomeOrder();
            return getOrderNumber(order);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/orderHelpers.js', 'getOrderNumber');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(describeTypes(ctx.checker, types), 'Order');
    });
  });

  describe('deep nesting', () => {
    const PRICING_HELPER_FILES = {
      '/types.d.ts': realTypesPrelude(['Product', 'ProductMgr'], '  function getSomeProduct(): Product<any>;'),
      '/pricingHelpers.js': `
        function resolveProductPrice(product) {
          return product.getPriceModel().getPrice();
        }
        function useHelper() {
          var product = getSomeProduct();
          return resolveProductPrice(product);
        }
      `,
    };

    it("resolves an undocumented helper's own return type through a real two-hop method chain (product.getPriceModel().getPrice())", () => {
      const {ctx, fn} = setupInference(PRICING_HELPER_FILES, '/pricingHelpers.js', 'resolveProductPrice');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), 'Money');
    });

    it('offers real dw.value.Money members for the deep-chain-inferred return type', () => {
      const {ctx, fn} = setupInference(PRICING_HELPER_FILES, '/pricingHelpers.js', 'resolveProductPrice');

      const types = inferReturnType(ctx, fn);
      const names = completionNames(ts, ctx.checker, types);

      assert.ok(names.includes('getValue'));
      assert.ok(names.includes('getCurrencyCode'));
    });

    it('resolves a method-chain return type when the receiver traces back to a real nullable getter (ProductMgr.getProduct(): Product | null)', () => {
      // Regression test: resolveExpressionTypes's chain-hop branch looked up
      // each method directly on the receiver's apparent type without
      // stripping nullability first, so a receiver inferred from a real,
      // nullable SFCC getter (the common shape — nearly every dw.*Mgr getter
      // returns `T | null`) made `getPropertyOfType` return nothing for every
      // hop, silently reducing the whole chain to `[]` instead of `Money`.
      const files = {
        '/pricingHelpers.js': `
          function resolveProductPrice(product) {
            return product.getPriceModel().getPrice();
          }
          function useHelper() {
            var ProductMgr = require('${REAL_DW_TYPES.ProductMgr}');
            var product = ProductMgr.getProduct('some-id');
            return resolveProductPrice(product);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/pricingHelpers.js', 'resolveProductPrice');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), 'Money');
    });

    it('resolves the same chain split across an intermediate local variable — the idiomatic SFCC style', () => {
      // Same result as the inline `product.getPriceModel().getPrice()` test
      // above, but written the way real SFRA helpers are: chain hops assigned
      // to `var`s along the way. Regression test — variable indirection used
      // to dead-end inference entirely while the inline version worked.
      const files = {
        '/pricingHelpers.js': `
          function resolveProductPrice(product) {
            var priceModel = product.getPriceModel();
            return priceModel.getPrice();
          }
          function useHelper() {
            var ProductMgr = require('${REAL_DW_TYPES.ProductMgr}');
            var product = ProductMgr.getProduct('some-id');
            return resolveProductPrice(product);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/pricingHelpers.js', 'resolveProductPrice');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), 'Money');
    });

    it('resolves a three-hop chain (order.getCustomer().getProfile().getEmail()) through an undocumented helper', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Order', 'OrderMgr'], '  function getSomeOrder(): Order;'),
        '/customerHelpers.js': `
          function resolveCustomerEmail(order) {
            return order.getCustomer().getProfile().getEmail();
          }
          function useHelper() {
            var order = getSomeOrder();
            return resolveCustomerEmail(order);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/customerHelpers.js', 'resolveCustomerEmail');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), 'string');
    });

    it('chases a chain through two forwarding undocumented helpers before reaching the real method call', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Product', 'ProductMgr'], '  function getSomeProduct(): Product<any>;'),
        '/pricingHelpers.js': `
          function resolveProductPrice(product) {
            return getPriceInternal(product);
          }
          function getPriceInternal(p) {
            return p.getPriceModel().getPrice();
          }
          function useHelper() {
            var product = getSomeProduct();
            return resolveProductPrice(product);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/pricingHelpers.js', 'resolveProductPrice');

      const types = inferReturnType(ctx, fn);

      assert.equal(describeTypes(ctx.checker, types), 'Money');
    });
  });

  describe('edge cases', () => {
    it('still offers real member completions when the inferred type is nullable (ProductMgr.getProduct(): Product | null)', () => {
      // ProductMgr.getProduct's real signature returns `Product<any> | null` —
      // this is the exact shape that regressed completions in production
      // (getPropertiesOfType on a union only returns members common to every
      // constituent, and null contributes none).
      const files = {
        '/consumer.js': `
          function getDisplayName(product) {
            return product.getName();
          }
          function useHelper() {
            var ProductMgr = require('${REAL_DW_TYPES.ProductMgr}');
            var product = ProductMgr.getProduct('some-id');
            return getDisplayName(product);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/consumer.js', 'getDisplayName');

      const types = inferParameterType(ctx, fn.parameters[0]);
      const names = completionNames(ts, ctx.checker, types);

      assert.ok(names.includes('getID'));
      assert.ok(names.includes('getName'));
    });

    it('unions candidate types across call sites passing different real dw.* classes (Product and Category)', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(
          ['Product', 'ProductMgr', 'Category'],
          '  function getSomeProduct(): Product<any>;\n  function getSomeCategory(): Category;',
        ),
        '/consumer.js': `
          function describe(thing) {
            return thing;
          }
          describe(getSomeProduct());
          describe(getSomeCategory());
        `,
      };
      const {ctx, fn} = setupInference(files, '/consumer.js', 'describe');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(describeTypes(ctx.checker, types), 'Product<any> | Category');
    });

    it('does not infer a false-positive type for a Product-shaped helper that is never called', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Product'], ''),
        '/productHelpers.js': `
          function getDisplayName(product) {
            return product.getName();
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/productHelpers.js', 'getDisplayName');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(types.length, 0);
    });

    it('synthesizes real members for a generic collection candidate type (Collection<Variant>) without special-casing generics', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(
          ['Product', 'ProductMgr', 'Collection', 'Variant'],
          '  function getSomeProduct(): Product<any>;',
        ),
        '/variantHelpers.js': `
          function countVariants(variants) {
            return variants.getLength();
          }
          function useHelper() {
            var product = getSomeProduct();
            return countVariants(product.getVariants());
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/variantHelpers.js', 'countVariants');

      const types = inferParameterType(ctx, fn.parameters[0]);
      const names = completionNames(ts, ctx.checker, types);

      assert.ok(describeTypes(ctx.checker, types).startsWith('Collection<'));
      assert.ok(names.includes('getLength'));
      assert.ok(names.includes('toArray'));
    });
  });
});
