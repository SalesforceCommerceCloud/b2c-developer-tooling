/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {stub, restore, type SinonStub} from 'sinon';
import {createScapiCustomApisStatusTool} from '../../../src/tools/scapi/scapi-custom-apis-status.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {CustomApisClient, CustomApisComponents} from '@salesforce/b2c-tooling-sdk/clients';

type CustomApiEndpoint = CustomApisComponents['schemas']['CustomApiEndpoint'];

function parseResultContent(result: {content: Array<{type: string; text?: string}>; isError?: boolean}): {
  parsed: null | Record<string, unknown>;
  isError: boolean;
  raw?: string;
} {
  const first = result.content?.[0];
  const text = first && 'text' in first ? (first.text ?? '') : '';
  try {
    return {parsed: JSON.parse(text) as Record<string, unknown>, isError: result.isError ?? false};
  } catch {
    return {parsed: null, isError: result.isError ?? false, raw: text};
  }
}

/**
 * Creates mock endpoint data (simulating SDK response).
 * Focus tests on MCP-specific logic, not SDK internals.
 */
function createMockEndpoints(overrides: Partial<CustomApiEndpoint>[] = []): CustomApiEndpoint[] {
  const defaultEndpoint: CustomApiEndpoint = {
    apiName: 'my-api',
    apiVersion: 'v1',
    cartridgeName: 'app_custom',
    endpointPath: '/hello',
    httpMethod: 'GET',
    status: 'active',
    siteId: 'RefArch',
    securityScheme: 'ShopperToken',
    id: 'ep-1',
  };

  if (overrides.length === 0) {
    return [defaultEndpoint];
  }

  return overrides.map((override) => ({...defaultEndpoint, ...override}));
}

/**
 * Creates a mock SDK client response.
 */
function createMockClientResponse(endpoints: CustomApiEndpoint[], activeCodeVersion?: string) {
  return {
    data: {
      data: endpoints,
      activeCodeVersion,
    },
    error: undefined,
    response: {status: 200, statusText: 'OK'},
  };
}

