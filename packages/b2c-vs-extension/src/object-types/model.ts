/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Pure helpers for the Object Types view (no `vscode` import, so they are unit
 * testable).
 */
import {SafetyBlockedError} from '@salesforce/b2c-tooling-sdk';
import {isInvalidScopeError} from '@salesforce/b2c-tooling-sdk/clients';
import {localizedDefault} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import type {
  MetaAttributeDefinition,
  ObjectAttributeDefinition,
  ObjectAttributeGroup,
  ObjectTypeSyncPlan,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';

/** Shown in the view when the Object Definitions API is unreachable. */
export type ObjectTypesErrorKind = 'access' | 'blocked' | 'other' | 'unavailable';

export interface ObjectTypesErrorInfo {
  kind: ObjectTypesErrorKind;
  message: string;
}

function statusOf(error: unknown): number | undefined {
  const status = (error as {status?: unknown} | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

/**
 * Turns an Object Definitions API failure into a short, actionable message.
 * Access problems point at the scope and tenant filter. A 404 on the type
 * listing usually means the instance does not offer the API;
 * pass `objectType` when the failure is about one type.
 */
export function describeObjectTypesError(error: unknown, objectType?: string): ObjectTypesErrorInfo {
  if (error instanceof SafetyBlockedError) {
    return {kind: 'blocked', message: `Blocked by safety mode: ${error.message}`};
  }
  const status = statusOf(error);
  if (status === 401 || status === 403 || isInvalidScopeError(error)) {
    return {
      kind: 'access',
      message:
        'Access denied by the Object Definitions API. The API client needs the sfcc.object-definitions scope and the instance in its tenant filter.',
    };
  }
  if (status === 404) {
    if (objectType) return {kind: 'other', message: `Object type ${objectType} was not found on the instance.`};
    return {kind: 'unavailable', message: 'The Object Definitions API is not available for this instance.'};
  }
  return {kind: 'other', message: error instanceof Error ? error.message : String(error)};
}

/** Whether enum values are unavailable (search needs the `.rw` scope or is blocked) rather than a hard failure. */
export function isValuesUnavailable(error: unknown): boolean {
  if (error instanceof SafetyBlockedError) return true;
  const status = statusOf(error);
  return status === 401 || status === 403 || isInvalidScopeError(error);
}

/** Effective script ID of an attribute (`c_` prefix for custom attributes). */
export function effectiveAttributeId(attr: ObjectAttributeDefinition): string {
  if (attr.effectiveId) return attr.effectiveId;
  return attr.system ? attr.id : `c_${attr.id}`;
}

/** One-line summary for the tree item description. */
export function attributeSummary(attr: ObjectAttributeDefinition): string {
  const parts: string[] = [attr.valueType ?? 'unknown'];
  if (attr.multiValueType) parts.push('multi-value');
  if (attr.localizable) parts.push('localizable');
  if (attr.siteSpecific) parts.push('site-specific');
  if (attr.mandatory) parts.push('mandatory');
  return parts.join(', ');
}

/** Markdown tooltip with the display name, description, and script ID. */
export function attributeTooltip(attr: ObjectAttributeDefinition): string {
  const lines: string[] = [];
  const name = localizedDefault(attr.displayName);
  if (name) lines.push(`**${name}**`);
  const description = localizedDefault(attr.description);
  if (description && description !== name) lines.push(description);
  lines.push(`\`${effectiveAttributeId(attr)}\` (${attributeSummary(attr)})`);
  return lines.join('\n\n');
}

/** Splits attribute definitions into custom and system, each sorted by ID. */
export function splitAttributes(attributes: ObjectAttributeDefinition[]): {
  custom: ObjectAttributeDefinition[];
  system: ObjectAttributeDefinition[];
} {
  const sorted = [...attributes].filter((attr) => attr.id).sort((a, b) => a.id.localeCompare(b.id));
  return {custom: sorted.filter((attr) => attr.system !== true), system: sorted.filter((attr) => attr.system === true)};
}

/**
 * Group IDs are not unique in list results on every instance. Merges entries
 * with the same ID (first entry's properties, union of attributes) and sorts
 * by position, then ID.
 */
export function mergeAttributeGroups(groups: ObjectAttributeGroup[]): ObjectAttributeGroup[] {
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
  return [...byId.values()].sort(
    (a, b) =>
      (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.id!.localeCompare(b.id!),
  );
}

/**
 * Overlays enum values from a search result onto plain definitions, so the
 * view keeps every attribute even when only some have values.
 */
export function withEnumValues(
  attributes: ObjectAttributeDefinition[],
  searched: ObjectAttributeDefinition[],
): ObjectAttributeDefinition[] {
  const values = new Map(searched.filter((attr) => attr.valueDefinitions?.length).map((attr) => [attr.id, attr]));
  return attributes.map((attr) => {
    const match = values.get(attr.id);
    return match ? {...attr, valueDefinitions: match.valueDefinitions} : attr;
  });
}

/** Read-only or computed properties of an attribute document that saving ignores. */
const IGNORED_ON_SAVE = new Set(['creationDate', 'effectiveId', 'key', 'lastModified', 'readOnly', 'system']);

/**
 * Parses a saved attribute definition document into the desired definition.
 * Rejects documents whose `id` no longer matches the attribute.
 */
export function definitionFromDocument(text: string, id: string): MetaAttributeDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`The document is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The document must contain a JSON object.');
  }
  const record = parsed as Record<string, unknown>;
  if (record.id !== undefined && record.id !== id) {
    throw new Error(`The attribute ID cannot be changed (expected "${id}"). Create a new attribute instead.`);
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!IGNORED_ON_SAVE.has(key) && value !== null) result[key] = value;
  }
  result.id = id;
  if (Array.isArray(result.valueDefinitions)) {
    result.valueDefinitions = (result.valueDefinitions as Array<Record<string, unknown>>).map((value) => ({
      value: String(value?.value ?? ''),
      ...(value?.displayValue && typeof value.displayValue === 'object' ? {displayValue: value.displayValue} : {}),
    }));
  }
  return result as MetaAttributeDefinition;
}

/** What saving would do, as lines for a confirmation dialog. */
export function describeSyncPlan(plan: ObjectTypeSyncPlan): {api: string[]; importItems: string[]; warnings: string[]} {
  const api = plan.actions.map((action) => {
    switch (action.action) {
      case 'assign': {
        return `Assign ${action.id} to group ${action.group}`;
      }
      case 'create-attribute': {
        return `Create ${action.id} (${action.body.valueType})`;
      }
      case 'create-group': {
        return `Create group ${action.id}`;
      }
      default: {
        return `Update ${action.id}: ${action.changes.join(', ')}`;
      }
    }
  });
  const importItems = plan.importRequired.map((item) => `${item.id}: ${item.changes.join(', ')}`);
  return {api, importItems, warnings: plan.warnings.map((warning) => warning.message)};
}

/** Attribute IDs: letters, digits, and underscores, starting with a letter (no `c_` prefix). */
export function validateAttributeId(id: string): string | undefined {
  const value = id.trim();
  if (!value) return 'Enter an attribute ID.';
  if (value.startsWith('c_')) return 'Leave out the c_ prefix; it is added for custom attributes.';
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) return 'Use letters, digits, and underscores, starting with a letter.';
  if (value.length > 256) return 'Use at most 256 characters.';
  return undefined;
}
