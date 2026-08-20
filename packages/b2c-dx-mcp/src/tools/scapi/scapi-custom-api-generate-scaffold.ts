/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI Custom API Generate Scaffold tool.
 *
 * Generates a new custom SCAPI endpoint using the SDK's custom-api scaffold
 * (schema.yaml, api.json, script.js).
 *
 * @module tools/scapi/scapi-custom-api-generate-scaffold
 */

import {z} from 'zod';
import {createToolAdapter, jsonResult, errorResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
import type {ProjectContextInput, ProjectDirectoryInfo} from '../project-context.js';
import {
  createScaffoldRegistry,
  generateFromScaffold,
  resolveScaffoldParameters,
  resolveOutputDirectory,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import type {Scaffold, ResolvedParameters, ResolveParametersOptions} from '@salesforce/b2c-tooling-sdk/scaffold';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';

const CUSTOM_API_SCAFFOLD_ID = 'custom-api';

/** Optional overrides for testing (scaffold not found, missing required). */
export interface ScaffoldCustomApiExecuteOverrides {
  getScaffold?: (id: string, opts: {projectRoot: string}) => Promise<null | Scaffold>;
  resolveScaffoldParameters?: (scaffold: Scaffold, opts: ResolveParametersOptions) => Promise<ResolvedParameters>;
}

/**
 * Input schema for scapi_custom_api_generate_scaffold tool.
 * Parameters match the custom-api scaffold: apiName, apiType, cartridgeName, etc.
 */
interface ScaffoldCustomApiInput extends ProjectContextInput {
  /** API name (kebab-case, e.g. my-products). Required. */
  apiName: string;
  /** Cartridge name that will contain the API. Optional; defaults to first cartridge found in project. */
  cartridgeName?: string;
  /** API type: admin (no siteId) or shopper (siteId, customer-facing). Default: shopper */
  apiType?: 'admin' | 'shopper';
  /** Short description of the API. Default: "A custom B2C Commerce API" */
  apiDescription?: string;
  /** Project root for cartridge discovery and output. Default: MCP project directory */
  cartridgeDirectory?: string;
  /** @deprecated Use cartridgeDirectory. */
  projectRoot?: string;
  /** Output directory override. Default: scaffold default or project root */
  outputDirectory?: string;
  /** @deprecated Use outputDirectory. */
  outputDir?: string;
}

/**
 * Output schema for scapi_custom_api_generate_scaffold tool.
 */
interface ScaffoldCustomApiOutput {
  scaffold: string;
  outputDir: string;
  dryRun: boolean;
  files: Array<{
    path: string;
    action: string;
    skipReason?: string;
  }>;
  postInstructions?: string;
  error?: string;
  projectDirectory: ProjectDirectoryInfo;
  projectRoot: string;
}

/**
 * Core execute logic for the custom API scaffold tool.
 * Exported for tests so we can inject getScaffold / resolveScaffoldParameters and cover error branches.
 */
export async function executeScaffoldCustomApi(
  args: ScaffoldCustomApiInput,
  services: Services,
  overrides?: ScaffoldCustomApiExecuteOverrides,
): Promise<ScaffoldCustomApiOutput> {
  const projectDirectory = services.resolveProjectDirectory(args.projectDirectory);
  const projectRoot = services.resolveWithProjectDirectory(
    args.cartridgeDirectory ?? args.projectRoot,
    args.projectDirectory,
  );

  const getScaffold =
    overrides?.getScaffold ??
    (async (id: string, opts: {projectRoot: string}) => {
      const registry = createScaffoldRegistry();
      return registry.getScaffold(id, opts);
    });
  const scaffold = await getScaffold(CUSTOM_API_SCAFFOLD_ID, {projectRoot});

  if (!scaffold) {
    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir: projectRoot,
      dryRun: false,
      files: [],
      projectDirectory,
      projectRoot,
      error: `Scaffold not found: ${CUSTOM_API_SCAFFOLD_ID}. Ensure @salesforce/b2c-tooling-sdk is installed.`,
    };
  }

  const cartridges = findCartridges(projectRoot);
  if (cartridges.length === 0) {
    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir: projectRoot,
      dryRun: false,
      files: [],
      projectDirectory,
      projectRoot,
      error:
        'No cartridges found in project. Custom API scaffold requires an existing cartridge. Create a cartridge first: use `b2c scaffold cartridge --name app_custom`, or manually create a directory with a `.project` file (e.g., cartridges/app_custom/.project).',
    };
  }

  let cartridgeName = args.cartridgeName;
  if (!cartridgeName) {
    cartridgeName = cartridges[0].name;
  }

  const providedVariables: Record<string, boolean | string> = {
    apiName: args.apiName,
    cartridgeName,
    includeExampleEndpoints: true,
  };
  if (args.apiType !== undefined) providedVariables.apiType = args.apiType;
  if (args.apiDescription !== undefined) providedVariables.apiDescription = args.apiDescription;

  const resolveParams = overrides?.resolveScaffoldParameters ?? resolveScaffoldParameters;
  const resolved = await resolveParams(scaffold, {
    providedVariables,
    projectRoot,
    useDefaults: true,
  });

  if (resolved.errors.length > 0) {
    const message = resolved.errors.map((e) => `${e.parameter}: ${e.message}`).join('; ');
    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir: projectRoot,
      dryRun: false,
      files: [],
      projectDirectory,
      projectRoot,
      error: `Parameter validation failed: ${message}`,
    };
  }

  const missingRequired = resolved.missingParameters.filter((p) => p.required);
  if (missingRequired.length > 0) {
    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir: projectRoot,
      dryRun: false,
      files: [],
      projectDirectory,
      projectRoot,
      error: `Missing required parameter: ${missingRequired[0].name}. For cartridgeName, ensure the cartridge exists in the project (under projectRoot).`,
    };
  }

  const outputDir = resolveOutputDirectory({
    outputDir: args.outputDirectory ?? args.outputDir,
    scaffold,
    projectRoot,
  });

  try {
    const result = await generateFromScaffold(scaffold, {
      outputDir,
      variables: resolved.variables as Record<string, boolean | string>,
      dryRun: false,
      force: false,
    });

    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir,
      dryRun: result.dryRun,
      files: result.files.map((f) => ({
        path: f.path,
        action: f.action,
        skipReason: f.skipReason,
      })),
      postInstructions: result.postInstructions,
      projectDirectory,
      projectRoot,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir,
      dryRun: false,
      files: [],
      projectDirectory,
      projectRoot,
      error: `Scaffold generation failed: ${message}`,
    };
  }
}

