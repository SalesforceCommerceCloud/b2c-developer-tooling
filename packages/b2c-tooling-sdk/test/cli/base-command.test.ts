/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {globalMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

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

  public testFinally(err: Error | undefined) {
    return this.finally(err);
  }

  public getTelemetry() {
    return this.telemetry;
  }
}

describe('cli/base-command', () => {
  let config: Config;
  let command: TestBaseCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestBaseCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
    // Clean up the global middleware registry between tests
    globalMiddlewareRegistry.clear();
  });

  describe('getExtraParams', () => {
    it('returns undefined when no extra params', async () => {
      stubParse(command);

      await command.init();
      const params = command.testGetExtraParams();
      expect(params).to.be.undefined;
    });

    it('parses extra-query flag', async () => {
      stubParse(command, {'extra-query': '{"debug":"true"}'});

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
    });

    it('parses extra-body flag', async () => {
      stubParse(command, {'extra-body': '{"_internal":true}'});

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.body).to.deep.equal({_internal: true});
    });

    it('parses both extra-query and extra-body', async () => {
      stubParse(command, {
        'extra-query': '{"debug":"true"}',
        'extra-body': '{"_internal":true}',
      });

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
      expect(params?.body).to.deep.equal({_internal: true});
    });

    it('throws error for invalid JSON in extra-query', async () => {
      stubParse(command, {'extra-query': 'invalid-json'});

      // Stub error before init() because registerExtraParamsMiddleware calls getExtraParams()
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.init();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('throws error for invalid JSON in extra-body', async () => {
      stubParse(command, {'extra-body': 'invalid-json'});

      // Stub error before init() because registerExtraParamsMiddleware calls getExtraParams()
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.init();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('parses extra-headers flag', async () => {
      stubParse(command, {'extra-headers': '{"X-Custom-Header":"value"}'});

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.headers).to.deep.equal({'X-Custom-Header': 'value'});
    });

    it('parses extra-query, extra-body, and extra-headers together', async () => {
      stubParse(command, {
        'extra-query': '{"debug":"true"}',
        'extra-body': '{"_internal":true}',
        'extra-headers': '{"X-Custom":"value"}',
      });

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
      expect(params?.body).to.deep.equal({_internal: true});
      expect(params?.headers).to.deep.equal({'X-Custom': 'value'});
    });

    it('throws error for invalid JSON in extra-headers', async () => {
      stubParse(command, {'extra-headers': 'invalid-json'});

      // Stub error before init() because registerExtraParamsMiddleware calls getExtraParams()
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.init();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });
  });

  describe('catch', () => {
    it('handles errors with exit code', async () => {
      stubParse(command, {json: false});

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      const error = new Error('Test error') as Error & {exitCode?: number};
      error.exitCode = 2;

      try {
        await command.testCatch(error);
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('outputs JSON error in JSON mode', async () => {
      stubParse(command, {json: true});

      await command.init();

      // Mock jsonEnabled to return true
      sinon.stub(command, 'jsonEnabled').returns(true);

      let writtenData = '';
      sinon.stub(process.stderr, 'write').callsFake((chunk: string | Uint8Array) => {
        writtenData += chunk.toString();
        return true;
      });

      const exitStub = sinon.stub(process, 'exit').throws(new Error('Exit called'));

      const error = new Error('Test error');

      try {
        await command.testCatch(error);
      } catch {
        // Expected
      }

      // In JSON mode, error should be written to stderr as JSON
      expect(writtenData).to.include('error');
      expect(writtenData).to.include('Test error');
      expect(exitStub.calledWith(1)).to.be.true;

      // Cleanup handled by sinon.restore() in afterEach
    });
  });

  describe('telemetry', () => {
    let telemetryStartStub: sinon.SinonStub;
    let telemetryStopStub: sinon.SinonStub;
    let telemetrySendEventStub: sinon.SinonStub;
    let telemetrySendExceptionStub: sinon.SinonStub;

    beforeEach(() => {
      // Stub Telemetry prototype methods
      telemetryStartStub = sinon.stub(Telemetry.prototype, 'start').resolves();
      telemetryStopStub = sinon.stub(Telemetry.prototype, 'stop');
      telemetrySendEventStub = sinon.stub(Telemetry.prototype, 'sendEvent');
      telemetrySendExceptionStub = sinon.stub(Telemetry.prototype, 'sendException');
    });

    describe('Telemetry.isDisabled()', () => {
      let originalSfDisable: string | undefined;
      let originalSfccDisable: string | undefined;

      beforeEach(() => {
        originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
        delete process.env.SF_DISABLE_TELEMETRY;
        delete process.env.SFCC_DISABLE_TELEMETRY;
      });

      afterEach(() => {
        if (originalSfDisable !== undefined) {
          process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
        } else {
          delete process.env.SF_DISABLE_TELEMETRY;
        }
        if (originalSfccDisable !== undefined) {
          process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
        } else {
          delete process.env.SFCC_DISABLE_TELEMETRY;
        }
      });

      it('returns false when no disable env vars are set', () => {
        expect(Telemetry.isDisabled()).to.be.false;
      });

      it('returns true when SF_DISABLE_TELEMETRY=true', () => {
        process.env.SF_DISABLE_TELEMETRY = 'true';
        expect(Telemetry.isDisabled()).to.be.true;
      });

      it('returns true when SFCC_DISABLE_TELEMETRY=true', () => {
        process.env.SFCC_DISABLE_TELEMETRY = 'true';
        expect(Telemetry.isDisabled()).to.be.true;
      });

      it('returns false when SF_DISABLE_TELEMETRY=false', () => {
        process.env.SF_DISABLE_TELEMETRY = 'false';
        expect(Telemetry.isDisabled()).to.be.false;
      });
    });

    describe('Telemetry.getConnectionString()', () => {
      let originalSfDisable: string | undefined;
      let originalAppInsightsKey: string | undefined;

      beforeEach(() => {
        originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        originalAppInsightsKey = process.env.SFCC_APP_INSIGHTS_KEY;
        delete process.env.SF_DISABLE_TELEMETRY;
        delete process.env.SFCC_APP_INSIGHTS_KEY;
      });

      afterEach(() => {
        if (originalSfDisable !== undefined) {
          process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
        } else {
          delete process.env.SF_DISABLE_TELEMETRY;
        }
        if (originalAppInsightsKey !== undefined) {
          process.env.SFCC_APP_INSIGHTS_KEY = originalAppInsightsKey;
        } else {
          delete process.env.SFCC_APP_INSIGHTS_KEY;
        }
      });

      it('returns undefined when telemetry is disabled', () => {
        process.env.SF_DISABLE_TELEMETRY = 'true';
        expect(Telemetry.getConnectionString('default-key')).to.be.undefined;
      });

      it('returns project default when no env override', () => {
        expect(Telemetry.getConnectionString('default-key')).to.equal('default-key');
      });

      it('returns env override when SFCC_APP_INSIGHTS_KEY is set', () => {
        process.env.SFCC_APP_INSIGHTS_KEY = 'env-override';
        expect(Telemetry.getConnectionString('default-key')).to.equal('env-override');
      });

      it('returns undefined when no project default and no env override', () => {
        expect(Telemetry.getConnectionString()).to.be.undefined;
      });
    });

    describe('auto-initialization from pjson', () => {
      let originalSfDisable: string | undefined;
      let originalSfccDisable: string | undefined;

      beforeEach(() => {
        originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
        delete process.env.SF_DISABLE_TELEMETRY;
        delete process.env.SFCC_DISABLE_TELEMETRY;
      });

      afterEach(() => {
        if (originalSfDisable !== undefined) {
          process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
        } else {
          delete process.env.SF_DISABLE_TELEMETRY;
        }
        if (originalSfccDisable !== undefined) {
          process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
        } else {
          delete process.env.SFCC_DISABLE_TELEMETRY;
        }
      });

      it('initializes telemetry when pjson has connectionString', async () => {
        // Mock the pjson to include telemetry config
        sinon.stub(config, 'pjson').value({
          ...config.pjson,
          oclif: {
            ...(config.pjson.oclif || {}),
            telemetry: {connectionString: 'test-key'},
          },
        });

        const cmd = new TestBaseCommand([], config);
        stubParse(cmd);

        await cmd.init();

        expect(telemetryStartStub.called).to.be.true;
        expect(telemetrySendEventStub.calledWith('COMMAND_START')).to.be.true;
        expect(cmd.getTelemetry()).to.not.be.undefined;
      });

      it('does not initialize telemetry when pjson has no connectionString', async () => {
        // Use default config without telemetry
        stubParse(command);

        await command.init();

        // With no connectionString in pjson, telemetry should not be initialized
        // (unless there's an env override, which we've cleared)
        expect(command.getTelemetry()).to.be.undefined;
      });

      it('does not initialize telemetry when SF_DISABLE_TELEMETRY=true', async () => {
        process.env.SF_DISABLE_TELEMETRY = 'true';

        // Mock the pjson to include telemetry config
        sinon.stub(config, 'pjson').value({
          ...config.pjson,
          oclif: {
            ...(config.pjson.oclif || {}),
            telemetry: {connectionString: 'test-key'},
          },
        });

        const cmd = new TestBaseCommand([], config);
        stubParse(cmd);

        await cmd.init();

        expect(cmd.getTelemetry()).to.be.undefined;
      });
    });

    describe('catch() exception tracking', () => {
      it('sends exception to telemetry when telemetry is initialized', async () => {
        // Create a telemetry instance and attach it to the command
        const telemetry = new Telemetry({project: 'test', appInsightsKey: 'test-key'});
        (command as unknown as {telemetry: Telemetry}).telemetry = telemetry;

        stubParse(command, {json: false});
        await command.init();

        const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

        const error = new Error('Test error') as Error & {exitCode?: number};
        error.exitCode = 2;

        try {
          await command.testCatch(error);
        } catch {
          // Expected
        }

        expect(telemetrySendExceptionStub.called).to.be.true;
        expect(telemetryStopStub.called).to.be.true;
        expect(errorStub.called).to.be.true;
      });

      it('includes exitCode and command in exception attributes', async () => {
        const telemetry = new Telemetry({project: 'test', appInsightsKey: 'test-key'});
        (command as unknown as {telemetry: Telemetry}).telemetry = telemetry;

        stubParse(command, {json: false});
        await command.init();

        sinon.stub(command, 'error').throws(new Error('Expected error'));

        const error = new Error('Test error') as Error & {exitCode?: number};
        error.exitCode = 42;

        try {
          await command.testCatch(error);
        } catch {
          // Expected
        }

        expect(telemetrySendExceptionStub.called).to.be.true;
        const [sentError, attributes] = telemetrySendExceptionStub.firstCall.args;
        expect(sentError).to.equal(error);
        expect(attributes.exitCode).to.equal(42);
        expect(attributes.command).to.equal('test:base');
      });
    });

    describe('finally() success tracking', () => {
      it('sends COMMAND_SUCCESS when no error occurred', async () => {
        const telemetry = new Telemetry({project: 'test', appInsightsKey: 'test-key'});
        (command as unknown as {telemetry: Telemetry}).telemetry = telemetry;

        stubParse(command);
        await command.init();

        await command.testFinally(undefined);

        expect(telemetrySendEventStub.calledWith('COMMAND_SUCCESS')).to.be.true;
        expect(telemetryStopStub.called).to.be.true;
      });

      it('does not send COMMAND_SUCCESS when error occurred', async () => {
        const telemetry = new Telemetry({project: 'test', appInsightsKey: 'test-key'});
        (command as unknown as {telemetry: Telemetry}).telemetry = telemetry;

        stubParse(command);
        await command.init();

        // Reset the stubs to clear any calls from init
        telemetrySendEventStub.resetHistory();

        await command.testFinally(new Error('Some error'));

        expect(telemetrySendEventStub.calledWith('COMMAND_SUCCESS')).to.be.false;
      });

      it('includes duration in COMMAND_SUCCESS attributes', async () => {
        const telemetry = new Telemetry({project: 'test', appInsightsKey: 'test-key'});
        (command as unknown as {telemetry: Telemetry}).telemetry = telemetry;
        // Simulate that command started 100ms ago
        (command as unknown as {commandStartTime: number}).commandStartTime = Date.now() - 100;

        stubParse(command);
        await command.init();

        // Reset after init to check only finally's sendEvent call
        telemetrySendEventStub.resetHistory();

        await command.testFinally(undefined);

        expect(telemetrySendEventStub.calledWith('COMMAND_SUCCESS')).to.be.true;
        const [, attributes] = telemetrySendEventStub.firstCall.args;
        expect(attributes.duration).to.be.a('number');
        expect(attributes.duration).to.be.at.least(100);
      });
    });
  });
});
