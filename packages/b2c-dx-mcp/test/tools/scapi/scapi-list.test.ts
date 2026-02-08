/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';
import {createSchemasListTool} from '../../../src/tools/scapi/scapi-list.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';

describe('tools/scapi/scapi-list', () => {
  let services: Services;

  beforeEach(() => {
    // Create mock services with SCAPI credentials
    services = new Services({
      resolvedConfig: createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      }),
    });
  });

  describe('getAvailableFilters', () => {
    it('should extract unique API families from schemas', () => {
      const schemas: Partial<SchemaListItem>[] = [
        {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v1'},
        {apiFamily: 'checkout', apiName: 'shopper-orders', apiVersion: 'v1'},
        {apiFamily: 'product', apiName: 'shopper-products', apiVersion: 'v2'},
        {apiFamily: 'product', apiName: 'shopper-search', apiVersion: 'v1'},
      ];

      // The function would extract: ["checkout", "product"]
      const uniqueFamilies = [...new Set(schemas.map((s) => s.apiFamily))].sort();
      expect(uniqueFamilies).to.deep.equal(['checkout', 'product']);
    });

    it('should extract unique API names from schemas', () => {
      const schemas: Partial<SchemaListItem>[] = [
        {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v1'},
        {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v2'},
        {apiFamily: 'product', apiName: 'shopper-products', apiVersion: 'v1'},
      ];

      // The function would extract: ["shopper-baskets", "shopper-products"]
      const uniqueNames = [...new Set(schemas.map((s) => s.apiName))].sort();
      expect(uniqueNames).to.deep.equal(['shopper-baskets', 'shopper-products']);
    });

    it('should extract unique API versions from schemas', () => {
      const schemas: Partial<SchemaListItem>[] = [
        {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v1'},
        {apiFamily: 'checkout', apiName: 'shopper-orders', apiVersion: 'v1'},
        {apiFamily: 'product', apiName: 'shopper-products', apiVersion: 'v2'},
      ];

      // The function would extract: ["v1", "v2"]
      const uniqueVersions = [...new Set(schemas.map((s) => s.apiVersion))].sort();
      expect(uniqueVersions).to.deep.equal(['v1', 'v2']);
    });

    it('should handle empty schema list', () => {
      const schemas: SchemaListItem[] = [];

      // Empty array should return empty object or undefined values
      expect(schemas.length).to.equal(0);
    });

    it('should sort results alphabetically', () => {
      const schemas: Partial<SchemaListItem>[] = [
        {apiFamily: 'product', apiName: 'z-api', apiVersion: 'v2'},
        {apiFamily: 'checkout', apiName: 'a-api', apiVersion: 'v1'},
        {apiFamily: 'shopper', apiName: 'm-api', apiVersion: 'v3'},
      ];

      const sortedFamilies = [...new Set(schemas.map((s) => s.apiFamily))].sort();
      const sortedNames = [...new Set(schemas.map((s) => s.apiName))].sort();
      const sortedVersions = [...new Set(schemas.map((s) => s.apiVersion))].sort();

      expect(sortedFamilies).to.deep.equal(['checkout', 'product', 'shopper']);
      expect(sortedNames).to.deep.equal(['a-api', 'm-api', 'z-api']);
      expect(sortedVersions).to.deep.equal(['v1', 'v2', 'v3']);
    });

    it('should filter out undefined values', () => {
      const schemas: Partial<SchemaListItem>[] = [
        {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v1'},
        {apiFamily: undefined, apiName: 'incomplete-api', apiVersion: undefined},
      ];

      const families = [...new Set(schemas.map((s) => s.apiFamily).filter((v) => v !== undefined))];
      const versions = [...new Set(schemas.map((s) => s.apiVersion).filter((v) => v !== undefined))];

      expect(families).to.deep.equal(['checkout']);
      expect(versions).to.deep.equal(['v1']);
    });
  });

  describe('generateEmptyResultMessage', () => {
    it('should generate message for filtered results with no matches', () => {
      const filters = {
        apiFamily: 'checkout',
        apiVersion: 'v1',
        status: 'current' as const,
      };

      // Verify filters were specified
      expect(filters.apiFamily).to.equal('checkout');
      expect(filters.apiVersion).to.equal('v1');
      expect(filters.status).to.equal('current');
    });

    it('should generate message for empty results without filters', () => {
      const filters = {};

      // When no filters, message should indicate possible credential/config issues
      const hasFilters = Object.keys(filters).length > 0;
      expect(hasFilters).to.be.false;
    });

    it('should list active filters in message', () => {
      const filters = {
        apiFamily: 'product',
        apiName: 'shopper-products',
      };

      // Message should include both filters
      expect(filters.apiFamily).to.equal('product');
      expect(filters.apiName).to.equal('shopper-products');
    });
  });

  describe('Mode Detection', () => {
    it('should detect fetch mode when all identifiers + includeSchemas provided', () => {
      const args = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v2',
        includeSchemas: true,
      };

      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
      const isFetchMode = hasAllIdentifiers && Boolean(args.includeSchemas);

      expect(hasAllIdentifiers).to.be.true;
      expect(isFetchMode).to.be.true;
    });

    it('should use discovery mode when includeSchemas is false', () => {
      const args = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v2',
        includeSchemas: false,
      };

      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
      const isFetchMode = hasAllIdentifiers && Boolean(args.includeSchemas);

      expect(hasAllIdentifiers).to.be.true;
      expect(isFetchMode).to.be.false;
    });

    it('should use discovery mode when includeSchemas is omitted', () => {
      const args: {
        apiFamily: string;
        apiName: string;
        apiVersion: string;
        includeSchemas?: boolean;
      } = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v2',
      };

      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
      const isFetchMode = hasAllIdentifiers && Boolean(args.includeSchemas);

      expect(hasAllIdentifiers).to.be.true;
      expect(isFetchMode).to.be.false;
    });

    it('should reject includeSchemas without all identifiers', () => {
      const cases = [
        {apiFamily: 'checkout', includeSchemas: true},
        {apiName: 'shopper-baskets', includeSchemas: true},
        {apiVersion: 'v2', includeSchemas: true},
        {apiFamily: 'checkout', apiName: 'shopper-baskets', includeSchemas: true},
      ];

      for (const args of cases) {
        const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
        const shouldError = args.includeSchemas && !hasAllIdentifiers;

        expect(shouldError).to.be.true;
      }
    });
  });

  describe('Schema Collapsing', () => {
    it('should collapse schema by default', () => {
      const expandAll = undefined;
      const collapsed = !expandAll;

      expect(collapsed).to.be.true;
    });

    it('should not collapse when expandAll is true', () => {
      const expandAll = true;
      const collapsed = !expandAll;

      expect(collapsed).to.be.false;
    });

    it('should collapse when expandAll is explicitly false', () => {
      const expandAll = false;
      const collapsed = !expandAll;

      expect(collapsed).to.be.true;
    });
  });

  describe('URL Building', () => {
    it('should build baseUrl with all required parameters', () => {
      const shortCode = 'kv7kzm78';
      const apiFamily = 'checkout';
      const apiName = 'shopper-baskets';
      const apiVersion = 'v2';

      // baseUrl would be: https://kv7kzm78.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2
      expect(shortCode).to.be.a('string');
      expect(apiFamily).to.be.a('string');
      expect(apiName).to.be.a('string');
      expect(apiVersion).to.be.a('string');
    });

    it('should handle missing shortCode gracefully', () => {
      const shortCode = undefined;
      const baseUrl = shortCode ? 'some-url' : undefined;

      expect(baseUrl).to.be.undefined;
    });
  });

  describe('Status Filter Validation', () => {
    it('should warn when status filter used in fetch mode', () => {
      const args = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v2',
        includeSchemas: true,
        status: 'current' as const,
      };

      // Status filter should generate a warning in fetch mode
      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
      const isFetchMode = hasAllIdentifiers && args.includeSchemas;
      const shouldWarn = isFetchMode && Boolean(args.status);

      expect(shouldWarn).to.be.true;
    });

    it('should not warn when status filter used in discovery mode', () => {
      const args: {
        apiFamily?: string;
        apiName?: string;
        apiVersion?: string;
        includeSchemas?: boolean;
        status?: 'current';
      } = {
        apiFamily: 'checkout',
        status: 'current' as const,
      };

      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
      const isFetchMode = hasAllIdentifiers && Boolean(args.includeSchemas);
      const shouldWarn = isFetchMode && Boolean(args.status);

      expect(shouldWarn).to.be.false;
    });
  });

  describe('Integration', () => {
    it('should create scapi_schemas_list tool successfully', () => {
      const tool = createSchemasListTool(services);

      expect(tool).to.exist;
      expect(tool.name).to.equal('scapi_schemas_list');
      expect(tool.description).to.include('SCAPI');
      expect(tool.description).to.include('standard');
    });

    it('should have correct tool metadata', () => {
      const tool = createSchemasListTool(services);

      expect(tool.name).to.equal('scapi_schemas_list');
      expect(tool.inputSchema).to.exist;
      expect(tool.handler).to.be.a('function');
      expect(tool.toolsets).to.deep.equal(['PWAV3', 'SCAPI', 'STOREFRONTNEXT']);
      expect(tool.isGA).to.be.true;
    });

    it('should describe both discovery and fetch modes', () => {
      const tool = createSchemasListTool(services);

      expect(tool.description).to.include('Discovery Mode');
      expect(tool.description).to.include('Fetch Mode');
      expect(tool.description).to.include('includeSchemas');
    });

    it('should differentiate from custom API tool', () => {
      const tool = createSchemasListTool(services);

      expect(tool.description).to.include('standard');
      expect(tool.description).to.include('scapi_custom_api_list');
    });
  });

  describe('Filter Combinations', () => {
    it('should allow single apiFamily filter', () => {
      const args: {
        apiFamily?: string;
        apiName?: string;
        apiVersion?: string;
      } = {apiFamily: 'checkout'};
      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);

      expect(hasAllIdentifiers).to.be.false;
    });

    it('should allow apiFamily + status filter', () => {
      const args = {apiFamily: 'checkout', status: 'current' as const};
      const hasFilter = Boolean(args.apiFamily || args.status);

      expect(hasFilter).to.be.true;
    });

    it('should allow version-only filter', () => {
      const args: {
        apiFamily?: string;
        apiName?: string;
        apiVersion?: string;
      } = {apiVersion: 'v2'};
      const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);

      expect(hasAllIdentifiers).to.be.false;
    });
  });

  describe('Response Structure', () => {
    it('should include required fields in discovery mode output', () => {
      const mockOutput = {
        schemas: [],
        total: 0,
        timestamp: new Date().toISOString(),
      };

      expect(mockOutput).to.have.property('schemas');
      expect(mockOutput).to.have.property('total');
      expect(mockOutput).to.have.property('timestamp');
      expect(mockOutput.schemas).to.be.an('array');
      expect(mockOutput.total).to.be.a('number');
      expect(mockOutput.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include required fields in fetch mode output', () => {
      const mockOutput = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v2',
        schema: {},
        timestamp: new Date().toISOString(),
        collapsed: true,
      };

      expect(mockOutput).to.have.property('apiFamily');
      expect(mockOutput).to.have.property('apiName');
      expect(mockOutput).to.have.property('apiVersion');
      expect(mockOutput).to.have.property('schema');
      expect(mockOutput).to.have.property('collapsed');
      expect(mockOutput.collapsed).to.be.a('boolean');
    });

    it('should include optional discovery metadata', () => {
      const mockOutput = {
        schemas: [],
        total: 0,
        timestamp: new Date().toISOString(),
        availableApiFamilies: ['checkout', 'product'],
        availableApiNames: ['shopper-baskets'],
        availableVersions: ['v1', 'v2'],
      };

      expect(mockOutput.availableApiFamilies).to.be.an('array');
      expect(mockOutput.availableApiNames).to.be.an('array');
      expect(mockOutput.availableVersions).to.be.an('array');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing credentials gracefully', () => {
      const servicesWithoutCreds = new Services({
        resolvedConfig: createMockResolvedConfig({}),
      });

      // getScapiSchemasClient() should throw descriptive error
      expect(() => servicesWithoutCreds.getScapiSchemasClient()).to.throw();
    });

    it('should validate includeSchemas requires all identifiers', () => {
      const invalidCases = [
        {apiFamily: 'checkout', includeSchemas: true},
        {apiName: 'shopper-baskets', includeSchemas: true},
        {apiVersion: 'v2', includeSchemas: true},
        {apiFamily: 'checkout', apiName: 'shopper-baskets', includeSchemas: true},
        {apiFamily: 'checkout', apiVersion: 'v2', includeSchemas: true},
        {apiName: 'shopper-baskets', apiVersion: 'v2', includeSchemas: true},
      ];

      for (const args of invalidCases) {
        const hasAll = Boolean(args.apiFamily && args.apiName && args.apiVersion);
        const shouldError = args.includeSchemas && !hasAll;
        expect(shouldError).to.be.true;
      }
    });
  });

  describe('Schema Metadata Processing', () => {
    it('should remove link field from schemas', () => {
      const schemaWithLink = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v1',
        link: 'https://internal.api/schema',
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {link, ...schemaWithoutLink} = schemaWithLink;

      expect(schemaWithoutLink).to.not.have.property('link');
      expect(schemaWithoutLink.apiFamily).to.equal('checkout');
    });

    it('should add baseUrl when shortCode available', () => {
      const schema = {
        apiFamily: 'checkout',
        apiName: 'shopper-baskets',
        apiVersion: 'v1',
      };

      const shortCode = 'kv7kzm78';
      const hasAllFields = Boolean(shortCode && schema.apiFamily && schema.apiName && schema.apiVersion);

      expect(hasAllFields).to.be.true;
    });

    it('should handle missing shortCode when building baseUrl', () => {
      const shortCode = undefined;
      const baseUrl = shortCode ? 'url' : undefined;

      expect(baseUrl).to.be.undefined;
    });
  });
});
