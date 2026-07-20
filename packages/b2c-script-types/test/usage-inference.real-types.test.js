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
  inferTypeForNode,
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

  describe('callback parameters and iterator loops', () => {
    const VARIANT_FILES = {
      '/types.d.ts': realTypesPrelude(
        ['Product', 'ProductMgr', 'Collection', 'Variant'],
        '  function getSomeProduct(): Product<any>;',
      ),
      '/util/collections.js': `
        function forEach(collection, callback) {
          var it = collection.iterator();
          while (it.hasNext()) { callback(it.next()); }
        }
        module.exports = { forEach: forEach };
      `,
      '/variantHelpers.js': `
        var collections = require('./util/collections');
        function eachVariant(product) {
          collections.forEach(product.getVariants(), function (variant) {
            return variant.getID();
          });
        }
        function firstVariantName(product) {
          var iter = product.getVariants().iterator();
          while (iter.hasNext()) {
            var candidate = iter.next();
            return candidate.getName();
          }
          return null;
        }
        function useHelper() {
          eachVariant(getSomeProduct());
          firstVariantName(getSomeProduct());
        }
      `,
    };

    function findIdentifierUse(sourceFile, text) {
      let found;
      const visit = (node) => {
        if (
          ts.isIdentifier(node) &&
          node.text === text &&
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node
        ) {
          found = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      return found;
    }

    it('infers Variant for a collections.forEach callback parameter fed by an inferred Collection<Variant>', () => {
      // The full SFRA shape: an untyped collections util, a callback with no
      // name to search references for, and a collection argument that is
      // itself only typed by inferring the enclosing helper's parameter.
      const languageService = createFixtureLanguageService(VARIANT_FILES, {strict: true});
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/variantHelpers.js');
      let cbParam;
      const visit = (node) => {
        if (ts.isFunctionExpression(node) && !cbParam) cbParam = node.parameters[0];
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      const types = inferParameterType(ctx, cbParam);
      const names = completionNames(ts, ctx.checker, types);

      assert.equal(describeTypes(ctx.checker, types), 'Variant');
      assert.ok(names.includes('getID'));
      assert.ok(names.includes('getUPC'));
    });

    it('infers Variant through a manual iterator loop (iterator()/hasNext()/next())', () => {
      const languageService = createFixtureLanguageService(VARIANT_FILES, {strict: true});
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/variantHelpers.js');

      const iterTypes = inferTypeForNode(ctx, findIdentifierUse(sourceFile, 'iter'));
      assert.equal(describeTypes(ctx.checker, iterTypes), 'Iterator<Variant>');

      const ctx2 = createInferenceContext(ts, languageService);
      const candidateTypes = inferTypeForNode(ctx2, findIdentifierUse(sourceFile, 'candidate'));
      assert.equal(describeTypes(ctx2.checker, candidateTypes), 'Variant');
    });
  });

  describe('module.superModule overlays', () => {
    it('infers Money through an overlay calling an undocumented base helper (superModule + alias map + var chain)', () => {
      // Full SFRA plugin composition: the overlay reaches its base module via
      // module.superModule, calls an undocumented base helper whose own
      // parameter is only typed by a call site in a third file (reached
      // through the alias-map export), with every hop parked in a local var.
      const files = {
        '/base/cartridge/scripts/helpers/productHelpers.js': `
          function getSalePrice(product) {
            var priceModel = product.getPriceModel();
            var price = priceModel.getPrice();
            return price;
          }
          module.exports = {
            getSalePrice: getSalePrice
          };
        `,
        '/base/cartridge/scripts/cartService.js': `
          var ProductMgr = require('${REAL_DW_TYPES.ProductMgr}');
          var productHelpers = require('./helpers/productHelpers');
          function buildInfo(productId) {
            var product = ProductMgr.getProduct(productId);
            return productHelpers.getSalePrice(product);
          }
          module.exports = {buildInfo: buildInfo};
        `,
        '/custom/cartridge/scripts/helpers/productHelpers.js': `
          var base = module.superModule;
          function getMemberPrice(product) {
            var basePrice = base.getSalePrice(product);
            return basePrice;
          }
          module.exports = base;
          module.exports.getMemberPrice = getMemberPrice;
        `,
      };
      const resolver = (f) =>
        f === '/custom/cartridge/scripts/helpers/productHelpers.js'
          ? '/base/cartridge/scripts/helpers/productHelpers.js'
          : undefined;
      const languageService = createFixtureLanguageService(files, {strict: true});
      const ctx = createInferenceContext(ts, languageService, resolver);
      const overlay = ctx.program.getSourceFile('/custom/cartridge/scripts/helpers/productHelpers.js');
      const fn = findFunctionDeclaration(overlay, 'getMemberPrice');

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

    it('chases a var-of-var deep property chain with a real nullable middle step (availabilityModel.inventoryRecord)', () => {
      // Product.availabilityModel is non-null but
      // ProductAvailabilityModel.inventoryRecord is `ProductInventoryRecord |
      // null` in the real dw types — the property-access branch must strip
      // the nullable part before looking up members on the next hop.
      const files = {
        '/types.d.ts': realTypesPrelude(['Product', 'ProductMgr'], '  function getSomeProduct(): Product<any>;'),
        '/stockHelpers.js': `
          function isOrderable(product, quantity) {
            var availabilityModel = product.availabilityModel;
            var inventoryRecord = availabilityModel.inventoryRecord;
            return inventoryRecord.ATS.value >= quantity;
          }
          function useHelper() {
            var product = getSomeProduct();
            return isOrderable(product, 2);
          }
        `,
      };
      const languageService = createFixtureLanguageService(files, {strict: true});
      const ctx = createInferenceContext(ts, languageService);
      const sourceFile = ctx.program.getSourceFile('/stockHelpers.js');
      let recordIdentifier;
      const visit = (node) => {
        if (
          ts.isIdentifier(node) &&
          node.text === 'inventoryRecord' &&
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node
        ) {
          recordIdentifier = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      const types = inferTypeForNode(ctx, recordIdentifier);

      assert.equal(describeTypes(ctx.checker, types), 'ProductInventoryRecord | null');
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
