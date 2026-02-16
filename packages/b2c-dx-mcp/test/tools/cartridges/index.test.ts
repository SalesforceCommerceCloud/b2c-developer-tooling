/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {createCartridgesTools} from '../../../src/tools/cartridges/index.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {ToolResult} from '../../../src/utils/types.js';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {DeployResult, DeployOptions} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {WebDavClient, OcapiClient} from '@salesforce/b2c-tooling-sdk/clients';

/**
 * Helper to extract text from a ToolResult.
 * Throws if the first content item is not a text type.
 */
function getResultText(result: ToolResult): string {
  const content = result.content[0];
  if (content.type !== 'text') {
    throw new Error(`Expected text content, got ${content.type}`);
  }
  return content.text;
}

/**
 * Helper to parse JSON from a ToolResult.
 */
function getResultJson<T>(result: ToolResult): T {
  const text = getResultText(result);
  return JSON.parse(text) as T;
}

/**
 * Create a mock B2CInstance for testing.
 */
function createMockB2CInstance(): B2CInstance {
  return {
    config: {
      codeVersion: 'v1',
    },
    webdav: {} as unknown as WebDavClient,
    ocapi: {} as unknown as OcapiClient,
  } as B2CInstance;
}

/**
 * Create a mock services instance for testing.
 */
function createMockServices(options?: {b2cInstance?: B2CInstance}): Services {
  return new Services({
    b2cInstance: options?.b2cInstance,
    resolvedConfig: createMockResolvedConfig(),
  });
}

