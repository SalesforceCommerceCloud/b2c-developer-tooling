/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {z, type ZodRawShape} from 'zod';

/** Input shared by MCP tools that resolve files or configuration from a project. */
export interface ProjectContextInput {
  /** Per-call project directory override. */
  projectDirectory?: string;
  /** Per-call explicit primary dw.json-format configuration path. */
  configPath?: string;
  /** Per-call named instance selection. */
  instanceName?: string;
}

/** Effective project directory and the source that selected it. */
export interface ProjectDirectoryInfo {
  path: string;
  source: 'argument' | 'config' | 'cwd';
}

/** How the selected dw.json file entered the configuration resolver. */
export type ConfigurationResolutionSource =
  | 'argument'
  | 'globalDefault'
  | 'none'
  | 'projectDirectory'
  | 'projectEnvironment'
  | 'server';

/** Compact selected-configuration provenance returned by project-aware tools. */
export interface ConfigurationResolutionInfo {
  hostname?: string;
  instanceName?: string;
  path?: string;
  source: ConfigurationResolutionSource;
}

/** Provenance for a specialized project-relative directory. */
export interface DirectoryResolutionInfo {
  path: string;
  source: 'argument' | 'projectDirectory';
}

/** Compact, common provenance block returned by project/config-aware tools. */
export interface ToolResolution {
  configuration?: ConfigurationResolutionInfo;
  directories?: Record<string, DirectoryResolutionInfo>;
  projectDirectory: ProjectDirectoryInfo;
}

/** Whether a tool needs only a project root or full configuration selection. */
export type ProjectContextKind = 'configuration' | 'project';

/** Build the canonical project-directory field. */
export function createProjectDirectoryInput() {
  return z
    .string()
    .refine((value) => path.isAbsolute(value), 'projectDirectory must be an absolute path')
    .optional()
    .describe(
      `Optional absolute project root for this call. Overrides the server-level project directory. ` +
        `When omitted, uses the server-level project directory if configured; otherwise uses the MCP process working directory. ` +
        `Use config_inspect to see the resolved paths.`,
    );
}

/** Build the canonical explicit primary dw.json field. */
export function createConfigPathInput() {
  return z
    .string()
    .optional()
    .describe(
      'Optional path to a dw.json-format configuration file. Relative paths resolve from projectDirectory. ' +
        'Selects the primary file ahead of server and project automatic selection; the shared default dw.json remains available as a fallback and for named-instance lookup.',
    );
}

/** Build the canonical named-instance selection field. */
export function createInstanceNameInput() {
  return z
    .string()
    .min(1)
    .optional()
    .describe(
      'Optional named instance to select from the resolved primary and default dw.json files. The primary file is searched first. When omitted, the active/default instance is used.',
    );
}

/** Build flat canonical schema fields for a local-project or configuration-aware tool. */
export function createProjectContextInputSchema(kind: ProjectContextKind): ZodRawShape {
  const project = {projectDirectory: createProjectDirectoryInput()};
  if (kind === 'project') return project;

  return {
    ...project,
    configPath: createConfigPathInput(),
    instanceName: createInstanceNameInput(),
  };
}

/** Static field for schemas declared outside the shared adapter. */
export const projectDirectoryInput = createProjectDirectoryInput();

/** Static configuration schema for legacy/manual tool definitions. */
export const projectContextInputSchema = createProjectContextInputSchema('configuration');
