/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Content slots and slot configurations through the SCAPI Admin Experiences
 * API (`experience/experiences/v1`).
 *
 * Slots are defined by templates and cannot be created through the API; only
 * their configurations can. Platform behavior verified against a live
 * instance and not in the spec:
 *
 * - `slotContent.type` is snake_case on the wire (`content_assets`,
 *   `recommended_products`); the spec's camelCase values are rejected.
 *   {@link toWireSlotContentType} normalizes either form.
 * - PATCH fails unless the body carries `slotContent`, so
 *   {@link updateSlotConfiguration} merges the current content back in.
 * - DELETE returns 204 even when the configuration does not exist.
 *
 * @module operations/content/slots
 */
import type {B2CInstance} from '../../instance/index.js';
import type {ExperienceSlot, ExperienceSlotConfiguration} from '../../clients/scapi-experiences.js';
import {
  experiencesContext,
  experiencesRequestFailure as requestFailure,
  experiencesUnavailable,
  READ_HEADERS,
  WRITE_HEADERS,
} from './experiences.js';

export type SlotContextType = 'category' | 'folder' | 'global';

/** Slot content types as accepted by the API (snake_case). */
export type SlotContentType = 'categories' | 'content_assets' | 'html' | 'products' | 'recommended_products';

const SLOT_CONTENT_TYPES: Record<string, SlotContentType> = {
  categories: 'categories',
  contentassets: 'content_assets',
  html: 'html',
  products: 'products',
  recommendedproducts: 'recommended_products',
};

/** Normalizes `contentAssets`, `content_assets`, `content-assets` (any case) to the wire value. */
export function toWireSlotContentType(type: string): SlotContentType {
  const wire = SLOT_CONTENT_TYPES[type.toLowerCase().replaceAll(/[-_]/g, '')];
  if (!wire) {
    throw new Error(`Unknown slot content type "${type}". Use one of: ${Object.values(SLOT_CONTENT_TYPES).join(', ')}`);
  }
  return wire;
}

/** A slot configuration as sent to `createOrUpdateSlotConfiguration`. */
export interface SlotConfigurationInput {
  configurationId?: string;
  context?: SlotContextType;
  contextId?: string;
  enabled?: boolean;
  default?: boolean;
  description?: string;
  rank?: number;
  template?: string;
  customerGroups?: string[];
  schedule?: {startDate?: string; endDate?: string; [key: string]: unknown};
  slotContent?: {
    type: string;
    contentAssetIds?: string[];
    productIds?: string[];
    categoryIds?: string[];
    recommendationRuleId?: string;
    /** HTML per locale. Writes must use `source`; `markup` is returned on read and ignored on write. */
    body?: Record<string, {source?: string; markup?: string}>;
  };
  [key: string]: unknown;
}

export interface SlotSiteOptions {
  siteId: string;
}

export interface SearchSlotConfigurationsOptions extends SlotSiteOptions {
  slotId?: string;
  /** Filters on the configuration's `context` field (applied to the search). */
  context?: SlotContextType;
  /** Page size (max 200). Omit with `all` to walk every page. */
  limit?: number;
  offset?: number;
  /** Walk all pages (ignores `offset`). */
  all?: boolean;
}

export interface SearchSlotsOptions extends SlotSiteOptions {
  slotId?: string;
  contextType?: SlotContextType;
  limit?: number;
  offset?: number;
  all?: boolean;
}

export interface SlotSearchResult<T> {
  total: number;
  hits: T[];
}

const SEARCH_PAGE_SIZE = 200;

function searchQuery(terms: Array<[field: string, value: string | undefined]>): Record<string, unknown> {
  const queries = terms
    .filter((t): t is [string, string] => Boolean(t[1]))
    .map(([field, value]) => ({termQuery: {fields: [field], operator: 'is', values: [value]}}));
  if (queries.length === 0) return {matchAllQuery: {}};
  if (queries.length === 1) return queries[0];
  return {boolQuery: {must: queries}};
}

