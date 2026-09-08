/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {isAbsolute} from 'node:path';
import {z} from 'zod';
import {detectWorkspaceType, type ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';

/**
 * Human-readable label for each detected workspace/project type, used in the
 * docs tool descriptions so an agent can see what was auto-detected.
 */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  cartridges: 'Cartridges',
  sfra: 'SFRA',
  'pwa-kit-v3': 'PWA Kit',
  'storefront-next': 'Storefront Next',
};

/**
 * Accepted values for the docs tools' `workspace` parameter. Mirrors the CLI
 * `--workspace` vocabulary: `auto` uses the auto-detected workspace, `all`
 * disables the preference, or name a concrete type.
 */
export const WORKSPACE_VALUES = ['auto', 'all', 'cartridges', 'sfra', 'pwa-kit-v3', 'storefront-next'] as const;
export type WorkspaceParam = (typeof WORKSPACE_VALUES)[number];

/** Context supplied by the agent for this task, independent of server startup. */
export interface WorkspaceContextInput {
  workspace?: WorkspaceParam;
  projectDirectory?: string;
}

/** Shared discovery inputs; reading documentation never needs instance credentials. */
export const workspaceInputSchema = {
  workspace: z
    .enum(WORKSPACE_VALUES)
    .optional()
    .describe('Storefront preference; auto detects projectDirectory, all disables bias.'),
  projectDirectory: z
    .string()
    .min(1)
    .refine(isAbsolute, 'Use an absolute project directory.')
    .optional()
    .describe('Project to detect for this call; never defaults to the server directory.'),
};

/** Detect only a caller-supplied project, with no startup cwd fallback or cross-call cache. */
export async function resolveProjectWorkspace(
  input: WorkspaceContextInput,
  fallback: readonly ProjectType[] = [],
): Promise<ProjectType[] | undefined> {
  if (input.workspace && input.workspace !== 'auto') return resolveWorkspace(input.workspace, []);
  if (!input.projectDirectory) return resolveWorkspace(input.workspace, fallback);
  const detected = await detectWorkspaceType(input.projectDirectory, {maxDepth: 5});
  return detected.projectTypes.length > 0 ? detected.projectTypes : undefined;
}

/**
 * Resolves the `workspace` tool parameter into the concrete project type(s) to
 * pass to the SDK search, given what was auto-detected at server startup.
 *
 * - `all` → undefined (no workspace preference)
 * - `auto` (or unset) → the detected workspace(s), if any
 * - an explicit type → that type
 */
export function resolveWorkspace(
  param: undefined | WorkspaceParam,
  detected: readonly ProjectType[],
): ProjectType[] | undefined {
  if (param === 'all') return undefined;
  if (param && param !== 'auto') return [param];
  // 'auto' or unset: default to the detected workspace(s)
  return detected.length > 0 ? [...detected] : undefined;
}

/**
 * Builds a short sentence describing the detected workspace for a tool
 * description, or an empty string when nothing was detected.
 */
export function detectedWorkspaceNote(detected: readonly ProjectType[]): string {
  if (detected.length === 0) return '';
  const labels = detected.map((t) => PROJECT_TYPE_LABELS[t] ?? t).join(' + ');
  return ` Workspace at startup: ${labels}.`;
}
