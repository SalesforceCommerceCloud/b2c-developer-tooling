/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import type {ObjectAttributeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {parseLocalized} from './object-types.js';

/** Value types accepted by the Object Definitions API. */
export const VALUE_TYPES = [
  'string',
  'int',
  'double',
  'text',
  'html',
  'date',
  'image',
  'boolean',
  'money',
  'quantity',
  'datetime',
  'email',
  'password',
  'set_of_string',
  'set_of_int',
  'set_of_double',
  'enum_of_string',
  'enum_of_int',
] as const;

/** Writable attribute property flags shared by create and update. */
export const attributePropertyFlags = {
  'display-name': Flags.string({
    char: 'n',
    description: 'Display name; repeat as locale=text for translations',
    multiple: true,
  }),
  description: Flags.string({description: 'Description; repeat as locale=text for translations', multiple: true}),
  mandatory: Flags.boolean({description: 'Value is required', allowNo: true}),
  localizable: Flags.boolean({description: 'Value can differ per locale', allowNo: true}),
  'site-specific': Flags.boolean({description: 'Value can differ per site', allowNo: true}),
  searchable: Flags.boolean({description: 'Indexed for search', allowNo: true}),
  visible: Flags.boolean({description: 'Visible in Business Manager', allowNo: true}),
  'multi-value': Flags.boolean({description: 'Enum allows multiple selected values', allowNo: true}),
  'externally-managed': Flags.boolean({description: 'Managed by an external system', allowNo: true}),
  'order-required': Flags.boolean({description: 'Value is required for orders', allowNo: true}),
  'min-length': Flags.integer({description: 'Minimum string length'}),
  'field-length': Flags.integer({description: 'Editor field length'}),
  'regular-expression': Flags.string({description: 'Validation regular expression'}),
};

type AttributePropertyFlags = {
  [K in keyof typeof attributePropertyFlags]?: K extends 'description' | 'display-name'
    ? string[]
    : K extends 'field-length' | 'min-length'
      ? number
      : K extends 'regular-expression'
        ? string
        : boolean;
};

/** Builds a partial attribute definition from the shared property flags. */
export function attributeFromFlags(flags: AttributePropertyFlags): Partial<ObjectAttributeDefinition> {
  // minLength, fieldLength, and regularExpression are marked readOnly in the spec
  // but the API accepts them on create and replace.
  const attr: {-readonly [K in keyof ObjectAttributeDefinition]?: ObjectAttributeDefinition[K]} = {};
  const displayName = parseLocalized(flags['display-name']);
  const description = parseLocalized(flags.description);
  if (displayName) attr.displayName = displayName;
  if (description) attr.description = description;
  if (flags.mandatory !== undefined) attr.mandatory = flags.mandatory;
  if (flags.localizable !== undefined) attr.localizable = flags.localizable;
  if (flags['site-specific'] !== undefined) attr.siteSpecific = flags['site-specific'];
  if (flags.searchable !== undefined) attr.searchable = flags.searchable;
  if (flags.visible !== undefined) attr.visible = flags.visible;
  if (flags['multi-value'] !== undefined) attr.multiValueType = flags['multi-value'];
  if (flags['externally-managed'] !== undefined) attr.externallyManaged = flags['externally-managed'];
  if (flags['order-required'] !== undefined) attr.orderRequired = flags['order-required'];
  if (flags['min-length'] !== undefined) attr.minLength = flags['min-length'];
  if (flags['field-length'] !== undefined) attr.fieldLength = flags['field-length'];
  if (flags['regular-expression'] !== undefined) attr.regularExpression = flags['regular-expression'];
  return attr;
}
