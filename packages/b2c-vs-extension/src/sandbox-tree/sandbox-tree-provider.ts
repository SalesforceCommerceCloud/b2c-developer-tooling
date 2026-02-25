/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createOdsClient} from '@salesforce/b2c-tooling-sdk/clients';
import * as vscode from 'vscode';
import type {SandboxConfigProvider, SandboxInfo} from './sandbox-config.js';

const DEFAULT_ODS_HOST = 'admin.dx.commercecloud.salesforce.com';

const STATE_ICONS: Record<string, vscode.ThemeIcon> = {
  started: new vscode.ThemeIcon('vm-running', new vscode.ThemeColor('testing.iconPassed')),
  stopped: new vscode.ThemeIcon('vm', new vscode.ThemeColor('disabledForeground')),
  starting: new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.yellow')),
  stopping: new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.yellow')),
  creating: new vscode.ThemeIcon('loading~spin', new vscode.ThemeColor('charts.yellow')),
  failed: new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed')),
  deleting: new vscode.ThemeIcon('trash', new vscode.ThemeColor('charts.yellow')),
};
const DEFAULT_ICON = new vscode.ThemeIcon('vm');

type SandboxTreeNode = RealmTreeItem | SandboxTreeItem;

export class RealmTreeItem extends vscode.TreeItem {
  readonly nodeType = 'realm' as const;
  constructor(readonly realm: string) {
    super(realm, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'realm';
    this.iconPath = new vscode.ThemeIcon('server-environment');
    this.tooltip = `Realm: ${realm}`;
  }
}

export class SandboxTreeItem extends vscode.TreeItem {
  readonly nodeType = 'sandbox' as const;
  constructor(
    readonly sandbox: SandboxInfo,
    readonly realm: string,
  ) {
    const label = sandbox.instance
      ? `${sandbox.realm ?? ''}${sandbox.realm ? '-' : ''}${sandbox.instance}`
      : sandbox.id;
    super(label, vscode.TreeItemCollapsibleState.None);

    const state = (sandbox.state ?? 'unknown').toLowerCase();
    this.description = state;
    this.iconPath = STATE_ICONS[state] ?? DEFAULT_ICON;
    this.contextValue = `sandbox-${state}`;

    const lines: string[] = [`ID: ${sandbox.id}`];
    if (sandbox.hostName) lines.push(`Host: ${sandbox.hostName}`);
    if (sandbox.state) lines.push(`State: ${sandbox.state}`);
    if (sandbox.createdAt) lines.push(`Created: ${sandbox.createdAt}`);
    if (sandbox.eol) lines.push(`EOL: ${sandbox.eol}`);
    this.tooltip = new vscode.MarkdownString(lines.join('\n\n'));
  }
}

const TRANSITIONAL_STATES = new Set(['creating', 'starting', 'stopping', 'deleting']);
const MAX_POLL_DURATION_MS = 10 * 60_000;

function getPollIntervalMs(): number {
  const seconds = vscode.workspace.getConfiguration('b2c-dx').get<number>('sandbox.pollingInterval', 10);
  return seconds * 1000;
}

export class SandboxTreeDataProvider implements vscode.TreeDataProvider<SandboxTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SandboxTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private pollingTimers = new Map<string, ReturnType<typeof setInterval>>();

  constructor(private readonly configProvider: SandboxConfigProvider) {}

  refresh(): void {
    this.configProvider.clearCache();
    this._onDidChangeTreeData.fire();
  }

  /** Invalidate cache for a single realm and refresh only its subtree. */
  refreshRealm(realm: string): void {
    this.configProvider.invalidateRealm(realm);
    // Fire change for the matching RealmTreeItem so only its children re-fetch
    this._onDidChangeTreeData.fire();
  }

