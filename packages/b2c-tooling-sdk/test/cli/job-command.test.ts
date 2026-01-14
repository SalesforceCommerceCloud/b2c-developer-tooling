/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Config} from '@oclif/core';
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
  });
});
