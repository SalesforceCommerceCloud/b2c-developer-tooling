/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');

const ts = require('typescript');

const {readHookRegistrations} = require('../src/resolver/hook-registry');
const {createPathContainment} = require('../src/resolver/module-resolution');

const {isWithinRoot} = createPathContainment(ts, true);

const CARTRIDGE = {name: 'app_custom', root: '/ws/app_custom/', rawRoot: '/ws/app_custom/'};

/** The registrations `CARTRIDGE` declares when the workspace holds `files` (path -> text). */
function registrationsOf(files, cartridges = [CARTRIDGE]) {
  return readHookRegistrations(cartridges, {
    readFile: (fileName) => files[fileName],
    fileExists: (fileName) => fileName in files,
    isWithinRoot,
  });
}

const json = (value) => JSON.stringify(value);

describe('readHookRegistrations', () => {
  it('reads the hooks.json a cartridge package.json names, resolving scripts like a require()', () => {
    const files = {
      '/ws/app_custom/package.json': json({hooks: './hooks.json'}),
      '/ws/app_custom/hooks.json': json({
        hooks: [
          {name: 'dw.order.calculate', script: './cartridge/scripts/hooks/cart/calculate.js'},
          {name: 'app.payment.processor.basic_credit', script: './cartridge/scripts/hooks/payment/basic_credit'},
          {name: 'app.legacy', script: './cartridge/scripts/hooks/legacy'},
        ],
      }),
      '/ws/app_custom/cartridge/scripts/hooks/cart/calculate.js': '',
      '/ws/app_custom/cartridge/scripts/hooks/payment/basic_credit.js': '',
      '/ws/app_custom/cartridge/scripts/hooks/legacy.ds': '',
    };
    assert.deepEqual(registrationsOf(files), [
      {extensionPoint: 'dw.order.calculate', script: '/ws/app_custom/cartridge/scripts/hooks/cart/calculate.js'},
      {
        extensionPoint: 'app.payment.processor.basic_credit',
        script: '/ws/app_custom/cartridge/scripts/hooks/payment/basic_credit.js',
      },
      {extensionPoint: 'app.legacy', script: '/ws/app_custom/cartridge/scripts/hooks/legacy.ds'},
    ]);
  });

  it('resolves scripts relative to a hooks.json kept inside the cartridge folder', () => {
    const files = {
      '/ws/app_custom/package.json': json({hooks: './cartridge/scripts/hooks.json'}),
      '/ws/app_custom/cartridge/scripts/hooks.json': json({
        hooks: [{name: 'dw.order.calculate', script: './cart/calculate'}],
      }),
      '/ws/app_custom/cartridge/scripts/cart/calculate.js': '',
    };
    assert.deepEqual(registrationsOf(files), [
      {extensionPoint: 'dw.order.calculate', script: '/ws/app_custom/cartridge/scripts/cart/calculate.js'},
    ]);
  });

  it('declares nothing without a package.json hooks entry, or when either file is missing, unreadable or malformed', () => {
    const hooksJson = json({hooks: [{name: 'dw.order.calculate', script: './calculate.js'}]});
    const cases = [
      {'/ws/app_custom/hooks.json': hooksJson, '/ws/app_custom/calculate.js': ''},
      {'/ws/app_custom/package.json': json({name: 'app_custom'}), '/ws/app_custom/hooks.json': hooksJson},
      {'/ws/app_custom/package.json': json({hooks: './hooks.json'})},
      {'/ws/app_custom/package.json': '{"hooks": ', '/ws/app_custom/hooks.json': hooksJson},
      {'/ws/app_custom/package.json': json({hooks: './hooks.json'}), '/ws/app_custom/hooks.json': 'not json'},
      {'/ws/app_custom/package.json': json({hooks: './hooks.json'}), '/ws/app_custom/hooks.json': json({hooks: {}})},
      {'/ws/app_custom/package.json': json({hooks: 42}), '/ws/app_custom/hooks.json': hooksJson},
    ];
    for (const files of cases) assert.deepEqual(registrationsOf(files), [], json(files));
    const unreadable = readHookRegistrations([CARTRIDGE], {
      readFile: () => {
        throw new Error('EACCES');
      },
      fileExists: () => true,
      isWithinRoot,
    });
    assert.deepEqual(unreadable, []);
  });

  it('skips entries without a name, a script, or a script file that exists', () => {
    const files = {
      '/ws/app_custom/package.json': json({hooks: './hooks.json'}),
      '/ws/app_custom/hooks.json': json({
        hooks: [
          null,
          'dw.order.calculate',
          {name: 'dw.order.calculate'},
          {script: './calculate.js'},
          {name: 7, script: './calculate.js'},
          {name: 'dw.order.missing', script: './missing.js'},
          {name: 'dw.order.calculate', script: './calculate.js'},
        ],
      }),
      '/ws/app_custom/calculate.js': '',
    };
    assert.deepEqual(registrationsOf(files), [
      {extensionPoint: 'dw.order.calculate', script: '/ws/app_custom/calculate.js'},
    ]);
  });

  it('never reads or registers a path outside the cartridge that declares it', () => {
    const outside = {
      '/ws/other/hooks.json': json({hooks: [{name: 'dw.order.calculate', script: './calculate.js'}]}),
      '/ws/other/calculate.js': '',
    };
    const readOutside = [];
    const files = {...outside, '/ws/app_custom/package.json': json({hooks: '../other/hooks.json'})};
    readHookRegistrations([CARTRIDGE], {
      readFile: (fileName) => {
        if (fileName.startsWith('/ws/other/')) readOutside.push(fileName);
        return files[fileName];
      },
      fileExists: (fileName) => fileName in files,
      isWithinRoot,
    });
    assert.deepEqual(readOutside, []);

    const escapingScript = {
      ...outside,
      '/ws/app_custom/package.json': json({hooks: './hooks.json'}),
      '/ws/app_custom/hooks.json': json({hooks: [{name: 'dw.order.calculate', script: '../other/calculate.js'}]}),
    };
    assert.deepEqual(registrationsOf(escapingScript), []);
  });

  it('reads every configured cartridge, in cartridge path order', () => {
    const base = {name: 'app_base', root: '/ws/app_base/', rawRoot: '/ws/app_base/'};
    const declare = (root, script) => ({
      [`${root}package.json`]: json({hooks: './hooks.json'}),
      [`${root}hooks.json`]: json({hooks: [{name: 'dw.order.calculate', script}]}),
      [`${root}${script.slice(2)}`]: '',
    });
    const files = {...declare('/ws/app_custom/', './custom.js'), ...declare('/ws/app_base/', './base.js')};
    assert.deepEqual(
      registrationsOf(files, [CARTRIDGE, base]).map((registration) => registration.script),
      ['/ws/app_custom/custom.js', '/ws/app_base/base.js'],
    );
  });
});
