/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';

import OdsStart from '../../../src/commands/ods/start.js';

import OdsStop from '../../../src/commands/ods/stop.js';

import OdsRestart from '../../../src/commands/ods/restart.js';

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
 * Unit tests for ODS operation commands CLI logic.
 * Tests start, stop, restart command structure and output.
 * SDK tests cover the actual API calls.
 */
describe('ods operations', () => {
  describe('ods start', () => {
    it('should require sandboxId as argument', () => {
      expect(OdsStart.args).to.have.property('sandboxId');
      expect(OdsStart.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(OdsStart.description).to.be.a('string');
      expect(OdsStart.description.toLowerCase()).to.include('start');
    });

    it('should enable JSON flag', () => {
      expect(OdsStart.enableJsonFlag).to.be.true;
    });

    it('should return operation data in JSON mode', async () => {
      const command = new OdsStart([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'start' as const,
        operationState: 'running' as const,
      };

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: mockOperation},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockOperation);
      expect(result.operation).to.equal('start');
    });

    it('should log success message in non-JSON mode', async () => {
      const command = new OdsStart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) {
          logs.push(msg);
        }
      };

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'start' as const,
        operationState: 'running' as const,
        sandboxState: 'starting' as const,
      };

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: mockOperation},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockOperation);
      expect(logs.length).to.be.greaterThan(0);
    });

    it('should throw when API returns no operation data', async () => {
      const command = new OdsStart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      command.log = () => {};
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        POST: async () => ({
          data: undefined,
          error: {error: {message: 'Bad request'}},
          response: {statusText: 'Bad Request'},
        }),
      });

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to start sandbox');
        expect(error.message).to.include('Bad request');
      }
    });
  });

  describe('ods stop', () => {
    it('should require sandboxId as argument', () => {
      expect(OdsStop.args).to.have.property('sandboxId');
      expect(OdsStop.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(OdsStop.description).to.be.a('string');
      expect(OdsStop.description.toLowerCase()).to.include('stop');
    });

    it('should enable JSON flag', () => {
      expect(OdsStop.enableJsonFlag).to.be.true;
    });

    it('should return operation data in JSON mode', async () => {
      const command = new OdsStop([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'stop' as const,
        operationState: 'running' as const,
      };

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: mockOperation},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockOperation);
      expect(result.operation).to.equal('stop');
    });

    it('should log success message in non-JSON mode', async () => {
      const command = new OdsStop([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) {
          logs.push(msg);
        }
      };

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'stop' as const,
        operationState: 'running' as const,
        sandboxState: 'stopping' as const,
      };

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: mockOperation},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockOperation);
      expect(logs.length).to.be.greaterThan(0);
    });

    it('should throw when API returns no operation data', async () => {
      const command = new OdsStop([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      command.log = () => {};
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        POST: async () => ({
          data: undefined,
          error: {error: {message: 'Bad request'}},
          response: {statusText: 'Bad Request'},
        }),
      });

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to stop sandbox');
        expect(error.message).to.include('Bad request');
      }
    });
  });

  describe('ods restart', () => {
    it('should require sandboxId as argument', () => {
      expect(OdsRestart.args).to.have.property('sandboxId');
      expect(OdsRestart.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(OdsRestart.description).to.be.a('string');
      expect(OdsRestart.description.toLowerCase()).to.include('restart');
    });

    it('should enable JSON flag', () => {
      expect(OdsRestart.enableJsonFlag).to.be.true;
    });

    it('should return operation data in JSON mode', async () => {
      const command = new OdsRestart([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'restart' as const,
        operationState: 'running' as const,
      };

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: mockOperation},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockOperation);
      expect(result.operation).to.equal('restart');
    });

    it('should log success message in non-JSON mode', async () => {
      const command = new OdsRestart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) {
          logs.push(msg);
        }
      };

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'restart' as const,
        operationState: 'running' as const,
        sandboxState: 'restarting' as const,
      };

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: mockOperation},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.deep.equal(mockOperation);
      expect(logs.length).to.be.greaterThan(0);
    });

    it('should throw when API returns no operation data', async () => {
      const command = new OdsRestart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      command.log = () => {};
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        POST: async () => ({
          data: undefined,
          error: {error: {message: 'Bad request'}},
          response: {statusText: 'Bad Request'},
        }),
      });

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to restart sandbox');
        expect(error.message).to.include('Bad request');
      }
    });
  });
});
