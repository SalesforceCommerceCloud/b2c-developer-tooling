/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';

/**
 * Human-readable label for each detected workspace/project type, used in the
 * docs tool descriptions so an agent can see what was auto-detected.
 */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  cartridges: 'Cartridges',
  sfra: 'SFRA (cartridges)',
  'pwa-kit-v3': 'PWA Kit (Composable Storefront)',
  'storefront-next': 'Storefront Next',
};

/**
 * Accepted values for the docs tools' `workspace` parameter. Mirrors the CLI
 * `--workspace` vocabulary: `auto` uses the auto-detected workspace, `all`
 * disables the preference, or name a concrete type.
 */
export const WORKSPACE_VALUES = ['auto', 'all', 'cartridges', 'sfra', 'pwa-kit-v3', 'storefront-next'] as const;
export type WorkspaceParam = (typeof WORKSPACE_VALUES)[number];

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
  return ` Detected workspace: ${labels} — by default results favor this workspace's docs (pass workspace="all" to disable).`;
}
