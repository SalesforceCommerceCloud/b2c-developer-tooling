/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
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

  // Command: Credential-storage wizard. Field-level placement: non-secret
  // connection fields go to dw.json, secret pairs are placed independently
  // (Keychain / pass / env / dw.json) per Credential Grouping.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.chooseCredentialStorage', async () => {
      await chooseCredentialStorage(context);
    }),
  );

  // Command: `b2c setup inspect` — opens a terminal showing where each
  // resolved config value came from (file / env / keychain / etc.).
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.inspectSetup', async () => {
      await openInspect();
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
    await vscode.commands.executeCommand('b2c-dx.walkthrough.inspectSetup');
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

/** Fields whose values must be redacted before display. Names match every
 *  documented variant (kebab + camel + env-var) so accidental aliases are
 *  caught. */
const SENSITIVE_FIELDS = new Set([
  'password',
  'client-secret',
  'clientSecret',
  'sfcc_password',
  'sfcc_client_secret',
  'mrt_api_key',
  'mrtApiKey',
  'apiKey',
  'api-key',
  'certificate',
  'certificate-passphrase',
  'certificatePassphrase',
]);

async function runB2cInspect(workingDir: string): Promise<{stdout: string; ok: boolean}> {
  return new Promise((resolve) => {
    cp.execFile('b2c', ['setup', 'inspect', '--json'], {cwd: workingDir, timeout: 8000}, (err, stdout) => {
      if (err) resolve({stdout: stdout ?? '', ok: false});
      else resolve({stdout: stdout ?? '', ok: true});
    });
  });
}

/** Tries to coerce parsed inspect output into a list of `{field, value, source}`
 *  rows. The CLI's --json shape is `{ values: { field: { value, source } } }`
 *  on recent releases; older versions emit a flat object. We accept both. */
interface InspectRow {
  field: string;
  value: string;
  source?: string;
  sensitive: boolean;
}

function flattenInspect(parsed: unknown): InspectRow[] {
  const rows: InspectRow[] = [];
  const isSensitive = (key: string) => {
    const lc = key.toLowerCase();
    return (
      SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(lc) || /(secret|password|api[-_]?key|passphrase)/i.test(key)
    );
  };
  const stringifyVal = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v);
  };

  if (!parsed || typeof parsed !== 'object') return rows;
  const obj = parsed as Record<string, unknown>;

  // Shape A: { values: { field: { value, source } } } — older CLI versions.
  if (obj.values && typeof obj.values === 'object') {
    for (const [field, raw] of Object.entries(obj.values as Record<string, unknown>)) {
      if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
        const r = raw as {value: unknown; source?: unknown};
        rows.push({
          field,
          value: stringifyVal(r.value),
          source: typeof r.source === 'string' ? r.source : undefined,
          sensitive: isSensitive(field),
        });
      } else {
        rows.push({field, value: stringifyVal(raw), sensitive: isSensitive(field)});
      }
    }
    return rows;
  }

  // Shape B: { config: { …fields }, sources: { field: 'source-name' } }
  // (current `b2c setup inspect --json` shape).
  if (obj.config && typeof obj.config === 'object') {
    const config = obj.config as Record<string, unknown>;
    const sources =
      obj.sources && typeof obj.sources === 'object' && !Array.isArray(obj.sources)
        ? (obj.sources as Record<string, unknown>)
        : {};
    const sourcesArr = Array.isArray(obj.sources) ? (obj.sources as Array<Record<string, unknown>>) : null;
    // Optional: Shape B-arr — sources is `[{name, fields:[…]}]`.
    const arrSourceFor = (field: string): string | undefined => {
      if (!sourcesArr) return undefined;
      for (const s of sourcesArr) {
        const fields = s && typeof s === 'object' ? (s as {fields?: unknown}).fields : undefined;
        if (Array.isArray(fields) && fields.includes(field)) {
          return typeof (s as {name?: unknown}).name === 'string' ? (s as {name: string}).name : 'unknown';
        }
      }
      return undefined;
    };
    const flat = (prefix: string, val: unknown) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
          flat(prefix ? `${prefix}.${k}` : k, v);
        }
        return;
      }
      const src = typeof sources[prefix] === 'string' ? (sources[prefix] as string) : arrSourceFor(prefix);
      rows.push({
        field: prefix,
        value: stringifyVal(val),
        source: src,
        sensitive: isSensitive(prefix.split('.').pop() || prefix),
      });
    };
    for (const [k, v] of Object.entries(config)) flat(k, v);
    return rows;
  }

  // Shape C: a plain map of field → primitive (no source info).
  for (const [field, raw] of Object.entries(obj)) {
    if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
      const r = raw as {value: unknown; source?: unknown};
      rows.push({
        field,
        value: stringifyVal(r.value),
        source: typeof r.source === 'string' ? r.source : undefined,
        sensitive: isSensitive(field),
      });
    } else {
      rows.push({field, value: stringifyVal(raw), sensitive: isSensitive(field)});
    }
  }
  return rows;
}

