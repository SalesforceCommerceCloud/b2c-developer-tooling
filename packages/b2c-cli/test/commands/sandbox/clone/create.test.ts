/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import CloneCreate from '../../../../src/commands/sandbox/clone/create.js';
import {runSilent} from '../../../helpers/test-setup.js';

function stubCommandConfigAndLogger(command: any, sandboxApiHost = 'admin.dx.test.com'): void {
  Object.defineProperty(command, 'config', {
    value: {
      bin: 'b2c',
      findConfigFile: () => ({
        read: () => ({'sandbox-api-host': sandboxApiHost}),
      }),
    },
    configurable: true,
  });

  Object.defineProperty(command, 'logger', {
    value: {info() {}, debug() {}, warn() {}, error() {}},
    configurable: true,
  });
}

function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

function stubOdsClientPost(command: any, handler: (path: string, options?: any) => Promise<any>): void {
  Object.defineProperty(command, 'odsClient', {
    value: {
      POST: handler,
      GET: async () => ({data: null, response: new Response()}),
    },
    configurable: true,
  });
}

function stubResolveSandboxId(command: any, handler: (id: string) => Promise<string>): void {
  command.resolveSandboxId = handler;
}

function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}

describe('sandbox clone create', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(CloneCreate.description).to.be.a('string');
      expect(CloneCreate.description).to.include('clone');
    });

    it('should enable JSON flag', () => {
      expect(CloneCreate.enableJsonFlag).to.be.true;
    });

    it('should have sandboxId argument', () => {
      expect(CloneCreate.args).to.have.property('sandboxId');
      expect(CloneCreate.args.sandboxId.required).to.be.true;
    });

    it('should have target-profile flag (optional)', () => {
      expect(CloneCreate.flags).to.have.property('target-profile');
      expect(CloneCreate.flags['target-profile'].required).to.be.false;
      expect(CloneCreate.flags['target-profile'].options).to.deep.equal(['medium', 'large', 'xlarge', 'xxlarge']);
    });

    it('should have optional ttl flag with default', () => {
      expect(CloneCreate.flags).to.have.property('ttl');
      expect(CloneCreate.flags.ttl.default).to.equal(24);
    });
  });

  describe('TTL validation', () => {
    it('should reject TTL between 1-23', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 12};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/TTL must be 0 or negative.*or 24 hours or greater/);
      }
    });

    it('should accept TTL of 0 (infinite)', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 0};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;

      stubOdsClientPost(command, async (path: string, options?: any) => {
        capturedBody = options?.body;
        return {
          data: {data: {cloneId: 'test-clone-id'}},
          response: new Response(),
        };
      });

      await command.run();

      expect(capturedBody.ttl).to.equal(0);
    });

    it('should accept TTL of 24 or greater', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 48};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;

      stubOdsClientPost(command, async (path: string, options?: any) => {
        capturedBody = options?.body;
        return {
          data: {data: {cloneId: 'test-clone-id'}},
          response: new Response(),
        };
      });

      await command.run();

      expect(capturedBody.ttl).to.equal(48);
    });
  });

  describe('target profile defaulting', () => {
    it('should not include targetProfile when not specified', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24}; // No target-profile provided
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;

      stubOdsClientPost(command, async (path: string, options?: any) => {
        capturedBody = options?.body;
        return {
          data: {data: {cloneId: 'test-clone-id'}},
          response: new Response(),
        };
      });

      await command.run();

      // API will use source profile by default, so we should not include targetProfile
      expect(capturedBody.targetProfile).to.be.undefined;
      expect(capturedBody.ttl).to.equal(24);
    });

    it('should use explicit target-profile when provided', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 24};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;

      stubOdsClientPost(command, async (path: string, options?: any) => {
        capturedBody = options?.body;
        return {
          data: {data: {cloneId: 'test-clone-id'}},
          response: new Response(),
        };
      });

      await command.run();

      expect(capturedBody.targetProfile).to.equal('medium');
    });
  });

  describe('output formatting', () => {
    it('should return clone ID in JSON mode', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'large', ttl: 24};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const mockCloneId = 'aaaa-001-1642780893121';

      stubOdsClientPost(command, async (path: string, options?: any) => {
        expect(path).to.equal('/sandboxes/{sandboxId}/clones');
        expect(options?.params?.path?.sandboxId).to.equal('test-sandbox-id');
        expect(options?.body?.targetProfile).to.equal('large');
        return {
          data: {data: {cloneId: mockCloneId}},
          response: new Response(),
        };
      });

      const result = await command.run();

      expect(result).to.have.property('cloneId');
      expect(result.cloneId).to.equal(mockCloneId);
    });

    it('should display formatted output in non-JSON mode', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 24, wait: false, 'poll-interval': 10, timeout: 1800};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      const mockCloneId = 'aaaa-001-1642780893121';

      stubOdsClientPost(command, async () => {
        return {
          data: {data: {cloneId: mockCloneId}},
          response: new Response(),
        };
      });

      await runSilent(() => command.run());

      const combinedLogs = logs.join('\n');
      expect(combinedLogs).to.include('Clone ID');
      expect(combinedLogs).to.include(mockCloneId);
      expect(combinedLogs).to.include('started successfully');
      // Verify the config.bin template is resolved, not raw EJS
      expect(combinedLogs).to.not.include('<%= config.bin %>');
      expect(combinedLogs).to.include('b2c sandbox clone get');
    });

    it('should pass emails to API when provided', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {
        'target-profile': 'medium',
        ttl: 24,
        emails: ['dev@example.com', 'qa@example.com'],
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;

      stubOdsClientPost(command, async (path: string, options?: any) => {
        capturedBody = options?.body;
        return {
          data: {data: {cloneId: 'test-clone-id'}},
          response: new Response(),
        };
      });

      await command.run();

      expect(capturedBody.emails).to.deep.equal(['dev@example.com', 'qa@example.com']);
    });

    it('should handle comma-separated emails in single flag', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {
        'target-profile': 'medium',
        ttl: 24,
        emails: ['dev@example.com,qa@example.com'],
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;

      stubOdsClientPost(command, async (path: string, options?: any) => {
        capturedBody = options?.body;
        return {
          data: {data: {cloneId: 'test-clone-id'}},
          response: new Response(),
        };
      });

      await command.run();

      expect(capturedBody.emails).to.deep.equal(['dev@example.com', 'qa@example.com']);
    });
  });

  describe('wait functionality', () => {
    it('should have wait flag', () => {
      expect(CloneCreate.flags).to.have.property('wait');
      expect(CloneCreate.flags.wait.default).to.be.false;
    });

    it('should have poll-interval flag that depends on wait', () => {
      expect(CloneCreate.flags).to.have.property('poll-interval');
      expect(CloneCreate.flags['poll-interval'].default).to.equal(10);
      expect(CloneCreate.flags['poll-interval'].dependsOn).to.deep.equal(['wait']);
    });

    it('should have timeout flag that depends on wait', () => {
      expect(CloneCreate.flags).to.have.property('timeout');
      expect(CloneCreate.flags.timeout.default).to.equal(1800);
      expect(CloneCreate.flags.timeout.dependsOn).to.deep.equal(['wait']);
    });

    it('should poll until clone completes when --wait is used', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24, wait: true, 'poll-interval': 0, timeout: 5};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const mockCloneId = 'aaaa-001-1642780893121';
      let getCalls = 0;

      Object.defineProperty(command, 'odsClient', {
        value: {
          POST: async () => ({
            data: {data: {cloneId: mockCloneId}},
            response: new Response(),
          }),
          async GET() {
            getCalls++;
            const status = getCalls >= 2 ? 'COMPLETED' : 'IN_PROGRESS';
            return {
              data: {data: {status, cloneId: mockCloneId, progressPercentage: getCalls >= 2 ? 100 : 50}},
              response: new Response(),
            };
          },
        },
        configurable: true,
      });

      const result = await command.run();

      expect(result.cloneId).to.equal(mockCloneId);
      expect(getCalls).to.be.greaterThanOrEqual(2);
    });

    it('should error when clone fails during wait', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24, wait: true, 'poll-interval': 0, timeout: 5};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      Object.defineProperty(command, 'odsClient', {
        value: {
          POST: async () => ({
            data: {data: {cloneId: 'test-clone-id'}},
            response: new Response(),
          }),
          GET: async () => ({
            data: {data: {status: 'FAILED', cloneId: 'test-clone-id'}},
            response: new Response(),
          }),
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('failed');
      }
    });

    it('should timeout if clone never completes', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24, wait: true, 'poll-interval': 0, timeout: 1};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      const clock = sinon.useFakeTimers({now: 0});

      Object.defineProperty(command, 'odsClient', {
        value: {
          POST: async () => ({
            data: {data: {cloneId: 'test-clone-id'}},
            response: new Response(),
          }),
          GET: async () => ({
            data: {data: {status: 'IN_PROGRESS', cloneId: 'test-clone-id'}},
            response: new Response(),
          }),
        },
        configurable: true,
      });

      const promise = command.run();
      await clock.tickAsync(2000);

      try {
        await promise;
        expect.fail('Expected timeout');
      } catch (error: any) {
        expect(error.message).to.include('Timeout waiting for clone');
      } finally {
        clock.restore();
      }
    });
  });

  describe('error handling', () => {
    it('should throw error when API call fails', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 24};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      stubOdsClientPost(command, async () => {
        return {data: null, error: {message: 'API Error'}, response: new Response()};
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Failed to create sandbox clone');
      }
    });
  });
});
