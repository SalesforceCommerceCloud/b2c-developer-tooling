/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * OpenAPI Schema utilities for B2C Commerce.
 *
 * Provides utilities for working with OpenAPI schemas, including
 * collapsing large schemas for context-efficient representation in
 * agentic/LLM scenarios.
 *
 * ## Schema Collapsing
 *
 * Use {@link collapseOpenApiSchema} to reduce the size of large OpenAPI schemas
 * while preserving structure for discovery:
 *
 * ```typescript
 * import { collapseOpenApiSchema } from '@salesforce/b2c-tooling-sdk/schemas';
 *
 * // Collapse to outline form (default)
 * const collapsed = collapseOpenApiSchema(fullSchema);
 * // Result: paths show only ["get", "post"], schemas show only {}
 *
 * // Selectively expand specific items
 * const collapsed = collapseOpenApiSchema(fullSchema, {
 *   expandPaths: ['/products/search'],
 *   expandSchemas: ['Product', 'SearchResult']
 * });
 * ```
 *
 * ## Utility Functions
 *
 * Helper functions for inspecting schemas:
 *
 * ```typescript
 * import {
 *   getPathKeys,
 *   getSchemaNames,
 *   isCollapsedSchema,
 *   getApiType
 * } from '@salesforce/b2c-tooling-sdk/schemas';
 *
 * // Get available paths
 * const paths = getPathKeys(schema); // ["/products", "/orders", ...]
 *
 * // Get available schemas
 * const schemas = getSchemaNames(schema); // ["Product", "Order", ...]
 *
 * // Check if schema is collapsed
 * if (isCollapsedSchema(schema)) {
 *   console.log('Schema is in collapsed form');
 * }
 *
 * // Map security scheme to API type
 * const apiType = getApiType('AmOAuth2'); // Returns 'Admin'
 * ```
 *
 * @module schemas
 */

// Collapse utilities
export {collapseOpenApiSchema, isCollapsedSchema, getPathKeys, getSchemaNames, getExampleNames} from './collapse.js';
// Security scheme utilities
export {getApiType} from './security-schemes.js';

// Types
export type {SchemaCollapseOptions, OpenApiSchemaInput, CollapsedOpenApiSchema, CollapsedPath} from './collapse.js';
