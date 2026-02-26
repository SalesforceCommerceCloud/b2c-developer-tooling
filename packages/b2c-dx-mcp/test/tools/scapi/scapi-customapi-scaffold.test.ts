/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createScaffoldCustomApiTool} from '../../../src/tools/scapi/scapi-custom-api-scaffold.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {ToolResult} from '../../../src/utils/types.js';

/**
 * Parse JSON from a ToolResult (success case).
 */
function getResultJson<T>(result: ToolResult): T {
  const content = result.content[0];
  if (content.type !== 'text') {
    throw new Error(`Expected text content, got ${content.type}`);
  }
  return JSON.parse(content.text) as T;
}

/**
 * Get raw text from a ToolResult (error case).
 */
function getResultText(result: ToolResult): string {
  const content = result.content[0];
  if (content.type !== 'text') {
    throw new Error(`Expected text content, got ${content.type}`);
  }
  return content.text;
}

interface ScaffoldOutput {
  scaffold: string;
  outputDir: string;
  dryRun: boolean;
  files: Array<{path: string; action: string; skipReason?: string}>;
  postInstructions?: string;
  error?: string;
}

describe('tools/scapi/scapi-customapi-scaffold', () => {
  let services: Services;
  let tempDir: string;
  let loadServices: () => Services;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-mcp-scaffold-test-'));
    services = new Services({
      resolvedConfig: createMockResolvedConfig({workingDirectory: tempDir}),
    });
    loadServices = () => services;
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  describe('createScaffoldCustomApiTool', () => {
    it('should create scapi_custom_api_scaffold tool with correct metadata', () => {
      const tool = createScaffoldCustomApiTool(loadServices);

      expect(tool).to.exist;
      expect(tool.name).to.equal('scapi_custom_api_scaffold');
      expect(tool.description).to.include('custom SCAPI');
      expect(tool.description).to.include('apiName');
      expect(tool.inputSchema).to.exist;
      expect(tool.handler).to.be.a('function');
      expect(tool.toolsets).to.deep.equal(['PWAV3', 'SCAPI', 'STOREFRONTNEXT']);
      expect(tool.isGA).to.be.false;
    });

    it('should have required apiName and optional cartridgeName, apiType, apiDescription, projectRoot, outputDir', () => {
      const tool = createScaffoldCustomApiTool(loadServices);

      expect(tool.inputSchema).to.have.property('apiName');
      expect(tool.inputSchema).to.have.property('cartridgeName');
      expect(tool.inputSchema).to.have.property('apiType');
      expect(tool.inputSchema).to.have.property('apiDescription');
      expect(tool.inputSchema).to.have.property('projectRoot');
      expect(tool.inputSchema).to.have.property('outputDir');
    });
  });

  describe('handler', () => {
    it('should return error when no cartridges found in project (no .project file)', async () => {
      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({apiName: 'my-api'});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('No cartridges found');
      expect(text).to.include('.project');
    });

    it('should validate apiName is required', async () => {
      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should validate apiName is non-empty', async () => {
      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({apiName: ''});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should validate apiType when provided', async () => {
      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({apiName: 'my-api', apiType: 'invalid'});

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should generate custom API files when cartridge exists (first cartridge used by default)', async () => {
      const cartridgeDir = path.join(tempDir, 'app_custom');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '', 'utf-8');

      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({apiName: 'test-api'});

      expect(result.isError).to.be.undefined;
      const output = getResultJson<ScaffoldOutput>(result);
      expect(output.scaffold).to.equal('custom-api');
      expect(output.error).to.be.undefined;
      expect(output.files).to.be.an('array').with.lengthOf(3);
      expect(output.dryRun).to.be.false;

      const paths = output.files.map((f) => f.path);
      expect(paths.some((p) => p.includes('test-api') && p.endsWith('schema.yaml'))).to.be.true;
      expect(paths.some((p) => p.includes('test-api') && p.endsWith('api.json'))).to.be.true;
      expect(paths.some((p) => p.includes('test-api') && p.endsWith('script.js'))).to.be.true;
      expect(output.postInstructions).to.include('test-api');
      expect(output.postInstructions).to.include('app_custom');

      const schemaPath = path.join(tempDir, 'app_custom', 'cartridge', 'rest-apis', 'test-api', 'schema.yaml');
      expect(fs.existsSync(schemaPath)).to.be.true;
    });

    it('should use provided cartridgeName when given', async () => {
      const cartridgeDir = path.join(tempDir, 'app_my_cartridge');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '', 'utf-8');

      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({
        apiName: 'my-endpoints',
        cartridgeName: 'app_my_cartridge',
      });

      expect(result.isError).to.be.undefined;
      const output = getResultJson<ScaffoldOutput>(result);
      expect(output.files).to.have.lengthOf(3);
      expect(output.postInstructions).to.include('app_my_cartridge');

      const scriptPath = path.join(tempDir, 'app_my_cartridge', 'cartridge', 'rest-apis', 'my-endpoints', 'script.js');
      expect(fs.existsSync(scriptPath)).to.be.true;
    });

    it('should pass apiType admin and include in generated schema', async () => {
      const cartridgeDir = path.join(tempDir, 'int_admin');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '', 'utf-8');

      const tool = createScaffoldCustomApiTool(loadServices);
      const result = await tool.handler({
        apiName: 'admin-only',
        cartridgeName: 'int_admin',
        apiType: 'admin',
      });

      expect(result.isError).to.be.undefined;
      const schemaPath = path.join(tempDir, 'int_admin', 'cartridge', 'rest-apis', 'admin-only', 'schema.yaml');
      expect(fs.existsSync(schemaPath)).to.be.true;
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      expect(schemaContent).to.include('AmOAuth2');
    });

    it('should pass apiDescription and include in generated schema', async () => {
      const cartridgeDir = path.join(tempDir, 'app_custom');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '', 'utf-8');

      const tool = createScaffoldCustomApiTool(loadServices);
      await tool.handler({
        apiName: 'described-api',
        apiDescription: 'My custom description for the API',
      });

      const schemaPath = path.join(tempDir, 'app_custom', 'cartridge', 'rest-apis', 'described-api', 'schema.yaml');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      expect(schemaContent).to.include('My custom description for the API');
    });

    it('should use projectRoot when provided', async () => {
      const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-mcp-scaffold-other-'));
      const cartridgeDir = path.join(otherDir, 'app_other');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '', 'utf-8');

      try {
        const tool = createScaffoldCustomApiTool(loadServices);
        const result = await tool.handler({
          apiName: 'other-api',
          projectRoot: otherDir,
        });

        expect(result.isError).to.be.undefined;
        const output = getResultJson<ScaffoldOutput>(result);
        expect(output.outputDir).to.equal(otherDir);
        const schemaPath = path.join(otherDir, 'app_other', 'cartridge', 'rest-apis', 'other-api', 'schema.yaml');
        expect(fs.existsSync(schemaPath)).to.be.true;
      } finally {
        fs.rmSync(otherDir, {recursive: true, force: true});
      }
    });
  });
});
