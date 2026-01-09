/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
/* eslint-disable @typescript-eslint/no-explicit-any */
import OdsInfo from '../../../src/commands/ods/info.js';

/**
 * Unit tests for ODS info command CLI logic.
 * Tests output formatting and data combination.
 * SDK tests cover the actual API calls.
 */
describe('ods info', () => {
  describe('command structure', () => {
    it('should have correct description', () => {
      expect(OdsInfo.description).to.be.a('string');
      expect(OdsInfo.description).to.include('information');
    });

    it('should enable JSON flag', () => {
      expect(OdsInfo.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should combine user and system info in JSON mode', async () => {
      const command = new OdsInfo([], {} as any);
      (command as any).flags = {};
      command.jsonEnabled = () => true;

      // Mock config and logger
      Object.defineProperty(command, 'config', {
        value: {findConfigFile: () => ({read: () => ({'sandbox-api-host': 'admin.dx.test.com'})})},
        configurable: true,
      });
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      const mockUserInfo = {
        data: {
          user: {id: 'user-1', name: 'Test User'},
          realms: ['zzzv'],
        },
      };

      const mockSystemInfo = {
        data: {
          region: 'us-east-1',
          sandboxIps: ['1.2.3.4'],
        },
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          async GET(path: string) {
            if (path === '/me') {
              return {data: mockUserInfo, response: new Response()};
            }
            if (path === '/system') {
              return {data: mockSystemInfo, response: new Response()};
            }
            throw new Error('Unexpected path');
          },
        },
        configurable: true,
      });

      const result = await command.run();

      expect(result).to.have.property('user');
      expect(result).to.have.property('system');
      expect(result.user).to.deep.equal(mockUserInfo.data);
      expect(result.system).to.deep.equal(mockSystemInfo.data);
    });

    it('should display formatted info in non-JSON mode', async () => {
      const command = new OdsInfo([], {} as any);
      (command as any).flags = {};
      command.jsonEnabled = () => false;

      Object.defineProperty(command, 'config', {
        value: {findConfigFile: () => ({read: () => ({'sandbox-api-host': 'admin.dx.test.com'})})},
        configurable: true,
      });
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      const mockUserInfo = {
        data: {
          user: {id: 'user-1', email: 'test@example.com'},
          realms: ['zzzv', 'abcd'],
        },
      };

      const mockSystemInfo = {
        data: {
          region: 'us-east-1',
          sandboxIps: ['1.2.3.4', '5.6.7.8'],
        },
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          async GET(path: string) {
            if (path === '/me') {
              return {data: mockUserInfo, response: new Response()};
            }
            if (path === '/system') {
              return {data: mockSystemInfo, response: new Response()};
            }
            throw new Error('Unexpected path');
          },
        },
        configurable: true,
      });

      const result = await command.run();

      expect(result).to.have.property('user');
      expect(result).to.have.property('system');
      // Should have logged information
      expect(logs.length).to.be.greaterThan(0);
    });

    it('should error when user info fails', async () => {
      const command = new OdsInfo([], {} as any);
      (command as any).flags = {};

      // Mock config and logger
      Object.defineProperty(command, 'config', {
        value: {findConfigFile: () => ({read: () => ({'sandbox-api-host': 'admin.dx.test.com'})})},
        configurable: true,
      });
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          async GET(path: string) {
            if (path === '/me') {
              return {data: undefined, response: new Response(null, {status: 500})};
            }
            return {data: {data: {}}, response: new Response()};
          },
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch user info/);
      }
    });

    it('should error when system info fails', async () => {
      const command = new OdsInfo([], {} as any);
      (command as any).flags = {};

      // Mock config and logger
      Object.defineProperty(command, 'config', {
        value: {findConfigFile: () => ({read: () => ({'sandbox-api-host': 'admin.dx.test.com'})})},
        configurable: true,
      });
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          async GET(path: string) {
            if (path === '/me') {
              return {data: {data: {}}, response: new Response()};
            }
            if (path === '/system') {
              return {data: undefined, response: new Response(null, {status: 500})};
            }
            throw new Error('Unexpected path');
          },
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch system info/);
      }
    });

    it('should handle null user info data', async () => {
      const command = new OdsInfo([], {} as any);
      (command as any).flags = {};

      Object.defineProperty(command, 'config', {
        value: {findConfigFile: () => ({read: () => ({'sandbox-api-host': 'admin.dx.test.com'})})},
        configurable: true,
      });
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          async GET(path: string) {
            if (path === '/me') {
              return {data: null as any, response: new Response(null, {status: 500})};
            }
            return {data: {data: {}}, response: new Response()};
          },
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch user info/);
      }
    });

    it('should handle API errors with error messages', async () => {
      const command = new OdsInfo([], {} as any);
      (command as any).flags = {};

      Object.defineProperty(command, 'config', {
        value: {findConfigFile: () => ({read: () => ({'sandbox-api-host': 'admin.dx.test.com'})})},
        configurable: true,
      });
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      command.error = (msg: string) => {
        throw new Error(msg);
      };

      Object.defineProperty(command, 'odsClient', {
        value: {
          async GET(path: string) {
            if (path === '/me') {
              return {
                data: undefined,
                error: {error: {message: 'Unauthorized'}},
                response: new Response(null, {status: 401, statusText: 'Unauthorized'}),
              };
            }
            if (path === '/system') {
              return {data: {data: {}}, response: new Response()};
            }
            throw new Error('Unexpected path');
          },
        },
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Failed to fetch user info');
        expect(error.message).to.include('Unauthorized');
      }
    });
  });
});
