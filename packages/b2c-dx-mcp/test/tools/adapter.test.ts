/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {z} from 'zod';
import {createToolAdapter, textResult, jsonResult, errorResult} from '../../src/tools/adapter.js';
import {Services} from '../../src/services.js';
import type {ToolExecutionContext} from '../../src/tools/adapter.js';
import type {ToolResult} from '../../src/utils/types.js';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';

// Create a mock services instance for testing
function createMockServices(options?: {mrtAuth?: AuthStrategy}): Services {
  return new Services({
    mrtConfig: options?.mrtAuth ? {auth: options.mrtAuth} : undefined,
  });
}

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

describe('tools/adapter', () => {
  describe('textResult', () => {
    it('should create a text result with the provided message', () => {
      const result = textResult('Hello, world!');

      expect(result).to.deep.equal({
        content: [{type: 'text', text: 'Hello, world!'}],
      });
    });

    it('should not have isError property', () => {
      const result = textResult('Success');

      expect(result).to.not.have.property('isError');
    });
  });

  describe('errorResult', () => {
    it('should create an error result with the provided message', () => {
      const result = errorResult('Something went wrong');

      expect(result).to.deep.equal({
        content: [{type: 'text', text: 'Something went wrong'}],
        isError: true,
      });
    });

    it('should have isError set to true', () => {
      const result = errorResult('Error message');

      expect(result.isError).to.be.true;
    });
  });

  describe('jsonResult', () => {
    it('should create a JSON result with default indentation', () => {
      const data = {name: 'test', value: 123};
      const result = jsonResult(data);

      expect(result).to.deep.equal({
        content: [{type: 'text', text: JSON.stringify(data, null, 2)}],
      });
    });

    it('should respect custom indentation', () => {
      const data = {key: 'value'};
      const result = jsonResult(data, 4);

      expect(result).to.deep.equal({
        content: [{type: 'text', text: JSON.stringify(data, null, 4)}],
      });
    });

    it('should handle arrays', () => {
      const data = ['a', 'b', 'c'];
      const result = jsonResult(data);
      const text = getResultText(result);

      expect(text).to.include('[\n');
      expect(text).to.include('"a"');
    });

    it('should handle nested objects', () => {
      const data = {outer: {inner: {value: true}}};
      const result = jsonResult(data);
      const text = getResultText(result);

      expect(text).to.include('"outer"');
      expect(text).to.include('"inner"');
    });

    it('should not have isError property', () => {
      const result = jsonResult({success: true});

      expect(result).to.not.have.property('isError');
    });
  });

  describe('createToolAdapter', () => {
    it('should create a tool with correct metadata', () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'test_tool',
          description: 'A test tool',
          toolsets: ['CARTRIDGES'],
          isGA: true,
          requiresInstance: false,
          inputSchema: {
            message: z.string().describe('A message'),
          },
          execute: async () => 'result',
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      expect(tool.name).to.equal('test_tool');
      expect(tool.description).to.equal('A test tool');
      expect(tool.toolsets).to.deep.equal(['CARTRIDGES']);
      expect(tool.isGA).to.be.true;
    });

    it('should default isGA to true', () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'test_tool',
          description: 'A test tool',
          toolsets: ['MRT'],
          requiresInstance: false,
          inputSchema: {},
          execute: async () => 'result',
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      expect(tool.isGA).to.be.true;
    });

    it('should validate input using Zod schema', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'validator_tool',
          description: 'Validates input',
          toolsets: ['CARTRIDGES'],
          requiresInstance: false,
          inputSchema: {
            name: z.string().min(1).describe('Name is required'),
            count: z.number().positive().describe('Count must be positive'),
          },
          execute: async (args: {name: string; count: number}) => `Received: ${args.name}, ${args.count}`,
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      // Test with valid input
      const validResult = await tool.handler({name: 'test', count: 5});
      expect(validResult.isError).to.be.undefined;
      expect(getResultText(validResult)).to.equal('Received: test, 5');

      // Test with missing required field
      const missingResult = await tool.handler({count: 5});
      expect(missingResult.isError).to.be.true;
      expect(getResultText(missingResult)).to.include('Invalid input');
      expect(getResultText(missingResult)).to.include('name');

      // Test with invalid type
      const invalidTypeResult = await tool.handler({name: 'test', count: 'not-a-number'});
      expect(invalidTypeResult.isError).to.be.true;
      expect(getResultText(invalidTypeResult)).to.include('Invalid input');
    });

    it('should return error for invalid input', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'strict_tool',
          description: 'Has strict validation',
          toolsets: ['SCAPI'],
          requiresInstance: false,
          inputSchema: {
            email: z.string().email().describe('Must be a valid email'),
          },
          execute: async (args: {email: string}) => args.email,
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      const result = await tool.handler({email: 'not-an-email'});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Invalid input');
      expect(getResultText(result)).to.include('email');
    });

    it('should handle execution errors', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'error_tool',
          description: 'Throws an error',
          toolsets: ['MRT'],
          requiresInstance: false,
          inputSchema: {},
          async execute() {
            throw new Error('Something bad happened');
          },
          formatOutput: () => textResult('This should not be reached'),
        },
        services,
      );

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Execution error');
      expect(getResultText(result)).to.include('Something bad happened');
    });

    it('should handle thrown errors gracefully', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'string_error_tool',
          description: 'Throws an error with a custom message',
          toolsets: ['PWAV3'],
          requiresInstance: false,
          inputSchema: {},
          async execute() {
            throw new Error('A custom error message');
          },
          formatOutput: () => textResult('This should not be reached'),
        },
        services,
      );

      const result = await tool.handler({});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Execution error');
      expect(getResultText(result)).to.include('A custom error message');
    });

    it('should pass services to execute function', async () => {
      const services = createMockServices();
      let receivedServices: Services | undefined;

      const tool = createToolAdapter(
        {
          name: 'services_tool',
          description: 'Uses services',
          toolsets: ['STOREFRONTNEXT'],
          requiresInstance: false,
          inputSchema: {},
          async execute(_args, context) {
            receivedServices = context.services;
            return 'done';
          },
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      await tool.handler({});

      expect(receivedServices).to.equal(services);
    });

    it('should support tools that do not require instance', async () => {
      const services = createMockServices();
      let contextReceived: ToolExecutionContext | undefined;

      const tool = createToolAdapter(
        {
          name: 'no_instance_tool',
          description: 'Does not need B2CInstance',
          toolsets: ['PWAV3'],
          requiresInstance: false,
          inputSchema: {
            projectName: z.string().describe('Project name'),
          },
          async execute(args: {projectName: string}, context) {
            contextReceived = context;
            return `Created project: ${args.projectName}`;
          },
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      const result = await tool.handler({projectName: 'my-storefront'});

      expect(result.isError).to.be.undefined;
      expect(getResultText(result)).to.equal('Created project: my-storefront');
      expect(contextReceived).to.not.be.undefined;
      expect(contextReceived?.b2cInstance).to.be.undefined;
    });

    it('should use jsonResult for complex output', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'json_output_tool',
          description: 'Returns JSON',
          toolsets: ['SCAPI'],
          requiresInstance: false,
          inputSchema: {},
          execute: async () => ({
            status: 'success',
            items: [{id: 1}, {id: 2}],
          }),
          formatOutput: (output) => jsonResult(output),
        },
        services,
      );

      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      const parsed = JSON.parse(getResultText(result));
      expect(parsed.status).to.equal('success');
      expect(parsed.items).to.have.lengthOf(2);
    });

    it('should support multiple toolsets', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'multi_toolset_tool',
          description: 'Belongs to multiple toolsets',
          toolsets: ['PWAV3', 'STOREFRONTNEXT'],
          requiresInstance: false,
          inputSchema: {},
          execute: async () => 'multi-toolset result',
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      expect(tool.toolsets).to.include('PWAV3');
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
    });

    it('should handle optional schema fields', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'optional_fields_tool',
          description: 'Has optional fields',
          toolsets: ['MRT'],
          requiresInstance: false,
          inputSchema: {
            required: z.string().describe('Required field'),
            optional: z.string().optional().describe('Optional field'),
          },
          execute: async (args: {required: string; optional?: string}) =>
            `required: ${args.required}, optional: ${args.optional || 'not provided'}`,
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      // Without optional field
      const result1 = await tool.handler({required: 'value'});
      expect(result1.isError).to.be.undefined;
      expect(getResultText(result1)).to.equal('required: value, optional: not provided');

      // With optional field
      const result2 = await tool.handler({required: 'value', optional: 'present'});
      expect(result2.isError).to.be.undefined;
      expect(getResultText(result2)).to.equal('required: value, optional: present');
    });

    it('should handle array schema fields', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'array_tool',
          description: 'Accepts array input',
          toolsets: ['CARTRIDGES'],
          requiresInstance: false,
          inputSchema: {
            items: z.array(z.string()).describe('Array of strings'),
          },
          execute: async (args: {items: string[]}) => args.items.join(', '),
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      const result = await tool.handler({items: ['a', 'b', 'c']});

      expect(result.isError).to.be.undefined;
      expect(getResultText(result)).to.equal('a, b, c');
    });

    it('should provide detailed validation error messages', async () => {
      const services = createMockServices();

      const tool = createToolAdapter(
        {
          name: 'detailed_errors_tool',
          description: 'Provides detailed errors',
          toolsets: ['SCAPI'],
          requiresInstance: false,
          inputSchema: {
            name: z.string().min(3, 'Name must be at least 3 characters'),
            age: z.number().min(0, 'Age must be non-negative').max(150, 'Age must be at most 150'),
          },
          execute: async () => 'success',
          formatOutput: (output) => textResult(output),
        },
        services,
      );

      // Test with too short name
      const result = await tool.handler({name: 'ab', age: 25});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Name must be at least 3 characters');
    });

    describe('requiresInstance', () => {
      it('should default requiresInstance to false', async () => {
        const services = createMockServices();
        let contextReceived: ToolExecutionContext | undefined;

        const tool = createToolAdapter(
          {
            name: 'default_instance_tool',
            description: 'Default behavior',
            toolsets: ['CARTRIDGES'],
            inputSchema: {},
            async execute(_args, context) {
              contextReceived = context;
              return 'result';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        // Default is now false, so tool should execute without instance
        const result = await tool.handler({});

        expect(result.isError).to.be.undefined;
        expect(contextReceived?.b2cInstance).to.be.undefined;
      });

      it('should return error when B2C instance is not configured', async () => {
        // Services with no b2cInstance (resolution failed or not configured)
        const services = createMockServices();

        const tool = createToolAdapter(
          {
            name: 'bad_config_tool',
            description: 'Has bad config',
            toolsets: ['CARTRIDGES'],
            requiresInstance: true,
            inputSchema: {},
            execute: async () => 'should not reach here',
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.true;
        expect(getResultText(result)).to.include('B2C instance error');
      });
    });

    describe('requiresMrtAuth', () => {
      const ORIGINAL_ENV = {...process.env};

      afterEach(() => {
        // Restore original env
        process.env = {...ORIGINAL_ENV};
      });

      it('should default requiresMrtAuth to false', async () => {
        const services = createMockServices();
        let contextReceived: ToolExecutionContext | undefined;

        const tool = createToolAdapter(
          {
            name: 'default_mrt_auth_tool',
            description: 'Default MRT auth behavior',
            toolsets: ['MRT'],
            inputSchema: {},
            async execute(_args, context) {
              contextReceived = context;
              return 'result';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.undefined;
        expect(contextReceived?.mrtConfig?.auth).to.be.undefined;
      });

      it('should provide mrtConfig in context when auth is configured', async () => {
        // Use resolveConfig + Services.fromResolvedConfig (simulating what mcp.ts does at startup)
        const config = resolveConfig({mrtApiKey: 'test-api-key-12345'});
        const services = Services.fromResolvedConfig(config);
        let contextReceived: ToolExecutionContext | undefined;

        const tool = createToolAdapter(
          {
            name: 'mrt_auth_success_tool',
            description: 'Uses MRT auth',
            toolsets: ['MRT'],
            requiresMrtAuth: true,
            inputSchema: {},
            async execute(_args, context) {
              contextReceived = context;
              return 'success';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.undefined;
        expect(contextReceived?.mrtConfig?.auth).to.not.be.undefined;
        // Verify auth has fetch method (AuthStrategy interface)
        expect(contextReceived?.mrtConfig?.auth).to.have.property('fetch');
      });

      it('should support cloudOrigin option in resolveConfig()', async () => {
        // resolveConfig() accepts cloudOrigin for environment-specific config
        // Note: oclif handles env var fallback for --api-key flag, so we pass mrtApiKey explicitly here
        const config = resolveConfig({mrtApiKey: 'staging-api-key'}, {cloudOrigin: 'https://cloud-staging.mobify.com'});
        const services = Services.fromResolvedConfig(config);
        let contextReceived: ToolExecutionContext | undefined;

        const tool = createToolAdapter(
          {
            name: 'mrt_cloud_origin_tool',
            description: 'Tests cloud origin support',
            toolsets: ['MRT'],
            requiresMrtAuth: true,
            inputSchema: {},
            async execute(_args, context) {
              contextReceived = context;
              return 'success';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.undefined;
        expect(contextReceived?.mrtConfig?.auth).to.not.be.undefined;
        // Verify origin field is present in mrtConfig (may be undefined if not set)
        expect(contextReceived?.mrtConfig).to.have.property('origin');
      });

      it('should pass mrtOrigin through to mrtConfig.origin in context', async () => {
        // Test that mrtOrigin from config is passed through to context.mrtConfig.origin
        const config = resolveConfig({
          mrtApiKey: 'test-api-key-12345',
          mrtOrigin: 'https://custom-cloud.mobify.com',
        });
        const services = Services.fromResolvedConfig(config);
        let contextReceived: ToolExecutionContext | undefined;

        const tool = createToolAdapter(
          {
            name: 'mrt_origin_tool',
            description: 'Tests mrtOrigin passthrough',
            toolsets: ['MRT'],
            requiresMrtAuth: true,
            inputSchema: {},
            async execute(_args, context) {
              contextReceived = context;
              return 'success';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.undefined;
        expect(contextReceived?.mrtConfig?.auth).to.not.be.undefined;
        expect(contextReceived?.mrtConfig?.origin).to.equal('https://custom-cloud.mobify.com');
      });

      it('should support both requiresInstance and requiresMrtAuth being false', async () => {
        const services = createMockServices();
        let contextReceived: ToolExecutionContext | undefined;

        const tool = createToolAdapter(
          {
            name: 'no_auth_tool',
            description: 'Local tool without auth',
            toolsets: ['PWAV3'],
            requiresInstance: false,
            requiresMrtAuth: false,
            inputSchema: {},
            async execute(_args, context) {
              contextReceived = context;
              return 'local operation';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.undefined;
        expect(contextReceived?.b2cInstance).to.be.undefined;
        expect(contextReceived?.mrtConfig?.auth).to.be.undefined;
        expect(contextReceived?.services).to.equal(services);
      });

      it('should return error when requiresMrtAuth is true but no auth configured', async () => {
        // No mrtConfig.auth provided to Services
        const services = createMockServices({});
        const tool = createToolAdapter(
          {
            name: 'mrt_no_auth_tool',
            description: 'Requires MRT auth but none configured',
            toolsets: ['MRT'],
            requiresMrtAuth: true,
            inputSchema: {},
            async execute() {
              return 'should not reach here';
            },
            formatOutput: (output) => textResult(output),
          },
          services,
        );

        const result = await tool.handler({});

        expect(result.isError).to.be.true;
        expect(getResultText(result)).to.include('MRT auth error');
        expect(getResultText(result)).to.include('MRT API key required');
      });
    });

    describe('formatOutput variations', () => {
      it('should allow custom formatOutput logic', async () => {
        const services = createMockServices();

        interface Item {
          id: number;
          name: string;
        }

        const tool = createToolAdapter(
          {
            name: 'custom_format_tool',
            description: 'Has custom formatting',
            toolsets: ['MRT'],
            requiresInstance: false,
            inputSchema: {
              items: z.array(z.object({id: z.number(), name: z.string()})),
            },
            execute: async (args: {items: Item[]}) => args.items,
            formatOutput(items: Item[]) {
              if (items.length === 0) {
                return textResult('No items found.');
              }
              const list = items.map((item) => `- ${item.id}: ${item.name}`).join('\n');
              return textResult(`Found ${items.length} items:\n${list}`);
            },
          },
          services,
        );

        // Empty list
        const emptyResult = await tool.handler({items: []});
        expect(getResultText(emptyResult)).to.equal('No items found.');

        // With items
        const itemsResult = await tool.handler({
          items: [
            {id: 1, name: 'First'},
            {id: 2, name: 'Second'},
          ],
        });
        expect(getResultText(itemsResult)).to.include('Found 2 items:');
        expect(getResultText(itemsResult)).to.include('1: First');
        expect(getResultText(itemsResult)).to.include('2: Second');
      });

      it('should allow conditional error/success in formatOutput', async () => {
        const services = createMockServices();

        type OperationResult = {success: boolean; message: string};

        const tool = createToolAdapter<{operation: string}, OperationResult>(
          {
            name: 'conditional_format_tool',
            description: 'Conditionally formats output',
            toolsets: ['SCAPI'],
            requiresInstance: false,
            inputSchema: {
              operation: z.string(),
            },
            async execute(args): Promise<OperationResult> {
              if (args.operation === 'fail') {
                return {success: false, message: 'Operation failed'};
              }
              return {success: true, message: 'Operation succeeded'};
            },
            formatOutput(result: OperationResult): ToolResult {
              if (!result.success) {
                return errorResult(result.message);
              }
              return textResult(result.message);
            },
          },
          services,
        );

        const successResult = await tool.handler({operation: 'succeed'});
        expect(successResult.isError).to.be.undefined;
        expect(getResultText(successResult)).to.equal('Operation succeeded');

        const failResult = await tool.handler({operation: 'fail'});
        expect(failResult.isError).to.be.true;
        expect(getResultText(failResult)).to.equal('Operation failed');
      });
    });
  });
});
