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
import type {CustomApisClient} from '@salesforce/b2c-tooling-sdk/clients';

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

describe('tools/scapi/scapi-custom-apis-status', () => {
  let services: Services;
  let getCustomApisClientStub: SinonStub;
  let getOrganizationIdStub: SinonStub;
  let mockGet: SinonStub;

  beforeEach(() => {
    services = new Services({
      resolvedConfig: createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      }),
    });

    mockGet = stub();
    const mockClient = {
      GET: mockGet,
    } as unknown as CustomApisClient;

    getCustomApisClientStub = stub(services, 'getCustomApisClient').returns(mockClient);
    getOrganizationIdStub = stub(services, 'getOrganizationId').returns('f_ecom_test_tenant');
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
      expect(tool.description).to.include('endpoints');
      expect(tool.description).to.include('Custom');
      expect(tool.description).to.include('b2c scapi custom status');
      expect(tool.inputSchema).to.exist;
      expect(tool.handler).to.be.a('function');
      expect(tool.toolsets).to.deep.equal(['PWAV3', 'SCAPI', 'STOREFRONTNEXT']);
      expect(tool.isGA).to.be.false;
    });

    it('should have optional input params: status, groupBy, columns, extended', () => {
      const tool = createScapiCustomApisStatusTool(services);

      expect(tool.inputSchema).to.have.property('status');
      expect(tool.inputSchema).to.have.property('groupBy');
      expect(tool.inputSchema).to.have.property('columns');
      expect(tool.inputSchema).to.have.property('extended');
    });
  });

  describe('handler', () => {
    it('should return endpoints and total when API returns data', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiName: 'my-api',
              apiVersion: 'v1',
              cartridgeName: 'app_custom',
              endpointPath: '/hello',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'ShopperToken',
              id: 'ep-1',
            },
          ],
          activeCodeVersion: 'version1',
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

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

      const endpoint = (parsed?.endpoints as Record<string, unknown>[])?.[0];
      expect(endpoint?.type).to.equal('Shopper');
      expect(endpoint?.apiName).to.equal('my-api');
      expect(endpoint?.endpointPath).to.equal('/hello');
      expect(endpoint?.httpMethod).to.equal('GET');
      expect(endpoint?.status).to.equal('active');
      expect(endpoint?.siteId).to.equal('RefArch');
    });

    it('should call GET with organizationId from services', async () => {
      mockGet.resolves({
        data: {data: [], activeCodeVersion: undefined},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      await tool.handler({});

      expect(getCustomApisClientStub.called).to.be.true;
      expect(getOrganizationIdStub.called).to.be.true;
      expect(mockGet.calledOnce).to.be.true;
      expect(mockGet.firstCall.args[0]).to.equal('/organizations/{organizationId}/endpoints');
      expect(mockGet.firstCall.args[1]?.params?.path?.organizationId).to.equal('f_ecom_test_tenant');
    });

    it('should pass status query when status arg provided', async () => {
      mockGet.resolves({
        data: {data: [], activeCodeVersion: undefined},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      await tool.handler({status: 'active'});

      expect(mockGet.firstCall.args[1]?.params?.query).to.deep.equal({status: 'active'});
    });

    it('should not pass query when status omitted', async () => {
      mockGet.resolves({
        data: {data: [], activeCodeVersion: undefined},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      await tool.handler({});

      expect(mockGet.firstCall.args[1]?.params?.query).to.be.undefined;
    });

    it('should add type Admin for AmOAuth2 and Shopper for ShopperToken', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiName: 'admin-api',
              apiVersion: 'v1',
              endpointPath: '/admin',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'AmOAuth2',
            },
            {
              apiName: 'shopper-api',
              apiVersion: 'v1',
              endpointPath: '/shopper',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'ShopperToken',
            },
          ],
          activeCodeVersion: undefined,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

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

    it('should return empty endpoints and message when API returns empty data', async () => {
      mockGet.resolves({
        data: {data: [], activeCodeVersion: 'v1'},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.endpoints).to.be.an('array').that.is.empty;
      expect(parsed?.total).to.equal(0);
      expect(parsed?.message).to.include('No Custom API endpoints found');
    });

    it('should return remoteError and total 0 when API returns error', async () => {
      mockGet.resolves({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid filter'},
        response: {status: 400, statusText: 'Bad Request'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.total).to.equal(0);
      expect(parsed?.remoteError).to.include('Failed to fetch remote endpoints');
      expect(parsed?.message).to.include('Failed to fetch Custom API endpoints');
    });

    it('should return remoteError when client GET throws', async () => {
      mockGet.rejects(new Error('Network error'));

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.total).to.equal(0);
      expect(parsed?.remoteError).to.include('Network error');
    });

    it('should return groups when groupBy is type', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiName: 'a',
              apiVersion: 'v1',
              endpointPath: '/a',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'AmOAuth2',
            },
            {
              apiName: 'b',
              apiVersion: 'v1',
              endpointPath: '/b',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'ShopperToken',
            },
          ],
          activeCodeVersion: undefined,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

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

    it('should return groups when groupBy is site', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiName: 'a',
              apiVersion: 'v1',
              endpointPath: '/a',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'Site1',
              securityScheme: 'ShopperToken',
            },
            {
              apiName: 'b',
              apiVersion: 'v1',
              endpointPath: '/b',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'Site2',
              securityScheme: 'ShopperToken',
            },
          ],
          activeCodeVersion: undefined,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({groupBy: 'site'});
      const {parsed} = parseResultContent(result);

      expect(parsed?.groups).to.exist;
      const groupsBySite = parsed?.groups as Record<string, unknown[]> | undefined;
      expect(groupsBySite?.Site1).to.be.an('array').with.lengthOf(1);
      expect(groupsBySite?.Site2).to.be.an('array').with.lengthOf(1);
      expect(parsed?.total).to.equal(2);
    });

    it('should return only requested columns when columns arg provided', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiName: 'my-api',
              apiVersion: 'v1',
              cartridgeName: 'app_custom',
              endpointPath: '/hello',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'ShopperToken',
              id: 'ep-1',
            },
          ],
          activeCodeVersion: undefined,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

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

    it('should return all columns when extended is true', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiName: 'my-api',
              apiVersion: 'v1',
              cartridgeName: 'app_custom',
              endpointPath: '/hello',
              httpMethod: 'GET',
              status: 'active',
              siteId: 'RefArch',
              securityScheme: 'ShopperToken',
              operationId: 'getHello',
              schemaFile: 'schema.yaml',
              implementationScript: 'controller.js',
              errorReason: undefined,
              id: 'ep-1',
            },
          ],
          activeCodeVersion: undefined,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createScapiCustomApisStatusTool(services);
      const result = await tool.handler({extended: true});
      const {parsed} = parseResultContent(result);

      const endpoint = (parsed?.endpoints as Record<string, unknown>[])?.[0];
      // Should have all 14 fields when extended is true
      expect(endpoint).to.have.property('type');
      expect(endpoint).to.have.property('apiName');
      expect(endpoint).to.have.property('apiVersion');
      expect(endpoint).to.have.property('cartridgeName');
      expect(endpoint).to.have.property('endpointPath');
      expect(endpoint).to.have.property('httpMethod');
      expect(endpoint).to.have.property('status');
      expect(endpoint).to.have.property('siteId');
      expect(endpoint).to.have.property('securityScheme');
      expect(endpoint).to.have.property('operationId');
      expect(endpoint).to.have.property('schemaFile');
      expect(endpoint).to.have.property('implementationScript');
      expect(endpoint).to.have.property('id');
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
