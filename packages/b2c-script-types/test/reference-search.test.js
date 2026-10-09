/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');

const ts = require('typescript');

const {createInferenceContext} = require('../src/usage-inference');
const {getNodeAtPosition} = require('../src/inference/ast-helpers');
const {searchReferences} = require('../src/inference/reference-search');
const {createFixtureHost, createFixtureLanguageService} = require('./helpers/fixture-language-service');
const {countReferenceSearches} = require('./helpers/reference-searches');

/** The identifier `text` starts with, in `fileName` (`'helper(p)'` names the `helper` before `(p)`). */
function nameAt(ctx, fileName, text) {
  const file = ctx.program.getSourceFile(fileName);
  const position = file.text.indexOf(text);
  assert.ok(position >= 0, `${text} not found in ${fileName}`);
  const node = getNodeAtPosition(file, ts, position);
  assert.ok(ts.isIdentifier(node), `${text} does not start with an identifier`);
  return node;
}

/** Each reference as `<file> <the expression it sits in>`, so a failure shows where it was found. */
function describeReferences(references) {
  return references
    .map((node) => {
      const context = ts.isShorthandPropertyAssignment(node.parent) ? node.parent.parent : node.parent;
      return `${node.getSourceFile().fileName} ${context.getText()}`;
    })
    .sort();
}

/** Runs one search on a fresh Program, counting the searches it runs. */
function search(files, fileName, text, languageService = createFixtureLanguageService(files)) {
  const searches = countReferenceSearches();
  try {
    const ctx = createInferenceContext(ts, languageService);
    const references = searchReferences(ctx, nameAt(ctx, fileName, text));
    return {references: describeReferences(references), projectWide: searches.projectWide(), runs: searches.total()};
  } finally {
    searches.stop();
  }
}

describe('reference search', () => {
  it("reads only a CommonJS module's own file for its top-level function, and keeps a same-named one elsewhere out", () => {
    const result = search(
      {
        '/helpers.js': 'function helper(p) { return p; }\nhelper(1);\nmodule.exports = {helper: helper};',
        '/other.js': 'function helper(x) { return x; }\nhelper(2);\nmodule.exports = helper;',
      },
      '/helpers.js',
      'helper(p)',
    );

    assert.deepEqual(result.references, [
      '/helpers.js function helper(p) { return p; }',
      '/helpers.js helper(1)',
      '/helpers.js helper: helper',
    ]);
    assert.equal(result.projectWide, 0, 'nothing outside a CommonJS module names its own function');
  });

  it('reads the whole project for a global of a plain script', () => {
    const result = search(
      {
        '/globals.js': 'function formatMoney(value) { return value; }',
        '/page.js': "var util = require('./util');\nformatMoney(util.price);",
        '/util.js': 'module.exports = {price: 1};',
      },
      '/globals.js',
      'formatMoney(value)',
    );

    assert.deepEqual(result.references, [
      '/globals.js function formatMoney(value) { return value; }',
      '/page.js formatMoney(util.price)',
    ]);
    assert.equal(result.projectWide, 1);
  });

  it("finds the require() calls that load a module through its `module.exports`, an index.js through its folder's name", () => {
    const files = {
      '/models/product.js': 'function Product() {}\nmodule.exports = Product;',
      '/models/index.js': "module.exports = {product: require('./product')};",
      '/productUtils.js': 'module.exports = {};',
      '/a.js': "var Product = require('./models/product');\nnew Product();",
      '/b.js':
        "var P = require('./models/product');\nvar models = require('./models');\nvar utils = require('./productUtils');",
    };

    assert.deepEqual(search(files, '/models/product.js', 'exports = Product').references, [
      "/a.js require('./models/product')",
      "/b.js require('./models/product')",
      "/models/index.js require('./product')",
      '/models/product.js module.exports',
    ]);
    assert.deepEqual(search(files, '/models/index.js', 'exports = {').references, [
      "/b.js require('./models')",
      '/models/index.js module.exports',
    ]);
  });

  it('reaches an export through the aliases that read it: a destructured require, a property access, a local call', () => {
    const result = search(
      {
        '/helpers.js': 'function helper(p) { return p; }\nexports.helper = helper;',
        '/c.js': "var {helper} = require('./helpers');\nvar h = require('./helpers');\nh.helper(1);\nhelper(2);",
      },
      '/helpers.js',
      'helper = helper',
    );

    assert.deepEqual(result.references, [
      '/c.js h.helper',
      '/c.js helper',
      '/c.js helper(2)',
      '/helpers.js exports.helper',
    ]);
  });

  it('searches a shorthand export as both the property and the value it copies', () => {
    const result = search(
      {
        '/helpers.js': 'function helper(p) { return p; }\nmodule.exports = {helper};',
        '/c.js': "var h = require('./helpers');\nh.helper(1);",
      },
      '/helpers.js',
      'helper}',
    );

    assert.deepEqual(result.references, [
      '/c.js h.helper',
      '/helpers.js function helper(p) { return p; }',
      '/helpers.js {helper}',
    ]);
  });

  it('reports no uses in declaration files', () => {
    const result = search(
      {
        '/types.d.ts': 'declare function getProduct(): {ID: string};',
        '/a.js': 'getProduct();\nmodule.exports = {};',
      },
      '/a.js',
      'getProduct()',
    );

    assert.deepEqual(result.references, ['/a.js getProduct()']);
  });

  it('runs each search once per Program, whichever request asks', () => {
    const languageService = createFixtureLanguageService({
      '/helpers.js': 'function helper(p) { return p; }\nhelper(1);\nmodule.exports = {helper: helper};',
    });
    const searches = countReferenceSearches();
    try {
      const first = createInferenceContext(ts, languageService);
      const second = createInferenceContext(ts, languageService);
      const references = searchReferences(first, nameAt(first, '/helpers.js', 'helper(p)'));

      assert.equal(searchReferences(second, nameAt(second, '/helpers.js', 'helper(p)')), references);
      assert.equal(searches.total(), 1);
    } finally {
      searches.stop();
    }
  });

  it("finds the same references when a SourceFile lacks the parser's name table", () => {
    const files = {
      '/helpers.js': 'function helper(p) { return p; }\nmodule.exports = {helper};',
      '/c.js': "var h = require('./helpers');\nh.helper(1);",
    };
    // A private registry: the SourceFiles altered here are shared with no other test.
    const languageService = ts.createLanguageService(createFixtureHost(files));
    for (const file of languageService.getProgram().getSourceFiles()) delete file.identifiers;

    assert.deepEqual(search(files, '/helpers.js', 'helper}', languageService).references, [
      '/c.js h.helper',
      '/helpers.js function helper(p) { return p; }',
      '/helpers.js {helper}',
    ]);
  });
});
