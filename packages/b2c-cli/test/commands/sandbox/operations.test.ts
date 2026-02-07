/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';

import SandboxStart from '../../../src/commands/sandbox/start.js';

import SandboxStop from '../../../src/commands/sandbox/stop.js';

import SandboxRestart from '../../../src/commands/sandbox/restart.js';

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
describe('sandbox operations', () => {
  describe('sandbox start', () => {
    it('should require sandboxId as argument', () => {
      expect(SandboxStart.args).to.have.property('sandboxId');
      expect(SandboxStart.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(SandboxStart.description).to.be.a('string');
      expect(SandboxStart.description.toLowerCase()).to.include('start');
    });

    it('should enable JSON flag', () => {
      expect(SandboxStart.enableJsonFlag).to.be.true;
    });

    it('should expose wait/polling flags', () => {
      expect(SandboxStart.flags).to.have.property('wait');
      expect(SandboxStart.flags.wait.char).to.equal('w');
      expect(SandboxStart.flags).to.have.property('poll-interval');
      expect(SandboxStart.flags['poll-interval'].dependsOn).to.deep.equal(['wait']);
      expect(SandboxStart.flags).to.have.property('timeout');
      expect(SandboxStart.flags.timeout.dependsOn).to.deep.equal(['wait']);
    });

    it('should return operation data in JSON mode', async () => {
      const command = new SandboxStart([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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
      const command = new SandboxStart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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
      const command = new SandboxStart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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

    it('should poll sandbox state when --wait is true', async () => {
      const command = new SandboxStart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: true, 'poll-interval': 0, timeout: 1},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const getSpy = sinon.spy(async () => ({
        data: {data: {state: 'started'}},
        response: new Response(),
      }));

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: {operation: 'start', operationState: 'running'}},
          response: new Response(),
        }),
        GET: getSpy,
      });

      await command.run();

      expect(getSpy.called, 'Expected GET to be called when --wait is true').to.equal(true);
    });
  });

  describe('sandbox stop', () => {
    it('should require sandboxId as argument', () => {
      expect(SandboxStop.args).to.have.property('sandboxId');
      expect(SandboxStop.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(SandboxStop.description).to.be.a('string');
      expect(SandboxStop.description.toLowerCase()).to.include('stop');
    });

    it('should enable JSON flag', () => {
      expect(SandboxStop.enableJsonFlag).to.be.true;
    });

    it('should expose wait/polling flags', () => {
      expect(SandboxStop.flags).to.have.property('wait');
      expect(SandboxStop.flags.wait.char).to.equal('w');
      expect(SandboxStop.flags).to.have.property('poll-interval');
      expect(SandboxStop.flags['poll-interval'].dependsOn).to.deep.equal(['wait']);
      expect(SandboxStop.flags).to.have.property('timeout');
      expect(SandboxStop.flags.timeout.dependsOn).to.deep.equal(['wait']);
    });

    it('should return operation data in JSON mode', async () => {
      const command = new SandboxStop([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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
      const command = new SandboxStop([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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
      const command = new SandboxStop([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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

    it('should poll sandbox state when --wait is true', async () => {
      const command = new SandboxStop([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: true, 'poll-interval': 0, timeout: 1},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const getSpy = sinon.spy(async () => ({
        data: {data: {state: 'stopped'}},
        response: new Response(),
      }));

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: {operation: 'stop', operationState: 'running'}},
          response: new Response(),
        }),
        GET: getSpy,
      });

      await command.run();

      expect(getSpy.called, 'Expected GET to be called when --wait is true').to.equal(true);
    });
  });

  describe('sandbox restart', () => {
    it('should require sandboxId as argument', () => {
      expect(SandboxRestart.args).to.have.property('sandboxId');
      expect(SandboxRestart.args.sandboxId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(SandboxRestart.description).to.be.a('string');
      expect(SandboxRestart.description.toLowerCase()).to.include('restart');
    });

    it('should enable JSON flag', () => {
      expect(SandboxRestart.enableJsonFlag).to.be.true;
    });

    it('should expose wait/polling flags', () => {
      expect(SandboxRestart.flags).to.have.property('wait');
      expect(SandboxRestart.flags.wait.char).to.equal('w');
      expect(SandboxRestart.flags).to.have.property('poll-interval');
      expect(SandboxRestart.flags['poll-interval'].dependsOn).to.deep.equal(['wait']);
      expect(SandboxRestart.flags).to.have.property('timeout');
      expect(SandboxRestart.flags.timeout.dependsOn).to.deep.equal(['wait']);
    });

    it('should return operation data in JSON mode', async () => {
      const command = new SandboxRestart([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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
      const command = new SandboxRestart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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
      const command = new SandboxRestart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: false, 'poll-interval': 10, timeout: 600},
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

    it('should poll sandbox state when --wait is true', async () => {
      const command = new SandboxRestart([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'flags', {
        value: {wait: true, 'poll-interval': 0, timeout: 1},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const getSpy = sinon.spy(async () => ({
        data: {data: {state: 'started'}},
        response: new Response(),
      }));

      stubOdsClient(command, {
        POST: async () => ({
          data: {data: {operation: 'restart', operationState: 'running'}},
          response: new Response(),
        }),
        GET: getSpy,
      });

      await command.run();

      expect(getSpy.called, 'Expected GET to be called when --wait is true').to.equal(true);
    });
  });
});