  /**
   * Poll a realm until all its sandboxes reach a stable state.
   * Automatically stops after MAX_POLL_DURATION_MS.
   */
  startPollingRealm(realm: string): void {
    // Don't start duplicate polling for the same realm
    if (this.pollingTimers.has(realm)) return;

    const startTime = Date.now();
    const pollIntervalMs = getPollIntervalMs();
    const timer = setInterval(async () => {
      if (Date.now() - startTime > MAX_POLL_DURATION_MS) {
        this.stopPollingRealm(realm);
        return;
      }
      this.refreshRealm(realm);

      // Check if all sandboxes have reached stable states
      // Give the tree a moment to fetch, then check cache
      setTimeout(() => {
        const sandboxes = this.configProvider.getCachedSandboxes(realm);
        if (!sandboxes) return; // still loading
        const hasTransitional = sandboxes.some((s) => TRANSITIONAL_STATES.has((s.state ?? '').toLowerCase()));
        if (!hasTransitional) {
          this.stopPollingRealm(realm);
        }
      }, 3000);
    }, pollIntervalMs);

    this.pollingTimers.set(realm, timer);
  }

  stopPollingRealm(realm: string): void {
    const timer = this.pollingTimers.get(realm);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(realm);
    }
  }

  stopAllPolling(): void {
    for (const timer of this.pollingTimers.values()) {
      clearInterval(timer);
    }
    this.pollingTimers.clear();
  }

  getTreeItem(element: SandboxTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SandboxTreeNode): Promise<SandboxTreeNode[]> {
    if (!element) {
      return this.getRootChildren();
    }
    if (element instanceof RealmTreeItem) {
      return this.getRealmChildren(element);
    }
    return [];
  }

  private getRootChildren(): RealmTreeItem[] {
    const configProvider = this.configProvider.getConfigProvider();
    if (!configProvider.getConfig()?.hasOAuthConfig()) {
      return [];
    }

    // Auto-add configured realm if list is empty (like content tree auto-adds contentLibrary)
    const realms = this.configProvider.getRealms();
    if (realms.length === 0) {
      const configuredRealm = this.configProvider.getConfiguredRealm();
      if (configuredRealm) {
        this.configProvider.addRealm(configuredRealm);
      }
    }

    return this.configProvider.getRealms().map((realm) => new RealmTreeItem(realm));
  }

  private async getRealmChildren(element: RealmTreeItem): Promise<SandboxTreeItem[]> {
    const cached = this.configProvider.getCachedSandboxes(element.realm);
    if (cached) {
      return cached.map((s) => new SandboxTreeItem(s, element.realm));
    }

    const configProvider = this.configProvider.getConfigProvider();
    const config = configProvider.getConfig();
    if (!config?.hasOAuthConfig()) {
      return [];
    }

    try {
      const sandboxes = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Fetching sandboxes for realm ${element.realm}...`},
        async () => {
          const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
          const authStrategy = config.createOAuth();
          const odsClient = createOdsClient({host}, authStrategy);
          const result = await odsClient.GET('/sandboxes', {
            params: {
              query: {
                include_deleted: false,
                filter_params: `realm=${element.realm}`,
              },
            },
          });
          if (result.error) {
            throw new Error(getApiErrorMessage(result.error, result.response));
          }
          return (result.data?.data ?? []) as SandboxInfo[];
        },
      );
      this.configProvider.setCachedSandboxes(element.realm, sandboxes);
      return sandboxes.map((s) => new SandboxTreeItem(s, element.realm));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Sandboxes (${element.realm}): ${message}`);
      return [];
    }
  }

  /** Fetch a single sandbox's details from the API. */
  async getSandboxDetails(sandboxId: string): Promise<SandboxInfo | undefined> {
    const configProvider = this.configProvider.getConfigProvider();
    const config = configProvider.getConfig();
    if (!config?.hasOAuthConfig()) return undefined;

    const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
    const authStrategy = config.createOAuth();
    const odsClient = createOdsClient({host}, authStrategy);
    const result = await odsClient.GET('/sandboxes/{sandboxId}', {
      params: {path: {sandboxId}},
    });
    if (result.error || !result.data?.data) return undefined;
    return result.data.data as unknown as SandboxInfo;
  }
}