let inspectPanelRef: vscode.WebviewPanel | undefined;

async function openInspect(): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a folder first — inspect resolves config relative to the workspace.');
    return;
  }

  const buildHtml = async (): Promise<string> => {
    const [{stdout, ok}, cliVersion] = await Promise.all([
      runB2cInspect(wsFolder.uri.fsPath),
      new Promise<string | undefined>((resolve) => {
        cp.execFile('b2c', ['--version'], {timeout: 5000}, (err, out) => {
          if (err) return resolve(undefined);
          const match = out.trim().match(/(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/);
          resolve(match ? match[1] : out.trim() || undefined);
        });
      }),
    ]);
    if (!ok) return renderInspectError(stdout);
    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = stdout;
    }
    const rows = flattenInspect(parsed);
    return renderInspectPanel(rows, parsed, cliVersion);
  };

  if (inspectPanelRef) {
    inspectPanelRef.reveal(undefined, true);
    inspectPanelRef.webview.html = await buildHtml();
    return;
  }

  inspectPanelRef = vscode.window.createWebviewPanel(
    'b2c-dx.inspectSetup',
    'B2C DX · Resolved Config',
    {viewColumn: vscode.ViewColumn.Active, preserveFocus: false},
    {enableScripts: true, retainContextWhenHidden: true},
  );
  inspectPanelRef.onDidDispose(() => {
    inspectPanelRef = undefined;
  });

  // Attach the message handler exactly once per panel instance.
  inspectPanelRef.webview.onDidReceiveMessage(async (msg: {type?: string}) => {
    if (!inspectPanelRef) return;
    if (msg && msg.type === 'refresh') {
      inspectPanelRef.webview.html = await buildHtml();
    } else if (msg && msg.type === 'openTerminalUnmask') {
      const term = vscode.window.createTerminal({name: 'B2C DX — setup inspect (unmasked)'});
      term.show();
      term.sendText('b2c setup inspect --unmask', false);
    }
  });

  inspectPanelRef.webview.html = await buildHtml();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

function renderInspectError(stdout: string): string {
  const styles = inspectStyles();
  return `<!doctype html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>
    <header class="hdr">
      <div>
        <span class="eyebrow">B2C DX · Resolved Config</span>
        <h1>Could not run <code>b2c setup inspect</code></h1>
        <p class="muted">The CLI isn't installed or returned an error. Install via Phase 1, or run the command manually in a terminal.</p>
      </div>
      <div class="hdr-actions">
        <button class="btn-primary" onclick="vscode.postMessage({type:'refresh'})">Retry</button>
        <button class="btn-ghost" onclick="vscode.postMessage({type:'openTerminalUnmask'})">Open in terminal</button>
      </div>
    </header>
    ${stdout ? `<pre class="raw">${escapeHtml(stdout)}</pre>` : ''}
    <script>const vscode = acquireVsCodeApi();</script>
  </body></html>`;
}

