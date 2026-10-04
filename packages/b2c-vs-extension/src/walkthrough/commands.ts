/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import {workspaceHasDwJson} from '../workspace-discovery.js';

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

  // Command: Credential-storage wizard. Field-level placement: non-secret
  // connection fields go to dw.json, secret pairs are placed independently
  // (Keychain / pass / env / dw.json) per Credential Grouping.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.chooseCredentialStorage', async () => {
      await chooseCredentialStorage(context);
    }),
  );

  // Per-step setup commands. Each one prompts only for the fields its step
  // is responsible for; non-secret fields all go into the same `dw.json`
  // configs[] entry (named once during the connection step and reused for
  // the rest of the session). Secret pairs are placed independently per
  // pair, exactly like the all-at-once wizard.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.setup.connection', async () => {
      await runConnectionStep(context);
    }),
    vscode.commands.registerCommand('b2c-dx.setup.oauth', async () => {
      await runOAuthStep(context);
    }),
    vscode.commands.registerCommand('b2c-dx.setup.webdav', async () => {
      await runWebDavStep(context);
    }),
    vscode.commands.registerCommand('b2c-dx.setup.scapi', async () => {
      await runScapiStep(context);
    }),
    vscode.commands.registerCommand('b2c-dx.setup.resetSession', async () => {
      await resetSetupSession(context);
    }),
  );
}

// ─── Credential-storage wizard ─────────────────────────
//
// Walks the user through the documented placement model:
//  • Non-secret connection fields  → dw.json (single source of truth)
//  • Secret pairs (OAuth, Basic)   → Keychain / pass / env / dw.json (chosen
//                                    independently per pair, per Credential
//                                    Grouping rule).
//  • SCAPI-only fields             → dw.json
//  • MRT credentials               → ~/.mobify (managed by `b2c mrt
//                                    save-credentials`); MRT_API_KEY env var.
//
// The flow asks pair-by-pair so a user can mix sources (OAuth in Keychain,
// WebDAV in dw.json) — the docs explicitly support this.

type SecretPlacement = 'macos-keychain' | 'password-store' | 'env' | 'dw-json';

interface PlacementChoice extends vscode.QuickPickItem {
  id: SecretPlacement;
}

interface FlowChoice extends vscode.QuickPickItem {
  id: 'oauth' | 'basic' | 'scapi' | 'mrt' | 'inspect' | 'done';
}

interface ConnectionConfig {
  instanceName: string;
  hostname: string;
  codeVersion?: string;
  shortCode?: string;
  tenantId?: string;
  oauthScopes?: string;
  mrtProject?: string;
  mrtEnvironment?: string;
}

interface ConfigPlan {
  connection: ConnectionConfig;
  oauthPlacement?: SecretPlacement;
  basicPlacement?: SecretPlacement;
  mrtPlacement?: SecretPlacement;
  enableSCAPI: boolean;
  // Captured during the wizard so the apply phase can write them straight
  // into the chosen target. Kept in-memory for the duration of the wizard
  // call only; never persisted.
  oauthClientId?: string;
  oauthClientSecret?: string;
  basicUsername?: string;
  basicPassword?: string;
  mrtApiKey?: string;
}

/** Wrap showInputBox for the wizard's value-collection prompts. Returns
 *  `undefined` only if the user cancels (Esc); empty string is accepted so
 *  optional fields can be skipped without breaking flow. */
async function secretInput(opts: {
  title: string;
  prompt: string;
  placeholder?: string;
  password?: boolean;
}): Promise<string | undefined> {
  const v = await vscode.window.showInputBox({
    title: opts.title,
    prompt: opts.prompt,
    placeHolder: opts.placeholder,
    password: opts.password ?? false,
    ignoreFocusOut: true,
  });
  return v;
}

function defaultSecretPlacement(): SecretPlacement {
  if (process.env.SFCC_CI === '1' || process.env.CI === 'true') return 'env';
  if (process.platform === 'darwin') return 'macos-keychain';
  return 'password-store';
}

function placementItems(currentDefault: SecretPlacement): PlacementChoice[] {
  const isMac = process.platform === 'darwin';
  const items: PlacementChoice[] = [
    {
      id: 'macos-keychain',
      label: `$(key) macOS Keychain${isMac ? '' : ' (macOS only)'}`,
      description: 'Encrypted in the OS Keychain',
      detail:
        'Uses the documented b2c-plugin-macos-keychain. Secrets live in the OS Keychain; ' +
        'never written to disk in plaintext.',
    },
    {
      id: 'password-store',
      label: '$(lock) Password Store (pass)',
      description: 'GPG-encrypted via the Unix `pass` tool',
      detail: 'Cross-platform (macOS / Linux / WSL). Uses the documented b2c-plugin-password-store.',
    },
    {
      id: 'env',
      label: '$(symbol-variable) Environment variables',
      description: 'SFCC_* env vars — best for CI / shared machines',
      detail: 'Highest precedence in the resolution chain. Nothing written to disk.',
    },
    {
      id: 'dw-json',
      label: '$(file) dw.json (in workspace)',
      description: 'Plaintext in your workspace — personal sandboxes only',
      detail: 'Quickest. Only safe for personal sandboxes. Always added to .gitignore.',
    },
  ];
  // Mark the platform default with "(recommended)" so it's visibly preselected.
  const def = items.find((i) => i.id === currentDefault);
  if (def) {
    def.label = def.label.replace(/^(\$\([^)]+\)\s*)/, '$1') + ' · recommended';
    def.picked = true;
  }
  return items;
}

