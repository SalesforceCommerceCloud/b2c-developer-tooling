/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const base = '/experience/experiences/v1/organizations/{organizationId}/';
  const kinds = input.kind ? [input.kind] : ['page', 'component'];
  const ids = input.typeIds ?? [];
  const label = (v) => (typeof v === 'string' ? v : (v?.default ?? Object.values(v ?? {})[0]));
  const out = {siteId: input.siteId};
  for (const kind of kinds) {
    const all = [];
    for (let offset = 0; ; ) {
      const r = await scapi.request({
        method: 'GET',
        path: base + kind + '-types',
        query: {siteId: input.siteId, limit: 200, offset},
      });
      if (!r.ok) return {stage: kind + '-types', ...r};
      const hits = r.data.hits ?? [];
      all.push(...hits);
      offset += hits.length;
      if (hits.length === 0 || offset >= (r.data.total ?? 0)) break;
    }
    const selected = all.filter(
      (t) =>
        (ids.length === 0 || ids.includes(t.id)) &&
        (!input.group || t.group?.id === input.group || t.id.startsWith(input.group + '.')),
    );
    const detailed = ids.length > 0;
    out[kind + 'Types'] = selected.map((t) => ({
      id: t.id,
      name: label(t.name),
      regions: (t.regionDefinitions ?? []).map((g) =>
        detailed
          ? {
              id: g.id,
              maxComponents: g.maxComponents,
              exclusions: (g.componentTypeExclusions ?? []).map((e) => e.typeId),
            }
          : g.id,
      ),
      attributes: (t.attributeDefinitionGroups ?? []).flatMap((g) =>
        (g.attributeDefinitions ?? []).map((a) =>
          detailed
            ? {id: a.id, type: a.type, required: a.required || undefined, values: a.values, default: a.defaultValue}
            : a.id + ':' + a.type + (a.required ? '!' : ''),
        ),
      ),
    }));
    out[kind + 'Total'] = all.length;
  }
  return out;
}
