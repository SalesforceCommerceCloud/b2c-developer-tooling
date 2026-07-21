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
    // Include several ExtensibleObject-like classes so `.custom` is ambiguous
    // across the ambient index — and name the parameter `shipment` so the
    // identifier-name short-circuit would otherwise rescue Shipment despite
    // the weak evidence.
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment', 'ProductLineItem', 'Profile', 'Customer'], ''),
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

  it('does not let an identifier-name match rescue a weak-only custom+UUID signature', () => {
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment', 'ProductLineItem', 'Profile', 'Customer'], ''),
      '/helpers.js': `
        function touch(shipment) {
          return shipment.custom || shipment.UUID;
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/helpers.js', 'touch');

    assert.deepEqual(inferParameterType(ctx, fn.parameters[0]), []);
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

  describe("the `'member' in x` existence-check idiom as usage evidence", () => {
    // Real-world shape from omoda-core: 261 occurrences across 107 files
    // guard an optional/custom attribute with `'Foo' in obj` before reading
    // it — sometimes with no direct property-access read anywhere nearby to
    // otherwise carry the signal (e.g. omoda-core's productBase.js checking
    // `'appliedPromotions' in this` with the read happening only on a later,
    // unrelated code path). collectMemberUsageInScope must count this
    // idiom, not just direct `x.member` reads.
    it("collectParameterMemberUsage counts a bare `'member' in param` check", () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Shipment'], ''),
        '/shippingHelpers.js': `
          function describeShipment(shipment) {
            if ('custom' in shipment) {
              return 'has custom';
            }
            return 'no custom';
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'describeShipment');

      const members = collectParameterMemberUsage(ctx, fn.parameters[0]);

      assert.deepEqual([...members], ['custom']);
    });

    it("infers a real-world class purely from `in` checks (getProductSetOrder shape: ('x' in productCustom) ? ... : null)", () => {
      // Mirrors omoda-core's productHelpers.js: no direct property-access
      // read on the parameter at all near the guard — the ternary's
      // consequent reads a *different* expression built from the checked
      // name as a string, not `productCustom.custom` itself in this
      // simplified repro, so the `in` checks are the only usage evidence.
      const files = {
        '/types.d.ts': realTypesPrelude(['Shipment'], ''),
        '/shippingHelpers.js': `
          function describeShipment(shipment) {
            var hasCustom = 'custom' in shipment;
            var hasLineItems = 'productLineItems' in shipment;
            return hasCustom &amp;&amp; hasLineItems;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'describeShipment');

      const types = inferParameterType(ctx, fn.parameters[0]);

      assert.equal(describeTypes(ctx.checker, types), 'Shipment');
    });

    it('combines an `in` check with a direct property-access read on the same member without double-counting (category.parent tree-walk shape)', () => {
      // Mirrors omoda-core's dynamicAddressHelpers.js/productSearch.js:
      // `if (category &amp;&amp; 'parent' in category &amp;&amp; category.parent.ID !== 'root')`.
      const files = {
        '/types.d.ts': realTypesPrelude(['Shipment'], ''),
        '/shippingHelpers.js': `
          function walkUp(shipment) {
            if (shipment &amp;&amp; 'custom' in shipment &amp;&amp; shipment.productLineItems.length > 0) {
              return true;
            }
            return false;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'walkUp');

      const members = collectParameterMemberUsage(ctx, fn.parameters[0]);
      assert.deepEqual([...members].sort(), ['custom', 'productLineItems']);

      const types = inferParameterType(ctx, fn.parameters[0]);
      assert.equal(describeTypes(ctx.checker, types), 'Shipment');
    });

    it("attributes a chained `'member' in x.y` check to x.y's own one-hop access (`y`), not the checked name itself", () => {
      // `'Subsoort' in apiProduct.custom`: `apiProduct.custom` is itself a
      // direct, one-hop property access on `apiProduct` (contributing
      // `custom`, same as any other `apiProduct.custom` occurrence) — the
      // `in` check's right-hand side isn't a bare identifier matching the
      // symbol, so `fromStoreId` correctly never gets attributed to
      // `apiProduct`'s own signature; it describes `custom`'s shape instead.
      const files = {
        '/types.d.ts': realTypesPrelude(['Shipment'], ''),
        '/shippingHelpers.js': `
          function describeShipment(shipment) {
            return 'fromStoreId' in shipment.custom;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/shippingHelpers.js', 'describeShipment');

      const members = collectParameterMemberUsage(ctx, fn.parameters[0]);

      assert.deepEqual([...members], ['custom']);
    });
  });

  it('infers dw.catalog.Category from mutually-exclusive boolean-flag branches (getProductType shape)', () => {
    // Real-world shape from omoda-core's productHelpers.js's getProductType
    // (there, checking product.master/variant/variationGroup/productSet/
    // bundle/optionProduct — dw.catalog.Product itself is generic and
    // deliberately excluded from ambient-class matching, see
    // buildAmbientClassIndex, so this repro substitutes dw.catalog.Category's
    // own four real boolean flags): a chain of if/else-if branches, each
    // reading a different boolean flag on the same undocumented parameter —
    // the return value is a plain string, so return-expression inference
    // alone would learn nothing; only the union of every branch's flag read
    // (already handled by the unconditional, control-flow-agnostic AST walk)
    // recovers the parameter's real shape.
    const files = {
      '/types.d.ts': realTypesPrelude(['Category'], ''),
      '/categoryHelpers.js': `
        function getCategoryType(category) {
          var result;
          if (category.root) {
            result = 'root';
          } else if (category.topLevel) {
            result = 'topLevel';
          } else if (category.online) {
            result = 'online';
          } else if (category.onlineFlag) {
            result = 'onlineFlag';
          } else {
            result = 'standard';
          }
          return result;
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/categoryHelpers.js', 'getCategoryType');

    const types = inferParameterType(ctx, fn.parameters[0]);

    assert.equal(describeTypes(ctx.checker, types), 'Category');
  });

  it('infers a parameter from a member-built object literal passed to a call argument, not returned (pushReview shape)', () => {
    // Real-world shape from omoda-core's Reviews.js job step: the
    // shape-defining object literal is built from the parameter's own
    // properties and passed straight into another call's argument
    // (`newReviews.unshift({...})`), never returned — the member-access walk
    // must recover this the same way it would a returned object literal,
    // since it doesn't care about the statement context a read sits in.
    const files = {
      '/types.d.ts': realTypesPrelude(['ProductLineItem'], ''),
      '/reviewHelpers.js': `
        function pushReview(list, review) {
          list.unshift({
            productID: review.productID,
            quantity: review.quantity,
            catalogProduct: review.catalogProduct,
          });
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/reviewHelpers.js', 'pushReview');

    const types = inferParameterType(ctx, fn.parameters[1]);

    assert.equal(describeTypes(ctx.checker, types), 'ProductLineItem');
  });

  describe('identifier-name tiebreak (prefers the class matching the variable/parameter name)', () => {
    // Real-world bug from mul-core's plugin_marketing_cloud/accountHelpers.js
    // (sentAccountActivationEmail): `var profile = resettingCustomer.profile;`
    // is only ever read via email/firstName/lastName/custom — a field subset
    // shared by both the real dw.customer.Profile (420 lines, dozens of
    // members) and the much smaller dw.customer.ProductListRegistrant (70
    // lines). "Fewest total members" alone picked ProductListRegistrant
    // every time, purely because it has less surface area — never the
    // large, contextually correct Profile. `resettingCustomer` itself is
    // deliberately left uninferred (an explicit, if made-up, JSDoc
    // `@param {obj}` type) — the fallback only ever reaches `profile`'s own
    // usage signature, matching the exact real-world path.
    it('infers Profile (not the smaller, equally-matching ProductListRegistrant) for a variable literally named `profile`', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Profile', 'ProductListRegistrant'], ''),
        '/accountHelpers.js': `
          /**
           * @param {obj} resettingCustomer - object that contains user's email address and name information.
           */
          function sentAccountActivationEmail(resettingCustomer) {
            var profile = resettingCustomer.profile;
            return {
              email: profile.email,
              firstname: profile.firstName,
              lastname: profile.lastName,
              multico_id__c: profile.custom.multicoID,
            };
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/accountHelpers.js', 'sentAccountActivationEmail');

      // resettingCustomer's own explicit (if nonsensical) JSDoc type must be
      // left alone, exactly as it is in the real file.
      const resettingCustomerTypes = inferParameterType(ctx, fn.parameters[0]);
      assert.deepEqual(resettingCustomerTypes, []);

      let profileDecl;
      const visit = (n) => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === 'profile') profileDecl = n;
        ts.forEachChild(n, visit);
      };
      visit(fn.body);

      const types = inferTypeForNode(ctx, profileDecl.name);

      assert.equal(describeTypes(ctx.checker, types), 'Profile');
    });

    it('still returns the smallest-total-members candidate when no candidate name matches the identifier', () => {
      // Same ambiguous member signature, different (unrelated) variable
      // name — the size-based tiebreak from before this fix must still
      // apply exactly as it did, since there's no name match to prefer.
      // Keeps the same `@param {obj}` JSDoc block as the test above: without
      // it, `resettingCustomer`'s own single-member usage (`.profile`)
      // uniquely matches `dw.customer.Customer` on its own, resolving
      // `.profile` through Customer's real declared property and never
      // reaching the ambient-fallback path this test means to exercise.
      const files = {
        '/types.d.ts': realTypesPrelude(['Profile', 'ProductListRegistrant'], ''),
        '/accountHelpers.js': `
          /**
           * @param {obj} resettingCustomer - object that contains user's email address and name information.
           */
          function sentAccountActivationEmail(resettingCustomer) {
            var contactInfo = resettingCustomer.profile;
            return {
              email: contactInfo.email,
              firstname: contactInfo.firstName,
              lastname: contactInfo.lastName,
              multico_id__c: contactInfo.custom.multicoID,
            };
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/accountHelpers.js', 'sentAccountActivationEmail');

      let contactInfoDecl;
      const visit = (n) => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === 'contactInfo') {
          contactInfoDecl = n;
        }
        ts.forEachChild(n, visit);
      };
      visit(fn.body);

      const types = inferTypeForNode(ctx, contactInfoDecl.name);

      assert.equal(describeTypes(ctx.checker, types), 'ProductListRegistrant');
    });

    it('does not let an identifier-name match rescue a signature that matches zero ambient classes', () => {
      const {ctx} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

      const types = matchAmbientTypesByUsage(
        ctx,
        new Set(['thisMemberDoesNotExistAnywhere', 'norDoesThisOne']),
        'shipment',
      );

      assert.deepEqual(types, []);
    });
  });
});
