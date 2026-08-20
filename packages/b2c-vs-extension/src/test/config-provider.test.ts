/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from '../config-provider.js';

suite('B2CExtensionConfig workspace discovery', () => {
  let ambientEnvironment: NodeJS.ProcessEnv;
  let settingsRoot: string;

  setup(() => {
    settingsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-vscode-config-test-'));
    ambientEnvironment = {B2C_CONFIG_DIR: path.join(settingsRoot, 'settings')};
    fs.mkdirSync(path.join(ambientEnvironment.B2C_CONFIG_DIR!, 'b2c'), {recursive: true});
  });

  teardown(() => {
    fs.rmSync(settingsRoot, {recursive: true, force: true});
  });

  test('selects the expected project root for the open workspace shape', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders?.length, 'test workspace should be open');

    let expected = workspaceFolders[0].uri.fsPath;
    if (workspaceFolders[0].name === 'nested-workspace') {
      expected = path.join(expected, 'sfra');
    } else if (workspaceFolders[0].name === 'first-workspace-folder') {
      expected = path.join(expected, 'projects', 'sfra');
    }
    const log = vscode.window.createOutputChannel('B2C Config Discovery Test');
    const provider = new B2CExtensionConfig(log, undefined, ambientEnvironment);

    try {
      await provider.ensureResolved();
      assert.strictEqual(provider.getWorkingDirectory(), expected);
    } finally {
      provider.dispose();
      log.dispose();
    }
  });

  test('a pinned root overrides multi-root workspace ordering', async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length < 2) {
      this.skip();
      return;
    }

    const pinnedRoot = workspaceFolders[1].uri.fsPath;
    const workspaceState = {
      keys: () => ['b2c-dx.projectRoot'],
      get: (key: string) => (key === 'b2c-dx.projectRoot' ? pinnedRoot : undefined),
      update: async () => {},
    } as vscode.Memento;
    const log = vscode.window.createOutputChannel('B2C Config Pin Test');
    const provider = new B2CExtensionConfig(log, workspaceState, ambientEnvironment);

    try {
      await provider.ensureResolved();
      assert.strictEqual(provider.getWorkingDirectory(), pinnedRoot);
      assert.strictEqual(provider.isProjectRootPinned(), true);
    } finally {
      provider.dispose();
      log.dispose();
    }
  });

  test('honors SFCC_CONFIG (global dw.json path) over the workspace dw.json', async () => {
    // Regression: the extension previously ignored SFCC_CONFIG (a dw.json *path*,
    // as exposed by the CLI's --config flag) and only ever loaded a dw.json from
    // the workspace folder. A project relying on a global dw.json via SFCC_CONFIG
    // resolved to "No B2C Commerce instance configured".
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sfcc-config-'));
    const globalDwJson = path.join(dir, 'dw.json');
    fs.writeFileSync(globalDwJson, JSON.stringify({hostname: 'global-config.invalid', username: 'u', password: 'p'}));

    const log = vscode.window.createOutputChannel('B2C Config SFCC_CONFIG Test');
    const provider = new B2CExtensionConfig(log, undefined, {...ambientEnvironment, SFCC_CONFIG: globalDwJson});

    try {
      await provider.ensureResolved();
      const instance = provider.getInstance();
      assert.ok(instance, 'expected an instance resolved from SFCC_CONFIG');
      assert.strictEqual(
        instance.config.hostname,
        'global-config.invalid',
        JSON.stringify(provider.getConfig()?.sources),
      );
      assert.strictEqual(provider.getConfigError(), null);
    } finally {
      provider.dispose();
      log.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('loads all supported variables and relative SFCC_CONFIG from a selected project .env', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-project-env-'));
    fs.writeFileSync(
      path.join(dir, 'selected.dw.json'),
      JSON.stringify({hostname: 'file.invalid', username: 'file-user', password: 'file-password'}),
    );
    fs.writeFileSync(
      path.join(dir, '.env'),
      'SFCC_CONFIG=./selected.dw.json\nSFCC_SERVER=project-env.invalid\nSFCC_CODE_VERSION=env-version\nB2C_TEST_PROJECT_ONLY_VARIABLE=available\n',
    );
    const log = vscode.window.createOutputChannel('B2C Config Project Environment Test');
    const provider = new B2CExtensionConfig(log, undefined, ambientEnvironment);

    try {
      const config = await provider.resolveForDirectory(dir);
      assert.strictEqual(config.values.hostname, 'project-env.invalid');
      assert.strictEqual(config.values.codeVersion, 'env-version');
      assert.ok(
        config.sources.some(
          (source) => source.name === 'DwJsonSource' && source.location === path.join(dir, 'selected.dw.json'),
        ),
        JSON.stringify(config.sources),
      );
      assert.strictEqual(
        process.env.B2C_TEST_PROJECT_ONLY_VARIABLE,
        undefined,
        'project variables must remain scoped to the project',
      );
    } finally {
      provider.dispose();
      log.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('uses the shared global default when the selected project has no dw.json', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-global-default-'));
    const projectDirectory = path.join(dir, 'project');
    const globalConfigPath = path.join(dir, 'shared.dw.json');
    fs.mkdirSync(projectDirectory);
    fs.writeFileSync(globalConfigPath, JSON.stringify({hostname: 'shared-default.invalid'}));
    const environment: NodeJS.ProcessEnv = {...ambientEnvironment, SFCC_CONFIG: undefined};
    const settingsDirectory = path.join(environment.B2C_CONFIG_DIR!, 'b2c');
    fs.mkdirSync(settingsDirectory, {recursive: true});
    fs.writeFileSync(
      path.join(settingsDirectory, 'settings.json'),
      JSON.stringify({defaultConfigPath: globalConfigPath}),
    );
    const log = vscode.window.createOutputChannel('B2C Config Global Default Test');
    const provider = new B2CExtensionConfig(log, undefined, environment);

    try {
      const config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.hostname, 'shared-default.invalid');
    } finally {
      provider.dispose();
      log.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});