function renderInspectPanel(rows: InspectRow[], parsed: unknown, cliVersion?: string): string {
  const styles = inspectStyles();
  // Group rows by source for the second view; keeps the per-source breakdown
  // clean even when one field is supplied by multiple lower-priority sources.
  const bySource = new Map<string, InspectRow[]>();
  for (const r of rows) {
    const key = r.source ?? 'unknown';
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(r);
  }

  const sourceColor = (source: string | undefined): string => {
    if (!source) return 'var(--src-fallback)';
    const s = source.toLowerCase();
    if (s.includes('env')) return 'var(--src-env)';
    if (s.includes('keychain')) return 'var(--src-keychain)';
    if (s.includes('pass')) return 'var(--src-pass)';
    if (s.includes('dw.json')) return 'var(--src-file)';
    if (s.includes('plugin')) return 'var(--src-plugin)';
    return 'var(--src-fallback)';
  };

  const lockSvg = `<svg class="lock-icon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M8 1a3 3 0 0 0-3 3v3H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm-2 6V4a2 2 0 1 1 4 0v3H6z"/></svg>`;

  const renderRow = (r: InspectRow, idx: number): string => {
    const display = r.value
      ? r.sensitive
        ? `<span class="masked">${lockSvg}<span class="masked-dots">••••••••</span></span>`
        : escapeHtml(r.value)
      : '<span class="muted">—</span>';
    const srcLabel = r.source ? escapeHtml(r.source) : 'unknown';
    return `<tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}${r.sensitive ? ' row-secret' : ''}">
      <td class="field">${escapeHtml(r.field)}</td>
      <td class="value">${display}</td>
      <td class="source"><span class="src-pill" style="--src-color:${sourceColor(r.source)}"><span class="dot"></span>${srcLabel}</span></td>
    </tr>`;
  };

  const renderSourceBlock = (source: string, items: InspectRow[]): string => `
    <section class="src-block" style="--src-color:${sourceColor(source)}">
      <header class="src-hdr">
        <span class="src-name">${escapeHtml(source)}</span>
        <span class="src-count">${items.length}</span>
      </header>
      <ul class="src-fields">
        ${items
          .map(
            (r) =>
              `<li><span class="field">${escapeHtml(r.field)}</span>${
                r.sensitive ? ` <span class="lock-inline" title="masked secret">${lockSvg}</span>` : ''
              }</li>`,
          )
          .join('')}
      </ul>
    </section>`;

  const fallbackJson = !rows.length
    ? `<pre class="raw">${escapeHtml(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))}</pre>`
    : '';

  const secretCount = rows.filter((r) => r.sensitive).length;
  const sourceCount = bySource.size;

  return `<!doctype html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>
  <header class="hdr">
    <div class="hdr-text">
      <span class="eyebrow">B2C DX · Resolved Config</span>
      <h1>What the CLI sees right now</h1>
      <p class="muted">Source of truth for every config field — secrets are masked.</p>
      ${
        rows.length
          ? `<div class="stats">
              <span class="stat"><strong>${rows.length}</strong> field${rows.length === 1 ? '' : 's'}</span>
              <span class="stat-sep" aria-hidden="true">·</span>
              <span class="stat"><strong>${sourceCount}</strong> source${sourceCount === 1 ? '' : 's'}</span>
              ${secretCount ? `<span class="stat-sep" aria-hidden="true">·</span><span class="stat secret-stat">${lockSvg}<strong>${secretCount}</strong> masked</span>` : ''}
            </div>`
          : ''
      }
    </div>
    <div class="hdr-actions">
      <button class="btn-primary" onclick="vscode.postMessage({type:'refresh'})" title="Re-run b2c setup inspect">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M13.65 2.35a8 8 0 1 0 1.96 8.4l-1.83-.69A6 6 0 1 1 12.24 3.76L10 6h6V0l-2.35 2.35z"/></svg>
        Refresh
      </button>
      <button class="btn-ghost" onclick="vscode.postMessage({type:'openTerminalUnmask'})" title="Open b2c setup inspect --unmask in terminal">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M2 2h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm.5 2v8h11V4h-11zm1.85 2.15L5.7 4.8l3.2 3.2-3.2 3.2-1.35-1.35L6.2 8 4.35 6.15zM9 10h4v1.5H9V10z"/></svg>
        Open unmasked in terminal
      </button>
    </div>
  </header>

  ${
    rows.length
      ? `
  <section class="card">
    <header class="card-hdr">
      <h2>All fields</h2>
      <span class="badge">${rows.length}</span>
    </header>
    <table class="tbl">
      <thead><tr><th>Field</th><th>Value</th><th class="th-source">Source</th></tr></thead>
      <tbody>${rows.map((r, i) => renderRow(r, i)).join('')}</tbody>
    </table>
  </section>

  <section class="card">
    <header class="card-hdr">
      <h2>Grouped by source</h2>
      <span class="badge">${sourceCount}</span>
    </header>
    <div class="src-grid">
      ${[...bySource.entries()].map(([s, items]) => renderSourceBlock(s, items)).join('')}
    </div>
  </section>
  `
      : `<section class="card empty" style="text-align:left;padding:36px 40px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="font-size:2.2rem;margin-bottom:12px;opacity:0.5;">&#x1F50D;</div>
          <h2 style="margin:0 0 16px;font-size:1.1rem;text-align:center;">No resolved fields</h2>
        </div>
        <p class="muted" style="margin:0 0 10px;">The CLI returned an empty configuration. This usually means one of the following:</p>
        <ul style="margin:0 0 20px;padding-left:20px;line-height:1.8;">
          <li>No <code>dw.json</code> was found in this workspace root</li>
          <li>The <code>dw.json</code> exists but has no configured instances</li>
          <li>Your B2C CLI version is too old to parse the file correctly</li>
        </ul>
        <div style="padding:12px 16px;border-radius:8px;background:rgba(1,118,211,0.06);border:1px solid rgba(1,118,211,0.15);margin-bottom:16px;">
          <p style="margin:0;font-size:0.88rem;"><strong>Tip:</strong> You have B2C CLI ${cliVersion ? `v${cliVersion}` : '(unknown version)'} installed. Run <code>npm install -g @salesforce/b2c-cli@latest</code> to update, then click <strong>Refresh</strong>.</p>
        </div>
        ${fallbackJson ? `<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.82rem;color:var(--vscode-descriptionForeground);">Raw CLI output</summary>${fallbackJson}</details>` : ''}
      </section>`
  }

  <script>const vscode = acquireVsCodeApi();</script>
  </body></html>`;
}

