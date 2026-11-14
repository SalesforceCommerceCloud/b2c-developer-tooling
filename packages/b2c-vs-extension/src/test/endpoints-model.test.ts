/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import type {IndexedEndpoint, ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
import {
  absolutePath,
  chainRows,
  controllerFiles,
  controllerGroups,
  customApiEndpointRow,
  customApiGroups,
  endpointRow,
  endpointWarnings,
  historyRows,
  hookGroups,
  hookRegistrationRow,
} from '../endpoints/model.js';

const mw = (id: string, cartridge: string, line: number, extra: Record<string, unknown> = {}) => ({
  id,
  cartridge,
  relPath: 'cartridge/controllers/Account.js',
  line,
  ...extra,
});

const saveProfile: IndexedEndpoint = {
  id: 'Account-SaveProfile',
  controller: 'Account',
  action: 'SaveProfile',
  kind: 'sfra',
  cartridge: 'app_custom',
  relPath: 'cartridge/controllers/Account.js',
  line: 9,
  methods: ['ANY'],
  https: false,
  loginRequired: false,
  csrf: 'none',
  chain: [mw('function', 'app_custom', 9, {readsForm: true})],
  steps: [
    {method: 'post', cartridge: 'app_storefront_base', relPath: 'cartridge/controllers/Account.js', line: 42},
    {
      method: 'replace',
      cartridge: 'app_custom',
      relPath: 'cartridge/controllers/Account.js',
      line: 9,
      dropped: ['server.middleware.post', 'csrf.validateAjaxRequest'],
    },
  ],
};

const addProduct: IndexedEndpoint = {
  id: 'Cart-AddProduct',
  controller: 'Cart',
  action: 'AddProduct',
  kind: 'sfra',
  cartridge: 'app_storefront_base',
  relPath: 'cartridge/controllers/Cart.js',
  line: 60,
  methods: ['POST'],
  https: false,
  loginRequired: false,
  csrf: 'middleware',
  chain: [
    {
      ...mw('csrf.validateAjaxRequest', 'plugin_csrf', 5),
      relPath: 'cartridge/controllers/Cart.js',
      via: 'prepend',
      source: {cartridge: 'app_storefront_base', relPath: 'cartridge/scripts/middleware/csrf.js'},
    },
    {...mw('server.middleware.post', 'app_storefront_base', 60), relPath: 'cartridge/controllers/Cart.js'},
    {...mw('function', 'app_storefront_base', 60), relPath: 'cartridge/controllers/Cart.js'},
  ],
  steps: [
    {method: 'post', cartridge: 'app_storefront_base', relPath: 'cartridge/controllers/Cart.js', line: 60},
    {method: 'prepend', cartridge: 'plugin_csrf', relPath: 'cartridge/controllers/Cart.js', line: 5},
  ],
};

const index: ProjectIndex = {
  version: 1,
  cartridges: [
    {name: 'app_custom', src: '/p/app_custom'},
    {name: 'plugin_csrf', src: '/p/plugin_csrf'},
    {name: 'app_storefront_base', src: '/p/app_storefront_base'},
  ],
  endpoints: [
    addProduct,
    saveProfile,
    {
      ...addProduct,
      id: 'Wishlist-Show',
      controller: 'Wishlist',
      action: 'Show',
      kind: 'pipeline',
      chain: undefined,
      steps: undefined,
    },
  ],
  hooks: [
    {
      name: 'dw.ocapi.shop.basket.afterPOST',
      kind: 'system',
      function: 'afterPOST',
      cartridge: 'app_storefront_base',
      script: './b',
      relPath: 'cartridge/scripts/b.js',
      line: 1,
      returnsValue: 'no',
    },
    {
      name: 'dw.ocapi.shop.basket.afterPOST',
      kind: 'system',
      function: 'afterPOST',
      cartridge: 'app_custom',
      script: './a',
      relPath: 'cartridge/scripts/a.js',
      line: 3,
      returnsValue: 'yes',
    },
    {
      name: 'app.custom.notify',
      kind: 'custom',
      exports: ['notify', 'handle'],
      cartridge: 'app_custom',
      script: './n',
      relPath: 'cartridge/scripts/n.js',
      line: 1,
      returnsValue: 'unknown',
    },
    {
      name: 'dw.order.calculate',
      kind: 'system',
      function: 'calculate',
      cartridge: 'app_custom',
      script: './missing',
      returnsValue: 'unknown',
    },
  ],
  customApis: [
    {
      api: 'loyalty',
      endpoint: 'getPoints',
      cartridge: 'app_custom',
      method: 'GET',
      path: '/points',
      security: ['ShopperToken'],
      scopes: ['c_loyalty'],
      apiType: 'shopper',
      implementationFile: {relPath: 'cartridge/rest-apis/loyalty/script.js', line: 1},
      public: true,
      problems: [],
    },
    {
      api: 'loyalty',
      endpoint: 'setPoints',
      cartridge: 'plugin_csrf',
      apiType: 'unknown',
      problems: ['No operation with operationId "setPoints" in schema.yaml.'],
    },
  ],
  jobSteps: [],
  errors: [],
};

suite('endpoints view model', () => {
  test('controller groups leave out pipelines and sort endpoints', () => {
    const groups = controllerGroups(index);
    assert.deepStrictEqual(
      groups.map((g) => g.controller),
      ['Account', 'Cart'],
    );
    assert.deepStrictEqual(groups[1].cartridges, ['app_storefront_base', 'plugin_csrf']);
  });

  test('endpoint rows summarize methods and protections, and warn about missing CSRF and dropped middleware', () => {
    assert.deepStrictEqual(
      {
        label: endpointRow(addProduct).label,
        description: endpointRow(addProduct).description,
        warning: endpointRow(addProduct).warning,
      },
      {label: 'Cart-AddProduct', description: 'POST · CSRF', warning: undefined},
    );
    const row = endpointRow(saveProfile);
    assert.strictEqual(row.description, 'any method');
    assert.deepStrictEqual(endpointWarnings(saveProfile), [
      'Accepts POST without a CSRF token check.',
      'server.replace() in app_custom dropped the POST-only restriction, CSRF check.',
    ]);
    assert.deepStrictEqual(row.location, {
      cartridge: 'app_custom',
      relPath: 'cartridge/controllers/Account.js',
      line: 9,
    });
  });

  test('chain rows use readable names, show where each step came from, and link implementations', () => {
    const rows = chainRows(addProduct);
    assert.deepStrictEqual(
      rows.map((r) => [r.label, r.description]),
      [
        ['CSRF check (AJAX)', 'prepend · plugin_csrf'],
        ['POST only', 'app_storefront_base'],
        ['Handler (Cart.js:60)', 'app_storefront_base'],
      ],
    );
    assert.deepStrictEqual(rows[0].implementation, {
      cartridge: 'app_storefront_base',
      relPath: 'cartridge/scripts/middleware/csrf.js',
    });
  });

  test('history rows flag what a replace dropped', () => {
    const rows = historyRows(saveProfile);
    assert.deepStrictEqual(
      rows.map((r) => r.label),
      ['server.post', 'server.replace'],
    );
    assert.strictEqual(rows[1].warning, 'Dropped the POST-only restriction, CSRF check that the replaced route had.');
  });

  test('hook groups order registrations by cartridge path and explain system hook short-circuiting', () => {
    const groups = hookGroups(index);
    const afterPost = groups.find((g) => g.name === 'dw.ocapi.shop.basket.afterPOST')!;
    assert.deepStrictEqual(
      afterPost.registrations.map((r) => r.cartridge),
      ['app_custom', 'app_storefront_base'],
    );
    assert.strictEqual(afterPost.row.description, 'system · 2 registrations');
    assert.strictEqual(
      afterPost.row.warning,
      'app_custom can return a value, which skips 1 later registration and the system implementation.',
    );
    assert.match(afterPost.row.tooltip!, /first one that returns a value/);

    const first = hookRegistrationRow(afterPost, afterPost.registrations[0], 0);
    assert.strictEqual(first.label, '1. app_custom');
    assert.strictEqual(first.description, 'a.js:3 · returns a value');
    assert.ok(first.warning);
    assert.strictEqual(hookRegistrationRow(afterPost, afterPost.registrations[1], 1).warning, undefined);

    const custom = groups.find((g) => g.name === 'app.custom.notify')!;
    assert.strictEqual(custom.row.warning, undefined, 'custom hooks always run every registration');
    const customRow = hookRegistrationRow(custom, custom.registrations[0], 0);
    assert.strictEqual(customRow.warning, undefined);
    assert.strictEqual(customRow.description, 'n.js:1 · exports notify, handle');

    const calculate = groups.find((g) => g.name === 'dw.order.calculate')!;
    assert.strictEqual(
      hookRegistrationRow(calculate, calculate.registrations[0], 0).warning,
      'Script ./missing not found.',
    );
  });

  test('custom API groups flag APIs defined in several cartridges and endpoint problems', () => {
    const [loyalty] = customApiGroups(index);
    assert.strictEqual(loyalty.row.description, 'shopper · app_custom, plugin_csrf');
    assert.match(loyalty.row.warning!, /more than one cartridge/);
    const ok = customApiEndpointRow(loyalty.endpoints[0]);
    assert.strictEqual(ok.description, 'GET /points · ShopperToken c_loyalty');
    assert.strictEqual(ok.warning, undefined);
    assert.match(customApiEndpointRow(loyalty.endpoints[1]).warning!, /No operation/);
  });

  test('controller files per cartridge list statements with notes from other cartridges', () => {
    const base = controllerFiles(index, 'app_storefront_base');
    assert.deepStrictEqual(
      base.map((f) => f.relPath),
      ['cartridge/controllers/Account.js', 'cartridge/controllers/Cart.js'],
    );
    const account = base[0].rows[0];
    assert.strictEqual(account.label, 'post SaveProfile');
    assert.strictEqual(account.description, 'replaced by app_custom');
    assert.strictEqual(account.warning, undefined, 'the base definition is no longer served, so it is not flagged');
    assert.strictEqual(base[1].rows[0].description, 'prepended by plugin_csrf');

    const custom = controllerFiles(index, 'app_custom');
    assert.strictEqual(custom[0].extends, 'app_storefront_base');
    assert.strictEqual(custom[0].rows[0].label, 'replace SaveProfile');
    assert.match(custom[0].rows[0].warning!, /Dropped the POST-only restriction/);
  });

  test('absolute paths come from the index cartridge list', () => {
    assert.strictEqual(
      absolutePath(index, {cartridge: 'app_custom', relPath: 'cartridge/x.js'}),
      '/p/app_custom/cartridge/x.js',
    );
    assert.strictEqual(absolutePath(index, {cartridge: 'nope', relPath: 'x'}), undefined);
  });
});