async function search<T>(
  instance: B2CInstance,
  path: '/organizations/{organizationId}/slot-configurations-search' | '/organizations/{organizationId}/slot-search',
  query: Record<string, unknown>,
  options: {siteId: string; limit?: number; offset?: number; all?: boolean},
  what: string,
): Promise<SlotSearchResult<T>> {
  const {client, organizationId} = experiencesContext(instance);
  const hits: T[] = [];
  let offset = options.all ? 0 : (options.offset ?? 0);
  let total = 0;
  for (;;) {
    const limit = options.all ? SEARCH_PAGE_SIZE : (options.limit ?? 25);
    let result;
    try {
      result = await client.POST(path, {
        params: {path: {organizationId}, query: {siteId: options.siteId}},
        body: {query, limit, offset} as never,
        headers: READ_HEADERS,
      });
    } catch (error) {
      throw experiencesUnavailable(error, undefined, what);
    }
    const {data, error, response} = result;
    if (!data) throw requestFailure(error, response, what);
    const page = ((data as {hits?: T[]}).hits ?? []) as T[];
    total = (data as {total?: number}).total ?? page.length;
    hits.push(...page);
    offset += page.length;
    if (!options.all || page.length === 0 || offset >= total) break;
  }
  return {total, hits};
}

/**
 * Searches a site's slots (each hit embeds its configurations).
 *
 * @throws ExperiencesUnavailableError when the API cannot be used
 * @throws ExperiencesRequestError when the API rejects the request
 */
export async function searchSlots(
  instance: B2CInstance,
  options: SearchSlotsOptions,
): Promise<SlotSearchResult<ExperienceSlot>> {
  const query = searchQuery([
    ['slotId', options.slotId],
    ['contextType', options.contextType],
  ]);
  return search<ExperienceSlot>(
    instance,
    '/organizations/{organizationId}/slot-search',
    query,
    options,
    `Failed to search slots for site ${options.siteId}`,
  );
}

/**
 * Gets one slot with its configurations.
 *
 * @throws ExperiencesRequestError with status 404 when the slot does not exist
 */
export async function getSlot(
  instance: B2CInstance,
  slotId: string,
  contextType: SlotContextType,
  options: SlotSiteOptions,
): Promise<ExperienceSlot> {
  const {client, organizationId} = experiencesContext(instance);
  const what = `Failed to get slot ${slotId} (${contextType})`;
  let result;
  try {
    result = await client.GET('/organizations/{organizationId}/slots/{slotId}/{contextType}', {
      params: {path: {organizationId, slotId, contextType}, query: {siteId: options.siteId}},
      headers: READ_HEADERS,
    });
  } catch (error) {
    throw experiencesUnavailable(error, undefined, what);
  }
  if (!result.data) throw requestFailure(result.error, result.response, what);
  return result.data as ExperienceSlot;
}

/**
 * Searches slot configurations, optionally for one slot and context.
 *
 * @throws ExperiencesUnavailableError when the API cannot be used
 * @throws ExperiencesRequestError when the API rejects the request
 */
export async function searchSlotConfigurations(
  instance: B2CInstance,
  options: SearchSlotConfigurationsOptions,
): Promise<SlotSearchResult<ExperienceSlotConfiguration>> {
  const query = searchQuery([
    ['slotId', options.slotId],
    ['context', options.context],
  ]);
  return search<ExperienceSlotConfiguration>(
    instance,
    '/organizations/{organizationId}/slot-configurations-search',
    query,
    options,
    `Failed to search slot configurations for site ${options.siteId}`,
  );
}

const CONFIG_PATH = '/organizations/{organizationId}/slots/{slotId}/slot-configurations/{configurationId}' as const;

/**
 * Gets a slot configuration.
 *
 * @throws ExperiencesRequestError with status 404 when it does not exist
 */
export async function getSlotConfiguration(
  instance: B2CInstance,
  slotId: string,
  configurationId: string,
  options: SlotSiteOptions & {context?: SlotContextType},
): Promise<ExperienceSlotConfiguration> {
  const {client, organizationId} = experiencesContext(instance);
  const what = `Failed to get slot configuration ${slotId}/${configurationId}`;
  let result;
  try {
    result = await client.GET(CONFIG_PATH, {
      params: {
        path: {organizationId, slotId, configurationId},
        query: {siteId: options.siteId, ...(options.context ? {context: options.context} : {})},
      },
      headers: READ_HEADERS,
    });
  } catch (error) {
    throw experiencesUnavailable(error, undefined, what);
  }
  if (!result.data) throw requestFailure(result.error, result.response, what);
  return result.data as ExperienceSlotConfiguration;
}

