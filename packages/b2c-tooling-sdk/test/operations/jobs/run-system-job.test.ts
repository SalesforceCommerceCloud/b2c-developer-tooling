/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {runSystemJob} from '../../../src/operations/jobs/run-system-job.js';
import {JobExecutionError} from '../../../src/operations/jobs/run.js';
import {OcapiDeprecatedError} from '../../../src/clients/error-utils.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import type {B2CInstance} from '../../../src/instance/index.js';

const TEST_HOST = 'test.demandware.net';
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;
const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORG_ID = 'f_ecom_zzxy_prd';
const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/operation/jobs/v1`;
const JOB_ID = 'sfcc-site-archive-import';

const FAST_WAIT = {pollIntervalSeconds: 1, sleep: () => Promise.resolve()};

/**
 * Builds a B2CInstance-shaped object. `scapiConfig: true` makes
 * `scapiClientConfig` resolve so the SCAPI path is taken; the SCAPI client it
 * builds internally is intercepted by MSW like any other.
 */
function makeInstance(opts: {apiBackend?: 'ocapi' | 'scapi' | 'auto'; scapi?: boolean}): B2CInstance {
  const ocapi = createOcapiClient(TEST_HOST, new MockAuthStrategy());
  return {
    config: {hostname: TEST_HOST},
    apiBackend: opts.apiBackend ?? 'auto',
    scapiClientConfig: opts.scapi
      ? {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()}
      : undefined,
    ocapi,
    webdav: {
      get: async () => new TextEncoder().encode('log contents'),
    },
  } as unknown as B2CInstance;
}

const SPEC = {
  jobId: JOB_ID,
  ocapiBody: {file_name: 'a.zip'},
  parameters: [{name: 'ImportFile', value: 'a.zip'}],
  failVerb: 'execute import job',
  waitOptions: FAST_WAIT,
};

describe('operations/jobs/run-system-job', () => {
  const server = setupServer();

  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  describe('SCAPI path (auto + scapiClientConfig)', () => {
    it('runs over SCAPI and returns the raw OCAPI (snake_case) execution', async () => {
      let scapiPosted = false;
      let ocapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () => {
          scapiPosted = true;
          return HttpResponse.json({id: 'exec-1', jobId: JOB_ID, executionStatus: 'pending'});
        }),
        http.get(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions/exec-1`, () =>
          HttpResponse.json({
            id: 'exec-1',
            jobId: JOB_ID,
            executionStatus: 'finished',
            exitStatus: {code: 'OK', status: 'ok'},
          }),
        ),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () => {
          ocapiPosted = true;
          return HttpResponse.json({id: 'should-not-be-used'});
        }),
      );

      const execution = await runSystemJob(makeInstance({scapi: true}), SPEC);

      expect(scapiPosted).to.be.true;
      expect(ocapiPosted).to.be.false;
      // Public contract: raw OCAPI snake_case fields.
      expect(execution.id).to.equal('exec-1');
      expect(execution.execution_status).to.equal('finished');
      expect(execution.exit_status?.code).to.equal('OK');
    });

    it('throws a raw JobExecutionError when the SCAPI job fails (no fallback after start)', async () => {
      let ocapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({id: 'exec-2', jobId: JOB_ID, executionStatus: 'pending'}),
        ),
        http.get(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions/exec-2`, () =>
          HttpResponse.json({
            id: 'exec-2',
            jobId: JOB_ID,
            executionStatus: 'aborted',
            exitStatus: {code: 'ERROR', status: 'error', message: 'boom'},
          }),
        ),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () => {
          ocapiPosted = true;
          return HttpResponse.json({id: 'should-not-be-used'});
        }),
      );

      try {
        await runSystemJob(makeInstance({scapi: true}), SPEC);
        expect.fail('expected JobExecutionError');
      } catch (error) {
        expect(error).to.be.instanceOf(JobExecutionError);
        // Carries the raw OCAPI execution so callers' log-fetch handling works.
        expect((error as JobExecutionError).execution.id).to.equal('exec-2');
        expect((error as JobExecutionError).execution.execution_status).to.equal('aborted');
      }
      // Job had already started — must NOT have fallen back to OCAPI.
      expect(ocapiPosted).to.be.false;
    });

    it('does not wait when wait:false (returns the started execution)', async () => {
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({id: 'exec-3', jobId: JOB_ID, executionStatus: 'pending'}),
        ),
      );

      const execution = await runSystemJob(makeInstance({scapi: true}), {...SPEC, wait: false});
      expect(execution.id).to.equal('exec-3');
      expect(execution.execution_status).to.equal('pending');
    });
  });

  describe('auto fallback to OCAPI when SCAPI start fails', () => {
    it('falls back to OCAPI when the SCAPI start is rejected', async () => {
      let ocapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({title: 'Forbidden', detail: 'no scope'}, {status: 403}),
        ),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () => {
          ocapiPosted = true;
          return HttpResponse.json({id: 'ocapi-1', execution_status: 'finished', exit_status: {code: 'OK'}});
        }),
        http.get(`${OCAPI_BASE}/jobs/${JOB_ID}/executions/ocapi-1`, () =>
          HttpResponse.json({id: 'ocapi-1', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
      );

      const execution = await runSystemJob(makeInstance({scapi: true}), SPEC);
      expect(ocapiPosted).to.be.true;
      expect(execution.id).to.equal('ocapi-1');
      expect(execution.execution_status).to.equal('finished');
    });

    it('does NOT fall back on a 5xx SCAPI start (job outcome ambiguous)', async () => {
      let ocapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({title: 'Internal Server Error'}, {status: 500}),
        ),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () => {
          ocapiPosted = true;
          return HttpResponse.json({id: 'must-not-run'});
        }),
      );

      try {
        await runSystemJob(makeInstance({scapi: true}), SPEC);
        expect.fail('expected the 5xx to propagate');
      } catch (error) {
        expect((error as Error).message).to.be.a('string');
      }
      // A 5xx is ambiguous — the job may have started; must NOT re-run on OCAPI.
      expect(ocapiPosted).to.be.false;
    });

    it('does NOT fall back on a SCAPI network failure (request may have reached the server)', async () => {
      let ocapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () => HttpResponse.error()),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () => {
          ocapiPosted = true;
          return HttpResponse.json({id: 'must-not-run'});
        }),
      );

      try {
        await runSystemJob(makeInstance({scapi: true}), SPEC);
        expect.fail('expected the network error to propagate');
      } catch {
        // expected
      }
      expect(ocapiPosted).to.be.false;
    });
  });

  describe('OCAPI path', () => {
    it('uses OCAPI when no SCAPI config is present', async () => {
      let scapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () => {
          scapiPosted = true;
          return HttpResponse.json({id: 'nope'});
        }),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({id: 'ocapi-2', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
        http.get(`${OCAPI_BASE}/jobs/${JOB_ID}/executions/ocapi-2`, () =>
          HttpResponse.json({id: 'ocapi-2', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
      );

      const execution = await runSystemJob(makeInstance({scapi: false}), SPEC);
      expect(scapiPosted).to.be.false;
      expect(execution.id).to.equal('ocapi-2');
    });

    it('retries with the parameters body on UnknownPropertyException', async () => {
      let directBody: any;
      let retryBody: any;
      let calls = 0;
      server.use(
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, async ({request}) => {
          calls++;
          const body = (await request.json()) as any;
          if (calls === 1) {
            directBody = body;
            return HttpResponse.json(
              {fault: {type: 'UnknownPropertyException', arguments: {document: 'job_execution_request'}}},
              {status: 400},
            );
          }
          retryBody = body;
          return HttpResponse.json({id: 'ocapi-3', execution_status: 'finished', exit_status: {code: 'OK'}});
        }),
        http.get(`${OCAPI_BASE}/jobs/${JOB_ID}/executions/ocapi-3`, () =>
          HttpResponse.json({id: 'ocapi-3', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
      );

      const execution = await runSystemJob(makeInstance({scapi: false}), SPEC);
      expect(directBody).to.deep.equal({file_name: 'a.zip'});
      expect(retryBody).to.deep.equal({parameters: [{name: 'ImportFile', value: 'a.zip'}]});
      expect(execution.id).to.equal('ocapi-3');
    });

    it('throws OcapiDeprecatedError when OCAPI is deprecated', async () => {
      server.use(
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({fault: {type: 'OcapiDeprecatedException', message: 'deprecated'}}, {status: 403}),
        ),
      );

      try {
        await runSystemJob(makeInstance({scapi: false}), {...SPEC, deprecatedScopes: ['sfcc.jobs.rw']});
        expect.fail('expected OcapiDeprecatedError');
      } catch (error) {
        expect(error).to.be.instanceOf(OcapiDeprecatedError);
        expect((error as Error).message).to.include('"sfcc.jobs.rw"');
      }
    });
  });

  describe('explicit preference', () => {
    it('throws when apiBackend=scapi but the instance cannot reach SCAPI', async () => {
      try {
        await runSystemJob(makeInstance({apiBackend: 'scapi', scapi: false}), SPEC);
        expect.fail('expected an error');
      } catch (error) {
        expect((error as Error).message).to.include('SCAPI backend requires');
      }
    });

    it('forces OCAPI even when SCAPI config is present (apiBackend=ocapi)', async () => {
      let scapiPosted = false;
      server.use(
        http.post(`${SCAPI_BASE}/organizations/${ORG_ID}/jobs/${JOB_ID}/executions`, () => {
          scapiPosted = true;
          return HttpResponse.json({id: 'nope'});
        }),
        http.post(`${OCAPI_BASE}/jobs/${JOB_ID}/executions`, () =>
          HttpResponse.json({id: 'ocapi-4', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
        http.get(`${OCAPI_BASE}/jobs/${JOB_ID}/executions/ocapi-4`, () =>
          HttpResponse.json({id: 'ocapi-4', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
      );

      const execution = await runSystemJob(makeInstance({apiBackend: 'ocapi', scapi: true}), SPEC);
      expect(scapiPosted).to.be.false;
      expect(execution.id).to.equal('ocapi-4');
    });
  });
});
