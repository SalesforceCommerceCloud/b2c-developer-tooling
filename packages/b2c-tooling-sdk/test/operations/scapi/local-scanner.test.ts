/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {scanLocalCustomApis} from '../../../src/operations/scapi/local-scanner.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('operations/scapi/local-scanner', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test fixtures
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-scanner-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  /**
   * Helper to create a cartridge structure with custom APIs
   */
  function createCartridge(
    cartridgeName: string,
    apis: Array<{
      apiName: string;
      schema: string;
      apiJson?: string;
    }>,
  ): string {
    const cartridgePath = path.join(tempDir, cartridgeName);
    const srcPath = path.join(cartridgePath, 'cartridge');
    const restApisPath = path.join(srcPath, 'rest-apis');

    // Create .project file to mark as cartridge
    fs.mkdirSync(cartridgePath, {recursive: true});
    fs.writeFileSync(
      path.join(cartridgePath, '.project'),
      `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
  <name>${cartridgeName}</name>
</projectDescription>`,
    );

    // Create rest-apis directory
    fs.mkdirSync(restApisPath, {recursive: true});

    // Create each API
    for (const api of apis) {
      const apiPath = path.join(restApisPath, api.apiName);
      fs.mkdirSync(apiPath, {recursive: true});

      // Write schema.yaml
      fs.writeFileSync(path.join(apiPath, 'schema.yaml'), api.schema);

      // Write api.json if provided
      if (api.apiJson) {
        fs.writeFileSync(path.join(apiPath, 'api.json'), api.apiJson);
      }
    }

    return cartridgePath;
  }

  describe('scanLocalCustomApis', () => {
    it('should return empty array when no cartridges found', () => {
      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.be.an('array');
      expect(endpoints).to.have.length(0);
    });

    it('should discover custom API from single cartridge', () => {
      const schema = `
openapi: 3.0.0
info:
  title: Loyalty API
  version: v1
paths:
  /customers:
    get:
      operationId: getCustomers
      summary: Get customers
components:
  securitySchemes:
    ShopperToken:
      type: oauth2
`;

      createCartridge('app_custom', [
        {
          apiName: 'loyalty-info',
          schema,
        },
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0]).to.include({
        apiName: 'loyalty-info',
        apiVersion: 'v1',
        cartridgeName: 'app_custom',
        endpointPath: '/customers',
        httpMethod: 'GET',
        operationId: 'getCustomers',
        securityScheme: 'ShopperToken',
        schemaFile: 'rest-apis/loyalty-info/schema.yaml',
        status: 'local',
      });
    });

    it('should discover multiple endpoints from one API', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v2
paths:
  /customers:
    get:
      operationId: getCustomers
    post:
      operationId: createCustomer
  /customers/{id}:
    get:
      operationId: getCustomer
`;

      createCartridge('app_custom', [
        {
          apiName: 'loyalty-info',
          schema,
        },
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(3);
      expect(endpoints[0].httpMethod).to.equal('GET');
      expect(endpoints[0].endpointPath).to.equal('/customers');
      expect(endpoints[1].httpMethod).to.equal('POST');
      expect(endpoints[1].endpointPath).to.equal('/customers');
      expect(endpoints[2].endpointPath).to.equal('/customers/{id}');
    });

    it('should discover multiple APIs from one cartridge', () => {
      const loyaltySchema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /points:
    get:
      operationId: getPoints
`;

      const ordersSchema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /orders:
    get:
      operationId: getOrders
`;

      createCartridge('app_custom', [
        {apiName: 'loyalty-info', schema: loyaltySchema},
        {apiName: 'orders-api', schema: ordersSchema},
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(2);
      expect(endpoints.map((e) => e.apiName)).to.include.members(['loyalty-info', 'orders-api']);
    });

    it('should discover APIs from multiple cartridges', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('cartridge_a', [{apiName: 'api-a', schema}]);
      createCartridge('cartridge_b', [{apiName: 'api-b', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(2);
      expect(endpoints.map((e) => e.cartridgeName)).to.include.members(['cartridge_a', 'cartridge_b']);
    });

    it('should detect AmOAuth2 security scheme', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /admin:
    get:
      operationId: getAdmin
components:
  securitySchemes:
    AmOAuth2:
      type: oauth2
`;

      createCartridge('app_custom', [{apiName: 'admin-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.equal('AmOAuth2');
    });

    it('should prefer AmOAuth2 over ShopperToken', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
components:
  securitySchemes:
    AmOAuth2:
      type: oauth2
    ShopperToken:
      type: oauth2
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.equal('AmOAuth2');
    });

    it('should handle no security scheme', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /public:
    get:
      operationId: getPublic
`;

      createCartridge('app_custom', [{apiName: 'public-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.be.undefined;
    });

    it('should read implementation script from api.json', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      const apiJson = JSON.stringify({
        endpoints: [
          {
            implementation: 'script/customApi',
          },
        ],
      });

      createCartridge('app_custom', [
        {
          apiName: 'test-api',
          schema,
          apiJson,
        },
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].implementationScript).to.equal('script/customApi.js');
    });

    it('should handle missing api.json', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].implementationScript).to.be.undefined;
    });

    it('should default to v1 when version is missing', () => {
      const schema = `
openapi: 3.0.0
info:
  title: Test API
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiVersion).to.equal('v1');
    });

    it('should filter by includeCartridges', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('cartridge_a', [{apiName: 'api-a', schema}]);
      createCartridge('cartridge_b', [{apiName: 'api-b', schema}]);

      const endpoints = scanLocalCustomApis({
        directory: tempDir,
        includeCartridges: ['cartridge_a'],
      });

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].cartridgeName).to.equal('cartridge_a');
    });

    it('should filter by excludeCartridges', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('cartridge_a', [{apiName: 'api-a', schema}]);
      createCartridge('cartridge_b', [{apiName: 'api-b', schema}]);

      const endpoints = scanLocalCustomApis({
        directory: tempDir,
        excludeCartridges: ['cartridge_b'],
      });

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].cartridgeName).to.equal('cartridge_a');
    });

    it('should filter by includeApis', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [
        {apiName: 'api-a', schema},
        {apiName: 'api-b', schema},
      ]);

      const endpoints = scanLocalCustomApis({
        directory: tempDir,
        includeApis: ['api-a'],
      });

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiName).to.equal('api-a');
    });

    it('should filter by excludeApis', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [
        {apiName: 'api-a', schema},
        {apiName: 'api-b', schema},
      ]);

      const endpoints = scanLocalCustomApis({
        directory: tempDir,
        excludeApis: ['api-b'],
      });

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiName).to.equal('api-a');
    });

    it('should skip cartridge without rest-apis directory', () => {
      const cartridgePath = path.join(tempDir, 'empty_cartridge');
      fs.mkdirSync(path.join(cartridgePath, 'cartridge'), {recursive: true});
      fs.writeFileSync(
        path.join(cartridgePath, '.project'),
        `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
  <name>empty_cartridge</name>
</projectDescription>`,
      );

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(0);
    });

    it('should skip non-directory entries in rest-apis', () => {
      const cartridgePath = path.join(tempDir, 'app_custom');
      const restApisPath = path.join(cartridgePath, 'cartridge', 'rest-apis');

      fs.mkdirSync(restApisPath, {recursive: true});
      fs.writeFileSync(
        path.join(cartridgePath, '.project'),
        `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
  <name>app_custom</name>
</projectDescription>`,
      );

      // Create a file instead of directory
      fs.writeFileSync(path.join(restApisPath, 'not-a-directory.txt'), 'test');

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(0);
    });

    it('should skip API directory without schema.yaml', () => {
      const cartridgePath = path.join(tempDir, 'app_custom');
      const apiPath = path.join(cartridgePath, 'cartridge', 'rest-apis', 'incomplete-api');

      fs.mkdirSync(apiPath, {recursive: true});
      fs.writeFileSync(
        path.join(cartridgePath, '.project'),
        `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
  <name>app_custom</name>
</projectDescription>`,
      );

      // Create api.json but no schema.yaml
      fs.writeFileSync(path.join(apiPath, 'api.json'), '{}');

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(0);
    });

    it('should handle malformed YAML gracefully', () => {
      const invalidSchema = `
this is not valid YAML:
  - missing proper structure
  [unclosed bracket
`;

      createCartridge('app_custom', [
        {
          apiName: 'broken-api',
          schema: invalidSchema,
        },
      ]);

      // Should not throw, just warn and return empty
      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(0);
    });

    it('should handle malformed JSON in api.json gracefully', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      const cartridgePath = createCartridge('app_custom', [
        {
          apiName: 'test-api',
          schema,
        },
      ]);

      // Write invalid JSON
      const apiJsonPath = path.join(cartridgePath, 'cartridge', 'rest-apis', 'test-api', 'api.json');
      fs.writeFileSync(apiJsonPath, '{invalid json}');

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].implementationScript).to.be.undefined;
    });

    it('should handle missing paths in schema', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
`;

      createCartridge('app_custom', [{apiName: 'empty-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(0);
    });

    it('should handle empty paths object', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths: {}
`;

      createCartridge('app_custom', [{apiName: 'empty-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(0);
    });

    it('should normalize HTTP methods to uppercase', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: getTest
    post:
      operationId: postTest
    put:
      operationId: putTest
    delete:
      operationId: deleteTest
    patch:
      operationId: patchTest
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(5);
      expect(endpoints.map((e) => e.httpMethod)).to.have.members(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    });

    it('should handle missing operationId', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      summary: Test endpoint
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].operationId).to.be.undefined;
    });

    it('should combine all filters correctly', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('cartridge_a', [
        {apiName: 'api-1', schema},
        {apiName: 'api-2', schema},
      ]);
      createCartridge('cartridge_b', [
        {apiName: 'api-3', schema},
        {apiName: 'api-4', schema},
      ]);

      const endpoints = scanLocalCustomApis({
        directory: tempDir,
        includeCartridges: ['cartridge_a'],
        excludeApis: ['api-2'],
      });

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].cartridgeName).to.equal('cartridge_a');
      expect(endpoints[0].apiName).to.equal('api-1');
    });

    it('should return partial results when encountering errors', () => {
      const validSchema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      const invalidSchema = 'invalid yaml content';

      createCartridge('app_custom', [
        {apiName: 'valid-api', schema: validSchema},
        {apiName: 'invalid-api', schema: invalidSchema},
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      // Should still return the valid endpoint
      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiName).to.equal('valid-api');
    });

    it('should handle api.json with empty endpoints array', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      const apiJson = JSON.stringify({
        endpoints: [],
      });

      createCartridge('app_custom', [
        {
          apiName: 'test-api',
          schema,
          apiJson,
        },
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].implementationScript).to.be.undefined;
    });

    it('should handle api.json with no endpoints field', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      const apiJson = JSON.stringify({
        someOtherField: 'value',
      });

      createCartridge('app_custom', [
        {
          apiName: 'test-api',
          schema,
          apiJson,
        },
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].implementationScript).to.be.undefined;
    });

    it('should handle api.json with endpoint but no implementation', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      const apiJson = JSON.stringify({
        endpoints: [
          {
            someOtherField: 'value',
          },
        ],
      });

      createCartridge('app_custom', [
        {
          apiName: 'test-api',
          schema,
          apiJson,
        },
      ]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].implementationScript).to.be.undefined;
    });

    it('should handle schema with only AmOAuth2', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
components:
  securitySchemes:
    AmOAuth2:
      type: oauth2
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.equal('AmOAuth2');
    });

    it('should handle schema with only ShopperToken', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
components:
  securitySchemes:
    ShopperToken:
      type: oauth2
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.equal('ShopperToken');
    });

    it('should handle schema with other security schemes', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.be.undefined;
    });

    it('should handle schema with missing components', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].securityScheme).to.be.undefined;
    });

    it('should handle path with non-object method value', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test: null
  /valid:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].endpointPath).to.equal('/valid');
    });

    it('should handle method with non-object operation value', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get: null
    post:
      operationId: validPost
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].httpMethod).to.equal('POST');
    });

    it('should handle includeApis and excludeApis both specified', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [
        {apiName: 'api-a', schema},
        {apiName: 'api-b', schema},
        {apiName: 'api-c', schema},
      ]);

      const endpoints = scanLocalCustomApis({
        directory: tempDir,
        includeApis: ['api-a', 'api-b'],
        excludeApis: ['api-b'],
      });

      // Should include api-a (in whitelist, not in blacklist)
      // Should exclude api-b (in whitelist, but also in blacklist)
      // Should exclude api-c (not in whitelist)
      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiName).to.equal('api-a');
    });

    it('should handle complex version strings', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v2.1.0-beta
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiVersion).to.equal('v2.1.0-beta');
    });

    it('should handle paths with special characters', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /customers/{customer-id}/orders:
    get:
      operationId: getOrders
  /search?query={term}:
    get:
      operationId: search
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(2);
      expect(endpoints.map((e) => e.endpointPath)).to.include.members([
        '/customers/{customer-id}/orders',
        '/search?query={term}',
      ]);
    });

    it('should handle all standard HTTP methods', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: get
    post:
      operationId: post
    put:
      operationId: put
    delete:
      operationId: delete
    patch:
      operationId: patch
    head:
      operationId: head
    options:
      operationId: options
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(7);
      expect(endpoints.map((e) => e.httpMethod)).to.include.members([
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'HEAD',
        'OPTIONS',
      ]);
    });

    it('should handle cartridge with spaces in name', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('cartridge with spaces', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].cartridgeName).to.equal('cartridge with spaces');
    });

    it('should handle API name with special characters', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'loyalty-info_v2', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiName).to.equal('loyalty-info_v2');
      expect(endpoints[0].schemaFile).to.equal('rest-apis/loyalty-info_v2/schema.yaml');
    });

    it('should handle empty info in schema', () => {
      const schema = `
openapi: 3.0.0
info: {}
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].apiVersion).to.equal('v1'); // Should default to v1
    });

    it('should set status to local for all endpoints', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test1:
    get:
      operationId: test1
  /test2:
    post:
      operationId: test2
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(2);
      expect(endpoints.every((e) => e.status === 'local')).to.be.true;
    });

    it('should handle multiple cartridges with same API name', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: test
`;

      createCartridge('cartridge_a', [{apiName: 'loyalty-info', schema}]);
      createCartridge('cartridge_b', [{apiName: 'loyalty-info', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(2);
      expect(endpoints[0].apiName).to.equal('loyalty-info');
      expect(endpoints[1].apiName).to.equal('loyalty-info');
      expect(endpoints[0].cartridgeName).not.to.equal(endpoints[1].cartridgeName);
    });

    it('should handle large number of endpoints', () => {
      // Generate schema with 50 endpoints
      const paths = Array.from({length: 50}, (_, i) => `  /endpoint${i}:\n    get:\n      operationId: get${i}`).join(
        '\n',
      );

      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
${paths}
`;

      createCartridge('app_custom', [{apiName: 'large-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(50);
      expect(endpoints.every((e) => e.apiName === 'large-api')).to.be.true;
    });

    it('should preserve operationId when present', () => {
      const schema = `
openapi: 3.0.0
info:
  version: v1
paths:
  /test:
    get:
      operationId: getTestResource
`;

      createCartridge('app_custom', [{apiName: 'test-api', schema}]);

      const endpoints = scanLocalCustomApis({directory: tempDir});

      expect(endpoints).to.have.length(1);
      expect(endpoints[0].operationId).to.equal('getTestResource');
    });
  });
});
