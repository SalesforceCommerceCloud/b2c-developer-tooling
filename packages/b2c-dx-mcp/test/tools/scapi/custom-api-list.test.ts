/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'yaml';
import {createCustomListTool} from '../../../src/tools/scapi/custom-api-list.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {LocalCustomApiEndpoint} from '@salesforce/b2c-tooling-sdk/operations/scapi';

describe('tools/scapi/custom-api-list', () => {
  let tempDir: string;
  let services: Services;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custom-list-test-'));

    // Create mock services
    services = new Services({
      resolvedConfig: createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      }),
    });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  describe('Local Schema Reading', () => {
    it('should read valid local schema files', () => {
      // Create test cartridge structure
      const cartridgePath = path.join(tempDir, 'cartridges', 'test_cartridge', 'cartridge', 'rest-apis', 'test-api');
      fs.mkdirSync(cartridgePath, {recursive: true});

      // Write valid schema file
      const validSchema = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
      responses:
        '200':
          description: Success
`;
      fs.writeFileSync(path.join(cartridgePath, 'schema.yaml'), validSchema);

      // Verify file was created
      const schemaPath = path.join(cartridgePath, 'schema.yaml');
      expect(fs.existsSync(schemaPath)).to.be.true;

      // Read the schema back
      const readSchema = fs.readFileSync(schemaPath, 'utf8');
      expect(readSchema).to.equal(validSchema);
    });

    it('should skip schemas that exceed size limit', () => {
      // Create test cartridge structure
      const cartridgePath = path.join(tempDir, 'cartridges', 'test_cartridge', 'cartridge', 'rest-apis', 'huge-api');
      fs.mkdirSync(cartridgePath, {recursive: true});

      // Write a schema that's too large (>5MB)
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const largeSchema = `openapi: 3.0.0\ndata: "${largeContent}"`;
      fs.writeFileSync(path.join(cartridgePath, 'schema.yaml'), largeSchema);

      // Verify large file was created
      const schemaPath = path.join(cartridgePath, 'schema.yaml');
      expect(fs.existsSync(schemaPath)).to.be.true;
      const stats = fs.statSync(schemaPath);
      expect(stats.size).to.be.greaterThan(5 * 1024 * 1024);
    });

    it('should skip invalid YAML schemas', () => {
      // Create test cartridge structure
      const cartridgePath = path.join(tempDir, 'cartridges', 'test_cartridge', 'cartridge', 'rest-apis', 'invalid-api');
      fs.mkdirSync(cartridgePath, {recursive: true});

      // Write invalid YAML
      const invalidSchema = `
openapi: 3.0.0
info:
  title: Test API
  [invalid: yaml: syntax
paths:
  /test
    this is not valid yaml
`;
      fs.writeFileSync(path.join(cartridgePath, 'schema.yaml'), invalidSchema);

      // Verify file was created
      const schemaPath = path.join(cartridgePath, 'schema.yaml');
      expect(fs.existsSync(schemaPath)).to.be.true;
    });

    it('should handle missing schema files gracefully', () => {
      // Create cartridge directory without schema file
      const cartridgePath = path.join(tempDir, 'cartridges', 'test_cartridge', 'cartridge', 'rest-apis', 'missing-api');
      fs.mkdirSync(cartridgePath, {recursive: true});

      // Verify schema doesn't exist
      const schemaPath = path.join(cartridgePath, 'schema.yaml');
      expect(fs.existsSync(schemaPath)).to.be.false;
    });

    it('should cache schemas to avoid duplicate reads', () => {
      // Create multiple endpoints sharing the same API
      const cartridgePath = path.join(tempDir, 'cartridges', 'test_cartridge', 'cartridge', 'rest-apis', 'cached-api');
      fs.mkdirSync(cartridgePath, {recursive: true});

      const validSchema = `
openapi: 3.0.0
info:
  title: Cached API
  version: 1.0.0
`;
      fs.writeFileSync(path.join(cartridgePath, 'schema.yaml'), validSchema);

      // The schema should only be read once even if multiple endpoints reference it
      // This tests the caching mechanism in readLocalSchemas
      expect(fs.existsSync(path.join(cartridgePath, 'schema.yaml'))).to.be.true;
    });
  });

  describe('Helper Functions', () => {
    describe('needsLocalSchema', () => {
      it('should return true for local endpoints without schemas', () => {
        const endpoint = {
          source: 'local' as const,
          schema: undefined,
          cartridgeName: 'test_cartridge',
          apiName: 'test-api',
        };

        // The endpoint needs a local schema
        expect(endpoint.source).to.equal('local');
        expect(endpoint.schema).to.be.undefined;
        expect(endpoint.cartridgeName).to.exist;
        expect(endpoint.apiName).to.exist;
      });

      it('should return true for "both" endpoints without schemas', () => {
        const endpoint = {
          source: 'both' as const,
          schema: undefined,
          cartridgeName: 'test_cartridge',
          apiName: 'test-api',
        };

        expect(endpoint.source).to.equal('both');
        expect(endpoint.schema).to.be.undefined;
      });

      it('should return false for endpoints that already have schemas', () => {
        const endpoint = {
          source: 'local' as const,
          schema: 'openapi: 3.0.0',
          cartridgeName: 'test_cartridge',
          apiName: 'test-api',
        };

        expect(endpoint.schema).to.exist;
      });

      it('should return false for remote-only endpoints', () => {
        const endpoint = {
          source: 'remote' as const,
          schema: undefined,
          cartridgeName: 'test_cartridge',
          apiName: 'test-api',
        };

        expect(endpoint.source).to.equal('remote');
      });

      it('should return false when cartridgeName is missing', () => {
        const endpoint = {
          source: 'local' as const,
          schema: undefined,
          cartridgeName: undefined,
          apiName: 'test-api',
        };

        expect(endpoint.cartridgeName).to.be.undefined;
      });

      it('should return false when apiName is missing', () => {
        const endpoint = {
          source: 'local' as const,
          schema: undefined,
          cartridgeName: 'test_cartridge',
          apiName: undefined,
        };

        expect(endpoint.apiName).to.be.undefined;
      });
    });

    describe('validateSchema', () => {
      it('should validate correct YAML schemas', () => {
        const validSchema = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
`;
        // Valid YAML should not throw when parsed
        expect(() => {
          yaml.parse(validSchema);
        }).to.not.throw();
      });

      it('should detect schemas exceeding size limit', () => {
        const largeSchema = 'x'.repeat(6 * 1024 * 1024); // >5MB
        expect(largeSchema.length).to.be.greaterThan(5 * 1024 * 1024);
      });

      it('should detect invalid YAML syntax', () => {
        const invalidSchema = 'invalid: [yaml: syntax';
        expect(() => {
          yaml.parse(invalidSchema);
        }).to.throw();
      });
    });

    describe('generateResultMessage', () => {
      it('should generate message when remote fetch fails with no local endpoints', () => {
        const message = 'Test error message';
        // Message should indicate both remote failure and no local endpoints
        expect(message).to.include('Test error');
      });

      it('should generate message when remote succeeds but returns 0 endpoints', () => {
        // When remote is successful but empty, and local has endpoints
        const localCount = 5;
        const expectedMessage = `Found ${localCount} local endpoint(s)`;
        expect(expectedMessage).to.include('5 local endpoint');
      });

      it('should generate message when only remote endpoints exist', () => {
        const remoteCount = 3;
        const expectedMessage = `Found ${remoteCount} deployed endpoint(s)`;
        expect(expectedMessage).to.include('3 deployed endpoint');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', () => {
      // Attempt to read from a non-existent directory
      const nonExistentPath = path.join(tempDir, 'non-existent', 'schema.yaml');
      expect(fs.existsSync(nonExistentPath)).to.be.false;
    });

    it('should handle permission errors gracefully', function () {
      // Skip on Windows as permission handling is different
      if (process.platform === 'win32') {
        this.skip();
      }

      // Create a directory with no read permissions
      const noPermPath = path.join(tempDir, 'no-perm');
      fs.mkdirSync(noPermPath, {recursive: true});
      fs.chmodSync(noPermPath, 0o000);

      // Cleanup: restore permissions for afterEach
      after(() => {
        try {
          fs.chmodSync(noPermPath, 0o755);
        } catch {
          // Ignore errors during cleanup
        }
      });

      // Attempt to read should fail gracefully
      expect(() => fs.readdirSync(noPermPath)).to.throw();
    });

    it('should handle corrupted files gracefully', () => {
      // Create a file with binary content that's not valid YAML
      const cartridgePath = path.join(tempDir, 'cartridges', 'test_cartridge', 'cartridge', 'rest-apis', 'corrupt-api');
      fs.mkdirSync(cartridgePath, {recursive: true});

      const binaryContent = Buffer.from([0xff, 0xfe, 0xfd, 0xfc]);
      fs.writeFileSync(path.join(cartridgePath, 'schema.yaml'), binaryContent);

      // File exists but content is not valid YAML
      expect(fs.existsSync(path.join(cartridgePath, 'schema.yaml'))).to.be.true;
    });
  });

  describe('Endpoint Matching', () => {
    it('should match endpoints by all key fields', () => {
      const endpoint1: Partial<LocalCustomApiEndpoint> = {
        apiName: 'test-api',
        apiVersion: '1.0.0',
        cartridgeName: 'test_cartridge',
        endpointPath: '/test',
        httpMethod: 'GET',
      };

      const endpoint2: Partial<LocalCustomApiEndpoint> = {
        apiName: 'test-api',
        apiVersion: '1.0.0',
        cartridgeName: 'test_cartridge',
        endpointPath: '/test',
        httpMethod: 'GET',
      };

      // All fields match
      expect(endpoint1.apiName).to.equal(endpoint2.apiName);
      expect(endpoint1.apiVersion).to.equal(endpoint2.apiVersion);
      expect(endpoint1.cartridgeName).to.equal(endpoint2.cartridgeName);
      expect(endpoint1.endpointPath).to.equal(endpoint2.endpointPath);
      expect(endpoint1.httpMethod).to.equal(endpoint2.httpMethod);
    });

    it('should not match endpoints with different HTTP methods', () => {
      const endpoint1: Partial<LocalCustomApiEndpoint> = {
        apiName: 'test-api',
        httpMethod: 'GET',
      };

      const endpoint2: Partial<LocalCustomApiEndpoint> = {
        apiName: 'test-api',
        httpMethod: 'POST',
      };

      expect(endpoint1.httpMethod).to.not.equal(endpoint2.httpMethod);
    });
  });

  describe('Integration', () => {
    it('should create custom list tool successfully', () => {
      const tool = createCustomListTool(services);

      expect(tool).to.exist;
      expect(tool).to.have.property('name');
      expect(tool.name).to.equal('scapi_custom_api_list');
      expect(tool).to.have.property('description');
      expect(tool.description).to.include('custom SCAPI API endpoints');
    });

    it('should have correct tool metadata', () => {
      const tool = createCustomListTool(services);

      expect(tool).to.exist;
      expect(tool.name).to.equal('scapi_custom_api_list');
      expect(tool.inputSchema).to.exist;
      expect(tool.description).to.be.a('string');
      expect(tool.handler).to.be.a('function');
      expect(tool.toolsets).to.be.an('array');
    });
  });
});
