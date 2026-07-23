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
const {INFERRED_COMPLETION_SOURCE} = require('../plugin/usage-inference');
const {createFixtureHost, sharedDocumentRegistry} = require('./helpers/fixture-language-service');
const {REAL_DW_TYPES, realTypesPrelude} = require('./helpers/real-dw-types');

const AMBIENT_TYPES = `
declare function getProduct(): {ID: string; name: string};
`;

const FIXTURE_FILES = {
  '/types.d.ts': AMBIENT_TYPES,
  '/helper.js': `
    function helper(product) {
      return product.ID;
    }
    helper(getProduct());
    module.exports = {helper};
  `,
};

// Builds a plugin instance wired against an in-memory LanguageService, using
// only the subset of tsserver's PluginCreateInfo surface the plugin actually
// touches (logger, project version, config, host, language service).
function createPluginProxy(config) {
  const {create} = init({typescript: ts});
  const host = createFixtureHost(FIXTURE_FILES);
  const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
  const info = {
    languageService,
    languageServiceHost: host,
    project: {
      projectService: {logger: {info: () => {}}},
      getCurrentDirectory: () => '/',
      getProjectVersion: () => '1',
    },
    config,
  };
  return create(info);
}

// Parses the fixture source once to locate exact AST offsets, rather than
// computing them by hand from the template string (fragile to whitespace).
function fixtureOffsets() {
  const source = FIXTURE_FILES['/helper.js'];
  const sourceFile = ts.createSourceFile('/helper.js', source, ts.ScriptTarget.ES2020, true);
  let paramPos;
  let dotPos;
  const visit = (node) => {
    if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.name.text === 'product') {
      paramPos = node.name.getStart(sourceFile);
    }
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'ID') {
      dotPos = node.expression.getEnd() + 1; // right after `product.`
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return {paramPos, dotPos};
}

// `/helper.js` only counts as a cartridge file once a cartridge root
// containing it is configured — matches how the real plugin scopes every
// other feature (require resolution, ambient globals) to cartridge files.
const CARTRIDGE_CONFIG = [{name: 'test_cartridge', src: '/'}];

