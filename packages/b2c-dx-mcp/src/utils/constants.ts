/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Special toolset value that enables all toolsets.
 */
export const ALL_TOOLSETS = 'ALL';

/**
 * Available toolsets that can be enabled.
 */
export const TOOLSETS = [
  'CARTRIDGES',
  'DIAGNOSTICS',
  'MRT',
  'PWAV3',
  'SCAPI',
  'STOREFRONTNEXT',
  'STOREFRONTNEXT_DEPRECATED',
] as const;

/**
 * Deprecated toolsets. These can only be enabled by explicitly naming them via
 * `--toolsets`; they are never auto-activated by project detection and are NOT
 * included when `--toolsets ALL` is used.
 *
 * `STOREFRONTNEXT_DEPRECATED` holds the legacy `sfnext_*` MCP tools. They are
 * superseded by the `storefront-next` and `storefront-next-figma` agent-skills
 * plugins and are not compatible with the Storefront Next 1.0 GA release. They
 * will be removed in a future release.
 */
export const DEPRECATED_TOOLSETS = ['STOREFRONTNEXT_DEPRECATED'] as const;

/**
 * Valid toolset names including the special "ALL" value.
 */
export const VALID_TOOLSET_NAMES = [ALL_TOOLSETS, ...TOOLSETS] as const;

/**
 * Type representing a valid toolset name.
 */
export type Toolset = (typeof TOOLSETS)[number];
