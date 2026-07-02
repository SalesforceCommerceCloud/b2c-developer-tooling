/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';

/**
 * Human-readable label for each detected storefront/project type, used in the
 * docs tool descriptions so an agent can see what was auto-detected.
 */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  cartridges: 'Cartridges / SFRA',
  'pwa-kit-v3': 'PWA Kit (Composable Storefront)',
  'storefront-next': 'Storefront Next',
};

/**
 * Accepted values for the docs tools' `storefront` parameter.
 * `current` uses the auto-detected storefront; `all` disables the preference.
 */
export const STOREFRONT_VALUES = ['current', 'all', 'cartridges', 'pwa-kit-v3', 'storefront-next'] as const;
export type StorefrontParam = (typeof STOREFRONT_VALUES)[number];

/**
 * Resolves the `storefront` tool parameter into the concrete project type(s) to
 * pass to the SDK search, given what was auto-detected at server startup.
 *
 * - `all` → undefined (no storefront preference)
 * - `current` (or unset) → the detected storefront(s), if any
 * - an explicit type → that type
 */
export function resolveStorefront(
  param: StorefrontParam | undefined,
  detected: readonly ProjectType[],
): ProjectType[] | undefined {
  if (param === 'all') return undefined;
  if (param && param !== 'current') return [param];
  // 'current' or unset: default to the detected storefront(s)
  return detected.length > 0 ? [...detected] : undefined;
}

/**
 * Builds a short sentence describing the detected storefront for a tool
 * description, or an empty string when nothing was detected.
 */
export function detectedStorefrontNote(detected: readonly ProjectType[]): string {
  if (detected.length === 0) return '';
  const labels = detected.map((t) => PROJECT_TYPE_LABELS[t] ?? t).join(' + ');
  return (
    ` Detected storefront: ${labels} — by default results favor this storefront's docs ` +
    `(pass storefront="all" to disable, or storefront="filter"-style category to narrow).`
  );
}
