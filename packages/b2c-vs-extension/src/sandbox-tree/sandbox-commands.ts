/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  buildSandboxSettings,
  getApiErrorMessage,
  parseFriendlySandboxId,
  resolveSandboxId,
  SandboxNotFoundError,
} from '@salesforce/b2c-tooling-sdk';
import {createOdsClient} from '@salesforce/b2c-tooling-sdk/clients';
import type {OdsClient} from '@salesforce/b2c-tooling-sdk/clients';
import * as vscode from 'vscode';
import {registerSafeCommand, runWithSafety} from '../safety.js';
import {friendlyIdFromHostname} from './active-sandbox.js';
import {
  CLONE_PROFILES,
  getExplicitCloneTargetProfiles,
  getSandboxSourceProfile,
  isCloneProfileDowngrade,
  type CloneProfile,
} from './sandbox-clone-helpers.js';
import type {SandboxConfigProvider} from './sandbox-config.js';
import {SandboxTreeItem, type RealmTreeItem, type SandboxTreeDataProvider} from './sandbox-tree-provider.js';

const DEFAULT_ODS_HOST = 'admin.dx.commercecloud.salesforce.com';

async function getOdsClientFromConfig(configProvider: SandboxConfigProvider) {
  const config = configProvider.getConfigProvider().getConfig();
  if (!config) throw new Error('No B2C Commerce configuration found. Configure dw.json or SFCC_* env vars.');
  if (!config.hasOAuthConfig())
    throw new Error('OAuth credentials required. Set clientId and clientSecret in dw.json.');
  const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
  const oauthOptions = await configProvider.getConfigProvider().getImplicitAuthOptions();
  return createOdsClient({host}, config.createOAuth(oauthOptions));
}

const SANDBOX_DETAIL_SCHEME = 'b2c-sandbox';

const CLONE_POLL_INTERVAL_MS = 10_000;
const CLONE_POLL_TIMEOUT_MS = 60 * 60_000;

interface CloneMemberStatus {
  status: string;
  progressPercentage: number;
  lastKnownState?: string;
}

function isCloneTerminal(status: string): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

export interface CloneBatchPollResult {
  completedCloneIds: string[];
  failedCloneIds: string[];
  timedOut: boolean;
}

export interface PollClonesOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

/**
 * Polls one or more clone operations (a single clone or a 1 to many batch sharing a source) until every
 * clone reaches a terminal state, the timeout elapses, or the token is cancelled. Reports aggregate
 * progress for batches and per-clone detail (lastKnownState) when there is only one clone.
 */
export async function pollClonesUntilTerminal(
  odsClient: OdsClient,
  sandboxId: string,
  cloneIds: string[],
  progress: vscode.Progress<{message?: string; increment?: number}>,
  token: vscode.CancellationToken,
  onTick: () => void,
  options: PollClonesOptions = {},
): Promise<CloneBatchPollResult> {
  const {pollIntervalMs = CLONE_POLL_INTERVAL_MS, timeoutMs = CLONE_POLL_TIMEOUT_MS} = options;
  const startTime = Date.now();
  let lastAvgPct = 0;
  const statuses = new Map<string, CloneMemberStatus>(
    cloneIds.map((id) => [id, {status: 'PENDING', progressPercentage: 0}]),
  );

  while (Date.now() - startTime < timeoutMs) {
    // Cancellation only stops the local poll; the server continues. To
    // abort the operation, use the ODS console.
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }
    onTick();

    const pendingCloneIds = cloneIds.filter((cloneId) => !isCloneTerminal(statuses.get(cloneId)!.status));

    await Promise.all(
      pendingCloneIds.map(async (cloneId) => {
        const statusResult = await odsClient.GET('/sandboxes/{sandboxId}/clones/{cloneId}', {
          params: {path: {sandboxId, cloneId}},
        });
        if (statusResult.error || !statusResult.data?.data) return;
        const clone = statusResult.data.data;
        statuses.set(cloneId, {
          status: clone.status ?? 'IN_PROGRESS',
          progressPercentage: clone.progressPercentage ?? 0,
          lastKnownState: clone.lastKnownState,
        });
      }),
    );

    const all = [...statuses.values()];
    const avgPct = Math.round(all.reduce((sum, s) => sum + s.progressPercentage, 0) / all.length);
    const increment = Math.max(0, avgPct - lastAvgPct);
    lastAvgPct = avgPct;
    const completed = all.filter((s) => isCloneTerminal(s.status)).length;

    const message =
      cloneIds.length > 1
        ? `${sandboxId} — ${completed}/${cloneIds.length} complete (${avgPct}%)`
        : `${sandboxId} — ${all[0].status} ${all[0].progressPercentage}%${all[0].lastKnownState ? ` (${all[0].lastKnownState})` : ''}`;
    progress.report({increment, message});

    if (completed === cloneIds.length) {
      return {
        completedCloneIds: [...statuses.entries()].filter(([, s]) => s.status === 'COMPLETED').map(([id]) => id),
        failedCloneIds: [...statuses.entries()].filter(([, s]) => s.status === 'FAILED').map(([id]) => id),
        timedOut: false,
      };
    }
  }

  return {completedCloneIds: [], failedCloneIds: [], timedOut: true};
}

