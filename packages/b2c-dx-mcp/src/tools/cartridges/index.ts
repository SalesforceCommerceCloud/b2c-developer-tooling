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
import type {ProjectContextInput, ProjectDirectoryInfo} from '../project-context.js';
import {
  createScriptsBackend,
  findAndDeployCartridges,
  getActiveCodeVersion,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {DeployResult, DeployOptions, CodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

/** Reminder shown after deploy so users add cartridges to the site cartridge path. */
const CARTRIDGE_PATH_REMINDER =
  "If this is a new or updated cartridge, add it to your site's cartridge path in Business Manager: " +
  'Sites → Manage Sites → [your site] → Settings tab → Cartridges field.';

/**
 * Input type for cartridge_deploy tool.
 */
interface CartridgeDeployInput extends ProjectContextInput {
  /** Path to directory containing cartridges. */
  cartridgeDirectory?: string;
  /** @deprecated Use cartridgeDirectory. */
  directory?: string;
  /** Only deploy these cartridge names */
  cartridges?: string[];
  /** Exclude these cartridge names */
  exclude?: string[];
  /** Reload code version after deploy */
  reload?: boolean;
}

/** Output type: deploy result plus reminder to update site cartridge path. */
interface CartridgeDeployOutput extends DeployResult {
  /** Effective project directory for configuration and relative path resolution. */
  projectDirectory: ProjectDirectoryInfo;
  /**
   * The absolute directory that was searched for cartridges. Reflected back so
   * the agent can confirm which location was used when `directory` was omitted
   * and the server fell back to the project directory or process cwd.
   */
  resolvedDirectory: string;
  /** Reminder to add deployed cartridges to the site cartridge path in Business Manager. */
  postInstructions?: string;
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
function createCartridgeDeployTool(
  loadServices: () => Promise<Services> | Services,
  injections?: CartridgeToolInjections,
): McpTool {
  const findAndDeployCartridgesFn = injections?.findAndDeployCartridges || findAndDeployCartridges;
  const getActiveCodeVersionFn = injections?.getActiveCodeVersion || getActiveCodeVersion;
  return createToolAdapter<CartridgeDeployInput, CartridgeDeployOutput>(
    {
      name: 'cartridge_deploy',
      description:
        'Find and deploy cartridges to B2C Commerce via WebDAV. Supports include/exclude filters and code-version reload. ' +
        "After deployment, add new cartridges to the site's cartridge path in Business Manager: Sites → Manage Sites → Settings tab → Cartridges.",
      toolsets: ['CARTRIDGES'],
      isGA: true,
      requiresInstance: true,
      usesProjectContext: true,
      inputSchema: {
        cartridgeDirectory: z
          .string()
          .optional()
          .describe(
            'Optional cartridge discovery root. Relative paths resolve from projectDirectory. Defaults to projectDirectory.',
          ),
        directory: z
          .string()
          .optional()
          .describe(
            'Deprecated alias for cartridgeDirectory. cartridgeDirectory takes precedence when both are supplied.',
          ),
        cartridges: z
          .array(z.string())
          .optional()
          .describe('Cartridge names to deploy; omit for all discovered cartridges.'),
        exclude: z.array(z.string()).optional().describe('Cartridge names to exclude after the include filter.'),
        reload: z.boolean().optional().describe('Reload the code version after deployment. Default: false.'),
      },
      async execute(args, context) {
        // Get instance from context (guaranteed by adapter when requiresInstance is true)
        const instance = context.b2cInstance!;
        const logger = getLogger();

        try {
          const scriptsBackend = createScriptsBackend({instance});
          // If no code version specified, get the active one
          let codeVersion = instance.config.codeVersion;
          if (!codeVersion) {
            logger.debug('No code version specified, getting active version...');
            const active = injections?.getActiveCodeVersion
              ? await getActiveCodeVersionFn(instance)
              : await scriptsBackend.getActiveCodeVersion();
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

          // Resolve directory path: relative paths are resolved relative to project directory, absolute paths are used as-is
          const projectDirectory = context.services.resolveProjectDirectory(args.projectDirectory);
          const directoryArgument = args.cartridgeDirectory ?? args.directory;
          const directory = context.services.resolveWithProjectDirectory(directoryArgument, args.projectDirectory);
          context.setResolvedDirectory('cartridgeDirectory', {
            path: directory,
            source: directoryArgument ? 'argument' : 'projectDirectory',
          });

          // Parse options
          const options: DeployOptions = {
            scriptsBackend,
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

          return {
            ...result,
            projectDirectory,
            resolvedDirectory: directory,
            postInstructions: CARTRIDGE_PATH_REMINDER,
          };
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
export function createCartridgesTools(
  loadServices: () => Promise<Services> | Services,
  injections?: CartridgeToolInjections,
): McpTool[] {
  return [createCartridgeDeployTool(loadServices, injections)];
}
