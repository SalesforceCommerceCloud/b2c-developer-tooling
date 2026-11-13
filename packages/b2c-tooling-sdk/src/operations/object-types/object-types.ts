/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {toOrganizationId} from '../../clients/custom-apis.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {
  createObjectDefinitionsClient,
  type ObjectAttributeDefinition,
  type ObjectAttributeGroup,
  type ObjectDefinitionsClient,
  type ObjectDefinitionsQuery,
  type ObjectTypeDefinition,
} from '../../clients/object-definitions.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import type {AuthStrategy} from '../../auth/types.js';

const PAGE_SIZE = 200;
const READ = {[SCOPE_MODE_HEADER]: 'read'};
const WRITE = {[SCOPE_MODE_HEADER]: 'write'};
const SELECT_ALL = '(**)';

/** Connection details for {@link ObjectTypesClient}. */
export interface ObjectTypesConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
}

/** Options for attribute definition listing. */
export interface ListAttributeDefinitionsOptions {
  /** Only custom (`system: false`) or only system attributes. */
  kind?: 'custom' | 'system';
  /**
   * Include enum `valueDefinitions`. The API only returns them from the search
   * endpoint, which requires the `sfcc.object-definitions.rw` scope.
   */
  includeValues?: boolean;
  /** Free-text filter over id and display name (requires `.rw` scope). */
  text?: string;
  /** Restrict to attributes assigned to this group (requires `.rw` scope). */
  group?: string;
  /** Raw search query; overrides `kind`, `text`, and `group`. */
  query?: ObjectDefinitionsQuery;
}

/** Options for attribute group listing. */
export interface ListAttributeGroupsOptions {
  /** Inline the assigned attribute definitions of each group. */
  expandDefinitions?: boolean;
}

/**
 * Normalizes a user-supplied attribute ID. The API addresses custom attributes
 * by their plain ID (`bagType`), not their effective ID (`c_bagType`).
 */
export function normalizeAttributeId(id: string): string {
  return id.startsWith('c_') ? id.slice(2) : id;
}

/** Returns a localized string's default value (or its first value). */
export function localizedDefault(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, string>;
  return record.default ?? Object.values(record)[0];
}

function buildAttributeQuery(options: ListAttributeDefinitionsOptions): ObjectDefinitionsQuery {
  if (options.query) return options.query;
  const clauses: ObjectDefinitionsQuery[] = [];
  if (options.kind) {
    clauses.push({termQuery: {fields: ['system'], operator: 'is', values: [options.kind === 'system']}});
  }
  if (options.group) {
    clauses.push({termQuery: {fields: ['group'], operator: 'is', values: [options.group]}});
  }
  if (options.text) {
    clauses.push({textQuery: {fields: ['id', 'display_name'], searchPhrase: options.text}});
  }
  if (clauses.length === 0) return {matchAllQuery: {}};
  if (clauses.length === 1) return clauses[0];
  // Cast: chai augments Object with `should`, which confuses the BoolQuery literal check.
  return {boolQuery: {must: clauses}} as ObjectDefinitionsQuery;
}

/**
 * Operations over the SCAPI Object Definitions API: system object types,
 * attribute definitions, and attribute groups.
 *
 * List methods page through all results. Attribute IDs may be passed with or
 * without the `c_` prefix.
 *
 * @example
 * ```ts
 * const ot = new ObjectTypesClient(instance.scapiClientConfig!);
 * const attrs = await ot.listAttributeDefinitions('Product', {kind: 'custom'});
 * ```
 */
export class ObjectTypesClient {
  readonly client: ObjectDefinitionsClient;
  readonly organizationId: string;

  constructor(config: ObjectTypesConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    this.client = createObjectDefinitionsClient({shortCode: config.shortCode, tenantId: config.tenantId}, config.auth);
  }

  /** Assigns an attribute definition to a group. */
  async assignAttributeToGroup(objectType: string, groupId: string, attributeId: string): Promise<void> {
    const {error, response} = await this.client.PUT(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups/{groupId}/attribute-definitions/{defId}',
      {
        params: {path: {...this.typePath(objectType), groupId, defId: normalizeAttributeId(attributeId)}},
        headers: WRITE,
      },
    );
    if (error || !response.ok) {
      throw createScapiRequestError(error, response, `Failed to assign ${attributeId} to group ${groupId}`);
    }
  }

