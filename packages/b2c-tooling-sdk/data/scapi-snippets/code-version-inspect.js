/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const r = await scapi.request({method: 'GET', path: '/dx/scripts/v1/organizations/{organizationId}/code-versions'});
  if (!r.ok) return {stage: 'versions', ...r};
  const versions = r.data.data;
  const offset = input.offset ?? 0;
  const selected = versions.slice(offset, offset + (input.limit ?? 10));
  const end = offset + selected.length;
  return {
    total: versions.length,
    active: versions.filter((v) => v.active).map((v) => v.id),
    rollback: versions.filter((v) => v.rollback).map((v) => v.id),
    returned: selected.length,
    hasMore: end < versions.length,
    nextOffset: selected.length && end < versions.length ? end : null,
    versions: selected.map((v) => ({
      id: v.id,
      active: v.active,
      rollback: v.rollback,
      activationTime: v.activationTime,
      lastModificationTime: v.lastModificationTime,
      compatibilityMode: v.compatibilityMode,
    })),
  };
}
