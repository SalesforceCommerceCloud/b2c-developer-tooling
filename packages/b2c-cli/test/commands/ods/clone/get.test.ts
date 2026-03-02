/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import CloneGet from '../../../../src/commands/ods/clone/get.js';
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

describe('ods clone get', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(CloneGet.description).to.be.a('string');
      expect(CloneGet.description).to.include('clone');
    });

    it('should enable JSON flag', () => {
      expect(CloneGet.enableJsonFlag).to.be.true;
    });

    it('should have sandboxId argument', () => {
      expect(CloneGet.args).to.have.property('sandboxId');
      expect(CloneGet.args.sandboxId.required).to.be.true;
    });

    it('should have cloneId argument', () => {
      expect(CloneGet.args).to.have.property('cloneId');
      expect(CloneGet.args.cloneId.required).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return clone details in JSON mode', async () => {
      const command = new CloneGet(['test-sandbox-id', 'aaaa-001-1642780893121'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id', cloneId: 'aaaa-001-1642780893121'};
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const mockClone = {
        cloneId: 'aaaa-001-1642780893121',
        status: 'COMPLETED',
        realm: 'aaaa',
        sourceInstance: 'aaaa-000',
        targetInstance: 'aaaa-001',
        targetProfile: 'large',
        progressPercentage: 100,
        elapsedTimeInSec: 3600,
        createdAt: '2025-02-27T10:00:00Z',
        createdBy: 'test@example.com',
        lastUpdated: '2025-02-27T11:00:00Z',
        customCodeVersion: '1.0.0',
        storefrontCount: 5,
        filesystemUsageSize: 1073741824, // 1 GB
        databaseTransferSize: 2147483648, // 2 GB
      };

      stubOdsClientGet(command, async (path: string, options?: any) => {
        expect(path).to.equal('/sandboxes/{sandboxId}/clones/{cloneId}');
        expect(options?.params?.path?.sandboxId).to.equal('test-sandbox-id');
        expect(options?.params?.path?.cloneId).to.equal('aaaa-001-1642780893121');
        return {
          data: {data: mockClone},
          response: new Response(),
        };
      });

      const result = await command.run();

      expect(result).to.have.property('data');
      expect(result.data).to.deep.equal(mockClone);
    });

    it('should display formatted details in non-JSON mode', async () => {
      const command = new CloneGet(['test-sandbox-id', 'aaaa-001-1642780893121'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id', cloneId: 'aaaa-001-1642780893121'};
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const outputs: string[] = [];
      const stdoutStub = sinon.stub(ux, 'stdout').callsFake((str?: string | string[], ...args: string[]) => {
        if (str) {
          const output = Array.isArray(str) ? str.join('') : str;
          outputs.push(output);
        }
      });

      const mockClone = {
        cloneId: 'aaaa-001-1642780893121',
        status: 'IN_PROGRESS',
        realm: 'aaaa',
        sourceInstance: 'aaaa-000',
        targetInstance: 'aaaa-001',
        targetProfile: 'large',
        progressPercentage: 75,
        elapsedTimeInSec: 1800,
        createdAt: '2025-02-27T10:00:00Z',
        createdBy: 'test@example.com',
        lastUpdated: '2025-02-27T10:30:00Z',
      };

      stubOdsClientGet(command, async () => {
        return {
          data: {data: mockClone},
          response: new Response(),
        };
      });

      await runSilent(() => command.run());

      stdoutStub.restore();

      const combinedOutput = outputs.join('\n');
      expect(combinedOutput).to.include('Clone Details');
      expect(combinedOutput).to.include('Clone ID:');
      expect(combinedOutput).to.include('aaaa-001-1642780893121');
      expect(combinedOutput).to.include('Progress:');
      expect(combinedOutput).to.include('75%');
      expect(combinedOutput).to.include('Source Instance:');
      expect(combinedOutput).to.include('aaaa-000');
      expect(combinedOutput).to.include('Target Instance:');
      expect(combinedOutput).to.include('aaaa-001');
      expect(combinedOutput).to.include('Realm:');
      expect(combinedOutput).to.include('aaaa');
      expect(combinedOutput).to.include('Created By:');
      expect(combinedOutput).to.include('test@example.com');
    });

    it('should not display additional info in non-JSON mode', async () => {
      const command = new CloneGet(['test-sandbox-id', 'aaaa-001-1642780893121'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id', cloneId: 'aaaa-001-1642780893121'};
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const outputs: string[] = [];
      const stdoutStub = sinon.stub(ux, 'stdout').callsFake((str?: string | string[], ...args: string[]) => {
        if (str) {
          const output = Array.isArray(str) ? str.join('') : str;
          outputs.push(output);
        }
      });

      const mockClone = {
        cloneId: 'aaaa-001-1642780893121',
        status: 'COMPLETED',
        realm: 'aaaa',
        sourceInstance: 'aaaa-000',
        targetInstance: 'aaaa-001',
        progressPercentage: 100,
        createdAt: '2025-02-27T10:00:00Z',
        createdBy: 'test@example.com',
        lastKnownState: 'finalizing',
        customCodeVersion: '1.0.0',
        storefrontCount: 5,
        filesystemUsageSize: 1073741824,
        databaseTransferSize: 2147483648,
      };

      stubOdsClientGet(command, async () => {
        return {
          data: {data: mockClone},
          response: new Response(),
        };
      });

      await runSilent(() => command.run());

      stdoutStub.restore();

      const combinedOutput = outputs.join('\n');
      // Should display essential fields
      expect(combinedOutput).to.include('Clone ID:');
      expect(combinedOutput).to.include('aaaa-001-1642780893121');
      expect(combinedOutput).to.include('Source Instance:');
      expect(combinedOutput).to.include('aaaa-000');
      expect(combinedOutput).to.include('Target Instance:');
      expect(combinedOutput).to.include('aaaa-001');
      expect(combinedOutput).to.include('Realm:');
      expect(combinedOutput).to.include('aaaa');
      expect(combinedOutput).to.include('Progress:');
      expect(combinedOutput).to.include('100%');
      expect(combinedOutput).to.include('Created By:');
      expect(combinedOutput).to.include('test@example.com');

      // Should NOT display additional fields in non-JSON mode
      expect(combinedOutput).to.not.include('Last Known State');
      expect(combinedOutput).to.not.include('Custom Code Version');
      expect(combinedOutput).to.not.include('Storefront Count');
      expect(combinedOutput).to.not.include('Filesystem Usage');
      expect(combinedOutput).to.not.include('Database Transfer Size');
    });

    it('should handle missing optional fields gracefully', async () => {
      const command = new CloneGet(['test-sandbox-id', 'aaaa-001-1642780893121'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id', cloneId: 'aaaa-001-1642780893121'};
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubResolveSandboxId(command, async (id) => id);

      const outputs: string[] = [];
      const stdoutStub = sinon.stub(ux, 'stdout').callsFake((str?: string | string[], ...args: string[]) => {
        if (str) {
          const output = Array.isArray(str) ? str.join('') : str;
          outputs.push(output);
        }
      });

      const mockClone = {
        cloneId: 'aaaa-001-1642780893121',
        status: 'PENDING',
      };

      stubOdsClientGet(command, async () => {
        return {
          data: {data: mockClone},
          response: new Response(),
        };
      });

      await runSilent(() => command.run());

      stdoutStub.restore();

      const combinedOutput = outputs.join('\n');
      expect(combinedOutput).to.include('Clone ID:');
      expect(combinedOutput).to.include('aaaa-001-1642780893121');
      // Fields with undefined values should not be displayed
      // Only the Clone ID field should be present since other fields are undefined
    });
  });

  describe('error handling', () => {
    it('should throw error when API call fails', async () => {
      const command = new CloneGet(['test-sandbox-id', 'aaaa-001-1642780893121'], {} as any);
      (command as any).args = {sandboxId: 'test-sandbox-id', cloneId: 'aaaa-001-1642780893121'};
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
        expect((error as Error).message).to.include('Failed to get clone details');
      }
    });
  });
});