describe('tools/cartridges', () => {
  let sandbox: sinon.SinonSandbox;
  let findAndDeployCartridgesStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    findAndDeployCartridgesStub = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createCartridgesTools', () => {
    it('should create cartridge_deploy tool', () => {
      const services = createMockServices();
      const tools = createCartridgesTools(services);

      expect(tools).to.have.lengthOf(1);
      expect(tools[0].name).to.equal('cartridge_deploy');
    });
  });

  describe('cartridge_deploy tool metadata', () => {
    let services: Services;
    let tool: ReturnType<typeof createCartridgesTools>[0];

    beforeEach(() => {
      const mockInstance = createMockB2CInstance();
      services = createMockServices({b2cInstance: mockInstance});
      tool = createCartridgesTools(services)[0];
    });

    it('should have correct tool name', () => {
      expect(tool.name).to.equal('cartridge_deploy');
    });

    it('should have correct description', () => {
      const desc = tool.description;
      expect(desc).to.include('Finds and deploys cartridges');
      expect(desc).to.include('B2C Commerce');
      expect(desc).to.include('WebDAV');
    });

    it('should be in CARTRIDGES toolset', () => {
      expect(tool.toolsets).to.include('CARTRIDGES');
      expect(tool.toolsets).to.have.lengthOf(1);
    });

    it('should not be GA (generally available)', () => {
      expect(tool.isGA).to.be.false;
    });

    it('should require instance', () => {
      // This is tested implicitly through the adapter, but we verify the tool exists
      expect(tool.name).to.equal('cartridge_deploy');
    });
  });

  describe('cartridge_deploy execution', () => {
    it('should call findAndDeployCartridges with instance and default directory', async () => {
      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app_storefront_base', dest: 'app_storefront_base'}],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [instance, dir, options] = findAndDeployCartridgesStub.firstCall.args as [
        B2CInstance,
        string,
        DeployOptions,
      ];
      expect(instance).to.equal(mockInstance);
      expect(dir).to.equal(services.getWorkingDirectory());
      expect(options.include).to.be.undefined;
      expect(options.exclude).to.be.undefined;
      expect(options.reload).to.be.undefined;
      const jsonResult = getResultJson<DeployResult>(result);
      expect(jsonResult.codeVersion).to.equal('v1');
      expect(jsonResult.cartridges).to.have.lengthOf(1);
    });

    it('should call findAndDeployCartridges with custom directory', async () => {
      const directory = './cartridges';

      const mockResult: DeployResult = {
        cartridges: [{name: 'my_cartridge', src: '/path/to/my_cartridge', dest: 'my_cartridge'}],
        codeVersion: 'v2',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      const result = await tool.handler({directory});

      expect(result.isError).to.be.undefined;
      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [, dir] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      expect(dir).to.equal(directory);
      const jsonResult = getResultJson<DeployResult>(result);
      expect(jsonResult.codeVersion).to.equal('v2');
    });

    it('should pass cartridges array as include option', async () => {
      const cartridges = ['app_storefront_base', 'app_core'];

      const mockResult: DeployResult = {
        cartridges: [
          {name: 'app_storefront_base', src: '/path/to/app_storefront_base', dest: 'app_storefront_base'},
          {name: 'app_core', src: '/path/to/app_core', dest: 'app_core'},
        ],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      await tool.handler({cartridges});

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const args = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      const options = args[2];
      expect(options.include).to.deep.equal(cartridges);
    });

    it('should pass exclude array as exclude option', async () => {
      const exclude = ['test_cartridge', 'dev_cartridge'];

      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app', dest: 'app_storefront_base'}],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      await tool.handler({exclude});

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const args = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      const options = args[2];
      expect(options.exclude).to.deep.equal(exclude);
    });

    it('should pass reload option', async () => {
      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app', dest: 'app_storefront_base'}],
        codeVersion: 'v1',
        reloaded: true,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      await tool.handler({reload: true});

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const args = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      const options = args[2];
      expect(options.reload).to.be.true;
    });

    it('should pass all options together', async () => {
      const directory = './cartridges';
      const cartridges = ['app_storefront_base'];
      const exclude = ['test_cartridge'];
      const reload = true;

      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app', dest: 'app_storefront_base'}],
        codeVersion: 'v1',
        reloaded: true,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      await tool.handler({
        directory,
        cartridges,
        exclude,
        reload,
      });

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [, dir, options] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      expect(dir).to.equal(directory);
      expect(options.include).to.deep.equal(cartridges);
      expect(options.exclude).to.deep.equal(exclude);
      expect(options.reload).to.equal(reload);
    });

    it('should return DeployResult as JSON', async () => {
      const mockResult: DeployResult = {
        cartridges: [
          {name: 'app_storefront_base', src: '/path/to/app', dest: 'app_storefront_base'},
          {name: 'app_core', src: '/path/to/core', dest: 'app_core'},
        ],
        codeVersion: 'v1.2.3',
        reloaded: true,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      const jsonResult = getResultJson<DeployResult>(result);
      expect(jsonResult.codeVersion).to.equal('v1.2.3');
      expect(jsonResult.cartridges).to.have.lengthOf(2);
      expect(jsonResult.reloaded).to.be.true;
      expect(jsonResult.cartridges[0].name).to.equal('app_storefront_base');
      expect(jsonResult.cartridges[1].name).to.equal('app_core');
    });
  });

  describe('cartridge_deploy error handling', () => {
    it('should return error when instance is not configured', async () => {
      const services = createMockServices({
        // No instance configured
      });
      const tool = createCartridgesTools(services)[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('B2C instance error');
      expect(text).to.include('Instance configuration required');
      expect(findAndDeployCartridgesStub.called).to.be.false;
    });

    it('should return error when findAndDeployCartridges throws', async () => {
      const error = new Error('Failed to deploy cartridges: No cartridges found');
      findAndDeployCartridgesStub.rejects(error);

      const mockInstance = createMockB2CInstance();
      const services = createMockServices({b2cInstance: mockInstance});
      const tool = createCartridgesTools(services, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Execution error');
      expect(text).to.include('No cartridges found');
    });
  });

  describe('cartridge_deploy input validation', () => {
    let services: Services;
    let tool: ReturnType<typeof createCartridgesTools>[0];

    beforeEach(() => {
      const mockInstance = createMockB2CInstance();
      services = createMockServices({b2cInstance: mockInstance});
      tool = createCartridgesTools(services)[0];
    });

    it('should validate input schema', async () => {
      // Test that invalid input is rejected by the adapter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({directory: 123} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
      expect(findAndDeployCartridgesStub.called).to.be.false;
    });
  });
});
