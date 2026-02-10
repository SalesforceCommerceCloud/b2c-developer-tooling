/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {stub, restore, type SinonStub} from 'sinon';
import {createSchemasListTool} from '../../../src/tools/scapi/scapi-schemas-list.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {ScapiSchemasClient} from '@salesforce/b2c-tooling-sdk/clients';

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

describe('tools/scapi/scapi-schemas-list', () => {
  let services: Services;
  let getShortCodeStub: SinonStub;
  let mockGet: SinonStub;

  const ORG_ID = 'f_ecom_test_tenant';

  beforeEach(() => {
    services = new Services({
      resolvedConfig: createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      }),
    });

    mockGet = stub();
    const mockClient = {GET: mockGet} as unknown as ScapiSchemasClient;
    stub(services, 'getScapiSchemasClient').returns(mockClient);
    stub(services, 'getOrganizationId').returns(ORG_ID);
    getShortCodeStub = stub(services, 'getShortCode').returns('test-shortcode');
  });

  afterEach(() => {
    restore();
  });

  describe('createSchemasListTool', () => {
    it('creates tool with correct metadata', () => {
      const tool = createSchemasListTool(services);

      expect(tool).to.exist;
      expect(tool.name).to.equal('scapi_schemas_list');
      expect(tool.description).to.include('SCAPI');
      expect(tool.description).to.include('List');
      expect(tool.description).to.include('Fetch');
      expect(tool.description).to.include('scapi_custom_api_status');
      expect(tool.inputSchema).to.exist;
      expect(tool.handler).to.be.a('function');
      expect(tool.toolsets).to.deep.equal(['PWAV3', 'SCAPI', 'STOREFRONTNEXT']);
      expect(tool.isGA).to.be.true;
    });

    it('has optional input params: apiFamily, apiName, apiVersion, status, includeSchemas, expandAll', () => {
      const tool = createSchemasListTool(services);

      expect(tool.inputSchema).to.have.property('apiFamily');
      expect(tool.inputSchema).to.have.property('apiName');
      expect(tool.inputSchema).to.have.property('apiVersion');
      expect(tool.inputSchema).to.have.property('status');
      expect(tool.inputSchema).to.have.property('includeSchemas');
      expect(tool.inputSchema).to.have.property('expandAll');
    });
  });

  describe('handler (list mode)', () => {
    it('returns schemas, total, discovery metadata, and baseUrl when API returns data', async () => {
      mockGet.resolves({
        data: {
          data: [
            {
              apiFamily: 'checkout',
              apiName: 'shopper-baskets',
              apiVersion: 'v1',
              status: 'current',
              link: 'https://internal/schemas/checkout/shopper-baskets/v1',
            },
            {
              apiFamily: 'product',
              apiName: 'shopper-products',
              apiVersion: 'v1',
              status: 'current',
              link: 'https://internal/schemas/product/shopper-products/v1',
            },
          ],
          total: 2,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      const {parsed} = parseResultContent(result);
      expect(parsed).to.not.be.null;
      expect(parsed?.schemas).to.be.an('array').with.lengthOf(2);
      expect(parsed?.total).to.equal(2);
      expect(parsed?.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T/);
      expect(parsed?.availableApiFamilies).to.deep.equal(['checkout', 'product']);
      expect(parsed?.availableApiNames).to.deep.equal(['shopper-baskets', 'shopper-products']);
      expect(parsed?.availableVersions).to.deep.equal(['v1']);

      const first = (parsed?.schemas as Record<string, unknown>[])?.[0];
      expect(first).to.not.have.property('link');
      expect(first?.baseUrl).to.equal(
        'https://test-shortcode.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1',
      );
      expect(first?.apiFamily).to.equal('checkout');
      expect(first?.apiName).to.equal('shopper-baskets');

      expect(mockGet.calledOnce).to.be.true;
      expect(mockGet.firstCall.args[0]).to.equal('/organizations/{organizationId}/schemas');
      expect(mockGet.firstCall.args[1]?.params?.path?.organizationId).to.equal(ORG_ID);
    });

    it('passes query filters to list endpoint', async () => {
      mockGet.resolves({
        data: {data: [], total: 0},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      await tool.handler({
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v1',
        status: 'current',
      });

      expect(mockGet.firstCall.args[1]?.params?.query).to.deep.equal({
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v1',
        status: 'current',
      });
    });

    it('returns message when no schemas and no filters', async () => {
      mockGet.resolves({
        data: {data: [], total: 0},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      expect(parsed?.schemas).to.be.an('array').that.is.empty;
      expect(parsed?.total).to.equal(0);
      expect(parsed?.message).to.include('No SCAPI schemas available');
      expect(parsed?.message).to.include('credentials');
    });

    it('returns message when no schemas but filters were used', async () => {
      mockGet.resolves({
        data: {data: [], total: 0},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({apiFamily: 'checkout', status: 'current'});
      const {parsed} = parseResultContent(result);

      expect(parsed?.message).to.include('No SCAPI schemas match the filters');
      expect(parsed?.message).to.include('apiFamily');
      expect(parsed?.message).to.include('status');
    });

    it('omits baseUrl when getShortCode throws', async () => {
      getShortCodeStub.restore();
      stub(services, 'getShortCode').throws(new Error('No short code'));

      mockGet.resolves({
        data: {
          data: [{apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v1', status: 'current', link: 'x'}],
          total: 1,
        },
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({});
      const {parsed} = parseResultContent(result);

      const first = (parsed?.schemas as Record<string, unknown>[])?.[0];
      expect(first?.baseUrl).to.be.undefined;
      expect(first).to.not.have.property('link');
    });

    it('returns error result when list API returns error', async () => {
      mockGet.resolves({
        data: undefined,
        error: {title: 'Unauthorized', detail: 'Invalid token'},
        response: {status: 401, statusText: 'Unauthorized'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      const first = result.content?.[0] as {text?: string};
      expect(first?.text).to.include('Execution error');
      expect(first?.text).to.include('Failed to fetch SCAPI schemas');
    });
  });

  describe('handler (fetch mode)', () => {
    it('returns schema, collapsed true, baseUrl when includeSchemas and all identifiers provided', async () => {
      const openApiSchema = {openapi: '3.0.0', paths: {'/products': {get: {}}}, info: {title: 'Test'}};
      mockGet.resolves({
        data: openApiSchema,
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({
        apiFamily: 'product',
        apiName: 'shopper-products',
        apiVersion: 'v1',
        includeSchemas: true,
      });

      expect(result.isError).to.be.undefined;
      const {parsed} = parseResultContent(result);
      expect(parsed?.apiFamily).to.equal('product');
      expect(parsed?.apiName).to.equal('shopper-products');
      expect(parsed?.apiVersion).to.equal('v1');
      expect(parsed?.schema).to.exist;
      expect(parsed?.collapsed).to.be.true;
      expect(parsed?.baseUrl).to.equal(
        'https://test-shortcode.api.commercecloud.salesforce.com/product/shopper-products/v1',
      );
      expect(parsed?.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T/);

      expect(mockGet.calledOnce).to.be.true;
      expect(mockGet.firstCall.args[0]).to.equal(
        '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
      );
      expect(mockGet.firstCall.args[1]?.params?.path).to.deep.equal({
        organizationId: ORG_ID,
        apiFamily: 'product',
        apiName: 'shopper-products',
        apiVersion: 'v1',
      });
    });

    it('returns collapsed false when expandAll true', async () => {
      const fullSchema = {openapi: '3.0.0', paths: {}, info: {title: 'Full'}};
      mockGet.resolves({
        data: fullSchema,
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v1',
        includeSchemas: true,
        expandAll: true,
      });

      const {parsed} = parseResultContent(result);
      expect(parsed?.collapsed).to.be.false;
      expect(parsed?.schema).to.deep.include(fullSchema);
    });

    it('includes warning when status filter provided in fetch mode', async () => {
      mockGet.resolves({
        data: {openapi: '3.0.0', paths: {}},
        error: undefined,
        response: {status: 200, statusText: 'OK'},
      });

      const tool = createSchemasListTool(services);
      const result = await tool.handler({
        apiFamily: 'product',
        apiName: 'shopper-products',
        apiVersion: 'v1',
        includeSchemas: true,
        status: 'current',
      });

      const {parsed} = parseResultContent(result);
      expect(parsed?.warning).to.include('status');
      expect(parsed?.warning).to.include('ignored');
    });
  });

  describe('handler (validation and errors)', () => {
    it('returns error result when includeSchemas true but missing apiFamily', async () => {
      const tool = createSchemasListTool(services);
      const result = await tool.handler({
        apiName: 'shopper-baskets',
        apiVersion: 'v1',
        includeSchemas: true,
      });

      expect(result.isError).to.be.true;
      const {raw} = parseResultContent(result);
      expect(raw ?? (result.content?.[0] as {text?: string})?.text).to.include('includeSchemas');
      expect(raw ?? (result.content?.[0] as {text?: string})?.text).to.include('apiFamily');
    });

    it('returns error result when includeSchemas true but missing apiVersion', async () => {
      const tool = createSchemasListTool(services);
      const result = await tool.handler({
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        includeSchemas: true,
      });

      expect(result.isError).to.be.true;
    });

    it('returns validation error for invalid status value', async () => {
      const tool = createSchemasListTool(services);
      const result = await tool.handler({status: 'invalid' as 'current'});

      expect(result.isError).to.be.true;
      const first = result.content?.[0] as {text?: string};
      expect(first?.text).to.include('Invalid input');
    });
  });

  describe('error scenarios', () => {
    it('getScapiSchemasClient throws when config missing', () => {
      const servicesWithoutCreds = new Services({
        resolvedConfig: createMockResolvedConfig({}),
      });

      expect(() => servicesWithoutCreds.getScapiSchemasClient()).to.throw();
    });
  });
});
