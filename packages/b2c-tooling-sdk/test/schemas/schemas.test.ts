/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  collapseOpenApiSchema,
  isCollapsedSchema,
  getPathKeys,
  getSchemaNames,
  getExampleNames,
  getApiType,
  type OpenApiSchemaInput,
} from '@salesforce/b2c-tooling-sdk/schemas';

describe('schemas', () => {
  // Sample OpenAPI schema for testing
  const sampleSchema: OpenApiSchemaInput = {
    openapi: '3.0.3',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    servers: [{url: 'https://api.example.com'}],
    paths: {
      '/products': {
        get: {summary: 'List products', responses: {}},
        post: {summary: 'Create product', responses: {}},
      },
      '/products/{id}': {
        get: {summary: 'Get product', responses: {}},
        put: {summary: 'Update product', responses: {}},
        delete: {summary: 'Delete product', responses: {}},
      },
      '/orders': {
        get: {summary: 'List orders', responses: {}},
      },
    },
    components: {
      schemas: {
        Product: {type: 'object', properties: {id: {type: 'string'}, name: {type: 'string'}}},
        Order: {type: 'object', properties: {id: {type: 'string'}, total: {type: 'number'}}},
        Customer: {type: 'object', properties: {id: {type: 'string'}, email: {type: 'string'}}},
      },
      examples: {
        ProductExample: {value: {id: '123', name: 'Test Product'}},
        OrderExample: {value: {id: '456', total: 99.99}},
      },
    },
    security: [{oauth2: ['read']}],
    tags: [{name: 'products'}, {name: 'orders'}],
  };

  describe('collapseOpenApiSchema', () => {
    it('collapses paths to method names by default', () => {
      const result = collapseOpenApiSchema(sampleSchema);

      // Paths should be arrays of method names
      expect(result.paths?.['/products']).to.deep.equal(['get', 'post']);
      expect(result.paths?.['/products/{id}']).to.deep.equal(['get', 'put', 'delete']);
      expect(result.paths?.['/orders']).to.deep.equal(['get']);
    });

    it('collapses schemas to empty objects by default', () => {
      const result = collapseOpenApiSchema(sampleSchema);

      // Schemas should be empty objects
      expect(result.components?.schemas?.Product).to.deep.equal({});
      expect(result.components?.schemas?.Order).to.deep.equal({});
      expect(result.components?.schemas?.Customer).to.deep.equal({});
    });

    it('collapses examples to empty objects by default', () => {
      const result = collapseOpenApiSchema(sampleSchema);

      // Examples should be empty objects
      expect(result.components?.examples?.ProductExample).to.deep.equal({});
      expect(result.components?.examples?.OrderExample).to.deep.equal({});
    });

    it('preserves non-collapsible sections', () => {
      const result = collapseOpenApiSchema(sampleSchema);

      // These should be preserved as-is
      expect(result.openapi).to.equal('3.0.3');
      expect(result.info).to.deep.equal({title: 'Test API', version: '1.0.0'});
      expect(result.servers).to.deep.equal([{url: 'https://api.example.com'}]);
      expect(result.security).to.deep.equal([{oauth2: ['read']}]);
      expect(result.tags).to.deep.equal([{name: 'products'}, {name: 'orders'}]);
    });

    it('expands specified paths', () => {
      const result = collapseOpenApiSchema(sampleSchema, {
        expandPaths: ['/products'],
      });

      // /products should be fully expanded
      expect(result.paths?.['/products']).to.have.property('get');
      expect(result.paths?.['/products']).to.have.property('post');
      expect((result.paths?.['/products'] as Record<string, unknown>).get).to.have.property('summary');

      // Other paths should still be collapsed
      expect(result.paths?.['/products/{id}']).to.deep.equal(['get', 'put', 'delete']);
      expect(result.paths?.['/orders']).to.deep.equal(['get']);
    });

    it('expands specified schemas', () => {
      const result = collapseOpenApiSchema(sampleSchema, {
        expandSchemas: ['Product'],
      });

      // Product should be fully expanded
      expect(result.components?.schemas?.Product).to.have.property('type', 'object');
      expect(result.components?.schemas?.Product).to.have.property('properties');

      // Other schemas should still be collapsed
      expect(result.components?.schemas?.Order).to.deep.equal({});
      expect(result.components?.schemas?.Customer).to.deep.equal({});
    });

    it('expands specified examples', () => {
      const result = collapseOpenApiSchema(sampleSchema, {
        expandExamples: ['ProductExample'],
      });

      // ProductExample should be fully expanded
      expect(result.components?.examples?.ProductExample).to.have.property('value');

      // Other examples should still be collapsed
      expect(result.components?.examples?.OrderExample).to.deep.equal({});
    });

    it('expands multiple items', () => {
      const result = collapseOpenApiSchema(sampleSchema, {
        expandPaths: ['/products', '/orders'],
        expandSchemas: ['Product', 'Order'],
        expandExamples: ['ProductExample', 'OrderExample'],
      });

      // Multiple paths expanded
      expect(result.paths?.['/products']).to.have.property('get');
      expect(result.paths?.['/orders']).to.have.property('get');
      expect(result.paths?.['/products/{id}']).to.deep.equal(['get', 'put', 'delete']); // Still collapsed

      // Multiple schemas expanded
      expect(result.components?.schemas?.Product).to.have.property('type');
      expect(result.components?.schemas?.Order).to.have.property('type');
      expect(result.components?.schemas?.Customer).to.deep.equal({}); // Still collapsed

      // Multiple examples expanded
      expect(result.components?.examples?.ProductExample).to.have.property('value');
      expect(result.components?.examples?.OrderExample).to.have.property('value');
    });

    it('handles empty paths', () => {
      const schemaWithNoPaths: OpenApiSchemaInput = {
        openapi: '3.0.3',
        info: {title: 'Test', version: '1.0.0'},
      };

      const result = collapseOpenApiSchema(schemaWithNoPaths);

      expect(result.paths).to.be.undefined;
    });

    it('handles empty components', () => {
      const schemaWithNoComponents: OpenApiSchemaInput = {
        openapi: '3.0.3',
        info: {title: 'Test', version: '1.0.0'},
        paths: {'/test': {get: {}}},
      };

      const result = collapseOpenApiSchema(schemaWithNoComponents);

      expect(result.components).to.be.undefined;
    });

    it('handles missing schemas in components', () => {
      const schemaWithPartialComponents: OpenApiSchemaInput = {
        openapi: '3.0.3',
        info: {title: 'Test', version: '1.0.0'},
        components: {
          parameters: {foo: {name: 'foo', in: 'query'}},
        },
      };

      const result = collapseOpenApiSchema(schemaWithPartialComponents);

      expect(result.components?.schemas).to.be.undefined;
      expect(result.components?.parameters).to.deep.equal({foo: {name: 'foo', in: 'query'}});
    });
  });

  describe('isCollapsedSchema', () => {
    it('returns true when paths are collapsed', () => {
      const collapsed = collapseOpenApiSchema(sampleSchema);
      expect(isCollapsedSchema(collapsed)).to.be.true;
    });

    it('returns true when schemas are empty objects', () => {
      const collapsed = collapseOpenApiSchema(sampleSchema);
      expect(isCollapsedSchema(collapsed)).to.be.true;
    });

    it('returns false when fully expanded', () => {
      // The original schema is not collapsed
      expect(isCollapsedSchema(sampleSchema as unknown as ReturnType<typeof collapseOpenApiSchema>)).to.be.false;
    });
  });

  describe('getPathKeys', () => {
    it('returns all path keys', () => {
      const keys = getPathKeys(sampleSchema);
      expect(keys).to.have.members(['/products', '/products/{id}', '/orders']);
    });

    it('returns empty array when no paths', () => {
      const schemaWithNoPaths: OpenApiSchemaInput = {
        openapi: '3.0.3',
        info: {title: 'Test', version: '1.0.0'},
      };
      const keys = getPathKeys(schemaWithNoPaths);
      expect(keys).to.deep.equal([]);
    });
  });

  describe('getSchemaNames', () => {
    it('returns all schema names', () => {
      const names = getSchemaNames(sampleSchema);
      expect(names).to.have.members(['Product', 'Order', 'Customer']);
    });

    it('returns empty array when no schemas', () => {
      const schemaWithNoSchemas: OpenApiSchemaInput = {
        openapi: '3.0.3',
        info: {title: 'Test', version: '1.0.0'},
      };
      const names = getSchemaNames(schemaWithNoSchemas);
      expect(names).to.deep.equal([]);
    });
  });

  describe('getExampleNames', () => {
    it('returns all example names', () => {
      const names = getExampleNames(sampleSchema);
      expect(names).to.have.members(['ProductExample', 'OrderExample']);
    });

    it('returns empty array when no examples', () => {
      const schemaWithNoExamples: OpenApiSchemaInput = {
        openapi: '3.0.3',
        info: {title: 'Test', version: '1.0.0'},
      };
      const names = getExampleNames(schemaWithNoExamples);
      expect(names).to.deep.equal([]);
    });
  });

  describe('getApiType', () => {
    it('returns "Admin" for AmOAuth2 security scheme', () => {
      expect(getApiType('AmOAuth2')).to.equal('Admin');
    });

    it('returns "Shopper" for ShopperToken security scheme', () => {
      expect(getApiType('ShopperToken')).to.equal('Shopper');
    });

    it('returns "-" for undefined security scheme', () => {
      expect(getApiType(undefined)).to.equal('-');
    });

    it('returns the scheme itself for unknown security schemes', () => {
      expect(getApiType('CustomScheme')).to.equal('CustomScheme');
      expect(getApiType('BearerToken')).to.equal('BearerToken');
    });

    it('returns "-" for empty string', () => {
      expect(getApiType('')).to.equal('-');
    });
  });
});
