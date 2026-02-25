/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import path from 'node:path';
import {createCartridgesTools} from '../../../src/tools/cartridges/index.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {ToolResult} from '../../../src/utils/types.js';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {DeployResult, DeployOptions, CodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
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
function createMockB2CInstance(options?: {codeVersion?: string}): B2CInstance {
  // If codeVersion is explicitly provided (including undefined), use it; otherwise default to 'v1'
  const codeVersion = options && 'codeVersion' in options ? options.codeVersion : 'v1';
  return {
    config: {
      codeVersion,
    },
    webdav: {} as unknown as WebDavClient,
    ocapi: {} as unknown as OcapiClient,
  } as B2CInstance;
}

/**
 * Create a mock services instance for testing.
 */
function createMockServices(options?: {b2cInstance?: B2CInstance; projectDirectory?: string}): Services {
  return new Services({
    b2cInstance: options?.b2cInstance,
    resolvedConfig: createMockResolvedConfig({
      projectDirectory: options?.projectDirectory,
    }),
  });
}

/**
 * Create a loadServices function for testing.
 */
function createMockLoadServicesWrapper(options?: {
  b2cInstance?: B2CInstance;
  projectDirectory?: string;
}): () => Services {
  const services = createMockServices(options);
  return () => services;
}

describe('tools/cartridges', () => {
  let sandbox: sinon.SinonSandbox;
  let findAndDeployCartridgesStub: sinon.SinonStub;
  let getActiveCodeVersionStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    findAndDeployCartridgesStub = sandbox.stub();
    getActiveCodeVersionStub = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createCartridgesTools', () => {
    it('should create cartridge_deploy tool', () => {
      const loadServices = createMockLoadServicesWrapper();
      const tools = createCartridgesTools(loadServices);

      expect(tools).to.have.lengthOf(1);
      expect(tools[0].name).to.equal('cartridge_deploy');
    });
  });

  describe('cartridge_deploy tool metadata', () => {
    let loadServices: () => Services;
    let tool: ReturnType<typeof createCartridgesTools>[0];

    beforeEach(() => {
      const mockInstance = createMockB2CInstance();
      loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      tool = createCartridgesTools(loadServices)[0];
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
      const projectDir = '/path/to/project';

      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app_storefront_base', dest: 'app_storefront_base'}],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance, projectDirectory: projectDir});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
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
      expect(dir).to.equal(projectDir);
      expect(options.include).to.be.undefined;
      expect(options.exclude).to.be.undefined;
      expect(options.reload).to.be.undefined;
      const jsonResult = getResultJson<DeployResult>(result);
      expect(jsonResult.codeVersion).to.equal('v1');
      expect(jsonResult.cartridges).to.have.lengthOf(1);
    });

    it('should call findAndDeployCartridges with custom directory', async () => {
      const projectDir = '/path/to/project';
      const directory = './cartridges';
      const expectedResolvedPath = path.resolve(projectDir, directory);

      const mockResult: DeployResult = {
        cartridges: [{name: 'my_cartridge', src: '/path/to/my_cartridge', dest: 'my_cartridge'}],
        codeVersion: 'v2',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance, projectDirectory: projectDir});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      const result = await tool.handler({directory});

      expect(result.isError).to.be.undefined;
      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [, dir] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      expect(dir).to.equal(expectedResolvedPath);
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
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
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
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
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
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      await tool.handler({reload: true});

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const args = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      const options = args[2];
      expect(options.reload).to.be.true;
    });

    it('should pass all options together', async () => {
      const projectDir = '/path/to/project';
      const directory = './cartridges';
      const expectedResolvedPath = path.resolve(projectDir, directory);
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
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance, projectDirectory: projectDir});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      await tool.handler({
        directory,
        cartridges,
        exclude,
        reload,
      });

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [, dir, options] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      expect(dir).to.equal(expectedResolvedPath);
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
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
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

    it('should resolve relative directory paths relative to project directory', async () => {
      const projectDir = '/path/to/project';
      const relativePaths = ['./cartridges', 'cartridges', '../cartridges', './src/cartridges'];

      for (const relativePath of relativePaths) {
        findAndDeployCartridgesStub.resetHistory();
        const expectedResolvedPath = path.resolve(projectDir, relativePath);

        const mockResult: DeployResult = {
          cartridges: [{name: 'test_cartridge', src: '/path/to/test', dest: 'test_cartridge'}],
          codeVersion: 'v1',
          reloaded: false,
        };
        findAndDeployCartridgesStub.resolves(mockResult);

        const mockInstance = createMockB2CInstance();
        const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance, projectDirectory: projectDir});
        const tool = createCartridgesTools(loadServices, {
          findAndDeployCartridges: findAndDeployCartridgesStub,
          getActiveCodeVersion: getActiveCodeVersionStub,
        })[0];

        // eslint-disable-next-line no-await-in-loop
        await tool.handler({directory: relativePath});

        expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
        const [, dir] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
        expect(dir).to.equal(expectedResolvedPath);
      }
    });

    it('should use absolute directory paths as-is', async () => {
      const projectDir = '/path/to/project';
      const absolutePaths =
        process.platform === 'win32'
          ? [String.raw`C:\cartridges`, String.raw`D:\projects\cartridges`]
          : ['/absolute/cartridges', '/usr/local/cartridges'];

      for (const absolutePath of absolutePaths) {
        findAndDeployCartridgesStub.resetHistory();

        const mockResult: DeployResult = {
          cartridges: [{name: 'test_cartridge', src: '/path/to/test', dest: 'test_cartridge'}],
          codeVersion: 'v1',
          reloaded: false,
        };
        findAndDeployCartridgesStub.resolves(mockResult);

        const mockInstance = createMockB2CInstance();
        const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance, projectDirectory: projectDir});
        const tool = createCartridgesTools(loadServices, {
          findAndDeployCartridges: findAndDeployCartridgesStub,
          getActiveCodeVersion: getActiveCodeVersionStub,
        })[0];

        // eslint-disable-next-line no-await-in-loop
        await tool.handler({directory: absolutePath});

        expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
        const [, dir] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
        expect(dir).to.equal(absolutePath);
      }
    });

    it('should use project directory when directory is not provided', async () => {
      const projectDir = '/path/to/project';

      const mockResult: DeployResult = {
        cartridges: [{name: 'test_cartridge', src: '/path/to/test', dest: 'test_cartridge'}],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance, projectDirectory: projectDir});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      await tool.handler({});

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [, dir] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      expect(dir).to.equal(projectDir);
    });

    it('should use process.cwd() when projectDirectory is not configured', async () => {
      const directory = './cartridges';
      const expectedResolvedPath = path.resolve(process.cwd(), directory);

      const mockResult: DeployResult = {
        cartridges: [{name: 'test_cartridge', src: '/path/to/test', dest: 'test_cartridge'}],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance();
      const loadServices = createMockLoadServicesWrapper({
        b2cInstance: mockInstance,
        // No projectDirectory provided - should fall back to process.cwd()
      });
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      await tool.handler({directory});

      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const [, dir] = findAndDeployCartridgesStub.firstCall.args as [B2CInstance, string, DeployOptions];
      expect(dir).to.equal(expectedResolvedPath);
    });
  });

  describe('cartridge_deploy codeVersion resolution', () => {
    it('should use active code version when codeVersion is not specified', async () => {
      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app', dest: 'app_storefront_base'}],
        codeVersion: 'v2',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const activeCodeVersion: CodeVersion = {id: 'v2', active: true} as CodeVersion;
      getActiveCodeVersionStub.resolves(activeCodeVersion);

      const mockInstance = createMockB2CInstance({codeVersion: undefined});
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      expect(getActiveCodeVersionStub.calledOnce).to.be.true;
      expect(getActiveCodeVersionStub.calledWith(mockInstance)).to.be.true;
      expect(mockInstance.config.codeVersion).to.equal('v2');
      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
      const jsonResult = getResultJson<DeployResult>(result);
      expect(jsonResult.codeVersion).to.equal('v2');
    });

    it('should use existing codeVersion when already specified', async () => {
      const mockResult: DeployResult = {
        cartridges: [{name: 'app_storefront_base', src: '/path/to/app', dest: 'app_storefront_base'}],
        codeVersion: 'v1',
        reloaded: false,
      };
      findAndDeployCartridgesStub.resolves(mockResult);

      const mockInstance = createMockB2CInstance({codeVersion: 'v1'});
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      expect(getActiveCodeVersionStub.called).to.be.false;
      expect(mockInstance.config.codeVersion).to.equal('v1');
      expect(findAndDeployCartridgesStub.calledOnce).to.be.true;
    });

    it('should throw error when no codeVersion and no active version found', async () => {
      getActiveCodeVersionStub.resolves(undefined);

      const mockInstance = createMockB2CInstance({codeVersion: undefined});
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      expect(getActiveCodeVersionStub.calledOnce).to.be.true;
      expect(findAndDeployCartridgesStub.called).to.be.false;
      const text = getResultText(result);
      expect(text).to.include('No code version specified and no active code version found');
      expect(text).to.include('--code-version flag');
      expect(text).to.include('SFCC_CODE_VERSION environment variable');
      expect(text).to.include('dw.json configuration file');
    });

    it('should throw error when no codeVersion and active version has no id', async () => {
      const activeCodeVersion = {active: true} as CodeVersion; // Missing id
      getActiveCodeVersionStub.resolves(activeCodeVersion);

      const mockInstance = createMockB2CInstance({codeVersion: undefined});
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      expect(getActiveCodeVersionStub.calledOnce).to.be.true;
      expect(findAndDeployCartridgesStub.called).to.be.false;
      const text = getResultText(result);
      expect(text).to.include('No code version specified and no active code version found');
      expect(text).to.include('--code-version flag');
      expect(text).to.include('SFCC_CODE_VERSION environment variable');
      expect(text).to.include('dw.json configuration file');
    });
  });

  describe('cartridge_deploy error handling', () => {
    it('should return error when instance is not configured', async () => {
      const loadServices = createMockLoadServicesWrapper({
        // No instance configured
      });
      const tool = createCartridgesTools(loadServices)[0];

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
      const loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      const tool = createCartridgesTools(loadServices, {
        findAndDeployCartridges: findAndDeployCartridgesStub,
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Execution error');
      expect(text).to.include('No cartridges found');
    });
  });

  describe('cartridge_deploy input validation', () => {
    let loadServices: () => Services;
    let tool: ReturnType<typeof createCartridgesTools>[0];

    beforeEach(() => {
      const mockInstance = createMockB2CInstance();
      loadServices = createMockLoadServicesWrapper({b2cInstance: mockInstance});
      tool = createCartridgesTools(loadServices, {
        getActiveCodeVersion: getActiveCodeVersionStub,
      })[0];
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
