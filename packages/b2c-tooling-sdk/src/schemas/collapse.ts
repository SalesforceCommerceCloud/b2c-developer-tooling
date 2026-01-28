/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * OpenAPI schema collapsing utilities for agentic clients.
 *
 * These utilities implement a three-tier disclosure model for OpenAPI schemas:
 * - **Collapsed** (default): Show structure only - paths as method names, schemas as keys
 * - **Selective expansion**: Full details for specific items only
 * - **Full expansion**: Complete schema without any collapsing
 *
 * This approach addresses context length concerns when working with large OpenAPI
 * schemas in agentic/LLM contexts.
 *
 * @module schemas/collapse
 */

/**
 * Options for collapsing an OpenAPI schema.
 */
export interface SchemaCollapseOptions {
  /**
   * Paths to fully expand (e.g., ["/products", "/orders"]).
   * When provided, only these paths will have full operation details.
   * Other paths will show only their HTTP method names.
   */
  expandPaths?: string[];

  /**
   * Schema names to fully expand (e.g., ["Product", "Order"]).
   * When provided, only these schemas will have full definitions.
   * Other schemas will be shown as empty objects.
   */
  expandSchemas?: string[];

  /**
   * Example names to fully expand (e.g., ["ProductExample"]).
   * When provided, only these examples will have full content.
   * Other examples will be shown as empty objects.
   */
  expandExamples?: string[];
}

/**
 * Represents an OpenAPI 3.x schema structure.
 * This is a simplified type that captures the structure we need for collapsing.
 */
export interface OpenApiSchemaInput {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: unknown[];
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    examples?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    responses?: Record<string, unknown>;
    requestBodies?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
    links?: Record<string, unknown>;
    callbacks?: Record<string, unknown>;
  };
  security?: unknown[];
  tags?: unknown[];
  externalDocs?: unknown;
  [key: string]: unknown;
}

/**
 * Represents a collapsed path entry.
 * When collapsed, a path only shows the HTTP methods it supports.
 */
export type CollapsedPath = string[] | Record<string, unknown>;

/**
 * The output schema structure after collapsing.
 */
export interface CollapsedOpenApiSchema {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: unknown[];
  paths?: Record<string, CollapsedPath>;
  components?: {
    schemas?: Record<string, unknown>;
    examples?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    responses?: Record<string, unknown>;
    requestBodies?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
    links?: Record<string, unknown>;
    callbacks?: Record<string, unknown>;
  };
  security?: unknown[];
  tags?: unknown[];
  externalDocs?: unknown;
  [key: string]: unknown;
}

/** HTTP methods that can appear in OpenAPI paths */
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

/**
 * Collapses an OpenAPI schema for context-efficient representation.
 *
 * This function implements a three-tier disclosure model:
 *
 * 1. **No options provided (default):**
 *    - Paths: `{"/products": ["get", "post"]}` (method names only)
 *    - Schemas: `{"Product": {}}` (keys only)
 *    - Examples: `{"ProductExample": {}}` (keys only)
 *
 * 2. **Selective expansion:**
 *    - Only specified paths/schemas/examples are fully expanded
 *    - Everything else remains collapsed
 *
 * Non-collapsible sections (info, servers, security, tags, etc.) are preserved as-is.
 *
 * @param schema - The OpenAPI schema to collapse
 * @param options - Options controlling what to expand
 * @returns The collapsed schema
 *
 * @example
 * // Collapse everything (default behavior)
 * const collapsed = collapseOpenApiSchema(fullSchema);
 *
 * @example
 * // Expand only /products path and Product schema
 * const collapsed = collapseOpenApiSchema(fullSchema, {
 *   expandPaths: ['/products'],
 *   expandSchemas: ['Product']
 * });
 */
export function collapseOpenApiSchema(
  schema: OpenApiSchemaInput,
  options: SchemaCollapseOptions = {},
): CollapsedOpenApiSchema {
  const {expandPaths = [], expandSchemas = [], expandExamples = []} = options;

  // Start with a shallow copy
  const result: CollapsedOpenApiSchema = {...schema};

  // Collapse paths
  if (schema.paths) {
    result.paths = collapsePaths(schema.paths, expandPaths);
  }

  // Collapse components
  if (schema.components) {
    result.components = {
      ...schema.components,
    };

    if (schema.components.schemas) {
      result.components.schemas = collapseSchemas(schema.components.schemas, expandSchemas);
    }

    if (schema.components.examples) {
      result.components.examples = collapseExamples(schema.components.examples, expandExamples);
    }
  }

  return result;
}

