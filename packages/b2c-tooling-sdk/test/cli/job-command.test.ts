/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Config} from '@oclif/core';
import sinon from 'sinon';
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {JobExecution} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';

// Create a test command class
class TestJobCommand extends JobCommand<typeof TestJobCommand> {
  static id = 'test:job';
  static description = 'Test job command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testShowJobLog(execution: JobExecution) {
    return this.showJobLog(execution);
  }

  protected async sleepBeforeLogRetry(): Promise<void> {}
}

// Type for mocking command properties in tests
type MockableJobCommand = TestJobCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
} & Record<string, B2CInstance | undefined>;

describe('cli/job-command', () => {
  let config: Config;
  let command: TestJobCommand;
  let mockInstance: B2CInstance;

  // MSW server to intercept HTTP requests (avoids real network timeouts)
  const server = setupServer(
    http.all('https://test.demandware.net/*', () => {
      return new HttpResponse(null, {status: 404});
    }),
  );

  before(() => server.listen({onUnhandledRequest: 'bypass'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  beforeEach(async () => {
    config = await Config.load();
    command = new TestJobCommand([], config);
    mockInstance = new B2CInstance(
      {
        hostname: 'test.demandware.net',
        codeVersion: 'v1',
      },
      {
        oauth: {
          clientId: 'test-client',
          clientSecret: 'test-secret',
        },
      },
    );
  });

  describe('showJobLog', () => {
    it('handles execution without log file', async () => {
      const cmd = command as MockableJobCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      (cmd as Record<string, B2CInstance | undefined>)._instance = mockInstance;

      const execution: JobExecution = {
        id: 'test-job',
        execution_status: 'aborted',
        is_log_file_existing: false,
      } as JobExecution;

      // Should not throw
      await command.testShowJobLog(execution);

      cmd.parse = originalParse;
    });

    it('handles execution with log file but fetch fails', async () => {
      const cmd = command as MockableJobCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      (cmd as Record<string, B2CInstance | undefined>)._instance = mockInstance;

      // Stub WebDAV get to fail immediately (instead of a real network timeout)
      sinon.stub(mockInstance.webdav, 'get').rejects(new Error('WebDAV fetch failed'));

      // Stub warn to avoid noise in test output for expected warning
      const warnStub = sinon.stub(command, 'warn');

      const execution: JobExecution = {
        id: 'test-job',
        execution_status: 'aborted',
        is_log_file_existing: true,
        log_file_path: '/path/to/log',
      } as JobExecution;

      // Should not throw (handles error gracefully)
      try {
        await command.testShowJobLog(execution);
      } catch {
        // Expected if getJobLog fails
      }

      warnStub.restore();
      cmd.parse = originalParse;
    });

    it('extracts error message from execution', async () => {
      const cmd = command as MockableJobCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      (cmd as Record<string, B2CInstance | undefined>)._instance = mockInstance;

      const execution: JobExecution = {
        id: 'test-job',
        execution_status: 'aborted',
        is_log_file_existing: false,
        step_executions: [
          {
            execution_status: 'aborted',
          },
        ],
      } as JobExecution;

      // Should not throw
      await command.testShowJobLog(execution);

      cmd.parse = originalParse;
    });
    describe('log diagnostics', () => {
      async function initCommand(): Promise<void> {
        const cmd = command as MockableJobCommand;
        cmd.parse = (async () => ({
          args: {},
          flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
          metadata: {},
        })) as typeof cmd.parse;
        await cmd.init();
        (cmd as Record<string, B2CInstance | undefined>)._instance = mockInstance;
      }

      function stubLogger(): sinon.SinonStub {
        const logger = (command as unknown as {logger: {error: (...args: unknown[]) => void}}).logger;
        return sinon.stub(logger, 'error');
      }

      function stubDispatcher(results: Array<Partial<{isLogFileExisting: boolean; logFilePath: string}> | Error>) {
        const run = sinon.stub();
        results.forEach((result, i) => {
          if (result instanceof Error) run.onCall(i).rejects(result);
          else run.onCall(i).resolves({id: 'e1', jobId: 'my-job', executionStatus: 'finished', ...result});
        });
        sinon.stub(command as unknown as {createJobsDispatcher: () => unknown}, 'createJobsDispatcher').returns({run});
        return run;
      }

      afterEach(() => sinon.restore());

      it('re-checks the execution when the log is not flagged as written yet', async () => {
        await initCommand();
        const run = stubDispatcher([
          {isLogFileExisting: false},
          {isLogFileExisting: true, logFilePath: '/Sites/LOGS/jobs/my-job/Job-my-job.log'},
        ]);
        const get = sinon
          .stub(mockInstance.webdav, 'get')
          .resolves(new TextEncoder().encode('line\n[2026-10-29] ERROR x [DATAERROR] Site MySite not found\n').buffer);
        const errorStub = stubLogger();

        await command.testShowJobLog({
          id: 'e1',
          job_id: 'my-job',
          execution_status: 'finished',
          is_log_file_existing: false,
        } as JobExecution);

        expect(run.callCount).to.equal(2);
        expect(get.calledOnceWith('LOGS/jobs/my-job/Job-my-job.log')).to.equal(true);
        const messages = errorStub.getCalls().map((call) => String(call.args.at(-1)));
        expect(messages.some((m) => m.includes('Data errors:\n[DATAERROR] Site MySite not found'))).to.equal(true);
      });

      it('falls back without a log when re-checking fails', async () => {
        await initCommand();
        const run = stubDispatcher([new Error('boom')]);
        const get = sinon.stub(mockInstance.webdav, 'get');
        stubLogger();

        await command.testShowJobLog({
          id: 'e1',
          job_id: 'my-job',
          execution_status: 'finished',
          is_log_file_existing: false,
        } as JobExecution);

        expect(run.callCount).to.equal(1);
        expect(get.called).to.equal(false);
      });

      it('includes the failure reason and a WebDAV hint when the log cannot be fetched', async () => {
        await initCommand();
        sinon.stub(mockInstance.webdav, 'get').rejects(new Error('GET failed: 401 Unauthorized'));
        const warnStub = sinon.stub(command, 'warn');

        await command.testShowJobLog({
          id: 'e1',
          job_id: 'my-job',
          execution_status: 'finished',
          is_log_file_existing: true,
          log_file_path: '/Sites/LOGS/jobs/my-job/Job-my-job.log',
        } as JobExecution);

        const message = String(warnStub.firstCall.args[0]);
        expect(message).to.include('GET failed: 401 Unauthorized');
        expect(message).to.include('b2c webdav get --root logs jobs/my-job/Job-my-job.log --user-auth');
      });
    });
  });
});
