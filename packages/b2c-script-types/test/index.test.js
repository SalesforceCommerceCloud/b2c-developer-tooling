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
});
