/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * MRT (Managed Runtime) toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Managed Runtime operations.
 *
 * > ⚠️ **PLACEHOLDER - ACTIVE DEVELOPMENT**
 * > This tool is a placeholder implementation that returns mock responses.
 * > Actual implementation is coming soon. Use `--allow-non-ga-tools` flag to enable.
 *
 * @module tools/mrt
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

/**
 * Input type for mrt_bundle_push tool.
 */
interface MrtBundlePushInput {
  /** MRT project slug/ID (required) */
  projectSlug: string;
  /** Path to build directory (default: ./build) */
  buildDirectory?: string;
  /** Deployment message */
  message?: string;
  /** Target environment to deploy to after push (optional) */
  target?: string;
  /** Glob patterns for server-only files (default: ssr.js,ssr.mjs,server/**\/*) */
  ssrOnly?: string;
  /** Glob patterns for shared files (default: static/**\/*,client/**\/*) */
  ssrShared?: string;
}

/**
 * Output type for mrt_bundle_push tool.
 */
interface MrtBundlePushOutput {
  tool: string;
  status: string;
  message: string;
  input: MrtBundlePushInput;
  timestamp: string;
}

/**
 * Creates the mrt_bundle_push tool.
 *
 * Creates a bundle from a pre-built PWA Kit project and pushes it to
 * Managed Runtime (MRT). Optionally deploys to a target environment after push.
 * Expects the project to already be built (e.g., `npm run build` completed).
 * Shared across MRT, PWAV3, and STOREFRONTNEXT toolsets.
 *
 * @param services - MCP services
 * @returns The mrt_bundle_push tool
 */
function createMrtBundlePushTool(services: Services): McpTool {
  return createToolAdapter<MrtBundlePushInput, MrtBundlePushOutput>(
    {
      name: 'mrt_bundle_push',
      description:
        '[PLACEHOLDER] Bundle a pre-built PWA Kit project and push to Managed Runtime. Optionally deploy to a target environment.',
      toolsets: ['MRT', 'PWAV3', 'STOREFRONTNEXT'],
      isGA: false,
      // MRT operations use ApiKeyStrategy from SFCC_MRT_API_KEY or ~/.mobify
      requiresMrtAuth: true,
      inputSchema: {
        projectSlug: z.string().min(1, 'Project slug is required').describe('MRT project slug/ID'),
        buildDirectory: z.string().optional().describe('Path to build directory (default: ./build)'),
        message: z.string().optional().describe('Deployment message'),
        target: z.string().optional().describe('Target environment to deploy to after push'),
        ssrOnly: z
          .string()
          .optional()
          .describe('Glob patterns for server-only files, comma-separated (default: ssr.js,ssr.mjs,server/**/*)'),
        ssrShared: z
          .string()
          .optional()
          .describe('Glob patterns for shared files, comma-separated (default: static/**/*,client/**/*)'),
      },
      async execute(args, context) {
        // Placeholder implementation
        const timestamp = new Date().toISOString();

        // TODO: Remove this log when implementing
        const logger = getLogger();
        logger.debug({context}, 'mrt_bundle_push context');

        // TODO: When implementing, use context.mrtAuth:
        //
        // import { pushBundle } from '@salesforce/b2c-tooling-sdk/operations/mrt';
        //
        // // Parse comma-separated glob patterns (same as CLI defaults)
        // const ssrOnly = (args.ssrOnly || 'ssr.js,ssr.mjs,server/**/*').split(',').map(s => s.trim());
        // const ssrShared = (args.ssrShared || 'static/**/*,client/**/*').split(',').map(s => s.trim());
        //
        // const result = await pushBundle({
        //   projectSlug: args.projectSlug,
        //   buildDirectory: args.buildDirectory || './build',
        //   ssrOnly,    // files that run only on SSR server (never sent to browser)
        //   ssrShared,  // files served from CDN and also available to SSR
        //   message: args.message,
        //   target: args.target,
        // }, context.mrtAuth!);
        // return result;

        return {
          tool: 'mrt_bundle_push',
          status: 'placeholder',
          message:
            "This is a placeholder implementation for 'mrt_bundle_push'. The actual implementation is coming soon.",
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
 * Creates all tools for the MRT toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createMrtTools(services: Services): McpTool[] {
  return [createMrtBundlePushTool(services)];
}
