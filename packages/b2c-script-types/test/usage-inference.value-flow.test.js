/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

// Values that reach a parameter, variable or return through something other
// than a direct call: arrays built with push() and read back by index or
// array methods, members written into objects and read later, generic
// Script API calls such as Transaction.wrap, and downcasts the body makes
// after testing what it holds.

const assert = require('node:assert/strict');

const ts = require('typescript');

const {
  createInferenceContext,
  describeTypes,
  inferParameterType,
  inferReturnType,
  inferTypeForNode,
} = require('../src/usage-inference');
const {createFixtureLanguageService} = require('./helpers/fixture-language-service');
const {REAL_DW_TYPES, realTypesPrelude} = require('./helpers/real-dw-types');

const CART_TYPES = realTypesPrelude(
  ['Basket', 'Collection', 'Product', 'ProductLineItem'],
  `
  function getBasket(): Basket;
  function getProduct(): Product;
  function identity<T>(value: T): T;
`,
);

// Shared helpers the cases below call: an array filled by push() from a
// Script API iterator, the way SFRA's cart helpers collect line items.
const LINE_ITEM_HELPERS = `
  function lineItemsOf() {
    var items = [];
    var iterator = getBasket().getProductLineItems().iterator();
    while (iterator.hasNext()) {
      items.push(iterator.next());
    }
    return items;
  }
`;

/** The function a case targets: a declaration, or a function expression assigned to `x.name` / `name:`. */
function isFunctionNamed(node, name) {
  if (ts.isFunctionDeclaration(node)) return node.name?.text === name;
  if (!ts.isFunctionExpression(node)) return false;
  const parent = node.parent;
  if (ts.isBinaryExpression(parent) && ts.isPropertyAccessExpression(parent.left))
    return parent.left.name.text === name;
  return ts.isPropertyAssignment(parent) && parent.name.getText() === name;
}

const FINDERS = {
  return: (node, name) => isFunctionNamed(node, name),
  param: (node, name) => ts.isParameter(node) && ts.isIdentifier(node.name) && node.name.text === name,
  var: (node, name) => ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name,
};

const INFER = {
  return: (ctx, node) => inferReturnType(ctx, node),
  param: (ctx, node) => inferParameterType(ctx, node),
  var: (ctx, node) => inferTypeForNode(ctx, node.name),
};

/** Infers `kind` (`return`, `param`, `var`) for the first node called `name` in `/helper.js`. */
function infer(types, source, kind, name) {
  const languageService = createFixtureLanguageService({'/types.d.ts': types, '/helper.js': source});
  const ctx = createInferenceContext(ts, languageService);
  let target;
  const visit = (node) => {
    if (!target && FINDERS[kind](node, name)) target = node;
    if (!target) ts.forEachChild(node, visit);
  };
  visit(ctx.program.getSourceFile('/helper.js'));
  assert.ok(target, `no ${kind} target named ${name}`);
  return describeTypes(ctx, INFER[kind](ctx, target));
}

function runCases(cases) {
  for (const {title, types = CART_TYPES, source, kind, name, expected} of cases) {
    it(title, () => {
      assert.equal(infer(types, source, kind, name), expected);
    });
  }
}

describe('usage-inference — arrays and element access', () => {
  runCases([
    {
      title: 'an array literal filled by push() is an array of what was pushed',
      source: LINE_ITEM_HELPERS,
      kind: 'return',
      name: 'lineItemsOf',
      expected: 'ProductLineItem[]',
    },
    {
      title: 'the variable holding a push()-built array reads as that array',
      source: LINE_ITEM_HELPERS,
      kind: 'var',
      name: 'items',
      expected: 'ProductLineItem[]',
    },
    {
      title: 'indexing an inferred array yields its element',
      source: `${LINE_ITEM_HELPERS} function firstLineItem() { return lineItemsOf()[0]; }`,
      kind: 'return',
      name: 'firstLineItem',
      expected: 'ProductLineItem',
    },
    {
      title: 'indexing a Script API collection (no index signature) yields its element',
      source: 'function firstOf(basket) { return basket.productLineItems[0]; } firstOf(getBasket());',
      kind: 'return',
      name: 'firstOf',
      expected: 'ProductLineItem',
    },
    {
      title: 'filter() on an inferred array keeps the element type, as the lib declares it',
      source: `${LINE_ITEM_HELPERS} function giftItems() { return lineItemsOf().filter(function (item) { return item.gift; }); }`,
      kind: 'return',
      name: 'giftItems',
      expected: 'ProductLineItem[]',
    },
    {
      title: 'find() on an inferred array yields an element',
      source: `${LINE_ITEM_HELPERS} function giftItem() { return lineItemsOf().find(function (item) { return item.gift; }); }`,
      kind: 'return',
      name: 'giftItem',
      expected: 'ProductLineItem',
    },
    {
      title: "a native array method's callback parameter is typed from the inferred receiver",
      source: `${LINE_ITEM_HELPERS} function names() { return lineItemsOf().map(function (lineItem) { return lineItem.productName; }); }`,
      kind: 'param',
      name: 'lineItem',
      expected: 'ProductLineItem',
    },
    {
      title: 'reduce() types the current element but not an accumulator its overloads disagree on',
      source: `${LINE_ITEM_HELPERS} function count() { return lineItemsOf().reduce(function (total, line) { return total + line.quantityValue; }, 0); }`,
      kind: 'param',
      name: 'line',
      expected: 'ProductLineItem',
    },
    {
      title: 'the reduce() accumulator stays silent',
      source: `${LINE_ITEM_HELPERS} function count() { return lineItemsOf().reduce(function (total, line) { return total + line.quantityValue; }, 0); }`,
      kind: 'param',
      name: 'total',
      expected: '',
    },
    {
      title: 'an array literal of one inferred type is an array of it',
      source: 'function wrap(product) { return [product]; } wrap(getProduct());',
      kind: 'return',
      name: 'wrap',
      expected: 'Product[]',
    },
    {
      title: 'a spread copies the element type',
      source: `${LINE_ITEM_HELPERS} function copy() { return [...lineItemsOf()]; }`,
      kind: 'return',
      name: 'copy',
      expected: 'ProductLineItem[]',
    },
    {
      title: 'an array literal mixing unrelated types names no array',
      source: 'function pair(product, basket) { return [product, basket]; } pair(getProduct(), getBasket());',
      kind: 'return',
      name: 'pair',
      expected: '',
    },
  ]);
});

