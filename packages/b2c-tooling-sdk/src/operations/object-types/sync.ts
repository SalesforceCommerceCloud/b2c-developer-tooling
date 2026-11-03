/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ObjectAttributeDefinition, ObjectAttributeGroup} from '../../clients/object-definitions.js';
import type {ObjectTypesClient} from './object-types.js';
import JSZip from 'jszip';
import type {B2CInstance} from '../../instance/index.js';
import {siteArchiveImport} from '../jobs/site-archive.js';
import type {SiteArchiveImportOptions, SiteArchiveImportResult} from '../jobs/site-archive.js';
import {buildObjectTypeExtensionsXml} from './meta-xml.js';
import type {MetaAttributeDefinition, MetaAttributeGroup, ObjectTypeExtension} from './meta-xml.js';

/** Writable attribute properties compared and sent by `apply`. */
const ATTRIBUTE_FIELDS = [
  'displayName',
  'description',
  'mandatory',
  'localizable',
  'siteSpecific',
  'visible',
  'externallyManaged',
  'externallyDefined',
  'orderRequired',
  'multiValueType',
  'minLength',
  'fieldLength',
  'fieldHeight',
  'unit',
  'scale',
  'minValue',
  'maxValue',
  'regularExpression',
] as const satisfies ReadonlyArray<keyof MetaAttributeDefinition>;

/** Properties a system attribute override can change. */
const SYSTEM_ATTRIBUTE_FIELDS = new Set<string>(['displayName', 'description', 'visible', 'orderRequired']);

const LOCALIZED_FIELDS = new Set<string>(['displayName', 'description', 'unit']);

/** One change `apply` makes. */
export type ObjectTypeSyncAction =
  | {
      action: 'assign';
      objectType: string;
      group: string;
      id: string;
    }
  | {
      action: 'create-attribute';
      objectType: string;
      id: string;
      body: MetaAttributeDefinition;
    }
  | {
      action: 'create-group';
      objectType: string;
      id: string;
      body: ObjectAttributeGroup;
    }
  | {
      action: 'update-attribute';
      objectType: string;
      id: string;
      changes: string[];
      body: Partial<MetaAttributeDefinition>;
    }
  | {
      action: 'update-group';
      objectType: string;
      id: string;
      changes: string[];
      body: Partial<ObjectAttributeGroup>;
    };

/** Something in the desired definitions that the API cannot apply. */
export interface ObjectTypeSyncWarning {
  objectType: string;
  id?: string;
  message: string;
}

/**
 * A custom attribute whose enum values or default value differ from the
 * instance. The API ignores these properties; a site import can set them.
 */
export interface ObjectTypeImportItem {
  objectType: string;
  id: string;
  /** What differs, for example `new value hiking` or `default value`. */
  changes: string[];
  /** The definition to import: value type, the full desired value list, and the default value. */
  attribute: MetaAttributeDefinition;
}

/** Result of {@link planObjectTypeSync}. */
export interface ObjectTypeSyncPlan {
  actions: ObjectTypeSyncAction[];
  warnings: ObjectTypeSyncWarning[];
  /** Custom attributes that need a site import (see {@link importObjectTypeExtensions}). */
  importRequired: ObjectTypeImportItem[];
  /** Number of attributes and groups already matching. */
  unchanged: number;
}

/** Options for {@link exportObjectTypes}. */
export interface ExportObjectTypesOptions {
  /** Include groups Business Manager marks as internal. */
  includeInternalGroups?: boolean;
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'object' && Object.keys(value as object).length === 0)
  );
}

/**
 * Compares a desired property with the live value. Localized values match
 * when every desired locale matches (PATCH merges locales; others are kept).
 */
function differs(field: string, desired: unknown, live: unknown): boolean {
  if (desired === undefined) return false;
  if (LOCALIZED_FIELDS.has(field)) {
    const want = (desired ?? {}) as Record<string, string>;
    const have = (live ?? {}) as Record<string, string>;
    return Object.entries(want).some(([locale, value]) => have[locale] !== value);
  }
  if (typeof desired === 'boolean') return desired !== Boolean(live);
  if (typeof desired === 'number') return desired !== (live ?? 0);
  return desired !== (live ?? undefined);
}

function pickWritable(attr: MetaAttributeDefinition, fields: ReadonlyArray<string>): Partial<MetaAttributeDefinition> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = (attr as Record<string, unknown>)[field];
    if (value !== undefined) result[field] = value;
  }
  return result as Partial<MetaAttributeDefinition>;
}

function localizedDiffers(desired: Record<string, string> | undefined, live: Record<string, string> | undefined) {
  return Object.entries(desired ?? {}).some(([locale, value]) => (live ?? {})[locale] !== value);
}

