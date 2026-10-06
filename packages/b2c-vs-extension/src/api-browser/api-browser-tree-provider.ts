/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createScapiSchemasClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';
import {listScapiSchemasWithFallback, type ScapiSchemaSource} from '@salesforce/b2c-tooling-sdk/scapi';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {OFFLINE_TREE_MESSAGE, OfflineWarningGate, toSchemaEntries} from './offline.js';
import {resolveApiBrowserTenantId} from './tenant.js';

export class ApiFamilyTreeItem extends vscode.TreeItem {
  readonly nodeType = 'apiFamily' as const;
  constructor(readonly family: string) {
    super(family, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `api:family:${family}`;
    this.contextValue = 'apiFamily';
    this.iconPath = new vscode.ThemeIcon('symbol-namespace');
    this.tooltip = `API Family: ${family}`;
  }
}

export interface SchemaEntry {
  apiFamily: string;
  apiName: string;
  apiVersion: string;
  status?: 'current' | 'deprecated';
}

export function isShopperSchema(schema: Pick<SchemaEntry, 'apiFamily' | 'apiName'>): boolean {
  const family = (schema.apiFamily ?? '').toLowerCase();
  const name = (schema.apiName ?? '').toLowerCase();
  return family.startsWith('shopper') || name.startsWith('shopper');
}

export class ApiSchemaTreeItem extends vscode.TreeItem {
  readonly nodeType = 'apiSchema' as const;
  readonly schema: SchemaEntry;

  constructor(schema: SchemaEntry) {
    super(schema.apiName, vscode.TreeItemCollapsibleState.None);
    this.schema = schema;
    this.id = `api:schema:${schema.apiFamily}:${schema.apiName}:${schema.apiVersion}`;
    this.description = schema.apiVersion;

    // The contextValue drives the Storefront Next "scapi add" right-click menu,
    // which is only offered for Shopper schemas (see isShopperSchema + package.json).
    const isShopper = isShopperSchema(schema);
    this.contextValue = isShopper ? 'apiSchema-shopper' : 'apiSchema-admin';

    // Tooltip type is best-effort — the authoritative classification happens
    // when the spec is loaded (see detectApiType in swagger-webview.ts) since
    // it depends on declared security schemes. For Custom APIs we can't know
    // without the spec, so just label them as such here.
    let apiType: string;
    if (schema.apiFamily === 'custom') {
      apiType = 'Custom';
    } else if (isShopper) {
      apiType = 'Shopper';
    } else {
      apiType = 'Admin';
    }
    this.tooltip = `${schema.apiName} ${schema.apiVersion} (${apiType}) — apiFamily="${schema.apiFamily}"`;

    if (schema.status === 'deprecated') {
      this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground'));
    }

    this.command = {
      command: 'b2c-dx.apiBrowser.openSwagger',
      title: 'Open API Documentation',
      arguments: [schema],
    };
  }
}

type ApiBrowserTreeNode = ApiFamilyTreeItem | ApiSchemaTreeItem;

export class ApiBrowserTreeDataProvider implements vscode.TreeDataProvider<ApiBrowserTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ApiBrowserTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private schemaCache: SchemaEntry[] | null = null;
  private loaded = false;
  private readonly offlineGate = new OfflineWarningGate();
  private readonly _onDidChangeMessage = new vscode.EventEmitter<string | undefined>();
  /** Fires with the tree view message: set while showing bundled schemas, undefined once live. */
  readonly onDidChangeMessage = this._onDidChangeMessage.event;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly log: vscode.OutputChannel,
  ) {}

  refresh(): void {
    this.loaded = true;
    this.schemaCache = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ApiBrowserTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ApiBrowserTreeNode): Promise<ApiBrowserTreeNode[]> {
    if (!element) {
      return this.getRootChildren();
    }
    if (element instanceof ApiFamilyTreeItem) {
      return this.getFamilyChildren(element);
    }
    return [];
  }

  private async getRootChildren(): Promise<ApiFamilyTreeItem[]> {
    if (!this.loaded) return [];

    const schemas = await this.loadSchemas();
    if (!schemas) return [];

    const families = Array.from(new Set(schemas.map((s) => s.apiFamily)));
    families.sort();
    return families.map((f) => new ApiFamilyTreeItem(f));
  }

  private getFamilyChildren(element: ApiFamilyTreeItem): ApiSchemaTreeItem[] {
    if (!this.schemaCache) return [];
    return this.schemaCache
      .filter((s) => s.apiFamily === element.family)
      .sort((a, b) => a.apiName.localeCompare(b.apiName))
      .map((s) => new ApiSchemaTreeItem(s));
  }

  private async loadSchemas(): Promise<SchemaEntry[] | null> {
    if (this.schemaCache) return this.schemaCache;

    try {
      const result = await vscode.window.withProgress(
        {location: {viewId: 'b2cApiBrowser'}, title: 'Loading SCAPI schemas...'},
        // The client is built inside the callback so missing configuration falls back to the bundled corpus too.
        () =>
          listScapiSchemasWithFallback({}, async () => {
            const config = this.configProvider.getConfig();
            if (!config) throw new Error('No B2C Commerce configuration found.');
            if (!config.hasOAuthConfig())
              throw new Error('Account Manager OAuth credentials are not configured (client-id and client-secret).');
            const shortCode = config.values.shortCode;
            if (!shortCode) throw new Error('short-code is not configured.');
            const tenantId = resolveApiBrowserTenantId(config.values);
            if (!tenantId) throw new Error('tenant-id is not configured.');

            const oauthOptions = await this.configProvider.getImplicitAuthOptions();
            const oauthStrategy = config.createOAuth(oauthOptions);
            const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
            const {data, error, response} = await schemasClient.GET('/organizations/{organizationId}/schemas', {
              params: {path: {organizationId: toOrganizationId(tenantId)}},
            });
            if (error) throw new Error(getApiErrorMessage(error, response));
            const items = (data?.data ?? []) as SchemaListItem[];
            return {schemas: items, total: data?.total ?? items.length};
          }),
      );

      this.schemaCache = toSchemaEntries(result.schemas);
      this.reportSource(result.source, result.warning);
      this.log.appendLine(`[API Browser] Loaded ${this.schemaCache.length} schemas (${result.source})`);
      return this.schemaCache;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[API Browser] Failed to load schemas: ${message}`);
      vscode.window.showErrorMessage(`API Browser: ${message}`);
      return null;
    }
  }

  private reportSource(source: ScapiSchemaSource, warning?: string): void {
    this._onDidChangeMessage.fire(source === 'bundled' ? OFFLINE_TREE_MESSAGE : undefined);
    if (warning) this.log.appendLine(`[API Browser] ${warning}`);
    // One notification per outage, not one per refresh.
    if (this.offlineGate.shouldWarn(source) && warning) {
      void vscode.window.showWarningMessage(`API Browser: ${warning}`);
    }
  }
}
