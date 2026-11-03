/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const base = '/experience/experiences/v1/organizations/{organizationId}/';
  const page = input.page;
  const fetchAll = async (kind) => {
    const all = [];
    for (let offset = 0; ; ) {
      const r = await scapi.request({
        method: 'GET',
        path: base + kind + '-types',
        query: {siteId: input.siteId, limit: 200, offset},
      });
      if (!r.ok) return {error: {stage: kind + '-types', ...r}};
      const hits = r.data.hits ?? [];
      all.push(...hits);
      offset += hits.length;
      if (hits.length === 0 || offset >= (r.data.total ?? 0)) break;
    }
    return {types: new Map(all.map((t) => [t.id, t]))};
  };
  const [pages, components] = await Promise.all([fetchAll('page'), fetchAll('component')]);
  if (pages.error) return pages.error;
  if (components.error) return components.error;

  const errors = [];
  const warnings = [];
  const seen = new Set();
  const attrs = (t) => (t.attributeDefinitionGroups ?? []).flatMap((g) => g.attributeDefinitions ?? []);
  const checkData = (data, type, at) => {
    const defs = attrs(type);
    const known = new Set(defs.map((a) => a.id));
    for (const a of defs) {
      const v = data?.[a.id];
      if (v === undefined || v === null || v === '') {
        if (a.required) errors.push(at + '/data/' + a.id + ': required');
      } else if (a.type === 'enum' && a.values?.length && !a.values.map(String).includes(String(v))) {
        errors.push(at + '/data/' + a.id + ': not one of ' + a.values.join(', '));
      } else if (a.type === 'boolean' && typeof v !== 'boolean') {
        errors.push(at + '/data/' + a.id + ': must be boolean');
      } else if (a.type === 'integer' && !Number.isInteger(v)) {
        errors.push(at + '/data/' + a.id + ': must be integer');
      } else if (a.type === 'image' && (typeof v !== 'object' || Array.isArray(v))) {
        errors.push(at + '/data/' + a.id + ': must be {"path": "..."}');
      }
    }
    for (const k of Object.keys(data ?? {}))
      if (!known.has(k)) warnings.push(at + '/data/' + k + ': not defined, dropped');
  };
  const checkRegions = (regions, owner, at) => {
    const defs = new Map((owner.regionDefinitions ?? []).map((r) => [r.id, r]));
    (regions ?? []).forEach((region, ri) => {
      const rp = at + '/regions/' + ri;
      const def = defs.get(region.id);
      if (!def) {
        errors.push(rp + ': region ' + region.id + ' not in ' + owner.id + ' (' + [...defs.keys()].join(', ') + ')');
        return;
      }
      const list = region.components ?? [];
      if (def.maxComponents !== undefined && list.length > def.maxComponents) {
        warnings.push(rp + ': only ' + def.maxComponents + ' rendered');
      }
      const excluded = (def.componentTypeExclusions ?? []).map((e) => e.typeId);
      list.forEach((c, ci) => {
        const cp = rp + '/components/' + ci;
        if (!c.id) return errors.push(cp + ': id required');
        if (seen.has(c.id)) errors.push(cp + ': duplicate id ' + c.id);
        seen.add(c.id);
        const type = components.types.get(c.typeId);
        if (!type) return errors.push(cp + ': unknown component type ' + c.typeId);
        if (excluded.includes(c.typeId)) errors.push(cp + ': ' + c.typeId + ' excluded from ' + region.id);
        checkData(c.data, type, cp);
        checkRegions(c.regions, type, cp);
      });
    });
  };

  if (!page?.id || !page.name || !page.typeId) errors.push('/: id, name and typeId are required');
  const pageType = pages.types.get(page?.typeId);
  if (page?.typeId && !pageType) errors.push('/typeId: unknown page type ' + page.typeId);
  if (pageType) {
    checkData(page.data, pageType, '');
    checkRegions(page.regions, pageType, '');
  }
  if (errors.length > 0 || input.dryRun) {
    return {pageId: page?.id, pushed: false, valid: errors.length === 0, errors, warnings};
  }

  const r = await scapi.request({
    method: 'PUT',
    path: base + 'pages/' + encodeURIComponent(page.id),
    query: {siteId: input.siteId},
    body: page,
  });
  if (!r.ok) return {stage: 'push', pageId: page.id, pushed: false, ...r, warnings};
  return {
    pageId: page.id,
    pushed: true,
    status: r.status === 201 ? 'created' : 'updated',
    typeId: r.data.typeId,
    regions: (r.data.regions ?? []).map((g) => ({id: g.id, components: (g.components ?? []).map((c) => c.id)})),
    warnings,
    note: 'Saved as a draft. Activate it in Business Manager.',
  };
}
