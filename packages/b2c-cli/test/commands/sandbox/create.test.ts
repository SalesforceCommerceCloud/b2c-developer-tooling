/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxCreate from '../../../src/commands/sandbox/create.js';
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

function stubOdsClient(command: any, client: Partial<{GET: any; POST: any; PUT: any; DELETE: any}>): void {
  Object.defineProperty(command, 'odsClient', {
    value: client,
    configurable: true,
  });
}

function stubResolvedConfig(command: any, resolvedConfig: Record<string, unknown>): void {
  Object.defineProperty(command, 'resolvedConfig', {
    get: () => ({values: resolvedConfig}),
    configurable: true,
  });
}

function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}

/**
 * Unit tests for ODS create command CLI logic.
 * Tests settings building, permission logic, wait/poll logic.
 * SDK tests cover the actual API calls.
 */
describe('sandbox create', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('buildSettings', () => {
    it('should return undefined when set-permissions is false', () => {
      const command = new SandboxCreate([], {} as any);
      (command as any).flags = {'set-permissions': false};

      // Accessing private method for testing
      const settings = (command as any).buildSettings({setPermissions: false});

      expect(settings).to.be.undefined;
    });

    it('should return undefined when no client ID is configured', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {});

      const settings = (command as any).buildSettings({setPermissions: true});

      expect(settings).to.be.undefined;
    });

    it('should build settings with OCAPI and WebDAV permissions', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const settings = (command as any).buildSettings({setPermissions: true});

      expect(settings).to.exist;
      expect(settings).to.have.property('ocapi');
      expect(settings).to.have.property('webdav');
      expect(settings.ocapi).to.be.an('array').with.length.greaterThan(0);
      expect(settings.webdav).to.be.an('array').with.length.greaterThan(0);
      expect(settings.ocapi[0]).to.have.property('client_id');
      expect(settings.webdav[0]).to.have.property('client_id');
    });

    it('should include default OCAPI resources', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const settings = (command as any).buildSettings({setPermissions: true});

      const resources = settings.ocapi[0].resources;
      expect(resources).to.be.an('array');
      expect(resources.some((r: any) => r.resource_id === '/code_versions')).to.be.true;
      expect(resources.some((r: any) => r.resource_id.includes('/jobs/'))).to.be.true;
    });

    it('should include default WebDAV permissions', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const settings = (command as any).buildSettings({setPermissions: true});

      const permissions = settings.webdav[0].permissions;
      expect(permissions).to.be.an('array');
      expect(permissions.some((p: any) => p.path === '/impex')).to.be.true;
      expect(permissions.some((p: any) => p.path === '/cartridges')).to.be.true;
    });

    it('should use permissions-client-id override', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'auth-client-id'});

      const settings = (command as any).buildSettings({
        setPermissions: true,
        permissionsClientId: 'override-client-id',
      });

      expect(settings.ocapi[0].client_id).to.equal('override-client-id');
      expect(settings.webdav[0].client_id).to.equal('override-client-id');
    });

    it('should use custom ocapi-settings and default webdav', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const customOcapi = JSON.stringify([{client_id: 'custom', resources: [{resource_id: '/custom'}]}]);
      const settings = (command as any).buildSettings({
        setPermissions: true,
        ocapiSettings: customOcapi,
      });

      expect(settings.ocapi).to.have.lengthOf(1);
      expect(settings.ocapi[0].client_id).to.equal('custom');
      // WebDAV should still use defaults
      expect(settings.webdav[0].client_id).to.equal('test-client-id');
    });

    it('should use custom webdav-settings and default ocapi', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const customWebdav = JSON.stringify([{client_id: 'custom', permissions: [{path: '/custom'}]}]);
      const settings = (command as any).buildSettings({
        setPermissions: true,
        webdavSettings: customWebdav,
      });

      // OCAPI should still use defaults
      expect(settings.ocapi[0].client_id).to.equal('test-client-id');
      expect(settings.webdav).to.have.lengthOf(1);
      expect(settings.webdav[0].client_id).to.equal('custom');
    });

    it('should use both custom ocapi and webdav settings', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const customOcapi = JSON.stringify([{client_id: 'ocapi-custom', resources: []}]);
      const customWebdav = JSON.stringify([{client_id: 'webdav-custom', permissions: []}]);
      const settings = (command as any).buildSettings({
        setPermissions: true,
        ocapiSettings: customOcapi,
        webdavSettings: customWebdav,
      });

      expect(settings.ocapi[0].client_id).to.equal('ocapi-custom');
      expect(settings.webdav[0].client_id).to.equal('webdav-custom');
    });

    it('should throw on invalid JSON for ocapi-settings', () => {
      const command = new SandboxCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      try {
        (command as any).buildSettings({
          setPermissions: true,
          ocapiSettings: 'not-valid-json',
        });
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('Invalid JSON for --ocapi-settings');
      }
    });
  });

  describe('flag defaults', () => {
    it('should have correct default TTL', () => {
      expect(SandboxCreate.flags.ttl.default).to.equal(24);
    });

    it('should have correct default profile', () => {
      expect(SandboxCreate.flags.profile.default).to.equal('medium');
    });

    it('should have correct default for set-permissions', () => {
      expect(SandboxCreate.flags['set-permissions'].default).to.equal(true);
    });

    it('should have correct default for auto-scheduled', () => {
      expect(SandboxCreate.flags['auto-scheduled'].default).to.equal(false);
    });

    it('should have correct default for wait', () => {
      expect(SandboxCreate.flags.wait.default).to.equal(false);
    });

    it('should have correct default poll interval', () => {
      expect(SandboxCreate.flags['poll-interval'].default).to.equal(10);
    });

    it('should have correct default timeout', () => {
      expect(SandboxCreate.flags.timeout.default).to.equal(600);
    });
  });

  describe('profile options', () => {
    it('should only allow valid profile values', () => {
      const validProfiles = ['medium', 'large', 'xlarge', 'xxlarge'];
      expect(SandboxCreate.flags.profile.options).to.deep.equal(validProfiles);
    });
  });

  describe('run()', () => {
    function setupCreateCommand(): SandboxCreate {
      const command = new SandboxCreate([], {} as any);

      stubCommandConfigAndLogger(command);

      // Mock log & error
      command.log = () => {};
      makeCommandThrowOnError(command);

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

      stubOdsClient(command, {
        POST: async () => ({
          data: {
            data: {
              id: 'sb-123',
              realm: 'abcd',
              state: 'creating',
            },
          },
        }),
      });

      const result = await runSilent(() => command.run());

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

      stubOdsClient(command, {
        POST: async () => ({
          data: undefined,
          error: {
            error: {message: 'Invalid realm'},
          },
          response: {
            statusText: 'Bad Request',
          },
        }),
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

      stubOdsClient(command, {
        async POST(_url: string, options: any) {
          requestBody = options.body;
          return {
            data: {data: {id: 'sb-1', state: 'creating'}},
          };
        },
      });

      await runSilent(() => command.run());

      expect(requestBody.settings).to.be.undefined;
    });

    it('should include scheduler flags in POST body', async () => {
      const command = setupCreateCommand();

      const startSchedule = {weekdays: ['MONDAY', 'TUESDAY'], time: '08:00:00+03:00'};
      const stopSchedule = {weekdays: ['MONDAY', 'TUESDAY'], time: '19:00:00Z'};

      (command as any).flags = {
        realm: 'abcd',
        ttl: 24,
        profile: 'medium',
        wait: false,
        'set-permissions': false,
        'start-scheduler': JSON.stringify(startSchedule),
        'stop-scheduler': JSON.stringify(stopSchedule),
      };

      let requestBody: any;

      stubOdsClient(command, {
        async POST(_url: string, options: any) {
          requestBody = options.body;
          return {
            data: {data: {id: 'sb-1', state: 'creating'}},
          };
        },
      });

      await runSilent(() => command.run());

      expect(requestBody.startScheduler).to.deep.equal(startSchedule);
      expect(requestBody.stopScheduler).to.deep.equal(stopSchedule);
    });

    it('should throw on invalid JSON for scheduler flags', async () => {
      const command = setupCreateCommand();

      (command as any).flags = {
        realm: 'abcd',
        ttl: 24,
        profile: 'medium',
        wait: false,
        'set-permissions': false,
        'start-scheduler': 'not-json',
      };

      stubOdsClient(command, {
        POST: async () => ({data: {data: {id: 'sb-1', state: 'creating'}}}),
      });

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('Invalid JSON for --start-scheduler');
      }
    });

    describe('waitForSandbox()', () => {
      it('should wait until sandbox reaches started state', async () => {
        const command = setupCreateCommand();

        (command as any).flags = {
          realm: 'abcd',
          ttl: 24,
          profile: 'medium',
          'auto-scheduled': false,
          wait: true,
          'poll-interval': 0,
          timeout: 5,
          'set-permissions': false,
          json: true,
        };

        let getCalls = 0;
        stubOdsClient(command, {
          POST: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'creating'}},
            response: new Response(),
          }),
          async GET() {
            getCalls += 1;
            // First GET call is polling inside waitForSandbox.
            if (getCalls === 1) {
              return {
                data: {data: {id: 'sb-1', realm: 'abcd', state: 'started'}},
                response: new Response(),
              };
            }
            // Second GET call is the post-wait fetch of the sandbox.
            return {
              data: {data: {id: 'sb-1', realm: 'abcd', state: 'started'}},
              response: new Response(),
            };
          },
        });

        const result = await runSilent(() => command.run());
        expect(result.state).to.equal('started');
        expect(getCalls).to.equal(2);
      });

      it('should error when sandbox enters failed state', async () => {
        const command = setupCreateCommand();

        (command as any).flags = {
          realm: 'abcd',
          ttl: 24,
          profile: 'medium',
          'auto-scheduled': false,
          wait: true,
          'poll-interval': 0,
          timeout: 5,
          'set-permissions': false,
          json: true,
        };

        stubOdsClient(command, {
          POST: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'creating'}},
            response: new Response(),
          }),
          GET: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'failed'}},
            response: new Response(),
          }),
        });

        try {
          await command.run();
          expect.fail('Expected error');
        } catch (error: any) {
          expect(error.message).to.include('Sandbox creation failed');
        }
      });

      it('should error when sandbox is deleted', async () => {
        const command = setupCreateCommand();

        (command as any).flags = {
          realm: 'abcd',
          ttl: 24,
          profile: 'medium',
          'auto-scheduled': false,
          wait: true,
          'poll-interval': 0,
          timeout: 5,
          'set-permissions': false,
          json: true,
        };

        stubOdsClient(command, {
          POST: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'creating'}},
            response: new Response(),
          }),
          GET: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'deleted'}},
            response: new Response(),
          }),
        });

        try {
          await command.run();
          expect.fail('Expected error');
        } catch (error: any) {
          expect(error.message).to.include('Sandbox was deleted');
        }
      });

      it('should timeout if sandbox never reaches terminal state', async () => {
        const command = setupCreateCommand();

        (command as any).flags = {
          realm: 'abcd',
          ttl: 24,
          profile: 'medium',
          'auto-scheduled': false,
          wait: true,
          'poll-interval': 0,
          timeout: 1,
          'set-permissions': false,
          json: true,
        };

        // Use fake timers so waitForSandbox timeout logic can be triggered deterministically.
        const clock = sinon.useFakeTimers({now: 0});

        stubOdsClient(command, {
          POST: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'creating'}},
            response: new Response(),
          }),
          GET: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'creating'}},
            response: new Response(),
          }),
        });

        const promise = command.run();
        await clock.tickAsync(2000);

        try {
          await promise;
          expect.fail('Expected timeout');
        } catch (error: any) {
          expect(error.message).to.include('Timeout waiting for sandbox');
        } finally {
          clock.restore();
        }
      });

      it('should error if polling fails', async () => {
        const command = setupCreateCommand();

        (command as any).flags = {
          realm: 'abcd',
          ttl: 24,
          profile: 'medium',
          'auto-scheduled': false,
          wait: true,
          'poll-interval': 0,
          timeout: 5,
          'set-permissions': false,
          json: true,
        };

        stubOdsClient(command, {
          POST: async () => ({
            data: {data: {id: 'sb-1', realm: 'abcd', state: 'creating'}},
            response: new Response(),
          }),
          GET: async () => ({
            data: undefined,
            response: {statusText: 'Internal Error'},
          }),
        });

        try {
          await command.run();
          expect.fail('Expected error');
        } catch (error: any) {
          expect(error.message).to.include('Failed to fetch sandbox status');
        }
      });
    });
  });
});
