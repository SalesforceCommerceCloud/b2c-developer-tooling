/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI Custom API Scaffold tool.
 *
 * Generates a new custom SCAPI endpoint using the SDK's custom-api scaffold
 * (schema.yaml, api.json, script.js).
 *
 * @module tools/scapi/scapi-custom-api-scaffold
 */

import path from 'node:path';
import {z} from 'zod';
import {createToolAdapter, jsonResult, errorResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
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
 * Input schema for scapi_custom_api_scaffold tool.
 * Parameters match the custom-api scaffold: apiName, apiType, cartridgeName, etc.
 */
interface ScaffoldCustomApiInput {
  /** API name (kebab-case, e.g. my-products). Required. */
  apiName: string;
  /** Cartridge name that will contain the API. Optional; defaults to first cartridge found in project. */
  cartridgeName?: string;
  /** API type: admin (no siteId) or shopper (siteId, customer-facing). Default: shopper */
  apiType?: 'admin' | 'shopper';
  /** Short description of the API. Default: "A custom B2C Commerce API" */
  apiDescription?: string;
  /** Project root for cartridge discovery and output. Default: MCP working directory */
  projectRoot?: string;
  /** Output directory override. Default: scaffold default or project root */
  outputDir?: string;
}

/**
 * Output schema for scapi_custom_api_scaffold tool.
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
  const projectRoot = path.resolve(args.projectRoot ?? services.getWorkingDirectory());

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
      error: `Scaffold not found: ${CUSTOM_API_SCAFFOLD_ID}. Ensure @salesforce/b2c-tooling-sdk is installed.`,
    };
  }

  let cartridgeName = args.cartridgeName;
  if (!cartridgeName) {
    const cartridges = findCartridges(projectRoot);
    if (cartridges.length === 0) {
      return {
        scaffold: CUSTOM_API_SCAFFOLD_ID,
        outputDir: projectRoot,
        dryRun: false,
        files: [],
        error:
          'No cartridges found in project. Custom API scaffold requires an existing cartridge. Create a cartridge (directory with .project file) first. You can use the `b2c scaffold cartridge` command to create a cartridge.',
      };
    }
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
      error: `Missing required parameter: ${missingRequired[0].name}. For cartridgeName, ensure the cartridge exists in the project (under projectRoot).`,
    };
  }

  const outputDir = resolveOutputDirectory({
    outputDir: args.outputDir,
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
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      scaffold: CUSTOM_API_SCAFFOLD_ID,
      outputDir,
      dryRun: false,
      files: [],
      error: `Scaffold generation failed: ${message}`,
    };
  }
}

/**
 * Creates the scapi_custom_api_scaffold tool.
 *
 * Uses @salesforce/b2c-tooling-sdk scaffold: registry, resolveScaffoldParameters,
 * resolveOutputDirectory, generateFromScaffold. cartridgeName must be a cartridge
 * discovered under projectRoot (e.g. from .project or cartridges/).
 *
 * @param loadServices - Function that returns Services (used by adapter on each call).
 * @param executeOverrides - Optional overrides for testing (getScaffold, resolveScaffoldParameters).
 */
export function createScaffoldCustomApiTool(
  loadServices: () => Services,
  executeOverrides?: ScaffoldCustomApiExecuteOverrides,
): McpTool {
  return createToolAdapter<ScaffoldCustomApiInput, ScaffoldCustomApiOutput>(
    {
      name: 'scapi_custom_api_scaffold',
      description: `Generate a new custom SCAPI endpoint (OAS 3.0 schema, api.json, script.js) in an existing cartridge. \
Required: apiName (kebab-case). Optional: cartridgeName (defaults to first cartridge found in project), apiType (shopper|admin) default to shopper, \
apiDescription, projectRoot, outputDir.`,
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        apiName: z
          .string()
          .min(1)
          .describe(
            'API name in kebab-case (e.g. my-products). Must start with lowercase letter, only letters, numbers, hyphens.',
          ),
        cartridgeName: z
          .string()
          .min(1)
          .nullish()
          .describe(
            'Cartridge name that will contain the API. Optional; omit to use the first cartridge found under project root).',
          ),
        apiType: z
          .enum(['admin', 'shopper'])
          .optional()
          .describe('Admin (no siteId) or shopper (siteId, customer-facing). Default: shopper'),
        apiDescription: z.string().optional().describe('Short description of the API.'),
        projectRoot: z
          .string()
          .nullish()
          .describe(
            'Project root for cartridge discovery. Default: project directory. Set to override the project directory.',
          ),
        outputDir: z.string().optional().describe('Output directory override. Default: project root'),
      },
      async execute(args, {services}) {
        return executeScaffoldCustomApi(args, services, executeOverrides);
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
