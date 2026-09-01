/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {searchJobExecutions} from '../../../src/operations/jobs/scapi-ops.js';
import type {ScapiJobsClient} from '../../../src/clients/scapi-jobs.js';

interface CapturedRequest {
  path: string;
  init: {body?: unknown; params?: unknown; headers?: Record<string, string>};
}

function makeFakeClient(captured: CapturedRequest[], data: unknown): ScapiJobsClient {
  return {
    async POST(path: string, init: unknown) {
      const typed = init as CapturedRequest['init'];
      captured.push({path, init: typed});
      return {data, error: undefined, response: new Response('{}', {status: 200})};
    },
    async GET() {
      return {data: undefined, error: undefined, response: new Response('{}', {status: 200})};
    },
  } as unknown as ScapiJobsClient;
}

describe('operations/jobs/scapi-ops', () => {
  describe('searchJobExecutions', () => {
    // The SCAPI Job-Executions search endpoint reuses the OCAPI-style query
    // DSL: term-query `fields` and the `sorts[].field` use the legacy
    // snake_case names (`job_id`, `start_time`), even though the response
    // schema returns camelCase (`jobId`, `startTime`). This test pins that
    // contract so an accidental rename to camelCase doesn't break searches
    // against the real API.
    it('pins SCAPI search request body to OCAPI-style search field names', async () => {
      const captured: CapturedRequest[] = [];
      const client = makeFakeClient(captured, {total: 0, limit: 25, offset: 0, hits: []});

      await searchJobExecutions(client, {
        tenantId: 'zzxy_dev',
        jobId: 'my-job',
        status: ['RUNNING', 'PENDING'],
        sortBy: 'start_time',
        sortOrder: 'desc',
      });

      expect(captured).to.have.length(1);
      const body = captured[0].init.body as {
        query: {boolQuery: {must: Array<{termQuery: {fields: string[]; values: string[]}}>}};
        sorts: Array<{field: string; sortOrder: string}>;
        limit: number;
        offset: number;
      };

      // Search-field names are still snake_case on this endpoint.
      expect(body.query.boolQuery.must[0].termQuery.fields).to.deep.equal(['job_id']);
      expect(body.query.boolQuery.must[0].termQuery.values).to.deep.equal(['my-job']);
      expect(body.sorts[0].field).to.equal('start_time');
      expect(body.sorts[0].sortOrder).to.equal('desc');
    });

    it('uses matchAllQuery when no filters are provided', async () => {
      const captured: CapturedRequest[] = [];
      const client = makeFakeClient(captured, {total: 0, limit: 25, offset: 0, hits: []});

      await searchJobExecutions(client, {tenantId: 'zzxy_dev'});

      const body = captured[0].init.body as {query: {matchAllQuery: Record<string, unknown>}};
      expect(body.query).to.deep.equal({matchAllQuery: {}});
    });

    it('attaches the read scope-mode header', async () => {
      const captured: CapturedRequest[] = [];
      const client = makeFakeClient(captured, {total: 0, limit: 25, offset: 0, hits: []});

      await searchJobExecutions(client, {tenantId: 'zzxy_dev'});

      expect(captured[0].init.headers?.['x-b2c-scope-mode']).to.equal('read');
    });
  });
});
