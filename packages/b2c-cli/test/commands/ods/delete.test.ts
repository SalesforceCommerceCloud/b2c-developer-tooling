/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
/* eslint-disable @typescript-eslint/no-explicit-any */
import OdsDelete from '../../../src/commands/ods/delete.js';

/**
 * Unit tests for ODS delete command CLI logic.
 * Tests confirmation logic and flag handling.
 * SDK tests cover the actual API calls.
 */
describe('ods delete', () => {
  describe('command structure', () => {
    it('should require sandboxId as argument', () => {
      expect(OdsDelete.args).to.have.property('sandboxId');
      expect(OdsDelete.args.sandboxId.required).to.be.true;
    });

    it('should have force flag', () => {
      expect(OdsDelete.flags).to.have.property('force');
      expect(OdsDelete.flags.force.char).to.equal('f');
    });

    it('should have correct description', () => {
      expect(OdsDelete.description).to.be.a('string');
      expect(OdsDelete.description.toLowerCase()).to.include('delete');
    });

    it('should have examples', () => {
      expect(OdsDelete.examples).to.be.an('array');
      expect(OdsDelete.examples.length).to.be.greaterThan(0);
    });
  });

  describe('flag defaults', () => {
    it('should have force flag default to false', () => {
      expect(OdsDelete.flags.force.default).to.be.false;
    });
  });

  describe('output formatting', () => {
    it('should delete successfully with --force flag', async () => {
      const command = new OdsDelete([], {} as any);

      // Mock args
      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      // Mock logger
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      (command as any).flags = {force: true};
      command.jsonEnabled = () => true;

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      const mockOperation = {
        id: 'op-123',
        sandboxId: 'sandbox-123',
        operation: 'delete' as const,
        operationState: 'running' as const,
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          GET: async () => ({
            data: {data: {id: 'sandbox-123', realm: 'zzzv', instance: 'zzzv-001'}},
            response: new Response(),
          }),
          DELETE: async () => ({
            data: {data: mockOperation},
            response: new Response(null, {status: 202}),
          }),
        },
        configurable: true,
      });

      await command.run();

      // Should have logged deletion messages
      expect(logs.some((log) => log.includes('Deleting'))).to.be.true;
      expect(logs.some((log) => log.includes('deletion initiated'))).to.be.true;
    });

    it('should log messages in non-JSON mode', async () => {
      const command = new OdsDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      (command as any).flags = {force: true};
      command.jsonEnabled = () => false;

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          GET: async () => ({
            data: {data: {id: 'sandbox-123', realm: 'zzzv'}},
            response: new Response(),
          }),
          DELETE: async () => ({
            data: {data: {}},
            response: new Response(null, {status: 202}),
          }),
        },
        configurable: true,
      });

      await command.run();

      expect(logs.length).to.be.greaterThan(0);
      expect(logs.some((log) => log.includes('zzzv'))).to.be.true;
    });

    it('should error when sandbox not found', async () => {
      const command = new OdsDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'nonexistent'},
        configurable: true,
      });

      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      (command as any).flags = {force: true};

      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          GET: async () => ({
            data: {data: undefined},
            response: new Response(null, {status: 404}),
          }),
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Sandbox not found');
      }
    });

    it('should error when delete operation fails', async () => {
      const command = new OdsDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      (command as any).flags = {force: true};

      command.log = () => {};
      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          GET: async () => ({
            data: {data: {id: 'sandbox-123', realm: 'zzzv'}},
            response: new Response(),
          }),
          DELETE: async () => ({
            data: undefined,
            error: {error: {message: 'Operation failed'}},
            response: new Response(null, {status: 500}),
          }),
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Failed to delete sandbox');
        expect(error.message).to.include('Operation failed');
      }
    });

    it('should handle null sandbox data', async () => {
      const command = new OdsDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      (command as any).flags = {force: true};

      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          GET: async () => ({
            data: null as any,
            response: new Response(null, {status: 500}),
          }),
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Sandbox not found');
      }
    });

    it('should error on non-202 response status', async () => {
      const command = new OdsDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {sandboxId: 'sandbox-123'},
        configurable: true,
      });

      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      (command as any).flags = {force: true};

      command.log = () => {};
      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          GET: async () => ({
            data: {data: {id: 'sandbox-123', realm: 'zzzv'}},
            response: new Response(),
          }),
          DELETE: async () => ({
            data: {data: {}},
            response: new Response(null, {status: 400, statusText: 'Bad Request'}),
          }),
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Failed to delete sandbox');
        expect(error.message).to.include('Bad Request');
      }
    });
  });
});
