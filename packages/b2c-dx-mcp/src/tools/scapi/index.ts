/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Salesforce Commerce API (SCAPI) discovery and exploration.
 * Includes standard SCAPI schemas, custom API status, and custom API scaffold tools.
 *
 * @module tools/scapi
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createScapiSchemasListTool} from './scapi-schemas-list.js';
import {createScapiCustomApisStatusTool} from './scapi-custom-apis-status.js';
import {createScaffoldCustomApiTool} from './scapi-customapi-scaffold.js';

/**
 * Creates all tools for the SCAPI toolset.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns Array of MCP tools
 */
export function createScapiTools(loadServices: () => Services): McpTool[] {
  return [
    createScapiSchemasListTool(loadServices),
    createScapiCustomApisStatusTool(loadServices),
    createScaffoldCustomApiTool(loadServices),
  ];
}
