/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Cartridges toolset for B2C Commerce code operations.
 *
 * This toolset provides MCP tools for cartridge and code version management.
 *
 * @module tools/cartridges
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

/**
 * Input type for cartridge_deploy tool.
 */
interface CartridgeDeployInput {
  /** Path to directory containing cartridges (default: current directory) */
  directory?: string;
  /** Only deploy these cartridge names */
  cartridges?: string[];
  /** Exclude these cartridge names */
  exclude?: string[];
  /** Delete existing cartridges before upload */
  delete?: boolean;
  /** Reload code version after deploy */
  reload?: boolean;
}

/**
 * Output type for cartridge_deploy tool (placeholder).
 */
interface CartridgeDeployOutput {
  tool: string;
  status: string;
  message: string;
  input: CartridgeDeployInput;
  timestamp: string;
}

/**
 * Creates the cartridge_deploy tool.
 *
 * Deploys cartridges to a B2C Commerce instance via WebDAV:
 * 1. Finds cartridges by `.project` files in the specified directory
 * 2. Creates a zip archive of all cartridge directories
 * 3. Uploads the zip to WebDAV and triggers server-side unzip
 * 4. Optionally deletes existing cartridges before upload
 * 5. Optionally reloads the code version after deploy
 *
 * @param services - MCP services
 * @returns The cartridge_deploy tool
 */
function createCartridgeDeployTool(services: Services): McpTool {
  return createToolAdapter<CartridgeDeployInput, CartridgeDeployOutput>(
    {
      name: 'cartridge_deploy',
      description: '[PLACEHOLDER] Deploy cartridges to a B2C Commerce instance',
      toolsets: ['CARTRIDGES'],
      isGA: false,
      requiresInstance: true,
      inputSchema: {
        directory: z
          .string()
          .optional()
          .describe('Path to directory containing cartridges (default: current directory)'),
        cartridges: z.array(z.string()).optional().describe('Only deploy these cartridge names'),
        exclude: z.array(z.string()).optional().describe('Exclude these cartridge names'),
        delete: z.boolean().optional().describe('Delete existing cartridges before upload'),
        reload: z.boolean().optional().describe('Reload code version after deploy'),
      },
      async execute(args, context) {
        // Placeholder implementation
        const timestamp = new Date().toISOString();

        // TODO: Remove this log when implementing
        const logger = getLogger();
        logger.debug({context}, 'cartridge_deploy context');

        // TODO: When implementing, use context.b2cInstance:
        // import { findAndDeployCartridges } from '@salesforce/b2c-tooling-sdk/operations/code';
        //
        // const directory = args.directory || '.';
        // const result = await findAndDeployCartridges(context.b2cInstance!, directory, {
        //   include: args.cartridges,
        //   exclude: args.exclude,
        //   delete: args.delete,
        //   reload: args.reload,
        // });
        // return result;

        return {
          tool: 'cartridge_deploy',
          status: 'placeholder',
          message:
            "This is a placeholder implementation for 'cartridge_deploy'. The actual implementation is coming soon.",
          input: args,
          timestamp,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    services,
  );
}

/**
 * Creates all tools for the CARTRIDGES toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createCartridgesTools(services: Services): McpTool[] {
  return [createCartridgeDeployTool(services)];
}
