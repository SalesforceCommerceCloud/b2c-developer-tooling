/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ObjectTypesClient, localizedDefault} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import type {
  ObjectAttributeDefinition,
  ObjectAttributeGroup,
  ObjectTypeDefinition,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';
import {resolveApiBrowserTenantId} from '../api-browser/tenant.js';
import {
  attributeSummary,
  attributeTooltip,
  describeObjectTypesError,
  effectiveAttributeId,
  isValuesUnavailable,
  mergeAttributeGroups,
  splitAttributes,
  withEnumValues,
} from './model.js';

export const VIEW_ID = 'b2cObjectTypesExplorer';

export class ObjectTypeTreeItem extends vscode.TreeItem {
  readonly nodeType = 'objectType' as const;
  constructor(readonly definition: ObjectTypeDefinition) {
    super(definition.objectType!, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `ot:type:${definition.objectType}`;
    this.contextValue = 'objectType';
    this.iconPath = new vscode.ThemeIcon('symbol-class');
    const name = localizedDefault(definition.displayName);
    if (name && name !== definition.objectType) this.description = name;
    this.tooltip = localizedDefault(definition.description) ?? name ?? definition.objectType;
  }
}

type FolderKind = 'custom' | 'groups' | 'system';

const FOLDER_LABELS: Record<FolderKind, string> = {
  custom: 'Custom Attributes',
  groups: 'Attribute Groups',
  system: 'System Attributes',
};

export class FolderTreeItem extends vscode.TreeItem {
  readonly nodeType = 'folder' as const;
  constructor(
    readonly objectType: string,
    readonly kind: FolderKind,
    count: number,
  ) {
    super(
      FOLDER_LABELS[kind],
      count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    );
    this.id = `ot:folder:${objectType}:${kind}`;
    this.contextValue = `objectTypeFolder-${kind}`;
    this.description = String(count);
    this.iconPath = new vscode.ThemeIcon(kind === 'groups' ? 'folder-library' : 'folder');
  }
}

export class AttributeTreeItem extends vscode.TreeItem {
  readonly nodeType = 'attribute' as const;
  constructor(
    readonly objectType: string,
    readonly attribute: ObjectAttributeDefinition,
    parentId: string,
  ) {
    const values = attribute.valueDefinitions ?? [];
    super(
      attribute.id,
      values.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    );
    this.id = `${parentId}:attr:${attribute.id}`;
    // Menus match `^objectAttribute-`; custom enums also get value commands.
    this.contextValue = attribute.system
      ? 'objectAttribute-system'
      : attribute.valueType?.startsWith('enum_of_')
        ? 'objectAttribute-custom-enum'
        : 'objectAttribute-custom';
    this.description = attributeSummary(attribute);
    this.tooltip = new vscode.MarkdownString(attributeTooltip(attribute));
    this.iconPath = new vscode.ThemeIcon(values.length > 0 ? 'symbol-enum' : 'symbol-field');
    this.command = {
      command: 'b2c-dx.objectTypes.openAttribute',
      title: 'Open Attribute Definition',
      arguments: [this],
    };
  }

  get effectiveId(): string {
    return effectiveAttributeId(this.attribute);
  }
}

export class GroupTreeItem extends vscode.TreeItem {
  readonly nodeType = 'group' as const;
  constructor(
    readonly objectType: string,
    readonly group: ObjectAttributeGroup,
  ) {
    const count = group.attributeDefinitions?.length ?? 0;
    super(group.id!, count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    this.id = `ot:group:${objectType}:${group.id}`;
    this.contextValue = 'objectAttributeGroup';
    const name = localizedDefault(group.displayName);
    this.description = name && name !== group.id ? `${name} (${count})` : String(count);
    this.tooltip = localizedDefault(group.description) ?? name ?? group.id;
    this.iconPath = new vscode.ThemeIcon('group-by-ref-type');
  }
}

export class EnumValueTreeItem extends vscode.TreeItem {
  readonly nodeType = 'enumValue' as const;
  constructor(
    readonly objectType: string,
    readonly attribute: ObjectAttributeDefinition,
    readonly value: string,
    readonly display: string | undefined,
    parentId: string,
  ) {
    super(value, vscode.TreeItemCollapsibleState.None);
    this.id = `${parentId}:value:${value}`;
    this.contextValue = attribute.system ? 'objectAttributeValue-system' : 'objectAttributeValue-custom';
    const isDefault = attribute.defaultValue?.value === value;
    const parts = [display && display !== value ? display : undefined, isDefault ? '(default)' : undefined];
    this.description = parts.filter(Boolean).join(' ') || undefined;
    this.iconPath = new vscode.ThemeIcon(isDefault ? 'star-full' : 'symbol-constant');
  }
}

type ObjectTypesNode = AttributeTreeItem | EnumValueTreeItem | FolderTreeItem | GroupTreeItem | ObjectTypeTreeItem;

interface ObjectTypeDetails {
  custom: ObjectAttributeDefinition[];
  system: ObjectAttributeDefinition[];
  groups: ObjectAttributeGroup[];
}

/**
 * Tree of system object types, their attributes, and attribute groups, read
 * from the Object Definitions API. Nothing is requested until the user loads
 * the view; failures are shown in the view instead of as repeated pop-ups.
 */
export class ObjectTypesTreeDataProvider implements vscode.TreeDataProvider<ObjectTypesNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<ObjectTypesNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly _onDidChangeMessage = new vscode.EventEmitter<string | undefined>();
  /** Fires with the tree view message (errors, missing enum values), or undefined to clear it. */
  readonly onDidChangeMessage = this._onDidChangeMessage.event;

  private loaded = false;
  private types: ObjectTypeDefinition[] | null = null;
  private readonly details = new Map<string, Promise<ObjectTypeDetails>>();
  private valuesUnavailable = false;
  private client: ObjectTypesClient | null = null;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly log: vscode.OutputChannel,
  ) {}

  /** Loads (or reloads) the view. The first call is what makes the view talk to the instance. */
  refresh(): void {
    this.loaded = true;
    this.types = null;
    this.details.clear();
    this.client = null;
    this.valuesUnavailable = false;
    this._onDidChangeMessage.fire(undefined);
    this._onDidChangeTreeData.fire();
  }

  /** Reloads one object type after a change, keeping the rest of the tree. */
  invalidate(objectType: string): void {
    this.details.delete(objectType);
    this._onDidChangeTreeData.fire();
  }

  /** Clears cached data after a configuration change; stays unloaded if it was never loaded. */
  reset(): void {
    if (this.loaded) this.refresh();
  }

  getTreeItem(element: ObjectTypesNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ObjectTypesNode): Promise<ObjectTypesNode[]> {
    if (!element) return this.getRootChildren();
    if (element instanceof ObjectTypeTreeItem) return this.getTypeChildren(element.definition.objectType!);
    if (element instanceof FolderTreeItem) return this.getFolderChildren(element);
    if (element instanceof GroupTreeItem) {
      return (element.group.attributeDefinitions ?? [])
        .filter((attr) => attr.id)
        .map((attr) => new AttributeTreeItem(element.objectType, attr, element.id!));
    }
    if (element instanceof AttributeTreeItem) {
      return (element.attribute.valueDefinitions ?? []).map(
        (value) =>
          new EnumValueTreeItem(
            element.objectType,
            element.attribute,
            String(value.value ?? ''),
            localizedDefault(value.displayValue),
            element.id!,
          ),
      );
    }
    return [];
  }

  /** The API client for the configured instance; throws a readable error when configuration is missing. */
  async getClient(): Promise<ObjectTypesClient> {
    if (this.client) return this.client;
    const config = this.configProvider.getConfig();
    if (!config) throw new Error('No B2C Commerce configuration found.');
    if (!config.hasOAuthConfig()) throw new Error('Account Manager API client (client-id) is not configured.');
    const shortCode = config.values.shortCode;
    if (!shortCode) throw new Error('short-code is not configured.');
    const tenantId = resolveApiBrowserTenantId(config.values);
    if (!tenantId) throw new Error('tenant-id is not configured.');
    const auth = config.createOAuth(await this.configProvider.getUserAuthOptions());
    this.client = new ObjectTypesClient({shortCode, tenantId, auth});
    return this.client;
  }

  private showError(context: string, error: unknown, objectType?: string): void {
    const {message} = describeObjectTypesError(error, objectType);
    this.log.appendLine(`[Object Types] ${context}: ${error instanceof Error ? error.message : String(error)}`);
    this._onDidChangeMessage.fire(message);
  }

  private async getRootChildren(): Promise<ObjectTypeTreeItem[]> {
    if (!this.loaded) return [];
    if (!this.types) {
      try {
        const client = await this.getClient();
        const types = await vscode.window.withProgress(
          {location: {viewId: VIEW_ID}, title: 'Loading object types...'},
          () => client.listObjectTypes(),
        );
        this.types = types.filter((type) => type.objectType).sort((a, b) => a.objectType!.localeCompare(b.objectType!));
        this.log.appendLine(`[Object Types] Loaded ${this.types.length} object types`);
      } catch (error) {
        this.showError('Failed to load object types', error);
        return [];
      }
    }
    return this.types.map((type) => new ObjectTypeTreeItem(type));
  }

  private loadDetails(objectType: string): Promise<ObjectTypeDetails> {
    let pending = this.details.get(objectType);
    if (!pending) {
      pending = this.fetchDetails(objectType);
      // Do not cache failures, so expanding again retries.
      pending.catch(() => this.details.delete(objectType));
      this.details.set(objectType, pending);
    }
    return pending;
  }

  private async fetchDetails(objectType: string): Promise<ObjectTypeDetails> {
    const client = await this.getClient();
    const [attributes, groups] = await Promise.all([
      client.listAttributeDefinitions(objectType),
      client.listAttributeGroups(objectType, {expandDefinitions: true}),
    ]);
    const split = splitAttributes(attributes);
    const {system} = split;
    let {custom} = split;

    // Enum values come from the attribute search, which needs the .rw scope;
    // without it the view still shows every attribute.
    if (!this.valuesUnavailable && custom.some((attr) => attr.valueType?.startsWith('enum_of_'))) {
      try {
        const searched = await client.listAttributeDefinitions(objectType, {kind: 'custom', includeValues: true});
        custom = withEnumValues(custom, searched);
      } catch (error) {
        if (!isValuesUnavailable(error)) throw error;
        this.valuesUnavailable = true;
        this.log.appendLine(`[Object Types] Enum values unavailable: ${String(error)}`);
        this._onDidChangeMessage.fire(
          'Enum values are not shown: they need the sfcc.object-definitions.rw scope (or are blocked by safety mode).',
        );
      }
    }
    return {custom, system, groups: mergeAttributeGroups(groups)};
  }

  private async getTypeChildren(objectType: string): Promise<FolderTreeItem[]> {
    try {
      const details = await this.loadDetails(objectType);
      return [
        new FolderTreeItem(objectType, 'custom', details.custom.length),
        new FolderTreeItem(objectType, 'groups', details.groups.length),
        new FolderTreeItem(objectType, 'system', details.system.length),
      ];
    } catch (error) {
      this.showError(`Failed to load ${objectType}`, error, objectType);
      return [];
    }
  }

  private async getFolderChildren(folder: FolderTreeItem): Promise<ObjectTypesNode[]> {
    const details = await this.loadDetails(folder.objectType).catch(() => undefined);
    if (!details) return [];
    if (folder.kind === 'groups') return details.groups.map((group) => new GroupTreeItem(folder.objectType, group));
    return details[folder.kind].map((attr) => new AttributeTreeItem(folder.objectType, attr, folder.id!));
  }
}
