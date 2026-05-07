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

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {pushBundle} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {PushResult, PushOptions} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {detectWorkspaceType, type ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

/**
 * Parses a glob pattern string into an array of patterns.
 * Accepts either a JSON array (e.g. '["server/**\/*", "ssr.{js,mjs}"]')
 * or a comma-separated string (e.g. 'server/**\/*,ssr.js').
 * JSON array format supports brace expansion in individual patterns.
 */
function parseGlobPatterns(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      throw new Error('Invalid glob pattern array: expected an array of strings');
    }
    return parsed.map((s: string) => (s as string).trim()).filter(Boolean);
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface MrtDefaults {
  ssrOnly: string[];
  ssrShared: string[];
  buildDirectory: string;
}

const MRT_DEFAULTS: Record<'default' | 'pwa-kit-v3' | 'storefront-next', MrtDefaults> = {
  'storefront-next': {
    // ssrEntryPoint is 'streamingHandler' (production + MRT_BUNDLE_TYPE!=='ssr') or 'ssr' otherwise.
    // Include both patterns so the bundle works regardless of MRT_BUNDLE_TYPE / mode.
    ssrOnly: [
      'server/**/*',
      'loader.js',
      'streamingHandler.{js,mjs,cjs}',
      'streamingHandler.{js,mjs,cjs}.map',
      'ssr.{js,mjs,cjs}',
      'ssr.{js,mjs,cjs}.map',
      '!static/**/*',
      'sfnext-server-*.mjs',
      '!**/*.stories.tsx',
      '!**/*.stories.ts',
      '!**/*-snapshot.tsx',
      '!.storybook/**/*',
      '!storybook-static/**/*',
      '!**/__mocks__/**/*',
      '!**/__snapshots__/**/*',
    ],
    ssrShared: [
      'client/**/*',
      'static/**/*',
      '**/*.css',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.svg',
      '**/*.ico',
      '**/*.woff',
      '**/*.woff2',
      '**/*.ttf',
      '**/*.eot',
      '!**/*.stories.tsx',
      '!**/*.stories.ts',
      '!**/*-snapshot.tsx',
      '!.storybook/**/*',
      '!storybook-static/**/*',
      '!**/__mocks__/**/*',
      '!**/__snapshots__/**/*',
    ],
    buildDirectory: 'build',
  },
  'pwa-kit-v3': {
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    ssrShared: ['static/ico/favicon.ico', 'static/robots.txt', '**/*.js', '**/*.js.map', '**/*.json'],
    buildDirectory: 'build',
  },
  default: {
    ssrOnly: ['ssr.js', 'ssr.mjs', 'server/**/*'],
    ssrShared: ['static/**/*', 'client/**/*'],
    buildDirectory: 'build',
  },
};

/**
 * Returns MRT bundle defaults for the given project types.
 * For hybrid projects (multiple types detected), prefers storefront-next over pwa-kit-v3.
 *
 * @param projectTypes - Detected project types from workspace discovery
 * @returns Defaults for ssrOnly, ssrShared, and buildDirectory
 */
function getDefaultsForProjectTypes(projectTypes: ProjectType[]): MrtDefaults {
  if (projectTypes.includes('storefront-next')) return MRT_DEFAULTS['storefront-next'];
  if (projectTypes.includes('pwa-kit-v3')) return MRT_DEFAULTS['pwa-kit-v3'];
  return MRT_DEFAULTS.default;
}

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
  /** Whether to deploy to an environment after push (default: false) */
  deploy?: boolean;
}

/**
 * Optional dependency injections for testing.
 */
interface MrtToolInjections {
  /** Mock pushBundle function for testing */
  pushBundle?: (options: PushOptions, auth: AuthStrategy) => Promise<PushResult>;
  /** Mock detectWorkspaceType function for testing */
  detectWorkspaceType?: (path: string) => Promise<{projectTypes: ProjectType[]}>;
}

