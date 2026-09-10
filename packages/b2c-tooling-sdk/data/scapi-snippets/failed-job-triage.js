/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const {from, to} = input;
  if (Date.parse(from) >= Date.parse(to)) throw new Error('from must precede to.');
  const offset = input.offset ?? 0;
  const base = '/operation/jobs/v1/organizations/' + encodeURIComponent(organizationId);
  const search = await scapi.request({method: 'POST', path: base + '/job-execution-search',
    body: {query: {filteredQuery: {
      query: {termQuery: {fields: ['status'], operator: 'is', values: ['ERROR']}},
      filter: {rangeFilter: {field: 'startTime', from, to}}
    }}, sorts: [{field: 'startTime', sortOrder: 'desc'}], offset, limit: input.limit ?? 3}});
  if (!search.ok) return {stage: 'search', ...search};
  const hits = search.data.hits;
  const executions = await Promise.all(hits.map(async hit => {
    const identity = {id: hit.id, jobId: hit.jobId};
    try {
      const r = await scapi.request({method: 'GET', path: base + '/jobs/'
        + encodeURIComponent(hit.jobId) + '/executions/' + encodeURIComponent(hit.id)});
      if (!r.ok) return {...identity, ...r};
      const d = r.data;
      return {...identity, status: r.status, jobStatus: d.status, startTime: d.startTime,
        duration: d.duration, exitStatus: d.exitStatus, logFilePath: d.logFilePath};
    } catch (error) {
      return {...identity, error: String(error)};
    }
  }));
  const end = offset + hits.length;
  return {from, to, total: search.data.total, returned: hits.length,
    hasMore: end < search.data.total,
    nextOffset: hits.length && end < search.data.total ? end : null, executions};
}