describe('tools/scapi/scapi-custom-apis-status', () => {
  let services: Services;
  let mockGet: SinonStub;

  beforeEach(() => {
    services = new Services({
      resolvedConfig: createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      }),
    });

    // Mock SDK client - focus tests on MCP-specific logic, not SDK internals
    mockGet = stub();
    const mockClient = {
      GET: mockGet,
    } as unknown as CustomApisClient;

    stub(services, 'getCustomApisClient').returns(mockClient);
    stub(services, 'getOrganizationId').returns('f_ecom_test_tenant');
  });

  afterEach(() => {
    restore();
  });

  describe('createScapiCustomApisStatusTool', () => {
    it('should create scapi_custom_apis_status tool with correct metadata', () => {
      const tool = createScapiCustomApisStatusTool(services);

      expect(tool).to.exist;
      expect(tool.name).to.equal('scapi_custom_apis_status');
      expect(tool.description).to.include('Custom');
      expect(tool.description).to.include('endpoint');
      expect(tool.description).to.include('Custom');
      expect(tool.description).to.include('b2c scapi custom status');
      expect(tool.inputSchema).to.exist;
      expect(tool.handler).to.be.a('function');
      expect(tool.toolsets).to.deep.equal(['PWAV3', 'SCAPI', 'STOREFRONTNEXT']);
      expect(tool.isGA).to.be.false;
    });

    it('should have optional input params: status, groupBy, columns', () => {
      const tool = createScapiCustomApisStatusTool(services);

      expect(tool.inputSchema).to.have.property('status');
      expect(tool.inputSchema).to.have.property('groupBy');
      expect(tool.inputSchema).to.have.property('columns');
      expect(tool.inputSchema).to.not.have.property('extended');
    });
  });

  describe('handler', () => {
    it('should return endpoints with default columns and add type field', async () => {
      const mockEndpoints = createMockEndpoints();
      mockGet.resolves(createMockClientResponse(mockEndpoints, 'version1'));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      const {parsed} = parseResultContent(result);
      expect(parsed).to.not.be.null;
      expect(parsed?.endpoints).to.be.an('array').with.lengthOf(1);
      expect(parsed?.total).to.equal(1);
      expect(parsed?.activeCodeVersion).to.equal('version1');
      expect(parsed?.message).to.include('1 endpoint');
      expect(parsed?.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T/);

      // Verify MCP-specific logic: default columns include cartridgeName and type is added
      const endpoint = (parsed?.endpoints as Record<string, unknown>[])?.[0];
      expect(endpoint?.type).to.equal('Shopper');
      expect(endpoint?.apiName).to.equal('my-api');
      expect(endpoint?.cartridgeName).to.equal('app_custom');
      expect(endpoint?.endpointPath).to.equal('/hello');
      expect(endpoint?.httpMethod).to.equal('GET');
      expect(endpoint?.status).to.equal('active');
      expect(endpoint?.siteId).to.equal('RefArch');
    });

    it('should pass status filter to SDK when provided', async () => {
      mockGet.resolves(createMockClientResponse([]));

      const tool = createScapiCustomApisStatusTool(services);
      await tool.handler({status: 'active'});

      expect(mockGet.calledOnce).to.be.true;
      expect(mockGet.firstCall.args[1]?.params?.query).to.deep.equal({status: 'active'});
    });

    it('should add type field based on securityScheme (MCP-specific transformation)', async () => {
      const mockEndpoints = createMockEndpoints([
        {apiName: 'admin-api', securityScheme: 'AmOAuth2'},
        {apiName: 'shopper-api', securityScheme: 'ShopperToken'},
      ]);
      mockGet.resolves(createMockClientResponse(mockEndpoints));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      const endpoints = parsed?.endpoints as Array<{type?: string; apiName?: string}>;
      expect(endpoints).to.have.lengthOf(2);
      const adminEp = endpoints.find((e) => e.apiName === 'admin-api');
      const shopperEp = endpoints.find((e) => e.apiName === 'shopper-api');
      expect(adminEp?.type).to.equal('Admin');
      expect(shopperEp?.type).to.equal('Shopper');
    });

    it('should return empty endpoints and message when no data returned', async () => {
      mockGet.resolves(createMockClientResponse([], 'v1'));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.endpoints).to.be.an('array').that.is.empty;
      expect(parsed?.total).to.equal(0);
      expect(parsed?.message).to.include('No Custom API endpoints found');
    });

    it('should handle SDK errors and return remoteError (MCP error handling)', async () => {
      mockGet.resolves({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid filter'},
        response: {status: 400, statusText: 'Bad Request'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.total).to.equal(0);
      expect(parsed?.remoteError).to.exist;
      expect(parsed?.message).to.include('Failed to fetch Custom API endpoints');
    });

    it('should handle SDK exceptions and return remoteError', async () => {
      mockGet.rejects(new Error('Network error'));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.total).to.equal(0);
      expect(parsed?.remoteError).to.include('Network error');
    });

    it('should group endpoints by type (MCP-specific grouping)', async () => {
      const mockEndpoints = createMockEndpoints([
        {apiName: 'a', securityScheme: 'AmOAuth2'},
        {apiName: 'b', securityScheme: 'ShopperToken'},
      ]);
      mockGet.resolves(createMockClientResponse(mockEndpoints));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({groupBy: 'type'});
      const {parsed} = parseResultContent(result);

      expect(parsed?.groups).to.exist;
      expect(parsed?.endpoints).to.be.undefined;
      const groups = parsed?.groups as Record<string, unknown[]> | undefined;
      expect(groups?.Admin).to.be.an('array').with.lengthOf(1);
      expect(groups?.Shopper).to.be.an('array').with.lengthOf(1);
      expect(parsed?.total).to.equal(2);
    });

    it('should group endpoints by site (MCP-specific grouping)', async () => {
      const mockEndpoints = createMockEndpoints([
        {apiName: 'a', siteId: 'Site1'},
        {apiName: 'b', siteId: 'Site2'},
      ]);
      mockGet.resolves(createMockClientResponse(mockEndpoints));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({groupBy: 'site'});
      const {parsed} = parseResultContent(result);

      expect(parsed?.groups).to.exist;
      const groupsBySite = parsed?.groups as Record<string, unknown[]> | undefined;
      expect(groupsBySite?.Site1).to.be.an('array').with.lengthOf(1);
      expect(groupsBySite?.Site2).to.be.an('array').with.lengthOf(1);
      expect(parsed?.total).to.equal(2);
    });

    it('should filter columns when custom columns specified (MCP column selection)', async () => {
      const mockEndpoints = createMockEndpoints();
      mockGet.resolves(createMockClientResponse(mockEndpoints));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({columns: 'type,apiName,status'});
      const {parsed} = parseResultContent(result);

      const endpoint = (parsed?.endpoints as Record<string, unknown>[])?.[0];
      expect(endpoint).to.have.keys('type', 'apiName', 'status');
      expect(endpoint?.apiName).to.equal('my-api');
      expect(endpoint?.status).to.equal('active');
      expect(endpoint).to.not.have.property('endpointPath');
      expect(endpoint).to.not.have.property('cartridgeName');
    });

    it('should return all columns when all fields specified (MCP column selection)', async () => {
      const mockEndpoints = createMockEndpoints([
        {
          operationId: 'getHello',
          schemaFile: 'schema.yaml',
          implementationScript: 'controller.js',
          errorReason: undefined,
        },
      ]);
      mockGet.resolves(createMockClientResponse(mockEndpoints));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({
        columns:
          'type,apiName,apiVersion,cartridgeName,endpointPath,httpMethod,status,siteId,securityScheme,operationId,schemaFile,implementationScript,errorReason,id',
      });
      const {parsed} = parseResultContent(result);

      const endpoint = (parsed?.endpoints as Record<string, unknown>[])?.[0];
      // Verify all requested columns are present
      const expectedFields = [
        'type',
        'apiName',
        'apiVersion',
        'cartridgeName',
        'endpointPath',
        'httpMethod',
        'status',
        'siteId',
        'securityScheme',
        'operationId',
        'schemaFile',
        'implementationScript',
        'id',
      ];
      for (const field of expectedFields) {
        expect(endpoint).to.have.property(field);
      }
    });

    it('should return validation error for invalid status value', async () => {
      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({status: 'invalid'});

      expect(result.isError).to.be.true;
      const first = result.content?.[0] as undefined | {text?: string};
      expect(first?.text).to.include('Invalid input');
    });
  });
});
