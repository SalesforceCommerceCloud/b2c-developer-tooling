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
    const provider = new B2CExtensionConfig(log);

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
    const provider = new B2CExtensionConfig(log, workspaceState);

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

    const previous = process.env.SFCC_CONFIG;
    process.env.SFCC_CONFIG = globalDwJson;

    const log = vscode.window.createOutputChannel('B2C Config SFCC_CONFIG Test');
    const provider = new B2CExtensionConfig(log);

    try {
      await provider.ensureResolved();
      const instance = provider.getInstance();
      assert.ok(instance, 'expected an instance resolved from SFCC_CONFIG');
      assert.strictEqual(instance.config.hostname, 'global-config.invalid');
      assert.strictEqual(provider.getConfigError(), null);
    } finally {
      provider.dispose();
      log.dispose();
      if (previous === undefined) {
        delete process.env.SFCC_CONFIG;
      } else {
        process.env.SFCC_CONFIG = previous;
      }
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});
