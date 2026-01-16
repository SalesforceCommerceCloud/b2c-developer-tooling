/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';

import OdsGet from '../../../src/commands/ods/get.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';

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
describe('ods get', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('command structure', () => {
    it('should require sandboxId as argument', () => {
      expect(OdsGet.args).to.have.property('sandboxId');
      expect(OdsGet.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(OdsGet.description).to.be.a('string');
      expect(OdsGet.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(OdsGet.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return sandbox data in JSON mode', async () => {
      const command = new OdsGet([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
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
      const command = new OdsGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
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

      const result = await command.run();

      // Command returns the sandbox data regardless of JSON mode
      expect(result.id).to.equal('sandbox-123');
      expect(result.state).to.equal('started');
    });

    it('should handle missing sandbox data', async () => {
      const command = new OdsGet([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'nonexistent'},
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
      const command = new OdsGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sb-null'},
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
      const command = new OdsGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sb-error'},
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
  });
});
