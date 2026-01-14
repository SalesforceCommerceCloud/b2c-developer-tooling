/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';

// Create a concrete test command class
class TestBaseCommand extends BaseCommand<typeof TestBaseCommand> {
  static id = 'test:base';
  static description = 'Test base command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testGetExtraParams() {
    return this.getExtraParams();
  }

  public testCatch(err: Error & {exitCode?: number}) {
    return this.catch(err);
  }
}

// Type for mocking command properties in tests
type MockableBaseCommand = TestBaseCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
  logger: {
    info: ((message: string, context?: Record<string, string | number | boolean>) => void) &
      ((context: Record<string, string | number | boolean>, message: string) => void);
    warn: ((message: string, context?: Record<string, string | number | boolean>) => void) &
      ((context: Record<string, string | number | boolean>, message: string) => void);
    error: ((message: string, context?: Record<string, string | number | boolean>) => void) &
      ((context: Record<string, string | number | boolean>, message: string) => void);
    debug: ((message: string, context?: Record<string, string | number | boolean>) => void) &
      ((context: Record<string, string | number | boolean>, message: string) => void);
  };
};

describe('cli/base-command', () => {
  let config: Config;
  let command: TestBaseCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestBaseCommand([], config);
  });

  afterEach(() => {
    restoreConfig();
  });

  describe('getExtraParams', () => {
    it('returns undefined when no extra params', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const params = command.testGetExtraParams();
      expect(params).to.be.undefined;

      cmd.parse = originalParse;
    });

    it('parses extra-query flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'extra-query': '{"debug":"true"}'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});

      cmd.parse = originalParse;
    });

    it('parses extra-body flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'extra-body': '{"_internal":true}'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const params = command.testGetExtraParams();
      expect(params?.body).to.deep.equal({_internal: true});

      cmd.parse = originalParse;
    });

    it('parses both extra-query and extra-body', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {
          'extra-query': '{"debug":"true"}',
          'extra-body': '{"_internal":true}',
        },
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
      expect(params?.body).to.deep.equal({_internal: true});

      cmd.parse = originalParse;
    });

    it('throws error for invalid JSON in extra-query', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'extra-query': 'invalid-json'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let errorCalled = false;
      const originalError = cmd.error.bind(command);
      cmd.error = () => {
        errorCalled = true;
        throw new Error('Expected error');
      };

      try {
        command.testGetExtraParams();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      cmd.error = originalError;
      cmd.parse = originalParse;
    });

    it('throws error for invalid JSON in extra-body', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'extra-body': 'invalid-json'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let errorCalled = false;
      const originalError = cmd.error.bind(command);
      cmd.error = () => {
        errorCalled = true;
        throw new Error('Expected error');
      };

      try {
        command.testGetExtraParams();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      cmd.error = originalError;
      cmd.parse = originalParse;
    });
  });

  describe('catch', () => {
    it('handles errors with exit code', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {json: false},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let errorCalled = false;
      const originalError = cmd.error.bind(command);
      cmd.error = () => {
        errorCalled = true;
        throw new Error('Expected error');
      };

      const error = new Error('Test error') as Error & {exitCode?: number};
      error.exitCode = 2;

      try {
        await command.testCatch(error);
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      cmd.error = originalError;
      cmd.parse = originalParse;
    });

    it('outputs JSON error in JSON mode', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {json: true},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();

      // Mock jsonEnabled to return true
      const originalJsonEnabled = cmd.jsonEnabled?.bind(command);
      cmd.jsonEnabled = () => true;

      let writtenData = '';
      const originalWrite = process.stderr.write.bind(process.stderr);
      process.stderr.write = (chunk: string | Buffer) => {
        writtenData += chunk.toString();
        return true;
      };

      const originalExit = process.exit.bind(process);
      let exitCode: number | undefined;
      process.exit = (code?: number) => {
        exitCode = code;
        throw new Error('Exit called');
      };

      const error = new Error('Test error');

      try {
        await command.testCatch(error);
      } catch {
        // Expected
      }

      // In JSON mode, error should be written to stderr as JSON
      expect(writtenData).to.include('error');
      expect(writtenData).to.include('Test error');
      expect(exitCode).to.equal(1);

      process.stderr.write = originalWrite;
      process.exit = originalExit;
      if (originalJsonEnabled) {
        cmd.jsonEnabled = originalJsonEnabled;
      }
      cmd.parse = originalParse;
    });
  });
});
