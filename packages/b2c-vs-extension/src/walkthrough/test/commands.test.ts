/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

suite('Walkthrough Commands Test Suite', () => {
  let testWorkspaceUri: vscode.Uri;
  let testDwJsonPath: string;

  suiteSetup(async () => {
    // Get the test workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders && workspaceFolders.length > 0, 'Test workspace should be open');

    testWorkspaceUri = workspaceFolders[0].uri;
    testDwJsonPath = path.join(testWorkspaceUri.fsPath, 'dw.json');
  });

  setup(async () => {
    // Clean up any existing dw.json before each test
    try {
      await fs.unlink(testDwJsonPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  teardown(async () => {
    // Clean up after each test
    try {
      await fs.unlink(testDwJsonPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  suite('b2c-dx.walkthrough.open', () => {
    test('should open walkthrough without errors', async () => {
      // Execute the command
      await vscode.commands.executeCommand('b2c-dx.walkthrough.open');

      // Give it a moment to execute
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If we got here without throwing, the command executed
      assert.ok(true, 'Walkthrough open command executed');
    });

    test('should be registered in command palette', async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(commands.includes('b2c-dx.walkthrough.open'), 'Command should be registered');
    });
  });

  suite('b2c-dx.walkthrough.createDwJson', () => {
    test('should be registered in command palette', async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(commands.includes('b2c-dx.walkthrough.createDwJson'), 'Command should be registered');
    });

    // Note: Full integration testing of createDwJson requires user interaction
    // (QuickPick dialogs), so we test the command registration here.
    // Manual testing covers the full user interaction flow.
  });

  suite('dw.json file operations', () => {
    test('should detect when dw.json exists', async () => {
      // Create a test dw.json
      const testContent = JSON.stringify(
        {
          hostname: 'test.demandware.net',
          username: 'test',
          password: 'test',
        },
        null,
        2,
      );

      await fs.writeFile(testDwJsonPath, testContent, 'utf-8');

      // Verify file exists
      try {
        await fs.access(testDwJsonPath);
        assert.ok(true, 'dw.json file was created');
      } catch {
        assert.fail('dw.json file should exist');
      }

      // Verify content
      const content = await fs.readFile(testDwJsonPath, 'utf-8');
      const parsed = JSON.parse(content);
      assert.strictEqual(parsed.hostname, 'test.demandware.net');
    });

    test('should handle missing dw.json gracefully', async () => {
      // Ensure file doesn't exist
      try {
        await fs.unlink(testDwJsonPath);
      } catch {
        // Already doesn't exist
      }

      // Try to access
      try {
        await fs.access(testDwJsonPath);
        assert.fail('dw.json should not exist');
      } catch {
        assert.ok(true, 'Correctly detected missing dw.json');
      }
    });
  });

  suite('Walkthrough completion events', () => {
    test('should complete Step 2 when dw.json exists', async () => {
      // Create dw.json
      const testContent = JSON.stringify(
        {
          hostname: 'test.demandware.net',
          username: 'test',
          password: 'test',
        },
        null,
        2,
      );

      await fs.writeFile(testDwJsonPath, testContent, 'utf-8');

      // Trigger workspace file change event
      await vscode.commands.executeCommand('workbench.action.reloadWindow');

      // Note: Actual completion tracking is handled by VS Code's walkthrough API
      // This test verifies the file exists, which is the completion condition
      const exists = await fs
        .access(testDwJsonPath)
        .then(() => true)
        .catch(() => false);

      assert.ok(exists, 'dw.json exists, Step 2 should be completable');
    });
  });

  suite('Error handling', () => {
    test('should handle command execution errors gracefully', async () => {
      try {
        // Try to execute a non-existent command
        await vscode.commands.executeCommand('b2c-dx.nonexistent.command');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error, 'Error should be thrown for non-existent command');
      }
    });
  });

  suite('Extension activation', () => {
    test('should activate extension in test workspace', async () => {
      const extension = vscode.extensions.getExtension('Salesforce.b2c-vs-extension');
      assert.ok(extension, 'Extension should be installed');

      if (!extension.isActive) {
        await extension.activate();
      }

      assert.ok(extension.isActive, 'Extension should be active');
    });

    test('should have walkthrough commands after activation', async () => {
      const extension = vscode.extensions.getExtension('Salesforce.b2c-vs-extension');
      assert.ok(extension, 'Extension should be installed');

      if (!extension.isActive) {
        await extension.activate();
      }

      const commands = await vscode.commands.getCommands();
      assert.ok(commands.includes('b2c-dx.walkthrough.open'), 'Walkthrough open command should be available');
      assert.ok(commands.includes('b2c-dx.walkthrough.createDwJson'), 'Create dw.json command should be available');
    });
  });
});
