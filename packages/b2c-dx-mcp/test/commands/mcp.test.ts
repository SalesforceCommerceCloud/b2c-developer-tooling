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

    it('should define working-directory flag with env var support', () => {
      const flag = McpServerCommand.flags['working-directory'];
      expect(flag).to.not.be.undefined;
      expect(flag.env).to.equal('SFCC_WORKING_DIRECTORY');
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
});