describe('usage-inference — member values', () => {
  runCases([
    {
      title: "an object literal member reads as the value it was built with (SFRA getConfig's options.apiProduct)",
      source: `
        function getConfig(apiProduct) { return {apiProduct: apiProduct, quantity: 1}; }
        function show() { var options = getConfig(getProduct()); return options.apiProduct; }
      `,
      kind: 'return',
      name: 'show',
      expected: 'Product',
    },
    {
      title: 'a shorthand member reads as the variable it copies',
      source: `
        function getMatching() { var basket = getBasket(); var lineItems = basket.productLineItems; return {lineItems}; }
        function matching() { return getMatching().lineItems; }
      `,
      kind: 'return',
      name: 'matching',
      expected: 'Collection<ProductLineItem>',
    },
    {
      title: "a constructor's this.member reads as the argument stored in it",
      source: `
        function Model(product) { this.product = product; }
        Model.prototype.current = function () { return this.product; };
        new Model(getProduct());
      `,
      kind: 'return',
      name: 'current',
      expected: 'Product',
    },
    {
      title: 'a member written on an untyped local reads back as the value written',
      source: `
        function cachedProduct(viewData) {
          var data = viewData && viewData.product;
          if (data.apiProduct === undefined) {
            data.apiProduct = getProduct() || null;
          }
          return data.apiProduct;
        }
      `,
      kind: 'return',
      name: 'cachedProduct',
      expected: 'Product',
    },
  ]);
});

describe('usage-inference — generic calls', () => {
  const TRANSACTION_TYPES = `
    import TransactionClass = require('${REAL_DW_TYPES.Transaction}');
    import Basket = require('${REAL_DW_TYPES.Basket}');
    declare global {
      var Transaction: typeof TransactionClass;
      function getBasket(): Basket;
    }
  `;

  runCases([
    {
      title: 'Transaction.wrap(callback) returns what its callback returns',
      types: TRANSACTION_TYPES,
      source: `
        function save(basket) { return Transaction.wrap(function () { return basket; }); }
        save(getBasket());
      `,
      kind: 'return',
      name: 'save',
      expected: 'Basket',
    },
    {
      title: 'a generic identity returns its argument',
      source: 'function same(product) { return identity(product); } same(getProduct());',
      kind: 'return',
      name: 'same',
      expected: 'Product',
    },
  ]);
});

describe('usage-inference — downcasts in the body', () => {
  runCases([
    {
      title: 'a body calling a member only subclasses have keeps the argument class when several subclasses do',
      types: realTypesPrelude(['Product', 'Variant', 'VariationGroup'], 'function getProduct(): Product;'),
      source: `
        function describe(apiProduct, productType) {
          var category = apiProduct.getPrimaryCategory();
          if (productType === 'variant') {
            category = apiProduct.getMasterProduct().getPrimaryCategory();
          }
          return category;
        }
        describe(getProduct(), 'variant');
      `,
      kind: 'param',
      name: 'apiProduct',
      expected: 'Product',
    },
    {
      title: 'a body relying on members only one subclass has narrows the argument to it',
      types: realTypesPrelude(
        ['PaymentInstrument', 'OrderPaymentInstrument', 'CustomerPaymentInstrument'],
        'function getPaymentInstrument(): PaymentInstrument;',
      ),
      source: `
        function amountOf(paymentInstrument) { return paymentInstrument.paymentTransaction.amount; }
        amountOf(getPaymentInstrument());
      `,
      kind: 'param',
      name: 'paymentInstrument',
      expected: 'OrderPaymentInstrument',
    },
  ]);
});
