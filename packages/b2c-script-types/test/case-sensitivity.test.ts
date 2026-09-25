/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';

import type tsserver from 'typescript/lib/tsserverlibrary';

import init from '../src/index';

// A project on a case-sensitive volume, with mixed-case path segments that a
// naive toLowerCase() would destroy.
const PROJECT = '/Volumes/CaseSensitive/Proj';
const CORE = `${PROJECT}/cartridges/app_Core`;
const BASE = `${PROJECT}/cartridges/app_Base`;
const MODULES = `${PROJECT}/cartridges/modules`;

/**
 * A filesystem that only answers to exact-case paths — i.e. what ts.sys sees
 * when the project lives on a case-sensitive volume. `useCaseSensitiveFileNames`
 * is reported as false because that is derived from wherever TypeScript itself
 * is installed (for VS Code / Cursor, the case-insensitive system volume), not
 * from where the project lives.
 */
function createFakeTypeScript(files: string[]) {
  const present = new Set(files);
  return {
    Extension: {Dts: '.d.ts', Js: '.js', Json: '.json'},
    ScriptKind: {JS: 1, Unknown: 0},
    sys: {
      fileExists: (p: string) => present.has(p),
      getDirectories: () => [],
      readFile: () => undefined,
      useCaseSensitiveFileNames: false,
    },
  } as unknown as typeof tsserver;
}

interface ResolveResult {
  resolvedModule?: {resolvedFileName: string};
}

/**
 * Boot the plugin against a stub language service host and hand back its
 * patched module resolver.
 */
function createResolver(fakeTs: typeof tsserver, cartridges: {name: string; src: string}[]) {
  const host: Record<string, unknown> = {
    getScriptFileNames: () => [],
    resolveModuleNameLiterals: (literals: {text: string}[]) => literals.map(() => ({resolvedModule: undefined})),
  };

  const info = {
    config: {cartridges, enabled: true},
    languageService: {},
    languageServiceHost: host,
    project: {
      getCurrentDirectory: () => PROJECT,
      projectService: {logger: {info: () => {}}},
    },
  } as unknown as tsserver.server.PluginCreateInfo;

  init({typescript: fakeTs}).create(info);

  return (moduleName: string, containingFile: string): string | undefined => {
    const resolve = host.resolveModuleNameLiterals as (
      literals: {text: string}[],
      containingFile: string,
      ...rest: unknown[]
    ) => ResolveResult[];
    const [result] = resolve([{text: moduleName}], containingFile);
    return result.resolvedModule?.resolvedFileName;
  };
}

describe('cartridge resolution on case-sensitive volumes', () => {
  it('resolves a named-cartridge require to the exact-case path', () => {
    const target = `${CORE}/cartridge/scripts/util/Helper.js`;
    const resolve = createResolver(createFakeTypeScript([target]), [{name: 'app_Core', src: CORE}]);

    expect(resolve('app_Core/cartridge/scripts/util/Helper', `${CORE}/cartridge/scripts/Caller.js`)).to.equal(target);
  });

  it('resolves a */cartridge require to the exact-case path', () => {
    const target = `${CORE}/cartridge/scripts/util/Helper.js`;
    const resolve = createResolver(createFakeTypeScript([target]), [{name: 'app_Core', src: CORE}]);

    expect(resolve('*/cartridge/scripts/util/Helper', `${CORE}/cartridge/scripts/Caller.js`)).to.equal(target);
  });

  it('resolves a ~/cartridge require to the exact-case path', () => {
    const target = `${CORE}/cartridge/scripts/util/Helper.js`;
    const resolve = createResolver(createFakeTypeScript([target]), [{name: 'app_Core', src: CORE}]);

    expect(resolve('~/cartridge/scripts/util/Helper', `${CORE}/cartridge/scripts/Caller.js`)).to.equal(target);
  });

  it('resolves a bare require against the modules cartridge using the exact-case path', () => {
    // 'server' and friends are covered by the bundled ambient declarations and
    // deliberately not redirected, so exercise a different module name.
    const target = `${MODULES}/helpers/Money.js`;
    const resolve = createResolver(createFakeTypeScript([target]), [
      {name: 'app_Core', src: CORE},
      {name: 'modules', src: MODULES},
    ]);

    expect(resolve('helpers/Money', `${CORE}/cartridge/scripts/Caller.js`)).to.equal(target);
  });

  // The cartridge root is deliberately case-folded for *matching* so that a
  // differently-cased containing file is still recognised as cartridge code.
  // Only the filesystem probe uses the original case.
  it('still recognises cartridge files whose path case differs from the configured root', () => {
    const coreTarget = `${CORE}/cartridge/scripts/util/Helper.js`;
    const baseTarget = `${BASE}/cartridge/scripts/util/Helper.js`;
    const resolve = createResolver(createFakeTypeScript([coreTarget, baseTarget]), [
      {name: 'app_Base', src: BASE},
      {name: 'app_Core', src: CORE},
    ]);

    // Owner-first ordering requires matching the lowercased containing file
    // against the cartridge roots, so this must still land on app_Core.
    const containingFile = `${CORE.toLowerCase()}/cartridge/scripts/Caller.js`;
    expect(resolve('*/cartridge/scripts/util/Helper', containingFile)).to.equal(coreTarget);
  });

  it('leaves non-cartridge module names alone', () => {
    const resolve = createResolver(createFakeTypeScript([]), [{name: 'app_Core', src: CORE}]);

    expect(resolve('lodash', `${CORE}/cartridge/scripts/Caller.js`)).to.equal(undefined);
  });
});
