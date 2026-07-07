/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {detectWorkspaceType} from '@salesforce/b2c-tooling-sdk/discovery';
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';

import * as cp from 'child_process';
import * as https from 'https';
import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from './config-provider.js';
import {CartridgeService} from './cartridges/cartridge-service.js';
import {registerCap} from './cap/index.js';
import {registerJobLogViewer} from './job-log-viewer.js';
import {registerContentTree} from './content-tree/index.js';
import {registerLogs} from './logs/index.js';
import {registerJobs} from './jobs/index.js';
import {initializePlugins} from './plugins.js';
import {registerSafeCommand, registerSafety} from './safety.js';
import {registerSandboxTree} from './sandbox-tree/index.js';
import {registerScaffold} from './scaffold/index.js';
import {registerApiBrowser} from './api-browser/index.js';
import {registerExportTree} from './export-tree/index.js';
import {registerDebugger} from './debugger/index.js';
import {registerCodeSync} from './code-sync/index.js';
import {registerIsml} from './isml/index.js';
import {registerScriptTypes} from './script-types/index.js';
import {registerWebDavTree} from './webdav-tree/index.js';
import {disposeTelemetry, initTelemetry, sendEvent, sendException} from './telemetry.js';
import {registerCipAnalytics} from './cip-analytics/index.js';
import {
  registerWalkthroughCommands,
  resetWorkspaceOnboardingIfFresh,
  showWalkthroughOnFirstActivation,
  initializeTelemetry,
  validateWalkthroughCommand,
  checkWalkthroughAccessibilityCommand,
  OnboardingStateStore,
  OnboardingPanel,
} from './walkthrough/index.js';

function applyLogLevel(log: vscode.OutputChannel): void {
  const config = vscode.workspace.getConfiguration('b2c-dx');
  const level = config.get<string>('logLevel', 'info');
  try {
    configureLogger({
      level: level as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent',
      destination: {
        write(chunk: string | Buffer): boolean {
          const line = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
          log.appendLine(line.trimEnd());
          return true;
        },
      },
      json: false,
      colorize: false,
      redact: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    log.appendLine(`Warning: Failed to configure SDK logger; SDK logs will not appear in this panel.\n${detail}`);
  }
}

function formatErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function runActivationStep(log: vscode.OutputChannel, label: string, step: () => void): void {
  try {
    step();
  } catch (err) {
    log.appendLine(`Warning: ${label} failed: ${formatErrorMessage(err)}`);
  }
}

async function updateStorefrontNextContext(
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): Promise<void> {
  const workingDir = configProvider.getWorkingDirectory();
  log.appendLine(`[Workspace] Running detectWorkspaceType for cwd=${workingDir}`);
  let isStorefrontNext = false;
  try {
    const result = await detectWorkspaceType(workingDir);
    log.appendLine(
      `[Workspace] Detection result: projectTypes=[${result.projectTypes.join(', ')}] matchedPatterns=[${result.matchedPatterns.join(', ')}]`,
    );
    isStorefrontNext = result.projectTypes.includes('storefront-next');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.appendLine(`[Workspace] storefront-next detection failed: ${message}`);
  }
  await vscode.commands.executeCommand('setContext', 'b2c-dx.isStorefrontNext', isStorefrontNext);
  log.appendLine(`[Workspace] setContext b2c-dx.isStorefrontNext=${isStorefrontNext} (cwd=${workingDir})`);
}

interface CliDetectionResult {
  installed: boolean;
  version?: string;
  latestVersion?: string;
  isOutdated?: boolean;
}

/** Extracts a `1.2.3` (with optional `-pre.4` etc.) tail from any string. */
function parseSemver(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/);
  return match ? match[1] : undefined;
}

function compareSemver(a: string, b: string): number {
  // Compare numeric major.minor.patch only; treat any pre-release as
  // older-than-stable (mirrors npm's behaviour for "is there a newer release").
  const norm = (v: string) =>
    v
      .split(/[-+]/)[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const [aA, aB] = [norm(a), norm(b)];
  for (let i = 0; i < 3; i++) {
    if ((aA[i] ?? 0) !== (aB[i] ?? 0)) return (aA[i] ?? 0) - (aB[i] ?? 0);
  }
  // Numeric parts equal — anything with a pre-release tag is older than a clean one.
  const aPre = a.includes('-');
  const bPre = b.includes('-');
  if (aPre !== bPre) return aPre ? -1 : 1;
  return 0;
}

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@salesforce%2Fb2c-cli/latest';
const LATEST_CACHE_KEY = 'b2c-dx.cli.latestVersionCache';
const LATEST_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

interface LatestCache {
  version: string;
  fetchedAt: number;
}

async function fetchLatestCliVersion(context: vscode.ExtensionContext): Promise<string | undefined> {
  const cached = context.globalState.get<LatestCache>(LATEST_CACHE_KEY);
  if (cached && Date.now() - cached.fetchedAt < LATEST_CACHE_TTL_MS) {
    return cached.version;
  }
  try {
    const fetched = await new Promise<string | undefined>((resolve) => {
      const req = https.get(NPM_REGISTRY_URL, {timeout: 4000}, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(undefined);
          return;
        }
        let body = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const v = typeof parsed.version === 'string' ? parsed.version : undefined;
            resolve(v);
          } catch {
            resolve(undefined);
          }
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(undefined);
      });
      req.on('error', () => resolve(undefined));
    });
    if (fetched) {
      await context.globalState.update(LATEST_CACHE_KEY, {version: fetched, fetchedAt: Date.now()});
    }
    return fetched;
  } catch {
    return undefined;
  }
}