class SandboxDetailProvider implements vscode.TextDocumentContentProvider {
  private contents = new Map<string, string>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  setContent(uri: vscode.Uri, content: string): void {
    this.contents.set(uri.toString(), content);
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) ?? '';
  }
}

export function registerSandboxCommands(
  configProvider: SandboxConfigProvider,
  treeProvider: SandboxTreeDataProvider,
): vscode.Disposable[] {
  const detailProvider = new SandboxDetailProvider();
  const detailRegistration = vscode.workspace.registerTextDocumentContentProvider(
    SANDBOX_DETAIL_SCHEME,
    detailProvider,
  );
  const refresh = registerSafeCommand('b2c-dx.sandbox.refresh', () => {
    treeProvider.refresh();
  });

  const addRealm = registerSafeCommand('b2c-dx.sandbox.addRealm', async () => {
    const defaultRealm = configProvider.getDefaultRealm();
    const realm = await vscode.window.showInputBox({
      title: 'Add Realm',
      prompt: 'Enter the ODS realm to browse',
      placeHolder: 'e.g., abcd',
      value: defaultRealm,
      validateInput: (v) => (v.trim() ? null : 'Realm is required'),
    });
    if (!realm) return;
    configProvider.addRealm(realm.trim());
    treeProvider.refresh();
  });

  const removeRealm = registerSafeCommand('b2c-dx.sandbox.removeRealm', (node: RealmTreeItem) => {
    if (!node || node.nodeType !== 'realm') return;
    configProvider.removeRealm(node.realm);
    treeProvider.refresh();
  });

  const create = registerSafeCommand('b2c-dx.sandbox.create', async (node?: RealmTreeItem) => {
    // Use the realm directly when invoked from a realm context menu, otherwise prompt
    let realm: string | undefined;
    if (node?.nodeType === 'realm') {
      realm = node.realm;
    } else {
      realm = await vscode.window.showInputBox({
        title: 'Create Sandbox — Realm',
        prompt: 'Enter the realm for the new sandbox',
        value: configProvider.getDefaultRealm(),
        validateInput: (v) => (v.trim() ? null : 'Realm is required'),
      });
      if (!realm) return;
      realm = realm.trim();
    }

    const ttlStr = await vscode.window.showInputBox({
      title: 'Create Sandbox — TTL (hours)',
      prompt: 'Time to live in hours (0 = no expiration)',
      value: '0',
      validateInput: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) return 'Enter a non-negative number';
        return null;
      },
    });
    if (ttlStr === undefined) return;
    const ttl = Number(ttlStr);

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Creating sandbox in realm ${realm}...`},
      async () => {
        try {
          const odsClient = await getOdsClientFromConfig(configProvider);
          // Grant the configured client the default OCAPI/WebDAV permissions so
          // it can deploy code and run jobs against the new sandbox, matching the
          // behavior of the CLI's `sandbox create` command.
          const clientId = configProvider.getConfigProvider().getConfig()?.values.clientId;
          const settings = buildSandboxSettings({clientId});
          const result = await odsClient.POST('/sandboxes', {
            body: {realm: realm!, ttl, analyticsEnabled: false, settings},
          });
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox create failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage('Sandbox creation started.');
          configProvider.addRealm(realm!);
          treeProvider.refreshRealm(realm!);
          treeProvider.startPollingRealm(realm!);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox create failed: ${message}`);
        }
      },
    );
  });

  const deleteSandbox = registerSafeCommand('b2c-dx.sandbox.delete', async (node: SandboxTreeItem) => {
    if (!node) return;
    const choice = await vscode.window.showWarningMessage(
      `Delete sandbox "${node.sandbox.id}"? This cannot be undone.`,
      {modal: true},
      'Delete',
      'Cancel',
    );
    if (choice !== 'Delete') return;

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Deleting sandbox ${node.sandbox.id}...`},
      async () => {
        try {
          const odsClient = await getOdsClientFromConfig(configProvider);
          const result = await runWithSafety(
            () => odsClient.DELETE('/sandboxes/{sandboxId}', {params: {path: {sandboxId: node.sandbox.id}}}),
            `Delete sandbox "${node.sandbox.id}"?`,
          );
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox delete failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage('Sandbox deleted.');
          treeProvider.refreshRealm(node.realm);
          treeProvider.startPollingRealm(node.realm);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox delete failed: ${message}`);
        }
      },
    );
  });

  const operateOnActiveSandbox = async (operationType: 'start' | 'stop' | 'restart') => {
    const config = configProvider.getConfigProvider().getConfig();
    if (!config) {
      vscode.window.showErrorMessage('No B2C Commerce configuration found. Configure dw.json or SFCC_* env vars.');
      return;
    }
    if (!config.hasOAuthConfig()) {
      vscode.window.showErrorMessage('OAuth credentials required. Set clientId and clientSecret in dw.json.');
      return;
    }

    const hostname = typeof config.values.hostname === 'string' ? config.values.hostname : undefined;
    const friendlyId = friendlyIdFromHostname(hostname);
    if (!friendlyId) {
      vscode.window.showErrorMessage(
        'Active instance hostname does not look like an ODS sandbox. Switch to a sandbox instance or use Realm Explorer.',
      );
      return;
    }

    if (operationType === 'stop') {
      const choice = await vscode.window.showWarningMessage(
        `Stop sandbox "${friendlyId}"? Running processes will be terminated.`,
        {modal: true},
        'Stop',
        'Cancel',
      );
      if (choice !== 'Stop') return;
    }

    const gerund = `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing`;
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${gerund} sandbox ${friendlyId}...`,
      },
      async () => {
        try {
          const odsClient = await getOdsClientFromConfig(configProvider);
          const sandboxId = await resolveSandboxId(odsClient, friendlyId);
          const result = await runWithSafety(
            () =>
              odsClient.POST('/sandboxes/{sandboxId}/operations', {
                params: {path: {sandboxId}},
                body: {operation: operationType},
              }),
            `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} sandbox "${friendlyId}"?`,
          );
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox ${operationType} failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage(`Sandbox ${operationType} initiated for ${friendlyId}.`);
          const realm = parseFriendlySandboxId(friendlyId)?.realm;
          if (realm) {
            treeProvider.refreshRealm(realm);
            treeProvider.startPollingRealm(realm);
          }
        } catch (err) {
          if (err instanceof SandboxNotFoundError) {
            vscode.window.showErrorMessage(err.message);
            return;
          }
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox ${operationType} failed: ${message}`);
        }
      },
    );
  };

  /**
   * Context menu: acts on the selected Realm Explorer item.
   * Command Palette (no arg): acts on the active dw.json / status-bar instance.
   * Stop confirms in both paths.
   */
  const sandboxOperation = (operationType: 'start' | 'stop' | 'restart') => async (node?: SandboxTreeItem) => {
    if (!(node instanceof SandboxTreeItem)) {
      await operateOnActiveSandbox(operationType);
      return;
    }

    if (operationType === 'stop') {
      const choice = await vscode.window.showWarningMessage(
        `Stop sandbox "${node.sandbox.id}"? Running processes will be terminated.`,
        {modal: true},
        'Stop',
        'Cancel',
      );
      if (choice !== 'Stop') return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing sandbox ${node.sandbox.id}...`,
      },
      async () => {
        try {
          const odsClient = await getOdsClientFromConfig(configProvider);
          const result = await runWithSafety(
            () =>
              odsClient.POST('/sandboxes/{sandboxId}/operations', {
                params: {path: {sandboxId: node.sandbox.id}},
                body: {operation: operationType},
              }),
            `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} sandbox "${node.sandbox.id}"?`,
          );
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox ${operationType} failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage(`Sandbox ${operationType} initiated.`);
          treeProvider.refreshRealm(node.realm);
          treeProvider.startPollingRealm(node.realm);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox ${operationType} failed: ${message}`);
        }
      },
    );
  };

  const start = registerSafeCommand('b2c-dx.sandbox.start', sandboxOperation('start'));
  const stop = registerSafeCommand('b2c-dx.sandbox.stop', sandboxOperation('stop'));
  const restart = registerSafeCommand('b2c-dx.sandbox.restart', sandboxOperation('restart'));

  const viewDetails = registerSafeCommand('b2c-dx.sandbox.viewDetails', async (node: SandboxTreeItem) => {
    if (!node) return;
    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: 'Fetching sandbox details...'},
      async () => {
        try {
          const details = await treeProvider.getSandboxDetails(node.sandbox.id);
          if (!details) {
            vscode.window.showErrorMessage('Could not fetch sandbox details.');
            return;
          }
          const content = JSON.stringify(details, null, 2);
          const uri = vscode.Uri.parse(`${SANDBOX_DETAIL_SCHEME}:${node.label ?? node.sandbox.id}.json`);
          detailProvider.setContent(uri, content);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(doc, 'json');
          await vscode.window.showTextDocument(doc, {preview: true});
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to fetch details: ${message}`);
        }
      },
    );
  });

  const openBM = registerSafeCommand('b2c-dx.sandbox.openBM', async (node: SandboxTreeItem) => {
    if (!node?.sandbox.hostName) {
      vscode.window.showWarningMessage('No hostname available for this sandbox.');
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(`https://${node.sandbox.hostName}/on/demandware.store/Sites-Site`));
  });

  const extendExpiration = registerSafeCommand('b2c-dx.sandbox.extendExpiration', async (node: SandboxTreeItem) => {
    if (!node) return;

    const ttlStr = await vscode.window.showInputBox({
      title: `Extend Expiration — ${node.label ?? node.sandbox.id}`,
      prompt: 'Hours to add to sandbox lifetime (0 = infinite)',
      value: '24',
      validateInput: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) return 'Enter a non-negative number';
        return null;
      },
    });
    if (ttlStr === undefined) return;
    const ttl = Number(ttlStr);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Extending expiration for sandbox ${node.sandbox.id}...`,
      },
      async () => {
        try {
          const odsClient = await getOdsClientFromConfig(configProvider);
          const result = await odsClient.PATCH('/sandboxes/{sandboxId}', {
            params: {path: {sandboxId: node.sandbox.id}},
            body: {ttl},
          });
          if (result.error) {
            vscode.window.showErrorMessage(
              `Failed to extend expiration: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          const message =
            ttl === 0 ? 'Sandbox expiration removed (infinite).' : `Sandbox expiration extended by ${ttl} hours.`;
          vscode.window.showInformationMessage(message);
          treeProvider.refreshRealm(node.realm);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to extend expiration: ${message}`);
        }
      },
    );
  });

  const MIN_CLONE_TARGET_COUNT = 1;
  const MAX_CLONE_TARGET_COUNT = 5;

  const clone = registerSafeCommand('b2c-dx.sandbox.clone', async (node: SandboxTreeItem) => {
    if (!node) return;

    const ttlStr = await vscode.window.showInputBox({
      title: `Clone Sandbox — ${node.label ?? node.sandbox.id}`,
      prompt: 'TTL in hours for the clone (0 = infinite, otherwise must be >= 24)',
      value: '24',
      validateInput: (v) => {
        const n = Number(v);
        if (Number.isNaN(n)) return 'Enter a number';
        if (n > 0 && n < 24) return 'TTL must be 0 (infinite) or at least 24 hours';
        return null;
      },
    });
    if (ttlStr === undefined) return;
    const ttl = Number(ttlStr);

    const targetCountPick = await vscode.window.showQuickPick(
      Array.from({length: MAX_CLONE_TARGET_COUNT - MIN_CLONE_TARGET_COUNT + 1}, (_, i) => {
        const count = MIN_CLONE_TARGET_COUNT + i;
        return {label: '', description: `${count} clone${count === 1 ? '' : 's'}`, count};
      }),
      {
        title: 'Clone Sandbox — Number of Clones',
        placeHolder: 'Select how many clones to create from this source',
      },
    );
    if (!targetCountPick) return;
    const targetCount = targetCountPick.count;

    const sourceProfile = getSandboxSourceProfile(node.sandbox);
    const explicitTargetProfiles = getExplicitCloneTargetProfiles(sourceProfile);
    const profilePick = await vscode.window.showQuickPick(
      [{label: 'Same as source', value: undefined}, ...explicitTargetProfiles.map((p) => ({label: p, value: p}))],
      {
        title: 'Clone Sandbox — Resource Profile',
        placeHolder:
          explicitTargetProfiles.length < CLONE_PROFILES.length
            ? `Select profile for the clone (downgrades from ${sourceProfile ?? 'source profile'} are blocked)`
            : 'Select profile for the clone',
      },
    );
    if (!profilePick) return;
    const targetProfile = profilePick.value as CloneProfile | undefined;

    if (isCloneProfileDowngrade(sourceProfile, targetProfile)) {
      vscode.window.showErrorMessage(
        `Profile downgrade not allowed: source profile is ${sourceProfile}. Choose same or higher profile.`,
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailsStr = await vscode.window.showInputBox({
      title: `Clone Sandbox — Notification Emails`,
      prompt: 'Comma-separated email addresses to notify (optional)',
      placeHolder: 'user1@example.com, user2@example.com',
      validateInput: (v) => {
        const trimmed = v.trim();
        if (!trimmed) return null;
        const invalid = trimmed
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
          .filter((e) => !emailRegex.test(e));
        return invalid.length ? `Invalid email(s): ${invalid.join(', ')}` : null;
      },
    });
    if (emailsStr === undefined) return;
    const emails = emailsStr
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const sandboxName = typeof node.label === 'string' ? node.label : node.sandbox.id;
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Cloning sandbox ${sandboxName}`,
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({message: node.sandbox.id});
        let sourceMarked = false;
        try {
          const odsClient = await getOdsClientFromConfig(configProvider);
          const result = await odsClient.POST('/sandboxes/{sandboxId}/clones', {
            params: {path: {sandboxId: node.sandbox.id}},
            body: {
              ttl,
              targetCount,
              ...(targetProfile ? {targetProfile} : {}),
              ...(emails.length ? {emails} : {}),
            },
          });
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox clone failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          treeProvider.markSourceCloning(node.sandbox.id);
          sourceMarked = true;
          const cloneId = result.data?.data?.cloneId;
          const siblingCloneIds = result.data?.data?.siblingCloneIds ?? undefined;
          const cloneIds = siblingCloneIds && siblingCloneIds.length > 0 ? siblingCloneIds : cloneId ? [cloneId] : [];
          if (cloneIds.length === 0) {
            vscode.window.showInformationMessage('Sandbox clone initiated.');
            treeProvider.refreshRealm(node.realm);
            treeProvider.startPollingRealm(node.realm);
            return;
          }

          vscode.window.showInformationMessage(
            cloneIds.length > 1
              ? `Sandbox clone batch initiated (${cloneIds.length} clones).`
              : `Sandbox clone initiated (cloneId: ${cloneId}).`,
          );
          treeProvider.refreshRealm(node.realm);
          treeProvider.startPollingRealm(node.realm);

          const pollResult = await pollClonesUntilTerminal(odsClient, node.sandbox.id, cloneIds, progress, token, () =>
            treeProvider.refreshRealm(node.realm),
          );

          if (pollResult.timedOut) {
            vscode.window.showWarningMessage(
              cloneIds.length > 1
                ? `${cloneIds.length} clone(s) still in progress after timeout. Use "View Clone Details" to check status.`
                : `Clone ${cloneId} still in progress after timeout. Use "View Clone Details" to check status.`,
            );
            return;
          }

          if (pollResult.failedCloneIds.length > 0) {
            vscode.window.showErrorMessage(
              cloneIds.length > 1
                ? `${pollResult.failedCloneIds.length} of ${cloneIds.length} clone(s) failed.`
                : `Clone ${cloneId} failed.`,
            );
          } else {
            vscode.window.showInformationMessage(
              cloneIds.length > 1 ? `All ${cloneIds.length} clones completed.` : `Clone ${cloneId} completed.`,
            );
          }

          // The /clones endpoint reports COMPLETED before the /sandboxes list updates the
          // source/target states. Keep the source marked and refresh a few more ticks so the
          // tree catches the final states before the "cloning" label clears.
          const sandboxId = node.sandbox.id;
          const realm = node.realm;
          for (let i = 0; i < 3; i++) {
            await new Promise((r) => setTimeout(r, CLONE_POLL_INTERVAL_MS));
            treeProvider.refreshRealm(realm);
          }
          treeProvider.unmarkSourceCloning(sandboxId);
          sourceMarked = false;
          treeProvider.refreshRealm(realm);
          treeProvider.startPollingRealm(realm);
        } catch (err) {
          if (err instanceof vscode.CancellationError) {
            // Operation cancelled — local poll stopped; server-side clone continues.
            return;
          }
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox clone failed: ${message}`);
        } finally {
          if (sourceMarked) {
            treeProvider.unmarkSourceCloning(node.sandbox.id);
          }
        }
      },
    );
  });

  const viewCloneDetails = registerSafeCommand('b2c-dx.sandbox.viewCloneDetails', async (node: SandboxTreeItem) => {
    if (!node) return;
    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: 'Fetching clone details...'},
      async () => {
        try {
          const details = await treeProvider.getSandboxWithCloneDetails(node.sandbox.id);
          if (!details) {
            vscode.window.showErrorMessage('Could not fetch clone details.');
            return;
          }
          const cloneDetails = details.cloneDetails ?? {
            clonedFrom: details.clonedFrom,
            sourceInstanceIdentifier: details.sourceInstanceIdentifier,
          };
          const content = JSON.stringify(cloneDetails, null, 2);
          const uri = vscode.Uri.parse(`${SANDBOX_DETAIL_SCHEME}:${node.label ?? node.sandbox.id}-clone.json`);
          detailProvider.setContent(uri, content);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(doc, 'json');
          await vscode.window.showTextDocument(doc, {preview: true});
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to fetch clone details: ${message}`);
        }
      },
    );
  });

  return [
    detailRegistration,
    refresh,
    addRealm,
    removeRealm,
    create,
    deleteSandbox,
    start,
    stop,
    restart,
    viewDetails,
    openBM,
    extendExpiration,
    clone,
    viewCloneDetails,
  ];
}
