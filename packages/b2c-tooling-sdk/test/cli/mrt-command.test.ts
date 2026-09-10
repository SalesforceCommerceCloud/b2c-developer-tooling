/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {MrtMaintenanceError} from '@salesforce/b2c-tooling-sdk/clients';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
class TestMrtCommand extends MrtCommand<typeof TestMrtCommand> {
  static id = 'test:mrt';
  static description = 'Test MRT command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods/getters for testing
  public testRequireMrtCredentials() {
    return this.requireMrtCredentials();
  }

  public async testCatch(err: Error & {exitCode?: number}): Promise<never> {
    return this.catch(err);
  }

  public testWarnReadOnlyOnce(): void {
    this.warnReadOnlyOnce();
  }
}

describe('cli/mrt-command', () => {
  let config: Config;
  let command: TestMrtCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestMrtCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('requireMrtCredentials', () => {
    it('throws error when no credentials', async () => {
      stubParse(command, {'credentials-file': '/dev/null'}); // Use non-existent credentials file

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireMrtCredentials();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when API key is set', async () => {
      stubParse(command, {'api-key': 'test-api-key'});

      await command.init();
      // Should not throw
      command.testRequireMrtCredentials();
    });
  });

  describe('catch() - read-only mode guidance', () => {
    beforeEach(async () => {
      stubParse(command, {'api-key': 'test-api-key'});
      await command.init();
    });

    it('replaces a rejected write (MrtMaintenanceError) with clear guidance', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new MrtMaintenanceError(503, 'Service is in READ_ONLY mode');

      try {
        await command.testCatch(err);
      } catch {
        // Expected — super.catch() re-throws via this.error()
      }

      expect(errorStub.calledOnce).to.be.true;
      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.include('maintenance mode');
      expect(message).to.include('This command was not run');
      // Surfaces the Trust status page so users can check status and ETA
      expect(message).to.include('https://status.salesforce.com/instances/MANAGEDRUNTIMEADMIN');
      // Names the specific command (test command id is "test:mrt")
      expect(message).to.include('test mrt');
      // Raw JSON blob must not be the primary, user-facing message
      expect(message).to.not.include('{"detail"');
    });

    it('preserves the raw API detail as err.cause', async () => {
      sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new MrtMaintenanceError(503, 'Service is in READ_ONLY mode');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      expect(err.cause).to.equal('Service is in READ_ONLY mode');
    });

    it('reshapes the message even when no detail is present', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new MrtMaintenanceError(503);

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.include('maintenance mode');
      // No detail to preserve, so cause stays unset
      expect(err.cause).to.be.undefined;
    });

    it('passes through non-maintenance errors unchanged', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('Failed to create deployment: Connection timeout');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.equal('Failed to create deployment: Connection timeout');
      expect(err.cause).to.be.undefined;
    });

    it('does not misclassify a 403 authorization error as read-only', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('403 Forbidden');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.equal('403 Forbidden');
    });

    it('does not treat a read-only-looking message string as a maintenance error', async () => {
      // Only the typed MrtMaintenanceError triggers the reshape; a plain Error
      // whose text mentions read-only passes through untouched.
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('Failed to push bundle: {"detail":"Service is in READ_ONLY mode"}');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.equal('Failed to push bundle: {"detail":"Service is in READ_ONLY mode"}');
      expect(err.cause).to.be.undefined;
    });
  });

  describe('warnReadOnlyOnce() - read-only mode warning (reads)', () => {
    beforeEach(async () => {
      stubParse(command, {'api-key': 'test-api-key'});
      await command.init();
    });

    it('warns once with actionable guidance and the status link', () => {
      const warnStub = sinon.stub(command, 'warn');

      command.testWarnReadOnlyOnce();

      expect(warnStub.calledOnce).to.be.true;
      const message = warnStub.firstCall.args[0] as string;
      expect(message).to.include('maintenance mode');
      expect(message).to.include('Reads still work');
      expect(message).to.include('https://status.salesforce.com/instances/MANAGEDRUNTIMEADMIN');
    });

    it('warns at most once per command run even across multiple reads', () => {
      const warnStub = sinon.stub(command, 'warn');

      command.testWarnReadOnlyOnce();
      command.testWarnReadOnlyOnce();
      command.testWarnReadOnlyOnce();

      expect(warnStub.calledOnce).to.be.true;
    });
  });
});
