/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as xml2js from 'xml2js';
import type {
  ObjectAttributeDefinition,
  ObjectAttributeValueDefinition,
  ObjectAttributeValueType,
} from '../../clients/object-definitions.js';

const METADATA_NS = 'http://www.demandware.com/xml/impex/metadata/2006-10-31';

type Localized = Record<string, string>;
type Mutable<T> = {-readonly [K in keyof T]?: T[K]};
type XmlNode = Record<string, unknown> & {$?: Record<string, string>; _?: string};

/** An attribute definition as described in metadata XML (writable view of the API shape). */
export type MetaAttributeDefinition = Mutable<ObjectAttributeDefinition> & {id: string};

/** An attribute group as described in metadata XML. */
export interface MetaAttributeGroup {
  id: string;
  displayName?: Localized;
  description?: Localized;
  /** Assigned attributes (plain IDs, without `c_`). */
  attributes: MetaAttributeReference[];
}

/** A group's reference to an attribute definition. */
export interface MetaAttributeReference {
  id: string;
  /** True for system attributes (`system="true"` in XML). */
  system?: boolean;
}

/**
 * Desired definitions for one system object type: the content of a
 * `<type-extension>` element in `meta/system-objecttype-extensions.xml`.
 */
export interface ObjectTypeExtension {
  objectType: string;
  /** Custom attribute definitions. */
  attributes: MetaAttributeDefinition[];
  /** Overrides of system attribute definitions (display name, visibility, ...). */
  systemAttributes: MetaAttributeDefinition[];
  groups: MetaAttributeGroup[];
}

/** Result of {@link parseObjectTypeExtensions}. */
export interface ParsedObjectTypeExtensions {
  extensions: ObjectTypeExtension[];
  /** Custom object type IDs found in the file; the Object Definitions API cannot manage them. */
  skippedCustomTypes: string[];
}

function text(node: unknown): string | undefined {
  if (node === undefined || node === null) return undefined;
  if (typeof node === 'string') return node;
  const value = (node as XmlNode)._;
  return typeof value === 'string' ? value : '';
}

function first(parent: XmlNode, key: string): unknown {
  const value = parent[key];
  return Array.isArray(value) ? value[0] : undefined;
}

function all(parent: XmlNode | undefined, key: string): XmlNode[] {
  const value = parent?.[key];
  return Array.isArray(value) ? (value as XmlNode[]) : [];
}

function localized(parent: XmlNode, key: string): Localized | undefined {
  const nodes = all(parent, key);
  if (nodes.length === 0) return undefined;
  const result: Localized = {};
  for (const node of nodes) {
    const lang = typeof node === 'string' ? undefined : node.$?.['xml:lang'];
    result[!lang || lang === 'x-default' ? 'default' : lang] = text(node) ?? '';
  }
  return result;
}

function bool(parent: XmlNode, key: string): boolean | undefined {
  const value = text(first(parent, key))?.trim();
  return value === undefined ? undefined : value === 'true';
}

function num(parent: XmlNode, key: string): number | undefined {
  const value = text(first(parent, key))?.trim();
  return value === undefined || value === '' ? undefined : Number(value);
}

/** Converts a metadata XML attribute type (`set-of-string`) to the API value type (`set_of_string`). */
export function xmlTypeToValueType(type: string): ObjectAttributeValueType {
  return type.trim().replaceAll('-', '_') as ObjectAttributeValueType;
}

/** Converts an API value type (`enum_of_int`) to the metadata XML attribute type (`enum-of-int`). */
export function valueTypeToXmlType(type: string): string {
  return type.replaceAll('_', '-');
}

function parseAttribute(node: XmlNode, custom: boolean): MetaAttributeDefinition {
  const attr: MetaAttributeDefinition = {id: node.$?.['attribute-id'] ?? ''};
  const set = <K extends keyof MetaAttributeDefinition>(key: K, value: MetaAttributeDefinition[K] | undefined) => {
    if (value !== undefined) attr[key] = value;
  };
  set('displayName', localized(node, 'display-name'));
  set('description', localized(node, 'description'));
  if (custom) {
    const type = text(first(node, 'type'));
    if (type) attr.valueType = xmlTypeToValueType(type);
    set('localizable', bool(node, 'localizable-flag'));
    set('siteSpecific', bool(node, 'site-specific-flag'));
    set('mandatory', bool(node, 'mandatory-flag'));
    set('externallyManaged', bool(node, 'externally-managed-flag'));
    set('externallyDefined', bool(node, 'externally-defined-flag'));
  }
  set('visible', bool(node, 'visible-flag'));
  set('orderRequired', bool(node, 'order-required-flag'));
  set('minLength', num(node, 'min-length'));
  set('fieldLength', num(node, 'field-length'));
  set('fieldHeight', num(node, 'field-height'));
  set('unit', localized(node, 'unit'));
  set('scale', num(node, 'scale'));
  set('minValue', num(node, 'min-value'));
  set('maxValue', num(node, 'max-value'));
  set('regularExpression', text(first(node, 'regex')));
  set('multiValueType', bool(node, 'select-multiple-flag'));

  const valuesNode = first(node, 'value-definitions') as XmlNode | undefined;
  if (valuesNode && typeof valuesNode === 'object') {
    attr.valueDefinitions = all(valuesNode, 'value-definition').map((value) => {
      const definition: Mutable<ObjectAttributeValueDefinition> = {value: text(first(value, 'value'))?.trim() ?? ''};
      const display = localized(value, 'display');
      if (display) definition.displayValue = display;
      return definition;
    });
  }
  const defaultValue = text(first(node, 'default-value'));
  if (defaultValue !== undefined) attr.defaultValue = {value: defaultValue};
  return attr;
}