  /**
   * Creates or fully replaces an attribute definition. Properties omitted from
   * `definition` are reset to their defaults; use
   * {@link updateAttributeDefinition} for partial changes.
   */
  async createOrReplaceAttributeDefinition(
    objectType: string,
    definition: ObjectAttributeDefinition,
  ): Promise<{created: boolean; definition: ObjectAttributeDefinition}> {
    const id = normalizeAttributeId(definition.id);
    const {data, error, response} = await this.client.PUT(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-definitions/{id}',
      {params: {path: {...this.typePath(objectType), id}}, body: {...definition, id}, headers: WRITE},
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to write attribute ${id}`);
    return {created: response.status === 201, definition: data};
  }

  /**
   * Creates or fully replaces an attribute group. Replacing a group removes
   * its attribute assignments.
   */
  async createOrReplaceAttributeGroup(
    objectType: string,
    group: ObjectAttributeGroup,
  ): Promise<{created: boolean; group: ObjectAttributeGroup}> {
    const id = group.id!;
    const {data, error, response} = await this.client.PUT(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups/{id}',
      {params: {path: {...this.typePath(objectType), id}}, body: {...group, id}, headers: WRITE},
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to write attribute group ${id}`);
    return {created: response.status === 201, group: data};
  }

  /** Deletes a custom attribute definition. */
  async deleteAttributeDefinition(objectType: string, attributeId: string): Promise<void> {
    const id = normalizeAttributeId(attributeId);
    const {error, response} = await this.client.DELETE(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-definitions/{id}',
      {params: {path: {...this.typePath(objectType), id}}, headers: WRITE},
    );
    if (error || !response.ok) throw createScapiRequestError(error, response, `Failed to delete attribute ${id}`);
  }

  /** Deletes an attribute group. */
  async deleteAttributeGroup(objectType: string, groupId: string): Promise<void> {
    const {error, response} = await this.client.DELETE(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups/{id}',
      {params: {path: {...this.typePath(objectType), id: groupId}}, headers: WRITE},
    );
    if (error || !response.ok) {
      throw createScapiRequestError(error, response, `Failed to delete attribute group ${groupId}`);
    }
  }

  /**
   * Gets one attribute definition. With `includeValues`, uses the search
   * endpoint so enum `valueDefinitions` are returned (requires `.rw` scope).
   */
  async getAttributeDefinition(
    objectType: string,
    attributeId: string,
    options: {includeValues?: boolean} = {},
  ): Promise<ObjectAttributeDefinition> {
    const id = normalizeAttributeId(attributeId);
    if (options.includeValues) {
      const hits = await this.searchAttributeDefinitions(objectType, {
        termQuery: {fields: ['id'], operator: 'is', values: [id]},
      });
      const match = hits.find((hit) => hit.id === id);
      if (match) return match;
    }
    const {data, error, response} = await this.client.GET(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-definitions/{id}',
      {params: {path: {...this.typePath(objectType), id}, query: {select: SELECT_ALL}}, headers: READ},
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to get attribute ${id}`);
    return data;
  }

  /** Gets one attribute group, optionally with its assigned definitions. */
  async getAttributeGroup(
    objectType: string,
    groupId: string,
    options: ListAttributeGroupsOptions = {},
  ): Promise<ObjectAttributeGroup> {
    const {data, error, response} = await this.client.GET(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups/{id}',
      {
        params: {
          path: {...this.typePath(objectType), id: groupId},
          query: {select: SELECT_ALL, ...(options.expandDefinitions ? {expand: 'definition'} : {})},
        },
        headers: READ,
      },
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to get attribute group ${groupId}`);
    return data;
  }

