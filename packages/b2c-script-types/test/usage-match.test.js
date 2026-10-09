/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');

const ts = require('typescript');

const {
  createInferenceContext,
  describeTypes,
  inferParameterType,
  inferTypeForNode,
  matchAmbientTypesByUsage,
  usageProfileOf,
} = require('../src/usage-inference');
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

    assert.equal(describeTypes(ctx, types), 'Shipment');
  });

  it('usageProfileOf sees a member accessed only inside a nested closure', () => {
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

    const members = usageProfileOf(ctx, fn.parameters[0]).memberNames;

    assert.deepEqual([...members].sort(), ['custom', 'setShippingMethod']);
  });

  it('returns no candidates when the usage signature is a single, too-generic member name', () => {
    // Include several ExtensibleObject-like classes so `.custom` is ambiguous
    // across the ambient index — and name the parameter `shipment` so the
    // identifier-name tiebreak would otherwise rescue Shipment despite the
    // weak evidence.
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

    assert.equal(describeTypes(ctx, types), '');
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

  it('lets an identifier-name match rescue a single strong member shared by multiple classes (customer + .profile)', () => {
    // Real-world shape from a storefront cartridge's accountHelpers.js:
    // getPasswordResetToken(customer) { customer.profile.credentials… }.
    // One-hop usage collection only sees `.profile`, which Customer shares
    // with ServiceConfig — below MIN_USAGE_SIGNATURE_MEMBERS and ambiguous —
    // but the parameter name uniquely picks Customer. Contrast the weak-only
    // custom+UUID case above: `.profile` is a strong member, so the name may
    // break the tie.
    const files = {
      '/types.d.ts': realTypesPrelude(['Customer', 'ServiceConfig'], ''),
      '/accountHelpers.js': `
        function getPasswordResetToken(customer) {
          return customer.profile.credentials.createResetPasswordToken();
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/accountHelpers.js', 'getPasswordResetToken');

    assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'Customer');
  });

  it('stays silent for a single strong member shared by multiple classes when the identifier name does not disambiguate', () => {
    const files = {
      '/types.d.ts': realTypesPrelude(['Customer', 'ServiceConfig'], ''),
      '/helpers.js': `
        function readProfile(obj) {
          return obj.profile;
        }
      `,
    };
    const {ctx, fn} = setupInference(files, '/helpers.js', 'readProfile');

    assert.deepEqual(inferParameterType(ctx, fn.parameters[0]), []);
  });

  it('infers a single accessed member when it uniquely identifies one ambient class (addressBook.addresses)', () => {
    // Real-world shape from a storefront cartridge's addressHelpers.js:
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

    assert.equal(describeTypes(ctx, types), 'AddressBook');
  });

  it('matchAmbientTypesByUsage returns [] for a single member name that ties across multiple ambient classes', () => {
    const {ctx} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

    // `.custom` (the SFCC custom-attributes pattern) is shared by many
    // ambient classes pulled in transitively — a weak signature that's also
    // ambiguous must still be declined, unlike the addressBook.addresses case
    // above.
    const types = matchAmbientTypesByUsage(ctx, new Set(['custom']));

    assert.equal(describeTypes(ctx, types), '');
  });

  it('matchAmbientTypesByUsage returns [] for a usage signature no ambient class satisfies', () => {
    const {ctx} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

    const types = matchAmbientTypesByUsage(ctx, new Set(['thisMemberDoesNotExistAnywhere', 'norDoesThisOne']));

    assert.equal(describeTypes(ctx, types), '');
  });

  it("infers a manual-indexing loop variable's type from its own usage (var item = items[i])", () => {
    // Real-world shape from a storefront cartridge's checkoutHelpers.js: an
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

    assert.equal(describeTypes(ctx, types), 'ProductLineItem');
  });

  it('stays quiet for a real-world single-member loop variable (hasPreorderableLineItem shape)', () => {
    // Same a storefront cartridge shape, but only one member (`preorderable`) is ever
    // accessed on the loop variable — below MIN_USAGE_SIGNATURE_MEMBERS.
    // `preorderable` uniquely identifies ProductInventoryRecord in the ambient
    // index, but the variable is named `lineItem` (SFRA alias → ProductLineItem),
    // so the naming hint wins and we stay silent rather than surprise the
    // author with an inventory-record hover.
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

    // Prefer length over deepEqual: Type objects are circular and hang
    // assert.deepEqual when a regression accidentally returns a candidate.
    assert.equal(types.length, 0, `expected silence, got: ${describeTypes(ctx, types)}`);
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

    assert.equal(describeTypes(ctx, types), 'Shipment');
  });

  describe("the `'member' in x` existence-check idiom as usage evidence", () => {
    // Real-world shape from a storefront cartridge: 261 occurrences across 107 files
    // guard an optional/custom attribute with `'Foo' in obj` before reading
    // it — sometimes with no direct property-access read anywhere nearby to
    // otherwise carry the signal (e.g. a storefront cartridge's productBase.js checking
    // `'appliedPromotions' in this` with the read happening only on a later,
    // unrelated code path). collectMemberUsageInScope must count this
    // idiom, not just direct `x.member` reads.
    it("usageProfileOf counts a bare `'member' in param` check", () => {
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

      const members = usageProfileOf(ctx, fn.parameters[0]).memberNames;

      assert.deepEqual([...members], ['custom']);
    });

    it("infers a real-world class purely from `in` checks (getProductSetOrder shape: ('x' in productCustom) ? ... : null)", () => {
      // Mirrors a storefront cartridge's productHelpers.js: no direct property-access
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

      assert.equal(describeTypes(ctx, types), 'Shipment');
    });

    it('combines an `in` check with a direct property-access read on the same member without double-counting (category.parent tree-walk shape)', () => {
      // Mirrors a storefront cartridge's dynamicAddressHelpers.js/productSearch.js:
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

      const members = usageProfileOf(ctx, fn.parameters[0]).memberNames;
      assert.deepEqual([...members].sort(), ['custom', 'productLineItems']);

      const types = inferParameterType(ctx, fn.parameters[0]);
      assert.equal(describeTypes(ctx, types), 'Shipment');
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

      const members = usageProfileOf(ctx, fn.parameters[0]).memberNames;

      assert.deepEqual([...members], ['custom']);
    });
  });

  it('infers dw.catalog.Category from mutually-exclusive boolean-flag branches (getProductType shape)', () => {
    // Real-world shape from a storefront cartridge's productHelpers.js's getProductType
    // (there, checking product.master/variant/variationGroup/productSet/
    // bundle/optionProduct — Category is used here instead of Product so the
    // case stays focused on multi-boolean-flag disambiguation rather than the
    // Product/Variant family): a chain of if/else-if branches, each
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

    assert.equal(describeTypes(ctx, types), 'Category');
  });

  it('infers a parameter from a member-built object literal passed to a call argument, not returned (pushReview shape)', () => {
    // Real-world shape from a storefront cartridge's Reviews.js job step: the
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

    assert.equal(describeTypes(ctx, types), 'ProductLineItem');
  });

  describe('identifier-name tiebreak (prefers the class matching the variable/parameter name)', () => {
    // Real-world shape: `var profile = resettingCustomer.profile;` is only
    // ever read via email/firstName/lastName/custom — a field subset shared
    // by both dw.customer.Profile and the much smaller
    // dw.customer.ProductListRegistrant. "Fewest total members" alone used to
    // pick ProductListRegistrant; the identifier `profile` breaks the tie in
    // favour of Profile. The parameter itself is also recoverable now via the
    // PascalCase suffix `resettingCustomer` → Customer (even with weak
    // `@param {obj}`), so `.profile` can resolve through Customer's declared
    // property as well.
    it('infers Profile (not the smaller, equally-matching ProductListRegistrant) for a variable literally named `profile`', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Profile', 'ProductListRegistrant', 'Customer', 'ServiceConfig'], ''),
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

      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'Customer');

      let profileDecl;
      const visit = (n) => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === 'profile') profileDecl = n;
        ts.forEachChild(n, visit);
      };
      visit(fn.body);

      const types = inferTypeForNode(ctx, profileDecl.name);

      assert.equal(describeTypes(ctx, types), 'Profile');
    });

    it('returns the union of every fitting class when no candidate name matches the identifier', () => {
      // Same ambiguous member signature, different (unrelated) variable
      // name: with no name to break the tie, every class the usage fits is
      // shown, the way IntelliJ lists each candidate.
      // Deliberate `@param {any}` (not the weak `{obj}` placeholder) blocks
      // inference on `resettingCustomer`: without it, the parameter's own
      // single-member usage (`.profile`) uniquely matches Customer in this
      // fixture and resolves `.profile` through the real declared property,
      // never reaching the ambient-fallback path this test means to exercise.
      const files = {
        '/types.d.ts': realTypesPrelude(['Profile', 'ProductListRegistrant'], ''),
        '/accountHelpers.js': `
          /**
           * @param {any} resettingCustomer - deliberately any so contactInfo must use ambient fallback.
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

      assert.equal(describeTypes(ctx, types), 'ProductListRegistrant | Profile');
    });

    it('does not let an identifier-name match rescue a signature that matches zero ambient classes', () => {
      const {ctx} = setupInference(SHIPMENT_HELPER_FILES, '/shippingHelpers.js', 'markShipmentForShipping');

      const types = matchAmbientTypesByUsage(
        ctx,
        new Set(['thisMemberDoesNotExistAnywhere', 'norDoesThisOne']),
        'shipment',
      );

      assert.equal(describeTypes(ctx, types), '');
    });

    it('maps SFRA alias lineItem → ProductLineItem for a single strong member', () => {
      // Real storefront shape: productLineItem decorators name the parameter
      // `lineItem` / `pli`, never `productLineItem` — exact name matching alone
      // cannot break the tie in favour of ProductLineItem.
      const files = {
        '/types.d.ts': realTypesPrelude(['ProductLineItem', 'ShippingLineItem'], ''),
        '/priceTotal.js': `
          function getTotalPrice(lineItem) {
            return lineItem.priceAdjustments;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/priceTotal.js', 'getTotalPrice');

      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'ProductLineItem');
    });

    it('maps short alias pli → ProductLineItem', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['ProductLineItem', 'ShippingLineItem'], ''),
        '/order.js': `
          function handlePliAttributes(pli) {
            pli.setPriceValue(0);
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/order.js', 'handlePliAttributes');

      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'ProductLineItem');
    });

    it('maps PascalCase suffix resettingCustomer → Customer (SFRA accountHelpers)', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Customer', 'ServiceConfig'], ''),
        '/accountHelpers.js': `
          /**
           * @param {Object} resettingCustomer
           */
          function sendPasswordResetEmail(email, resettingCustomer) {
            return resettingCustomer.profile.credentials.createResetPasswordToken();
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/accountHelpers.js', 'sendPasswordResetEmail');

      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[1])), 'Customer');
    });

    it('maps paymentInstrument alias → OrderPaymentInstrument', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['OrderPaymentInstrument'], ''),
        '/helpers.js': `
          function amountOf(paymentInstrument) {
            return paymentInstrument.capturedAmount;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/helpers.js', 'amountOf');
      assert.ok(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])).includes('OrderPaymentInstrument'));
    });

    it('maps PascalCase Profile suffix registeredCustomerProfile → Profile', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['Profile', 'ProductListRegistrant'], ''),
        '/helpers.js': `
          function greet(registeredCustomerProfile) {
            return registeredCustomerProfile.firstName + registeredCustomerProfile.email;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/helpers.js', 'greet');
      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'Profile');
    });

    it('maps PascalCase suffixes apiProduct / currentBasket / defaultShipment', () => {
      for (const [fnName, param, member, dwType, expect] of [
        ['wrapApiProduct', 'apiProduct', 'getPriceModel', 'Product', 'Product'],
        ['useBasket', 'currentBasket', 'billingAddress', 'Basket', 'Basket'],
        ['useShipment', 'defaultShipment', 'productLineItems', 'Shipment', 'Shipment'],
      ]) {
        const files = {
          '/types.d.ts': realTypesPrelude([dwType], ''),
          '/helpers.js': `
            function ${fnName}(${param}) {
              return ${param}.${member};
            }
          `,
        };
        const {ctx, fn} = setupInference(files, '/helpers.js', fnName);
        assert.ok(
          describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])).includes(expect),
          `${param} should infer ${expect}`,
        );
      }
    });

    it('does not treat all-lowercase names as CamelCase class suffixes (border ≠ Order)', () => {
      // `.profile` is shared by Customer and ServiceConfig. A false
      // `*order` → Order (or similar) suffix on `border` must not invent a
      // unique name match — stay silent like any other uninformative name.
      const files = {
        '/types.d.ts': realTypesPrelude(['Customer', 'ServiceConfig', 'Order'], ''),
        '/helpers.js': `
          function paint(border) {
            return border.profile;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/helpers.js', 'paint');
      assert.equal(inferParameterType(ctx, fn.parameters[0]).length, 0);
    });

    it('still silences lineItem when the only evidence is weak .custom', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(['ProductLineItem', 'ShippingLineItem', 'Profile'], ''),
        '/helpers.js': `
          function touchCustom(lineItem) {
            return lineItem.custom;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/helpers.js', 'touchCustom');

      assert.equal(inferParameterType(ctx, fn.parameters[0]).length, 0);
    });
  });

  describe('instanceof evidence', () => {
    it('infers ProductLineItem from a single instanceof check with no call sites', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(
          ['ProductLineItem', 'ShippingLineItem'],
          `
          const ProductLineItem: { new (): ProductLineItem };
          const ShippingLineItem: { new (): ShippingLineItem };
        `,
        ),
        '/lineItemHelper.js': `
          function isProductLine(lineItem) {
            return lineItem instanceof ProductLineItem;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/lineItemHelper.js', 'isProductLine');

      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'ProductLineItem');
    });

    it('infers the union of the classes the body instanceof-checks', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(
          ['ProductLineItem', 'ShippingLineItem', 'PriceAdjustment'],
          `
          const ProductLineItem: { new (): ProductLineItem };
          const ShippingLineItem: { new (): ShippingLineItem };
          const PriceAdjustment: { new (): PriceAdjustment };
        `,
        ),
        '/lineItemHelper.js': `
          function describeLine(lineItem) {
            if (lineItem instanceof ProductLineItem) return 'product';
            if (lineItem instanceof ShippingLineItem) return 'shipping';
            if (lineItem instanceof PriceAdjustment) return 'adjustment';
            return 'other';
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/lineItemHelper.js', 'describeLine');

      assert.equal(
        describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])),
        'ProductLineItem | ShippingLineItem | PriceAdjustment',
      );
    });

    it('collapses more than three instanceof-checked classes to their closest shared superclass', () => {
      const files = {
        '/types.d.ts': realTypesPrelude(
          ['ProductLineItem', 'ShippingLineItem', 'PriceAdjustment', 'ProductShippingLineItem'],
          `
          const ProductLineItem: { new (): ProductLineItem };
          const ShippingLineItem: { new (): ShippingLineItem };
          const PriceAdjustment: { new (): PriceAdjustment };
          const ProductShippingLineItem: { new (): ProductShippingLineItem };
        `,
        ),
        '/lineItemHelper.js': `
          function describeLine(lineItem) {
            if (lineItem instanceof ProductLineItem) return 'product';
            if (lineItem instanceof ShippingLineItem) return 'shipping';
            if (lineItem instanceof PriceAdjustment) return 'adjustment';
            if (lineItem instanceof ProductShippingLineItem) return 'product shipping';
            return lineItem.lineItemText;
          }
        `,
      };
      const {ctx, fn} = setupInference(files, '/lineItemHelper.js', 'describeLine');

      assert.equal(describeTypes(ctx, inferParameterType(ctx, fn.parameters[0])), 'LineItem');
    });
  });
});

