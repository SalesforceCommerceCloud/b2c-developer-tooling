/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {createMrtTools} from '../../../src/tools/mrt/index.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {ToolResult} from '../../../src/utils/types.js';
import type {AuthStrategy, FetchInit} from '@salesforce/b2c-tooling-sdk/auth';
import type {PushResult, PushOptions} from '@salesforce/b2c-tooling-sdk/operations/mrt';

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
 * Mock auth strategy for testing.
 * Simply passes through fetch requests with an Authorization header.
 */
class MockAuthStrategy implements AuthStrategy {
  constructor(private token: string = 'test-token') {}

  async fetch(url: string, init?: FetchInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.token}`);

    // Omit dispatcher to avoid type conflict between FetchInit and RequestInit
    const {dispatcher: _dispatcher, ...restInit} = init || {};
    return fetch(url, {
      ...restInit,
      headers,
    });
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Bearer ${this.token}`;
  }
}

/**
 * Create a mock services instance for testing.
 */
function createMockServices(options?: {
  mrtAuth?: AuthStrategy;
  mrtProject?: string;
  mrtEnvironment?: string;
  mrtOrigin?: string;
}): Services {
  return new Services({
    mrtConfig: {
      auth: options?.mrtAuth,
      project: options?.mrtProject,
      environment: options?.mrtEnvironment,
      origin: options?.mrtOrigin,
    },
    resolvedConfig: createMockResolvedConfig(),
  });
}

/**
 * Create a loadServices function for testing.
 */
function createMockLoadServicesWrapper(options?: {
  mrtAuth?: AuthStrategy;
  mrtProject?: string;
  mrtEnvironment?: string;
  mrtOrigin?: string;
}): () => Services {
  const services = createMockServices(options);
  return () => services;
}

