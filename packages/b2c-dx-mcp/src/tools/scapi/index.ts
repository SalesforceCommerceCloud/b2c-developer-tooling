/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Salesforce Commerce API (SCAPI) discovery and exploration.
 * Includes standard SCAPI schemas, custom API status, and observability metrics.
 *
 * @module tools/scapi
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createMetricsGetTool} from './metrics-get.js';
import {createScapiCustomApisStatusTool} from './scapi-custom-apis-get-status.js';
import {createScapiSchemasListTool} from './scapi-schemas-list.js';
import {createScapiCodeTools} from './scapi-code.js';
import {ScapiLiveSchemaCache, ScapiShopperSessions, type ScapiSchemaDocument} from '@salesforce/b2c-tooling-sdk/scapi';
import type {ScapiExecutionRegistry} from './execution-registry.js';

/**
 * Creates all tools for the SCAPI toolset.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @param executions - Server-scoped registry for retained code-mode executions
 * @param localSchemas - Developer-supplied contracts that override bundled and live ones in code mode
 * @returns Array of MCP tools
 */
export function createScapiTools(
  loadServices: () => Promise<Services> | Services,
  executions?: ScapiExecutionRegistry,
  localSchemas: readonly ScapiSchemaDocument[] = [],
): McpTool[] {
  // Live contracts discovered by search or schema fetches are reused by execution for the same tenant.
  const schemaCache = new ScapiLiveSchemaCache();
  const shopperSessions = new ScapiShopperSessions();
  return [
    ...createScapiCodeTools(loadServices, undefined, executions, schemaCache, shopperSessions, localSchemas),
    createMetricsGetTool(loadServices),
    createScapiCustomApisStatusTool(loadServices),
    createScapiSchemasListTool(loadServices, schemaCache),
  ];
}
