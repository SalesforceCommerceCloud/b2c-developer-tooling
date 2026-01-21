/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {B2COperationContext, B2COperationResult, B2COperationType} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
class TestInstanceCommand extends InstanceCommand<typeof TestInstanceCommand> {
  static id = 'test:instance';
  static description = 'Test instance command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testRequireServer() {
    return this.requireServer();
  }

  public testRequireCodeVersion() {
    return this.requireCodeVersion();
  }

  public testRequireWebDavCredentials() {
    return this.requireWebDavCredentials();
  }

  public testInstance() {
    return this.instance;
  }

  public testCreateContext(operationType: B2COperationType, metadata: Record<string, string | number | boolean>) {
    return this.createContext(operationType, metadata);
  }

  public testRunBeforeHooks(context: B2COperationContext) {
    return this.runBeforeHooks(context);
  }

  public testRunAfterHooks(context: B2COperationContext, result: B2COperationResult) {
    return this.runAfterHooks(context, result);
  }
}

describe('cli/instance-command', () => {
  let config: Config;
  let command: TestInstanceCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestInstanceCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('requireServer', () => {
    it('throws error when no server', async () => {
      stubParse(command);

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireServer();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when server is set', async () => {
      stubParse(command, {server: 'test.demandware.net'});

      await command.init();
      // Should not throw
      command.testRequireServer();
    });
  });

  describe('requireCodeVersion', () => {
    it('throws error when no code version', async () => {
      stubParse(command);

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireCodeVersion();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when code version is set', async () => {
      stubParse(command, {'code-version': 'v1'});

      await command.init();
      // Should not throw
      command.testRequireCodeVersion();
    });
  });

  describe('requireWebDavCredentials', () => {
    it('throws error when no credentials', async () => {
      stubParse(command);

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireWebDavCredentials();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when credentials are set', async () => {
      stubParse(command, {username: 'user', password: 'pass'});

      await command.init();
      // Should not throw
      command.testRequireWebDavCredentials();
    });
  });

  describe('instance', () => {
    it('throws error when no server', async () => {
      stubParse(command);

      await command.init();
      try {
        command.testInstance();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });

    it('creates instance when server is set', async () => {
      stubParse(command, {server: 'test.demandware.net', 'client-id': 'test-client'});

      await command.init();
      const instance = command.testInstance();
      expect(instance).to.be.an('object');
    });

    it('creates instance lazily', async () => {
      stubParse(command, {server: 'test.demandware.net', 'client-id': 'test-client'});

      await command.init();
      const instance1 = command.testInstance();
      const instance2 = command.testInstance();
      // Should return same instance
      expect(instance1).to.equal(instance2);
    });
  });

  describe('createContext', () => {
    it('creates operation context', async () => {
      stubParse(command, {server: 'test.demandware.net', 'client-id': 'test-client'});

      await command.init();
      const context = command.testCreateContext('job:run', {jobId: 'test-job'});
      expect(context.operationType).to.equal('job:run');
      expect(context.metadata.jobId).to.equal('test-job');
      expect(context.instance).to.be.an('object');
    });
  });

  describe('runBeforeHooks', () => {
    it('returns empty result when no lifecycle runner', async () => {
      stubParse(command, {server: 'test.demandware.net', 'client-id': 'test-client'});

      await command.init();
      const context = command.testCreateContext('job:run', {});
      const result = await command.testRunBeforeHooks(context);
      expect(result).to.deep.equal({});
    });
  });

  describe('runAfterHooks', () => {
    it('does nothing when no lifecycle runner', async () => {
      stubParse(command, {server: 'test.demandware.net', 'client-id': 'test-client'});

      await command.init();
      const context = command.testCreateContext('job:run', {});
      const result = {success: true, duration: 100};
      // Should not throw
      await command.testRunAfterHooks(context, result);
    });
  });
});
