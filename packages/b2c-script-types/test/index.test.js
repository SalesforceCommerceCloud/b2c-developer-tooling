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
const {createFixtureHost} = require('./helpers/fixture-language-service');
const {REAL_DW_TYPES} = require('./helpers/real-dw-types');

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
  const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
    const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
    const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
    files['/helper.js'] += '\nhelper(getInventory());\n';
    versions['/helper.js'] += 1;
    projectVersion += 1;

    const after = proxy.getQuickInfoAtPosition('/helper.js', paramPos);
    const afterText = (after?.documentation ?? []).map((p) => p.text).join('');
    assert.ok(afterText.includes('quantity'));
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
      const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
    const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
    const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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

  it('lets a non-cancellation exception from the underlying call propagate instead of degrading it to an empty result', () => {
    // The `guarded` wrapper exists to protect tsserver from bugs in this
    // plugin's own inference additions — never to change how errors from the
    // real language service behave. Swallowing those would turn a genuine TS
    // crash into a silent "hover stopped working" for every file.
    const host = createFixtureHost(FIXTURE_FILES);
    const realLanguageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
    const realLanguageService = ts.createLanguageService(host, ts.createDocumentRegistry());
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
