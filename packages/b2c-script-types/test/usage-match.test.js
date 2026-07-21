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
  inferTypeForNode,
  matchAmbientTypesByUsage,
  collectParameterMemberUsage,
} = require('../plugin/usage-inference');
const {createFixtureLanguageService, findFunctionDeclaration} = require('./helpers/fixture-language-service');
const {realTypesPrelude} = require('./helpers/real-dw-types');

function setupInference(files, jsFileName, fnName) {
  const languageService = createFixtureLanguageService(files, {strict: true});
  const ctx = createInferenceContext(ts, languageService);
  const sourceFile = ctx.program.getSourceFile(jsFileName);
  const fn = findFunctionDeclaration(sourceFile, fnName);
  return {ctx, fn};
}

// A helper never called from anywhere the reference search can follow (a
// Controller route dispatch, an exports map entry never require()'d in the
// same fixture, or simply dead code) has no call site to infer a parameter's
// type from at all. This suite covers the fallback that kicks in when the
// rest of the engine comes up completely empty: matching how the parameter's
// own body uses it against the program's real dw.* ambient classes.
describe('usage-inference — matching ambient dw.* classes from parameter usage (no call sites)', () => {
  const SHIPMENT_HELPER_FILES = {
    '/types.d.ts': realTypesPrelude(['Shipment'], ''),
    '/shippingHelpers.js': `
      function markShipmentForShipping(shipment) {
        shipment.custom.fromStoreId = null;
        var items = shipment.productLineItems;
        return items;
      }
    `,
  };

  it('infers dw.order.Shipment for an uncalled parameter from its own member usage (.custom, .productLineItems)', () => {
    const {ctx, fn} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

    const types = inferParameterType(ctx, fn.parameters[0]);

    assert.equal(describeTypes(ctx.checker, types), 'Shipment');
  });

  it('collectParameterMemberUsage sees a member accessed only inside a nested closure', () => {
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment'], ''),
      '/shippingHelpers.js': `
        function markShipmentForShipping(shipment) {
          doInTransaction(function () {
            shipment.custom.fromStoreId = null;
            shipment.setShippingMethod(null);
          });
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'markShipmentForShipping');

    const members = collectParameterMemberUsage(ctx, fn.parameters[0]);

    assert.deepEqual([...members].sort(), ['custom', 'setShippingMethod']);
  });

  it('returns no candidates when the usage signature is a single, too-generic member name', () => {
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment'], ''),
      '/shippingHelpers.js': `
        function touchCustom(shipment) {
          shipment.custom.fromStoreId = null;
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'touchCustom');

    const types = inferParameterType(ctx, fn.parameters[0]);

    assert.deepEqual(types, []);
  });

  it('infers a single accessed member when it uniquely identifies one ambient class (addressBook.addresses)', () => {
    // Real-world shape from neuhaus-core's addressHelpers.js:
    // getAddressBookAddressByForm(addressBook, form) only ever touches
    // addressBook.addresses directly — a single member, normally below
    // MIN_USAGE_SIGNATURE_MEMBERS. Unlike `.custom` above, `.addresses` is
    // declared by exactly one ambient class in the whole program
    // (dw.customer.AddressBook), so the signature is weak but unambiguous
    // and should still be trusted.
    const files = {
      '/types.d.ts': realTypesPrelude(['AddressBook'], ''),
      '/addressHelpers.js': `
        function getAddressBookAddressByForm(addressBook, form) {
          var collections = require('*/cartridge/scripts/util/collections');
          return collections.find(addressBook.addresses, function (address) {
            return address.postalCode === form.postalCode.value;
          });
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/addressHelpers.js', 'getAddressBookAddressByForm');

    const types = inferParameterType(ctx, fn.parameters[0]);

    assert.equal(describeTypes(ctx.checker, types), 'AddressBook');
  });

  it('matchAmbientTypesByUsage returns [] for a single member name that ties across multiple ambient classes', () => {
    const {ctx} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

    // `.custom` (the SFCC custom-attributes pattern) is shared by many
    // ambient classes pulled in transitively — a weak signature that's also
    // ambiguous must still be declined, unlike the addressBook.addresses case
    // above.
    const types = matchAmbientTypesByUsage(ctx, new Set(['custom']));

    assert.deepEqual(types, []);
  });

  it('matchAmbientTypesByUsage returns [] for a usage signature no ambient class satisfies', () => {
    const {ctx} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

    const types = matchAmbientTypesByUsage(ctx, new Set(['thisMemberDoesNotExistAnywhere', 'norDoesThisOne']));

    assert.deepEqual(types, []);
  });

  it("infers a manual-indexing loop variable's type from its own usage (var item = items[i])", () => {
    // Real-world shape from neuhaus-core's checkoutHelpers.js: an
    // undocumented collection parameter iterated with a manual for-loop
    // instead of collections.forEach, so items[i]'s type can never come from
    // items' own (unknown) type — only lineItem's own usage further down can
    // recover it. Three members are accessed rather than two: productID +
    // quantity alone tie between dw.order.ProductLineItem and the unrelated,
    // smaller dw.customer.ProductListItem (a wishlist entry) which happens to
    // expose both too; catalogProduct disambiguates.
    const files = {
      '/types.d.ts': realTypesPrelude(['ProductLineItem'], ''),
      '/checkoutHelpers.js': `
        function hasBulkProductLineItem(items) {
          var result = false;
          for (var i = 0; i < items.length; i++) {
            var lineItem = items[i];
            if (lineItem && lineItem.productID && lineItem.quantity && lineItem.catalogProduct) {
              result = true;
            }
          }
          return result;
        }
      `,
    };
    const languageService = createFixtureLanguageService(files, {strict: true});
    const ctx = createInferenceContext(ts, languageService);
    const sourceFile = ctx.program.getSourceFile('/checkoutHelpers.js');
    const fn = findFunctionDeclaration(sourceFile, 'hasBulkProductLineItem');
    const forStatement = fn.body.statements.find((s) => ts.isForStatement(s));
    const lineItemDecl = forStatement.statement.statements[0].declarationList.declarations[0];

    const types = inferTypeForNode(ctx, lineItemDecl.name);

    assert.equal(describeTypes(ctx.checker, types), 'ProductLineItem');
  });

  it('stays quiet for a real-world single-member loop variable (hasPreorderableLineItem shape)', () => {
    // Same neuhaus-core shape, but only one member (`preorderable`) is ever
    // accessed on the loop variable — below MIN_USAGE_SIGNATURE_MEMBERS, so
    // the engine correctly declines to guess rather than latch onto whichever
    // ambient class happens to expose that one name.
    const files = {
      '/types.d.ts': realTypesPrelude(['ProductLineItem'], ''),
      '/checkoutHelpers.js': `
        function hasPreorderableLineItem(item) {
          var result = false;
          for (var i = 0; i < item.length; i++) {
            var lineItem = item[i];
            if (lineItem && lineItem.preorderable) {
              result = true;
            }
          }
          return result;
        }
      `,
    };
    const languageService = createFixtureLanguageService(files, {strict: true});
    const ctx = createInferenceContext(ts, languageService);
    const sourceFile = ctx.program.getSourceFile('/checkoutHelpers.js');
    const fn = findFunctionDeclaration(sourceFile, 'hasPreorderableLineItem');
    const forStatement = fn.body.statements.find((s) => ts.isForStatement(s));
    const lineItemDecl = forStatement.statement.statements[0].declarationList.declarations[0];

    const types = inferTypeForNode(ctx, lineItemDecl.name);

    assert.deepEqual(types, []);
  });

  it('still prefers call-site inference over usage matching when a real call site exists', () => {
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment'], `  function getSomeShipment(): Shipment;`),
      '/shippingHelpers.js': `
        function markShipmentForShipping(shipment) {
          shipment.custom.fromStoreId = null;
          return shipment.productLineItems;
        }
        function useHelper() {
          var shipment = getSomeShipment();
          return markShipmentForShipping(shipment);
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'markShipmentForShipping');

    const types = inferParameterType(ctx, fn.parameters[0]);

    assert.equal(describeTypes(ctx.checker, types), 'Shipment');
  });
});