async function chooseCredentialStorage(context: vscode.ExtensionContext): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a folder first — the wizard writes dw.json into your workspace root.');
    return;
  }

  // Pick the instance name. Defaults to "dev"; user can override.
  const instanceName = await vscode.window.showInputBox({
    title: 'Configure your B2C instance — 1 of 4',
    prompt: 'Name this instance (used as the configs[] entry name in dw.json)',
    placeHolder: 'dev',
    value: 'dev',
    ignoreFocusOut: true,
    validateInput: (v) => (/^[A-Za-z0-9_-]+$/.test(v) ? null : 'Letters, digits, dash, underscore only'),
  });
  if (!instanceName) return;

  const hostname = await vscode.window.showInputBox({
    title: 'Configure your B2C instance — 2 of 4 · Connection',
    prompt: 'Instance hostname (no https://)',
    placeHolder: 'abcd-123.dx.commercecloud.salesforce.com',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim().length > 0 ? null : 'Required'),
  });
  if (!hostname) return;

  const codeVersion = await vscode.window.showInputBox({
    title: 'Configure your B2C instance — 2 of 4 · Connection (optional)',
    prompt: 'Default code version targeted by deploys (optional)',
    placeHolder: 'version1',
    ignoreFocusOut: true,
  });

  // Pick which auth flows to wire up.
  const flowsItems: FlowChoice[] = [
    {
      id: 'oauth',
      label: '$(shield) OAuth client credentials',
      description: 'client-id + client-secret — Sandbox Explorer, OCAPI / SCAPI, jobs',
      picked: true,
    },
    {
      id: 'basic',
      label: '$(person) Basic auth (WebDAV)',
      description: 'username + password — cartridge deploys, WebDAV browser',
      picked: true,
    },
    {
      id: 'scapi',
      label: '$(symbol-interface) SCAPI extras',
      description: 'short-code + tenant-id + scopes — required by API Browser',
    },
    {
      id: 'mrt',
      label: '$(rocket) MRT (Managed Runtime)',
      description: 'mrtProject + mrtEnvironment + MRT_API_KEY',
    },
  ];
  const flows = await vscode.window.showQuickPick(flowsItems, {
    title: 'Configure your B2C instance — 3 of 4 · Auth flows',
    placeHolder: 'Pick the flows you actually use (you can re-run later to add more)',
    canPickMany: true,
    ignoreFocusOut: true,
  });
  if (!flows) return;

  const connection: ConnectionConfig = {instanceName, hostname, codeVersion: codeVersion || undefined};
  const plan: ConfigPlan = {connection, enableSCAPI: false};

  // SCAPI extras
  if (flows.some((f) => f.id === 'scapi')) {
    plan.enableSCAPI = true;
    connection.shortCode =
      (await vscode.window.showInputBox({
        title: 'SCAPI · short-code',
        prompt: 'Your organisation short code (from Account Manager)',
        placeHolder: 'kv7kzm78',
        ignoreFocusOut: true,
      })) || undefined;
    connection.tenantId =
      (await vscode.window.showInputBox({
        title: 'SCAPI · tenant-id',
        prompt: 'Your tenant ID (e.g. zzrf_001)',
        placeHolder: 'zzrf_001',
        ignoreFocusOut: true,
      })) || undefined;
    connection.oauthScopes =
      (await vscode.window.showInputBox({
        title: 'SCAPI · oauth scopes (optional)',
        prompt: 'Space-separated SCAPI scopes',
        placeHolder: 'sfcc.shopper-customers sfcc.shopper-products',
        ignoreFocusOut: true,
      })) || undefined;
  }

  // MRT non-secret fields
  if (flows.some((f) => f.id === 'mrt')) {
    connection.mrtProject =
      (await vscode.window.showInputBox({
        title: 'MRT · project slug',
        prompt: 'mrtProject — your MRT project slug',
        ignoreFocusOut: true,
      })) || undefined;
    connection.mrtEnvironment =
      (await vscode.window.showInputBox({
        title: 'MRT · environment slug',
        prompt: 'mrtEnvironment — your MRT environment slug',
        ignoreFocusOut: true,
      })) || undefined;
  }

  // Step 4: per-pair placement.
  const def = defaultSecretPlacement();

  if (flows.some((f) => f.id === 'oauth')) {
    const picked = await vscode.window.showQuickPick(placementItems(def), {
      title: 'Configure your B2C instance — 4 of 4 · Where should OAuth secrets live?',
      placeHolder: 'client-id and client-secret stay together (Credential Grouping rule).',
      ignoreFocusOut: true,
    });
    if (!picked) return;
    plan.oauthPlacement = picked.id;
    plan.oauthClientId = await secretInput({
      title: 'OAuth · client-id',
      prompt: 'Paste your client-id (visible — it is an identifier, not a secret).',
      placeholder: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    if (plan.oauthClientId === undefined) return;
    plan.oauthClientSecret = await secretInput({
      title: 'OAuth · client-secret',
      prompt: 'Paste your client-secret (input is masked).',
      placeholder: '••••••••••••••••••••',
      password: true,
    });
    if (plan.oauthClientSecret === undefined) return;
  }

  if (flows.some((f) => f.id === 'basic')) {
    const picked = await vscode.window.showQuickPick(placementItems(def), {
      title: 'Configure your B2C instance — 4 of 4 · Where should WebDAV credentials live?',
      placeHolder: 'username and password stay together (Credential Grouping rule).',
      ignoreFocusOut: true,
    });
    if (!picked) return;
    plan.basicPlacement = picked.id;
    plan.basicUsername = await secretInput({
      title: 'Basic · username',
      prompt: 'Your Business Manager username.',
      placeholder: 'you@example.com',
    });
    if (plan.basicUsername === undefined) return;
    plan.basicPassword = await secretInput({
      title: 'Basic · WebDAV access key (password)',
      prompt: 'Paste your WebDAV access key (input is masked).',
      placeholder: '••••••••••••••••••••',
      password: true,
    });
    if (plan.basicPassword === undefined) return;
  }

  if (flows.some((f) => f.id === 'mrt')) {
    // MRT_API_KEY pairing model: same chooser, but Keychain/pass shown as "via b2c mrt save-credentials".
    const picked = await vscode.window.showQuickPick(placementItems(def), {
      title: 'Configure your B2C instance — 4 of 4 · Where should the MRT API key live?',
      placeHolder: 'The CLI manages ~/.mobify automatically when you pick Keychain or pass.',
      ignoreFocusOut: true,
    });
    if (!picked) return;
    plan.mrtPlacement = picked.id;
    if (picked.id !== 'dw-json') {
      plan.mrtApiKey = await secretInput({
        title: 'MRT · API key',
        prompt: 'Paste your MRT_API_KEY (input is masked).',
        placeholder: '••••••••••••••••••••',
        password: true,
      });
      if (plan.mrtApiKey === undefined) return;
    }
  }

  await applyConfigPlan(context, plan);
}

async function applyConfigPlan(context: vscode.ExtensionContext, plan: ConfigPlan): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders![0];
  const dwJsonPath = path.join(wsFolder.uri.fsPath, 'dw.json');

  // Build the dw.json entry: only non-secret fields go here, except where the
  // user explicitly chose dw-json placement for a pair.
  const entry: Record<string, unknown> = {
    name: plan.connection.instanceName,
    active: true,
    hostname: plan.connection.hostname,
  };
  if (plan.connection.codeVersion) entry['code-version'] = plan.connection.codeVersion;
  if (plan.enableSCAPI) {
    if (plan.connection.shortCode) entry['short-code'] = plan.connection.shortCode;
    if (plan.connection.tenantId) entry['tenant-id'] = plan.connection.tenantId;
    if (plan.connection.oauthScopes) entry['oauth-scopes'] = plan.connection.oauthScopes;
  }
  if (plan.connection.mrtProject) entry.mrtProject = plan.connection.mrtProject;
  if (plan.connection.mrtEnvironment) entry.mrtEnvironment = plan.connection.mrtEnvironment;

  // Merge into existing dw.json's configs[], or create new file with this entry.
  let existing: {configs?: Record<string, unknown>[]; [key: string]: unknown} = {};
  if (await checkFileExists(dwJsonPath)) {
    try {
      existing = JSON.parse(await fs.readFile(dwJsonPath, 'utf-8'));
    } catch {
      // Malformed dw.json — leave alone, ask user.
      const action = await vscode.window.showWarningMessage(
        'dw.json exists but is not valid JSON. Open it for manual fix?',
        'Open',
        'Cancel',
      );
      if (action === 'Open') await openFile(dwJsonPath);
      return;
    }
  }
  if (!Array.isArray(existing.configs)) existing.configs = [];
  // Replace any same-named entry; otherwise append.
  const idx = existing.configs.findIndex((c) => c && (c as {name?: string}).name === entry.name);
  if (idx >= 0) existing.configs[idx] = entry;
  else existing.configs.push(entry);
  // Ensure single active.
  for (const c of existing.configs) {
    if (c && (c as {name?: string}).name !== entry.name) (c as {active?: boolean}).active = false;
  }

  // Inline OAuth/basic into dw.json only when explicitly chosen.
  if (plan.oauthPlacement === 'dw-json') {
    if (plan.oauthClientId) entry['client-id'] = plan.oauthClientId;
    if (plan.oauthClientSecret) entry['client-secret'] = plan.oauthClientSecret;
  }
  if (plan.basicPlacement === 'dw-json') {
    if (plan.basicUsername) entry.username = plan.basicUsername;
    if (plan.basicPassword) entry.password = plan.basicPassword;
  }

  await fs.writeFile(dwJsonPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  await openFile(dwJsonPath);
  await ensureGitIgnoreEntry(wsFolder.uri.fsPath, 'dw.json');

  // Apply secrets to the chosen storage. Each placement is fired internally
  // where it can be done safely (Keychain via execFile; env var export
  // queued in a terminal because it must run in the user's shell).
  const inst = plan.connection.instanceName;
  const report: string[] = [];
  const errors: string[] = [];
  const pluginsToInstall = new Set<string>();

  if (plan.oauthPlacement === 'macos-keychain') pluginsToInstall.add('macos-keychain');
  if (plan.basicPlacement === 'macos-keychain') pluginsToInstall.add('macos-keychain');
  if (plan.oauthPlacement === 'password-store') pluginsToInstall.add('password-store');
  if (plan.basicPlacement === 'password-store') pluginsToInstall.add('password-store');

  // Plugin installs queue a single terminal command per plugin.
  const terminalLines: string[] = [];
  for (const p of pluginsToInstall) {
    if (p === 'macos-keychain') {
      terminalLines.push('b2c plugins install sfcc-solutions-share/b2c-plugin-macos-keychain');
    } else if (p === 'password-store') {
      terminalLines.push('b2c plugins install sfcc-solutions-share/b2c-plugin-password-store');
    }
  }

  // OAuth pair
  if (plan.oauthPlacement === 'macos-keychain' && plan.oauthClientId && plan.oauthClientSecret) {
    try {
      await writeKeychainPair(inst, {
        clientId: plan.oauthClientId,
        clientSecret: plan.oauthClientSecret,
      });
      report.push(`Keychain: b2c-cli/${inst} (clientId, clientSecret) ✓`);
    } catch (e) {
      errors.push(`Keychain (OAuth): ${e instanceof Error ? e.message : String(e)}`);
    }
  } else if (plan.oauthPlacement === 'password-store' && plan.oauthClientId && plan.oauthClientSecret) {
    terminalLines.push(
      `pass insert -m b2c-cli/${inst}-oauth <<'EOF'`,
      plan.oauthClientSecret,
      `clientId: ${plan.oauthClientId}`,
      `clientSecret: ${plan.oauthClientSecret}`,
      `EOF`,
    );
    report.push(`Password Store: b2c-cli/${inst}-oauth (queued in terminal)`);
  } else if (plan.oauthPlacement === 'env' && plan.oauthClientId && plan.oauthClientSecret) {
    terminalLines.push(
      `export SFCC_CLIENT_ID=${shellEscape(plan.oauthClientId)}`,
      `export SFCC_CLIENT_SECRET=${shellEscape(plan.oauthClientSecret)}`,
    );
    report.push('Env vars: SFCC_CLIENT_ID, SFCC_CLIENT_SECRET (queued in terminal)');
  } else if (plan.oauthPlacement === 'dw-json') {
    report.push('dw.json: client-id, client-secret ✓');
  }

  // Basic pair
  if (plan.basicPlacement === 'macos-keychain' && plan.basicUsername && plan.basicPassword) {
    try {
      await writeKeychainPair(`${inst}-basic`, {
        username: plan.basicUsername,
        password: plan.basicPassword,
      });
      report.push(`Keychain: b2c-cli/${inst}-basic (username, password) ✓`);
    } catch (e) {
      errors.push(`Keychain (Basic): ${e instanceof Error ? e.message : String(e)}`);
    }
  } else if (plan.basicPlacement === 'password-store' && plan.basicUsername && plan.basicPassword) {
    terminalLines.push(
      `pass insert -m b2c-cli/${inst}-basic <<'EOF'`,
      plan.basicPassword,
      `username: ${plan.basicUsername}`,
      `password: ${plan.basicPassword}`,
      `EOF`,
    );
    report.push(`Password Store: b2c-cli/${inst}-basic (queued in terminal)`);
  } else if (plan.basicPlacement === 'env' && plan.basicUsername && plan.basicPassword) {
    terminalLines.push(
      `export SFCC_USERNAME=${shellEscape(plan.basicUsername)}`,
      `export SFCC_PASSWORD=${shellEscape(plan.basicPassword)}`,
    );
    report.push('Env vars: SFCC_USERNAME, SFCC_PASSWORD (queued in terminal)');
  } else if (plan.basicPlacement === 'dw-json') {
    report.push('dw.json: username, password ✓');
  }

  // MRT API key
  if (plan.mrtPlacement === 'env' && plan.mrtApiKey) {
    terminalLines.push(`export MRT_API_KEY=${shellEscape(plan.mrtApiKey)}`);
    report.push('Env vars: MRT_API_KEY (queued in terminal)');
  } else if ((plan.mrtPlacement === 'macos-keychain' || plan.mrtPlacement === 'password-store') && plan.mrtApiKey) {
    // MRT credentials live in ~/.mobify; the CLI manages that path.
    terminalLines.push(`b2c mrt save-credentials  # paste MRT_API_KEY when prompted`);
    report.push('MRT: ~/.mobify (run `b2c mrt save-credentials` from the queued terminal)');
  } else if (plan.mrtPlacement === 'dw-json') {
    vscode.window.showWarningMessage(
      'MRT_API_KEY cannot live in dw.json. Use env vars or `b2c mrt save-credentials` instead.',
    );
  }

  // Persist chosen placement for next-run defaults.
  await context.globalState.update('b2c-dx.lastSecretPlacement', plan.oauthPlacement ?? plan.basicPlacement);

  // Surface results.
  if (terminalLines.length > 0) {
    const term = vscode.window.createTerminal({name: `B2C DX — ${inst} setup`});
    term.show();
    term.sendText('# Review each line and press Enter to run.', false);
    for (const l of terminalLines) term.sendText(l, false);
  }

  const summary = report.length > 0 ? report.map((l) => `  • ${l}`).join('\n') : '  (none)';
  const errSummary = errors.length > 0 ? '\n\nErrors:\n' + errors.map((e) => `  • ${e}`).join('\n') : '';
  const action = await vscode.window.showInformationMessage(
    `B2C DX: ${inst} configured.\n\nApplied:\n${summary}${errSummary}`,
    {modal: true},
    'Inspect resolved config',
    'Done',
  );
  if (action === 'Inspect resolved config') {
    await vscode.commands.executeCommand('b2c-dx.instance.inspect');
  }
}

/** POSIX shell-escape: wrap in single quotes, escape any embedded ones. */
function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Write a `<key>: <value>` JSON blob into the macOS Keychain under
 *  service `b2c-cli`, account `<account>`. Uses `security add-generic-password`
 *  via execFile so we can pass arguments as an array (no shell injection
 *  risk from secret content). The `-U` flag updates if the entry exists. */
async function writeKeychainPair(account: string, fields: Record<string, string>): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('Keychain integration is macOS-only.');
  }
  const blob = JSON.stringify(fields);
  await new Promise<void>((resolve, reject) => {
    cp.execFile(
      'security',
      ['add-generic-password', '-s', 'b2c-cli', '-a', account, '-w', blob, '-U'],
      {timeout: 5000},
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

async function ensureGitIgnoreEntry(workspaceRoot: string, entry: string): Promise<void> {
  const giPath = path.join(workspaceRoot, '.gitignore');
  let body = '';
  if (await checkFileExists(giPath)) {
    body = await fs.readFile(giPath, 'utf-8');
    if (body.split(/\r?\n/).some((l) => l.trim() === entry)) return;
    body = body.trimEnd() + '\n\n# B2C Commerce credentials\n' + entry + '\n';
  } else {
    body = `# B2C Commerce credentials\n${entry}\n`;
  }
  await fs.writeFile(giPath, body, 'utf-8');
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
 * Defensive per-workspace cleanup of onboarding session state. Runs on every
 * activation: if the current workspace has no dw.json, treat it as a fresh
 * onboarding context — drop any stale `setup.activeInstance` (which would
 * otherwise leak the previous workspace's instance name into chips/tooltips)
 * and clear the auto-opened seen flag so the deep-dive panel triggers again.
 *
 * The OnboardingStateStore itself uses workspaceState and resets naturally
 * per workspace; this function only mops up loose keys that aren't covered.
 */
export async function resetWorkspaceOnboardingIfFresh(context: vscode.ExtensionContext): Promise<void> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 0) return;
  if (await workspaceHasDwJson()) return;
  await context.workspaceState.update('b2c-dx.setup.activeInstance', undefined);
  await context.workspaceState.update('b2c-dx.gettingStarted.autoOpened', undefined);
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupSessionActive', false);
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupInstance', undefined);
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
  // Per-workspace flag: each workspace gets its own first-run experience.
  if (context.workspaceState.get<boolean>(SEEN_KEY, false)) return;
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return;

  // Skip auto-open when the workspace already has a dw.json — the user is
  // returning, not starting fresh.
  if (await workspaceHasDwJson()) {
    await context.workspaceState.update(SEEN_KEY, true);
    return;
  }

  setTimeout(() => {
    void vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      'Salesforce.b2c-vs-extension#b2c-dx.gettingStarted',
      false,
    );
    void context.workspaceState.update(SEEN_KEY, true);
  }, 1000);
}

// ─── Per-step setup commands + session ──────────────────
//
// The single-shot wizard above asks everything in one go. Per the docs flow
// the user sees, we also expose four step-bound commands that each prompt
// only for the fields their step owns — and reuse the active instance name
// once the connection step has set it for the workspace.

const SETUP_INSTANCE_KEY = 'b2c-dx.setup.activeInstance';

interface SetupSession {
  instanceName: string;
}

/** Read the active session for this workspace. */
function getSetupSession(context: vscode.ExtensionContext): SetupSession | undefined {
  const name = context.workspaceState.get<string>(SETUP_INSTANCE_KEY);
  return name ? {instanceName: name} : undefined;
}

async function setSetupSession(context: vscode.ExtensionContext, instanceName: string): Promise<void> {
  await context.workspaceState.update(SETUP_INSTANCE_KEY, instanceName);
  // Publish a context key so welcome views / panels can react.
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupSessionActive', true);
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupInstance', instanceName);
}

async function clearSetupSession(context: vscode.ExtensionContext): Promise<void> {
  await context.workspaceState.update(SETUP_INSTANCE_KEY, undefined);
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupSessionActive', false);
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupInstance', undefined);
}

async function resetSetupSession(context: vscode.ExtensionContext): Promise<void> {
  const session = getSetupSession(context);
  const choice = await vscode.window.showWarningMessage(
    session
      ? `Reset the setup session? The "${session.instanceName}" entry stays in dw.json — only the in-memory pointer is cleared, so the next setup step will ask for an instance name again.`
      : 'No active setup session to reset.',
    {modal: true},
    'Reset',
    'Cancel',
  );
  if (choice === 'Reset') {
    await clearSetupSession(context);
    vscode.window.showInformationMessage(
      'B2C DX: Setup session cleared. Run "Connect to Your B2C Instance" to start over.',
    );
  }
}

/** Resolve the active instance, prompting only when no session exists yet. */
async function ensureInstanceName(context: vscode.ExtensionContext): Promise<string | undefined> {
  const existing = getSetupSession(context);
  if (existing) return existing.instanceName;
  const name = await vscode.window.showInputBox({
    title: 'Connect to Your B2C Instance',
    prompt: 'Name this instance (becomes the configs[] entry in dw.json)',
    placeHolder: 'dev',
    value: 'dev',
    ignoreFocusOut: true,
    validateInput: (v) => (/^[A-Za-z0-9_-]+$/.test(v) ? null : 'Letters, digits, dash, underscore only'),
  });
  if (!name) return undefined;
  await setSetupSession(context, name);
  return name;
}

/**
 * Read dw.json and return the name of the currently active config (or, if no
 * entry is flagged active, the sole config when only one exists). Returns
 * undefined if dw.json is missing, malformed, or has no usable entry.
 */
async function readActiveInstanceName(workspaceRoot: string): Promise<string | undefined> {
  const dwJsonPath = path.join(workspaceRoot, 'dw.json');
  if (!(await checkFileExists(dwJsonPath))) return undefined;
  try {
    const doc = JSON.parse(await fs.readFile(dwJsonPath, 'utf-8')) as {
      configs?: {name?: string; active?: boolean}[];
    };
    const configs = Array.isArray(doc.configs) ? doc.configs : [];
    const active = configs.find((c) => c?.active === true && typeof c.name === 'string');
    if (active?.name) return active.name;
    // Fall back to the only entry when there's exactly one — it's implicitly active.
    if (configs.length === 1 && typeof configs[0]?.name === 'string') return configs[0].name;
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the instance name for follow-on setup steps (OAuth, WebDAV, SCAPI).
 * These edit an existing config rather than creating one, so they should
 * target the currently *active* entry in dw.json — not the workspace session,
 * which can drift after the user activates a different instance externally.
 *
 * Order of preference:
 *   1. Active config in dw.json (the canonical source of truth)
 *   2. Workspace session (set by the Connection step)
 *   3. Prompt the user (same UX as ensureInstanceName)
 *
 * Whenever we resolve from dw.json or by prompt, we sync the workspace session
 * so the panel chip and inspect-resolved-config reflect the same target.
 */
async function ensureActiveInstanceName(
  context: vscode.ExtensionContext,
  workspaceRoot: string,
): Promise<string | undefined> {
  const activeName = await readActiveInstanceName(workspaceRoot);
  if (activeName) {
    const session = getSetupSession(context);
    if (session?.instanceName !== activeName) {
      await setSetupSession(context, activeName);
    }
    return activeName;
  }
  return ensureInstanceName(context);
}

/** Read the workspace dw.json and return its `configs[]` entry for `name`,
 *  creating one (with `active: true`) if absent. Caller is responsible for
 *  writing the result back. */
async function readOrCreateConfigEntry(
  workspaceRoot: string,
  name: string,
): Promise<{
  doc: {configs?: Record<string, unknown>[]; [key: string]: unknown};
  entry: Record<string, unknown>;
}> {
  const dwJsonPath = path.join(workspaceRoot, 'dw.json');
  let doc: {configs?: Record<string, unknown>[]; [key: string]: unknown} = {};
  if (await checkFileExists(dwJsonPath)) {
    try {
      doc = JSON.parse(await fs.readFile(dwJsonPath, 'utf-8'));
    } catch {
      // Malformed — surface and bail to caller.
      throw new Error('dw.json exists but is not valid JSON. Open it for manual fix.');
    }
  }
  if (!Array.isArray(doc.configs)) doc.configs = [];
  let entry = doc.configs.find((c) => c && (c as {name?: string}).name === name) as Record<string, unknown> | undefined;
  if (!entry) {
    entry = {name, active: true};
    doc.configs.push(entry);
    // Ensure single active.
    for (const c of doc.configs) {
      if (c && (c as {name?: string}).name !== name) (c as {active?: boolean}).active = false;
    }
  }
  return {doc, entry};
}

async function writeConfigDoc(workspaceRoot: string, doc: unknown): Promise<void> {
  const dwJsonPath = path.join(workspaceRoot, 'dw.json');
  await fs.writeFile(dwJsonPath, JSON.stringify(doc, null, 2) + '\n', 'utf-8');
  await ensureGitIgnoreEntry(workspaceRoot, 'dw.json');
}

/** "Inspect resolved config" follow-up — surfaced after every step apply. */
async function offerInspectFollowUp(message: string): Promise<void> {
  const action = await vscode.window.showInformationMessage(message, 'Inspect resolved config', 'Done');
  if (action === 'Inspect resolved config') {
    await vscode.commands.executeCommand('b2c-dx.instance.inspect');
  }
}

/** Reusable secret-placement → apply helper for an OAuth or Basic pair. */
async function applySecretPair(
  inst: string,
  pair: 'oauth' | 'basic',
  placement: SecretPlacement,
  values: Record<string, string>,
  workspaceRoot: string,
): Promise<{report: string[]; errors: string[]; terminalLines: string[]}> {
  const report: string[] = [];
  const errors: string[] = [];
  const terminalLines: string[] = [];

  const writeDwJsonInline = async (fields: Record<string, string>) => {
    const {doc, entry} = await readOrCreateConfigEntry(workspaceRoot, inst);
    Object.assign(entry, fields);
    await writeConfigDoc(workspaceRoot, doc);
  };

  if (pair === 'oauth') {
    const {clientId, clientSecret} = values;
    if (placement === 'macos-keychain') {
      try {
        await writeKeychainPair(inst, {clientId, clientSecret});
        report.push(`Keychain: b2c-cli/${inst} (clientId, clientSecret) ✓`);
      } catch (e) {
        errors.push(`Keychain (OAuth): ${e instanceof Error ? e.message : String(e)}`);
      }
    } else if (placement === 'password-store') {
      terminalLines.push(
        `b2c plugins install sfcc-solutions-share/b2c-plugin-password-store`,
        `pass insert -m b2c-cli/${inst}-oauth <<'EOF'`,
        clientSecret,
        `clientId: ${clientId}`,
        `clientSecret: ${clientSecret}`,
        `EOF`,
      );
      report.push(`Password Store: b2c-cli/${inst}-oauth (queued in terminal)`);
    } else if (placement === 'env') {
      terminalLines.push(
        `export SFCC_CLIENT_ID=${shellEscape(clientId)}`,
        `export SFCC_CLIENT_SECRET=${shellEscape(clientSecret)}`,
      );
      report.push('Env vars: SFCC_CLIENT_ID, SFCC_CLIENT_SECRET (queued in terminal)');
    } else if (placement === 'dw-json') {
      await writeDwJsonInline({'client-id': clientId, 'client-secret': clientSecret});
      report.push('dw.json: client-id, client-secret ✓');
    }
  } else if (pair === 'basic') {
    const {username, password} = values;
    if (placement === 'macos-keychain') {
      try {
        await writeKeychainPair(`${inst}-basic`, {username, password});
        report.push(`Keychain: b2c-cli/${inst}-basic (username, password) ✓`);
      } catch (e) {
        errors.push(`Keychain (Basic): ${e instanceof Error ? e.message : String(e)}`);
      }
    } else if (placement === 'password-store') {
      terminalLines.push(
        `b2c plugins install sfcc-solutions-share/b2c-plugin-password-store`,
        `pass insert -m b2c-cli/${inst}-basic <<'EOF'`,
        password,
        `username: ${username}`,
        `password: ${password}`,
        `EOF`,
      );
      report.push(`Password Store: b2c-cli/${inst}-basic (queued in terminal)`);
    } else if (placement === 'env') {
      terminalLines.push(
        `export SFCC_USERNAME=${shellEscape(username)}`,
        `export SFCC_PASSWORD=${shellEscape(password)}`,
      );
      report.push('Env vars: SFCC_USERNAME, SFCC_PASSWORD (queued in terminal)');
    } else if (placement === 'dw-json') {
      await writeDwJsonInline({username, password});
      report.push('dw.json: username, password ✓');
    }
  }
  return {report, errors, terminalLines};
}

function flushTerminal(inst: string, lines: string[]): void {
  if (!lines.length) return;
  const term = vscode.window.createTerminal({name: `B2C DX — ${inst} setup`});
  term.show();
  term.sendText('# Review each line and press Enter to run.', false);
  for (const l of lines) term.sendText(l, false);
}

// ─── Step 1 — Connection (instance name + hostname + code-version) ──────
async function runConnectionStep(context: vscode.ExtensionContext): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a workspace folder first.');
    return;
  }
  const inst = await ensureInstanceName(context);
  if (!inst) return;

  const hostname = await vscode.window.showInputBox({
    title: `Connect · ${inst} · hostname`,
    prompt: 'Instance hostname (no https://)',
    placeHolder: 'abcd-123.dx.commercecloud.salesforce.com',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim().length > 0 ? null : 'Required'),
  });
  if (!hostname) return;
  const codeVersion = await vscode.window.showInputBox({
    title: `Connect · ${inst} · code-version (optional)`,
    prompt: 'Default code version targeted by deploys',
    placeHolder: 'version1',
    ignoreFocusOut: true,
  });

  try {
    const {doc, entry} = await readOrCreateConfigEntry(wsFolder.uri.fsPath, inst);
    entry.hostname = hostname;
    if (codeVersion) entry['code-version'] = codeVersion;
    else delete entry['code-version'];
    // Derive and persist the realm from the hostname so the Sandbox Explorer
    // can bootstrap directly off dw.json. Only set it if not already present —
    // a user-set realm always wins.
    if (!entry.realm) {
      const derived = deriveRealmFromHostname(hostname);
      if (derived) entry.realm = derived;
    }
    await writeConfigDoc(wsFolder.uri.fsPath, doc);
    await openFile(path.join(wsFolder.uri.fsPath, 'dw.json'));
    await offerInspectFollowUp(`Connection saved to dw.json (${inst}).`);
  } catch (e) {
    vscode.window.showErrorMessage(`B2C DX: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Derive the ODS realm from a B2C Commerce hostname.
 * e.g. "zzzz-005.test01.dx.unified.demandware.net" → "zzzz"
 *      "abcd-001.dx.commercecloud.salesforce.com"  → "abcd"
 */
function deriveRealmFromHostname(hostname: string): string | undefined {
  const trimmed = hostname.trim();
  if (!trimmed) return undefined;
  const firstSegment = trimmed.split('.')[0] ?? '';
  const realm = firstSegment.split('-')[0]?.trim();
  if (!realm) return undefined;
  // ODS realms are 4-character alphanumeric IDs. Defensive guard so we don't
  // write a garbage value when the user types something unusual.
  if (!/^[a-z0-9]{2,8}$/i.test(realm)) return undefined;
  return realm.toLowerCase();
}

// ─── Step 2 — OAuth credentials ────────────────────────
async function runOAuthStep(context: vscode.ExtensionContext): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a workspace folder first.');
    return;
  }
  const inst = await ensureActiveInstanceName(context, wsFolder.uri.fsPath);
  if (!inst) return;

  const placementPicked = await vscode.window.showQuickPick(placementItems(defaultSecretPlacement()), {
    title: `OAuth · ${inst} · where should client-id + client-secret live?`,
    placeHolder: 'Both halves of the OAuth pair stay together (Credential Grouping rule).',
    ignoreFocusOut: true,
  });
  if (!placementPicked) return;

  const clientId = await secretInput({
    title: `OAuth · ${inst} · client-id`,
    prompt: 'Paste your client-id (visible — it is an identifier).',
    placeholder: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  });
  if (clientId === undefined) return;
  const clientSecret = await secretInput({
    title: `OAuth · ${inst} · client-secret`,
    prompt: 'Paste your client-secret (input is masked).',
    placeholder: '••••••••••••••••••••',
    password: true,
  });
  if (clientSecret === undefined) return;

  const {report, errors, terminalLines} = await applySecretPair(
    inst,
    'oauth',
    placementPicked.id,
    {clientId, clientSecret},
    wsFolder.uri.fsPath,
  );
  flushTerminal(inst, terminalLines);
  const summary = report.length ? report.map((l) => `  • ${l}`).join('\n') : '  (none)';
  const errSummary = errors.length ? '\n\nErrors:\n' + errors.map((e) => `  • ${e}`).join('\n') : '';
  await offerInspectFollowUp(`OAuth credentials applied for ${inst}.\n\nApplied:\n${summary}${errSummary}`);
}

// ─── Step 3 — WebDAV credentials (Basic auth) ──────────
async function runWebDavStep(context: vscode.ExtensionContext): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a workspace folder first.');
    return;
  }
  const inst = await ensureActiveInstanceName(context, wsFolder.uri.fsPath);
  if (!inst) return;

  const placementPicked = await vscode.window.showQuickPick(placementItems(defaultSecretPlacement()), {
    title: `WebDAV · ${inst} · where should username + password live?`,
    placeHolder: 'Both halves of the Basic pair stay together (Credential Grouping rule).',
    ignoreFocusOut: true,
  });
  if (!placementPicked) return;

  const username = await secretInput({
    title: `WebDAV · ${inst} · username`,
    prompt: 'Your Business Manager username.',
    placeholder: 'you@example.com',
  });
  if (username === undefined) return;
  const password = await secretInput({
    title: `WebDAV · ${inst} · access key (password)`,
    prompt: 'Paste your WebDAV access key (input is masked).',
    placeholder: '••••••••••••••••••••',
    password: true,
  });
  if (password === undefined) return;

  const {report, errors, terminalLines} = await applySecretPair(
    inst,
    'basic',
    placementPicked.id,
    {username, password},
    wsFolder.uri.fsPath,
  );
  flushTerminal(inst, terminalLines);
  const summary = report.length ? report.map((l) => `  • ${l}`).join('\n') : '  (none)';
  const errSummary = errors.length ? '\n\nErrors:\n' + errors.map((e) => `  • ${e}`).join('\n') : '';
  await offerInspectFollowUp(`WebDAV credentials applied for ${inst}.\n\nApplied:\n${summary}${errSummary}`);
}

// ─── Step 4 — SCAPI extras ─────────────────────────────
async function runScapiStep(context: vscode.ExtensionContext): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a workspace folder first.');
    return;
  }
  const inst = await ensureActiveInstanceName(context, wsFolder.uri.fsPath);
  if (!inst) return;

  const shortCode = await vscode.window.showInputBox({
    title: `SCAPI · ${inst} · short-code`,
    prompt: 'Your organisation short code (from Account Manager)',
    placeHolder: 'kv7kzm78',
    ignoreFocusOut: true,
  });
  if (shortCode === undefined) return;
  const tenantId = await vscode.window.showInputBox({
    title: `SCAPI · ${inst} · tenant-id`,
    prompt: 'Your tenant ID',
    placeHolder: 'zzrf_001',
    ignoreFocusOut: true,
  });
  if (tenantId === undefined) return;
  const oauthScopes = await vscode.window.showInputBox({
    title: `SCAPI · ${inst} · oauth-scopes (optional)`,
    prompt:
      'Space- or comma-separated scopes the AM client is authorized to grant. ' +
      'Leave blank if your AM client uses default scopes — pinning shopper-* scopes ' +
      'will break Sandbox Explorer if the same client is not registered for them.',
    placeHolder: 'e.g. sfcc.products sfcc.catalogs   (leave blank to use AM defaults)',
    ignoreFocusOut: true,
  });

  try {
    const {doc, entry} = await readOrCreateConfigEntry(wsFolder.uri.fsPath, inst);
    if (shortCode) entry['short-code'] = shortCode;
    if (tenantId) entry['tenant-id'] = tenantId;
    // Persist oauth-scopes as a string[] — the SDK / Sandbox Explorer expects
    // an array; the older space-delimited string form trips `scopes.sort()`.
    // Accept either delimiter from the user.
    if (oauthScopes && oauthScopes.trim().length > 0) {
      const scopes = oauthScopes
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (scopes.length > 0) entry['oauth-scopes'] = scopes;
    }
    await writeConfigDoc(wsFolder.uri.fsPath, doc);
    await offerInspectFollowUp(`SCAPI fields saved to dw.json (${inst}).`);
  } catch (e) {
    vscode.window.showErrorMessage(`B2C DX: ${e instanceof Error ? e.message : String(e)}`);
  }
}
