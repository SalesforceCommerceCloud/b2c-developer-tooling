/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

// Values that reach a parameter, variable or return through something other
// than a direct call: arrays built with push() and read back by index or
// array methods, members written into objects and read later, generic
// Script API calls such as Transaction.wrap, downcasts the body makes after
// testing what it holds, and constructors that travel as values (exported,
// returned by a factory, passed as an argument) before they are called.

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

/** The first node in `fileName` that `kind`'s finder accepts for `name`. */
function findTarget(ctx, fileName, kind, name) {
  let target;
  const visit = (node) => {
    if (!target && FINDERS[kind](node, name)) target = node;
    if (!target) ts.forEachChild(node, visit);
  };
  visit(ctx.program.getSourceFile(fileName));
  assert.ok(target, `no ${kind} target named ${name} in ${fileName}`);
  return target;
}

/**
 * Infers `kind` (`return`, `param`, `var`) for the first node called `name`
 * in `file` (default `/helper.js`), with `source` as `/helper.js` and any
 * further `files` beside it.
 */
function infer({types = CART_TYPES, source, files = {}, file = '/helper.js', kind, name}) {
  const sources = source === undefined ? files : {'/helper.js': source, ...files};
  const languageService = createFixtureLanguageService({'/types.d.ts': types, ...sources});
  const ctx = createInferenceContext(ts, languageService);
  return describeTypes(ctx, INFER[kind](ctx, findTarget(ctx, file, kind, name)));
}

