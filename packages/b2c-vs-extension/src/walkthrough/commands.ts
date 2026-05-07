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
  // Command: Open the getting started walkthrough.
  // The new onboarding panel replaces the built-in walkthrough surface; we
  // redirect this legacy command to keep existing menu entries working.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.open', async () => {
      try {
        await vscode.commands.executeCommand('b2c-dx.onboarding.open');
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

  // Command: Pick a credential storage path (Keychain / Password Store /
  // existing / dw.json). Guides the user toward secure storage by default
  // but treats it as optional — dw.json remains a first-class choice.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.chooseCredentialStorage', async () => {
      await chooseCredentialStorage();
    }),
  );
}

interface CredentialChoice extends vscode.QuickPickItem {
  id: 'have-it' | 'macos-keychain' | 'password-store' | 'dw-json';
}

async function chooseCredentialStorage(): Promise<void> {
  const isMac = process.platform === 'darwin';
  const items: CredentialChoice[] = [
    {
      id: 'have-it',
      label: '$(check) I already have credentials stored',
      description: 'Skip — keychain, pass, env vars, or existing dw.json',
      detail: "Mark this step done and move on. Use this if you've already configured the B2C CLI.",
    },
    {
      id: 'macos-keychain',
      label: `$(key) Set up macOS Keychain${isMac ? '' : ' (macOS only)'}`,
      description: 'Recommended on Mac — secrets in OS Keychain',
      detail: 'Installs sfcc-solutions-share/b2c-plugin-macos-keychain. Stores secrets via the macOS `security` tool.',
    },
    {
      id: 'password-store',
      label: '$(lock) Set up Password Store (pass)',
      description: 'Cross-platform — GPG-encrypted via the Unix `pass` tool',
      detail: 'Installs sfcc-solutions-share/b2c-plugin-password-store. Works on macOS, Linux, and WSL.',
    },
    {
      id: 'dw-json',
      label: '$(file) Create a dw.json file',
      description: 'Simple — credentials live in a workspace file',
      detail: 'Quick to set up. Be sure to add dw.json to .gitignore so secrets are never committed.',
    },
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title: 'Configure your B2C instance',
    placeHolder: 'How do you want to store your B2C Commerce credentials?',
    ignoreFocusOut: true,
  });

  if (!picked) return;

  switch (picked.id) {
    case 'have-it':
      vscode.window.showInformationMessage(
        'B2C DX: Skipping credential setup. Run "B2C DX: B2C Instance Config" any time to inspect the resolved config.',
      );
      return;
    case 'dw-json':
      await createDwJsonTemplate();
      return;
    case 'macos-keychain':
      await setupKeychainPlugin();
      return;
    case 'password-store':
      await setupPasswordStorePlugin();
      return;
  }
}

async function setupKeychainPlugin(): Promise<void> {
  if (process.platform !== 'darwin') {
    const action = await vscode.window.showWarningMessage(
      'The macOS Keychain plugin only works on macOS. Use Password Store on Linux/WSL.',
      'Use Password Store instead',
      'Cancel',
    );
    if (action === 'Use Password Store instead') {
      await setupPasswordStorePlugin();
    }
    return;
  }

  const installCmd = 'b2c plugins install sfcc-solutions-share/b2c-plugin-macos-keychain';
  const storeGlobalSnippet =
    `security add-generic-password -s 'b2c-cli' -a '*' \\\n` +
    `  -w '{"clientId":"YOUR_CLIENT_ID","clientSecret":"YOUR_CLIENT_SECRET","defaultInstance":"dev"}' -U`;
  const storeInstanceSnippet =
    `security add-generic-password -s 'b2c-cli' -a 'dev' \\\n` +
    `  -w '{"username":"you@example.com","password":"YOUR_WEBDAV_KEY"}' -U`;

  const choice = await vscode.window.showInformationMessage(
    'Set up the macOS Keychain plugin? This installs the B2C CLI plugin and prepares the keychain commands you can run next.',
    {modal: true},
    'Run install in terminal',
    'Copy install command',
    'Cancel',
  );

  if (!choice || choice === 'Cancel') return;

  if (choice === 'Run install in terminal') {
    const term = vscode.window.createTerminal({name: 'B2C DX — Keychain setup'});
    term.show();
    term.sendText(installCmd, false);
  } else {
    await vscode.env.clipboard.writeText(installCmd);
    vscode.window.showInformationMessage('Install command copied to clipboard.');
  }

  const next = await vscode.window.showInformationMessage(
    'Plugin installed? Copy a starter keychain entry next.',
    'Copy global OAuth snippet',
    'Copy instance snippet',
    'Done',
  );
  if (next === 'Copy global OAuth snippet') {
    await vscode.env.clipboard.writeText(storeGlobalSnippet);
    vscode.window.showInformationMessage(
      'Global keychain command copied. Replace YOUR_CLIENT_ID/SECRET, then run it in a terminal.',
    );
  } else if (next === 'Copy instance snippet') {
    await vscode.env.clipboard.writeText(storeInstanceSnippet);
    vscode.window.showInformationMessage(
      'Instance keychain command copied. Replace the placeholders, then run it in a terminal.',
    );
  }
}