async function detectB2cCli(context?: vscode.ExtensionContext): Promise<CliDetectionResult> {
  const local = await new Promise<CliDetectionResult>((resolve) => {
    cp.execFile('b2c', ['--version'], {timeout: 5000}, (err, stdout) => {
      if (err) {
        resolve({installed: false});
        return;
      }
      const versionRaw = stdout.toString().trim();
      resolve({installed: true, version: versionRaw || 'unknown'});
    });
  });
  if (!local.installed || !context) return local;
  const latest = await fetchLatestCliVersion(context);
  if (!latest) return local;
  const localSem = parseSemver(local.version);
  if (!localSem) return {...local, latestVersion: latest};
  const isOutdated = compareSemver(localSem, latest) < 0;
  return {...local, latestVersion: latest, isOutdated};
}

export async function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel('B2C DX');

  applyLogLevel(log);

  // Best-effort telemetry init. Non-blocking: client.start() runs in the
  // background. No-ops entirely when the user has telemetry disabled or no
  // connection string is configured.
  try {
    initTelemetry(context);
  } catch (err) {
    log.appendLine(`Warning: Telemetry initialization failed: ${formatErrorMessage(err)}`);
  }

  try {
    const result = await activateInner(context, log);
    sendEvent('EXTENSION_ACTIVATED');
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log.appendLine(`Activation failed: ${message}`);
    if (stack) log.appendLine(stack);
    console.error('B2C DX extension activation failed:', err);
    if (err instanceof Error) sendException(err, {phase: 'activate'});
    sendEvent('ACTIVATION_FAILED');
    vscode.window.showErrorMessage(`B2C DX: Extension failed to activate. See Output > B2C DX. Error: ${message}`);
    const showActivationError = () => {
      log.show();
      vscode.window.showErrorMessage(`B2C DX activation error: ${message}`);
    };

    const registerFallbackCommand = async (commandId: string): Promise<void> => {
      try {
        const registered = await vscode.commands.getCommands(true);
        if (registered.includes(commandId)) {
          return;
        }
        context.subscriptions.push(vscode.commands.registerCommand(commandId, showActivationError));
      } catch (registerErr) {
        log.appendLine(`Warning: Failed to register fallback command ${commandId}: ${formatErrorMessage(registerErr)}`);
      }
    };

    await registerFallbackCommand('b2c-dx.promptAgent');
    await registerFallbackCommand('b2c-dx.listWebDav');
  }
}