function runCases(cases) {
  for (const {title, expected, ...target} of cases) {
    it(title, () => {
      assert.equal(infer(target), expected);
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

describe('usage-inference — constructors as values', () => {
  const REFINEMENT_TYPES = realTypesPrelude(
    ['Category', 'ProductSearchModel', 'ProductSearchRefinementValue'],
    `
    function getSearch(): ProductSearchModel;
    function getCategory(): Category;
    function getRefinementValue(): ProductSearchRefinementValue;
  `,
  );

  // The shape of SFRA's search refinements: a model keeps its constructor
  // arguments on `this` and reads them in prototype methods, a wrapper builds
  // it with `new`, the module exports the wrapper, a factory picks the module
  // with an unbound `return require(...)`, and the caller passes the chosen
  // constructor on to the function that finally calls `new Model(...)`.
  const REFINEMENT_FILES = {
    '/models/boolean.js': `
      function BooleanValue(productSearch, refinementValue) {
        this.productSearch = productSearch;
        this.refinementValue = refinementValue;
        this.initialize();
      }
      BooleanValue.prototype.initialize = function () {
        this.hitCount = this.refinementValue.hitCount;
        this.displayValue = this.refinementValue.displayValue;
      };
      function BooleanValueWrapper(productSearch, rawValue) {
        var value = new BooleanValue(productSearch, rawValue);
        return {hitCount: value.hitCount, displayValue: value.displayValue};
      }
      module.exports = BooleanValueWrapper;
    `,
    '/models/category.js': `
      function CategoryValue(productSearch, category) { this.id = category.ID; }
      module.exports = CategoryValue;
    `,
    '/factory.js': `
      function getModel(isCategory) {
        if (isCategory) {
          return require('./models/category');
        }
        return require('./models/boolean');
      }
      function createCategoryRefinements(productSearch, Model) {
        return [new Model(productSearch, productSearch.category)];
      }
      function createRefinements(productSearch, isCategory) {
        var Model = getModel(isCategory);
        if (isCategory) {
          return createCategoryRefinements(productSearch, Model);
        }
        return [new Model(productSearch, getRefinementValue())];
      }
      module.exports = {createRefinements: createRefinements};
    `,
    '/search.js': `
      var factory = require('./factory');
      factory.createRefinements(getSearch(), false);
    `,
  };

  runCases([
    {
      title: 'a constructor returned by a factory as an unbound require() is called where the factory result is',
      types: REFINEMENT_TYPES,
      files: REFINEMENT_FILES,
      file: '/models/boolean.js',
      kind: 'param',
      name: 'productSearch',
      expected: 'ProductSearchModel',
    },
    {
      // Category only reaches it through the parameter; the factory may
      // return either module, so the direct call adds the refinement value.
      title: 'a constructor passed as an argument is called where the receiving parameter is',
      types: REFINEMENT_TYPES,
      files: REFINEMENT_FILES,
      file: '/models/category.js',
      kind: 'param',
      name: 'category',
      expected: 'ProductSearchRefinementValue | Category',
    },
    {
      title: "members read off this.<stored argument> in prototype methods narrow the model's own parameter",
      types: REFINEMENT_TYPES,
      files: REFINEMENT_FILES,
      file: '/models/boolean.js',
      kind: 'param',
      name: 'refinementValue',
      expected: 'ProductSearchRefinementValue',
    },
    {
      title: 'a wrapper parameter passed on to new Model(x) is narrowed by what Model does with it',
      types: REFINEMENT_TYPES,
      files: REFINEMENT_FILES,
      file: '/models/boolean.js',
      kind: 'param',
      name: 'rawValue',
      expected: 'ProductSearchRefinementValue',
    },
    {
      title: 'exports.name = fn is called through the requiring module',
      files: {
        '/helper.js': 'function describeItem(product) { return product.name; } exports.describeItem = describeItem;',
        '/consumer.js': "var helper = require('./helper'); helper.describeItem(getProduct());",
      },
      kind: 'param',
      name: 'product',
      expected: 'Product',
    },
    {
      title: 'module.exports = Name is called through every name a require() binds it to',
      files: {
        '/helper.js': 'function Item(product) { this.name = product.name; } module.exports = Item;',
        '/consumer.js': "var LineItemModel = require('./helper'); new LineItemModel(getProduct());",
      },
      kind: 'param',
      name: 'product',
      expected: 'Product',
    },
  ]);

  // Two call sites pass unrelated classes; only what the value is used for,
  // possibly several functions away, tells them apart.
  const forwarded = (chain) => `
    ${chain}
    first(getRefinementValue());
    first(getCategory());
  `;

  runCases([
    {
      title: 'without usage, unrelated call-site classes stay a union',
      types: REFINEMENT_TYPES,
      source: forwarded('function first(value) { return value; }'),
      kind: 'param',
      name: 'value',
      expected: 'ProductSearchRefinementValue | Category',
    },
    {
      title: 'usage of the parameter it is passed to through Base.call(this, x) narrows a subclass constructor',
      types: REFINEMENT_TYPES,
      source: forwarded(`
        function Base(value) { this.value = value; }
        Base.prototype.count = function () { return this.value.hitCount; };
        function first(value) { Base.call(this, value); }
      `),
      kind: 'param',
      name: 'value',
      expected: 'ProductSearchRefinementValue',
    },
    {
      title: 'usage three functions away still narrows the parameter',
      types: REFINEMENT_TYPES,
      source: forwarded(`
        function first(value) { return second(value); }
        function second(value) { return third(value); }
        function third(value) { return fourth(value); }
        function fourth(value) { return value.hitCount; }
      `),
      kind: 'param',
      name: 'value',
      expected: 'ProductSearchRefinementValue',
    },
    {
      title: 'usage four functions away is beyond MAX_USAGE_FORWARDING_HOPS',
      types: REFINEMENT_TYPES,
      source: forwarded(`
        function first(value) { return second(value); }
        function second(value) { return third(value); }
        function third(value) { return fourth(value); }
        function fourth(value) { return fifth(value); }
        function fifth(value) { return value.hitCount; }
      `),
      kind: 'param',
      name: 'value',
      expected: 'ProductSearchRefinementValue | Category',
    },
  ]);

  it('follows a function-local name without spending the project-wide search budget', () => {
    const languageService = createFixtureLanguageService({
      '/types.d.ts': CART_TYPES,
      '/helper.js': `
        function show(product) { return product.name; }
        function run() { var render = show; render(getProduct()); }
      `,
    });
    let searches = 0;
    const getReferencesAtPosition = languageService.getReferencesAtPosition.bind(languageService);
    languageService.getReferencesAtPosition = (fileName, position) => {
      searches++;
      return getReferencesAtPosition(fileName, position);
    };
    const ctx = createInferenceContext(ts, languageService);
    ctx.searchBudget = 1;

    const types = inferParameterType(ctx, findTarget(ctx, '/helper.js', 'param', 'product'));

    assert.equal(describeTypes(ctx, types), 'Product');
    assert.equal(searches, 2, 'one search for show, one for the local render');
    assert.equal(ctx.searchBudget, 0, 'only the search for show is charged');
  });
});
