/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import {Flags} from '@oclif/core';
import type {ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {ExperienceSlotConfiguration} from '@salesforce/b2c-tooling-sdk/clients';
import type {SlotConfigurationInput, SlotContextType} from '@salesforce/b2c-tooling-sdk/operations/content';

/** Flat, table-friendly view of a slot configuration (also the `--json` shape for list). */
export interface SlotConfigurationRow {
  slotId: string;
  configurationId: string;
  context: string;
  contextId: string;
  enabled: boolean;
  active: boolean;
  default: boolean;
  rank?: number;
  contentType: string;
  content: string[];
  customerGroups: string[];
  schedule: string;
  template: string;
}

/** Content IDs (assets, products, categories), the rule ID, or `(html)`. */
export function slotContentIds(content: ExperienceSlotConfiguration['slotContent'] | undefined): string[] {
  if (!content) return [];
  const c = content as Record<string, unknown>;
  for (const key of ['contentAssetIds', 'productIds', 'categoryIds']) {
    if (Array.isArray(c[key])) return c[key] as string[];
  }
  if (typeof c.recommendationRuleId === 'string') return [c.recommendationRuleId];
  if (c.body) return ['(html)'];
  return [];
}

export function toSlotConfigurationRow(c: ExperienceSlotConfiguration): SlotConfigurationRow {
  const schedule = c.schedule as undefined | {endDate?: string; startDate?: string};
  const window =
    schedule?.startDate || schedule?.endDate ? `${schedule.startDate ?? '…'} → ${schedule.endDate ?? '…'}` : '';
  return {
    slotId: c.slotId ?? '',
    configurationId: c.configurationId ?? '',
    context: c.context ?? '',
    contextId: c.contextId ?? '',
    enabled: c.enabled ?? false,
    active: isConfigurationActive(c),
    default: c.default ?? false,
    rank: c.rank,
    contentType: (c.slotContent as undefined | {type?: string})?.type ?? '',
    content: slotContentIds(c.slotContent),
    customerGroups: c.customerGroups ?? [],
    schedule: window,
    template: c.template ?? '',
  };
}

/**
 * Whether a configuration is currently live. The platform returns
 * `assignmentInformation.active` although the published spec omits it.
 */
export function isConfigurationActive(c: ExperienceSlotConfiguration): boolean {
  return (c.assignmentInformation as undefined | {active?: boolean})?.active ?? false;
}

const yesNo = (v: boolean) => (v ? 'yes' : 'no');

export const SLOT_CONFIG_COLUMNS: Record<string, ColumnDef<SlotConfigurationRow>> = {
  slotId: {header: 'SLOT', get: (r) => r.slotId},
  configurationId: {header: 'CONFIGURATION', get: (r) => r.configurationId},
  context: {header: 'CONTEXT', get: (r) => (r.contextId ? `${r.context}:${r.contextId}` : r.context)},
  enabled: {header: 'ENABLED', get: (r) => yesNo(r.enabled)},
  active: {header: 'ACTIVE', get: (r) => yesNo(r.active)},
  default: {header: 'DEFAULT', get: (r) => yesNo(r.default), extended: true},
  rank: {header: 'RANK', get: (r) => (r.rank === undefined ? '-' : String(r.rank)), extended: true},
  contentType: {header: 'TYPE', get: (r) => r.contentType || '-'},
  content: {header: 'CONTENT', get: (r) => r.content.join(', ') || '-'},
  customerGroups: {header: 'GROUPS', get: (r) => r.customerGroups.join(', ') || '-', extended: true},
  schedule: {header: 'SCHEDULE', get: (r) => r.schedule || '-', extended: true},
  template: {header: 'TEMPLATE', get: (r) => r.template || '-', extended: true},
};

export const SLOT_CONFIG_DEFAULT_COLUMNS = [
  'slotId',
  'configurationId',
  'context',
  'enabled',
  'active',
  'contentType',
  'content',
];

export const CONTEXT_OPTIONS = ['global', 'category', 'folder'];

/** Flags shared by `content slot config put` and `update` that build a configuration body. */
export const SLOT_CONFIG_INPUT_FLAGS = {
  file: Flags.string({
    char: 'f',
    description: 'JSON file with the configuration body (flags override its fields)',
  }),
  'content-assets': Flags.string({description: 'Comma-separated content asset IDs (type content_assets)'}),
  products: Flags.string({description: 'Comma-separated product IDs (type products)'}),
  categories: Flags.string({description: 'Comma-separated category IDs (type categories)'}),
  html: Flags.string({description: 'HTML markup for the default locale (type html)'}),
  template: Flags.string({description: 'Slot rendering template, for example slots/content/htmlslotcontainer.isml'}),
  context: Flags.string({description: 'Configuration context', options: CONTEXT_OPTIONS}),
  'context-id': Flags.string({description: 'Category or folder ID for category/folder context'}),
  enabled: Flags.boolean({description: 'Enable the configuration', allowNo: true}),
  default: Flags.boolean({description: 'Make this the default configuration of the slot', allowNo: true}),
  rank: Flags.integer({description: 'Rank used to order configurations'}),
  'customer-groups': Flags.string({description: 'Comma-separated customer group IDs'}),
  'start-date': Flags.string({description: 'Schedule start (ISO 8601)'}),
  'end-date': Flags.string({description: 'Schedule end (ISO 8601)'}),
  description: Flags.string({description: 'Configuration description'}),
};

type InputFlags = {
  [K in keyof typeof SLOT_CONFIG_INPUT_FLAGS]?: K extends 'default' | 'enabled'
    ? boolean
    : K extends 'rank'
      ? number
      : string;
};

const csv = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function slotContentFromFlags(flags: InputFlags): SlotConfigurationInput['slotContent'] {
  const contentFlags = (['content-assets', 'products', 'categories', 'html'] as const).filter(
    (k) => flags[k] !== undefined,
  );
  if (contentFlags.length > 1) {
    throw new Error(`Use only one of --${contentFlags.join(', --')}`);
  }
  if (flags['content-assets'] !== undefined) {
    return {type: 'content_assets', contentAssetIds: csv(flags['content-assets'])};
  }
  if (flags.products !== undefined) {
    return {type: 'products', productIds: csv(flags.products)};
  }
  if (flags.categories !== undefined) {
    return {type: 'categories', categoryIds: csv(flags.categories)};
  }
  if (flags.html !== undefined) {
    return {type: 'html', body: {default: {source: flags.html}}};
  }
  return undefined;
}

/**
 * Builds a configuration body from an optional JSON file plus flags. Flags
 * override file fields. Throws on conflicting content flags.
 */
export async function buildSlotConfigurationInput(flags: InputFlags): Promise<SlotConfigurationInput> {
  let input: SlotConfigurationInput = {};
  if (flags.file) {
    const raw = await fs.promises.readFile(flags.file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${flags.file} must contain a JSON object`);
    }
    input = parsed as SlotConfigurationInput;
  }

  const slotContent = slotContentFromFlags(flags);
  if (slotContent) input.slotContent = slotContent;

  if (flags.template !== undefined) input.template = flags.template;
  if (flags.context !== undefined) input.context = flags.context as SlotContextType;
  if (flags['context-id'] !== undefined) input.contextId = flags['context-id'];
  if (flags.enabled !== undefined) input.enabled = flags.enabled;
  if (flags.default !== undefined) input.default = flags.default;
  if (flags.rank !== undefined) input.rank = flags.rank;
  if (flags.description !== undefined) input.description = flags.description;
  if (flags['customer-groups'] !== undefined) input.customerGroups = csv(flags['customer-groups']);
  if (flags['start-date'] !== undefined || flags['end-date'] !== undefined) {
    input.schedule = {
      ...input.schedule,
      ...(flags['start-date'] === undefined ? {} : {startDate: flags['start-date']}),
      ...(flags['end-date'] === undefined ? {} : {endDate: flags['end-date']}),
    };
  }
  return input;
}