export async function deactivate(): Promise<void> {
  sendEvent('EXTENSION_DEACTIVATED');
  await disposeTelemetry();
}

async function activateInner(context: vscode.ExtensionContext, log: vscode.OutputChannel) {
  // Initialize b2c-cli plugins before registering commands/views.
  // This ensures plugin config sources and middleware are available
  // before the first resolveConfig() call. Failures are non-fatal.
  await initializePlugins();

  // Initialize walkthrough telemetry
  const walkthroughTelemetry = initializeTelemetry(log);

  // Register walkthrough commands early so they're available for first-time users
  runActivationStep(log, 'Walkthrough command registration', () => {
    registerWalkthroughCommands(context);
  });

  // Onboarding (next-gen walkthrough) state + panel.
  // The configProvider is created later (line ~480), so we expose a lazy getter
  // that the panel calls at refresh time — by then the provider is resolved.
  const onboardingStore = new OnboardingStateStore(context);
  context.subscriptions.push(onboardingStore);
  // Forward declare; the actual configProvider is assigned below once created.
  let lateConfigProvider: B2CExtensionConfig | null = null;
  const getConfigProvider = (): B2CExtensionConfig | null => lateConfigProvider;
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.onboarding.open', () => {
      OnboardingPanel.show(context, onboardingStore, log, getConfigProvider);
    }),
    vscode.commands.registerCommand('b2c-dx.onboarding.reset', async () => {
      await onboardingStore.reset();
      OnboardingPanel.show(context, onboardingStore, log, getConfigProvider);
    }),
    vscode.commands.registerCommand('b2c-dx.onboarding.changePersona', async () => {
      await onboardingStore.setPersona(null);
      OnboardingPanel.show(context, onboardingStore, log, getConfigProvider);
    }),
  );

  // Register walkthrough validation commands (for development/testing)
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.validate', async () => {
      await validateWalkthroughCommand(context.extensionPath, log);
    }),
    vscode.commands.registerCommand('b2c-dx.walkthrough.checkAccessibility', async () => {
      await checkWalkthroughAccessibilityCommand(context.extensionPath, log);
    }),
    vscode.commands.registerCommand('b2c-dx.walkthrough.showTelemetry', () => {
      walkthroughTelemetry.logSummary();
      log.show();
    }),
  );

  // "Verify CLI" — runs `b2c --version`, queries npm for the latest, and
  // reports back. Flips two context keys:
  //   b2c-dx.cliInstalled  — auto-completes the install-cli walkthrough step.
  //   b2c-dx.cliOutdated   — surfaces the "Update CLI" action when true.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.cli.verify', async () => {
      const result = await detectB2cCli(context);
      await vscode.commands.executeCommand('setContext', 'b2c-dx.cliInstalled', result.installed);
      await vscode.commands.executeCommand('setContext', 'b2c-dx.cliOutdated', !!result.isOutdated);

      if (!result.installed) {
        const action = await vscode.window.showWarningMessage(
          'B2C CLI not found on PATH. Install with `npm install -g @salesforce/b2c-cli` or `brew install salesforcecommercecloud/tools/b2c-cli`.',
          'Open Install Guide',
        );
        if (action === 'Open Install Guide') {
          await vscode.env.openExternal(
            vscode.Uri.parse('https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/installation.html'),
          );
        }
        return;
      }

      if (result.isOutdated && result.latestVersion) {
        const action = await vscode.window.showInformationMessage(
          `B2C CLI ${result.version} detected — newer version ${result.latestVersion} available.`,
          'Update now',
          'Copy update command',
          'Later',
        );
        if (action === 'Update now') {
          await vscode.commands.executeCommand('b2c-dx.cli.update');
        } else if (action === 'Copy update command') {
          await vscode.env.clipboard.writeText('npm install -g @salesforce/b2c-cli@latest');
          vscode.window.showInformationMessage('Update command copied to clipboard.');
        }
        return;
      }

      const suffix = result.latestVersion ? ` (latest)` : '';
      vscode.window.showInformationMessage(`B2C CLI detected: ${result.version}${suffix}`);
    }),
  );

  // "Install CLI via npm" — opens a terminal with the install command.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.cli.installNpm', async () => {
      const term = vscode.window.createTerminal({name: 'B2C DX — CLI install'});
      term.show();
      term.sendText('npm install -g @salesforce/b2c-cli', false);
    }),
  );

  // "Install CLI via Homebrew" — opens a terminal with the brew install command.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.cli.installBrew', async () => {
      const term = vscode.window.createTerminal({name: 'B2C DX — CLI install'});
      term.show();
      term.sendText('brew install salesforcecommercecloud/tools/b2c-cli', false);
    }),
  );

  // "Re-check CLI" — re-runs the CLI detection and refreshes state.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.cli.recheck', async () => {
      const result = await detectB2cCli(context);
      await vscode.commands.executeCommand('setContext', 'b2c-dx.cliInstalled', result.installed);
      await vscode.commands.executeCommand('setContext', 'b2c-dx.cliOutdated', !!result.isOutdated);
      if (result.installed) {
        const suffix =
          result.isOutdated && result.latestVersion ? ` (v${result.latestVersion} available)` : ' (latest)';
        vscode.window.showInformationMessage(`B2C CLI detected: ${result.version}${suffix}`);
      } else {
        vscode.window.showWarningMessage('B2C CLI still not found on PATH. Install it and try again.');
      }
    }),
  );

  // "Update CLI" — opens a terminal preloaded with the npm update command.
  // We never auto-execute: a global npm install can prompt for credentials
  // or hit privilege errors, so the user runs it themselves.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.cli.update', async () => {
      const cmd = 'npm install -g @salesforce/b2c-cli@latest';
      const choice = await vscode.window.showInformationMessage(
        'Update the B2C CLI to the latest version? This runs an npm global install — you may be prompted for permissions.',
        {modal: true},
        'Run in terminal',
        'Copy command',
        'Cancel',
      );
      if (!choice || choice === 'Cancel') return;
      if (choice === 'Run in terminal') {
        const term = vscode.window.createTerminal({name: 'B2C DX — CLI update'});
        term.show();
        // Don't auto-execute — user presses Enter so they see the command first.
        term.sendText(cmd, false);
      } else {
        await vscode.env.clipboard.writeText(cmd);
        vscode.window.showInformationMessage('Update command copied to clipboard.');
      }
      // Invalidate the cached "latest" so the next verify makes a fresh check.
      await context.globalState.update(LATEST_CACHE_KEY, undefined);
    }),
  );

  // "Mark all as done" — fires a single onCommand event that every walkthrough
  // step lists in its completionEvents, ticking the entire walkthrough at once.
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.walkthrough.markAllDone', async () => {
      // Re-open the walkthrough so the user sees the freshly-ticked steps.
      await vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        'Salesforce.b2c-vs-extension#b2c-dx.gettingStarted',
        false,
      );
      vscode.window.showInformationMessage('B2C DX: Getting Started marked as complete.');
    }),
    // "Reset Getting Started Progress" — clears both surfaces:
    //   • our per-workspace OnboardingStateStore (deep-dive panel)
    //   • VS Code's per-installation native walkthrough ticks
    // VS Code stores native walkthrough completion in user-global state and
    // does not expose a per-workspace API to clear it; this command lets the
    // user trigger a clean slate manually when switching workspaces.
    vscode.commands.registerCommand('b2c-dx.walkthrough.resetProgress', async () => {
      await onboardingStore.reset();
      await context.workspaceState.update('b2c-dx.gettingStarted.autoOpened', undefined);
      try {
        await vscode.commands.executeCommand('resetGettingStartedProgress');
      } catch {
        // built-in command not available in older VS Code releases; no-op
      }
      await vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        'Salesforce.b2c-vs-extension#b2c-dx.gettingStarted',
        false,
      );
      vscode.window.showInformationMessage('B2C DX: Getting Started progress reset.');
    }),
  );

  // Theme toggle — flips between the user's preferred light + dark themes.
  // Persists the last-seen pair so a developer who customised their theme
  // keeps that customisation across toggles. Falls back to VS Code's stock
  // "Default Light Modern" / "Default Dark Modern" until each side has been
  // observed at least once.
  const THEME_LIGHT_KEY = 'b2c-dx.theme.preferredLight';
  const THEME_DARK_KEY = 'b2c-dx.theme.preferredDark';
  context.subscriptions.push(
    vscode.commands.registerCommand('b2c-dx.theme.toggle', async () => {
      const config = vscode.workspace.getConfiguration('workbench');
      const currentTheme = config.get<string>('colorTheme') ?? '';
      const kind = vscode.window.activeColorTheme.kind;
      const isDarkLike = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;

      // Remember whichever side we're leaving so the next toggle restores it.
      if (isDarkLike) {
        await context.globalState.update(THEME_DARK_KEY, currentTheme);
      } else {
        await context.globalState.update(THEME_LIGHT_KEY, currentTheme);
      }

      const target = isDarkLike
        ? (context.globalState.get<string>(THEME_LIGHT_KEY) ?? 'Default Light Modern')
        : (context.globalState.get<string>(THEME_DARK_KEY) ?? 'Default Dark Modern');

      try {
        await config.update('colorTheme', target, vscode.ConfigurationTarget.Global);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`B2C DX: Could not switch theme — ${message}`);
      }
    }),
  );

  // Initialize the cliInstalled context key once (best-effort, non-blocking).
  void detectB2cCli(context).then((r) => {
    void vscode.commands.executeCommand('setContext', 'b2c-dx.cliInstalled', r.installed);
    void vscode.commands.executeCommand('setContext', 'b2c-dx.cliOutdated', !!r.isOutdated);
  });

  // Initialize the setup-session context keys from workspaceState so welcome
  // views can react on first frame.
  const sessionInstance = context.workspaceState.get<string>('b2c-dx.setup.activeInstance');
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupSessionActive', !!sessionInstance);
  void vscode.commands.executeCommand('setContext', 'b2c-dx.setupInstance', sessionInstance);

  registerJobLogViewer(context);

  const configProvider = new B2CExtensionConfig(log, context.workspaceState);
  lateConfigProvider = configProvider;
  context.subscriptions.push(configProvider);
  await configProvider.ensureResolved();

  registerSafety(context, configProvider);

  void updateStorefrontNextContext(configProvider, log);
  context.subscriptions.push(
    configProvider.onDidReset(() => {
      void updateStorefrontNextContext(configProvider, log);
    }),
  );

  const cartridgeService = new CartridgeService(configProvider);
  context.subscriptions.push(cartridgeService);

  // Walkthrough context keys: drive auto-completion of the native walkthrough
  // steps. dwJsonExists tracks the per-workspace dw.json file; instanceConnected
  // mirrors whether the config provider successfully resolved a config.
  const updateInstanceConnectedContext = () => {
    const connected = !!configProvider.getConfig();
    void vscode.commands.executeCommand('setContext', 'b2c-dx.instanceConnected', connected);
  };
  updateInstanceConnectedContext();
  configProvider.onDidReset(() => updateInstanceConnectedContext());

  const updateDwJsonContext = async () => {
    const folders = vscode.workspace.workspaceFolders ?? [];
    let exists = false;
    for (const folder of folders) {
      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(folder.uri, 'dw.json'));
        exists = true;
        break;
      } catch {
        // not in this folder
      }
    }
    await vscode.commands.executeCommand('setContext', 'b2c-dx.dwJsonExists', exists);
  };
  void updateDwJsonContext();
  const dwJsonWatcher = vscode.workspace.createFileSystemWatcher('**/dw.json');
  context.subscriptions.push(
    dwJsonWatcher,
    dwJsonWatcher.onDidCreate(() => void updateDwJsonContext()),
    dwJsonWatcher.onDidDelete(() => void updateDwJsonContext()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => void updateDwJsonContext()),
  );

  const promptAgentDisposable = registerSafeCommand('b2c-dx.promptAgent', async () => {
    const prompt = await vscode.window.showInputBox({
      title: 'Prompt Agent',
      placeHolder: 'Enter your prompt for the agent...',
    });
    if (prompt === undefined || prompt === '') {
      return;
    }
    try {
      await vscode.env.clipboard.writeText(prompt);
      await vscode.commands.executeCommand('composer.newAgentChat');
      await new Promise((resolve) => setTimeout(resolve, 300));
      await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(
        `Could not open Cursor chat: ${message}. Run this extension in Cursor to send prompts to the agent.`,
      );
    }
  });

  const listWebDavDisposable = registerSafeCommand('b2c-dx.listWebDav', () => {
    vscode.commands.executeCommand('b2cWebdavExplorer.focus');
  });

  // --- Active instance status bar ---
  const dwJsonSource = new DwJsonSource();
  const getWorkingDirectory = () => configProvider.getWorkingDirectory();

  const instanceStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  instanceStatusBar.command = 'b2c-dx.instance.switch';
  const updateInstanceStatusBar = async () => {
    // This runs on the activation path (awaited below) and on every config
    // reset. It must never throw: listInstances() re-throws on a malformed
    // dw.json, and an unhandled throw here would escape activateInner() and
    // disable the entire extension (only the two fallback commands survive).
    // A garbled local dw.json must not take down offline browsing, so any
    // failure degrades to the "Not configured" presentation.
    try {
      const config = configProvider.getConfig();
      // `getConfig()` is truthy whenever resolveConfig succeeds at all — even
      // when dw.json is malformed (the resolver tolerates it) or empty — so
      // gate on an actual instance (hostname) rather than mere truthiness,
      // otherwise a misconfigured workspace shows "$(cloud) unnamed" instead
      // of the clearer "Not configured" state.
      if (config?.hasB2CInstanceConfig()) {
        // Find active instance name from dw.json
        const instances = await dwJsonSource.listInstances({workingDirectory: getWorkingDirectory()});
        const active = instances.find((i) => i.active);
        const name = active?.name;
        const host = config.values.hostname ?? '';
        const truncatedHost = host.length > 40 ? host.slice(0, 37) + '...' : host;
        const display = name || truncatedHost || 'unnamed';
        const pinnedSuffix = configProvider.isProjectRootPinned() ? ' $(pinned)' : '';
        instanceStatusBar.text = `$(cloud) ${display}${pinnedSuffix}`;
        const tooltipLines = [`B2C Instance: ${name ?? 'unnamed'}`];
        if (host) tooltipLines.push(`Host: ${host}`);
        if (configProvider.isProjectRootPinned()) {
          tooltipLines.push(`Project root: ${getWorkingDirectory()} (pinned)`);
        }
        tooltipLines.push('Click to switch instance');
        instanceStatusBar.tooltip = tooltipLines.join('\n');
        instanceStatusBar.show();
      } else {
        const err = configProvider.getConfigError();
        if (err) {
          instanceStatusBar.text = '$(cloud) B2C: Not configured';
          instanceStatusBar.tooltip = err;
          instanceStatusBar.show();
        } else {
          instanceStatusBar.hide();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.appendLine(`[Instance] Failed to update status bar: ${message}`);
      instanceStatusBar.text = '$(cloud) B2C: Not configured';
      instanceStatusBar.tooltip = `Could not read instance configuration: ${message}`;
      instanceStatusBar.show();
    }
  };
  await updateInstanceStatusBar();
  configProvider.onDidReset(() => void updateInstanceStatusBar());

  const instanceConfigScheme = 'b2c-instance-config';
  const instanceConfigContents = new Map<string, string>();
  const instanceConfigOnDidChange = new vscode.EventEmitter<vscode.Uri>();
  const instanceConfigRegistration = vscode.workspace.registerTextDocumentContentProvider(instanceConfigScheme, {
    onDidChange: instanceConfigOnDidChange.event,
    provideTextDocumentContent(uri: vscode.Uri) {
      return instanceConfigContents.get(uri.toString()) ?? '';
    },
  });

  const inspectInstanceDisposable = registerSafeCommand('b2c-dx.instance.inspect', async () => {
    const config = configProvider.getConfig();
    if (!config) {
      vscode.window.showWarningMessage('B2C DX: No B2C Commerce configuration found.');
      return;
    }
    const safeValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config.values)) {
      if (value === undefined) continue;
      // Redact secrets
      if (/secret|password|passphrase|apikey/i.test(key) && typeof value === 'string') {
        safeValues[key] = value.slice(0, 4) + '****';
      } else {
        safeValues[key] = value;
      }
    }
    const content = JSON.stringify(safeValues, null, 2);
    const host = config.values.hostname ?? 'instance';
    const uri = vscode.Uri.parse(`${instanceConfigScheme}:${host}.json`);
    instanceConfigContents.set(uri.toString(), content);
    instanceConfigOnDidChange.fire(uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    await vscode.window.showTextDocument(doc, {preview: true});
  });

  const switchInstanceDisposable = registerSafeCommand('b2c-dx.instance.switch', async () => {
    const workingDirectory = getWorkingDirectory();
    const instances = await dwJsonSource.listInstances({workingDirectory});

    if (instances.length === 0) {
      vscode.window.showWarningMessage('No instances configured in dw.json.');
      return;
    }

    if (instances.length === 1) {
      // Only one instance — go straight to inspect
      await vscode.commands.executeCommand('b2c-dx.instance.inspect');
      return;
    }

    const items = instances.map((inst) => ({
      label: `${inst.active ? '$(check) ' : ''}${inst.name}`,
      description: inst.hostname ?? '',
      instance: inst,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      title: 'Switch B2C Instance',
      placeHolder: 'Select an instance to activate',
    });
    if (!picked) return;

    if (picked.instance.active) {
      // Already active — just show config
      await vscode.commands.executeCommand('b2c-dx.instance.inspect');
      return;
    }

    try {
      await dwJsonSource.setActiveInstance(picked.instance.name, {workingDirectory});
      // The FileSystemWatcher will detect the dw.json change and trigger reset,
      // but fire manually in case the watcher is slow
      configProvider.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to switch instance: ${message}`);
    }
  });

  const setProjectRootDisposable = registerSafeCommand('b2c-dx.setProjectRoot', async (uri?: vscode.Uri) => {
    if (!uri) return;
    const folderPath = uri.fsPath;
    await configProvider.setProjectRoot(folderPath);
    vscode.window.showInformationMessage(`B2C DX: Project root set to ${path.basename(folderPath)}`);
  });

  const resetProjectRootDisposable = registerSafeCommand('b2c-dx.resetProjectRoot', async () => {
    if (!configProvider.isProjectRootPinned()) {
      vscode.window.showInformationMessage('B2C DX: Project root is already using auto-detection.');
      return;
    }
    await configProvider.resetProjectRoot();
    vscode.window.showInformationMessage('B2C DX: Project root reset to auto-detect.');
  });

  const settings = vscode.workspace.getConfiguration('b2c-dx');

  if (settings.get<boolean>('features.webdavBrowser', true)) {
    runActivationStep(log, 'WebDAV Explorer registration', () => {
      registerWebDavTree(context, configProvider);
    });
  }
  if (settings.get<boolean>('features.contentLibraries', true)) {
    runActivationStep(log, 'Content Libraries registration', () => {
      registerContentTree(context, configProvider);
    });
  }
  if (settings.get<boolean>('features.sandboxExplorer', true)) {
    runActivationStep(log, 'Sandbox Explorer registration', () => {
      registerSandboxTree(context, configProvider);
    });
  }
  if (settings.get<boolean>('features.logTailing', true)) {
    runActivationStep(log, 'Logs registration', () => {
      registerLogs(context, configProvider);
    });
  }
  if (settings.get<boolean>('features.jobsExplorer', true)) {
    runActivationStep(log, 'Job History registration', () => {
      registerJobs(context, configProvider);
    });
  }
  if (settings.get<boolean>('features.scaffold', true)) {
    runActivationStep(log, 'Scaffold registration', () => {
      registerScaffold(context, configProvider, log);
    });
  }
  if (settings.get<boolean>('features.apiBrowser', true)) {
    runActivationStep(log, 'API Browser registration', () => {
      registerApiBrowser(context, configProvider, log);
    });
  }
  if (settings.get<boolean>('features.exportExplorer', true)) {
    registerExportTree(context, configProvider);
  }
  if (settings.get<boolean>('features.cap', true)) {
    runActivationStep(log, 'CAP registration', () => {
      registerCap(context, configProvider, log);
    });
  }
  if (settings.get<boolean>('features.codeSync', true)) {
    runActivationStep(log, 'Code Sync registration', () => {
      registerCodeSync(context, configProvider, cartridgeService, log);
    });
  }
  if (settings.get<boolean>('features.scriptTypes', true)) {
    runActivationStep(log, 'Script Types registration', () => {
      registerScriptTypes(context, cartridgeService, log);
    });
  }

  if (settings.get<boolean>('features.cipAnalytics', true)) {
    runActivationStep(log, 'CIP Analytics registration', () => {
      registerCipAnalytics(context, configProvider, log);
    });
  }

  runActivationStep(log, 'ISML registration', () => {
    registerIsml(context, cartridgeService);
  });

  runActivationStep(log, 'Debugger registration', () => {
    registerDebugger(context, configProvider);
  });

  // React to configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('b2c-dx.logLevel')) {
      applyLogLevel(log);
    }
  });

  context.subscriptions.push(
    promptAgentDisposable,
    listWebDavDisposable,
    instanceStatusBar,
    instanceConfigRegistration,
    inspectInstanceDisposable,
    switchInstanceDisposable,
    setProjectRootDisposable,
    resetProjectRootDisposable,
    configChangeListener,
  );
  log.appendLine('B2C DX extension activated.');

  // Workspace-only reset: clear stale setup-session keys when the current
  // workspace has no dw.json, so a fresh workspace doesn't inherit the
  // previous one's onboarding chips/tooltips.
  await resetWorkspaceOnboardingIfFresh(context).catch((err) => {
    log.appendLine(
      `Warning: Failed to reset onboarding for fresh workspace: ${err instanceof Error ? err.message : String(err)}`,
    );
  });

  // Drop the per-workspace onboarding panel state (persona + step records)
  // when the workspace has no dw.json, so the deep-dive panel reopens with no
  // selection. Cheap to call: workspaceState writes are local.
  const workspaceHasDwJson = await (async () => {
    const folders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of folders) {
      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(folder.uri, 'dw.json'));
        return true;
      } catch {
        // keep checking
      }
    }
    return false;
  })();
  if (!workspaceHasDwJson) {
    await onboardingStore.reset();
  }

  // Show walkthrough on first activation (optional, non-blocking)
  // This runs asynchronously after activation is complete
  showWalkthroughOnFirstActivation(context).catch((err) => {
    log.appendLine(`Warning: Failed to show walkthrough: ${err instanceof Error ? err.message : String(err)}`);
  });
}
