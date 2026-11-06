/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const base =
    '/dx/object-definitions/v1/organizations/{organizationId}/system/object-types/' +
    encodeURIComponent(input.objectType);
  const clauses = [];
  if (input.custom !== undefined) {
    clauses.push({termQuery: {fields: ['system'], operator: 'is', values: [!input.custom]}});
  }
  if (input.ids?.length) {
    const ids = input.ids.map((id) => (id.startsWith('c_') ? id.slice(2) : id));
    clauses.push({termQuery: {fields: ['id'], operator: 'one_of', values: ids}});
  }
  if (input.text) clauses.push({textQuery: {fields: ['id', 'display_name'], searchPhrase: input.text}});
  const query =
    clauses.length === 0 ? {matchAllQuery: {}} : clauses.length === 1 ? clauses[0] : {boolQuery: {must: clauses}};
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 50;
  // Search is the only operation that returns enum values; it needs sfcc.object-definitions.rw.
  const r = await scapi.request({
    method: 'POST',
    path: base + '/attribute-definition-search',
    body: {query, offset, limit},
  });
  if (!r.ok) return {stage: 'search', ...r};
  const label = (value) => value?.default ?? (value ? Object.values(value)[0] : undefined);
  const attributes = (r.data.hits ?? []).map((a) => ({
    id: a.effectiveId ?? a.id,
    valueType: a.valueType,
    displayName: label(a.displayName),
    ...(a.system ? {system: true} : {}),
    ...(a.mandatory ? {mandatory: true} : {}),
    ...(a.localizable ? {localizable: true} : {}),
    ...(a.siteSpecific ? {siteSpecific: true} : {}),
    ...(a.multiValueType ? {multiValue: true} : {}),
    ...(a.valueDefinitions?.length
      ? {values: a.valueDefinitions.slice(0, 25).map((v) => ({value: v.value, label: label(v.displayValue)}))}
      : {}),
    ...(a.valueDefinitions?.length > 25 ? {valuesOmitted: a.valueDefinitions.length - 25} : {}),
  }));
  const total = r.data.total ?? attributes.length;
  return {
    objectType: input.objectType,
    total,
    attributes,
    ...(offset + attributes.length < total ? {nextOffset: offset + attributes.length} : {}),
  };
}
