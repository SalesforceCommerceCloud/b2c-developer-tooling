/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import OdsCreate from '../../../src/commands/ods/create.js';
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
describe('ods create', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

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
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {});

      const settings = (command as any).buildSettings(true);

      expect(settings).to.be.undefined;
    });

    it('should build settings with OCAPI and WebDAV permissions', () => {
      const command = new OdsCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const settings = (command as any).buildSettings(true);

      expect(settings).to.exist;
      expect(settings).to.have.property('ocapi');
      expect(settings).to.have.property('webdav');
      expect(settings.ocapi).to.be.an('array').with.length.greaterThan(0);
      expect(settings.webdav).to.be.an('array').with.length.greaterThan(0);
      expect(settings.ocapi[0]).to.have.property('client_id');
      expect(settings.webdav[0]).to.have.property('client_id');
    });

    it('should include default OCAPI resources', () => {
      const command = new OdsCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

      const settings = (command as any).buildSettings(true);

      const resources = settings.ocapi[0].resources;
      expect(resources).to.be.an('array');
      expect(resources.some((r: any) => r.resource_id === '/code_versions')).to.be.true;
      expect(resources.some((r: any) => r.resource_id.includes('/jobs/'))).to.be.true;
    });

    it('should include default WebDAV permissions', () => {
      const command = new OdsCreate([], {} as any);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {clientId: 'test-client-id'});

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

        stubOdsClient(command, mockClient);

        const result = await (command as any).waitForSandbox('sb-1', 0, 5);

        expect(result.state).to.equal('started');
      });

      it('should error when sandbox enters failed state', async () => {
        const command = setupCreateCommand();

        stubOdsClient(command, {
          GET: async () => ({
            data: {data: {state: 'failed'}},
          }),
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

        stubOdsClient(command, {
          GET: async () => ({
            data: {data: {state: 'deleted'}},
          }),
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

        sinon.stub(command as any, 'sleep').resolves(undefined);
        sinon.stub(Date, 'now').onFirstCall().returns(0).returns(1001);

        stubOdsClient(command, {
          GET: async () => ({
            data: {data: {id: 'sb-1', state: 'creating'}},
            response: new Response(),
          }),
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

        stubOdsClient(command, {
          GET: async () => ({
            data: undefined,
            response: {statusText: 'Internal Error'},
          }),
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
