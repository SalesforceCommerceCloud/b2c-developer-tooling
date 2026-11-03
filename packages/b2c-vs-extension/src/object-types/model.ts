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
  ObjectAttributeDefinition,
  ObjectAttributeGroup,
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
