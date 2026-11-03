/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const path =
    '/product/catalogs/v1/organizations/' +
    encodeURIComponent(organizationId) +
    '/catalogs/' +
    encodeURIComponent(input.catalogId) +
    '/categories/' +
    encodeURIComponent(input.categoryId) +
    '/rules-execution';
  const type = input.execute ? 'execution' : 'evaluation';
  const project = (d) => ({
    type: d.type,
    jobStatus: d.jobStatus,
    lastRunDate: d.lastRunDate,
    message: d.message,
    matchedCount: d.matchedCount,
    assignedCount: d.assignedCount,
    unassignedCount: d.unassignedCount,
    productIds: d.productIds,
  });
  // Live status reports in_progress; the contract enum says inProgress.
  const running = (s) => /^in[_-]?progress$/i.test(s ?? '');
  const status = () => scapi.request({method: 'GET', path, query: {limit: input.limit ?? 10, offset: input.offset ?? 0}});
  if (!input.statusOnly) {
    const before = await status();
    if (!before.ok) return {stage: 'inspect', ...before};
    if (running(before.data?.jobStatus)) return {state: 'already_running', ...project(before.data)};
    const started = await scapi.request({method: 'POST', path, body: {evaluation: !input.execute}});
    if (!started.ok) return {stage: 'start', type, ...started};
  }
  let last;
  for (let poll = 0; poll < (input.polls ?? 6); poll++) {
    last = await status();
    if (!last.ok) return {stage: 'status', type, ...last};
    if (!running(last.data?.jobStatus)) break;
  }
  const d = last.data;
  return {
    state: running(d.jobStatus) ? 'running' : d.jobStatus,
    started: !input.statusOnly,
    ...project(d),
    ...(running(d.jobStatus) ? {continuation: {...input, statusOnly: true}} : {}),
    ...(d.productIds && (d.matchedCount ?? 0) > (input.offset ?? 0) + d.productIds.length
      ? {nextOffset: (input.offset ?? 0) + d.productIds.length}
      : {}),
  };
}
