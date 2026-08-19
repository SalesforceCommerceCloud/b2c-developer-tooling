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
import type {ProjectContextInput, ProjectDirectoryInfo} from '../project-context.js';

interface ConfigInspectInput extends ProjectContextInput {
  unmask?: boolean;
}

interface ConfigInspectOutput {
  /** Resolved configuration values (secrets masked unless `unmask` was set). */
  config: Record<string, unknown>;
  /** The effective project directory and how it was resolved. */
  projectDirectory: ProjectDirectoryInfo;
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
        'Inspect the resolved B2C Commerce configuration the MCP server is using — instance hostname, auth, SCAPI, MRT, and other settings — along with which source (dw.json, environment variables, flags) provided each value. ' +
        'Secrets (passwords, client secrets, API keys) are redacted by default. ' +
        'Pass projectDirectory and/or configPath to inspect the same project and dw.json-format file a CLI command would use. The output includes the effective projectDirectory and source provenance, which is useful for diagnosing why the server targets the wrong instance or cannot find a project. ' +
        'Use this first when configuration seems wrong, auth is failing, or the server appears to be operating in the wrong directory.',
      toolsets: ['DIAGNOSTICS'],
      isGA: true,
      requiresInstance: false,
      usesProjectContext: true,
      inputSchema: {
        unmask: z
          .boolean()
          .optional()
          .describe(
            'Show sensitive values (passwords, secrets, API keys) unmasked. Defaults to false — secrets are redacted. Only set this when the user explicitly needs the raw secret values.',
          ),
      },
      async execute(args, {services}) {
        const resolved = services.getResolvedConfig();
        const projectDirectory = services.resolveProjectDirectory(args.projectDirectory);

        return {
          config: redactConfigValues(resolved.values, {unmask: args.unmask ?? false}),
          projectDirectory,
          sources: resolved.sources,
          warnings: resolved.warnings.length > 0 ? resolved.warnings.map((w) => w.message) : undefined,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
