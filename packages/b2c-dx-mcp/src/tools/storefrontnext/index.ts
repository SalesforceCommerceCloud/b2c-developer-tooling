/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Storefront Next toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Storefront Next development.
 *
 * **Implemented Tools:**
 * - `storefront_next_development_guidelines` - Get development guidelines and best practices
 * - `storefront_next_page_designer_decorator` - Add Page Designer decorators to React components
 * - `storefront_next_site_theming` - Get theming guidelines, questions, and validation
 * - `storefront_next_figma_to_component_workflow` - Convert Figma to components
 * - `storefront_next_generate_component` - Generate new components
 * - `storefront_next_map_tokens_to_theme` - Map design tokens
 *
 * Note: mrt_bundle_push is defined in the MRT toolset and appears in STOREFRONTNEXT.
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
 * Creates all tools for the STOREFRONTNEXT toolset.
 *
 * Note: mrt_bundle_push is defined in the MRT toolset with
 * toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"] and will
 * automatically appear in STOREFRONTNEXT.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns Array of MCP tools
 */
export function createStorefrontNextTools(loadServices: () => Services): McpTool[] {
  return [
    createDeveloperGuidelinesTool(loadServices),
    createPageDesignerDecoratorTool(loadServices),
    createSiteThemingTool(loadServices),
    createPageDesignerDecoratorTool(loadServices),
    createFigmaToComponentTool(loadServices),
    createGenerateComponentTool(loadServices),
    createMapTokensToThemeTool(loadServices),
  ];
}
