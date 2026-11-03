/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * object_types_describe: compact system object type metadata (attribute
 * definitions, enum values, groups) through the SCAPI Object Definitions API.
 *
 * @module tools/object-types
 */

import {z} from 'zod';
import {
  localizedDefault,
  type ObjectAttributeDefinition,
  type ObjectAttributeGroup,
  type ObjectDefinitionsQuery,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';

const MAX_VALUES = 50;

interface ObjectTypesDescribeInput {
  objectType?: string;
  kind?: 'all' | 'custom' | 'system';
  search?: string;
  ids?: string[];
  includeValues?: boolean;
  includeGroups?: boolean;
  offset?: number;
  limit?: number;
}

interface CompactAttribute {
  id: string;
  type?: string;
  name?: string;
  system?: true;
  mandatory?: true;
  localizable?: true;
  siteSpecific?: true;
  multiValue?: true;
  values?: Array<{value: string; label?: string}>;
  valuesTruncated?: number;
}

interface ObjectTypesDescribeOutput {
  objectTypes?: Array<{objectType: string; name?: string; attributes?: number; groups?: number}>;
  objectType?: string;
  total?: number;
  offset?: number;
  nextOffset?: number;
  attributes?: CompactAttribute[];
  groups?: Array<{id: string; name?: string; attributes: string[]}>;
  notes?: string[];
}

export function compactAttribute(attr: ObjectAttributeDefinition, includeValues = true): CompactAttribute {
  const result: CompactAttribute = {id: attr.effectiveId ?? attr.id};
  if (attr.valueType) result.type = attr.valueType;
  const name = localizedDefault(attr.displayName);
  if (name) result.name = name;
  if (attr.system) result.system = true;
  if (attr.mandatory) result.mandatory = true;
  if (attr.localizable) result.localizable = true;
  if (attr.siteSpecific) result.siteSpecific = true;
  if (attr.multiValueType) result.multiValue = true;
  const values = includeValues ? (attr.valueDefinitions ?? []) : [];
  if (values.length > 0) {
    result.values = values.slice(0, MAX_VALUES).map((value) => {
      const label = localizedDefault(value.displayValue);
      return {value: String(value.value ?? ''), ...(label && label !== value.value ? {label} : {})};
    });
    if (values.length > MAX_VALUES) result.valuesTruncated = values.length - MAX_VALUES;
  }
  return result;
}

function compactGroups(groups: ObjectAttributeGroup[]): NonNullable<ObjectTypesDescribeOutput['groups']> {
  const byId = new Map<string, {id: string; name?: string; attributes: string[]}>();
  for (const group of groups) {
    if (!group.id || group.internal) continue;
    let entry = byId.get(group.id);
    if (!entry) {
      const name = localizedDefault(group.displayName);
      entry = {id: group.id, ...(name ? {name} : {}), attributes: []};
      byId.set(group.id, entry);
    }
    for (const attr of group.attributeDefinitions ?? []) {
      const id = attr.effectiveId ?? attr.id;
      if (!entry.attributes.includes(id)) entry.attributes.push(id);
    }
  }
  return [...byId.values()];
}

/**
 * Creates the object_types_describe tool.
 */
export function createObjectTypesDescribeTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ObjectTypesDescribeInput, ObjectTypesDescribeOutput>(
    {
      name: 'object_types_describe',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description:
        "List system object types, or one type's attribute definitions (effective IDs like c_color, value types, " +
        'enum values, groups). Use before writing product.custom.* or c_ field code. Custom object types are not covered. ' +
        'Scope sfcc.object-definitions; filters and values need .rw.',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      requiresInstance: false,
      usesConfigurationContext: true,
      inputSchema: {
        objectType: z.string().optional().describe('System object type ID. Omit to list object types.'),
        kind: z.enum(['all', 'custom', 'system']).optional().describe('Attribute kind. Default: all.'),
        search: z.string().optional().describe('Text in attribute ID or display name.'),
        ids: z.array(z.string()).optional().describe('Exact attribute IDs (with or without c_).'),
        includeValues: z.boolean().optional().describe(`Include enum values (up to ${MAX_VALUES} per attribute).`),
        includeGroups: z.boolean().optional().describe('Include attribute groups with their member IDs.'),
        offset: z.number().int().min(0).optional().describe('Attribute offset. Default: 0.'),
        limit: z.number().int().min(1).max(200).optional().describe('Attributes per page. Default: 100.'),
      },
      async execute(args, {services}) {
        const client = services.getObjectTypesClient();
        if (!args.objectType) {
          const types = await client.listObjectTypes();
          return {
            objectTypes: types.map((type) => {
              const name = localizedDefault(type.displayName);
              return {
                objectType: type.objectType ?? '',
                ...(name ? {name} : {}),
                attributes: type.attributeDefinitionCount,
                groups: type.attributeGroupCount,
              };
            }),
          };
        }

        const {objectType} = args;
        const ids = args.ids?.map((id) => (id.startsWith('c_') ? id.slice(2) : id));
        const kind = args.kind && args.kind !== 'all' ? args.kind : undefined;
        const query: ObjectDefinitionsQuery | undefined = ids?.length
          ? ({
              boolQuery: {
                must: [
                  {termQuery: {fields: ['id'], operator: 'one_of' as const, values: ids}},
                  ...(kind
                    ? [{termQuery: {fields: ['system'], operator: 'is' as const, values: [kind === 'system']}}]
                    : []),
                  ...(args.search ? [{textQuery: {fields: ['id', 'display_name'], searchPhrase: args.search}}] : []),
                ],
              },
            } as ObjectDefinitionsQuery)
          : undefined;
        const [attributes, groups] = await Promise.all([
          client.listAttributeDefinitions(objectType, {
            kind,
            text: args.search,
            query,
            includeValues: args.includeValues,
          }),
          args.includeGroups ? client.listAttributeGroups(objectType, {expandDefinitions: true}) : undefined,
        ]);
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 100;
        const page = attributes.slice(offset, offset + limit);
        const nextOffset = offset + page.length < attributes.length ? offset + page.length : undefined;
        const notes: string[] = [];
        if (attributes.some((attr) => attr.valueType?.startsWith('enum_')) && !args.includeValues) {
          notes.push('Enum values omitted; pass includeValues: true.');
        }
        return {
          objectType,
          total: attributes.length,
          offset,
          ...(nextOffset === undefined ? {} : {nextOffset}),
          attributes: page.map((attr) => compactAttribute(attr, Boolean(args.includeValues))),
          ...(groups ? {groups: compactGroups(groups)} : {}),
          ...(notes.length > 0 ? {notes} : {}),
        };
      },
      formatOutput: (output) => jsonResult(output, 0),
    },
    loadServices,
  );
}