async function setupPasswordStorePlugin(): Promise<void> {
  const installCmd = 'b2c plugins install sfcc-solutions-share/b2c-plugin-password-store';
  const initSnippet = `pass init "your-gpg-key-id"`;
  const storeSnippet =
    `pass insert -m b2c-cli/_default <<'EOF'\n` +
    `your-shared-secret\n` +
    `clientId: YOUR_CLIENT_ID\n` +
    `clientSecret: YOUR_CLIENT_SECRET\n` +
    `defaultInstance: dev\n` +
    `EOF`;

  const choice = await vscode.window.showInformationMessage(
    'Set up the Password Store plugin? This installs the B2C CLI plugin and prepares pass commands.',
    {modal: true},
    'Run install in terminal',
    'Copy install command',
    'Cancel',
  );
  if (!choice || choice === 'Cancel') return;

  if (choice === 'Run install in terminal') {
    const term = vscode.window.createTerminal({name: 'B2C DX — pass setup'});
    term.show();
    term.sendText(installCmd, false);
  } else {
    await vscode.env.clipboard.writeText(installCmd);
    vscode.window.showInformationMessage('Install command copied to clipboard.');
  }

  const next = await vscode.window.showInformationMessage(
    'Plugin installed? Copy a starter pass entry next (requires GPG + `pass` initialised).',
    'Copy `pass init` example',
    'Copy `pass insert` snippet',
    'Done',
  );
  if (next === 'Copy `pass init` example') {
    await vscode.env.clipboard.writeText(initSnippet);
    vscode.window.showInformationMessage('`pass init` example copied. Run it once with your GPG key.');
  } else if (next === 'Copy `pass insert` snippet') {
    await vscode.env.clipboard.writeText(storeSnippet);
    vscode.window.showInformationMessage('`pass insert` snippet copied. Replace placeholders, then run it.');
  }
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
    const content = JSON.stringify(template, null, 2);
    await fs.writeFile(dwJsonPath, content, 'utf-8');
    await openFile(dwJsonPath);

    const action = await vscode.window.showInformationMessage(
      'dw.json created. Update it with your B2C Commerce credentials.',
      'Add to .gitignore',
      'Dismiss',
    );
    if (action === 'Add to .gitignore') {
      await addToGitignore(workspaceFolder.uri.fsPath);
    }
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
 * Open the native VS Code walkthrough automatically on first activation, but
 * only when no dw.json exists in the workspace — i.e. the user hasn't set the
 * extension up yet. Users can re-open it any time via "B2C DX: Open Getting
 * Started Guide", and the role-based deep-dive panel via "B2C DX: Open
 * Onboarding Panel".
 */
export async function showWalkthroughOnFirstActivation(context: vscode.ExtensionContext): Promise<void> {
  const SEEN_KEY = 'b2c-dx.gettingStarted.autoOpened';
  if (context.globalState.get<boolean>(SEEN_KEY, false)) return;
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return;

  // Skip auto-open when the workspace already has a dw.json — the user is
  // returning, not starting fresh.
  for (const folder of folders) {
    try {
      await fs.access(path.join(folder.uri.fsPath, 'dw.json'));
      await context.globalState.update(SEEN_KEY, true);
      return;
    } catch {
      // not present here, keep checking
    }
  }

  setTimeout(() => {
    void vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      'Salesforce.b2c-vs-extension#b2c-dx.gettingStarted',
      false,
    );
    void context.globalState.update(SEEN_KEY, true);
  }, 1000);
}