function inspectStyles(): string {
  return `
    :root {
      color-scheme: light dark;
      --hairline: var(--vscode-panel-border, var(--vscode-editorGroup-border, rgba(128,128,128,0.22)));
      --surface: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      --row-zebra: color-mix(in srgb, var(--vscode-foreground) 4%, transparent);
      --row-hover: color-mix(in srgb, var(--vscode-foreground) 8%, transparent);
      --brand-blue: #0176D3;
      --brand-blue-deep: #014486;
      --brand-blue-soft: rgba(1, 118, 211, 0.10);
      --brand-green: #1A8754;
      --secret-amber: #C77700;
      --secret-amber-soft: rgba(199, 119, 0, 0.10);
      --src-env: #1A8754;
      --src-keychain: #0176D3;
      --src-pass: #6F42C1;
      --src-file: #C77700;
      --src-plugin: #1B96FF;
      --src-fallback: rgba(127,127,127,0.55);
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; padding: 32px 40px;
      min-height: 100vh;
      font-family: 'Salesforce Sans','IBM Plex Sans','Source Sans 3',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .muted { color: var(--vscode-descriptionForeground); }
    code { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); background: var(--brand-blue-soft); padding: 1px 6px; border-radius: 4px; color: var(--brand-blue-deep); font-size: 0.86em; }
    .eyebrow { display: inline-block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; color: var(--brand-blue); text-transform: uppercase; margin-bottom: 6px; }
    h1 { margin: 0 0 6px; font-size: 1.7rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
    h2 { margin: 0; font-size: 0.95rem; font-weight: 600; letter-spacing: -0.005em; }
    .hdr {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .hdr-text { flex: 1 1 360px; min-width: 0; }
    .hdr-text > p { margin: 0 0 12px; max-width: 720px; }
    .hdr-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .stats {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 7px 12px; border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--hairline);
      font-size: 0.82rem;
    }
    .stat { display: inline-flex; align-items: center; gap: 5px; color: var(--vscode-descriptionForeground); }
    .stat strong { color: var(--vscode-foreground); font-weight: 700; }
    .stat-sep { color: var(--vscode-descriptionForeground); opacity: 0.5; }
    .secret-stat { color: var(--secret-amber); }
    .secret-stat strong { color: var(--secret-amber); }
    .secret-stat .lock-icon { color: var(--secret-amber); }
    button {
      display: inline-flex; align-items: center; gap: 6px;
      font: inherit; cursor: pointer; padding: 8px 14px;
      border-radius: 999px; font-weight: 600; font-size: 0.84rem;
      transition: all 0.15s ease;
    }
    button svg { display: block; }
    .btn-primary { background: var(--brand-blue); color: #fff; border: 1px solid var(--brand-blue); }
    .btn-primary:hover { background: var(--brand-blue-deep); border-color: var(--brand-blue-deep); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(1,118,211,0.30); }
    .btn-ghost { background: transparent; color: var(--brand-blue); border: 1px solid var(--brand-blue); }
    .btn-ghost:hover { background: var(--brand-blue-soft); }
    .card {
      background: var(--surface); border: 1px solid var(--hairline);
      border-radius: 14px; padding: 22px 24px; margin-bottom: 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.04);
    }
    .card-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; padding: 0 8px;
      border-radius: 999px;
      background: var(--brand-blue-soft);
      color: var(--brand-blue-deep);
      font-size: 0.74rem; font-weight: 700;
      letter-spacing: 0.02em;
    }
    .card.empty { text-align: center; padding: 36px 22px; }
    table.tbl { width: 100%; border-collapse: separate; border-spacing: 0; }
    .tbl th { text-align: left; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: var(--vscode-descriptionForeground); padding: 6px 14px 12px; border-bottom: 1px solid var(--hairline); }
    .tbl th.th-source { text-align: left; }
    .tbl td { padding: 11px 14px; font-size: 0.9rem; vertical-align: middle; border-bottom: 1px solid color-mix(in srgb, var(--hairline) 60%, transparent); }
    .tbl tbody tr.row-odd td { background: var(--row-zebra); }
    .tbl tbody tr:hover td { background: var(--row-hover); }
    .tbl tbody tr:first-child td:first-child { border-top-left-radius: 8px; }
    .tbl tbody tr:first-child td:last-child { border-top-right-radius: 8px; }
    .tbl tbody tr:last-child td { border-bottom: none; }
    .tbl tbody tr:last-child td:first-child { border-bottom-left-radius: 8px; }
    .tbl tbody tr:last-child td:last-child { border-bottom-right-radius: 8px; }
    .tbl .field { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.86rem; color: var(--vscode-foreground); white-space: nowrap; }
    .tbl .value { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.86rem; word-break: break-all; }
    .tbl .source { white-space: nowrap; width: 1%; }
    .masked {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 999px;
      background: var(--secret-amber-soft);
      border: 1px solid color-mix(in srgb, var(--secret-amber) 35%, transparent);
      color: var(--secret-amber);
      font-size: 0.78rem; font-weight: 600;
    }
    .masked-dots { letter-spacing: 0.18em; line-height: 1; }
    .lock-icon { color: var(--secret-amber); flex-shrink: 0; }
    .lock-inline { display: inline-flex; vertical-align: middle; opacity: 0.85; }
    .src-pill {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 3px 10px 3px 9px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--src-color) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--src-color) 30%, transparent);
      color: var(--vscode-foreground);
      font-size: 0.78rem; font-weight: 500;
    }
    .src-pill .dot { background: var(--src-color); width: 7px; height: 7px; margin: 0; border-radius: 50%; box-shadow: 0 0 0 2px color-mix(in srgb, var(--src-color) 18%, transparent); }
    .src-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .src-block {
      background: var(--vscode-editor-background);
      border: 1px solid var(--hairline);
      border-left: 3px solid var(--src-color);
      border-radius: 10px; padding: 14px 16px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .src-block:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--src-color) 50%, var(--hairline)); }
    .src-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 0.88rem; font-weight: 600; }
    .src-hdr .src-name { color: var(--vscode-foreground); }
    .src-hdr .src-count {
      margin-left: auto;
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 20px; padding: 0 7px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--src-color) 14%, transparent);
      color: var(--src-color);
      font-size: 0.72rem; font-weight: 700;
    }
    .src-fields { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
    .src-fields li { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.82rem; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 6px; }
    .src-fields li .field { color: var(--vscode-foreground); }
    pre.raw { background: rgba(127,127,127,0.10); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--hairline); overflow-x: auto; font-size: 0.82rem; line-height: 1.45; white-space: pre; }
  `;
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
    await vscode.commands.executeCommand('b2c-dx.walkthrough.inspectSetup');
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
    await writeConfigDoc(wsFolder.uri.fsPath, doc);
    await openFile(path.join(wsFolder.uri.fsPath, 'dw.json'));
    await offerInspectFollowUp(`Connection saved to dw.json (${inst}).`);
  } catch (e) {
    vscode.window.showErrorMessage(`B2C DX: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ─── Step 2 — OAuth credentials ────────────────────────
async function runOAuthStep(context: vscode.ExtensionContext): Promise<void> {
  const wsFolder = vscode.workspace.workspaceFolders?.[0];
  if (!wsFolder) {
    vscode.window.showErrorMessage('B2C DX: Open a workspace folder first.');
    return;
  }
  const inst = await ensureInstanceName(context);
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
  const inst = await ensureInstanceName(context);
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
  const inst = await ensureInstanceName(context);
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
    prompt: 'Space-separated SCAPI scopes',
    placeHolder: 'sfcc.shopper-customers sfcc.shopper-products',
    ignoreFocusOut: true,
  });

  try {
    const {doc, entry} = await readOrCreateConfigEntry(wsFolder.uri.fsPath, inst);
    if (shortCode) entry['short-code'] = shortCode;
    if (tenantId) entry['tenant-id'] = tenantId;
    if (oauthScopes) entry['oauth-scopes'] = oauthScopes;
    await writeConfigDoc(wsFolder.uri.fsPath, doc);
    await offerInspectFollowUp(`SCAPI fields saved to dw.json (${inst}).`);
  } catch (e) {
    vscode.window.showErrorMessage(`B2C DX: ${e instanceof Error ? e.message : String(e)}`);
  }
}
