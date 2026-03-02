/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import CloneList from '../../../../src/commands/sandbox/clone/list.js';
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

function stubOdsClientGet(command: any, handler: (path: string, options?: any) => Promise<any>): void {
  Object.defineProperty(command, 'odsClient', {
    value: {
      GET: handler,
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

describe('sandbox clone list', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(CloneList.description).to.be.a('string');
      expect(CloneList.description).to.include('clone');
    });

    it('should enable JSON flag', () => {
      expect(CloneList.enableJsonFlag).to.be.true;
    });

    it('should have sandboxId argument', () => {
      expect(CloneList.args).to.have.property('sandboxId');
      expect(CloneList.args.sandboxId.required).to.be.true;
    });

    it('should have status flag', () => {
      expect(CloneList.flags).to.have.property('status');
      expect(CloneList.flags.status.options).to.deep.equal(['Pending', 'InProgress', 'Failed', 'Completed']);
    });
  });

  describe('output formatting', () => {
    it('should return clone list in JSON mode', async () => {
      const command = new CloneList(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const mockClones = [
        {
          cloneId: 'aaaa-001-1642780893121',
          status: 'COMPLETED',
          targetInstance: 'aaaa-001',
          progressPercentage: 100,
          createdAt: '2025-02-27T10:00:00Z',
        },
        {
          cloneId: 'aaaa-002-1642780893122',
          status: 'IN_PROGRESS',
          targetInstance: 'aaaa-002',
          progressPercentage: 45,
          createdAt: '2025-02-27T11:00:00Z',
        },
      ];

      const mockResponse = {
        data: mockClones,
      };

      stubOdsClientGet(command, async (path: string, options?: any) => {
        expect(path).to.equal('/sandboxes/{sandboxId}/clones');
        expect(options?.params?.path?.sandboxId).to.equal('test-sandbox-id');
        return {data: {data: mockResponse.data}, response: new Response()};
      });

      const result = await command.run();

      expect(result).to.have.property('data');
      expect(result.data).to.have.lengthOf(2);
      expect(result.data![0].cloneId).to.equal('aaaa-001-1642780893121');
      expect(result.data![1].status).to.equal('IN_PROGRESS');
    });

    it('should display formatted list in non-JSON mode', async () => {
      const command = new CloneList(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      // Stub ux.stdout to capture table output
      const stdoutStub = sinon.stub(ux, 'stdout').callsFake((str?: string | string[], ..._args: string[]) => {
        if (str) {
          const output = Array.isArray(str) ? str.join('') : str;
          logs.push(output);
        }
      });

      const mockClones = [
        {
          cloneId: 'aaaa-001-1642780893121',
          status: 'COMPLETED',
          targetInstance: 'aaaa-001',
          progressPercentage: 100,
          createdAt: '2025-02-27T10:00:00Z',
        },
      ];

      stubOdsClientGet(command, async () => {
        return {data: {data: mockClones}, response: new Response()};
      });

      await runSilent(() => command.run());

      stdoutStub.restore();

      const combinedLogs = logs.join('\n');
      expect(combinedLogs).to.include('aaaa-001-1642780893121');
    });

    it('should handle empty clone list', async () => {
      const command = new CloneList(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      stubOdsClientGet(command, async () => {
        return {data: {data: []}, response: new Response()};
      });

      await runSilent(() => command.run());

      const combinedLogs = logs.join('\n');
      expect(combinedLogs).to.include('No clones found');
    });

    it('should pass filter parameters to API', async () => {
      const command = new CloneList(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {
        from: '2024-01-01',
        to: '2024-12-31',
        status: 'COMPLETED',
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      let capturedOptions: any;

      stubOdsClientGet(command, async (path: string, options?: any) => {
        capturedOptions = options;
        return {data: {data: []}, response: new Response()};
      });

      await command.run();

      expect(capturedOptions?.params?.query?.fromDate).to.equal('2024-01-01');
      expect(capturedOptions?.params?.query?.toDate).to.equal('2024-12-31');
      expect(capturedOptions?.params?.query?.status).to.equal('COMPLETED');
    });
  });

  describe('error handling', () => {
    it('should throw error when API call fails', async () => {
      const command = new CloneList(['test-sandbox-id'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id'};
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolveSandboxId(command, async (id) => id);

      stubOdsClientGet(command, async () => {
        return {data: null, error: {message: 'API Error'}, response: new Response()};
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Failed to list sandbox clones');
      }
    });
  });
});