describe('usage-inference — ambient-class index', () => {
  it('sees a declaration file added after an earlier request (no index pinned to the first Program)', () => {
    const files = {
      '/types.d.ts': 'interface Gadget { sprocket: string; widgetize(): void; }\n',
      '/helpers.js': 'function noop() {}\n',
    };
    const languageService = createFixtureLanguageService(files, {strict: true});
    const before = createInferenceContext(ts, languageService);
    assert.equal(describeTypes(before, matchAmbientTypesByUsage(before, new Set(['sprocket', 'widgetize']))), 'Gadget');
    assert.equal(describeTypes(before, matchAmbientTypesByUsage(before, new Set(['cog', 'spin']))), '');

    files['/more.d.ts'] = 'interface Gizmo { cog: number; spin(): void; }\n';
    const after = createInferenceContext(ts, languageService);

    assert.equal(describeTypes(after, matchAmbientTypesByUsage(after, new Set(['cog', 'spin']))), 'Gizmo');
  });

  it("never matches TypeScript's own library classes (ES / DOM)", () => {
    const {ctx} = setupInference({'/helpers.js': 'function noop() {}\n'}, '/helpers.js', 'noop');

    // Only lib.es*.d.ts's Date has both members.
    const types = matchAmbientTypesByUsage(ctx, new Set(['getUTCFullYear', 'toISOString']));

    assert.equal(describeTypes(ctx, types), '');
  });
});

