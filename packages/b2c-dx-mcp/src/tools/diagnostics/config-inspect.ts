/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {redactConfigValues, type ConfigSourceInfo} from '@salesforce/b2c-tooling-sdk/config';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {ProjectContextInput} from '../project-context.js';

interface ConfigInspectInput extends ProjectContextInput {
  unmask?: boolean;
}

interface ConfigInspectOutput {
  /** Resolved configuration values (secrets masked unless `unmask` was set). */
  config: Record<string, unknown>;
  /** Configuration sources that contributed, in precedence order. */
  sources: ConfigSourceInfo[];
  /** Resolution warnings, if any. */
  warnings?: string[];
}

/**
 * Creates the `config_inspect` tool — the MCP equivalent of the CLI
 * `b2c setup inspect` command. Reports the resolved configuration (with secrets
 * redacted by default), the sources that contributed, and — importantly for
 * agents — the effective project directory and how it was resolved.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The config_inspect MCP tool
 */
export function createConfigInspectTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ConfigInspectInput, ConfigInspectOutput>(
    {
      name: 'config_inspect',
      description:
        'Inspect resolved B2C configuration, source provenance, warnings, and paths. Secrets are redacted unless unmask=true. ' +
        'Use to diagnose configuration, authentication, or project-context issues.',
      toolsets: ['DIAGNOSTICS'],
      isGA: true,
      requiresInstance: false,
      usesConfigurationContext: true,
      inputSchema: {
        unmask: z
          .boolean()
          .optional()
          .describe('Return secrets unmasked. Default: false; use only when explicitly requested.'),
      },
      async execute(args, {services}) {
        const resolved = services.getResolvedConfig();

        return {
          config: redactConfigValues(resolved.values, {unmask: args.unmask ?? false}),
          sources: resolved.sources,
          warnings: resolved.warnings.length > 0 ? resolved.warnings.map((w) => w.message) : undefined,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
