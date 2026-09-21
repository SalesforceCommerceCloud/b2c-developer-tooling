/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  if (Date.parse(input.from) >= Date.parse(input.to)) throw new Error('from must precede to.');
  const offset = input.offset ?? 0;
  const query = {
    filteredQuery: {
      query: {matchAllQuery: {}},
      filter: {rangeFilter: {field: 'startTime', from: input.from, to: input.to}},
    },
  };
  if (input.jobId) query.filteredQuery.query = {termQuery: {fields: ['jobId'], operator: 'is', values: [input.jobId]}};
  const r = await scapi.request({
    method: 'POST',
    path: '/operation/jobs/v1/organizations/{organizationId}/job-execution-search',
    body: {query, sorts: [{field: 'startTime', sortOrder: 'desc'}], offset, limit: input.limit ?? 10},
  });
  if (!r.ok) return {stage: 'search', ...r};
  const hits = r.data.hits;
  const end = offset + hits.length;
  return {
    from: input.from,
    to: input.to,
    total: r.data.total,
    returned: hits.length,
    hasMore: end < r.data.total,
    nextOffset: hits.length && end < r.data.total ? end : null,
    executions: hits.map((d) => ({
      id: d.id,
      jobId: d.jobId,
      executionStatus: d.executionStatus,
      status: d.status,
      exitStatus: d.exitStatus,
      startTime: d.startTime,
      endTime: d.endTime,
      duration: d.duration,
      logFilePath: d.logFilePath,
      isLogFileExisting: d.isLogFileExisting,
    })),
  };
}