describe('create() proxy — usage inference wiring', () => {
  const {paramPos, dotPos} = fixtureOffsets();

  it('leaves hover untouched when inferUsage is off (default)', () => {
    const proxy = createPluginProxy({enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG});
    const info = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const docText = (info?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(!docText.includes('Inferred from usage'));
  });

  it('appends an inferred-usage hover note when inferUsage is on', () => {
    const proxy = createPluginProxy({
      enabled: true,
      autoDiscover: false,
      cartridges: CARTRIDGE_CONFIG,
      inferUsage: true,
    });
    const info = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const docText = (info?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(docText.includes('Inferred from usage: { ID: string; name: string; }'));
  });

  it('leaves completions untouched when inferUsage is off (default)', () => {
    const proxy = createPluginProxy({enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG});
    const completions = proxy.getCompletionsAtPosition('/helper.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(!names.includes('ID'));
  });

  it('synthesizes member completions from inferred usage when inferUsage is on', () => {
    const proxy = createPluginProxy({
      enabled: true,
      autoDiscover: false,
      cartridges: CARTRIDGE_CONFIG,
      inferUsage: true,
    });
    const completions = proxy.getCompletionsAtPosition('/helper.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(names.includes('ID'));
    assert.ok(names.includes('name'));
  });

  it('preserves every other CompletionInfo field from the original result when merging in inferred entries', () => {
    const plainProxy = createPluginProxy({enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG});
    const original = plainProxy.getCompletionsAtPosition('/helper.js', dotPos, undefined);

    const inferProxy = createPluginProxy({
      enabled: true,
      autoDiscover: false,
      cartridges: CARTRIDGE_CONFIG,
      inferUsage: true,
    });
    const merged = inferProxy.getCompletionsAtPosition('/helper.js', dotPos, undefined);

    const originalRest = {...original};
    delete originalRest.entries;
    const mergedRest = {...merged};
    delete mergedRest.entries;
    assert.deepEqual(mergedRest, originalRest);
  });

  it('does not run inference outside a configured cartridge root, even when inferUsage is on', () => {
    // No cartridges configured -> /helper.js isn't recognized as a cartridge
    // file, matching every other feature in this plugin (require resolution,
    // ambient globals) that only applies inside known cartridge roots.
    const proxy = createPluginProxy({enabled: true, autoDiscover: false, cartridges: [], inferUsage: true});
    const info = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const docText = (info?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(!docText.includes('Inferred from usage'));

    const completions = proxy.getCompletionsAtPosition('/helper.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(!names.includes('ID'));
  });

  it('does not run inference when the parent scriptTypes feature is disabled, even when inferUsage is on', () => {
    const proxy = createPluginProxy({
      enabled: false,
      autoDiscover: false,
      cartridges: CARTRIDGE_CONFIG,
      inferUsage: true,
    });
    const info = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const docText = (info?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(!docText.includes('Inferred from usage'));

    const completions = proxy.getCompletionsAtPosition('/helper.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(!names.includes('ID'));
  });

  it('forwards the maximumLength parameter to the underlying getQuickInfoAtPosition call', () => {
    // A documented (explicitly-typed) parameter with a long inline object
    // type, so a small maximumLength actually truncates the display text —
    // proves getQuickInfoAtPosition's 3rd argument reaches the real
    // language service rather than being silently dropped by the wrapper.
    const files = {
      '/typed.ts': `function helper(x: {aVeryLongPropertyNameHere: string; anotherVeryLongPropertyName: number; yetAnotherLongOne: boolean}) { return x; }`,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: []},
    });
    const pos = files['/typed.ts'].indexOf('x:');

    const full = proxy.getQuickInfoAtPosition('/typed.ts', pos);
    const truncated = proxy.getQuickInfoAtPosition('/typed.ts', pos, 10);

    const fullText = full.displayParts.map((p) => p.text).join('');
    const truncatedText = truncated.displayParts.map((p) => p.text).join('');
    assert.ok(truncatedText.length < fullText.length);
  });

  it('does not serve a stale inferred type after the underlying file changes and the project version bumps', () => {
    const files = {
      '/types.d.ts': AMBIENT_TYPES + 'declare function getInventory(): {quantity: number};\n',
      '/helper.js': `
        function helper(product) {
          return product.ID;
        }
        helper(getProduct());
        module.exports = {helper};
      `,
    };
    const versions = {'/types.d.ts': 0, '/helper.js': 0};
    let projectVersion = 1;
    const host = createFixtureHost(files);
    // createFixtureHost's getScriptVersion is a constant '0' — override it
    // here so this test can simulate a real edit bumping a file's version.
    host.getScriptVersion = (fileName) => String(versions[fileName] ?? 0);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => String(projectVersion),
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });
    const paramPos = files['/helper.js'].indexOf('product)'); // start of the `product` identifier

    const before = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const beforeText = (before?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(beforeText.includes('{ ID: string; name: string; }'));
    assert.ok(!beforeText.includes('quantity'));

    // Simulate an edit: add a second call site with a different argument
    // type, and bump both the file's script version and the project version
    // (as a real host would) so the cache can't keep serving the old answer.
    // Conflicting call sites must not keep serving the stale Product-shaped
    // inference — and must stay silent rather than union a noisy hover.
    files['/helper.js'] += '\nhelper(getInventory());\n';
    versions['/helper.js'] += 1;
    projectVersion += 1;

    const after = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const afterText = (after?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(!afterText.includes('Inferred from usage'), `expected silence after conflicting edit, got: ${afterText}`);
    assert.ok(!afterText.includes('{ ID: string; name: string; }'));
  });

  it('hovers and completes against the real, nullable dw.catalog.ProductMgr.getProduct() shape end-to-end', () => {
    // Regression test for the exact production bug this feature shipped
    // with: ProductMgr.getProduct() really does return `Product<any> | null`,
    // and getPropertiesOfType on that union (before stripping the nullable
    // part) returns zero members — completions silently fell back to plain
    // global suggestions while hover kept working, since describeTypes just
    // stringifies the union instead of walking its members.
    const files = {
      '/priceHelper.js': `
        function getDisplayName(product) {
          return product.getName();
        }
        function useHelper() {
          var ProductMgr = require('${REAL_DW_TYPES.ProductMgr}');
          var product = ProductMgr.getProduct('some-id');
          return getDisplayName(product);
        }
        module.exports = {getDisplayName};
      `,
    };
    const proxy = (() => {
      const {create} = init({typescript: ts});
      const host = createFixtureHost(files);
      const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
      return create({
        languageService,
        languageServiceHost: host,
        project: {
          projectService: {logger: {info: () => {}}},
          getCurrentDirectory: () => '/',
          getProjectVersion: () => '1',
        },
        config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
      });
    })();
    const paramPos = files['/priceHelper.js'].indexOf('product)');
    const dotPos = files['/priceHelper.js'].indexOf('product.getName()') + 'product.'.length;

    const hover = proxy.getQuickInfoAtPosition('/priceHelper.js', paramPos);
    const hoverText = (hover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(hoverText.includes('Inferred from usage'));
    assert.ok(/Product/.test(hoverText));

    const completions = proxy.getCompletionsAtPosition('/priceHelper.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(names.includes('getID'));
    assert.ok(names.includes('getName'));
  });

  it('offers inferred completions when the receiver is a chained call, not just a bare identifier', () => {
    // `product.getPriceModel().|` — the receiver is a CallExpression. The
    // completion wiring used to require a plain identifier base, so chains
    // got no synthesized entries even though hover-driven return inference
    // could resolve them.
    const files = {
      '/priceHelper.js': `
        function resolveProductPrice(product) {
          return product.getPriceModel().getPrice();
        }
        function useHelper() {
          var ProductMgr = require('${REAL_DW_TYPES.ProductMgr}');
          var product = ProductMgr.getProduct('some-id');
          return resolveProductPrice(product);
        }
        module.exports = {resolveProductPrice};
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });
    const dotPos = files['/priceHelper.js'].indexOf('.getPrice()') + 1;

    const completions = proxy.getCompletionsAtPosition('/priceHelper.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    // Real dw.catalog.ProductPriceModel members.
    assert.ok(names.includes('getPrice'), `expected getPrice among completions, got: ${names.join(', ')}`);
    assert.ok(names.includes('getMinPrice'), `expected getMinPrice among completions, got: ${names.join(', ')}`);

    // Methods and properties get distinct completion icons.
    const entryByName = new Map((completions?.entries ?? []).map((e) => [e.name, e]));
    assert.equal(entryByName.get('getPrice').kind, ts.ScriptElementKind.memberFunctionElement);
    assert.equal(entryByName.get('maxPrice').kind, ts.ScriptElementKind.memberVariableElement);
  });

  it('shows an inferred-usage hover note when hovering the member name of a property access, not just the bare receiver', () => {
    // Regression test: hovering `shipment` itself in `shipment.productLineItems`
    // worked (inferTypeForNode resolves a bare identifier's own declaration),
    // but hovering `productLineItems` — the member name — didn't, because
    // `productLineItems` has no declaration of its own to look up until the
    // receiver's type is known, and the hover handler only ever tried
    // inferTypeForNode on the exact hovered identifier. It now falls back to
    // resolving the whole access expression, the same way completions do.
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment'], ''),
      '/shippingHelpers.js': `
        function markShipmentForShipping(shipment) {
          shipment.custom.fromStoreId = null;
          var items = shipment.productLineItems;
        }
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });

    const source = files['/shippingHelpers.js'];
    const receiverPos = source.indexOf('shipment.productLineItems') + 1;
    const memberPos = source.indexOf('productLineItems', receiverPos) + 1;

    const receiverHover = proxy.getQuickInfoAtPosition('/shippingHelpers.js', receiverPos);
    const receiverDoc = (receiverHover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      receiverDoc.includes('Inferred from usage: Shipment'),
      `expected the receiver hover to infer Shipment, got: ${receiverDoc}`,
    );

    const memberHover = proxy.getQuickInfoAtPosition('/shippingHelpers.js', memberPos);
    const memberDoc = (memberHover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      memberDoc.includes('Inferred from usage: Collection<ProductLineItem>'),
      `expected the member-name hover to infer Collection<ProductLineItem>, got: ${memberDoc}`,
    );
  });

  it("hover borrows the real declaration's display parts and doc comment instead of just noting the inferred type", () => {
    // Regression test covering two things together:
    //  1. Hover should read like a native, fully-resolved hover — the bolded
    //     header should read "(parameter) shipment: Shipment" (not "... :
    //     any"), and the documentation should include Shipment's own real
    //     doc comment ("Represents an order shipment."), not just our bare
    //     "Inferred from usage: X" note.
    //  2. The vendored dw.* Script API nests each class's custom-attributes
    //     interface under the exact same simple name as the class itself
    //     (`declare global { module ICustomAttributes { interface Shipment
    //     extends CustomAttributes {} } }`, alongside the top-level `class
    //     Shipment`). Plain checker.typeToString() prints only the innermost
    //     name for both, so hovering `shipment.custom` used to show the
    //     misleading "Inferred from usage: Shipment" — identical to hovering
    //     `shipment` itself — instead of the real, distinct
    //     "ICustomAttributes.Shipment".
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment'], ''),
      '/shippingHelpers.js': `
        function markShipmentForShipping(shipment) {
          shipment.custom.fromStoreId = null;
          var items = shipment.productLineItems;
        }
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });

    const source = files['/shippingHelpers.js'];
    const paramPos = source.indexOf('markShipmentForShipping(shipment)') + 'markShipmentForShipping('.length;
    const memberPos = source.indexOf('shipment.custom') + 'shipment.'.length + 1;

    const paramHover = proxy.getQuickInfoAtPosition('/shippingHelpers.js', paramPos);
    const paramHeader = (paramHover?.displayParts ?? []).map((p) => p.text).join('');
    assert.equal(paramHeader, '(parameter) shipment: Shipment');
    const paramDoc = (paramHover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      paramDoc.includes('Represents an order shipment.'),
      `expected the class's own doc comment, got: ${paramDoc}`,
    );

    const memberHover = proxy.getQuickInfoAtPosition('/shippingHelpers.js', memberPos);
    const memberHeader = (memberHover?.displayParts ?? []).map((p) => p.text).join('');
    assert.equal(memberHeader, 'ICustomAttributes.Shipment');
    const memberDoc = (memberHover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      memberDoc.includes('Returns the custom attributes for this object'),
      `expected the property's own doc comment, got: ${memberDoc}`,
    );
    assert.ok(
      memberDoc.includes('Inferred from usage: ICustomAttributes.Shipment'),
      `expected the correctly-qualified type in the note, got: ${memberDoc}`,
    );
  });

  it('runs inference through the hover/completion gate for a weak `@param {Object}` placeholder', () => {
    // Regression test for the entry gate (isOpenForUsageInference): checkJs
    // resolves the ubiquitous SFRA `@param {Object}` placeholder to the global
    // `Object` interface — NOT `any` and NOT the lowercase `object`
    // non-primitive — so the gate used to reject the hover/completion before
    // inference ran, even though the rest of the engine already treats
    // `{Object}` JSDoc as a weak placeholder. The unit/corpus suites call
    // inferParameterType() directly and never exercised the gate, so this
    // only surfaced in the real VS Code host (and its integration suite).
    const files = {
      '/types.d.ts': realTypesPrelude(['Customer', 'Profile'], ''),
      '/accountHelpers.js': `
        /**
         * @param {Object} resettingCustomer
         */
        function sendPasswordResetEmail(resettingCustomer) {
          var last = resettingCustomer.profile.lastName;
          return resettingCustomer.profile.firstName + last;
        }
        module.exports = {sendPasswordResetEmail};
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });

    const source = files['/accountHelpers.js'];
    const paramPos = source.indexOf('sendPasswordResetEmail(resettingCustomer)') + 'sendPasswordResetEmail('.length;
    const dotPos = source.indexOf('resettingCustomer.profile') + 'resettingCustomer.'.length;

    const hover = proxy.getQuickInfoAtPosition('/accountHelpers.js', paramPos);
    const hoverText = (hover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      hoverText.includes('Inferred from usage: Customer'),
      `weak {Object} JSDoc must not close the gate; got: ${hoverText || '(no inferred note)'}`,
    );

    const completions = proxy.getCompletionsAtPosition('/accountHelpers.js', dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(
      names.includes('getProfile'),
      `expected Customer members after the {Object} receiver, got: ${names.join(', ')}`,
    );
  });

  it('offers completions for a dangling mid-edit `shipment.` immediately followed by more code on later lines', () => {
    // Regression test for a real dogfooding find: `.` never gets automatic
    // semicolon insertion (it always demands a following identifier), so a
    // dangling `shipment.` — the exact state while a developer is mid-typing,
    // before finishing the line — parses as ONE expression together with
    // whatever identifier comes next, however many lines later:
    // `shipment.\n\nTransaction.wrap(...)` becomes `shipment.Transaction.wrap(...)`.
    // Left unhandled, that phantom `Transaction` "member" would count as real
    // usage evidence for `shipment` (no dw.* class has it), poisoning the
    // match and silently producing zero completions for the very position
    // asking for them — even though `shipment` is used correctly (`.custom`,
    // `.productLineItems`) later in the same function.
    const files = {
      '/types.d.ts': realTypesPrelude(['Shipment'], ''),
      '/shippingHelpers.js': `
        function markShipmentForShipping(shipment) {
            var Transaction = require('dw/system/Transaction');

            shipment.

            Transaction.wrap(function () {
                shipment.custom.fromStoreId = null;
                var items = shipment.productLineItems;
            });
        }
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });

    const source = files['/shippingHelpers.js'];
    const dotPos = source.indexOf('shipment.\n') + 'shipment.'.length;

    const completions = proxy.getCompletionsAtPosition('/shippingHelpers.js', dotPos, undefined);
    const inferredNames = (completions?.entries ?? [])
      .filter((e) => e.source === INFERRED_COMPLETION_SOURCE)
      .map((e) => e.name);
    // "custom" itself is deduped out of the inferred set here because it's
    // also a plain word-completion (it appears as literal text elsewhere in
    // the fixture) — setShippingMethod isn't, so it's the reliable signal
    // that real Shipment members were actually synthesized.
    assert.ok(
      inferredNames.includes('setShippingMethod'),
      `expected real Shipment members despite the dangling dot, got: ${inferredNames.join(', ')}`,
    );
    assert.ok(inferredNames.includes('getUUID'), `expected getUUID, got: ${inferredNames.join(', ')}`);
    assert.ok(
      !inferredNames.includes('Transaction'),
      'the phantom merged "Transaction" member must not leak in as a synthesized (inferred-usage) entry',
    );
  });

  it('resolves module.superModule along the configured cartridge path for hover and completions', () => {
    // Two cartridge roots in path order (custom overrides base). The overlay
    // reaches its base module via module.superModule; the plugin must map
    // that to the same-subpath file in the next cartridge down and infer the
    // base module's export members.
    const files = {
      '/types.d.ts': AMBIENT_TYPES,
      '/base/cartridge/scripts/helpers/priceHelpers.js': `
        function getSalePrice(product) {
          return product.ID;
        }
        getSalePrice(getProduct());
        module.exports = {
          getSalePrice: getSalePrice
        };
      `,
      '/custom/cartridge/scripts/helpers/priceHelpers.js': `
        var base = module.superModule;
        function getMemberPrice(product) {
          var basePrice = base.getSalePrice(product);
          return basePrice;
        }
        module.exports = base;
        module.exports.getMemberPrice = getMemberPrice;
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
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
        autoDiscover: false,
        cartridges: [
          {name: 'custom', src: '/custom/'},
          {name: 'base', src: '/base/'},
        ],
        inferUsage: true,
      },
    });
    const overlaySource = files['/custom/cartridge/scripts/helpers/priceHelpers.js'];
    const overlayFile = '/custom/cartridge/scripts/helpers/priceHelpers.js';

    // Hover on `basePrice` — its value flows through superModule into the
    // base module's undocumented helper, which is only typed by its own
    // call site in the base cartridge.
    const hoverPos = overlaySource.indexOf('basePrice;');
    const hover = proxy.getQuickInfoAtPosition(overlayFile, hoverPos);
    const hoverText = (hover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      hoverText.includes('Inferred from usage: string'),
      `expected the base helper's inferred return type (string), got: ${hoverText}`,
    );

    // Completion after `base.` offers the base module's exported members.
    const dotPos = overlaySource.indexOf('base.getSalePrice') + 'base.'.length;
    const completions = proxy.getCompletionsAtPosition(overlayFile, dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(names.includes('getSalePrice'), `expected getSalePrice among completions, got: ${names.join(', ')}`);
  });

  it('types server.append middleware parameters contextually via the injected SFRA ambient declarations', () => {
    // No inference involved: with a `modules` cartridge configured the
    // plugin injects types/sfra/server.d.ts, whose typed
    // `append(name, ...middleware: Middleware[])` signature lets TypeScript
    // itself type `req`/`res`/`next` contextually. The plugin must inject
    // the ambient file and then stay out of the way.
    const files = {
      '/c/cartridge/controllers/Product.js': `
        var server = require('server');
        server.append('Show', function (req, res, next) {
          var qs = req.querystring;
          next();
        });
        module.exports = server.exports();
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
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
        autoDiscover: false,
        cartridges: [
          {name: 'c', src: '/c/'},
          {name: 'modules', src: '/modules/'},
        ],
        inferUsage: true,
      },
    });
    const source = files['/c/cartridge/controllers/Product.js'];
    const controllerFile = '/c/cartridge/controllers/Product.js';
    const reqParamPos = source.indexOf('req, res');

    const hover = proxy.getQuickInfoAtPosition(controllerFile, reqParamPos);
    const hoverText = [...(hover?.displayParts ?? []), ...(hover?.documentation ?? [])].map((p) => p.text).join('');
    assert.ok(/Request/.test(hoverText), `expected req to be typed as Request, got: ${hoverText}`);
    assert.ok(
      !hoverText.includes('Inferred from usage'),
      `req is contextually typed — inference must not decorate it: ${hoverText}`,
    );

    const dotPos = source.indexOf('req.querystring') + 'req.'.length;
    const completions = proxy.getCompletionsAtPosition(controllerFile, dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(
      names.includes('httpParameterMap'),
      `expected httpParameterMap among completions, got: ${names.join(', ')}`,
    );
    assert.ok(names.includes('geolocation'), `expected geolocation among completions, got: ${names.join(', ')}`);
  });

  it('resolves members across a multi-cartridge superModule stack, including intermediate augmentations', () => {
    const files = {
      '/types.d.ts': AMBIENT_TYPES,
      '/base/cartridge/scripts/helpers/priceHelpers.js': `
        function getSalePrice(product) {
          return product.ID;
        }
        getSalePrice(getProduct());
        module.exports = { getSalePrice: getSalePrice };
      `,
      '/mid/cartridge/scripts/helpers/priceHelpers.js': `
        var base = module.superModule;
        function getMemberPrice(product) {
          return 'member-price';
        }
        module.exports = base;
        module.exports.getMemberPrice = getMemberPrice;
      `,
      '/top/cartridge/scripts/helpers/priceHelpers.js': `
        var base = module.superModule;
        function getPromoPrice(product) {
          var memberPrice = base.getMemberPrice(product);
          return memberPrice;
        }
        module.exports = base;
        module.exports.getPromoPrice = getPromoPrice;
      `,
    };
    const host = createFixtureHost(files);
    const languageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const {create} = init({typescript: ts});
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
        autoDiscover: false,
        cartridges: [
          {name: 'top', src: '/top/'},
          {name: 'mid', src: '/mid/'},
          {name: 'base', src: '/base/'},
        ],
        inferUsage: true,
      },
    });
    const source = files['/top/cartridge/scripts/helpers/priceHelpers.js'];
    const topFile = '/top/cartridge/scripts/helpers/priceHelpers.js';

    // Hover on `memberPrice` — flows through a member augmented at the MID
    // level, invisible to any candidate type.
    const hoverPos = source.indexOf('memberPrice;');
    const hover = proxy.getQuickInfoAtPosition(topFile, hoverPos);
    const hoverText = (hover?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(
      hoverText.includes('Inferred from usage: string'),
      `expected string via mid augmentation, got: ${hoverText}`,
    );

    // Completion after `base.` offers both the deep base member and the
    // mid-level augmentation.
    const dotPos = source.indexOf('base.getMemberPrice') + 'base.'.length;
    const completions = proxy.getCompletionsAtPosition(topFile, dotPos, undefined);
    const names = (completions?.entries ?? []).map((e) => e.name);
    assert.ok(names.includes('getSalePrice'), `expected deep base member getSalePrice, got: ${names.join(', ')}`);
    assert.ok(names.includes('getMemberPrice'), `expected mid augmentation getMemberPrice, got: ${names.join(', ')}`);
  });

  it('lets a non-cancellation exception from the underlying call propagate instead of degrading it to an empty result', () => {
    // The `guarded` wrapper exists to protect tsserver from bugs in this
    // plugin's own inference additions — never to change how errors from the
    // real language service behave. Swallowing those would turn a genuine TS
    // crash into a silent "hover stopped working" for every file.
    const host = createFixtureHost(FIXTURE_FILES);
    const realLanguageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const languageService = new Proxy(realLanguageService, {
      get(target, prop) {
        if (prop === 'getQuickInfoAtPosition' || prop === 'getCompletionsAtPosition') {
          return () => {
            throw new Error('underlying language service failure');
          };
        }
        return target[prop];
      },
    });
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });

    assert.throws(() => proxy.getQuickInfoAtPosition('/helper.js', 0), /underlying language service failure/);
    assert.throws(
      () => proxy.getCompletionsAtPosition('/helper.js', 0, undefined),
      /underlying language service failure/,
    );
  });

  it('rethrows ts.OperationCanceledException from the underlying call instead of swallowing it as a failure', () => {
    // TS throws this cooperatively whenever the host's CancellationToken
    // fires (e.g. the user kept typing while this request was in flight) —
    // ordinary, frequent behavior that tsserver's request pipeline handles
    // very differently from a completed-but-empty response. A plugin
    // override that swallows it and returns undefined instead would
    // misreport "cancelled" as "resolved to nothing" on every fast edit.
    const host = createFixtureHost({
      '/helper.js': `
        function helper(product) { return product.ID; }
        helper(getProduct());
        module.exports = {helper};
      `,
    });
    const realLanguageService = ts.createLanguageService(host, sharedDocumentRegistry);
    const languageService = new Proxy(realLanguageService, {
      get(target, prop) {
        if (prop === 'getQuickInfoAtPosition' || prop === 'getCompletionsAtPosition') {
          return () => {
            throw new ts.OperationCanceledException();
          };
        }
        return target[prop];
      },
    });
    const {create} = init({typescript: ts});
    const proxy = create({
      languageService,
      languageServiceHost: host,
      project: {
        projectService: {logger: {info: () => {}}},
        getCurrentDirectory: () => '/',
        getProjectVersion: () => '1',
      },
      config: {enabled: true, autoDiscover: false, cartridges: CARTRIDGE_CONFIG, inferUsage: true},
    });

    assert.throws(() => proxy.getQuickInfoAtPosition('/helper.js', 0), ts.OperationCanceledException);
    assert.throws(() => proxy.getCompletionsAtPosition('/helper.js', 0, undefined), ts.OperationCanceledException);
  });
});
