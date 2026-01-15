/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';

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
    config = await Config.load();
    command = new TestBaseCommand([], config);
  });

  describe('init', () => {
    it('initializes command with default flags', async () => {
      // Mock parse method
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();

      expect(cmd.flags).to.be.an('object');
      expect(cmd.args).to.be.an('object');
      expect(cmd.resolvedConfig).to.be.an('object');
      expect(cmd.logger).to.exist;
      expect(cmd.logger.info).to.be.a('function');

      cmd.parse = originalParse;
    });

    it('handles log-level flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'log-level': 'debug'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.logger).to.exist;
      expect(cmd.logger.info).to.be.a('function');

      cmd.parse = originalParse;
    });

    it('handles debug flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {debug: true},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.logger).to.exist;
      expect(cmd.logger.info).to.be.a('function');

      cmd.parse = originalParse;
    });

    it('handles json flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {json: true},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.json).to.be.true;

      cmd.parse = originalParse;
    });

    it('handles lang flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {lang: 'de'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.lang).to.equal('de');

      cmd.parse = originalParse;
    });

    it('handles config flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {config: '/custom/dw.json'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.config).to.equal('/custom/dw.json');

      cmd.parse = originalParse;
    });

    it('handles instance flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {instance: 'test-instance'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.instance).to.equal('test-instance');

      cmd.parse = originalParse;
    });
  });

  describe('configureLogging', () => {
    it('configures logger with default level', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.logger).to.exist;
      expect(cmd.logger.info).to.be.a('function');

      cmd.parse = originalParse;
    });

    it('configures logger with log-level flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'log-level': 'warn'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.logger).to.exist;
      expect(cmd.logger.info).to.be.a('function');

      cmd.parse = originalParse;
    });

    it('configures logger with debug flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {debug: true},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.logger).to.exist;
      expect(cmd.logger.info).to.be.a('function');

      cmd.parse = originalParse;
    });
  });

  describe('log', () => {
    it('logs message using logger', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let loggedMessage = '';
      const originalInfo = cmd.logger.info.bind(cmd.logger);
      cmd.logger.info = ((message: string) => {
        loggedMessage = message;
      }) as typeof cmd.logger.info;

      cmd.log('Test message');
      expect(loggedMessage).to.equal('Test message');

      cmd.logger.info = originalInfo;
      cmd.parse = originalParse;
    });

    it('logs message with args', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let loggedMessage = '';
      const originalInfo = cmd.logger.info.bind(cmd.logger);
      cmd.logger.info = ((message: string) => {
        loggedMessage = message;
      }) as typeof cmd.logger.info;

      cmd.log('Test message', 'arg1', 'arg2');
      expect(loggedMessage).to.include('Test message');
      expect(loggedMessage).to.include('arg1');
      expect(loggedMessage).to.include('arg2');

      cmd.logger.info = originalInfo;
      cmd.parse = originalParse;
    });
  });

  describe('warn', () => {
    it('warns with string message', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let warnedMessage = '';
      const originalWarn = cmd.logger.warn.bind(cmd.logger);
      cmd.logger.warn = ((msg: string) => {
        warnedMessage = msg;
      }) as typeof cmd.logger.warn;

      const result = cmd.warn('Warning message');
      expect(result).to.equal('Warning message');
      expect(warnedMessage).to.equal('Warning message');

      cmd.logger.warn = originalWarn;
      cmd.parse = originalParse;
    });

    it('warns with Error object', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let warnedMessage = '';
      const originalWarn = cmd.logger.warn.bind(cmd.logger);
      cmd.logger.warn = ((msg: string) => {
        warnedMessage = msg;
      }) as typeof cmd.logger.warn;

      const error = new Error('Error message');
      const result = cmd.warn(error);
      expect(result).to.equal(error);
      expect(warnedMessage).to.equal('Error message');

      cmd.logger.warn = originalWarn;
      cmd.parse = originalParse;
    });
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

      // Error is thrown during init() when registerExtraParamsMiddleware() calls getExtraParams()
      let errorThrown = false;
      try {
        await cmd.init();
      } catch (err) {
        errorThrown = true;
        expect((err as Error).message).to.include('Invalid JSON for --extra-query');
      }

      expect(errorThrown).to.be.true;
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

      // Error is thrown during init() when registerExtraParamsMiddleware() calls getExtraParams()
      let errorThrown = false;
      try {
        await cmd.init();
      } catch (err) {
        errorThrown = true;
        expect((err as Error).message).to.include('Invalid JSON for --extra-body');
      }

      expect(errorThrown).to.be.true;
      cmd.parse = originalParse;
    });

    it('parses extra-headers flag', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'extra-headers': '{"X-Custom-Header":"value"}'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const params = command.testGetExtraParams();
      expect(params?.headers).to.deep.equal({'X-Custom-Header': 'value'});

      cmd.parse = originalParse;
    });

    it('parses extra-query, extra-body, and extra-headers together', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {
          'extra-query': '{"debug":"true"}',
          'extra-body': '{"_internal":true}',
          'extra-headers': '{"X-Custom":"value"}',
        },
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
      expect(params?.body).to.deep.equal({_internal: true});
      expect(params?.headers).to.deep.equal({'X-Custom': 'value'});

      cmd.parse = originalParse;
    });

    it('throws error for invalid JSON in extra-headers', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'extra-headers': 'invalid-json'},
        metadata: {},
      })) as typeof cmd.parse;

      // Error is thrown during init() when registerExtraParamsMiddleware() calls getExtraParams()
      let errorThrown = false;
      try {
        await cmd.init();
      } catch (err) {
        errorThrown = true;
        expect((err as Error).message).to.include('Invalid JSON for --extra-headers');
      }

      expect(errorThrown).to.be.true;
      cmd.parse = originalParse;
    });
  });

  describe('baseCommandTest', () => {
    it('logs test message', async () => {
      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let loggedMessage = '';
      const originalInfo = cmd.logger.info.bind(cmd.logger);
      cmd.logger.info = ((message: string) => {
        loggedMessage = message;
      }) as typeof cmd.logger.info;

      cmd.baseCommandTest();
      expect(loggedMessage).to.include('BaseCommand initialized');

      cmd.logger.info = originalInfo;
      cmd.parse = originalParse;
    });
  });

  describe('shouldColorize', () => {
    it('respects NO_COLOR environment variable', async () => {
      const originalNoColor = process.env.NO_COLOR;
      process.env.NO_COLOR = '1';

      const cmd = command as MockableBaseCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // shouldColorize is private, so we test it indirectly through configureLogging
      // The logger will be configured with colorize=false when NO_COLOR is set
      expect(cmd.logger).to.exist;

      if (originalNoColor !== undefined) {
        process.env.NO_COLOR = originalNoColor;
      } else {
        delete process.env.NO_COLOR;
      }

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
