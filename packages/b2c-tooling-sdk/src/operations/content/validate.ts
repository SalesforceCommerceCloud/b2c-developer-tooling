/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {Validator, type ValidatorResult, type Schema} from 'jsonschema';

// Resolve the content-schemas data directory from the package root
const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));
export const CONTENT_SCHEMAS_DIR = path.join(packageRoot, 'data/content-schemas');

/** Top-level schema types that users validate files against. */
export const CONTENT_SCHEMA_TYPES = [
  'pagetype',
  'componenttype',
  'aspecttype',
  'cmsrecord',
  'customeditortype',
  'contentassetpageconfig',
  'contentassetcomponentconfig',
  'contentassetstructuredcontentdata',
  'image',
] as const;

export type ContentSchemaType = (typeof CONTENT_SCHEMA_TYPES)[number];

export interface MetaDefinitionValidationError {
  /** JSON pointer path to the error (e.g., "/region_definitions/0/id") */
  path: string;
  /** Human-readable error message */
  message: string;
  /** The name of the failing property or keyword */
  property: string;
}

export interface MetaDefinitionValidationResult {
  /** Whether the data is valid against the schema */
  valid: boolean;
  /** Detected or specified schema type */
  schemaType: ContentSchemaType;
  /** Validation errors (empty if valid) */
  errors: MetaDefinitionValidationError[];
  /** Source file path (if validated from file) */
  filePath?: string;
}

export interface ValidateMetaDefinitionOptions {
  /** Explicit schema type (overrides auto-detection) */
  type?: ContentSchemaType;
}

/**
 * Error thrown when the schema type cannot be determined from the file path or data.
 */
export class MetaDefinitionDetectionError extends Error {
  constructor(message?: string) {
    super(
      message ??
        `Unable to detect meta definition type. Use --type to specify one of: ${CONTENT_SCHEMA_TYPES.join(', ')}`,
    );
    this.name = 'MetaDefinitionDetectionError';
  }
}

// Lazy-loaded validator singleton
let validatorInstance: Validator | null = null;

function getValidator(): Validator {
  if (validatorInstance) return validatorInstance;

  validatorInstance = new Validator();

  // Load all schemas so $ref resolution works across files
  for (const file of fs.readdirSync(CONTENT_SCHEMAS_DIR)) {
    if (file.endsWith('.json')) {
      const schemaPath = path.join(CONTENT_SCHEMAS_DIR, file);
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) as Schema;
      // Register with /<filename> URI so relative $ref like "common.json#/definitions/name" resolves
      // (jsonschema resolves relative refs against the parent schema's URI)
      validatorInstance.addSchema(schema, `/${file}`);
    }
  }

  return validatorInstance;
}

/**
 * Detect the metadefinition schema type from a file path using Page Designer conventions.
 *
 * - `experience/pages/` → `pagetype`
 * - `experience/components/` → `componenttype`
 */
export function detectTypeFromPath(filePath: string): ContentSchemaType | null {
  const normalized = filePath.replace(/\\/g, '/');
  if (/experience\/pages\//.test(normalized)) return 'pagetype';
  if (/experience\/components\//.test(normalized)) return 'componenttype';
  return null;
}

/**
 * Detect the metadefinition schema type from the data's top-level properties.
 */
export function detectTypeFromData(data: Record<string, unknown>): ContentSchemaType | null {
  const keys = new Set(Object.keys(data));

  if (keys.has('region_definitions')) {
    return keys.has('group') ? 'componenttype' : 'pagetype';
  }
  if (keys.has('supported_object_types')) return 'aspecttype';
  if (keys.has('path')) return 'image';
  if (keys.has('resources')) return 'customeditortype';
  if (keys.has('data_binding')) return 'contentassetcomponentconfig';
  if (keys.has('visibility') && !keys.has('data_binding')) return 'contentassetpageconfig';
  if (keys.has('attributes') && keys.has('type')) return 'cmsrecord';
  return null;
}

/**
 * Detect the metadefinition schema type using a 3-tier strategy:
 * 1. File path convention (if filePath provided)
 * 2. Property heuristics from data
 * 3. Returns null if neither works (caller should use explicit --type or throw)
 */
export function detectMetaDefinitionType(data: Record<string, unknown>, filePath?: string): ContentSchemaType | null {
  if (filePath) {
    const fromPath = detectTypeFromPath(filePath);
    if (fromPath) return fromPath;
  }
  return detectTypeFromData(data);
}

function mapErrors(result: ValidatorResult): MetaDefinitionValidationError[] {
  return result.errors.map((err) => ({
    path: err.property.replace(/^instance/, '') || '/',
    message: err.message,
    property: err.property,
  }));
}

/**
 * Validate a parsed JSON object against a content metadefinition schema.
 *
 * @throws {MetaDefinitionDetectionError} When the schema type cannot be detected and no explicit type is provided.
 */
export function validateMetaDefinition(
  data: Record<string, unknown>,
  options?: ValidateMetaDefinitionOptions,
): MetaDefinitionValidationResult {
  const schemaType = options?.type ?? detectMetaDefinitionType(data);

  if (!schemaType) {
    throw new MetaDefinitionDetectionError();
  }

  const validator = getValidator();
  const result = validator.validate(data, {$ref: `/${schemaType}.json`});

  return {
    valid: result.valid,
    schemaType,
    errors: mapErrors(result),
  };
}

/**
 * Validate a JSON metadefinition file against a content schema.
 *
 * Uses file path conventions for type detection before falling back to property heuristics.
 *
 * @throws {MetaDefinitionDetectionError} When the schema type cannot be detected and no explicit type is provided.
 */
export function validateMetaDefinitionFile(
  filePath: string,
  options?: ValidateMetaDefinitionOptions,
): MetaDefinitionValidationResult {
  const absolutePath = path.resolve(filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(content) as Record<string, unknown>;
  } catch (err) {
    return {
      valid: false,
      schemaType: options?.type ?? ('unknown' as ContentSchemaType),
      errors: [
        {
          path: '/',
          message: `Invalid JSON: ${(err as Error).message}`,
          property: 'instance',
        },
      ],
      filePath: absolutePath,
    };
  }

  const schemaType = options?.type ?? detectMetaDefinitionType(data, absolutePath);

  if (!schemaType) {
    throw new MetaDefinitionDetectionError();
  }

  const validator = getValidator();
  const result = validator.validate(data, {$ref: `${schemaType}.json`});

  return {
    valid: result.valid,
    schemaType,
    errors: mapErrors(result),
    filePath: absolutePath,
  };
}
