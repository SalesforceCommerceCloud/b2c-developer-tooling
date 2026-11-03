/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';

import type tsserver from 'typescript/lib/tsserverlibrary';

import init from '../src/index';

const PROJECT = '/proj';
const CORE = `${PROJECT}/cartridges/app_core`;
const CARTRIDGE_FILE = `${CORE}/cartridge/scripts/a.js`;
const EXTRA = '/storage/custom-attributes.d.ts';

function setup(files: string[], config: Record<string, unknown>) {
  const present = new Set(files);
  const fakeTs = {
    Extension: {Dts: '.d.ts', Js: '.js', Json: '.json'},
    ScriptKind: {JS: 1, Unknown: 0},
    sys: {
      fileExists: (p: string) => present.has(p) || p.endsWith('global.d.ts'),
      getDirectories: () => [],
      readFile: () => undefined,
      useCaseSensitiveFileNames: true,
    },
  } as unknown as typeof tsserver;

  const calls = {dirty: 0, refresh: 0};
  const host: Record<string, unknown> = {getScriptFileNames: () => [CARTRIDGE_FILE]};
  const info = {
    config: {cartridges: [{name: 'app_core', src: CORE}], enabled: true, ...config},
    languageService: {},
    languageServiceHost: host,
    project: {
      getCurrentDirectory: () => PROJECT,
      isClosed: () => false,
      markAsDirty: () => calls.dirty++,
      projectService: {logger: {info: () => {}}},
      refreshDiagnostics: () => calls.refresh++,
    },
  } as unknown as tsserver.server.PluginCreateInfo;

  const plugin = init({typescript: fakeTs});
  plugin.create(info);
  return {
    calls,
    fileNames: () => (host.getScriptFileNames as () => string[])(),
    plugin,
    present,
  };
}

describe('extraTypeFiles', () => {
  it('adds configured declaration files to projects with cartridge files', () => {
    const {fileNames} = setup([EXTRA], {extraTypeFiles: [EXTRA]});
    expect(fileNames()).to.include(EXTRA);
  });

  it('skips files that do not exist', () => {
    const {fileNames} = setup([], {extraTypeFiles: [EXTRA]});
    expect(fileNames()).to.not.include(EXTRA);
  });

  it('applies changes pushed after creation and refreshes projects', () => {
    const {calls, fileNames, plugin} = setup([EXTRA], {});
    expect(fileNames()).to.not.include(EXTRA);

    plugin.onConfigurationChanged({extraTypeFiles: [EXTRA]});
    expect(fileNames()).to.include(EXTRA);
    expect(calls.dirty).to.equal(1);
    expect(calls.refresh).to.equal(1);

    plugin.onConfigurationChanged({extraTypeFiles: []});
    expect(fileNames()).to.not.include(EXTRA);
  });

  it('keeps the previous list when a configuration omits the field', () => {
    const {fileNames, plugin} = setup([EXTRA], {extraTypeFiles: [EXTRA]});
    plugin.onConfigurationChanged({enabled: true});
    expect(fileNames()).to.include(EXTRA);
  });
});
