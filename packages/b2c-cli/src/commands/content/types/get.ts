/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesUnavailableError,
  listComponentTypes,
  listPageTypes,
  type ExperienceComponentType,
  type ExperiencePageType,
} from '@salesforce/b2c-tooling-sdk/operations/content';

type AnyType = ExperienceComponentType | ExperiencePageType;

function localized(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const map = value as Record<string, string>;
    return map.default ?? Object.values(map)[0] ?? '';
  }
  return '';
}

export function formatType(found: AnyType & {kind: 'component' | 'page'}): string {
  const lines: string[] = [];
  lines.push(`${ux.colorize('bold', found.id)} (${found.kind}${found.archType ? `, ${found.archType}` : ''})`);
  const name = localized(found.name);
  const description = localized(found.description);
  if (name) lines.push(`  Name: ${name}`);
  if (description) lines.push(`  Description: ${description}`);
  if ('route' in found && found.route) lines.push(`  Route: ${found.route}`);
  if ('group' in found && found.group) lines.push(`  Group: ${found.group.id}`);

  const regions = found.regionDefinitions ?? [];
  lines.push('', ux.colorize('bold', 'Regions'));
  if (regions.length === 0) lines.push('  (none)');
  for (const r of regions) {
    const extras: string[] = [];
    if (r.maxComponents !== undefined) extras.push(`max ${r.maxComponents}`);
    const exclusions = r.componentTypeExclusions ?? [];
    if (exclusions.length > 0) extras.push(`excludes ${exclusions.map((e) => e.typeId).join(', ')}`);
    lines.push(`  ${r.id}${extras.length > 0 ? ` (${extras.join('; ')})` : ''}`);
  }

  lines.push('', ux.colorize('bold', 'Attributes'));
  const attributes = (found.attributeDefinitionGroups ?? []).flatMap((g) => g.attributeDefinitions ?? []);
  if (attributes.length === 0) lines.push('  (none)');
  for (const a of attributes) {
    const parts = [a.type ?? 'unknown'];
    if (a.required) parts.push('required');
    if (a.values && a.values.length > 0) parts.push(`values: ${a.values.join(', ')}`);
    if (a.defaultValue !== undefined) parts.push(`default: ${String(a.defaultValue)}`);
    lines.push(`  ${a.id} (${parts.join('; ')})`);
  }
  return lines.join('\n');
}

export default class ContentTypesGet extends InstanceCommand<typeof ContentTypesGet> {
  static args = {
    typeId: Args.string({
      description: 'Page or component type ID (for example "homePage" or "Content.hero")',
      required: true,
    }),
  };

  static description = 'Show a Page Designer page or component type with its regions and attributes';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Content.hero',
    '<%= config.bin %> <%= command.id %> homePage --site-id RefArch --json',
  ];

  static flags = {
    'site-id': Flags.string({
      description: 'Site ID whose cartridge path defines the types; defaults to siteId from configuration',
    }),
  };

  protected operations = {listComponentTypes, listPageTypes};

  async run(): Promise<AnyType & {kind: 'component' | 'page'}> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) {
      this.error('Site ID is required. Use --site-id or set siteId in your configuration.');
    }
    // Accept library XML style IDs too.
    const typeId = this.args.typeId.replace(/^(page|component)\./, '');

    let found: (AnyType & {kind: 'component' | 'page'}) | undefined;
    try {
      const pages = await this.operations.listPageTypes(this.instance, {siteId});
      const page = pages.find((t) => t.id === typeId);
      if (page) {
        found = {...page, kind: 'page'};
      } else {
        const components = await this.operations.listComponentTypes(this.instance, {siteId});
        const component = components.find((t) => t.id === typeId);
        if (component) found = {...component, kind: 'component'};
      }
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError) this.error(error.message);
      throw error;
    }

    if (!found) {
      this.error(
        `Type "${typeId}" is not deployed for site ${siteId}. Run "content types list" to see available types.`,
      );
    }

    if (this.jsonEnabled()) return found;

    ux.stdout(formatType(found));
    return found;
  }
}
