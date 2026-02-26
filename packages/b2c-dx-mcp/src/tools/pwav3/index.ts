/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * PWA Kit v3 toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for PWA Kit v3 development.
 * PWA Kit-specific tools are planned for future releases.
 * mrt_bundle_push (from MRT toolset) is available for PWAV3 projects.
 *
 * @module tools/pwav3
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createDeveloperGuidelinesTool} from './pwa-kit-development-guidelines.js';

/**
 * Creates all tools for the PWAV3 toolset.
 *
 * PWA Kit-specific tools are not yet implemented. mrt_bundle_push is defined
 * in the MRT toolset with toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"] and
 * automatically appears in PWAV3 for bundle deployment.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns Array of MCP tools
 */
export function createPwav3Tools(loadServices: () => Services): McpTool[] {
  return [createDeveloperGuidelinesTool(loadServices)];
}
