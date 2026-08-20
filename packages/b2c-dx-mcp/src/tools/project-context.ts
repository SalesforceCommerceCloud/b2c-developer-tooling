/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';

/** Input shared by MCP tools that resolve files or configuration from a project. */
export interface ProjectContextInput {
  /** Per-call project directory override. */
  projectDirectory?: string;
  /** Per-call explicit dw.json-format configuration path. */
  configPath?: string;
}

/** Effective project directory and the source that selected it. */
export interface ProjectDirectoryInfo {
  path: string;
  source: 'argument' | 'config' | 'cwd';
}

/** Shared schema field injected into every project-aware MCP tool. */
export const projectDirectoryInput = z
  .string()
  .optional()
  .describe(
    'Absolute project directory for this call. Overrides --project-directory / SFCC_PROJECT_DIRECTORY and the MCP process working directory. Also controls project-local configuration discovery.',
  );

/** Shared explicit dw.json path field injected into every project-aware MCP tool. */
export const configPathInput = z
  .string()
  .optional()
  .describe(
    'Explicit path to a dw.json-format configuration file for this call. Overrides startup --config / SFCC_CONFIG and project .env SFCC_CONFIG. Relative paths resolve from projectDirectory.',
  );

/** Shared schema fields injected into every project-aware MCP tool. */
export const projectContextInputSchema = {
  projectDirectory: projectDirectoryInput,
  configPath: configPathInput,
};
