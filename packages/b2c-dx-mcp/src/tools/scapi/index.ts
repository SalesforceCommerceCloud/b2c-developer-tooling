/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Salesforce Commerce API (SCAPI) discovery and exploration.
 * Includes both standard SCAPI schemas and custom API status tools.
 *
 * @module tools/scapi
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createSchemasListTool} from './scapi-schemas-list.js';
import {createCustomListTool} from './scapi-custom-api-status.js';

/**
 * Creates all tools for the SCAPI toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createScapiTools(services: Services): McpTool[] {
  return [createSchemasListTool(services), createCustomListTool(services)];
}