/**
 * Creates the scapi_custom_api_generate_scaffold tool.
 *
 * Uses @salesforce/b2c-tooling-sdk scaffold: registry, resolveScaffoldParameters,
 * resolveOutputDirectory, generateFromScaffold. cartridgeName must be a cartridge
 * discovered under projectRoot (e.g. from .project or cartridges/).
 *
 * @param loadServices - Function that returns Services (used by adapter on each call).
 * @param executeOverrides - Optional overrides for testing (getScaffold, resolveScaffoldParameters).
 */
export function createScaffoldCustomApiTool(
  loadServices: () => Promise<Services> | Services,
  executeOverrides?: ScaffoldCustomApiExecuteOverrides,
): McpTool {
  return createToolAdapter<ScaffoldCustomApiInput, ScaffoldCustomApiOutput>(
    {
      name: 'scapi_custom_api_generate_scaffold',
      description:
        'Generate a custom SCAPI endpoint scaffold in an existing cartridge: OpenAPI schema, api.json, and script.js. apiName must be kebab-case.',
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: true,
      requiresInstance: false,
      usesProjectContext: true,
      inputSchema: {
        apiName: z.string().min(1).describe('Kebab-case API name starting with a lowercase letter.'),
        cartridgeName: z
          .string()
          .min(1)
          .nullish()
          .describe('Target cartridge; defaults to the first discovered cartridge.'),
        apiType: z
          .enum(['admin', 'shopper'])
          .optional()
          .describe('Admin (no siteId) or shopper (siteId, customer-facing). Default: shopper'),
        apiDescription: z.string().optional().describe('Short description of the API.'),
        cartridgeDirectory: z
          .string()
          .nullish()
          .describe(
            'Optional cartridge discovery root, resolved relative to projectDirectory. Defaults to projectDirectory.',
          ),
        projectRoot: z
          .string()
          .nullish()
          .describe('Deprecated alias for cartridgeDirectory. cartridgeDirectory takes precedence.'),
        outputDirectory: z
          .string()
          .optional()
          .describe('Optional output directory. Relative paths resolve from cartridgeDirectory.'),
        outputDir: z
          .string()
          .optional()
          .describe('Deprecated alias for outputDirectory. outputDirectory takes precedence.'),
      },
      async execute(args, context) {
        const output = await executeScaffoldCustomApi(args, context.services, executeOverrides);
        context.setResolvedDirectory('cartridgeDirectory', {
          path: output.projectRoot,
          source: args.cartridgeDirectory || args.projectRoot ? 'argument' : 'projectDirectory',
        });
        context.setResolvedDirectory('outputDirectory', {
          path: output.outputDir,
          source: args.outputDirectory || args.outputDir ? 'argument' : 'projectDirectory',
        });
        return output;
      },
      formatOutput(output) {
        if (output.error) {
          return errorResult(output.error);
        }
        return jsonResult(output);
      },
    },
    loadServices,
  );
}