describe('tools/mrt', () => {
  let sandbox: sinon.SinonSandbox;
  let pushBundleStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    pushBundleStub = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createMrtTools', () => {
    it('should create mrt_bundle_push tool', () => {
      const loadServices = createMockLoadServicesWrapper();
      const tools = createMrtTools(loadServices);

      expect(tools).to.have.lengthOf(1);
      expect(tools[0].name).to.equal('mrt_bundle_push');
    });
  });

  describe('mrt_bundle_push tool metadata', () => {
    let loadServices: () => Services;
    let tool: ReturnType<typeof createMrtTools>[0];

    beforeEach(() => {
      loadServices = createMockLoadServicesWrapper({mrtAuth: new MockAuthStrategy(), mrtProject: 'test-project'});
      tool = createMrtTools(loadServices)[0];
    });

    it('should have correct tool name', () => {
      expect(tool.name).to.equal('mrt_bundle_push');
    });

    it('should have correct description', () => {
      const desc = tool.description;
      expect(desc).to.include('Bundle');
      expect(desc).to.include('push');
      expect(desc).to.include('Managed Runtime');
    });

    it('should be in MRT, PWAV3, and STOREFRONTNEXT toolsets', () => {
      expect(tool.toolsets).to.include('MRT');
      expect(tool.toolsets).to.include('PWAV3');
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
      expect(tool.toolsets).to.have.lengthOf(3);
    });

    it('should not be GA (generally available)', () => {
      expect(tool.isGA).to.be.false;
    });
  });

  describe('mrt_bundle_push execution', () => {
    it('should call pushBundle with project from mrtConfig', async () => {
      const buildDir = './build';

      const mockResult: PushResult = {
        bundleId: 123,
        projectSlug: 'my-project',
        deployed: false,
        message: 'Test bundle',
      };
      pushBundleStub.resolves(mockResult);

      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        mrtProject: 'my-project',
      });
      const tool = createMrtTools(loadServices, {pushBundle: pushBundleStub})[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({buildDirectory: buildDir}, {} as any);

      expect(result.isError).to.be.undefined;
      expect(pushBundleStub.calledOnce).to.be.true;
      const [options] = pushBundleStub.firstCall.args as [PushOptions];
      expect(options.projectSlug).to.equal('my-project');
      expect(options.buildDirectory).to.equal(buildDir);
      const jsonResult = getResultJson<PushResult>(result);
      expect(jsonResult.projectSlug).to.equal('my-project');
      expect(jsonResult.bundleId).to.equal(123);
    });

    it('should call pushBundle with environment as target when configured', async () => {
      const buildDir = './build';

      const mockResult: PushResult = {
        bundleId: 456,
        projectSlug: 'my-project',
        target: 'staging',
        deployed: true,
        message: 'Bundle created and deployed',
      };
      pushBundleStub.resolves(mockResult);

      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        mrtProject: 'my-project',
        mrtEnvironment: 'staging',
      });
      const tool = createMrtTools(loadServices, {pushBundle: pushBundleStub})[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({buildDirectory: buildDir}, {} as any);

      expect(result.isError).to.be.undefined;
      expect(pushBundleStub.calledOnce).to.be.true;
      const [options] = pushBundleStub.firstCall.args as [PushOptions];
      expect(options.projectSlug).to.equal('my-project');
      expect(options.target).to.equal('staging');
      const jsonResult = getResultJson<PushResult>(result);
      expect(jsonResult.deployed).to.be.true;
      expect(jsonResult.target).to.equal('staging');
    });

    it('should call pushBundle with custom origin when configured', async () => {
      const buildDir = './build';

      const customOrigin = 'https://custom-cloud.mobify.com';
      const mockResult: PushResult = {
        bundleId: 789,
        projectSlug: 'my-project',
        deployed: false,
        message: 'Test bundle',
      };
      pushBundleStub.resolves(mockResult);

      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        mrtProject: 'my-project',
        mrtOrigin: customOrigin,
      });
      const tool = createMrtTools(loadServices, {pushBundle: pushBundleStub})[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({buildDirectory: buildDir}, {} as any);

      expect(result.isError).to.be.undefined;
      expect(pushBundleStub.calledOnce).to.be.true;
      const [options] = pushBundleStub.firstCall.args as [PushOptions];
      expect(options.projectSlug).to.equal('my-project');
      expect(options.origin).to.equal(customOrigin);
      const jsonResult = getResultJson<PushResult>(result);
      expect(jsonResult.bundleId).to.equal(789);
    });

    it('should pass message parameter to pushBundle', async () => {
      const buildDir = './build';

      const mockResult: PushResult = {
        bundleId: 123,
        projectSlug: 'my-project',
        deployed: false,
        message: 'Custom deployment message',
      };
      pushBundleStub.resolves(mockResult);

      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        mrtProject: 'my-project',
      });
      const tool = createMrtTools(loadServices, {pushBundle: pushBundleStub})[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tool.handler({buildDirectory: buildDir, message: 'Custom deployment message'}, {} as any);

      expect(pushBundleStub.calledOnce).to.be.true;
      const [options] = pushBundleStub.firstCall.args as [PushOptions];
      expect(options.message).to.equal('Custom deployment message');
    });

    it('should return PushResult as JSON', async () => {
      const buildDir = './build';

      const mockResult: PushResult = {
        bundleId: 12_345,
        projectSlug: 'my-project',
        deployed: false,
        message: 'Release v1.0.0',
      };
      pushBundleStub.resolves(mockResult);

      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        mrtProject: 'my-project',
      });
      const tool = createMrtTools(loadServices, {pushBundle: pushBundleStub})[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({buildDirectory: buildDir, message: 'Release v1.0.0'}, {} as any);

      expect(result.isError).to.be.undefined;
      const jsonResult = getResultJson<PushResult>(result);
      expect(jsonResult.bundleId).to.equal(12_345);
      expect(jsonResult.projectSlug).to.equal('my-project');
      expect(jsonResult.deployed).to.be.false;
      expect(jsonResult.message).to.equal('Release v1.0.0');
    });
  });

  describe('mrt_bundle_push error handling', () => {
    it('should return error when project is not configured', async () => {
      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        // No project configured
      });
      const tool = createMrtTools(loadServices)[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({}, {} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('MRT project error');
      expect(text).to.include('Project is required');
      expect(pushBundleStub.called).to.be.false;
    });

    it('should return error when requiresMrtAuth is true but no auth configured', async () => {
      const loadServices = createMockLoadServicesWrapper({
        // No auth configured
        mrtProject: 'my-project',
      });
      const tool = createMrtTools(loadServices)[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({}, {} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('MRT auth error');
      expect(text).to.include('MRT API key required');
      expect(pushBundleStub.called).to.be.false;
    });

    it('should return error when pushBundle throws', async () => {
      const buildDir = './build';

      const error = new Error('Failed to push bundle: Network error');
      pushBundleStub.rejects(error);

      const loadServices = createMockLoadServicesWrapper({
        mrtAuth: new MockAuthStrategy(),
        mrtProject: 'my-project',
      });
      const tool = createMrtTools(loadServices, {pushBundle: pushBundleStub})[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({buildDirectory: buildDir}, {} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Execution error');
      expect(text).to.include('Network error');
    });
  });

  describe('mrt_bundle_push input validation', () => {
    let loadServices: () => Services;
    let tool: ReturnType<typeof createMrtTools>[0];

    beforeEach(() => {
      loadServices = createMockLoadServicesWrapper({mrtAuth: new MockAuthStrategy(), mrtProject: 'my-project'});
      tool = createMrtTools(loadServices)[0];
    });

    it('should validate input schema', async () => {
      // Test that invalid input is rejected by the adapter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({buildDirectory: 123} as any, {} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
      expect(pushBundleStub.called).to.be.false;
    });
  });
});
