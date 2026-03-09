/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';

import SandboxGet from '../../../src/commands/sandbox/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {runSilent} from '../../helpers/test-setup.js';

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

function stubOdsClient(command: any, client: Partial<{GET: any; POST: any; PUT: any; DELETE: any}>): void {
  Object.defineProperty(command, 'odsClient', {
    value: client,
    configurable: true,
  });
}

function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}

/**
 * Unit tests for ODS get command CLI logic.
 * Tests output formatting.
 * SDK tests cover the actual API calls.
 */
describe('sandbox get', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('command structure', () => {
    it('should require sandboxId as argument', () => {
      expect(SandboxGet.args).to.have.property('sandboxId');
      expect(SandboxGet.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(SandboxGet.description).to.be.a('string');
      expect(SandboxGet.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(SandboxGet.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return sandbox data in JSON mode', async () => {
      const command = new SandboxGet([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      // Mock flags
      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockSandbox = {
        id: 'sandbox-123',
        realm: 'zzzv',
        state: 'started' as const,
        hostName: 'zzzv-001.dx.commercecloud.salesforce.com',
      };

      stubOdsClient(command, {
        GET: async () => ({
          data: {data: mockSandbox},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockSandbox);
      expect(result.id).to.equal('sandbox-123');
      expect(result.state).to.equal('started');
    });

    it('should return sandbox data in non-JSON mode', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockSandbox = {
        id: 'sandbox-123',
        realm: 'zzzv',
        state: 'started' as const,
        hostName: 'zzzv-001.test.com',
        createdAt: '2025-01-01T00:00:00Z',
      };

      stubOdsClient(command, {
        GET: async () => ({
          data: {data: mockSandbox},
          response: new Response(),
        }),
      });

      const result = await runSilent(() => command.run());

      // Command returns the sandbox data regardless of JSON mode
      expect(result.id).to.equal('sandbox-123');
      expect(result.state).to.equal('started');
    });

    it('should handle missing sandbox data', async () => {
      const command = new SandboxGet([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'nonexistent'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: {data: undefined},
          response: new Response(null, {status: 404}),
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch sandbox/);
      }
    });

    it('should handle null sandbox data', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sb-null'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: null as any,
          response: new Response(null, {status: 500}),
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch sandbox/);
      }
    });

    it('should handle API errors with error message', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sb-error'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: undefined,
          error: {error: {message: 'Sandbox not found'}},
          response: new Response(null, {status: 404, statusText: 'Not Found'}),
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Failed to fetch sandbox');
        // Error message uses API error message or status text
        expect(error.message).to.match(/Sandbox not found|Not Found/);
      }
    });

    it('should return cloned sandbox data with clone fields', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'cloned-sandbox'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      Object.defineProperty(command, 'resolveSandboxId', {
        value: async (id: string) => id,
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockClonedSandbox = {
        id: '7f70ce44-9562-4394-921f-1e442cd85140',
        realm: 'zzzv',
        instance: '002',
        state: 'started' as const,
        hostName: 'zzzv-002.test01.dx.unified.demandware.net',
        createdAt: '2026-03-02T12:50:23Z',
        clonedFrom: 'zzzv-001',
        sourceInstanceIdentifier: '81a4354c-db35-4168-8d6e-5e047fb06cc6',
        links: {
          bm: 'https://zzzv-002.test01.dx.unified.demandware.net/on/demandware.store/Sites-Site',
        },
      };

      stubOdsClient(command, {
        GET: async () => ({
          data: {data: mockClonedSandbox},
          response: new Response(),
        }),
      });

      const result = await runSilent(() => command.run());

      // Verify the sandbox data includes clone fields
      expect(result.id).to.equal('7f70ce44-9562-4394-921f-1e442cd85140');
      expect(result.clonedFrom).to.equal('zzzv-001');
      expect(result.sourceInstanceIdentifier).to.equal('81a4354c-db35-4168-8d6e-5e047fb06cc6');
    });

    it('should return regular sandbox data without clone fields', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'regular-sandbox'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      Object.defineProperty(command, 'resolveSandboxId', {
        value: async (id: string) => id,
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockRegularSandbox = {
        id: 'sandbox-456',
        realm: 'zzzv',
        instance: '001',
        state: 'started' as const,
        hostName: 'zzzv-001.test01.dx.unified.demandware.net',
        createdAt: '2026-03-01T10:00:00Z',
        links: {
          bm: 'https://zzzv-001.test01.dx.unified.demandware.net/on/demandware.store/Sites-Site',
        },
      };

      stubOdsClient(command, {
        GET: async () => ({
          data: {data: mockRegularSandbox},
          response: new Response(),
        }),
      });

      const result = await runSilent(() => command.run());

      // Verify regular sandbox doesn't have clone fields
      expect(result.id).to.equal('sandbox-456');
      expect(result.clonedFrom).to.be.undefined;
      expect(result.sourceInstanceIdentifier).to.be.undefined;
    });

    it('should include cloneDetails when clone-details flag is set', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'cloned-sandbox-with-details'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': true},
        configurable: true,
      });

      Object.defineProperty(command, 'resolveSandboxId', {
        value: async (id: string) => id,
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockSandboxWithCloneDetails = {
        id: 'cloned-sandbox-789',
        realm: 'zzzv',
        instance: '003',
        state: 'started' as const,
        clonedFrom: 'zzzv-001',
        sourceInstanceIdentifier: '81a4354c-db35-4168-8d6e-5e047fb06cc6',
        cloneDetails: {
          cloneId: 'zzzv-003-1234567890123',
          status: 'COMPLETED' as const,
          targetProfile: 'large' as const,
          createdAt: '2026-03-01T10:00:00Z',
          createdBy: 'test@example.com',
          progressPercentage: 100,
          elapsedTimeInSec: 3600,
        },
      };

      // Capture the params passed to GET
      let capturedParams: any;
      stubOdsClient(command, {
        async GET(path: string, options?: any) {
          capturedParams = options?.params;
          return {
            data: {data: mockSandboxWithCloneDetails},
            response: new Response(),
          };
        },
      });

      const result = await runSilent(() => command.run());

      // Verify the expand parameter was passed in the query
      expect(capturedParams).to.have.property('query');
      expect(capturedParams.query).to.have.property('expand');
      expect(capturedParams.query.expand).to.deep.equal(['clonedetails']);

      // Verify cloneDetails is present in the result
      expect(result.cloneDetails).to.exist;
      expect(result.cloneDetails?.status).to.equal('COMPLETED');
      expect(result.cloneDetails?.progressPercentage).to.equal(100);
    });

    it('should not include expand parameter when flag is false', async () => {
      const command = new SandboxGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {'clone-details': false},
        configurable: true,
      });

      Object.defineProperty(command, 'resolveSandboxId', {
        value: async (id: string) => id,
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      // Capture the params passed to GET
      let capturedParams: any;
      stubOdsClient(command, {
        async GET(path: string, options?: any) {
          capturedParams = options?.params;
          return {
            data: {
              data: {
                id: 'sandbox-123',
                realm: 'zzzv',
                state: 'started' as const,
              },
            },
            response: new Response(),
          };
        },
      });

      await runSilent(() => command.run());

      // Verify the query parameter was not passed
      expect(capturedParams).to.not.have.property('query');
    });
  });
});
