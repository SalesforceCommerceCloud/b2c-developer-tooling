/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {
  ExperiencesUnavailableError,
  fetchExperienceTypes,
  type ExperienceTypes,
  type ExperiencesUnavailableReason,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {ExperienceComponentType, ExperiencePageType} from '@salesforce/b2c-tooling-sdk/clients';
import * as vscode from 'vscode';
import type {ContentConfigProvider} from './content-config.js';

type ExperienceType = ExperienceComponentType | ExperiencePageType;

type TypesNodeKind = 'root' | 'group' | 'type' | 'info';

/** Short, user-facing explanation for each unavailability reason (full message goes in the tooltip). */
export const UNAVAILABLE_LABELS: Record<ExperiencesUnavailableReason | 'no-site', string> = {
  'no-site': 'Set a site ID (siteId in dw.json) to show live types',
  'not-configured': 'Live types need a short code and tenant ID',
  'unsupported-auth': 'Live types need client credentials (not browser sign-in)',
  'missing-scope': 'Live types need the sfcc.experiences scope',
  error: 'Could not read live types',
};

function localized(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const map = value as Record<string, string>;
    return map.default ?? Object.values(map)[0];
  }
  return undefined;
}

/** Markdown summary of a type's regions and attributes, for tooltips. */
export function describeType(type: ExperienceType): string {
  const lines = [`**${type.id}**${localized(type.name) ? ` — ${localized(type.name)}` : ''}`];
  const regions = type.regionDefinitions ?? [];
  if (regions.length > 0) {
    lines.push('', 'Regions:');
    for (const r of regions)
      lines.push(`- \`${r.id}\`${r.maxComponents === undefined ? '' : ` (max ${r.maxComponents})`}`);
  }
  const attributes = (type.attributeDefinitionGroups ?? []).flatMap((g) => g.attributeDefinitions ?? []);
  if (attributes.length > 0) {
    lines.push('', 'Attributes:');
    for (const a of attributes) {
      const values = a.values?.length ? `: ${a.values.join(' | ')}` : '';
      lines.push(`- \`${a.id}\` ${a.type ?? ''}${a.required ? ' (required)' : ''}${values}`);
    }
  }
  return lines.join('\n');
}

export class ExperienceTypesNode extends vscode.TreeItem {
  constructor(
    readonly kind: TypesNodeKind,
    label: string,
    readonly options: {group?: 'component' | 'page'; type?: ExperienceType; tooltip?: string} = {},
  ) {
    super(
      label,
      kind === 'root' || kind === 'group'
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );
    this.contextValue = `experienceTypes.${kind}`;
    if (kind === 'root') {
      this.id = 'experienceTypes:root';
      this.iconPath = new vscode.ThemeIcon('symbol-namespace');
      this.tooltip = 'Page and component types available to the site, read live from the Experiences API.';
    } else if (kind === 'group') {
      this.id = `experienceTypes:group:${options.group}`;
      this.iconPath = new vscode.ThemeIcon(options.group === 'page' ? 'file-code' : 'symbol-class');
    } else if (kind === 'type' && options.type) {
      this.id = `experienceTypes:${options.group}:${options.type.id}`;
      this.description = localized(options.type.name);
      this.iconPath = new vscode.ThemeIcon(options.group === 'page' ? 'file-code' : 'symbol-class');
      this.tooltip = new vscode.MarkdownString(describeType(options.type));
      this.command = {
        command: 'b2c-dx.content.openType',
        title: 'Open Type Definition',
        arguments: [options.type],
      };
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
      if (options.tooltip) this.tooltip = options.tooltip;
    }
  }
}

type Loaded = {ok: true; types: ExperienceTypes} | {ok: false; label: string; message: string};

/**
 * Supplies the optional "Page Designer Types" branch of the content tree.
 * Every failure (no site, no scope, browser auth, API error) becomes an info
 * row instead of an error toast, so the library browsing experience is unchanged
 * for configurations without Experiences API access.
 */
export class ExperienceTypesSource {
  private loading: Promise<Loaded> | undefined;

  constructor(private readonly configProvider: ContentConfigProvider) {}

  clear(): void {
    this.loading = undefined;
  }

  root(): ExperienceTypesNode {
    const node = new ExperienceTypesNode('root', 'Page Designer Types');
    const siteId = this.configProvider.getSiteId();
    if (siteId) node.description = siteId;
    return node;
  }

  async getChildren(node: ExperienceTypesNode): Promise<ExperienceTypesNode[]> {
    if (node.kind !== 'root' && node.kind !== 'group') return [];
    const loaded = await this.load();
    if (!loaded.ok) {
      return node.kind === 'root' ? [new ExperienceTypesNode('info', loaded.label, {tooltip: loaded.message})] : [];
    }
    const {pageTypes, componentTypes} = loaded.types;
    if (node.kind === 'root') {
      const pages = new ExperienceTypesNode('group', 'Page Types', {group: 'page'});
      pages.description = String(pageTypes.length);
      const components = new ExperienceTypesNode('group', 'Component Types', {group: 'component'});
      components.description = String(componentTypes.length);
      return [pages, components];
    }
    const group = node.options.group ?? 'component';
    const list: ExperienceType[] = group === 'page' ? pageTypes : componentTypes;
    return [...list]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((type) => new ExperienceTypesNode('type', type.id, {group, type}));
  }

  private load(): Promise<Loaded> {
    this.loading ??= this.fetch();
    return this.loading;
  }

  private async fetch(): Promise<Loaded> {
    const instance = this.configProvider.getInstance();
    const siteId = this.configProvider.getSiteId();
    if (!instance || !siteId) {
      return {ok: false, label: UNAVAILABLE_LABELS['no-site'], message: UNAVAILABLE_LABELS['no-site']};
    }
    try {
      return {ok: true, types: await fetchExperienceTypes(instance, {siteId})};
    } catch (error) {
      // Do not cache failures; a refresh (or fixing config) should retry.
      this.loading = undefined;
      if (error instanceof ExperiencesUnavailableError) {
        return {ok: false, label: UNAVAILABLE_LABELS[error.reason], message: error.message};
      }
      const message = error instanceof Error ? error.message : String(error);
      return {ok: false, label: UNAVAILABLE_LABELS.error, message};
    }
  }
}
