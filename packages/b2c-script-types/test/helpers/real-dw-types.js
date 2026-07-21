/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const path = require('node:path');

// Absolute paths to the real, bundled dw.* type declarations (not stand-in
// ambient shapes), so tests exercise the actual Product/Order API surface a
// cartridge author sees, including its real generics, overloads, and
// nullability. `createFixtureHost`'s ts.sys fallback resolves these directly
// by absolute path — no dw/* module-resolution wiring needed for these tests.
const TYPES_DIR = path.resolve(__dirname, '../../types').replace(/\\/g, '/');

const dtsPath = (...segments) => path.join(TYPES_DIR, ...segments).replace(/\\/g, '/');

const REAL_DW_TYPES = {
  Product: dtsPath('dw', 'catalog', 'Product'),
  ProductMgr: dtsPath('dw', 'catalog', 'ProductMgr'),
  ProductPriceModel: dtsPath('dw', 'catalog', 'ProductPriceModel'),
  Category: dtsPath('dw', 'catalog', 'Category'),
  Collection: dtsPath('dw', 'util', 'Collection'),
  Variant: dtsPath('dw', 'catalog', 'Variant'),
  Money: dtsPath('dw', 'value', 'Money'),
  Order: dtsPath('dw', 'order', 'Order'),
  OrderMgr: dtsPath('dw', 'order', 'OrderMgr'),
  Customer: dtsPath('dw', 'customer', 'Customer'),
  Profile: dtsPath('dw', 'customer', 'Profile'),
  Shipment: dtsPath('dw', 'order', 'Shipment'),
  ProductLineItem: dtsPath('dw', 'order', 'ProductLineItem'),
};

/**
 * Builds a `/types.d.ts` fixture file that imports the requested real dw.*
 * classes and re-declares the given globals inside `declare global {}`.
 *
 * A `.d.ts` file with top-level `import ... = require(...)` statements
 * becomes a *module*, which would otherwise scope plain `declare function`
 * statements to that module instead of making them true ambient globals
 * visible from the consuming `.js` fixture — `declare global` is what keeps
 * them globally visible despite the imports.
 *
 * @param {string[]} imports - dw.* class names to import, e.g. `['Product', 'ProductMgr']`.
 * @param {string} globals - body of the `declare global { ... }` block (function/var declarations).
 * @returns {string} the `/types.d.ts` file content.
 */
function realTypesPrelude(imports, globals) {
  const importLines = imports.map((name) => `import ${name} = require('${REAL_DW_TYPES[name]}');`).join('\n');
  return `${importLines}\ndeclare global {\n${globals}\n}\n`;
}

module.exports = {REAL_DW_TYPES, realTypesPrelude};
