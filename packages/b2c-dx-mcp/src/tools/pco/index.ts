/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * PCO (Product Configuration Object) toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Product Configuration Object operations.
 * Created for testing MCP Elicitation support across multiple agentic IDEs.
 *
 * @module tools/pco
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Input type for pco_validate tool.
 */
interface PcoValidateInput {
  /** Product ID */
  productId?: string;
  /** Configuration object as JSON string or object */
  configuration?: Record<string, unknown> | string;
  /** Whether to return detailed validation errors */
  detailed?: boolean;
}

/**
 * Output type for pco_validate tool.
 */
interface PcoValidateOutput {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Validation errors, if any */
  errors?: string[];
  /** Validated configuration object */
  configuration?: Record<string, unknown>;
  /** Product ID that was validated */
  productId: string;
}

/**
 * Optional dependency injections for testing.
 */
interface PcoToolInjections {
  /** Mock validation function for testing */
  validatePco?: (productId: string, config: Record<string, unknown>) => {valid: boolean; errors?: string[]};
}

/**
 * Creates the pco_validate tool.
 *
 * Validates a Product Configuration Object (PCO) against a product schema.
 * This is a simple tool designed to test MCP Elicitation support.
 *
 * @param services - MCP services
 * @param injections - Optional dependency injections for testing
 * @param server - Optional MCP server instance for elicitation support
 * @returns The pco_validate tool
 */
function createPcoValidateTool(services: Services, injections?: PcoToolInjections, server?: McpServer): McpTool {
  const validatePcoFn =
    injections?.validatePco ||
    ((productId: string, config: Record<string, unknown>) => {
      // Simple validation logic for testing
      const errors: string[] = [];

      // Basic validation: check for required fields
      if (!config || typeof config !== 'object') {
        errors.push('Configuration must be a valid object');
      }

      // Check for common required fields
      if (config && !('id' in config) && !('productId' in config)) {
        errors.push('Configuration must include an id or productId field');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    });

  return createToolAdapter<PcoValidateInput, PcoValidateOutput>(
    {
      name: 'pco_validate',
      description:
        'Validates a Product Configuration Object (PCO) against a product schema. ' +
        'This tool is designed to test MCP Elicitation support across multiple agentic IDEs. ' +
        'REQUIRED: productId (string) - The product ID to validate against. ' +
        'OPTIONAL: configuration (object or JSON string) - The configuration object to validate. ' +
        'OPTIONAL: detailed (boolean) - Return detailed validation errors. ' +
        'If productId is missing, the tool will prompt you to provide it.',
      toolsets: ['SCAPI'],
      isGA: false,
      inputSchema: {
        productId: z
          .string()
          .optional()
          .describe(
            'The product ID to validate the configuration against. ' +
              'This parameter is required for validation. Please provide a product ID to proceed.',
          ),
        configuration: z
          .union([z.record(z.unknown()), z.string()])
          .optional()
          .describe(
            'The configuration object to validate. Can be provided as a JSON string or object. ' +
              'If not provided, returns validation schema information for the product.',
          ),
        detailed: z
          .boolean()
          .optional()
          .describe(
            'Whether to return detailed validation errors. When true, includes field-level error details. ' +
              'Defaults to false.',
          ),
      },
      async execute(args, context) {
        const {productId, configuration, detailed = false} = args;

        // Check for missing required parameter: productId
        // Use MCP Elicitation to request it from the user
        let resolvedProductId = productId;
        if (!resolvedProductId || resolvedProductId.trim() === '') {
          if (!context.elicit) {
            throw new Error(
              'Missing required parameter: productId. MCP Elicitation is not available. ' +
                'Please provide productId parameter when calling this tool.',
            );
          }

          // Request productId using MCP Elicitation
          const elicitationResponse = await context.elicit(
            'Please provide a product ID to validate the configuration against.\n\n' +
              'Example values: "product-123", "SKU-ABC-001", or any valid product identifier.',
            {
              productId: {
                type: 'string',
                title: 'Product ID',
                description: 'The product ID to validate the configuration against',
                minLength: 1,
              },
            },
          );

          // Handle elicitation response
          if (elicitationResponse.action === 'accept' && elicitationResponse.content?.productId) {
            resolvedProductId = String(elicitationResponse.content.productId);
          } else if (elicitationResponse.action === 'decline') {
            throw new Error('User declined to provide product ID. Operation cancelled.');
          } else if (elicitationResponse.action === 'cancel') {
            throw new Error('User cancelled the elicitation request. Operation cancelled.');
          } else {
            throw new Error('Invalid elicitation response: productId not provided.');
          }
        }

        // Parse configuration if it's a string
        let configObj: Record<string, unknown> | undefined;
        if (configuration) {
          if (typeof configuration === 'string') {
            try {
              configObj = JSON.parse(configuration) as Record<string, unknown>;
            } catch (error) {
              return {
                valid: false,
                errors: [`Invalid JSON in configuration: ${error instanceof Error ? error.message : String(error)}`],
                productId: resolvedProductId,
              };
            }
          } else {
            configObj = configuration;
          }
        }

        // If no configuration provided, return schema info
        if (!configObj) {
          return {
            valid: true,
            productId: resolvedProductId,
            configuration: {},
            errors: detailed ? ['No configuration provided. Schema validation skipped.'] : undefined,
          };
        }

        // Validate the configuration
        const validationResult = validatePcoFn(resolvedProductId, configObj);

        return {
          valid: validationResult.valid,
          errors: validationResult.errors,
          configuration: configObj,
          productId: resolvedProductId,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    services,
    server,
  );
}

/**
 * Creates all tools for the PCO toolset.
 *
 * @param services - MCP services
 * @param injections - Optional dependency injections for testing
 * @param server - Optional MCP server instance for elicitation support
 * @returns Array of MCP tools
 */
export function createPcoTools(services: Services, injections?: PcoToolInjections, server?: McpServer): McpTool[] {
  return [createPcoValidateTool(services, injections, server)];
}