  /** Gets one system object type with its attribute and group counts. */
  async getObjectType(objectType: string): Promise<ObjectTypeDefinition> {
    const {data, error, response} = await this.client.GET(
      '/organizations/{organizationId}/system/object-types/{objectType}',
      {params: {path: this.typePath(objectType)}, headers: READ},
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to get object type ${objectType}`);
    return data;
  }

  /**
   * Lists attribute definitions of an object type. Filtering and enum values
   * go through the search endpoint (requires `.rw` scope); a plain listing
   * uses the list endpoint and works with the read-only scope.
   */
  async listAttributeDefinitions(
    objectType: string,
    options: ListAttributeDefinitionsOptions = {},
  ): Promise<ObjectAttributeDefinition[]> {
    const needsSearch = Boolean(
      options.kind || options.text || options.group || options.query || options.includeValues,
    );
    if (needsSearch) return this.searchAttributeDefinitions(objectType, buildAttributeQuery(options));

    return this.paginate((offset) =>
      this.client.GET('/organizations/{organizationId}/system/object-types/{objectType}/attribute-definitions', {
        params: {path: this.typePath(objectType), query: {select: SELECT_ALL, limit: PAGE_SIZE, offset}},
        headers: READ,
      }),
    );
  }

  /** Lists attribute groups of an object type. */
  async listAttributeGroups(
    objectType: string,
    options: ListAttributeGroupsOptions = {},
  ): Promise<ObjectAttributeGroup[]> {
    return this.paginate((offset) =>
      this.client.GET('/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups', {
        params: {
          path: this.typePath(objectType),
          query: {
            select: SELECT_ALL,
            limit: PAGE_SIZE,
            offset,
            ...(options.expandDefinitions ? {expand: 'definition'} : {}),
          },
        },
        headers: READ,
      }),
    );
  }

  /**
   * Lists system object types. Custom object types are not addressable by
   * this API; they appear as unnamed `CustomObject` entries and are omitted.
   */
  async listObjectTypes(): Promise<ObjectTypeDefinition[]> {
    const types = await this.paginate((offset) =>
      this.client.GET('/organizations/{organizationId}/system/object-types', {
        params: {path: {organizationId: this.organizationId}, query: {select: SELECT_ALL, limit: PAGE_SIZE, offset}},
        headers: READ,
      }),
    );
    return types.filter((type) => type.objectType !== 'CustomObject');
  }

  /** Runs an attribute definition search and returns all hits (requires `.rw` scope). */
  async searchAttributeDefinitions(
    objectType: string,
    query: ObjectDefinitionsQuery,
  ): Promise<ObjectAttributeDefinition[]> {
    return this.paginate(async (offset) => {
      const result = await this.client.POST(
        '/organizations/{organizationId}/system/object-types/{objectType}/attribute-definition-search',
        {params: {path: this.typePath(objectType)}, body: {query, limit: PAGE_SIZE, offset}, headers: READ},
      );
      return {...result, data: result.data ? {...result.data, data: result.data.hits} : undefined};
    });
  }

  /** Removes an attribute definition from a group. */
  async unassignAttributeFromGroup(objectType: string, groupId: string, attributeId: string): Promise<void> {
    const {error, response} = await this.client.DELETE(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups/{groupId}/attribute-definitions/{defId}',
      {
        params: {path: {...this.typePath(objectType), groupId, defId: normalizeAttributeId(attributeId)}},
        headers: WRITE,
      },
    );
    if (error || !response.ok) {
      throw createScapiRequestError(error, response, `Failed to unassign ${attributeId} from group ${groupId}`);
    }
  }

  /**
   * Partially updates an attribute definition. `valueType` cannot be changed,
   * and enum values (`valueDefinitions`) are ignored by the API.
   */
  async updateAttributeDefinition(
    objectType: string,
    attributeId: string,
    changes: Partial<ObjectAttributeDefinition>,
  ): Promise<ObjectAttributeDefinition> {
    const id = normalizeAttributeId(attributeId);
    const {data, error, response} = await this.client.PATCH(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-definitions/{id}',
      {params: {path: {...this.typePath(objectType), id}}, body: {...changes, id}, headers: WRITE},
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to update attribute ${id}`);
    return data;
  }

  /** Partially updates an attribute group. */
  async updateAttributeGroup(
    objectType: string,
    groupId: string,
    changes: Partial<ObjectAttributeGroup>,
  ): Promise<ObjectAttributeGroup> {
    const {data, error, response} = await this.client.PATCH(
      '/organizations/{organizationId}/system/object-types/{objectType}/attribute-groups/{id}',
      {params: {path: {...this.typePath(objectType), id: groupId}}, body: {...changes, id: groupId}, headers: WRITE},
    );
    if (error || !data) throw createScapiRequestError(error, response, `Failed to update attribute group ${groupId}`);
    return data;
  }

  private async paginate<T>(
    fetchPage: (offset: number) => Promise<{
      data?: {data?: T[]; total?: number};
      error?: unknown;
      response: Response;
    }>,
  ): Promise<T[]> {
    const items: T[] = [];
    let offset = 0;
    for (;;) {
      const {data, error, response} = await fetchPage(offset);
      if (error || !data) throw createScapiRequestError(error, response, 'Object Definitions request failed');
      const page = data.data ?? [];
      items.push(...page);
      offset += page.length;
      if (page.length === 0 || data.total === undefined || offset >= data.total) break;
    }
    return items;
  }

  private typePath(objectType: string): {organizationId: string; objectType: string} {
    return {organizationId: this.organizationId, objectType};
  }
}
