/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createScapiSchemasClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

export class ApiFamilyTreeItem extends vscode.TreeItem {
  readonly nodeType = 'apiFamily' as const;
  constructor(readonly family: string) {
    super(family, vscode.TreeItemCollapsibleState.Collapsed);
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

export class ApiSchemaTreeItem extends vscode.TreeItem {
  readonly nodeType = 'apiSchema' as const;
  readonly schema: SchemaEntry;

  constructor(schema: SchemaEntry) {
    super(schema.apiName, vscode.TreeItemCollapsibleState.None);
    this.schema = schema;
    this.description = schema.apiVersion;
    this.contextValue = 'apiSchema';

    const apiType = schema.apiFamily.startsWith('shopper') ? 'Shopper' : 'Admin';
    this.tooltip = `${schema.apiName} ${schema.apiVersion} (${apiType})`;

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

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly log: vscode.OutputChannel,
  ) {}

  refresh(): void {
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
    const config = this.configProvider.getConfig();
    if (!config?.hasOAuthConfig()) {
      return [];
    }

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

    const config = this.configProvider.getConfig();
    if (!config) return null;

    const shortCode = config.values.shortCode;
    if (!shortCode) return null;

    const hostname = config.values.hostname;
    const firstPart = hostname && typeof hostname === 'string' ? (hostname.split('.')[0] ?? '') : '';
    const tenantId = firstPart ? firstPart.replace(/-/g, '_') : '';
    if (!tenantId) return null;

    try {
      const schemas = await vscode.window.withProgress(
        {location: {viewId: 'b2cApiBrowser'}, title: 'Loading SCAPI schemas...'},
        async () => {
          const oauthStrategy = config.createOAuth();
          const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
          const orgId = toOrganizationId(tenantId);
          const {data, error, response} = await schemasClient.GET('/organizations/{organizationId}/schemas', {
            params: {path: {organizationId: orgId}},
          });
          if (error) {
            throw new Error(getApiErrorMessage(error, response));
          }
          return (data?.data ?? []) as SchemaListItem[];
        },
      );

      this.schemaCache = schemas.map((s) => ({
        apiFamily: s.apiFamily ?? '',
        apiName: s.apiName ?? '',
        apiVersion: s.apiVersion ?? 'v1',
        status: s.status,
      }));

      this.log.appendLine(`[API Browser] Loaded ${this.schemaCache.length} schemas`);
      return this.schemaCache;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[API Browser] Failed to load schemas: ${message}`);
      vscode.window.showErrorMessage(`API Browser: ${message}`);
      return null;
    }
  }
}
