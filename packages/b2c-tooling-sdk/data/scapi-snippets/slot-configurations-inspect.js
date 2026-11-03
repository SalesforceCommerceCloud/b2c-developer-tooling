/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const query = input.slotId
    ? {termQuery: {fields: ['slotId'], operator: 'is', values: [input.slotId]}}
    : {matchAllQuery: {}};
  const r = await scapi.request({
    method: 'POST',
    path: '/experience/experiences/v1/organizations/{organizationId}/slot-configurations-search',
    query: {siteId: input.siteId},
    body: {query, limit: input.limit ?? 25, offset: input.offset ?? 0},
  });
  if (!r.ok) return {stage: 'search', ...r};
  const hits = (r.data.hits ?? []).filter((c) => !input.context || c.context === input.context);
  const offset = r.data.offset ?? input.offset ?? 0;
  const next = offset + (r.data.hits?.length ?? 0);
  return {
    total: r.data.total,
    nextOffset: next < (r.data.total ?? 0) ? next : null,
    configurations: hits.map((c) => ({
      slotId: c.slotId,
      configurationId: c.configurationId,
      context: c.context,
      contextId: c.contextId,
      enabled: c.enabled,
      active: c.assignmentInformation?.active,
      default: c.default,
      schedule: c.schedule && Object.keys(c.schedule).length ? c.schedule : undefined,
      customerGroups: c.customerGroups,
      rank: c.rank,
      contentType: c.slotContent?.type,
      content:
        c.slotContent?.contentAssetIds ??
        c.slotContent?.productIds ??
        c.slotContent?.categoryIds ??
        (c.slotContent?.body ? '(html)' : undefined),
      template: c.template,
    })),
  };
}
