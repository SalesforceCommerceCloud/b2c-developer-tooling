/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {B2COperationContext, B2COperationResult, B2COperationType} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';

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

// Type for mocking command properties in tests
type MockableInstanceCommand = TestInstanceCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
  error: (message: string) => never;
};

describe('cli/instance-command', () => {
  let config: Config;
  let command: TestInstanceCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestInstanceCommand([], config);
  });

  afterEach(() => {
    restoreConfig();
  });

  describe('requireServer', () => {
    it('throws error when no server', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
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
        command.testRequireServer();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      cmd.error = originalError;
      cmd.parse = originalParse;
    });

    it('does not throw when server is set', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // Should not throw
      command.testRequireServer();

      cmd.parse = originalParse;
    });
  });

  describe('requireCodeVersion', () => {
    it('throws error when no code version', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
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
        command.testRequireCodeVersion();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      cmd.error = originalError;
      cmd.parse = originalParse;
    });

    it('does not throw when code version is set', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'code-version': 'v1'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // Should not throw
      command.testRequireCodeVersion();

      cmd.parse = originalParse;
    });
  });

  describe('requireWebDavCredentials', () => {
    it('throws error when no credentials', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
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
        command.testRequireWebDavCredentials();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      cmd.error = originalError;
      cmd.parse = originalParse;
    });

    it('does not throw when credentials are set', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {username: 'user', password: 'pass'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // Should not throw
      command.testRequireWebDavCredentials();

      cmd.parse = originalParse;
    });
  });

  describe('instance', () => {
    it('throws error when no server', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        command.testInstance();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }

      cmd.parse = originalParse;
    });

    it('creates instance when server is set', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const instance = command.testInstance();
      expect(instance).to.be.an('object');

      cmd.parse = originalParse;
    });

    it('creates instance lazily', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const instance1 = command.testInstance();
      const instance2 = command.testInstance();
      // Should return same instance
      expect(instance1).to.equal(instance2);

      cmd.parse = originalParse;
    });
  });

  describe('createContext', () => {
    it('creates operation context', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const context = command.testCreateContext('job:run', {jobId: 'test-job'});
      expect(context.operationType).to.equal('job:run');
      expect(context.metadata.jobId).to.equal('test-job');
      expect(context.instance).to.be.an('object');

      cmd.parse = originalParse;
    });
  });

  describe('runBeforeHooks', () => {
    it('returns empty result when no lifecycle runner', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const context = command.testCreateContext('job:run', {});
      const result = await command.testRunBeforeHooks(context);
      expect(result).to.deep.equal({});

      cmd.parse = originalParse;
    });
  });

  describe('runAfterHooks', () => {
    it('does nothing when no lifecycle runner', async () => {
      const cmd = command as MockableInstanceCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {server: 'test.demandware.net', 'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const context = command.testCreateContext('job:run', {});
      const result = {success: true, duration: 100};
      // Should not throw
      await command.testRunAfterHooks(context, result);

      cmd.parse = originalParse;
    });
  });
});
