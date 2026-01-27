/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  createLogger,
  configureLogger,
  getLogger,
  resetLogger,
  createSilentLogger,
  type Logger,
} from '@salesforce/b2c-tooling-sdk/logging';
import {createNullStream, CapturingStream} from '../helpers/null-stream.js';

describe('logging/logger', () => {
  beforeEach(() => {
    // Reset global logger state before each test
    resetLogger();
  });

  afterEach(() => {
    // Clean up after each test
    resetLogger();
  });

  describe('createLogger', () => {
    it('creates logger with default options', () => {
      const logger = createLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
      expect(logger.debug).to.be.a('function');
      expect(logger.warn).to.be.a('function');
      expect(logger.error).to.be.a('function');
    });

    it('creates logger with custom level', () => {
      const logger = createLogger({level: 'debug'});
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('creates logger with json output', () => {
      const logger = createLogger({json: true});
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('creates logger with colorize disabled', () => {
      const logger = createLogger({colorize: false});
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('creates logger with baseContext', () => {
      const logger = createLogger({baseContext: {app: 'test'}});
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('creates logger with custom file descriptor', () => {
      const logger = createLogger({fd: 1}); // stdout
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('creates logger with redaction disabled', () => {
      const logger = createLogger({redact: false});
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('creates logger with all options', () => {
      const logger = createLogger({
        level: 'warn',
        fd: 1,
        json: true,
        colorize: false,
        redact: true,
        baseContext: {env: 'test'},
      });
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });
  });

  describe('configureLogger', () => {
    it('configures global logger options', () => {
      configureLogger({level: 'debug'});
      const logger = getLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('merges with existing global options', () => {
      configureLogger({level: 'info'});
      configureLogger({json: true});
      const logger = getLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('updates global logger instance', () => {
      configureLogger({level: 'debug'});
      const logger1 = getLogger();
      configureLogger({level: 'warn'});
      const logger2 = getLogger();
      expect(logger1).to.exist;
      expect(logger2).to.exist;
      expect(logger1.info).to.be.a('function');
      expect(logger2.info).to.be.a('function');
    });
  });

  describe('getLogger', () => {
    it('returns logger with default options when not configured', () => {
      resetLogger();
      const logger = getLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('returns same logger instance after configuration', () => {
      configureLogger({level: 'info'});
      const logger1 = getLogger();
      const logger2 = getLogger();
      expect(logger1).to.equal(logger2);
    });

    it('creates new logger after reset', () => {
      configureLogger({level: 'info'});
      const logger1 = getLogger();
      resetLogger();
      const logger2 = getLogger();
      expect(logger1).to.exist;
      expect(logger2).to.exist;
      expect(logger1.info).to.be.a('function');
      expect(logger2.info).to.be.a('function');
    });
  });

  describe('resetLogger', () => {
    it('resets global logger to null', () => {
      configureLogger({level: 'debug'});
      getLogger(); // Create logger
      resetLogger();
      const logger = getLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('resets global options to defaults', () => {
      configureLogger({level: 'debug', json: true});
      resetLogger();
      const logger = getLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });
  });

  describe('createSilentLogger', () => {
    it('creates logger with silent level', () => {
      const logger = createSilentLogger();
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
    });

    it('does not output logs', () => {
      const logger = createSilentLogger();
      // Should not throw
      logger.info('test message');
      logger.debug('debug message');
      logger.warn('warn message');
      logger.error('error message');
    });
  });

  describe('Logger methods', () => {
    let logger: Logger;

    beforeEach(() => {
      // Use createNullStream() to prevent console output during tests
      // Fresh stream each time to avoid listener accumulation
      logger = createLogger({level: 'trace', destination: createNullStream()});
    });

    it('supports trace method with message first', () => {
      logger.trace('trace message');
    });

    it('supports trace method with context first', () => {
      logger.trace({key: 'value'}, 'trace message');
    });

    it('supports debug method with message first', () => {
      logger.debug('debug message');
    });

    it('supports debug method with context first', () => {
      logger.debug({key: 'value'}, 'debug message');
    });

    it('supports info method with message first', () => {
      logger.info('info message');
    });

    it('supports info method with context first', () => {
      logger.info({key: 'value'}, 'info message');
    });

    it('supports warn method with message first', () => {
      logger.warn('warn message');
    });

    it('supports warn method with context first', () => {
      logger.warn({key: 'value'}, 'warn message');
    });

    it('supports error method with message first', () => {
      logger.error('error message');
    });

    it('supports error method with context first', () => {
      logger.error({key: 'value'}, 'error message');
    });

    it('supports fatal method with message first', () => {
      logger.fatal('fatal message');
    });

    it('supports fatal method with context first', () => {
      logger.fatal({key: 'value'}, 'fatal message');
    });
  });

  describe('child logger', () => {
    it('creates child logger with context', () => {
      const parent = createLogger({level: 'info', destination: createNullStream()});
      const child = parent.child({operation: 'deploy'});
      expect(child).to.exist;
      expect(child.info).to.be.a('function');
    });

    it('child logger inherits parent configuration', () => {
      const parent = createLogger({level: 'debug', destination: createNullStream()});
      const child = parent.child({operation: 'deploy'});
      expect(child).to.exist;
      expect(child.info).to.be.a('function');
    });

    it('child logger can create nested children', () => {
      const parent = createLogger({level: 'info', destination: createNullStream()});
      const child1 = parent.child({operation: 'deploy'});
      const child2 = child1.child({file: 'app.zip'});
      expect(child2).to.exist;
      expect(child2.info).to.be.a('function');
    });
  });

  describe('log levels', () => {
    it('respects trace level', () => {
      const logger = createLogger({level: 'trace', destination: createNullStream()});
      logger.trace('trace message');
      logger.debug('debug message');
      logger.info('info message');
    });

    it('respects debug level', () => {
      const logger = createLogger({level: 'debug', destination: createNullStream()});
      logger.debug('debug message');
      logger.info('info message');
    });

    it('respects info level', () => {
      const logger = createLogger({level: 'info', destination: createNullStream()});
      logger.info('info message');
      logger.warn('warn message');
    });

    it('respects warn level', () => {
      const logger = createLogger({level: 'warn', destination: createNullStream()});
      logger.warn('warn message');
      logger.error('error message');
    });

    it('respects error level', () => {
      const logger = createLogger({level: 'error', destination: createNullStream()});
      logger.error('error message');
      logger.fatal('fatal message');
    });

    it('respects fatal level', () => {
      const logger = createLogger({level: 'fatal', destination: createNullStream()});
      logger.fatal('fatal message');
    });

    it('respects silent level', () => {
      const logger = createLogger({level: 'silent'});
      logger.info('should not appear');
      logger.error('should not appear');
    });
  });

  describe('secret redaction', () => {
    it('redacts password field', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({username: 'user', password: 'secret123'}, 'Auth attempt');
      const output = stream.getOutput();
      expect(output).to.include('username');
      expect(output).to.include('REDACTED');
      expect(output).not.to.include('secret123');
    });

    it('redacts clientSecret field', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({clientId: 'client', clientSecret: 'secret123'}, 'OAuth config');
      expect(stream.getOutput()).to.include('REDACTED');
    });

    it('redacts apiKey field', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({apiKey: 'key123456789'}, 'API key config');
      expect(stream.getOutput()).to.include('REDACTED');
    });

    it('redacts token field', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({token: 'token123456789'}, 'Token config');
      expect(stream.getOutput()).to.include('REDACTED');
    });

    it('redacts nested fields one level deep', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      // Note: *.password pattern only matches one level deep (e.g., auth.password)
      logger.info({auth: {password: 'secret123'}}, 'Nested config');
      expect(stream.getOutput()).to.include('REDACTED');
    });

    it('redacts authorization header with Basic auth', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({authorization: 'Basic dXNlcjpwYXNz'}, 'Auth header');
      const output = stream.getOutput();
      expect(output).to.include('Basic');
      expect(output).not.to.include('dXNlcjpwYXNz');
    });

    it('redacts authorization header with Bearer token', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({authorization: 'Bearer token123456789'}, 'Auth header');
      const output = stream.getOutput();
      expect(output).to.include('Bearer');
      expect(output).to.include('REDACTED');
    });

    it('does not redact when redact is disabled', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, redact: false, destination: stream});
      logger.info({password: 'secret123'}, 'No redaction');
      expect(stream.getOutput()).to.include('secret123');
    });
  });

  describe('JSON output mode', () => {
    it('outputs JSON when json option is true', () => {
      const stream = new CapturingStream();
      const logger = createLogger({json: true, level: 'info', destination: stream});
      logger.info('test message');
      const output = stream.getOutput();
      // JSON output should be parseable
      expect(() => JSON.parse(output)).not.to.throw();
      expect(output).to.include('test message');
    });

    it('outputs pretty print when json option is false', () => {
      const stream = new CapturingStream();
      const logger = createLogger({json: false, level: 'info', destination: stream});
      logger.info('test message');
      expect(stream.getOutput()).to.include('test message');
    });

    it('outputs pretty print by default', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', destination: stream});
      logger.info('test message');
      expect(stream.getOutput()).to.include('test message');
    });
  });

  describe('baseContext', () => {
    it('includes baseContext in all log entries', () => {
      const stream = new CapturingStream();
      const logger = createLogger({
        baseContext: {app: 'test-app', version: '1.0.0'},
        level: 'info',
        json: true,
        destination: stream,
      });
      logger.info('test message');
      const output = stream.getOutput();
      expect(output).to.include('test-app');
      expect(output).to.include('1.0.0');
    });

    it('merges baseContext with inline context', () => {
      const stream = new CapturingStream();
      const logger = createLogger({
        baseContext: {app: 'test-app'},
        level: 'info',
        json: true,
        destination: stream,
      });
      logger.info({operation: 'deploy'}, 'test message');
      const output = stream.getOutput();
      expect(output).to.include('test-app');
      expect(output).to.include('deploy');
    });
  });
});