/**
 * Enum value and default value differences of a custom attribute. Only
 * additions and changes count: a merge import keeps values the file omits.
 */
function importChanges(desired: MetaAttributeDefinition, live?: ObjectAttributeDefinition): string[] {
  const changes: string[] = [];
  if (desired.valueDefinitions) {
    const have = new Map((live?.valueDefinitions ?? []).map((value) => [value.value, value]));
    for (const value of desired.valueDefinitions) {
      const existing = have.get(value.value);
      if (!existing) changes.push(`new value ${value.value}`);
      else if (localizedDiffers(value.displayValue, existing.displayValue)) {
        changes.push(`display value of ${value.value}`);
      }
    }
  }
  const defaultValue = desired.defaultValue?.value;
  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== live?.defaultValue?.value) {
    changes.push('default value');
  }
  return changes;
}

/**
 * The value list to import. An import replaces an attribute's whole value
 * list, so this keeps every live value (in order), applies desired display
 * values over the live ones (locale by locale), and appends new values.
 */
function mergeValues(
  live: ObjectAttributeDefinition['valueDefinitions'],
  desired: MetaAttributeDefinition['valueDefinitions'],
): NonNullable<MetaAttributeDefinition['valueDefinitions']> {
  const wanted = new Map((desired ?? []).map((value) => [value.value, value]));
  const merged = (live ?? []).map((value) => {
    const change = wanted.get(value.value);
    wanted.delete(value.value);
    const displayValue = {...value.displayValue, ...change?.displayValue};
    return {value: value.value, ...(isEmpty(displayValue) ? {} : {displayValue})};
  });
  for (const value of wanted.values()) {
    merged.push({value: value.value, ...(isEmpty(value.displayValue) ? {} : {displayValue: value.displayValue})});
  }
  return merged;
}

function removedValuesWarning(objectType: string, desired: MetaAttributeDefinition, live?: ObjectAttributeDefinition) {
  if (!desired.valueDefinitions || !live?.valueDefinitions?.length) return [];
  const want = new Set(desired.valueDefinitions.map((value) => value.value));
  const removed = live.valueDefinitions.filter((value) => !want.has(value.value)).map((value) => value.value);
  if (removed.length === 0) return [];
  return [
    {
      objectType,
      id: desired.id,
      message: `Enum values not listed are kept, not removed (${removed.length}: ${removed.slice(0, 5).join(', ')}${removed.length > 5 ? ', ...' : ''}). Remove values in Business Manager.`,
    },
  ];
}

/**
 * Compares desired object type definitions (for example from
 * `system-objecttype-extensions.xml`) with an instance and returns the
 * changes needed. The plan is additive: nothing is deleted or unassigned.
 */
export async function planObjectTypeSync(
  client: ObjectTypesClient,
  extensions: ObjectTypeExtension[],
): Promise<ObjectTypeSyncPlan> {
  const plan: ObjectTypeSyncPlan = {actions: [], warnings: [], importRequired: [], unchanged: 0};

  for (const ext of extensions) {
    const {objectType} = ext;
    let liveAttributes: ObjectAttributeDefinition[];
    let liveGroups: ObjectAttributeGroup[];
    try {
      // eslint-disable-next-line no-await-in-loop -- one object type at a time keeps requests bounded
      [liveAttributes, liveGroups] = await Promise.all([
        client.listAttributeDefinitions(objectType, {includeValues: true}),
        client.listAttributeGroups(objectType, {expandDefinitions: true}),
      ]);
    } catch (error) {
      if ((error as {status?: number}).status === 404) {
        plan.warnings.push({objectType, message: `Object type ${objectType} does not exist on the instance; skipped.`});
        continue;
      }
      throw error;
    }
    const attributesById = new Map(liveAttributes.map((attr) => [attr.id, attr]));

    for (const desired of ext.attributes) {
      const live = attributesById.get(desired.id);
      if (!live?.system) {
        const changes = importChanges(desired, live);
        const valueType = desired.valueType ?? live?.valueType;
        if (changes.length > 0 && valueType) {
          const attribute: MetaAttributeDefinition = {id: desired.id, valueType};
          const values = mergeValues(live?.valueDefinitions, desired.valueDefinitions);
          if (values.length > 0) attribute.valueDefinitions = values;
          if (desired.defaultValue) attribute.defaultValue = desired.defaultValue;
          plan.importRequired.push({objectType, id: desired.id, changes, attribute});
        }
        plan.warnings.push(...removedValuesWarning(objectType, desired, live));
      }
      if (!live) {
        if (!desired.valueType) {
          plan.warnings.push({objectType, id: desired.id, message: 'No value type given; cannot create.'});
          continue;
        }
        plan.actions.push({
          action: 'create-attribute',
          objectType,
          id: desired.id,
          body: {id: desired.id, valueType: desired.valueType, ...pickWritable(desired, ATTRIBUTE_FIELDS)},
        });
        continue;
      }
      if (live.system) {
        plan.warnings.push({
          objectType,
          id: desired.id,
          message: 'Defined as a custom attribute but is a system attribute on the instance; skipped.',
        });
        continue;
      }
      if (desired.valueType && desired.valueType !== live.valueType) {
        plan.warnings.push({
          objectType,
          id: desired.id,
          message: `Value type differs (${live.valueType} on the instance, ${desired.valueType} desired) and cannot be changed.`,
        });
      }
      const pending = plan.importRequired.at(-1);
      const needsImport = pending?.objectType === objectType && pending.id === desired.id;
      if (!pushUpdate(plan, objectType, desired, live, ATTRIBUTE_FIELDS) && needsImport) plan.unchanged--;
    }

    for (const desired of ext.systemAttributes) {
      const live = attributesById.get(desired.id);
      if (!live) {
        plan.warnings.push({objectType, id: desired.id, message: 'System attribute not found on the instance.'});
        continue;
      }
      if (importChanges(desired, live).length > 0) {
        plan.warnings.push({
          objectType,
          id: desired.id,
          message: 'Enum values and default values of system attributes are not applied.',
        });
      }
      pushUpdate(
        plan,
        objectType,
        desired,
        live,
        ATTRIBUTE_FIELDS.filter((field) => SYSTEM_ATTRIBUTE_FIELDS.has(field)),
      );
    }

    const groupsById = mergeGroups(liveGroups);
    for (const desired of ext.groups) planGroup(plan, objectType, desired, groupsById.get(desired.id));
  }
  return plan;
}

