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
export const TOOLSETS = ['CARTRIDGES', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'] as const;

/**
 * Valid toolset names including the special "ALL" value.
 */
export const VALID_TOOLSET_NAMES = [ALL_TOOLSETS, ...TOOLSETS] as const;

/**
 * Type representing a valid toolset name.
 */
export type Toolset = (typeof TOOLSETS)[number];
