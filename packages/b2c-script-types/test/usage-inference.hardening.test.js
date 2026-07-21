/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');
const {describe, it} = require('node:test');

const ts = require('typescript');

const init = require('../plugin/index');
const {createInferenceContext, inferParameterType, matchAmbientTypesByUsage} = require('../plugin/usage-inference');
const {assertInferredHover, assertNoInferredHover, positionOf} = require('./helpers/assert-inference');
const {absoluteCartridgePath, createCartridgeFixture} = require('./helpers/cartridge-fixture');
const {
  createFixtureHost,
  createFixtureLanguageService,
  findFunctionDeclaration,
  sharedDocumentRegistry,
} = require('./helpers/fixture-language-service');
const {realTypesPrelude} = require('./helpers/real-dw-types');

describe('usage-inference hardening', () => {
  describe('mid-inference cancellation', () => {
    it('rethrows OperationCanceledException raised inside getReferencesAtPosition', () => {
      const files = {
        '/types.d.ts': 'declare function getProduct(): {ID: string};',
        '/helper.js': `
          function helper(product) { return product.ID; }
          helper(getProduct());
          helper(getProduct());
          module.exports = {helper: helper};
        `,
      };
      const base = createFixtureLanguageService(files);
      let searches = 0;
      const languageService = new Proxy(base, {
        get(target, prop, receiver) {
          if (prop === 'getReferencesAtPosition') {
            return (fileName, position) => {
              searches++;
              if (searches >= 1) throw new ts.OperationCanceledException();
              return target.getReferencesAtPosition(fileName, position);
            };
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
      const ctx = createInferenceContext(ts, languageService);
      const fn = findFunctionDeclaration(ctx.program.getSourceFile('/helper.js'), 'helper');

      assert.throws(() => inferParameterType(ctx, fn.parameters[0]), ts.OperationCanceledException);
    });

    it('plugin guarded() rethrows cancellation from inference (does not degrade to empty hover)', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Product', 'ProductMgr'], ''),
        '/helper.js': `
          function helper(product) { return product.getID(); }
          helper(ProductMgr.getProduct('x'));
          module.exports = {helper: helper};
        `,
      };
      const {create} = init({typescript: ts});
      const host = createFixtureHost(files);
      const base = ts.createLanguageService(host, sharedDocumentRegistry);
      let searches = 0;
      const languageService = new Proxy(base, {
        get(target, prop, receiver) {
          if (prop === 'getReferencesAtPosition') {
            return (fileName, position) => {
              searches++;
              if (searches >= 1) throw new ts.OperationCanceledException();
              return target.getReferencesAtPosition(fileName, position);
            };
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
      const proxy = create({
        languageService,
        languageServiceHost: host,
        project: {
          projectService: {logger: {info: () => {}}},
          getCurrentDirectory: () => '/',
          getProjectVersion: () => '1',
        },
        config: {
          enabled: true,
          inferUsage: true,
          cartridges: [{name: 'test_cartridge', src: '/'}],
        },
      });
      const source = files['/helper.js'];
      const paramPos = positionOf(source, 'product)');

      assert.throws(() => proxy.getQuickInfoAtPosition('/helper.js', paramPos), ts.OperationCanceledException);
    });
  });

  describe('negative / silence cases', () => {
    it('matchAmbientTypesByUsage stays silent for a weak-only custom+UUID signature', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Shipment', 'ProductLineItem', 'Profile', 'Customer'], ''),
        '/helpers.js': `
          function touch(obj) {
            return obj.custom || obj.UUID;
          }
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const types = matchAmbientTypesByUsage(ctx, new Set(['custom', 'UUID']));
      assert.deepEqual(types, []);
    });

    it('does not let an identifier-name match rescue a signature that matches zero classes', () => {
      const languageService = createFixtureLanguageService({
        '/types.d.ts': realTypesPrelude(['Profile'], ''),
        '/helpers.js': 'function f(profile) { return profile.notARealMember; }\n',
      });
      const ctx = createInferenceContext(ts, languageService);
      const types = matchAmbientTypesByUsage(ctx, new Set(['notARealMember']), 'profile');
      assert.deepEqual(types, []);
    });

    it('stays silent when a duck-typed Store model call site resolves but the body also uses address-only fields (mul-core copyCustomerAddressToShipment)', () => {
      // Controllers pass both an untyped preferredAddress (req is any) and a
      // Store *model* from getDeliveryStore(). Only the model resolves to a
      // concrete type named Store — without a body-usage consistency check
      // the hover wrongly claims the address parameter is Store.
      const files = {
        '/types.d.ts': realTypesPrelude(
          ['CustomerAddress', 'Store'],
          `
          declare function getApiStore(): Store;
          declare const req: any;
        `,
        ),
        '/models/store.js': `
          function Store(storeObject) {
            this.ID = storeObject.ID;
            this.name = storeObject.name;
            this.firstName = 'Shop';
            this.lastName = this.name;
            this.address1 = storeObject.address1;
            this.address2 = storeObject.address2;
            this.city = storeObject.city;
            this.postalCode = storeObject.postalCode;
            this.stateCode = storeObject.stateCode;
            this.countryCode = storeObject.countryCode;
          }
          module.exports = Store;
        `,
        '/helpers/reserveAndGoHelpers.js': `
          var StoreModel = require('../models/store');
          function getDeliveryStore() {
            return new StoreModel(getApiStore());
          }
          module.exports = { getDeliveryStore: getDeliveryStore };
        `,
        '/checkout/checkoutHelpers.js': `
          function copyCustomerAddressToShipment(address) {
            use(address.countryCode);
            use(address.firstName || 'X');
            use(address.lastName || address.name);
            use(address.companyName ? address.companyName : '');
            use(address.address1);
            use(address.address2);
            use(address.postBox ? address.postBox : '');
            use(address.city);
            use(address.postalCode);
            use(address.stateCode ? address.stateCode : '');
            use(address.ID ? address.ID : '');
          }
          module.exports = { copyCustomerAddressToShipment: copyCustomerAddressToShipment };
        `,
        '/controllers/Checkout.js': `
          var COHelpers = require('../checkout/checkoutHelpers');
          var reserveAndGoHelpers = require('../helpers/reserveAndGoHelpers');
          var preferredAddress;
          if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            preferredAddress = req.currentCustomer.addressBook.preferredAddress;
            COHelpers.copyCustomerAddressToShipment(preferredAddress);
          }
          var storeModel = reserveAndGoHelpers.getDeliveryStore();
          COHelpers.copyCustomerAddressToShipment(storeModel);
        `,
      };
      const languageService = createFixtureLanguageService(files);
      const ctx = createInferenceContext(ts, languageService);
      const fn = findFunctionDeclaration(
        ctx.program.getSourceFile('/checkout/checkoutHelpers.js'),
        'copyCustomerAddressToShipment',
      );

      assert.deepEqual(inferParameterType(ctx, fn.parameters[0]), []);
    });
  });

  describe('multi-cartridge require call sites (cartridge-fixture factory)', () => {
    it('infers a helper parameter from a call site reached through require("~/...")', () => {
      // Mirrors mul-core/neuhaus-core: helpers consumed via cartridge-relative
      // require from another file in the same cartridge. Uses the shared
      // createCartridgeFixture factory so path layout stays consistent with
      // the VS Code E2E workspace.
      const fixture = createCartridgeFixture({
        dwTypes: ['Product'],
        globals: '  function getSomeProduct(): Product<any>;',
        cartridges: [
          {
            name: 'test_cartridge',
            files: {
              'cartridge/scripts/helpers/productHelpers.js': `
                function getDisplayName(product) {
                  return product.getID();
                }
                module.exports = { getDisplayName: getDisplayName };
              `,
              'cartridge/scripts/cartService.js': `
                var productHelpers = require('~/cartridge/scripts/helpers/productHelpers');
                productHelpers.getDisplayName(getSomeProduct());
                module.exports = {};
              `,
            },
          },
        ],
      });

      const {create} = init({typescript: ts});
      const host = createFixtureHost(fixture.files);
      // Real tsserver installs the plugin before the first program build. Our
      // test creates the LanguageService first, then create() wraps the host's
      // resolvers — bump script + project versions so the next getProgram()
      // re-resolves `~/` requires through the wrapped hooks.
      const versions = Object.fromEntries(Object.keys(fixture.files).map((f) => [f, 0]));
      let projectVersion = 1;
      const origGetScriptVersion = host.getScriptVersion;
      host.getScriptVersion = (f) => String(versions[f] ?? origGetScriptVersion(f));
      const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
      const proxy = create({
        languageService,
        languageServiceHost: host,
        project: {
          projectService: {logger: {info: () => {}}},
          getCurrentDirectory: () => '/',
          getProjectVersion: () => String(projectVersion),
        },
        config: {
          enabled: true,
          inferUsage: true,
          cartridges: fixture.cartridgeConfigs,
        },
      });
      for (const f of Object.keys(versions)) versions[f] += 1;
      projectVersion += 1;

      const helperPath = absoluteCartridgePath('test_cartridge', 'cartridge/scripts/helpers/productHelpers.js');
      const source = fixture.files[helperPath];
      const paramPos = positionOf(source, 'product)');
      assertInferredHover(proxy, helperPath, paramPos, /Product/);
    });
  });

  describe('assert helpers smoke', () => {
    it('assertNoInferredHover passes when inferUsage is off', () => {
      const files = {
        '/types.d.ts': 'declare function getProduct(): {ID: string};',
        '/helper.js': `
          function helper(product) { return product.ID; }
          helper(getProduct());
          module.exports = {helper: helper};
        `,
      };
      const {create} = init({typescript: ts});
      const host = createFixtureHost(files);
      const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
      const proxy = create({
        languageService,
        languageServiceHost: host,
        project: {
          projectService: {logger: {info: () => {}}},
          getCurrentDirectory: () => '/',
          getProjectVersion: () => '1',
        },
        config: {enabled: true, inferUsage: false, cartridges: [{name: 'c', src: '/'}]},
      });
      assertNoInferredHover(proxy, '/helper.js', positionOf(files['/helper.js'], 'product)'));
    });
  });
});
