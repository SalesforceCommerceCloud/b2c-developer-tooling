/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import CloneCreate from '../../../../src/commands/ods/clone/create.js';
import {runSilent} from '../../../helpers/test-setup.js';

function stubCommandConfigAndLogger(command: any, sandboxApiHost = 'admin.dx.test.com'): void {
  Object.defineProperty(command, 'config', {
    value: {
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

function stubOdsClient(
  command: any,
  postHandler: (path: string, options?: any) => Promise<any>,
  getHandler: (path: string, options?: any) => Promise<any>,
): void {
  Object.defineProperty(command, 'odsClient', {
    value: {
      POST: postHandler,
      GET: getHandler,
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

describe('ods clone create', () => {
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
      expect(CloneCreate.flags['target-profile'].options).to.deep.equal([
        'medium',
        'large',
        'xlarge',
        'xxlarge',
      ]);
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
    it('should use source sandbox profile when not specified', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24}; // No target-profile provided
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;
      let getCallCount = 0;

      stubOdsClient(
        command,
        async (path: string, options?: any) => {
          capturedBody = options?.body;
          return {
            data: {data: {cloneId: 'test-clone-id'}},
            response: new Response(),
          };
        },
        async (path: string) => {
          getCallCount++;
          expect(path).to.equal('/sandboxes/{sandboxId}');
          return {
            data: {
              data: {
                id: 'test-sandbox-id',
                resourceProfile: 'large',
              },
            },
            response: new Response(),
          };
        },
      );

      await command.run();

      expect(getCallCount).to.equal(1);
      expect(capturedBody.targetProfile).to.equal('large');
    });

    it('should use explicit target-profile when provided', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {'target-profile': 'medium', ttl: 24};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedBody: any;
      let getCallCount = 0;

      stubOdsClient(
        command,
        async (path: string, options?: any) => {
          capturedBody = options?.body;
          return {
            data: {data: {cloneId: 'test-clone-id'}},
            response: new Response(),
          };
        },
        async () => {
          getCallCount++;
          return {data: null, response: new Response()};
        },
      );

      await command.run();

      // Should NOT call GET when profile is explicitly provided
      expect(getCallCount).to.equal(0);
      expect(capturedBody.targetProfile).to.equal('medium');
    });

    it('should error when source sandbox has no profile', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      stubOdsClient(
        command,
        async () => {
          return {data: null, response: new Response()};
        },
        async () => {
          return {
            data: {data: {}}, // No resourceProfile
            response: new Response(),
          };
        },
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Unable to determine source sandbox profile');
      }
    });

    it('should validate profile is allowed value', async () => {
      const command = new CloneCreate(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {ttl: 24};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      stubOdsClient(
        command,
        async () => {
          return {data: null, response: new Response()};
        },
        async () => {
          return {
            data: {
              data: {
                resourceProfile: 'invalid-profile',
              },
            },
            response: new Response(),
          };
        },
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Invalid target profile');
      }
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
      (command as any).flags = {'target-profile': 'medium', ttl: 24};
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
