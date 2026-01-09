/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any, unicorn/consistent-function-scoping */
import {expect} from 'chai';
import OdsCreate from '../../../src/commands/ods/create.js';

/**
 * Unit tests for ODS create command CLI logic.
 * Tests settings building, permission logic, wait/poll logic.
 * SDK tests cover the actual API calls.
 */
describe('ods create', () => {
  describe('buildSettings', () => {
    it('should return undefined when set-permissions is false', () => {
      const command = new OdsCreate([], {} as any);
      (command as any).flags = {'set-permissions': false};

      // Accessing private method for testing
      const settings = (command as any).buildSettings(false);

      expect(settings).to.be.undefined;
    });

    it('should return undefined when no client ID is configured', () => {
      const command = new OdsCreate([], {} as any);

      // Mock resolvedConfig with no clientId
      Object.defineProperty(command, 'resolvedConfig', {
        get: () => ({}),
        configurable: true,
      });

      const settings = (command as any).buildSettings(true);

      expect(settings).to.be.undefined;
    });

    it('should build settings with OCAPI and WebDAV permissions', () => {
      const command = new OdsCreate([], {} as any);

      // Mock resolvedConfig with clientId
      Object.defineProperty(command, 'resolvedConfig', {
        get: () => ({clientId: 'test-client-id'}),
        configurable: true,
      });

      const settings = (command as any).buildSettings(true);

      expect(settings).to.exist;
      expect(settings).to.have.property('ocapi');
      expect(settings).to.have.property('webdav');
      expect(settings.ocapi).to.be.an('array').with.length.greaterThan(0);
      expect(settings.webdav).to.be.an('array').with.length.greaterThan(0);
      expect(settings.ocapi[0]).to.have.property('client_id', 'test-client-id');
      expect(settings.webdav[0]).to.have.property('client_id', 'test-client-id');
    });

    it('should include default OCAPI resources', () => {
      const command = new OdsCreate([], {} as any);

      Object.defineProperty(command, 'resolvedConfig', {
        get: () => ({clientId: 'test-client-id'}),
        configurable: true,
      });

      const settings = (command as any).buildSettings(true);

      const resources = settings.ocapi[0].resources;
      expect(resources).to.be.an('array');
      expect(resources.some((r: any) => r.resource_id === '/code_versions')).to.be.true;
      expect(resources.some((r: any) => r.resource_id.includes('/jobs/'))).to.be.true;
    });

    it('should include default WebDAV permissions', () => {
      const command = new OdsCreate([], {} as any);

      Object.defineProperty(command, 'resolvedConfig', {
        get: () => ({clientId: 'test-client-id'}),
        configurable: true,
      });

      const settings = (command as any).buildSettings(true);

      const permissions = settings.webdav[0].permissions;
      expect(permissions).to.be.an('array');
      expect(permissions.some((p: any) => p.path === '/impex')).to.be.true;
      expect(permissions.some((p: any) => p.path === '/cartridges')).to.be.true;
    });
  });

  describe('flag defaults', () => {
    it('should have correct default TTL', () => {
      expect(OdsCreate.flags.ttl.default).to.equal(24);
    });

    it('should have correct default profile', () => {
      expect(OdsCreate.flags.profile.default).to.equal('medium');
    });

    it('should have correct default for set-permissions', () => {
      expect(OdsCreate.flags['set-permissions'].default).to.equal(true);
    });

    it('should have correct default for auto-scheduled', () => {
      expect(OdsCreate.flags['auto-scheduled'].default).to.equal(false);
    });

    it('should have correct default for wait', () => {
      expect(OdsCreate.flags.wait.default).to.equal(false);
    });

    it('should have correct default poll interval', () => {
      expect(OdsCreate.flags['poll-interval'].default).to.equal(10);
    });

    it('should have correct default timeout', () => {
      expect(OdsCreate.flags.timeout.default).to.equal(600);
    });
  });

  describe('profile options', () => {
    it('should only allow valid profile values', () => {
      const validProfiles = ['medium', 'large', 'xlarge', 'xxlarge'];
      expect(OdsCreate.flags.profile.options).to.deep.equal(validProfiles);
    });
  });

  describe('run()', () => {
    function setupCreateCommand(): OdsCreate {
      const command = new OdsCreate([], {} as any);

      // Mock logger
      Object.defineProperty(command, 'logger', {
        get: () => ({info() {}}),
        configurable: true,
      });

      // Mock log & error
      command.log = () => {};
      command.error = (msg: string) => {
        throw new Error(msg);
      };

      return command;
    }

    it('should create sandbox successfully without wait', async () => {
      const command = setupCreateCommand();

      (command as any).flags = {
        realm: 'abcd',
        ttl: 24,
        profile: 'medium',
        'auto-scheduled': false,
        wait: false,
        'set-permissions': false,
        json: true,
      };

      const mockClient = {
        POST: async () => ({
          data: {
            data: {
              id: 'sb-123',
              realm: 'abcd',
              state: 'creating',
            },
          },
        }),
      };

      Object.defineProperty(command, 'odsClient', {
        get: () => mockClient,
        configurable: true,
      });

      const result = await command.run();

      expect(result.id).to.equal('sb-123');
    });

    it('should throw error when sandbox creation fails', async () => {
      const command = setupCreateCommand();

      (command as any).flags = {
        realm: 'abcd',
        ttl: 24,
        profile: 'medium',
        wait: false,
        'set-permissions': false,
      };

      const mockClient = {
        POST: async () => ({
          data: undefined,
          error: {
            error: {message: 'Invalid realm'},
          },
          response: {
            statusText: 'Bad Request',
          },
        }),
      };

      Object.defineProperty(command, 'odsClient', {
        get: () => mockClient,
        configurable: true,
      });

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to create sandbox');
      }
    });

    it('should not include settings when set-permissions is false', async () => {
      const command = setupCreateCommand();

      (command as any).flags = {
        realm: 'abcd',
        ttl: 24,
        profile: 'medium',
        wait: false,
        'set-permissions': false,
      };

      let requestBody: any;

      const mockClient = {
        async POST(_url: string, options: any) {
          requestBody = options.body;
          return {
            data: {data: {id: 'sb-1', state: 'creating'}},
          };
        },
      };

      Object.defineProperty(command, 'odsClient', {
        get: () => mockClient,
        configurable: true,
      });

      await command.run();

      expect(requestBody.settings).to.be.undefined;
    });

    describe('waitForSandbox()', () => {
      it('should wait until sandbox reaches started state', async () => {
        const command = setupCreateCommand();
        let calls = 0;

        const mockClient = {
          async GET() {
            calls++;
            return {
              data: {
                data: {
                  state: calls < 2 ? 'creating' : 'started',
                },
              },
            };
          },
        };

        Object.defineProperty(command, 'odsClient', {
          get: () => mockClient,
          configurable: true,
        });

        const result = await (command as any).waitForSandbox('sb-1', 0, 5);

        expect(result.state).to.equal('started');
      });

      it('should error when sandbox enters failed state', async () => {
        const command = setupCreateCommand();

        Object.defineProperty(command, 'odsClient', {
          get: () => ({
            GET: async () => ({
              data: {data: {state: 'failed'}},
            }),
          }),
          configurable: true,
        });

        try {
          await (command as any).waitForSandbox('sb-1', 0, 5);
          expect.fail('Expected error');
        } catch (error: any) {
          expect(error.message).to.include('Sandbox creation failed');
        }
      });

      it('should error when sandbox is deleted', async () => {
        const command = setupCreateCommand();

        Object.defineProperty(command, 'odsClient', {
          get: () => ({
            GET: async () => ({
              data: {data: {state: 'deleted'}},
            }),
          }),
          configurable: true,
        });

        try {
          await (command as any).waitForSandbox('sb-1', 0, 5);
          expect.fail('Expected error');
        } catch (error: any) {
          expect(error.message).to.include('Sandbox was deleted');
        }
      });

      it('should timeout if sandbox never reaches terminal state', async () => {
        const command = setupCreateCommand();

        Object.defineProperty(command, 'odsClient', {
          get: () => ({
            GET: async () => ({
              data: {data: {state: 'creating'}},
            }),
          }),
          configurable: true,
        });

        try {
          await (command as any).waitForSandbox('sb-1', 0, 1);
          expect.fail('Expected timeout');
        } catch (error: any) {
          expect(error.message).to.include('Timeout waiting for sandbox');
        }
      });

      it('should error if polling API returns no data', async () => {
        const command = setupCreateCommand();

        Object.defineProperty(command, 'odsClient', {
          get: () => ({
            GET: async () => ({
              data: undefined,
              response: {statusText: 'Internal Error'},
            }),
          }),
          configurable: true,
        });

        try {
          await (command as any).waitForSandbox('sb-1', 0, 5);
          expect.fail('Expected error');
        } catch (error: any) {
          expect(error.message).to.include('Failed to fetch sandbox status');
        }
      });
    });
  });
});
