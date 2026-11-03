/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * System object type metadata: attribute definitions and attribute groups,
 * through the SCAPI Object Definitions API.
 *
 * @example
 * ```ts
 * import {ObjectTypesClient} from '@salesforce/b2c-tooling-sdk/operations/object-types';
 *
 * const ot = new ObjectTypesClient(instance.scapiClientConfig!);
 * const custom = await ot.listAttributeDefinitions('Product', {kind: 'custom'});
 * ```
 *
 * @module operations/object-types
 */
export {ObjectTypesClient, localizedDefault, normalizeAttributeId} from './object-types.js';
export {
  buildObjectTypeExtensionsXml,
  parseObjectTypeExtensions,
  valueTypeToXmlType,
  xmlTypeToValueType,
} from './meta-xml.js';
export type {
  MetaAttributeDefinition,
  MetaAttributeGroup,
  MetaAttributeReference,
  ObjectTypeExtension,
  ParsedObjectTypeExtensions,
} from './meta-xml.js';
export {buildCustomAttributeTypes, customAttributePropertyTypes, generateCustomAttributeTypes} from './script-types.js';
export type {
  CustomAttributeTypeSource,
  CustomAttributeTypesResult,
  GenerateCustomAttributeTypesOptions,
} from './script-types.js';
export {applyObjectTypeSync, exportObjectTypes, importObjectTypeExtensions, planObjectTypeSync} from './sync.js';
export type {
  ExportObjectTypesOptions,
  ImportObjectTypeExtensionsOptions,
  ObjectTypeImportItem,
  ObjectTypeSyncAction,
  ObjectTypeSyncPlan,
  ObjectTypeSyncWarning,
} from './sync.js';
export type {ListAttributeDefinitionsOptions, ListAttributeGroupsOptions, ObjectTypesConfig} from './object-types.js';
export type {
  ObjectAttributeDefinition,
  ObjectAttributeGroup,
  ObjectAttributeValueDefinition,
  ObjectAttributeValueType,
  ObjectDefinitionsQuery,
  ObjectTypeDefinition,
} from '../../clients/object-definitions.js';