/**
 * Collapses path items to show only HTTP method names.
 *
 * @param paths - The paths object from an OpenAPI schema
 * @param expandPaths - Paths to keep fully expanded
 * @returns Collapsed paths object
 */
function collapsePaths(
  paths: Record<string, Record<string, unknown>>,
  expandPaths: string[],
): Record<string, CollapsedPath> {
  const result: Record<string, CollapsedPath> = {};
  const expandSet = new Set(expandPaths);

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (expandSet.has(pathKey)) {
      // Keep full path item for expanded paths
      result[pathKey] = pathItem;
    } else {
      // Collapse to method names only
      const methods = Object.keys(pathItem).filter((key) =>
        HTTP_METHODS.includes(key as (typeof HTTP_METHODS)[number]),
      );
      result[pathKey] = methods;
    }
  }

  return result;
}

/**
 * Collapses schemas to show only keys with empty objects.
 *
 * @param schemas - The schemas object from components
 * @param expandSchemas - Schema names to keep fully expanded
 * @returns Collapsed schemas object
 */
function collapseSchemas(schemas: Record<string, unknown>, expandSchemas: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const expandSet = new Set(expandSchemas);

  for (const [schemaName, schemaValue] of Object.entries(schemas)) {
    if (expandSet.has(schemaName)) {
      // Keep full schema for expanded schemas
      result[schemaName] = schemaValue;
    } else {
      // Collapse to empty object
      result[schemaName] = {};
    }
  }

  return result;
}

/**
 * Collapses examples to show only keys with empty objects.
 *
 * @param examples - The examples object from components
 * @param expandExamples - Example names to keep fully expanded
 * @returns Collapsed examples object
 */
function collapseExamples(examples: Record<string, unknown>, expandExamples: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const expandSet = new Set(expandExamples);

  for (const [exampleName, exampleValue] of Object.entries(examples)) {
    if (expandSet.has(exampleName)) {
      // Keep full example for expanded examples
      result[exampleName] = exampleValue;
    } else {
      // Collapse to empty object
      result[exampleName] = {};
    }
  }

  return result;
}

/**
 * Checks if a schema has been collapsed (i.e., is in outline form).
 *
 * @param schema - The schema to check
 * @returns true if paths are collapsed (arrays) or schemas are empty objects
 */
export function isCollapsedSchema(schema: CollapsedOpenApiSchema): boolean {
  // Check if any path is collapsed (array of methods instead of full path item)
  if (schema.paths) {
    for (const pathItem of Object.values(schema.paths)) {
      if (Array.isArray(pathItem)) {
        return true;
      }
    }
  }

  // Check if any schema is collapsed (empty object)
  if (schema.components?.schemas) {
    for (const schemaValue of Object.values(schema.components.schemas)) {
      if (typeof schemaValue === 'object' && schemaValue !== null && Object.keys(schemaValue).length === 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Gets the list of available path keys from a schema.
 *
 * @param schema - The OpenAPI schema
 * @returns Array of path keys (e.g., ["/products", "/orders"])
 */
export function getPathKeys(schema: OpenApiSchemaInput | CollapsedOpenApiSchema): string[] {
  return schema.paths ? Object.keys(schema.paths) : [];
}

/**
 * Gets the list of available schema names from a schema.
 *
 * @param schema - The OpenAPI schema
 * @returns Array of schema names (e.g., ["Product", "Order"])
 */
export function getSchemaNames(schema: OpenApiSchemaInput | CollapsedOpenApiSchema): string[] {
  return schema.components?.schemas ? Object.keys(schema.components.schemas) : [];
}

/**
 * Gets the list of available example names from a schema.
 *
 * @param schema - The OpenAPI schema
 * @returns Array of example names
 */
export function getExampleNames(schema: OpenApiSchemaInput | CollapsedOpenApiSchema): string[] {
  return schema.components?.examples ? Object.keys(schema.components.examples) : [];
}
