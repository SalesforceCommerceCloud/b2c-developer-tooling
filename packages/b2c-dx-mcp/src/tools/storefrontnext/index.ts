/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Storefront Next (deprecated) toolset for B2C Commerce.
 *
 * **DEPRECATED:** These `sfnext_*` tools are superseded by the `storefront-next`
 * and `storefront-next-figma` agent-skills plugins and are NOT compatible with
 * the Storefront Next 1.0 GA release. They now live in the
 * `STOREFRONTNEXT_DEPRECATED` toolset, which is never auto-activated by project
 * detection and is excluded from `--toolsets ALL`. To use them you must request
 * the toolset explicitly (`--toolsets STOREFRONTNEXT_DEPRECATED`). They will be
 * removed in a future release.
 *
 * **Implemented Tools:**
 * - `sfnext_get_guidelines` - Get development guidelines and best practices
 * - `sfnext_add_page_designer_decorator` - Add Page Designer decorators to React components
 * - `sfnext_configure_theme` - Get theming guidelines, questions, and validation
 * - `sfnext_start_figma_workflow` - Convert Figma to components
 * - `sfnext_analyze_component` - Analyze design and recommend REUSE/EXTEND/CREATE
 * - `sfnext_match_tokens_to_theme` - Match design tokens to theme
 *
 * @module tools/storefrontnext
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createDeveloperGuidelinesTool} from './sfnext-development-guidelines.js';
import {createPageDesignerDecoratorTool} from './page-designer-decorator/index.js';
import {createSiteThemingTool} from './site-theming/index.js';
import {createFigmaToComponentTool} from './figma/figma-to-component/index.js';
import {createGenerateComponentTool} from './figma/generate-component/index.js';
import {createMapTokensToThemeTool} from './figma/map-tokens/index.js';

/**
 * Creates all tools for the deprecated STOREFRONTNEXT_DEPRECATED toolset.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns Array of MCP tools
 */
export function createStorefrontNextTools(loadServices: () => Promise<Services> | Services): McpTool[] {
  return [
    createDeveloperGuidelinesTool(loadServices),
    createPageDesignerDecoratorTool(loadServices),
    createSiteThemingTool(loadServices),
    createFigmaToComponentTool(loadServices),
    createGenerateComponentTool(loadServices),
    createMapTokensToThemeTool(loadServices),
  ];
}