/**
 * Parses metadata XML (`system-objecttype-extensions.xml` or any file with a
 * `<metadata>` root) into desired object type definitions. Custom object
 * types (`<custom-type>`) are reported in `skippedCustomTypes`.
 */
export async function parseObjectTypeExtensions(xml: string): Promise<ParsedObjectTypeExtensions> {
  const parsed = (await xml2js.parseStringPromise(xml)) as Record<string, XmlNode>;
  const root = parsed.metadata;
  if (!root) throw new Error('Not a metadata XML file: expected a <metadata> root element.');

  const extensions = all(root, 'type-extension').map((ext): ObjectTypeExtension => {
    const customDefs = first(ext, 'custom-attribute-definitions') as XmlNode | undefined;
    const systemDefs = first(ext, 'system-attribute-definitions') as XmlNode | undefined;
    const groupDefs = first(ext, 'group-definitions') as XmlNode | undefined;
    return {
      objectType: ext.$?.['type-id'] ?? '',
      attributes: all(customDefs, 'attribute-definition').map((node) => parseAttribute(node, true)),
      systemAttributes: all(systemDefs, 'attribute-definition').map((node) => parseAttribute(node, false)),
      groups: all(groupDefs, 'attribute-group').map((group) => {
        const result: MetaAttributeGroup = {
          id: group.$?.['group-id'] ?? '',
          attributes: all(group, 'attribute').map((ref) => ({
            id: ref.$?.['attribute-id'] ?? '',
            ...(ref.$?.system === 'true' ? {system: true} : {}),
          })),
        };
        const displayName = localized(group, 'display-name');
        const description = localized(group, 'description');
        if (displayName) result.displayName = displayName;
        if (description) result.description = description;
        return result;
      }),
    };
  });
  const skippedCustomTypes = all(root, 'custom-type').map((type) => type.$?.['type-id'] ?? '');
  return {extensions, skippedCustomTypes};
}

function localizedNodes(value: unknown): XmlNode[] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entries = Object.entries(value as Localized);
  if (entries.length === 0) return undefined;
  // `default` first, then the remaining locales alphabetically, for stable output.
  entries.sort(([a], [b]) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)));
  return entries.map(([lang, content]) => ({_: content, $: {'xml:lang': lang === 'default' ? 'x-default' : lang}}));
}

function buildAttribute(attr: MetaAttributeDefinition, custom: boolean): XmlNode {
  // Element order follows the metadata.xsd sequence.
  const node: XmlNode = {$: {'attribute-id': attr.id}};
  const put = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) node[key] = value;
  };
  put('display-name', localizedNodes(attr.displayName));
  put('description', localizedNodes(attr.description));
  if (custom) {
    put('type', attr.valueType ? valueTypeToXmlType(attr.valueType) : undefined);
    put('localizable-flag', attr.localizable);
    put('site-specific-flag', attr.siteSpecific);
    put('mandatory-flag', attr.mandatory);
  }
  put('visible-flag', attr.visible);
  if (custom) put('externally-managed-flag', attr.externallyManaged);
  put('order-required-flag', attr.orderRequired);
  if (custom) put('externally-defined-flag', attr.externallyDefined);
  put('min-length', attr.minLength);
  put('field-length', attr.fieldLength);
  put('field-height', attr.fieldHeight);
  put('unit', localizedNodes(attr.unit));
  put('scale', attr.scale);
  put('min-value', attr.minValue);
  put('max-value', attr.maxValue);
  put('regex', attr.regularExpression);
  put('select-multiple-flag', attr.multiValueType);
  if (attr.valueDefinitions?.length) {
    node['value-definitions'] = {
      'value-definition': attr.valueDefinitions.map((value) => {
        const valueNode: XmlNode = {};
        const display = localizedNodes(value.displayValue);
        if (display) valueNode.display = display;
        valueNode.value = value.value;
        return valueNode;
      }),
    };
  }
  if (custom) put('default-value', attr.defaultValue?.value);
  return node;
}

/**
 * Builds `system-objecttype-extensions.xml` content from object type
 * definitions. The output can be imported with a site archive import.
 */
export function buildObjectTypeExtensionsXml(extensions: ObjectTypeExtension[]): string {
  const metadata = {
    $: {xmlns: METADATA_NS},
    'type-extension': extensions.map((ext) => {
      const node: XmlNode = {$: {'type-id': ext.objectType}};
      if (ext.systemAttributes.length > 0) {
        node['system-attribute-definitions'] = {
          'attribute-definition': ext.systemAttributes.map((attr) => buildAttribute(attr, false)),
        };
      }
      if (ext.attributes.length > 0) {
        node['custom-attribute-definitions'] = {
          'attribute-definition': ext.attributes.map((attr) => buildAttribute(attr, true)),
        };
      }
      if (ext.groups.length > 0) {
        node['group-definitions'] = {
          'attribute-group': ext.groups.map((group) => ({
            $: {'group-id': group.id},
            ...(localizedNodes(group.displayName) ? {'display-name': localizedNodes(group.displayName)} : {}),
            ...(localizedNodes(group.description) ? {description: localizedNodes(group.description)} : {}),
            ...(group.attributes.length > 0
              ? {
                  attribute: group.attributes.map((ref) => ({
                    $: {'attribute-id': ref.id, ...(ref.system ? {system: 'true'} : {})},
                  })),
                }
              : {}),
          })),
        };
      }
      return node;
    }),
  };
  const builder = new xml2js.Builder({
    rootName: 'metadata',
    xmldec: {version: '1.0', encoding: 'UTF-8'},
    renderOpts: {pretty: true, indent: '    ', newline: '\n'},
  });
  return builder.buildObject(metadata) + '\n';
}