/**
 * Group IDs are not unique in list results on every instance (site-specific
 * copies share an ID). Merges entries with the same ID, keeping the first
 * entry's properties and the union of assigned attributes.
 */
function mergeGroups(groups: ObjectAttributeGroup[]): Map<string, ObjectAttributeGroup> {
  const byId = new Map<string, ObjectAttributeGroup>();
  for (const group of groups) {
    if (!group.id) continue;
    const existing = byId.get(group.id);
    if (!existing) {
      byId.set(group.id, {...group, attributeDefinitions: [...(group.attributeDefinitions ?? [])]});
      continue;
    }
    const seen = new Set(existing.attributeDefinitions!.map((attr) => attr.id));
    for (const attr of group.attributeDefinitions ?? []) {
      if (!seen.has(attr.id)) existing.attributeDefinitions!.push(attr);
    }
  }
  return byId;
}

function pushUpdate(
  plan: ObjectTypeSyncPlan,
  objectType: string,
  desired: MetaAttributeDefinition,
  live: ObjectAttributeDefinition,
  fields: ReadonlyArray<string>,
): boolean {
  const changes = fields.filter((field) =>
    differs(field, (desired as Record<string, unknown>)[field], (live as Record<string, unknown>)[field]),
  );
  if (changes.length === 0) {
    plan.unchanged++;
    return false;
  }
  plan.actions.push({
    action: 'update-attribute',
    objectType,
    id: desired.id,
    changes,
    body: pickWritable(desired, changes),
  });
  return true;
}

function planGroup(
  plan: ObjectTypeSyncPlan,
  objectType: string,
  desired: MetaAttributeGroup,
  live: ObjectAttributeGroup | undefined,
): void {
  const assigned = new Set((live?.attributeDefinitions ?? []).map((attr) => attr.id));
  const before = plan.actions.length;
  if (live) {
    const changes = (['displayName', 'description'] as const).filter((field) =>
      differs(field, desired[field], live[field]),
    );
    if (changes.length > 0) {
      const body: Partial<ObjectAttributeGroup> = {};
      for (const field of changes) body[field] = desired[field];
      plan.actions.push({action: 'update-group', objectType, id: desired.id, changes, body});
    }
  } else {
    const body: ObjectAttributeGroup = {id: desired.id};
    if (desired.displayName) body.displayName = desired.displayName;
    if (desired.description) body.description = desired.description;
    plan.actions.push({action: 'create-group', objectType, id: desired.id, body});
  }
  const missing = desired.attributes.filter((ref) => !assigned.has(ref.id));
  for (const ref of missing) plan.actions.push({action: 'assign', objectType, group: desired.id, id: ref.id});
  if (plan.actions.length === before) plan.unchanged++;
}

/**
 * Applies a plan from {@link planObjectTypeSync}. Actions run in order and
 * stop at the first failure; attribute creation precedes group assignment.
 */
