/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';

import type tsserver from 'typescript/lib/tsserverlibrary';

import init from '../src/index';

const PROJECT = '/work/proj';
const CUSTOM = `${PROJECT}/cartridges/app_custom`;
const BASE = `${PROJECT}/cartridges/app_storefront_base`;
const MODULES = `${PROJECT}/cartridges/modules`;

/** Fake TypeScript whose ts.sys serves an in-memory tree; directories derive from file paths. */
function createFakeTypeScript(files: Record<string, string>) {
  const paths = Object.keys(files);
  return {
    Extension: {Dts: '.d.ts', Js: '.js', Json: '.json'},
    ScriptKind: {JS: 1, Unknown: 0},
    sys: {
      fileExists: (p: string) => Object.prototype.hasOwnProperty.call(files, p),
      readFile: (p: string) => files[p],
      getDirectories(dir: string) {
        const prefix = dir.endsWith('/') ? dir : dir + '/';
        const names = new Set<string>();
        for (const f of paths) {
          if (!f.startsWith(prefix)) continue;
          const rest = f.slice(prefix.length).split('/');
          if (rest.length > 1) names.add(rest[0]);
        }
        return [...names];
      },
      useCaseSensitiveFileNames: true,
    },
  } as unknown as typeof tsserver;
}

/** Boots the plugin with no cartridges pushed in, so it auto-discovers from PROJECT. */
function bootWithAutoDiscovery(files: Record<string, string>) {
  const logs: string[] = [];
  const host: Record<string, unknown> = {
    getScriptFileNames: () => [],
    resolveModuleNameLiterals: (literals: {text: string}[]) => literals.map(() => ({resolvedModule: undefined})),
  };
  const info = {
    config: {enabled: true},
    languageService: {},
    languageServiceHost: host,
    project: {
      getCurrentDirectory: () => PROJECT,
      projectService: {logger: {info: (m: string) => logs.push(m)}},
    },
  } as unknown as tsserver.server.PluginCreateInfo;

  init({typescript: createFakeTypeScript(files)}).create(info);

  const resolve = (moduleName: string, containingFile: string): string | undefined => {
    const fn = host.resolveModuleNameLiterals as (
      literals: {text: string}[],
      containingFile: string,
    ) => {resolvedModule?: {resolvedFileName: string}}[];
    return fn([{text: moduleName}], containingFile)[0].resolvedModule?.resolvedFileName;
  };
  return {logs, resolve};
}

describe('cartridge auto-discovery', () => {
  const files = {
    [`${CUSTOM}/.project`]: '',
    [`${CUSTOM}/cartridge/scripts/helpers/cartHelpers.js`]: '',
    [`${BASE}/.project`]: '',
    [`${BASE}/cartridge/scripts/helpers/cartHelpers.js`]: '',
    [`${BASE}/cartridge/controllers/Cart.js`]: '',
    [`${MODULES}/.project`]: '',
    [`${MODULES}/helpers/Money.js`]: '',
    [`${PROJECT}/node_modules/pkg/.project`]: '',
  };

  it('discovers cartridges on disk and resolves requires against them', () => {
    const {logs, resolve} = bootWithAutoDiscovery(files);

    expect(logs.some((m) => m.includes('auto-discovered 3 cartridge(s)'))).to.equal(true);
    expect(logs.some((m) => m.includes('auto-discovery failed'))).to.equal(false);
    expect(resolve('helpers/Money', `${BASE}/cartridge/controllers/Cart.js`)).to.equal(`${MODULES}/helpers/Money.js`);
  });

  it('resolves */ left to right along the cartridge path, even from a cartridge further right', () => {
    const {resolve} = bootWithAutoDiscovery(files);

    expect(resolve('*/cartridge/scripts/helpers/cartHelpers', `${BASE}/cartridge/controllers/Cart.js`)).to.equal(
      `${CUSTOM}/cartridge/scripts/helpers/cartHelpers.js`,
    );
  });

  it('orders by dw.json cartridges when present', () => {
    const {logs, resolve} = bootWithAutoDiscovery({
      ...files,
      [`${PROJECT}/dw.json`]: JSON.stringify({cartridges: 'app_storefront_base:app_custom:modules'}),
    });

    expect(logs.some((m) => m.includes('ordered by dw.json cartridges'))).to.equal(true);
    expect(resolve('*/cartridge/scripts/helpers/cartHelpers', `${BASE}/cartridge/controllers/Cart.js`)).to.equal(
      `${BASE}/cartridge/scripts/helpers/cartHelpers.js`,
    );
  });

  it('does not redirect SFRA ambient module names to the modules cartridge', () => {
    const {resolve} = bootWithAutoDiscovery({...files, [`${MODULES}/server.js`]: ''});

    expect(resolve('server', `${BASE}/cartridge/controllers/Cart.js`)).to.equal(undefined);
  });
});
