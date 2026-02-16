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
 * @module tools/mrt
 */

import path from 'node:path';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {pushBundle} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {PushResult, PushOptions} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

/**
 * Input type for mrt_bundle_push tool.
 */
interface MrtBundlePushInput {
  /** Path to build directory (default: ./build) */
  buildDirectory?: string;
  /** Deployment message */
  message?: string;
  /** Glob patterns for server-only files (default: ssr.js,ssr.mjs,server/**\/*) */
  ssrOnly?: string;
  /** Glob patterns for shared files (default: static/**\/*,client/**\/*) */
  ssrShared?: string;
}

/**
 * Optional dependency injections for testing.
 */
interface MrtToolInjections {
  /** Mock pushBundle function for testing */
  pushBundle?: (options: PushOptions, auth: AuthStrategy) => Promise<PushResult>;
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
 * @param injections - Optional dependency injections for testing
 * @returns The mrt_bundle_push tool
 */
function createMrtBundlePushTool(services: Services, injections?: MrtToolInjections): McpTool {
  const pushBundleFn = injections?.pushBundle || pushBundle;
  return createToolAdapter<MrtBundlePushInput, PushResult>(
    {
      name: 'mrt_bundle_push',
      description:
        'Bundle a pre-built PWA Kit project and push to Managed Runtime. Optionally deploy to a target environment.',
      toolsets: ['MRT', 'PWAV3', 'STOREFRONTNEXT'],
      isGA: false,
      // MRT operations use ApiKeyStrategy from SFCC_MRT_API_KEY or ~/.mobify
      requiresMrtAuth: true,
      inputSchema: {
        buildDirectory: z.string().optional().describe('Path to build directory (default: ./build)'),
        message: z.string().optional().describe('Deployment message'),
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
        // Get project from --project flag (required)
        const project = context.mrtConfig?.project;
        if (!project) {
          throw new Error(
            'MRT project error: Project is required. Provide --project flag or set SFCC_MRT_PROJECT environment variable.',
          );
        }

        // Get environment from --environment flag (optional)
        const environment = context.mrtConfig?.environment;

        // Get origin from --cloud-origin flag or mrtOrigin config (optional)
        const origin = context.mrtConfig?.origin;

        // Parse comma-separated glob patterns (same as CLI defaults)
        const ssrOnly = (args.ssrOnly || 'ssr.js,ssr.mjs,server/**/*').split(',').map((s) => s.trim());
        const ssrShared = (args.ssrShared || 'static/**/*,client/**/*').split(',').map((s) => s.trim());
        const buildDirectory = args.buildDirectory || path.join(services.getWorkingDirectory(), 'build');

        // Log all computed variables before pushing bundle
        const logger = getLogger();
        logger.debug(
          {
            project,
            environment,
            origin,
            buildDirectory,
            message: args.message,
            ssrOnly,
            ssrShared,
          },
          '[MRT] Pushing bundle with computed options',
        );

        // Push bundle to MRT
        // Note: auth is guaranteed to be present by the adapter when requiresMrtAuth is true
        const result = await pushBundleFn(
          {
            projectSlug: project,
            buildDirectory,
            ssrOnly, // files that run only on SSR server (never sent to browser)
            ssrShared, // files served from CDN and also available to SSR
            message: args.message,
            target: environment,
            origin, // MRT API origin URL (optional, defaults to https://cloud.mobify.com)
          },
          context.mrtConfig!.auth!,
        );

        return result;
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
 * @param injections - Optional dependency injections for testing
 * @returns Array of MCP tools
 */
export function createMrtTools(services: Services, injections?: MrtToolInjections): McpTool[] {
  return [createMrtBundlePushTool(services, injections)];
}
