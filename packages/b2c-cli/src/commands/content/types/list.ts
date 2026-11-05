/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {
  InstanceCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesUnavailableError,
  listComponentTypes,
  listPageTypes,
  type ExperienceComponentType,
  type ExperiencePageType,
} from '@salesforce/b2c-tooling-sdk/operations/content';

export interface ContentTypeListItem {
  id: string;
  kind: 'component' | 'page';
  name: string;
  group: string;
  regions: string[];
  attributes: number;
  archType: string;
}

function localized(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const map = value as Record<string, string>;
    return map.default ?? Object.values(map)[0] ?? '';
  }
  return '';
}

export function toTypeListItem(
  type: ExperienceComponentType | ExperiencePageType,
  kind: 'component' | 'page',
): ContentTypeListItem {
  return {
    id: type.id,
    kind,
    name: localized(type.name),
    group: 'group' in type ? (type.group?.id ?? '') : '',
    regions: (type.regionDefinitions ?? []).map((r) => r.id),
    attributes: (type.attributeDefinitionGroups ?? []).reduce((n, g) => n + (g.attributeDefinitions?.length ?? 0), 0),
    archType: type.archType ?? '',
  };
}

const COLUMNS: Record<string, ColumnDef<ContentTypeListItem>> = {
  id: {header: 'ID', get: (t) => t.id},
  kind: {header: 'KIND', get: (t) => t.kind},
  name: {header: 'NAME', get: (t) => t.name},
  group: {header: 'GROUP', get: (t) => t.group || '-'},
  regions: {header: 'REGIONS', get: (t) => t.regions.join(', ') || '-'},
  attributes: {header: 'ATTRS', get: (t) => String(t.attributes)},
  archType: {header: 'ARCH', get: (t) => t.archType || '-', extended: true},
};

const DEFAULT_COLUMNS = ['id', 'kind', 'name', 'regions', 'attributes'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class ContentTypesList extends InstanceCommand<typeof ContentTypesList> {
  static description =
    'List the Page Designer page and component types deployed for a site (live, from the Experiences API)';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --kind component',
    '<%= config.bin %> <%= command.id %> --kind page --json',
  ];

  static flags = {
    'site-id': Flags.string({
      description: 'Site ID whose cartridge path defines the types; defaults to siteId from configuration',
    }),
    kind: Flags.string({
      description: 'Only list page or component types',
      options: ['page', 'component'],
    }),
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {listComponentTypes, listPageTypes};

  async run(): Promise<{data: ContentTypeListItem[]}> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) {
      this.error('Site ID is required. Use --site-id or set siteId in your configuration.');
    }

    const kind = this.flags.kind as 'component' | 'page' | undefined;
    const items: ContentTypeListItem[] = [];
    try {
      if (kind !== 'component') {
        const pages = await this.operations.listPageTypes(this.instance, {siteId});
        items.push(...pages.map((t) => toTypeListItem(t, 'page')));
      }
      if (kind !== 'page') {
        const components = await this.operations.listComponentTypes(this.instance, {siteId});
        items.push(...components.map((t) => toTypeListItem(t, 'component')));
      }
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError) this.error(error.message);
      throw error;
    }

    if (this.jsonEnabled()) return {data: items};

    if (items.length === 0) {
      ux.stdout('No types found.');
      return {data: items};
    }
    tableRenderer.render(items, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    return {data: items};
  }
}