describe('usage-inference — precision guards', () => {
  const inferFirstParam = (files, fnName) => {
    const {ctx, fn} = setupInference(files, '/helpers.js', fnName);
    return describeTypes(ctx, inferParameterType(ctx, fn.parameters[0]));
  };

  it('never matches a class describing one global object (TopLevel Module for a lone `.id`)', () => {
    const files = {
      '/types.d.ts': 'declare class Module { cartridge: string; id: string; exports: any; }\n',
      '/helpers.js': 'function getRegionId(regionDefinition) {\n  return regionDefinition.id;\n}\n',
    };

    assert.equal(inferFirstParam(files, 'getRegionId'), '');
  });

  it('stays silent when a JavaScript built-in has every used member too (`msg.replace` is a string, not XML)', () => {
    const files = {
      '/types.d.ts': 'declare class XML { replace(propertyName: any, value: any): XML; copy(): XML; }\n',
      '/helpers.js': "function filterLogMessage(msg) {\n  return msg.replace(/secret/g, '***');\n}\n",
    };

    assert.equal(inferFirstParam(files, 'filterLogMessage'), '');
  });

  it('still lets the identifier name pick a Script API class a built-in also fits (calendar.getTime())', () => {
    const files = {
      '/types.d.ts': 'declare class Calendar { getTime(): any; setTimeZone(zone: string): void; }\n',
      '/helpers.js': 'function toMillis(calendar) {\n  return calendar.getTime();\n}\n',
    };

    assert.equal(inferFirstParam(files, 'toMillis'), 'Calendar');
  });

  describe('members no declared type has (vendored API older than the platform, expando properties)', () => {
    const SEARCH_HIT_TYPES =
      'declare class SearchHit { productID: string; getProduct(): any; }\ndeclare function getHit(): SearchHit;\n';

    it('keep the call-site type the body otherwise fits (getPromotions(searchHit) shape)', () => {
      const files = {
        '/types.d.ts': SEARCH_HIT_TYPES,
        '/helpers.js': `
          function getPromotions(searchHit) {
            return searchHit.discountedPromotionIDs.concat(searchHit.productID);
          }
          getPromotions(getHit());
        `,
      };

      assert.equal(inferFirstParam(files, 'getPromotions'), 'SearchHit');
    });

    it('still drop a candidate when another candidate declares the member', () => {
      const files = {
        '/types.d.ts': SEARCH_HIT_TYPES,
        '/helpers.js': `
          function getPromotions(searchHit) {
            return searchHit.discountedPromotionIDs.concat(searchHit.productID);
          }
          getPromotions(getHit());
          getPromotions({productID: 'p1', discountedPromotionIDs: []});
        `,
      };

      assert.equal(inferFirstParam(files, 'getPromotions'), '{ productID: string; discountedPromotionIDs: never[]; }');
    });

    it('keep ambient matching strict when there is no call site', () => {
      const files = {
        '/types.d.ts': SEARCH_HIT_TYPES,
        '/helpers.js':
          'function getPromotions(searchHit) {\n  return searchHit.discountedPromotionIDs.concat(searchHit.productID);\n}\n',
      };

      assert.equal(inferFirstParam(files, 'getPromotions'), '');
    });
  });

  describe('instantiations of one generic class', () => {
    const COLLECTION_TYPES = realTypesPrelude(
      ['Collection', 'Product', 'Category', 'Shipment', 'Order'],
      `
        function getProducts(): Collection<Product>;
        function getCategories(): Collection<Category>;
        function getShipments(): Collection<Shipment>;
        function getOrders(): Collection<Order>;
      `,
    );

    it('read as the class itself when they exceed the union limit (SFRA collections.forEach(collection))', () => {
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/helpers.js': `
          function forEach(collection, callback) {
            var iterator = collection.iterator();
            while (iterator.hasNext()) callback(iterator.next());
          }
          forEach(getProducts(), function () {});
          forEach(getCategories(), function () {});
          forEach(getShipments(), function () {});
          forEach(getOrders(), function () {});
        `,
      };

      assert.equal(inferFirstParam(files, 'forEach'), 'Collection');
    });

    it('never merge arrays: the declared Array<T> would read as `T[]`', () => {
      const files = {
        '/types.d.ts': '',
        '/helpers.js': `
          function wrapList(files) {
            return {size: function () { return files.length; }};
          }
          wrapList([{a: 1}]);
          wrapList([{b: 'x'}]);
          wrapList([{c: true}]);
          wrapList([{d: null, e: 1}]);
        `,
      };

      assert.equal(inferFirstParam(files, 'wrapList'), '');
    });

    it('keep their element types while the union stays small', () => {
      const files = {
        '/types.d.ts': COLLECTION_TYPES,
        '/helpers.js': `
          function forEach(collection, callback) {
            var iterator = collection.iterator();
            while (iterator.hasNext()) callback(iterator.next());
          }
          forEach(getProducts(), function () {});
          forEach(getCategories(), function () {});
        `,
      };

      assert.equal(inferFirstParam(files, 'forEach'), 'Collection<Product> | Collection<Category>');
    });
  });
});
