/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ObjectAttributeDefinition} from '../../clients/object-definitions.js';
import {SafetyBlockedError} from '../../safety/safety-middleware.js';
import {localizedDefault, type ObjectTypesClient} from './object-types.js';

/** Custom attributes of one object type, as input to {@link buildCustomAttributeTypes}. */
export interface CustomAttributeTypeSource {
  objectType: string;
  attributes: ObjectAttributeDefinition[];
}

/** Options for {@link generateCustomAttributeTypes}. */
export interface GenerateCustomAttributeTypesOptions {
  /** Object types to include. Defaults to every system object type on the instance. */
  objectTypes?: string[];
  /**
   * Include enum values as literal types. They come from the attribute search,
   * which needs the `sfcc.object-definitions.rw` scope; when it is not
   * available the declarations are generated without values. Default true.
   */
  includeValues?: boolean;
  /** Parallel requests. Default 4. */
  concurrency?: number;
  /** Extra comment lines for the top of the file (for example the instance host). */
  header?: string;
}

/** Result of {@link generateCustomAttributeTypes}. */
export interface CustomAttributeTypesResult {
  /** Declaration file content (`.d.ts`). */
  content: string;
  /** Object types with at least one custom attribute, and their attribute counts. */
  objectTypes: Array<{objectType: string; attributes: number}>;
  /** Whether enum values are included. */
  valuesIncluded: boolean;
  /** Problems that did not stop generation (missing object types, unavailable enum values). */
  warnings: string[];
}

/** Maximum enum values listed in a doc comment and turned into a literal union. */
const MAX_ENUM_VALUES = 200;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

interface PropertyTypes {
  /** Type read from `obj.custom.x`. */
  get: string;
  /** Type accepted by `obj.custom.x = ...`, when it differs from `get`. */
  set?: string;
}

function enumLiterals(attr: ObjectAttributeDefinition): string | undefined {
  const values = (attr.valueDefinitions ?? [])
    .map((value) => value.value)
    .filter((value): value is string => typeof value === 'string');
  if (values.length === 0 || values.length > MAX_ENUM_VALUES) return undefined;
  const numeric = attr.valueType === 'enum_of_int';
  const literals = [...new Set(values)].map((value) =>
    numeric && /^-?\d+$/.test(value) ? value : JSON.stringify(value),
  );
  return literals.join(' | ');
}

/**
 * Maps an attribute value type to the Script API types of its `custom`
 * property. Getters return platform objects for HTML, image, money, quantity,
 * and enum attributes; setters take the plain value.
 */
export function customAttributePropertyTypes(attr: ObjectAttributeDefinition): PropertyTypes {
  const multi = attr.multiValueType === true;
  switch (attr.valueType) {
    case 'boolean': {
      return {get: 'boolean'};
    }
    case 'date':
    case 'datetime': {
      return {get: 'Date'};
    }
    case 'double':
    case 'int': {
      return {get: 'number'};
    }
    case 'enum_of_int':
    case 'enum_of_string': {
      const literals = enumLiterals(attr);
      const raw = literals ?? (attr.valueType === 'enum_of_int' ? 'number' : 'string');
      const enumValue = literals
        ? `Omit<dw.value.EnumValue, 'value' | 'getValue'> & {readonly value: ${literals}; getValue(): ${literals}}`
        : 'dw.value.EnumValue';
      return multi ? {get: `Array<${enumValue}>`, set: `Array<${raw}>`} : {get: enumValue, set: raw};
    }
    case 'html': {
      return {get: 'dw.content.MarkupText', set: 'string'};
    }
    case 'image': {
      return {get: 'dw.content.MediaFile', set: 'string'};
    }
    case 'money': {
      return {get: 'dw.value.Money', set: 'dw.value.Money | number'};
    }
    case 'quantity': {
      return {get: 'dw.value.Quantity', set: 'dw.value.Quantity | number'};
    }
    case 'set_of_double':
    case 'set_of_int': {
      return {get: 'number[]'};
    }
    case 'set_of_string': {
      return {get: 'string[]'};
    }
    default: {
      // string, text, email, password
      return {get: 'string'};
    }
  }
}

function commentText(value: string): string {
  return value.replaceAll('*/', '*\\/').replaceAll(/\s+/g, ' ').trim();
}

function docComment(attr: ObjectAttributeDefinition, indent: string): string[] {
  const lines: string[] = [];
  const name = localizedDefault(attr.displayName);
  const description = localizedDefault(attr.description);
  if (name) lines.push(commentText(name));
  if (description && description !== name) {
    if (lines.length > 0) lines.push('');
    lines.push(commentText(description));
  }
  if (lines.length > 0) lines.push('');
  const flags = [
    attr.multiValueType ? 'multi-value' : undefined,
    attr.localizable ? 'localizable' : undefined,
    attr.siteSpecific ? 'site-specific' : undefined,
    attr.mandatory ? 'mandatory' : undefined,
  ].filter(Boolean);
  lines.push(
    `Custom attribute \`${attr.effectiveId ?? `c_${attr.id}`}\` (${attr.valueType ?? 'unknown'}${flags.length > 0 ? `, ${flags.join(', ')}` : ''}).`,
  );
  const values = attr.valueDefinitions ?? [];
  if (values.length > 0) {
    lines.push('', 'Values:');
    for (const value of values.slice(0, MAX_ENUM_VALUES)) {
      const display = localizedDefault(value.displayValue);
      lines.push(`- \`${commentText(String(value.value ?? ''))}\`${display ? ` ${commentText(display)}` : ''}`);
    }
    if (values.length > MAX_ENUM_VALUES) lines.push(`- ... ${values.length - MAX_ENUM_VALUES} more`);
  }
  return [`${indent}/**`, ...lines.map((line) => (line ? `${indent} * ${line}` : `${indent} *`)), `${indent} */`];
}

