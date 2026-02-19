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

import path from 'node:path';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {findAndDeployCartridges, getActiveCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {DeployResult, DeployOptions, CodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
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
  /** Mock getActiveCodeVersion function for testing */
  getActiveCodeVersion?: (instance: B2CInstance) => Promise<CodeVersion | undefined>;
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
 * @param loadServices - Function that loads configuration and returns Services instance
 * @param injections - Optional dependency injections for testing
 * @returns The cartridge_deploy tool
 */
function createCartridgeDeployTool(loadServices: () => Services, injections?: CartridgeToolInjections): McpTool {
  const findAndDeployCartridgesFn = injections?.findAndDeployCartridges || findAndDeployCartridges;
  const getActiveCodeVersionFn = injections?.getActiveCodeVersion || getActiveCodeVersion;
  return createToolAdapter<CartridgeDeployInput, DeployResult>(
    {
      name: 'cartridge_deploy',
      description:
        'Finds and deploys cartridges to a B2C Commerce instance via WebDAV. ' +
        'Searches the directory for cartridges (by .project files), applies include/exclude filters, ' +
        'creates a zip archive, uploads via WebDAV, and optionally reloads the code version. ' +
        'Use this tool to deploy custom code cartridges for SFRA or other B2C Commerce code. ' +
        'Requires the instance to have a code version configured.',
      toolsets: ['CARTRIDGES'],
      isGA: false,
      requiresInstance: true,
      inputSchema: {
        directory: z
          .string()
          .optional()
          .describe(
            'Path to directory to search for cartridges. Defaults to current working directory if not specified. ' +
              'The tool will recursively search this directory for .project files to identify cartridges.',
          ),
        cartridges: z
          .array(z.string())
          .optional()
          .describe(
            'Array of cartridge names to include in the deployment. If not specified, all cartridges found in the directory are deployed. ' +
              'Use this to selectively deploy specific cartridges when you have multiple cartridges but only want to update some.',
          ),
        exclude: z
          .array(z.string())
          .optional()
          .describe(
            'Array of cartridge names to exclude from the deployment. Use this to skip deploying certain cartridges, ' +
              'such as third-party or unchanged cartridges. Applied after the include filter.',
          ),
        reload: z
          .boolean()
          .optional()
          .describe(
            'Whether to reload (re-activate) the code version after deployment. ' +
              'Set to true to make the deployed code immediately active on the instance. ' +
              'Defaults to false. Use this when you want changes to take effect right away.',
          ),
      },
      async execute(args, context) {
        // Get instance from context (guaranteed by adapter when requiresInstance is true)
        const instance = context.b2cInstance!;
        const logger = getLogger();

        try {
          // If no code version specified, get the active one
          let codeVersion = instance.config.codeVersion;
          if (!codeVersion) {
            logger.debug('No code version specified, getting active version...');
            const active = await getActiveCodeVersionFn(instance);
            if (!active?.id) {
              throw new Error(
                'No code version specified and no active code version found. ' +
                  'Specify a code version using one of: ' +
                  '--code-version flag, SFCC_CODE_VERSION environment variable, ' +
                  'or code-version field in dw.json configuration file.',
              );
            }
            codeVersion = active.id;
            instance.config.codeVersion = codeVersion;
          }

          // Resolve directory path: relative paths are resolved relative to working directory, absolute paths are used as-is
          const directory = args.directory
            ? path.isAbsolute(args.directory)
              ? args.directory
              : path.resolve(context.services.getWorkingDirectory(), args.directory)
            : context.services.getWorkingDirectory();

          // Parse options
          const options: DeployOptions = {
            include: args.cartridges,
            exclude: args.exclude,
            reload: args.reload,
          };

          // Log all computed variables before deploying
          logger.debug(
            {
              directory,
              codeVersion,
              include: options.include,
              exclude: options.exclude,
              reload: options.reload,
            },
            '[Cartridges] Deploying cartridges with computed options',
          );

          // Deploy cartridges
          const result = await findAndDeployCartridgesFn(instance, directory, options);

          return result;
        } catch (error) {
          // Handle communication and authentication errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to communicate with B2C instance. Check your authentication credentials and network connection. ` +
              `If no code version is specified, ensure the instance is accessible and has an active code version. ` +
              `Original error: ${errorMessage}`,
          );
        }
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}

/**
 * Creates all tools for the CARTRIDGES toolset.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @param injections - Optional dependency injections for testing
 * @returns Array of MCP tools
 */
export function createCartridgesTools(loadServices: () => Services, injections?: CartridgeToolInjections): McpTool[] {
  return [createCartridgeDeployTool(loadServices, injections)];
}
