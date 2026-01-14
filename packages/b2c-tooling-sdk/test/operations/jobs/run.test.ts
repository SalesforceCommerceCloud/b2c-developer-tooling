/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  executeJob,
  getJobExecution,
  getJobErrorMessage,
  searchJobExecutions,
  findRunningJobExecution,
  getJobLog,
  JobExecutionError,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';

type FakeOcapi = {
  POST: (path: string, init: unknown) => Promise<{data?: unknown; error?: unknown; response: Response}>;
  GET: (path: string, init: unknown) => Promise<{data?: unknown; error?: unknown}>;
};

async function expectRejectsWith(promise: Promise<unknown>, message: string): Promise<void> {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (err) {
    expect(err).to.be.instanceOf(Error);
    expect((err as Error).message).to.include(message);
  }
}

describe('operations/jobs/run', () => {
  describe('getJobExecution', () => {
    it('returns execution when data exists', async () => {
      const instance = {
        ocapi: {
          async GET() {
            return {data: {id: 'e1', execution_status: 'running'}};
          },
        } as unknown as FakeOcapi,
      };

      const execution = await getJobExecution(instance as unknown as never, 'job-1', 'e1');
      expect(execution).to.deep.equal({id: 'e1', execution_status: 'running'});
    });

    it('throws with OCAPI fault message when error exists', async () => {
      const instance = {
        ocapi: {
          async GET() {
            return {error: {fault: {message: 'nope'}}};
          },
        } as unknown as FakeOcapi,
      };

      await expectRejectsWith(getJobExecution(instance as unknown as never, 'job-1', 'e1'), 'nope');
    });

    it('throws with fallback message when no data and no error', async () => {
      const instance = {
        ocapi: {
          async GET() {
            return {};
          },
        } as unknown as FakeOcapi,
      };

      await expectRejectsWith(
        getJobExecution(instance as unknown as never, 'job-1', 'e1'),
        'Failed to get job execution e1',
      );
    });
  });

  describe('getJobErrorMessage', () => {
    it('returns undefined when no step executions', () => {
      expect(getJobErrorMessage({} as unknown as never)).to.equal(undefined);
      expect(getJobErrorMessage({step_executions: []} as unknown as never)).to.equal(undefined);
    });

    it('returns the last ERROR step message', () => {
      const msg = getJobErrorMessage({
        step_executions: [
          {exit_status: {code: 'OK', message: 'ok-1'}},
          {exit_status: {code: 'ERROR', message: 'bad-1'}},
          {exit_status: {code: 'ERROR', message: 'bad-2'}},
        ],
      } as unknown as never);

      expect(msg).to.equal('bad-2');
    });

    it('returns undefined when ERROR step has no message', () => {
      const msg = getJobErrorMessage({
        step_executions: [{exit_status: {code: 'ERROR'}}],
      } as unknown as never);

      expect(msg).to.equal(undefined);
    });
  });

  describe('searchJobExecutions', () => {
    it('builds match_all_query when no filters provided', async () => {
      let seenBody: unknown;
      const instance = {
        ocapi: {
          async POST(_path: string, init: unknown) {
            const typedInit = init as {body?: unknown};
            seenBody = typedInit.body;
            return {data: {total: 0, count: 0, start: 0, hits: []}, response: new Response('{}', {status: 200})};
          },
        } as unknown as FakeOcapi,
      };

      const res = await searchJobExecutions(instance as unknown as never);
      expect(res).to.deep.equal({total: 0, count: 0, start: 0, hits: []});
      expect((seenBody as {query: unknown}).query).to.deep.equal({match_all_query: {}});
    });

    it('builds bool_query when multiple filters provided', async () => {
      let seenBody: unknown;
      const instance = {
        ocapi: {
          async POST(_path: string, init: unknown) {
            const typedInit = init as {body?: unknown};
            seenBody = typedInit.body;
            return {
              data: {total: 1, count: 1, start: 0, hits: [{id: 'e1'}]},
              response: new Response('{}', {status: 200}),
            };
          },
        } as unknown as FakeOcapi,
      };

      const res = await searchJobExecutions(instance as unknown as never, {
        jobId: 'job-1',
        status: ['RUNNING', 'PENDING'],
      });
      expect(res.hits[0]).to.deep.equal({id: 'e1'});
      expect((seenBody as {query: {bool_query: {must: unknown[]}}}).query.bool_query.must.length).to.equal(2);
    });

    it('throws when OCAPI returns error', async () => {
      const instance = {
        ocapi: {
          async POST() {
            return {error: {fault: {message: 'boom'}}, response: new Response('{}', {status: 500})};
          },
        } as unknown as FakeOcapi,
      };

      await expectRejectsWith(searchJobExecutions(instance as unknown as never), 'boom');
    });

    it('returns defaults when OCAPI returns partial response', async () => {
      const instance = {
        ocapi: {
          async POST() {
            return {data: {}, response: new Response('{}', {status: 200})};
          },
        } as unknown as FakeOcapi,
      };

      const res = await searchJobExecutions(instance as unknown as never);
      expect(res).to.deep.equal({total: 0, count: 0, start: 0, hits: []});
    });
  });

  describe('findRunningJobExecution', () => {
    it('returns first hit (or undefined)', async () => {
      const instance1 = {
        ocapi: {
          async POST() {
            return {data: {hits: [{id: 'e1'}]}, response: new Response('{}', {status: 200})};
          },
        } as unknown as FakeOcapi,
      };

      const instance2 = {
        ocapi: {
          async POST() {
            return {data: {hits: []}, response: new Response('{}', {status: 200})};
          },
        } as unknown as FakeOcapi,
      };

      expect((await findRunningJobExecution(instance1 as unknown as never, 'job-1'))?.id).to.equal('e1');
      expect(await findRunningJobExecution(instance2 as unknown as never, 'job-1')).to.equal(undefined);
    });
  });

  describe('getJobLog', () => {
    it('throws when log_file_path is missing', async () => {
      await expectRejectsWith(getJobLog({} as unknown as never, {} as unknown as never), 'No log file path available');
    });

    it('throws when is_log_file_existing is false', async () => {
      await expectRejectsWith(
        getJobLog(
          {} as unknown as never,
          {log_file_path: '/Sites/LOGS/jobs/x.log', is_log_file_existing: false} as unknown as never,
        ),
        'Log file does not exist',
      );
    });

    it('fetches log content via WebDAV and strips leading /Sites/', async () => {
      let seenPath: string | undefined;
      const instance = {
        webdav: {
          async get(p: string) {
            seenPath = p;
            return new TextEncoder().encode('hello').buffer;
          },
        },
      };

      const content = await getJobLog(
        instance as unknown as never,
        {
          log_file_path: '/Sites/LOGS/jobs/x.log',
          is_log_file_existing: true,
        } as unknown as never,
      );

      expect(seenPath).to.equal('LOGS/jobs/x.log');
      expect(content).to.equal('hello');
    });
  });

  describe('executeJob', () => {
    it('executes job without body when no params and no raw body', async () => {
      let seenBody: unknown;
      const instance = {
        ocapi: {
          async POST(_path: string, init: unknown) {
            const typedInit = init as {body?: unknown};
            seenBody = typedInit.body;
            return {
              data: {id: 'e1', execution_status: 'running'},
              response: new Response('{}', {status: 201}),
            };
          },
        } as unknown as FakeOcapi,
      };

      const res = await executeJob(instance as unknown as never, 'job-1');
      expect(res.id).to.equal('e1');
      expect(seenBody).to.equal(undefined);
    });

    it('executes job with parameters array when provided', async () => {
      let seenBody: unknown;
      const instance = {
        ocapi: {
          async POST(_path: string, init: unknown) {
            const typedInit = init as {body?: unknown};
            seenBody = typedInit.body;
            return {
              data: {id: 'e1', execution_status: 'running'},
              response: new Response('{}', {status: 201}),
            };
          },
        } as unknown as FakeOcapi,
      };

      await executeJob(instance as unknown as never, 'job-1', {
        parameters: [{name: 'A', value: '1'}] as unknown as never,
      });
      expect(seenBody).to.deep.equal({parameters: [{name: 'A', value: '1'}]});
    });

    it('executes job with raw body when provided', async () => {
      let seenBody: unknown;
      const instance = {
        ocapi: {
          async POST(_path: string, init: unknown) {
            const typedInit = init as {body?: unknown};
            seenBody = typedInit.body;
            return {
              data: {id: 'e1', execution_status: 'running'},
              response: new Response('{}', {status: 201}),
            };
          },
        } as unknown as FakeOcapi,
      };

      await executeJob(instance as unknown as never, 'job-1', {body: {foo: 'bar'}});
      expect(seenBody).to.deep.equal({foo: 'bar'});
    });

    it('throws JobAlreadyRunning when waitForRunning is false', async () => {
      const instance = {
        ocapi: {
          async POST() {
            return {
              data: undefined,
              error: undefined,
              response: new Response('JobAlreadyRunningException', {status: 400}),
            };
          },
        } as unknown as FakeOcapi,
      };

      await expectRejectsWith(
        executeJob(instance as unknown as never, 'job-1', {waitForRunning: false}),
        'Job job-1 is already running',
      );
    });

    it('throws with fault message on API failure', async () => {
      const instance = {
        ocapi: {
          async POST() {
            return {
              data: undefined,
              error: {fault: {message: 'bad'}},
              response: new Response('{}', {status: 500}),
            };
          },
        } as unknown as FakeOcapi,
      };

      await expectRejectsWith(executeJob(instance as unknown as never, 'job-1'), 'bad');
    });
  });

  describe('JobExecutionError', () => {
    it('is an Error with name JobExecutionError and carries execution', () => {
      const err = new JobExecutionError('failed', {id: 'e1'} as unknown as never);
      expect(err).to.be.instanceOf(Error);
      expect(err.name).to.equal('JobExecutionError');
      expect(err.execution).to.deep.equal({id: 'e1'});
    });
  });
});