function normalizeInput(input: SlotConfigurationInput): SlotConfigurationInput {
  if (!input.slotContent?.type) return input;
  return {...input, slotContent: {...input.slotContent, type: toWireSlotContentType(input.slotContent.type)}};
}

/** Result of {@link putSlotConfiguration}. */
export interface PutSlotConfigurationResult {
  status: 'created' | 'updated';
  configuration: ExperienceSlotConfiguration;
}

/**
 * Creates or replaces a slot configuration. `slotContent` and `template` are
 * required by the platform. The slot itself must already exist (404 otherwise).
 *
 * @throws ExperiencesRequestError when the API rejects the configuration
 */
export async function putSlotConfiguration(
  instance: B2CInstance,
  slotId: string,
  configurationId: string,
  input: SlotConfigurationInput,
  options: SlotSiteOptions,
): Promise<PutSlotConfigurationResult> {
  const {client, organizationId} = experiencesContext(instance);
  const what = `Failed to save slot configuration ${slotId}/${configurationId}`;
  const body = {context: 'global', ...normalizeInput(input), configurationId};
  let result;
  try {
    result = await client.PUT(CONFIG_PATH, {
      params: {path: {organizationId, slotId, configurationId}, query: {siteId: options.siteId}},
      body: body as never,
      headers: WRITE_HEADERS,
    });
  } catch (error) {
    throw experiencesUnavailable(error, undefined, what);
  }
  if (!result.data) throw requestFailure(result.error, result.response, what);
  return {
    status: result.response.status === 201 ? 'created' : 'updated',
    configuration: result.data as ExperienceSlotConfiguration,
  };
}

/**
 * Partially updates a slot configuration. The platform rejects a PATCH
 * without `slotContent`, so when the change omits it the current content is
 * read and sent back unchanged.
 *
 * @throws ExperiencesRequestError when the configuration does not exist or the change is rejected
 */
export async function updateSlotConfiguration(
  instance: B2CInstance,
  slotId: string,
  configurationId: string,
  changes: SlotConfigurationInput,
  options: SlotSiteOptions & {context?: SlotContextType},
): Promise<ExperienceSlotConfiguration> {
  let body = normalizeInput(changes);
  if (!body.slotContent) {
    const current = await getSlotConfiguration(instance, slotId, configurationId, options);
    if (current.slotContent)
      body = {...body, slotContent: current.slotContent as SlotConfigurationInput['slotContent']};
  }
  const {client, organizationId} = experiencesContext(instance);
  const what = `Failed to update slot configuration ${slotId}/${configurationId}`;
  let result;
  try {
    result = await client.PATCH(CONFIG_PATH, {
      params: {
        path: {organizationId, slotId, configurationId},
        query: {siteId: options.siteId, ...(options.context ? {context: options.context} : {})},
      },
      body: body as never,
      headers: WRITE_HEADERS,
    });
  } catch (error) {
    throw experiencesUnavailable(error, undefined, what);
  }
  if (!result.data) throw requestFailure(result.error, result.response, what);
  return result.data as ExperienceSlotConfiguration;
}

/**
 * Deletes a slot configuration. The platform returns success even when the
 * configuration does not exist.
 */
export async function deleteSlotConfiguration(
  instance: B2CInstance,
  slotId: string,
  configurationId: string,
  options: SlotSiteOptions & {context?: SlotContextType},
): Promise<void> {
  const {client, organizationId} = experiencesContext(instance);
  const what = `Failed to delete slot configuration ${slotId}/${configurationId}`;
  let result;
  try {
    result = await client.DELETE(CONFIG_PATH, {
      params: {
        path: {organizationId, slotId, configurationId},
        query: {siteId: options.siteId, ...(options.context ? {context: options.context} : {})},
      },
      headers: WRITE_HEADERS,
    });
  } catch (error) {
    throw experiencesUnavailable(error, undefined, what);
  }
  if (!result.response.ok) throw requestFailure(result.error, result.response, what);
}