/**
 * Creates the mrt_bundle_push tool.
 *
 * Creates a bundle from a pre-built PWA Kit or Storefront Next project and pushes it to
 * Managed Runtime (MRT). Optionally deploys to a target environment after push.
 * Expects the project to already be built (e.g., `npm run build` completed).
 * Shared across MRT, PWAV3, and STOREFRONTNEXT toolsets.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @param injections - Optional dependency injections for testing
 * @returns The mrt_bundle_push tool
 */
function createMrtBundlePushTool(
  loadServices: () => Promise<Services> | Services,
  injections?: MrtToolInjections,
): McpTool {
  const pushBundleFn = injections?.pushBundle || pushBundle;
  const detectWorkspaceTypeFn = injections?.detectWorkspaceType ?? detectWorkspaceType;
  return createToolAdapter<MrtBundlePushInput, PushResult>(
    {
      name: 'mrt_bundle_push',
      description:
        'Bundle a pre-built PWA Kit or Storefront Next project and push to Managed Runtime. Optionally deploy to a target environment.',
      toolsets: ['MRT', 'PWAV3', 'STOREFRONTNEXT'],
      isGA: true,
      // MRT operations use ApiKeyStrategy from MRT_API_KEY or ~/.mobify
      requiresMrtAuth: true,
      inputSchema: {
        buildDirectory: z
          .string()
          .optional()
          .describe(
            'Path to build directory. Defaults vary by project type: Storefront Next, PWA Kit v3, or generic (./build).',
          ),
        message: z.string().optional().describe('Deployment message'),
        ssrOnly: z
          .string()
          .optional()
          .describe(
            'Glob patterns for server-only files (comma-separated or JSON array). Defaults vary by project type: Storefront Next, PWA Kit v3, or generic.',
          ),
        ssrShared: z
          .string()
          .optional()
          .describe(
            'Glob patterns for shared files (comma-separated or JSON array). Defaults vary by project type: Storefront Next, PWA Kit v3, or generic.',
          ),
        deploy: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether to deploy to an environment after push (default: false)'),
      },
      async execute(args, context) {
        // Get project from --project flag (required)
        const project = context.mrtConfig?.project;
        if (!project) {
          throw new Error(
            'MRT project error: Project is required. Provide --project flag or set MRT_PROJECT environment variable.',
          );
        }

        // Get environment from --environment flag (optional)
        // When deploy is false, environment is undefined (bundle push only, no deployment)
        // When deploy is true, environment is required
        let environment: string | undefined;
        if (args.deploy) {
          environment = context.mrtConfig?.environment;
          if (!environment) {
            throw new Error(
              'MRT deployment error: Environment is required when deploy=true. ' +
                'Provide --environment flag, set MRT_ENVIRONMENT environment variable, or set mrtEnvironment in dw.json.',
            );
          }
        }

        // Get origin from --cloud-origin flag or mrtOrigin config (optional)
        const origin = context.mrtConfig?.origin;

        // Detect project type and get project-type-aware defaults
        const projectDir = context.services.resolveWithProjectDirectory();
        const {projectTypes} = await detectWorkspaceTypeFn(projectDir);
        const defaults = getDefaultsForProjectTypes(projectTypes);

        const ssrOnly = args.ssrOnly ? parseGlobPatterns(args.ssrOnly) : defaults.ssrOnly;
        const ssrShared = args.ssrShared ? parseGlobPatterns(args.ssrShared) : defaults.ssrShared;
        const buildDirectory = context.services.resolveWithProjectDirectory(
          args.buildDirectory ?? defaults.buildDirectory,
        );

        // Log all computed variables before pushing bundle
        const logger = getLogger();
        logger.debug(
          {
            project,
            environment,
            origin,
            buildDirectory,
            message: args.message,
            projectTypes,
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
    loadServices,
  );
}

/**
 * Creates all tools for the MRT toolset.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @param injections - Optional dependency injections for testing
 * @returns Array of MCP tools
 */
export function createMrtTools(
  loadServices: () => Promise<Services> | Services,
  injections?: MrtToolInjections,
): McpTool[] {
  return [createMrtBundlePushTool(loadServices, injections)];
}
