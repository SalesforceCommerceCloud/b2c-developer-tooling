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
const {countReferenceSearches} = require('./helpers/reference-searches');

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

// An array filled with two unrelated Script API classes.
const MIXED_ITEMS = `
  function mixedItems() {
    var items = [];
    items.push(getProduct());
    items.push(getBasket());
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
 * further `files` beside it, and what the plugin `host` supplies.
 */
function infer({types = CART_TYPES, source, files = {}, file = '/helper.js', kind, name, host}) {
  const sources = source === undefined ? files : {'/helper.js': source, ...files};
  const languageService = createFixtureLanguageService({'/types.d.ts': types, ...sources});
  const ctx = createInferenceContext(ts, languageService, host);
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
      title: 'an array literal mixing unrelated types is an array of their union',
      source: 'function pair(product, basket) { return [product, basket]; } pair(getProduct(), getBasket());',
      kind: 'return',
      name: 'pair',
      expected: '(Product | Basket)[]',
    },
    {
      title: 'an array filled by push() with unrelated types is an array of their union',
      source: MIXED_ITEMS,
      kind: 'return',
      name: 'mixedItems',
      expected: '(Product | Basket)[]',
    },
    {
      title: "a native array method's callback parameter on a mixed array is either element",
      source: `${MIXED_ITEMS} function ids() { return mixedItems().map(function (entry) { return entry.UUID; }); }`,
      kind: 'param',
      name: 'entry',
      expected: 'Product | Basket',
    },
    {
      title: 'an array literal of more unrelated types than a union shows names no array',
      source: "function row(product, basket) { return [product, basket, 'x', 1]; } row(getProduct(), getBasket());",
      kind: 'return',
      name: 'row',
      expected: '',
    },
    {
      title: 'an array of booleans reads as boolean[]',
      source: 'function flags(product) { return [product.online, product.searchable]; } flags(getProduct());',
      kind: 'return',
      name: 'flags',
      expected: 'boolean[]',
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
    const searches = countReferenceSearches();
    const ctx = createInferenceContext(ts, languageService);
    ctx.searchBudget = 1;

    try {
      const types = inferParameterType(ctx, findTarget(ctx, '/helper.js', 'param', 'product'));

      assert.equal(describeTypes(ctx, types), 'Product');
      assert.equal(searches.total(), 2, 'one search for show, one for the local render');
      assert.equal(ctx.searchBudget, 0, 'only the search for show is charged');
    } finally {
      searches.stop();
    }
  });
});

describe('usage-inference — call-specific returns', () => {
  // `{dw.util.Collection}` the way SFRA's JSDoc writes it: no type argument,
  // so the checker reads every element as `any`.
  const COLLECTION_TYPES = `
    import Basket = require('${REAL_DW_TYPES.Basket}');
    import DwCollection = require('${REAL_DW_TYPES.Collection}');
    declare global {
      namespace dw.util { type Collection<T> = DwCollection<T>; }
      function getBasket(): Basket;
    }
  `;

  // SFRA's collections.find, first and map, verbatim but for comments.
  const COLLECTIONS = `
    /**
     * @param {dw.util.Collection} collection - Collection subclass instance to find value in
     * @param {Function} match - Match function
     * @returns {Object|null} Single item from the collection
     */
    function find(collection, match) {
      var result = null;
      if (collection) {
        var iterator = collection.iterator();
        while (iterator.hasNext()) {
          var item = iterator.next();
          if (match(item)) {
            result = item;
            break;
          }
        }
      }
      return result;
    }
    /**
     * @param {dw.util.Collection} collection - Collection subclass instance to work with
     * @return {Object|null} First element from the collection
     */
    function first(collection) {
      var iterator = collection.iterator();
      return iterator.hasNext() ? iterator.next() : null;
    }
    /**
     * @param {dw.util.Collection} collection - Collection subclass instance to map over
     * @param {Function} callback - Callback function for each item
     * @param {Object} [scope] - Optional execution scope to pass to callback
     * @returns {Array} Array of results of map
     */
    function map(collection, callback, scope) {
      var iterator = Object.hasOwnProperty.call(collection, 'iterator')
        ? collection.iterator()
        : collection;
      var index = 0;
      var item = null;
      var result = [];
      while (iterator.hasNext()) {
        item = iterator.next();
        result.push(scope ? callback.call(scope, item, index, collection)
          : callback(item, index, collection));
        index++;
      }
      return result;
    }
    module.exports = {find: find, first: first, map: map};
  `;

  const callers = (source) => ({
    '/collections.js': COLLECTIONS,
    '/helper.js': `
      var collections = require('./collections');
      ${source}
      shipmentByUUID(getBasket(), 'uuid');
      lineItemByUUID(getBasket(), 'uuid');
    `,
  });

  runCases([
    {
      title: 'collections.find over basket.shipments returns a Shipment',
      types: COLLECTION_TYPES,
      files: callers(`
        function shipmentByUUID(basket, uuid) {
          return collections.find(basket.shipments, function (shipment) { return shipment.UUID === uuid; });
        }
        function lineItemByUUID(basket, uuid) {
          return collections.find(basket.productLineItems, function (item) { return item.UUID === uuid; });
        }
      `),
      kind: 'return',
      name: 'shipmentByUUID',
      expected: 'Shipment',
    },
    {
      title: 'the same helper over basket.productLineItems returns a ProductLineItem',
      types: COLLECTION_TYPES,
      files: callers(`
        function shipmentByUUID(basket, uuid) {
          return collections.find(basket.shipments, function (shipment) { return shipment.UUID === uuid; });
        }
        function lineItemByUUID(basket, uuid) {
          return collections.find(basket.productLineItems, function (item) { return item.UUID === uuid; });
        }
      `),
      kind: 'return',
      name: 'lineItemByUUID',
      expected: 'ProductLineItem',
    },
    {
      title: 'collections.first returns an element of the collection it is given',
      types: COLLECTION_TYPES,
      files: callers(`
        function shipmentByUUID(basket) { return collections.first(basket.shipments); }
        function lineItemByUUID(basket) { return collections.first(basket.productLineItems); }
      `),
      kind: 'return',
      name: 'shipmentByUUID',
      expected: 'Shipment',
    },
    {
      title: 'the helper itself, across all of its callers, stays silent',
      types: COLLECTION_TYPES,
      files: callers(`
        function shipmentByUUID(basket) { return collections.first(basket.shipments); }
        function lineItemByUUID(basket) { return collections.first(basket.productLineItems); }
      `),
      file: '/collections.js',
      kind: 'return',
      name: 'first',
      expected: '',
    },
    {
      title: 'a wrapper passing its own parameter on binds through both calls',
      types: COLLECTION_TYPES,
      files: callers(`
        function findIn(items, uuid) {
          return collections.find(items, function (item) { return item.UUID === uuid; });
        }
        function shipmentByUUID(basket, uuid) { return findIn(basket.shipments, uuid); }
        function lineItemByUUID(basket, uuid) { return findIn(basket.productLineItems, uuid); }
      `),
      kind: 'return',
      name: 'lineItemByUUID',
      expected: 'ProductLineItem',
    },
    {
      title: 'the wrapper across its callers is the union of what they pass',
      types: COLLECTION_TYPES,
      files: callers(`
        function findIn(items, uuid) {
          return collections.find(items, function (item) { return item.UUID === uuid; });
        }
        function shipmentByUUID(basket, uuid) { return findIn(basket.shipments, uuid); }
        function lineItemByUUID(basket, uuid) { return findIn(basket.productLineItems, uuid); }
      `),
      kind: 'return',
      name: 'findIn',
      expected: 'Shipment | ProductLineItem',
    },
    {
      title: 'a call-specific variable reads as the element it is assigned',
      types: COLLECTION_TYPES,
      files: callers(`
        function shipmentByUUID(basket, uuid) {
          var shipment = collections.find(basket.shipments, function (s) { return s.UUID === uuid; });
          return shipment;
        }
        function lineItemByUUID() {}
      `),
      kind: 'var',
      name: 'shipment',
      expected: 'Shipment',
    },
    {
      title: 'an argument the declared parameter type rules out binds nothing',
      types: COLLECTION_TYPES,
      files: callers(`
        function shipmentByUUID(basket) { return collections.first(basket); }
        function lineItemByUUID() {}
      `),
      kind: 'return',
      name: 'shipmentByUUID',
      expected: '',
    },
  ]);

  describe('callbacks', () => {
    // What `callback(item)` returns inside a helper inferred for one call is
    // what the function that call passes returns, for those arguments.
    const helpers = (source) => ({'/collections.js': COLLECTIONS, '/helper.js': source});

    runCases([
      {
        title: 'collections.map returns an array of what its callback returns for each element',
        types: COLLECTION_TYPES,
        files: helpers(`
          var collections = require('./collections');
          function addresses(basket) {
            return collections.map(basket.shipments, function (shipment) { return shipment.shippingAddress; });
          }
          addresses(getBasket());
        `),
        kind: 'return',
        name: 'addresses',
        expected: 'OrderAddress[]',
      },
      {
        title: 'a model constructed in the callback makes an array of that model',
        types: COLLECTION_TYPES,
        files: helpers(`
          var collections = require('./collections');
          function ShippingModel(shipment) { this.uuid = shipment.UUID; }
          function shippingModels(basket) {
            return collections.map(basket.shipments, function (shipment) { return new ShippingModel(shipment); });
          }
          shippingModels(getBasket());
        `),
        kind: 'return',
        name: 'shippingModels',
        expected: 'ShippingModel[]',
      },
      {
        title: 'a callback a wrapper passes on as is is the one called',
        types: COLLECTION_TYPES,
        files: helpers(`
          var collections = require('./collections');
          function mapShipments(basket, fn) { return collections.map(basket.shipments, fn); }
          function addresses(basket) {
            return mapShipments(basket, function (shipment) { return shipment.shippingAddress; });
          }
          addresses(getBasket());
        `),
        kind: 'return',
        name: 'addresses',
        expected: 'OrderAddress[]',
      },
      {
        title: 'the callback’s parameters are what it is called with',
        types: COLLECTION_TYPES,
        files: helpers(`
          function applyTo(value, fn) { return fn(value); }
          function defaultShipmentOf() {
            return applyTo(getBasket(), function (basket) { return basket.defaultShipment; });
          }
        `),
        kind: 'return',
        name: 'defaultShipmentOf',
        expected: 'Shipment',
      },
      {
        title: 'callback.call(scope, x) passes x, not scope, as the first parameter',
        types: COLLECTION_TYPES,
        files: helpers(`
          function withFirst(collection, fn) {
            var iterator = collection.iterator();
            return fn.call(null, iterator.next());
          }
          function firstAddress(basket) {
            return withFirst(basket.shipments, function (shipment) { return shipment.shippingAddress; });
          }
          firstAddress(getBasket());
        `),
        kind: 'return',
        name: 'firstAddress',
        expected: 'OrderAddress',
      },
      {
        title: 'collections.map itself, across all of its callers, stays silent',
        types: COLLECTION_TYPES,
        files: helpers(`
          var collections = require('./collections');
          function addresses(basket) {
            return collections.map(basket.shipments, function (shipment) { return shipment.shippingAddress; });
          }
          addresses(getBasket());
        `),
        file: '/collections.js',
        kind: 'return',
        name: 'map',
        expected: '',
      },
    ]);
  });

  it('keeps call-specific results out of the request memo', () => {
    const languageService = createFixtureLanguageService({
      '/types.d.ts': COLLECTION_TYPES,
      ...callers(`
        function shipmentByUUID(basket) { return collections.first(basket.shipments); }
        function lineItemByUUID(basket) { return collections.first(basket.productLineItems); }
      `),
    });
    const ctx = createInferenceContext(ts, languageService);
    const returnOf = (file, name) => describeTypes(ctx, inferReturnType(ctx, findTarget(ctx, file, 'return', name)));

    assert.equal(returnOf('/helper.js', 'shipmentByUUID'), 'Shipment');
    assert.equal(returnOf('/collections.js', 'first'), '', 'the general answer is not the first call’s');
    assert.equal(returnOf('/helper.js', 'lineItemByUUID'), 'ProductLineItem');
    assert.equal(ctx.bindings.size, 0, 'bindings are released after each call');
  });

  it('prefers the call’s own answer to a union across callers that missed it', () => {
    // SFRA's arrayHelper.find. The reference budget runs out before the
    // general answer reaches the last caller, so across its callers find
    // returns `string | number`; the line item call still gets its element.
    const languageService = createFixtureLanguageService({
      '/types.d.ts': COLLECTION_TYPES,
      '/helper.js': `
        /**
         * @param {Array} array - Array of elements to find the match in.
         * @param {Array} matcher - function that returns true if match is found
         * @return {Object|undefined} element that matches provided testing function or undefined.
         */
        function find(array, matcher) {
          for (var i = 0, l = array.length; i < l; i++) {
            if (matcher(array[i], i)) {
              return array[i];
            }
          }
          return undefined;
        }
        find(['a'], function (value) { return value === 'a'; });
        find([1], function (value) { return value === 1; });
        function lineItemByUUID(uuid) {
          return find(getBasket().productLineItems.toArray(), function (item) { return item.UUID === uuid; });
        }
      `,
    });
    const ctx = createInferenceContext(ts, languageService);
    ctx.referenceBudget = 3;

    assert.equal(
      describeTypes(ctx, inferReturnType(ctx, findTarget(ctx, '/helper.js', 'return', 'find'))),
      'string | number',
    );
    assert.equal(
      describeTypes(ctx, inferReturnType(ctx, findTarget(ctx, '/helper.js', 'return', 'lineItemByUUID'))),
      'ProductLineItem',
    );
  });
});

describe('usage-inference — values handed down a chain of helpers', () => {
  // SFRA's cart helpers pass the basket's line items down four functions
  // unchanged before one iterates them with an inline callback. Neither hop
  // adds uncertainty, so neither costs inference depth.
  const CART_CHAIN = {
    '/collections.js': `
      function forEach(collection, callback) {
        var iterator = collection.iterator();
        while (iterator.hasNext()) {
          callback(iterator.next());
        }
      }
      module.exports = {forEach: forEach};
    `,
    '/cartHelpers.js': `
      var collections = require('./collections');
      function getMatchingProducts(productId, productLineItems) {
        var matchingProducts = [];
        collections.forEach(productLineItems, function (item) {
          if (item.productID === productId) matchingProducts.push(item);
        });
        return {matchingProducts: matchingProducts};
      }
      function getExistingProductLineItemsInCart(product, productId, productLineItems) {
        var matchingProducts = getMatchingProducts(productId, productLineItems).matchingProducts;
        return matchingProducts.filter(function (matchingProduct) {
          return product.bundle ? matchingProduct.bundledProductLineItems.length > 0 : true;
        });
      }
      function getExistingProductLineItemInCart(product, productId, productLineItems) {
        return getExistingProductLineItemsInCart(product, productId, productLineItems)[0];
      }
      function addProductToCart(currentBasket, productId) {
        var productLineItems = currentBasket.productLineItems;
        return getExistingProductLineItemInCart(getProduct(), productId, productLineItems);
      }
      addProductToCart(getBasket(), 'id');
    `,
  };

  runCases([
    {
      title: 'the filtered line items of a parameter forwarded three times',
      files: CART_CHAIN,
      file: '/cartHelpers.js',
      kind: 'return',
      name: 'getExistingProductLineItemsInCart',
      expected: 'ProductLineItem[]',
    },
    {
      title: 'the first of them, one more helper up',
      files: CART_CHAIN,
      file: '/cartHelpers.js',
      kind: 'return',
      name: 'getExistingProductLineItemInCart',
      expected: 'ProductLineItem',
    },
    {
      title: 'the inline callback at the far end of the chain',
      files: CART_CHAIN,
      file: '/cartHelpers.js',
      kind: 'param',
      name: 'item',
      expected: 'ProductLineItem',
    },
    {
      title: 'a forwarded parameter documented with a real type keeps that type',
      files: {
        '/helper.js': `
          function show(product) { return product.name; }
          /** @param {Product} product */
          function render(product) { return show(product); }
          render(getProduct());
        `,
      },
      kind: 'param',
      name: 'product',
      expected: 'Product',
    },
  ]);
});

describe('usage-inference — hooks', () => {
  // Hook scripts are only ever invoked through HookMgr.callHook(extensionPoint,
  // functionName, ...args), dispatched by the hooks.json registrations the
  // plugin host reads (see test/hook-registry.test.js).
  const HOOK_TYPES = realTypesPrelude(
    ['Basket', 'HookMgr'],
    `
    var HookManager: typeof HookMgr;
    function getBasket(): Basket;
  `,
  );
  const PAYMENT_HOOK = `
    function Handle(basket, paymentInformation) {
      return {error: false};
    }
    function Authorize(orderNumber, paymentInstrument) {
      return {authorized: true};
    }
    exports.Handle = Handle;
    exports.Authorize = Authorize;
  `;
  const PAYMENT_HOST = {
    hookRegistrations: () => [{extensionPoint: 'app.payment.processor.basic_credit', script: '/hooks/basic_credit.js'}],
  };

  /** The `basket` parameter of the payment hook's Handle, with `/checkout.js` calling it as `checkout`. */
  function handleBasket(checkout, host = PAYMENT_HOST) {
    return {
      types: HOOK_TYPES,
      files: {'/hooks/basic_credit.js': PAYMENT_HOOK, '/checkout.js': checkout},
      file: '/hooks/basic_credit.js',
      kind: 'param',
      name: 'basket',
      host,
    };
  }

  runCases([
    {
      title: "a hook function's parameter is what callHook passes after the extension point and function name",
      ...handleBasket(`HookManager.callHook('app.payment.processor.basic_credit', 'Handle', getBasket(), {});`),
      expected: 'Basket',
    },
    {
      title: 'an extension point built from a literal prefix reaches every registered point it starts',
      ...handleBasket(`
        function handlePayment(processorId) {
          return HookManager.callHook('app.payment.processor.' + processorId.toLowerCase(), 'Handle', getBasket());
        }
      `),
      expected: 'Basket',
    },
    {
      title: 'a template literal extension point reaches the points its head starts',
      ...handleBasket(
        'function pay(id) { HookManager.callHook(`app.payment.processor.${id}`, "Handle", getBasket()); }',
      ),
      expected: 'Basket',
    },
    {
      title: 'an extension point held in a local variable is read through it',
      ...handleBasket(`
        function handlePayment(processorId) {
          var hookName = 'app.payment.processor.' + processorId.toLowerCase();
          return HookManager.callHook(hookName, 'Handle', getBasket());
        }
      `),
      expected: 'Basket',
    },
    {
      title: 'a variable assigned again may hold any extension point, so it reaches none',
      ...handleBasket(`
        function handlePayment(processorId, fallback) {
          var hookName = 'app.payment.processor.' + processorId;
          if (fallback) hookName = fallback;
          return HookManager.callHook(hookName, 'Handle', getBasket());
        }
      `),
      expected: '',
    },
    {
      title: 'a call naming another function of the same hook passes this one nothing',
      ...handleBasket(`HookManager.callHook('app.payment.processor.basic_credit', 'Authorize', getBasket());`),
      expected: '',
    },
    {
      title: 'a call to an extension point the script is not registered for passes it nothing',
      ...handleBasket(`HookManager.callHook('app.payment.processor.paypal', 'Handle', getBasket());`),
      expected: '',
    },
    {
      title: 'a prefix no registered point starts with reaches nothing',
      ...handleBasket(`function pay(id) { HookManager.callHook('app.order.' + id, 'Handle', getBasket()); }`),
      expected: '',
    },
    {
      title: 'without registrations from the host, callHook reaches nothing',
      ...handleBasket(`HookManager.callHook('app.payment.processor.basic_credit', 'Handle', getBasket());`, {}),
      expected: '',
    },
    {
      title: 'a hook function exported under another name is reached by its export name',
      types: HOOK_TYPES,
      files: {
        '/hooks/default.js': 'function handle(basket) { return {}; } module.exports = {Handle: handle};',
        '/checkout.js': `HookManager.callHook('app.payment.processor.default', 'Handle', getBasket());`,
      },
      file: '/hooks/default.js',
      kind: 'param',
      name: 'basket',
      host: {hookRegistrations: () => [{extensionPoint: 'app.payment.processor.default', script: '/hooks/default.js'}]},
      expected: 'Basket',
    },
    {
      title: 'a callHook call returns what the hook functions it dispatches to return',
      types: HOOK_TYPES,
      files: {
        '/hooks/calculate.js': 'exports.calculate = function (basket) { return basket.getTotalGrossPrice(); };',
        '/cart.js': `function recalculate() { return HookManager.callHook('dw.order.calculate', 'calculate', getBasket()); }`,
      },
      file: '/cart.js',
      kind: 'return',
      name: 'recalculate',
      host: {hookRegistrations: () => [{extensionPoint: 'dw.order.calculate', script: '/hooks/calculate.js'}]},
      expected: 'Money',
    },
  ]);
});
