/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const r = await scapi.request({
    method: 'GET',
    path:
      '/operation/jobs/v1/organizations/{organizationId}/jobs/' +
      encodeURIComponent(input.jobId) +
      '/executions/' +
      encodeURIComponent(input.executionId),
  });
  if (!r.ok) return {stage: 'execution', ...r};
  const d = r.data;
  const steps = d.stepExecutions ?? [];
  const offset = input.offset ?? 0;
  const selected = steps.slice(offset, offset + (input.limit ?? 10));
  const end = offset + selected.length;
  return {
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
    totalSteps: steps.length,
    returned: selected.length,
    hasMore: end < steps.length,
    nextOffset: selected.length && end < steps.length ? end : null,
    steps: selected.map((s) => ({
      id: s.id,
      stepId: s.stepId,
      executionScope: s.executionScope,
      executionStatus: s.executionStatus,
      status: s.status,
      exitStatus: s.exitStatus,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      totalItemCount: s.totalItemCount,
      itemWriteCount: s.itemWriteCount,
    })),
  };
}
