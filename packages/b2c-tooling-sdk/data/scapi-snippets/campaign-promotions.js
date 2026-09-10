/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  if (!siteId) throw new Error('SCAPI_SITE_REQUIRED: configure siteId for campaign inspection.');
  const campaignId = input.campaignId;
  const offset = input.offset ?? 0;
  const org = encodeURIComponent(organizationId);
  const assignments = await scapi.request({method: 'GET',
    path: '/pricing/campaigns/v1/organizations/' + org + '/campaigns/'
      + encodeURIComponent(campaignId) + '/promotions', query: {siteId}});
  if (!assignments.ok) return {stage: 'assignments', ...assignments};
  const all = assignments.data.data;
  const selected = all.slice(offset, offset + (input.limit ?? 12));
  const ids = [...new Set(selected.map(row => row.promotionId))];
  const details = new Map();
  for (let start = 0; start < ids.length; start += 4) {
    const batch = await Promise.all(ids.slice(start, start + 4).map(async id => {
      try {
        const r = await scapi.request({method: 'GET',
          path: '/pricing/promotions/v1/organizations/' + org + '/promotions/'
            + encodeURIComponent(id), query: {siteId}});
        return [id, r.ok ? {status: r.status, enabled: r.data.enabled,
          archived: r.data.archived, promotionClass: r.data.promotionClass} : r];
      } catch (error) {
        return [id, {error: String(error)}];
      }
    }));
    for (const [id, detail] of batch) details.set(id, detail);
  }
  const end = offset + selected.length;
  return {campaignId, siteId, total: all.length, returned: selected.length,
    nextOffset: end < all.length ? end : null,
    assignments: selected.map(row => ({promotionId: row.promotionId,
      assignmentEnabled: row.enabled, promotion: details.get(row.promotionId)}))};
}
