/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
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
});
