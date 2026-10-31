/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');

const {orderCartridges} = require('../src/resolver/cartridge-discovery');

const cartridge = (name) => ({name, src: `/ws/${name}`});
const names = (list) => list.map((c) => c.name);

describe('orderCartridges', () => {
  const discovered = ['modules', 'app_storefront_base', 'plugin_a', 'app_custom'].map(cartridge);

  it('follows the configured cartridge path, then appends unnamed discovered cartridges', () => {
    const ordered = orderCartridges(discovered, ['app_custom', 'missing', 'app_storefront_base', 'app_custom']);
    assert.deepEqual(names(ordered), ['app_custom', 'app_storefront_base', 'modules', 'plugin_a']);
  });

  it('keeps discovery order without a configured path, with SFRA base cartridges last', () => {
    assert.deepEqual(names(orderCartridges(discovered, undefined)), [
      'plugin_a',
      'app_custom',
      'app_storefront_base',
      'modules',
    ]);
    assert.deepEqual(names(orderCartridges(discovered, [])), names(orderCartridges(discovered, undefined)));
  });

  it('ranks cartridges named like Object.prototype members as ordinary cartridges', () => {
    const tricky = ['__proto__', 'modules', 'constructor', 'toString'].map(cartridge);
    assert.deepEqual(names(orderCartridges(tricky, undefined)), ['__proto__', 'constructor', 'toString', 'modules']);
  });
});