export async function applyObjectTypeSync(
  client: ObjectTypesClient,
  plan: ObjectTypeSyncPlan,
  options: {onAction?: (action: ObjectTypeSyncAction) => void} = {},
): Promise<void> {
  const ordered = [
    ...plan.actions.filter((action) => action.action !== 'assign'),
    ...plan.actions.filter((action) => action.action === 'assign'),
  ];
  for (const action of ordered) {
    options.onAction?.(action);
    /* eslint-disable no-await-in-loop -- sequential so ordering holds and failures stop the run */
    switch (action.action) {
      case 'assign': {
        await client.assignAttributeToGroup(action.objectType, action.group, action.id);
        break;
      }
      case 'create-attribute': {
        await client.createOrReplaceAttributeDefinition(action.objectType, action.body as ObjectAttributeDefinition);
        break;
      }
      case 'create-group': {
        await client.createOrReplaceAttributeGroup(action.objectType, action.body);
        break;
      }
      case 'update-attribute': {
        await client.updateAttributeDefinition(action.objectType, action.id, action.body as ObjectAttributeDefinition);
        break;
      }
      case 'update-group': {
        await client.updateAttributeGroup(action.objectType, action.id, action.body);
        break;
      }
    }
    /* eslint-enable no-await-in-loop */
  }
}

function toMeta(attr: ObjectAttributeDefinition, fields: ReadonlyArray<string>): MetaAttributeDefinition {
  const result: Record<string, unknown> = {id: attr.id};
  if (attr.valueType && !attr.system) result.valueType = attr.valueType;
  for (const field of fields) {
    const value = (attr as Record<string, unknown>)[field];
    if (!isEmpty(value)) result[field] = value;
  }
  if (attr.valueDefinitions?.length) {
    result.valueDefinitions = attr.valueDefinitions.map((value) => ({
      value: value.value,
      ...(isEmpty(value.displayValue) ? {} : {displayValue: value.displayValue}),
    }));
  }
  return result as MetaAttributeDefinition;
}

/**
 * Reads the custom attribute definitions and attribute groups of object types
 * from an instance, in the shape used by {@link buildObjectTypeExtensionsXml}.
 * System attribute definitions are not exported.
 */
export async function exportObjectTypes(
  client: ObjectTypesClient,
  objectTypes: string[],
  options: ExportObjectTypesOptions = {},
): Promise<ObjectTypeExtension[]> {
  const result: ObjectTypeExtension[] = [];
  for (const objectType of objectTypes) {
    // eslint-disable-next-line no-await-in-loop -- one object type at a time keeps requests bounded
    const [attributes, groups] = await Promise.all([
      client.listAttributeDefinitions(objectType, {kind: 'custom', includeValues: true}),
      client.listAttributeGroups(objectType, {expandDefinitions: true}),
    ]);
    result.push({
      objectType,
      attributes: attributes.map((attr) => toMeta(attr, ATTRIBUTE_FIELDS)),
      systemAttributes: [],
      groups: [...mergeGroups(groups).values()]
        .filter((group) => options.includeInternalGroups || !group.internal)
        .map((group) => ({
          id: group.id!,
          ...(isEmpty(group.displayName) ? {} : {displayName: group.displayName}),
          ...(isEmpty(group.description) ? {} : {description: group.description}),
          attributes: (group.attributeDefinitions ?? []).map((attr) => ({
            id: attr.id,
            ...(attr.system ? {system: true} : {}),
          })),
        })),
    });
  }
  return result;
}

/** Options for {@link importObjectTypeExtensions}. */
export type ImportObjectTypeExtensionsOptions = SiteArchiveImportOptions;

/**
 * Builds `meta/system-objecttype-extensions.xml` for the plan's import items
 * and imports it with a site archive import (merge mode). This sets enum
 * values and default values, which the Object Definitions API ignores. Needs
 * WebDAV and job permissions on the instance.
 */
export async function importObjectTypeExtensions(
  instance: B2CInstance,
  items: ObjectTypeImportItem[],
  options: ImportObjectTypeExtensionsOptions = {},
): Promise<SiteArchiveImportResult> {
  const byType = new Map<string, ObjectTypeExtension>();
  for (const item of items) {
    let ext = byType.get(item.objectType);
    if (!ext) {
      ext = {objectType: item.objectType, attributes: [], systemAttributes: [], groups: []};
      byType.set(item.objectType, ext);
    }
    ext.attributes.push(item.attribute);
  }
  const zip = new JSZip();
  zip.file('meta/system-objecttype-extensions.xml', buildObjectTypeExtensionsXml([...byType.values()]));
  const buffer = await zip.generateAsync({type: 'nodebuffer'});
  return siteArchiveImport(instance, buffer, options);
}
