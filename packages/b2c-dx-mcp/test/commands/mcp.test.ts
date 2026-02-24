/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createSandbox, type SinonStub, type SinonSandbox} from 'sinon';
import {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';
import McpServerCommand from '../../src/commands/mcp.js';
import {B2CDxMcpServer} from '../../src/server.js';
import {Services} from '../../src/services.js';
import {createMockResolvedConfig} from '../test-helpers.js';

describe('McpServerCommand', () => {
  describe('static properties', () => {
    it('should have a description', () => {
      expect(McpServerCommand.description).to.be.a('string');
      expect(McpServerCommand.description).to.include('MCP Server');
    });

    it('should have examples', () => {
      expect(McpServerCommand.examples).to.be.an('array');
      expect(McpServerCommand.examples.length).to.be.greaterThan(0);
    });

    it('should define toolsets flag', () => {
      const toolsetsFlag = McpServerCommand.flags.toolsets;
      expect(toolsetsFlag).to.not.be.undefined;
    });

    it('should define tools flag', () => {
      const toolsFlag = McpServerCommand.flags.tools;
      expect(toolsFlag).to.not.be.undefined;
    });

    it('should define allow-non-ga-tools flag with default false', () => {
      const flag = McpServerCommand.flags['allow-non-ga-tools'];
      expect(flag).to.not.be.undefined;
      expect(flag.default).to.equal(false);
    });

    it('should not have a no-telemetry flag (telemetry controlled via env vars only)', () => {
      // Telemetry is disabled via SF_DISABLE_TELEMETRY=true or SFCC_DISABLE_TELEMETRY=true
      // This keeps the CLI cleaner and prevents accidental disabling
      const flags = McpServerCommand.flags as Record<string, unknown>;
      expect(flags['no-telemetry']).to.be.undefined;
    });

    it('should inherit config flag from BaseCommand', () => {
      // config flag is inherited from BaseCommand.baseFlags
      const flag = McpServerCommand.baseFlags.config;
      expect(flag).to.not.be.undefined;
    });

    it('should inherit debug flag from BaseCommand', () => {
      const flag = McpServerCommand.baseFlags.debug;
      expect(flag).to.not.be.undefined;
    });

    it('should inherit log-level flag from BaseCommand', () => {
      const flag = McpServerCommand.baseFlags['log-level'];
      expect(flag).to.not.be.undefined;
    });

    it('should support environment variables for flags', () => {
      expect(McpServerCommand.flags.toolsets.env).to.equal('SFCC_TOOLSETS');
      expect(McpServerCommand.flags.tools.env).to.equal('SFCC_TOOLS');
      expect(McpServerCommand.flags['allow-non-ga-tools'].env).to.equal('SFCC_ALLOW_NON_GA_TOOLS');
      // config flag env is inherited from BaseCommand
      expect(McpServerCommand.baseFlags.config.env).to.equal('SFCC_CONFIG');
    });

    it('should define api-key flag with env var support', () => {
      const flag = McpServerCommand.flags['api-key'];
      expect(flag).to.not.be.undefined;
      expect(flag.env).to.equal('SFCC_MRT_API_KEY');
    });

    it('should define project-directory flag with env var support', () => {
      const flag = McpServerCommand.flags['project-directory'];
      expect(flag).to.not.be.undefined;
      expect(flag.env).to.equal('SFCC_PROJECT_DIRECTORY');
    });
  });

  describe('flag parse functions', () => {
    it('should uppercase toolsets input', async () => {
      const parse = McpServerCommand.flags.toolsets.parse;
      if (parse) {
        const result = await parse('cartridges,mrt', {} as never, {} as never);
        expect(result).to.equal('CARTRIDGES,MRT');
      }
    });

    it('should lowercase tools input', async () => {
      const parse = McpServerCommand.flags.tools.parse;
      if (parse) {
        const result = await parse('CARTRIDGE_DEPLOY,MRT_BUNDLE_PUSH', {} as never, {} as never);
        expect(result).to.equal('cartridge_deploy,mrt_bundle_push');
      }
    });
  });

  describe('telemetry initialization', () => {
    let sandbox: SinonSandbox;
    let serverConnectStub: SinonStub;
    let addAttributesStub: SinonStub;

    beforeEach(() => {
      sandbox = createSandbox();

      // Stub Telemetry prototype methods - this works because BaseCommand creates
      // telemetry instances with `new Telemetry()`, so all instances use these stubs
      sandbox.stub(Telemetry.prototype, 'start').resolves();
      sandbox.stub(Telemetry.prototype, 'stop');
      sandbox.stub(Telemetry.prototype, 'sendEvent');
      sandbox.stub(Telemetry.prototype, 'sendException');
      addAttributesStub = sandbox.stub(Telemetry.prototype, 'addAttributes');

      // Stub server.connect to prevent actual stdio transport
      serverConnectStub = sandbox.stub(B2CDxMcpServer.prototype, 'connect').resolves();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should pass telemetry to server when telemetry is initialized', async () => {
      // Create a real Telemetry instance (will use our stubbed prototype methods)
      const telemetryInstance = new Telemetry({
        project: 'test',
        appInsightsKey: 'test-key',
      });

      // Create command instance - cast config to avoid oclif type complexity
      const command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);

      // Stub init to set up flags
      sandbox.stub(command, 'init').resolves();
      (command as unknown as {flags: Record<string, unknown>}).flags = {
        'allow-non-ga-tools': false,
        'log-level': 'silent',
      };

      // Simulate BaseCommand.init() having set up telemetry
      (command as unknown as {telemetry: Telemetry}).telemetry = telemetryInstance;

      // Stub resolvedConfig with required methods (cast to bypass protected accessor)
      sandbox.stub(command as unknown as Record<string, unknown>, 'resolvedConfig').get(() => ({
        values: {},
        hasMrtConfig: () => false,
        hasB2CInstanceConfig: () => false,
        hasOAuth: () => false,
        hasBasicAuth: () => false,
      }));

      // Stub logger (cast to bypass protected accessor)
      sandbox.stub(command as unknown as Record<string, unknown>, 'logger').get(() => ({info: sandbox.stub()}));

      // Run the command
      await command.run();

      // Verify server.connect was called (server started successfully)
      expect(serverConnectStub.calledOnce).to.be.true;
    });

    it('should start server without telemetry when telemetry is not configured', async () => {
      // Create command instance without telemetry set
      const command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);

      // Stub init to set up flags
      sandbox.stub(command, 'init').resolves();
      (command as unknown as {flags: Record<string, unknown>}).flags = {
        'allow-non-ga-tools': false,
        'log-level': 'silent',
      };

      // Don't set this.telemetry - simulates when telemetry is disabled

      // Stub resolvedConfig with required methods (cast to bypass protected accessor)
      sandbox.stub(command as unknown as Record<string, unknown>, 'resolvedConfig').get(() => ({
        values: {},
        hasMrtConfig: () => false,
        hasB2CInstanceConfig: () => false,
        hasOAuth: () => false,
        hasBasicAuth: () => false,
      }));

      // Stub logger (cast to bypass protected accessor)
      sandbox.stub(command as unknown as Record<string, unknown>, 'logger').get(() => ({info: sandbox.stub()}));

      // Run the command
      await command.run();

      // Verify server.connect was called (server started successfully even without telemetry)
      expect(serverConnectStub.calledOnce).to.be.true;
    });

    it('should add toolsets to telemetry attributes when toolsets are specified', async () => {
      // Create a real Telemetry instance
      const telemetryInstance = new Telemetry({
        project: 'test',
        appInsightsKey: 'test-key',
      });

      // Create command instance
      const command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);

      // Stub init to set up flags with toolsets
      sandbox.stub(command, 'init').resolves();
      (command as unknown as {flags: Record<string, unknown>}).flags = {
        'allow-non-ga-tools': false,
        'log-level': 'silent',
        toolsets: 'MRT,CARTRIDGES',
      };

      // Simulate BaseCommand.init() having set up telemetry
      (command as unknown as {telemetry: Telemetry}).telemetry = telemetryInstance;

      // Stub resolvedConfig
      sandbox.stub(command as unknown as Record<string, unknown>, 'resolvedConfig').get(() => ({
        values: {},
        hasMrtConfig: () => false,
        hasB2CInstanceConfig: () => false,
        hasOAuth: () => false,
        hasBasicAuth: () => false,
      }));

      // Stub logger
      sandbox.stub(command as unknown as Record<string, unknown>, 'logger').get(() => ({info: sandbox.stub()}));

      // Run the command
      await command.run();

      // Verify addAttributes was called with toolsets
      expect(addAttributesStub.called).to.be.true;
      const attributesCall = addAttributesStub.firstCall.args[0];
      expect(attributesCall.toolsets).to.equal('MRT, CARTRIDGES');
    });
  });

  describe('telemetry env var configuration', () => {
    describe('Telemetry.isDisabled()', () => {
      it('returns false when no disable env vars are set', () => {
        const originalSf = process.env.SF_DISABLE_TELEMETRY;
        const originalSfcc = process.env.SFCC_DISABLE_TELEMETRY;
        try {
          delete process.env.SF_DISABLE_TELEMETRY;
          delete process.env.SFCC_DISABLE_TELEMETRY;
          expect(Telemetry.isDisabled()).to.be.false;
        } finally {
          if (originalSf !== undefined) process.env.SF_DISABLE_TELEMETRY = originalSf;
          if (originalSfcc !== undefined) process.env.SFCC_DISABLE_TELEMETRY = originalSfcc;
        }
      });

      it('returns true when SF_DISABLE_TELEMETRY=true', () => {
        const original = process.env.SF_DISABLE_TELEMETRY;
        try {
          process.env.SF_DISABLE_TELEMETRY = 'true';
          expect(Telemetry.isDisabled()).to.be.true;
        } finally {
          if (original === undefined) {
            delete process.env.SF_DISABLE_TELEMETRY;
          } else {
            process.env.SF_DISABLE_TELEMETRY = original;
          }
        }
      });

      it('returns true when SFCC_DISABLE_TELEMETRY=true', () => {
        const original = process.env.SFCC_DISABLE_TELEMETRY;
        try {
          process.env.SFCC_DISABLE_TELEMETRY = 'true';
          expect(Telemetry.isDisabled()).to.be.true;
        } finally {
          if (original === undefined) {
            delete process.env.SFCC_DISABLE_TELEMETRY;
          } else {
            process.env.SFCC_DISABLE_TELEMETRY = original;
          }
        }
      });

      it('returns false when SF_DISABLE_TELEMETRY=false', () => {
        const original = process.env.SF_DISABLE_TELEMETRY;
        const originalSfcc = process.env.SFCC_DISABLE_TELEMETRY;
        try {
          process.env.SF_DISABLE_TELEMETRY = 'false';
          delete process.env.SFCC_DISABLE_TELEMETRY;
          expect(Telemetry.isDisabled()).to.be.false;
        } finally {
          if (original === undefined) {
            delete process.env.SF_DISABLE_TELEMETRY;
          } else {
            process.env.SF_DISABLE_TELEMETRY = original;
          }
          if (originalSfcc !== undefined) process.env.SFCC_DISABLE_TELEMETRY = originalSfcc;
        }
      });
    });

    describe('Telemetry.getConnectionString()', () => {
      it('returns undefined when telemetry is disabled', () => {
        const originalDisable = process.env.SF_DISABLE_TELEMETRY;
        try {
          process.env.SF_DISABLE_TELEMETRY = 'true';
          expect(Telemetry.getConnectionString('default-key')).to.be.undefined;
        } finally {
          if (originalDisable === undefined) {
            delete process.env.SF_DISABLE_TELEMETRY;
          } else {
            process.env.SF_DISABLE_TELEMETRY = originalDisable;
          }
        }
      });

      it('returns project default when no env override', () => {
        const originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        const originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
        const originalKey = process.env.SFCC_APP_INSIGHTS_KEY;
        try {
          delete process.env.SF_DISABLE_TELEMETRY;
          delete process.env.SFCC_DISABLE_TELEMETRY;
          delete process.env.SFCC_APP_INSIGHTS_KEY;
          expect(Telemetry.getConnectionString('default-key')).to.equal('default-key');
        } finally {
          if (originalSfDisable === undefined) delete process.env.SF_DISABLE_TELEMETRY;
          else process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
          if (originalSfccDisable === undefined) delete process.env.SFCC_DISABLE_TELEMETRY;
          else process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
          if (originalKey === undefined) delete process.env.SFCC_APP_INSIGHTS_KEY;
          else process.env.SFCC_APP_INSIGHTS_KEY = originalKey;
        }
      });

      it('returns env override when SFCC_APP_INSIGHTS_KEY is set', () => {
        const originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        const originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
        const originalKey = process.env.SFCC_APP_INSIGHTS_KEY;
        try {
          delete process.env.SF_DISABLE_TELEMETRY;
          delete process.env.SFCC_DISABLE_TELEMETRY;
          process.env.SFCC_APP_INSIGHTS_KEY = 'env-override-key';
          expect(Telemetry.getConnectionString('default-key')).to.equal('env-override-key');
        } finally {
          if (originalSfDisable === undefined) delete process.env.SF_DISABLE_TELEMETRY;
          else process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
          if (originalSfccDisable === undefined) delete process.env.SFCC_DISABLE_TELEMETRY;
          else process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
          if (originalKey === undefined) delete process.env.SFCC_APP_INSIGHTS_KEY;
          else process.env.SFCC_APP_INSIGHTS_KEY = originalKey;
        }
      });

      it('returns undefined when no default and no env override', () => {
        const originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        const originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
        const originalKey = process.env.SFCC_APP_INSIGHTS_KEY;
        try {
          delete process.env.SF_DISABLE_TELEMETRY;
          delete process.env.SFCC_DISABLE_TELEMETRY;
          delete process.env.SFCC_APP_INSIGHTS_KEY;
          expect(Telemetry.getConnectionString()).to.be.undefined;
        } finally {
          if (originalSfDisable === undefined) delete process.env.SF_DISABLE_TELEMETRY;
          else process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
          if (originalSfccDisable === undefined) delete process.env.SFCC_DISABLE_TELEMETRY;
          else process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
          if (originalKey === undefined) delete process.env.SFCC_APP_INSIGHTS_KEY;
          else process.env.SFCC_APP_INSIGHTS_KEY = originalKey;
        }
      });

      it('returns env override even without project default', () => {
        const originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
        const originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
        const originalKey = process.env.SFCC_APP_INSIGHTS_KEY;
        try {
          delete process.env.SF_DISABLE_TELEMETRY;
          delete process.env.SFCC_DISABLE_TELEMETRY;
          process.env.SFCC_APP_INSIGHTS_KEY = 'env-only-key';
          expect(Telemetry.getConnectionString()).to.equal('env-only-key');
        } finally {
          if (originalSfDisable === undefined) delete process.env.SF_DISABLE_TELEMETRY;
          else process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
          if (originalSfccDisable === undefined) delete process.env.SFCC_DISABLE_TELEMETRY;
          else process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
          if (originalKey === undefined) delete process.env.SFCC_APP_INSIGHTS_KEY;
          else process.env.SFCC_APP_INSIGHTS_KEY = originalKey;
        }
      });
    });
  });

  describe('telemetry lifecycle', () => {
    let sandbox: SinonSandbox;

    beforeEach(() => {
      sandbox = createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should create Telemetry instance with correct options', () => {
      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'test-key',
        version: '1.0.0',
        dataDir: '/tmp/test-data',
        initialAttributes: {toolsets: 'MRT, CARTRIDGES'},
      });

      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('should support sendEvent for SERVER_STOPPED', () => {
      sandbox.stub(Telemetry.prototype, 'start').resolves();
      const sendEventStub = sandbox.stub(Telemetry.prototype, 'sendEvent');

      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'test-key',
      });

      telemetry.sendEvent('SERVER_STOPPED');

      expect(sendEventStub.calledWith('SERVER_STOPPED')).to.be.true;
    });

    it('should support sendException for errors', () => {
      sandbox.stub(Telemetry.prototype, 'start').resolves();
      const sendExceptionStub = sandbox.stub(Telemetry.prototype, 'sendException');

      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'test-key',
      });

      const error = new Error('Test error');
      telemetry.sendException(error, {context: 'server shutdown'});

      expect(sendExceptionStub.calledOnce).to.be.true;
      const [sentError, attributes] = sendExceptionStub.firstCall.args as [Error, Record<string, unknown>];
      expect(sentError).to.equal(error);
      expect(attributes.context).to.equal('server shutdown');
    });
  });

  describe('loadConfiguration', () => {
    let sandbox: SinonSandbox;
    let command: McpServerCommand;

    beforeEach(() => {
      sandbox = createSandbox();
      command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should combine MRT and instance flags', async () => {
      // Stub init to set up flags
      sandbox.stub(command, 'init').resolves();
      (command as unknown as {flags: Record<string, unknown>}).flags = {
        'api-key': 'test-mrt-key',
        server: 'test-server',
        username: 'test-user',
      };

      // Stub getBaseConfigOptions
      sandbox.stub(command as unknown as Record<string, unknown>, 'getBaseConfigOptions').returns({
        configPath: undefined,
        workingDirectory: process.cwd(),
      });

      // Call loadConfiguration via protected access
      const config = (command as unknown as {loadConfiguration(): unknown}).loadConfiguration();

      // Verify config was loaded (should return a ResolvedB2CConfig object)
      expect(config).to.exist;
      expect(config).to.have.property('values');
    });
  });

  describe('loadServices', () => {
    let sandbox: SinonSandbox;
    let command: McpServerCommand;
    let loadConfigurationStub: SinonStub;
    let fromResolvedConfigStub: SinonStub;

    beforeEach(() => {
      sandbox = createSandbox();
      command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call loadConfiguration and Services.fromResolvedConfig', () => {
      const mockConfig = createMockResolvedConfig();
      const mockServices = new Services({
        resolvedConfig: mockConfig,
      });

      // Stub loadConfiguration to return mock config
      loadConfigurationStub = sandbox
        .stub(command as unknown as Record<string, unknown>, 'loadConfiguration')
        .returns(mockConfig);

      // Stub Services.fromResolvedConfig to return mock services
      fromResolvedConfigStub = sandbox.stub(Services, 'fromResolvedConfig').returns(mockServices);

      // Call loadServices via protected access
      const services = (command as unknown as {loadServices(): Services}).loadServices();

      // Verify loadConfiguration was called
      expect(loadConfigurationStub.calledOnce).to.be.true;

      // Verify Services.fromResolvedConfig was called with the config from loadConfiguration
      expect(fromResolvedConfigStub.calledOnce).to.be.true;
      expect(fromResolvedConfigStub.firstCall.args[0]).to.equal(mockConfig);

      // Verify the returned services instance
      expect(services).to.equal(mockServices);
    });

    it('should return Services instance created from resolved config', () => {
      const mockConfig = createMockResolvedConfig({
        hostname: 'test-server',
        mrtProject: 'test-project',
      });
      const mockServices = new Services({
        resolvedConfig: mockConfig,
      });

      // Stub loadConfiguration
      sandbox.stub(command as unknown as Record<string, unknown>, 'loadConfiguration').returns(mockConfig);

      // Stub Services.fromResolvedConfig to return mock services
      sandbox.stub(Services, 'fromResolvedConfig').returns(mockServices);

      // Call loadServices
      const services = (command as unknown as {loadServices(): Services}).loadServices();

      // Verify the returned services instance
      expect(services).to.equal(mockServices);
      expect(services).to.be.instanceOf(Services);
    });

    it('should reload configuration on each call', () => {
      const mockConfig1 = createMockResolvedConfig({hostname: 'server1'});
      const mockConfig2 = createMockResolvedConfig({hostname: 'server2'});
      const mockServices1 = new Services({resolvedConfig: mockConfig1});
      const mockServices2 = new Services({resolvedConfig: mockConfig2});

      // Stub loadConfiguration to return different configs on each call
      const loadConfigurationStub = sandbox
        .stub(command as unknown as Record<string, unknown>, 'loadConfiguration')
        .onFirstCall()
        .returns(mockConfig1)
        .onSecondCall()
        .returns(mockConfig2);

      // Stub Services.fromResolvedConfig to return different services
      const fromResolvedConfigStub = sandbox
        .stub(Services, 'fromResolvedConfig')
        .onFirstCall()
        .returns(mockServices1)
        .onSecondCall()
        .returns(mockServices2);

      // Call loadServices twice
      const services1 = (command as unknown as {loadServices(): Services}).loadServices();
      const services2 = (command as unknown as {loadServices(): Services}).loadServices();

      // Verify loadConfiguration was called twice
      expect(loadConfigurationStub.calledTwice).to.be.true;

      // Verify Services.fromResolvedConfig was called with correct configs
      expect(fromResolvedConfigStub.calledTwice).to.be.true;
      expect(fromResolvedConfigStub.firstCall.args[0]).to.equal(mockConfig1);
      expect(fromResolvedConfigStub.secondCall.args[0]).to.equal(mockConfig2);

      // Verify different services instances were returned
      expect(services1).to.equal(mockServices1);
      expect(services2).to.equal(mockServices2);
      expect(services1).to.not.equal(services2);
    });
  });

  describe('finally', () => {
    let sandbox: SinonSandbox;
    let command: McpServerCommand;
    let superFinallyStub: SinonStub;

    beforeEach(() => {
      sandbox = createSandbox();
      command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);

      // Stub BaseCommand.finally
      superFinallyStub = sandbox.stub(Object.getPrototypeOf(Object.getPrototypeOf(command)), 'finally').resolves();

      // Create a resolved promise for stdinClosePromise
      (command as unknown as {stdinClosePromise: Promise<void>}).stdinClosePromise = Promise.resolve();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should wait for stdinClosePromise and call super.finally', async () => {
      const finallyPromise = (command as unknown as {finally(err?: Error): Promise<void>}).finally();

      await finallyPromise;

      expect(superFinallyStub.calledOnce).to.be.true;
    });

    it('should exit process when shutdownSignal is SIGINT', async () => {
      const exitStub = sandbox.stub(process, 'exit').throws(new Error('Exit called'));
      (command as unknown as {shutdownSignal: string}).shutdownSignal = 'SIGINT';
      (command as unknown as {stdinClosePromise: Promise<void>}).stdinClosePromise = Promise.resolve();

      try {
        await (command as unknown as {finally(err?: Error): Promise<void>}).finally();
        expect.fail('Should have called process.exit');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Exit called');
      }

      expect(exitStub.calledOnce).to.be.true;
      expect(exitStub.firstCall.args[0]).to.equal(0);
    });

    it('should exit process when shutdownSignal is SIGTERM', async () => {
      const exitStub = sandbox.stub(process, 'exit').throws(new Error('Exit called'));
      (command as unknown as {shutdownSignal: string}).shutdownSignal = 'SIGTERM';
      (command as unknown as {stdinClosePromise: Promise<void>}).stdinClosePromise = Promise.resolve();

      try {
        await (command as unknown as {finally(err?: Error): Promise<void>}).finally();
        expect.fail('Should have called process.exit');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Exit called');
      }

      expect(exitStub.calledOnce).to.be.true;
      expect(exitStub.firstCall.args[0]).to.equal(0);
    });

    it('should not exit process when shutdownSignal is stdin_close', async () => {
      const exitStub = sandbox.stub(process, 'exit');
      (command as unknown as {shutdownSignal: string}).shutdownSignal = 'stdin_close';
      (command as unknown as {stdinClosePromise: Promise<void>}).stdinClosePromise = Promise.resolve();

      await (command as unknown as {finally(err?: Error): Promise<void>}).finally();

      expect(exitStub.called).to.be.false;
      expect(superFinallyStub.calledOnce).to.be.true;
    });
  });

  describe('signal handling', () => {
    let sandbox: SinonSandbox;
    let command: McpServerCommand;
    let sendEventStub: SinonStub;
    let flushStub: SinonStub;
    let stdinOnStub: SinonStub;
    let processOnStub: SinonStub;

    beforeEach(() => {
      sandbox = createSandbox();
      command = new McpServerCommand([], {
        name: 'test',
        version: '1.0.0',
        root: process.cwd(),
        dataDir: '/tmp/test-data',
      } as never);

      // Stub init
      sandbox.stub(command, 'init').resolves();
      (command as unknown as {flags: Record<string, unknown>}).flags = {
        'allow-non-ga-tools': false,
        'log-level': 'silent',
      };

      // Stub resolvedConfig
      sandbox.stub(command as unknown as Record<string, unknown>, 'resolvedConfig').get(() => ({
        values: {},
        hasMrtConfig: () => false,
        hasB2CInstanceConfig: () => false,
        hasOAuth: () => false,
        hasBasicAuth: () => false,
      }));

      // Stub logger
      sandbox.stub(command as unknown as Record<string, unknown>, 'logger').get(() => ({info: sandbox.stub()}));

      // Stub server.connect
      sandbox.stub(B2CDxMcpServer.prototype, 'connect').resolves();

      // Stub telemetry
      const telemetryInstance = new Telemetry({
        project: 'test',
        appInsightsKey: 'test-key',
      });
      sandbox.stub(Telemetry.prototype, 'start').resolves();
      sendEventStub = sandbox.stub(Telemetry.prototype, 'sendEvent');
      flushStub = sandbox.stub(Telemetry.prototype, 'flush').resolves();
      (command as unknown as {telemetry: Telemetry}).telemetry = telemetryInstance;

      // Stub process.stdin.on and process.on to capture handlers
      stdinOnStub = sandbox.stub(process.stdin, 'on').callsFake((event: string, handler: () => void) => {
        if (event === 'close') {
          // Store the handler for testing
          (command as unknown as {_stdinCloseHandler?: () => void})._stdinCloseHandler = handler;
        }
        return process.stdin;
      });

      processOnStub = sandbox.stub(process, 'on').callsFake((event: string | symbol, handler: () => void) => {
        if (event === 'SIGINT') {
          (command as unknown as {_sigintHandler?: () => void})._sigintHandler = handler;
        } else if (event === 'SIGTERM') {
          (command as unknown as {_sigtermHandler?: () => void})._sigtermHandler = handler;
        }
        return process;
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should set up signal handlers when run() is called', async () => {
      // Start the command to set up signal handlers
      const runPromise = command.run();

      // Wait a bit for run() to set up handlers
      await new Promise((resolve) => {
        void setTimeout(resolve, 10);
      });

      // Verify handlers were registered
      expect(stdinOnStub.calledWith('close')).to.be.true;
      expect(processOnStub.calledWith('SIGINT')).to.be.true;
      expect(processOnStub.calledWith('SIGTERM')).to.be.true;

      // Verify stdinClosePromise was created
      const stdinClosePromise = (command as unknown as {stdinClosePromise?: Promise<void>}).stdinClosePromise;
      expect(stdinClosePromise).to.exist;

      // Clean up - resolve the promise manually to prevent hanging
      const sigintHandler = (command as unknown as {_sigintHandler?: () => void})._sigintHandler;
      if (sigintHandler) {
        sigintHandler();
      }

      // Wait for promise to resolve
      if (stdinClosePromise) {
        await stdinClosePromise.catch(() => {
          // Ignore errors
        });
      }

      // Cancel the run promise
      runPromise.catch(() => {
        // Ignore errors
      });
    });

    it('should handle SIGINT signal and send SERVER_STOPPED event', async () => {
      // Start the command to set up signal handlers
      const runPromise = command.run();

      // Wait a bit for handlers to be set up
      await new Promise((resolve) => {
        void setTimeout(resolve, 10);
      });

      // Get the SIGINT handler and call it directly
      const sigintHandler = (command as unknown as {_sigintHandler?: () => void})._sigintHandler;
      expect(sigintHandler).to.exist;

      if (sigintHandler) {
        sigintHandler();
      }

      // Wait a bit for the handler to run
      await new Promise((resolve) => {
        void setTimeout(resolve, 10);
      });

      // Verify SERVER_STOPPED event was sent
      expect(sendEventStub.called).to.be.true;
      const serverStoppedCall = sendEventStub.getCalls().find((call) => call.args[0] === 'SERVER_STOPPED');
      expect(serverStoppedCall).to.exist;
      expect(serverStoppedCall?.args[1]).to.deep.equal({signal: 'SIGINT'});

      // Verify flush was called
      expect(flushStub.called).to.be.true;

      // Clean up - resolve stdinClosePromise
      const stdinClosePromise = (command as unknown as {stdinClosePromise?: Promise<void>}).stdinClosePromise;
      if (stdinClosePromise) {
        await stdinClosePromise.catch(() => {
          // Ignore errors
        });
      }

      runPromise.catch(() => {
        // Ignore errors
      });
    });

    it('should handle SIGTERM signal and send SERVER_STOPPED event', async () => {
      // Start the command to set up signal handlers
      const runPromise = command.run();

      // Wait a bit for handlers to be set up
      await new Promise((resolve) => {
        void setTimeout(resolve, 10);
      });

      // Get the SIGTERM handler and call it directly
      const sigtermHandler = (command as unknown as {_sigtermHandler?: () => void})._sigtermHandler;
      expect(sigtermHandler).to.exist;

      if (sigtermHandler) {
        sigtermHandler();
      }

      // Wait a bit for the handler to run
      await new Promise((resolve) => {
        void setTimeout(resolve, 10);
      });

      // Verify SERVER_STOPPED event was sent
      expect(sendEventStub.called).to.be.true;
      const serverStoppedCall = sendEventStub.getCalls().find((call) => call.args[0] === 'SERVER_STOPPED');
      expect(serverStoppedCall).to.exist;
      expect(serverStoppedCall?.args[1]).to.deep.equal({signal: 'SIGTERM'});

      // Verify flush was called
      expect(flushStub.called).to.be.true;

      // Clean up
      const stdinClosePromise = (command as unknown as {stdinClosePromise?: Promise<void>}).stdinClosePromise;
      if (stdinClosePromise) {
        await stdinClosePromise.catch(() => {
          // Ignore errors
        });
      }

      runPromise.catch(() => {
        // Ignore errors
      });
    });
  });
});