function propertyLines(attr: ObjectAttributeDefinition, indent: string): string[] {
  const key = IDENTIFIER.test(attr.id) ? attr.id : JSON.stringify(attr.id);
  const types = customAttributePropertyTypes(attr);
  const doc = docComment(attr, indent);
  if (!types.set) return [...doc, `${indent}${key}: ${types.get} | null;`];
  // Accessors with unrelated get/set types need TypeScript 5.1 or later.
  return [...doc, `${indent}get ${key}(): ${types.get} | null;`, `${indent}set ${key}(value: ${types.set} | null);`];
}

/**
 * Builds a declaration file that adds custom attributes to the Script API
 * `ICustomAttributes` interfaces, so `product.custom.myAttribute` gets
 * completions and types. System attributes in the input are ignored.
 */
export function buildCustomAttributeTypes(
  sources: CustomAttributeTypeSource[],
  options: {header?: string} = {},
): string {
  const lines: string[] = [
    '// Custom attribute types for B2C Commerce Script API IntelliSense.',
    '// Generated from instance attribute definitions; do not edit.',
  ];
  if (options.header) lines.push(...options.header.split('\n').map((line) => `// ${line}`));
  lines.push('', 'declare namespace ICustomAttributes {');
  const sorted = [...sources].sort((a, b) => a.objectType.localeCompare(b.objectType));
  let first = true;
  for (const source of sorted) {
    const attributes = source.attributes
      .filter((attr) => attr.system !== true && attr.id)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (attributes.length === 0 || !IDENTIFIER.test(source.objectType)) continue;
    if (!first) lines.push('');
    first = false;
    lines.push(`    interface ${source.objectType} {`);
    attributes.forEach((attr, index) => {
      if (index > 0) lines.push('');
      lines.push(...propertyLines(attr, '        '));
    });
    lines.push('    }');
  }
  lines.push('}', '');
  return lines.join('\n');
}

function isValuesUnavailable(error: unknown): boolean {
  if (error instanceof SafetyBlockedError) return true;
  const status = (error as {status?: number}).status;
  return status === 401 || status === 403;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      // eslint-disable-next-line no-await-in-loop -- bounded worker pool
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({length: Math.max(1, Math.min(limit, items.length))}, worker));
  return results;
}

/**
 * Reads custom attribute definitions from an instance and builds the
 * declaration file from {@link buildCustomAttributeTypes}.
 *
 * @example
 * ```ts
 * const {content} = await generateCustomAttributeTypes(new ObjectTypesClient(config), {objectTypes: ['Product']});
 * await fs.writeFile('custom-attributes.d.ts', content);
 * ```
 */
export async function generateCustomAttributeTypes(
  client: ObjectTypesClient,
  options: GenerateCustomAttributeTypesOptions = {},
): Promise<CustomAttributeTypesResult> {
  const warnings: string[] = [];
  let includeValues = options.includeValues !== false;
  const objectTypes = options.objectTypes ?? (await client.listObjectTypes()).map((type) => type.objectType!);

  const listCustom = async (objectType: string): Promise<ObjectAttributeDefinition[]> => {
    if (includeValues) {
      try {
        return await client.listAttributeDefinitions(objectType, {kind: 'custom', includeValues: true});
      } catch (error) {
        if (!isValuesUnavailable(error)) throw error;
        if (includeValues) {
          includeValues = false;
          warnings.push(
            error instanceof SafetyBlockedError
              ? 'Enum values omitted: the safety level blocks the attribute search that returns them.'
              : 'Enum values omitted: they need the sfcc.object-definitions.rw scope.',
          );
        }
      }
    }
    const all = await client.listAttributeDefinitions(objectType);
    return all.filter((attr) => attr.system !== true);
  };

  const sources = await mapLimit(objectTypes.filter(Boolean), options.concurrency ?? 4, async (objectType) => {
    try {
      return {objectType, attributes: await listCustom(objectType)};
    } catch (error) {
      if ((error as {status?: number}).status === 404) {
        warnings.push(`Object type ${objectType} does not exist on the instance; skipped.`);
        return {objectType, attributes: []};
      }
      throw error;
    }
  });

  const withAttributes = sources.filter((source) => source.attributes.length > 0);
  return {
    content: buildCustomAttributeTypes(withAttributes, {header: options.header}),
    objectTypes: withAttributes
      .map((source) => ({objectType: source.objectType, attributes: source.attributes.length}))
      .sort((a, b) => a.objectType.localeCompare(b.objectType)),
    valuesIncluded: includeValues,
    warnings,
  };
}
