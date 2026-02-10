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
import {findAndDeployCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {DeployResult, DeployOptions} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
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
  /** Reload code version after deploy */
  reload?: boolean;
}

/**
 * Optional dependency injections for testing.
 */
interface CartridgeToolInjections {
  /** Mock findAndDeployCartridges function for testing */
  findAndDeployCartridges?: (instance: B2CInstance, directory: string, options: DeployOptions) => Promise<DeployResult>;
}

/**
 * Creates the cartridge_deploy tool.
 *
 * Deploys cartridges to a B2C Commerce instance via WebDAV:
 * 1. Finds cartridges by `.project` files in the specified directory
 * 2. Creates a zip archive of all cartridge directories
 * 3. Uploads the zip to WebDAV and triggers server-side unzip
 * 4. Optionally reloads the code version after deploy
 *
 * @param services - MCP services
 * @param injections - Optional dependency injections for testing
 * @returns The cartridge_deploy tool
 */
function createCartridgeDeployTool(services: Services, injections?: CartridgeToolInjections): McpTool {
  const findAndDeployCartridgesFn = injections?.findAndDeployCartridges || findAndDeployCartridges;
  return createToolAdapter<CartridgeDeployInput, DeployResult>(
    {
      name: 'cartridge_deploy',
      description: 'Deploy cartridges to a B2C Commerce instance via WebDAV',
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
        reload: z.boolean().optional().describe('Reload code version after deploy'),
      },
      async execute(args, context) {
        // Get instance from context (guaranteed by adapter when requiresInstance is true)
        const instance = context.b2cInstance!;

        // Default directory to current directory
        const directory = args.directory || '.';

        // Parse options
        const options: DeployOptions = {
          include: args.cartridges,
          exclude: args.exclude,
          reload: args.reload,
        };

        // Log all computed variables before deploying
        const logger = getLogger();
        logger.debug(
          {
            directory,
            include: options.include,
            exclude: options.exclude,
            reload: options.reload,
          },
          '[Cartridges] Deploying cartridges with computed options',
        );

        // Deploy cartridges
        const result = await findAndDeployCartridgesFn(instance, directory, options);

        return result;
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
 * @param injections - Optional dependency injections for testing
 * @returns Array of MCP tools
 */
export function createCartridgesTools(services: Services, injections?: CartridgeToolInjections): McpTool[] {
  return [createCartridgeDeployTool(services, injections)];
}
