/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const r = await scapi.request({
    method: 'GET',
    path: '/site/sites/v1/organizations/{organizationId}/sites/' + encodeURIComponent(input.siteId),
  });
  if (!r.ok) return {stage: 'site', ...r};
  const site = r.data;
  const cartridges = site.cartridges?.split(':').filter(Boolean);
  const customCartridges = site.customCartridges?.split(':').filter(Boolean);
  return {
    siteId: site.id,
    siteCatalogId: site.siteCatalogId,
    storefrontStatus: site.storefrontStatus,
    lastModified: site.lastModified,
    cartridges,
    customCartridges,
    missing:
      cartridges === undefined ? null : (input.expectedCartridges ?? []).filter((name) => !cartridges.includes(name)),
  };
}
