/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Template for a basic dw.json configuration file.
 * Users should replace placeholder values with their actual credentials.
 */
const DW_JSON_TEMPLATE = {
  hostname: 'your-sandbox-name.demandware.net',
  username: 'your-username',
  password: 'your-password',
  version: 'v1',
  // Optional OAuth credentials for advanced features
  // Uncomment and fill in to enable Sandbox Management and API Browser
  // clientId: 'your-client-id',
  // clientSecret: 'your-client-secret',
  // shortCode: 'your-short-code',
};

/**
 * Template for dw.json with multiple instances configuration
 */
const DW_JSON_MULTI_INSTANCE_TEMPLATE = {
  instances: [
    {
      name: 'dev',
      hostname: 'dev-sandbox.demandware.net',
      username: 'your-username',
      password: 'your-password',
      // Optional OAuth credentials
      // clientId: 'your-client-id',
      // clientSecret: 'your-client-secret',
      // shortCode: 'your-short-code',
    },
    {
      name: 'staging',
      hostname: 'staging-sandbox.demandware.net',
      username: 'your-username',
      password: 'your-password',
    },
  ],
};

/**
 * Register walkthrough-related commands.
 * These commands support the getting started walkthrough experience.
 */
export function registerWalkthroughCommands(context: vscode.ExtensionContext): void {
  // Command: Open the getting started walkthrough
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.open', async () => {
      try {
        await vscode.commands.executeCommand(
          'workbench.action.openWalkthrough',
          'Salesforce.b2c-vs-extension#b2c-dx.gettingStarted',
          false,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to open walkthrough: ${message}`);
      }
    }),
  );

  // Command: Create dw.json template file
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.createDwJson', async () => {
      await createDwJsonTemplate();
    }),
  );
}

/**
 * Creates a dw.json template file in the workspace root.
 * Prompts user for configuration type and handles existing file scenarios.
 */
async function createDwJsonTemplate(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open. Please open a folder first, then try again.');
    return;
  }

  const dwJsonPath = path.join(workspaceFolder.uri.fsPath, 'dw.json');

  // Check if dw.json already exists
  const fileExists = await checkFileExists(dwJsonPath);

  if (fileExists) {
    const action = await vscode.window.showWarningMessage(
      'dw.json already exists in this workspace.',
      'Open Existing',
      'Overwrite',
      'Cancel',
    );

    if (action === 'Cancel' || !action) {
      return;
    }

    if (action === 'Open Existing') {
      await openFile(dwJsonPath);
      return;
    }

    // User chose "Overwrite", continue with creation
  }

  // Ask user which template they want
  const templateType = await vscode.window.showQuickPick(
    [
      {
        label: 'Single Instance',
        description: 'Basic configuration with one B2C instance',
        detail: 'Recommended for most users',
        value: 'single',
      },
      {
        label: 'Multiple Instances',
        description: 'Configuration with multiple B2C instances',
        detail: 'Use if you need to switch between dev, staging, etc.',
        value: 'multi',
      },
    ],
    {
      title: 'Select dw.json Template',
      placeHolder: 'Choose a configuration template',
    },
  );

  if (!templateType) {
    return; // User cancelled
  }

  // Select template based on user choice
  const template = templateType.value === 'multi' ? DW_JSON_MULTI_INSTANCE_TEMPLATE : DW_JSON_TEMPLATE;

  try {
    // Write the template file
    const content = JSON.stringify(template, null, 2);
    await fs.writeFile(dwJsonPath, content, 'utf-8');

    // Show success message
    vscode.window
      .showInformationMessage(
        '✅ dw.json created! Update it with your B2C Commerce credentials.',
        'Open File',
        'Add to .gitignore',
      )
      .then(async (action) => {
        if (action === 'Open File') {
          await openFile(dwJsonPath);
        } else if (action === 'Add to .gitignore') {
          await addToGitignore(workspaceFolder.uri.fsPath);
        }
      });

    // Automatically open the file for editing
    await openFile(dwJsonPath);

    // Show helpful info message
    vscode.window.showInformationMessage('💡 Tip: Add dw.json to .gitignore to avoid committing credentials');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to create dw.json: ${message}`);
  }
}

/**
 * Opens a file in the editor.
 */
async function openFile(filePath: string): Promise<void> {
  try {
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: vscode.ViewColumn.One,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to open file: ${message}`);
  }
}

/**
 * Checks if a file exists.
 */
async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Adds dw.json to .gitignore file.
 * Creates .gitignore if it doesn't exist.
 */
async function addToGitignore(workspaceRoot: string): Promise<void> {
  const gitignorePath = path.join(workspaceRoot, '.gitignore');

  try {
    let gitignoreContent = '';

    // Read existing .gitignore if it exists
    const gitignoreExists = await checkFileExists(gitignorePath);
    if (gitignoreExists) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');

      // Check if dw.json is already in .gitignore
      if (gitignoreContent.includes('dw.json')) {
        vscode.window.showInformationMessage('dw.json is already in .gitignore');
        return;
      }
    }

    // Add dw.json to .gitignore
    const newContent = gitignoreContent.trim()
      ? `${gitignoreContent}\n\n# B2C Commerce credentials\ndw.json\n`
      : `# B2C Commerce credentials\ndw.json\n`;

    await fs.writeFile(gitignorePath, newContent, 'utf-8');

    vscode.window.showInformationMessage('✅ Added dw.json to .gitignore');

    // Ask if user wants to open .gitignore
    const action = await vscode.window.showInformationMessage('Would you like to view .gitignore?', 'Yes', 'No');

    if (action === 'Yes') {
      await openFile(gitignorePath);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to update .gitignore: ${message}`);
  }
}

/**
 * Show the walkthrough on first activation if user hasn't seen it yet.
 * Call this from the main activate() function.
 */
export async function showWalkthroughOnFirstActivation(context: vscode.ExtensionContext): Promise<void> {
  const WALKTHROUGH_SEEN_KEY = 'b2c-dx.walkthroughSeen';
  const hasSeenWalkthrough = context.globalState.get<boolean>(WALKTHROUGH_SEEN_KEY, false);

  if (!hasSeenWalkthrough && vscode.workspace.workspaceFolders) {
    // Small delay to ensure extension is fully activated
    setTimeout(async () => {
      const action = await vscode.window.showInformationMessage(
        '👋 Welcome to B2C Commerce Development! Would you like to see the getting started guide?',
        'Yes',
        'Not Now',
        "Don't Show Again",
      );

      if (action === 'Yes') {
        await vscode.commands.executeCommand('b2c-dx.walkthrough.open');
        await context.globalState.update(WALKTHROUGH_SEEN_KEY, true);
      } else if (action === "Don't Show Again") {
        await context.globalState.update(WALKTHROUGH_SEEN_KEY, true);
      }
      // "Not Now" doesn't update state, so prompt will show again next time
    }, 2000);
  }
}
