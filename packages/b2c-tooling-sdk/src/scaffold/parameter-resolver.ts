/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import type {B2CInstance} from '../instance/index.js';
import type {Scaffold, ScaffoldParameter, ScaffoldChoice} from './types.js';
import {evaluateCondition} from './validators.js';
import {resolveLocalSource, resolveRemoteSource, isRemoteSource, validateAgainstSource} from './sources.js';

/**
 * Options for resolving scaffold parameters.
 */
export interface ResolveParametersOptions {
  /** Pre-provided variables (from flags, env, etc.) */
  providedVariables?: Record<string, string | boolean | string[]>;
  /** Project root for resolving local sources */
  projectRoot?: string;
  /** B2C instance for resolving remote sources (sites) */
  b2cInstance?: B2CInstance;
  /** Use defaults for missing values instead of erroring */
  useDefaults?: boolean;
}

/**
 * Error encountered during parameter validation.
 */
export interface ParameterResolutionError {
  /** Parameter name */
  parameter: string;
  /** Error message */
  message: string;
  /** The invalid value, if applicable */
  value?: unknown;
  /** Available choices, if applicable */
  availableChoices?: string[];
}

/**
 * Result of resolving scaffold parameters.
 */
export interface ResolvedParameters {
  /** All resolved variable values */
  variables: Record<string, string | boolean | string[]>;
  /** Parameters still missing values (need prompting) */
  missingParameters: ScaffoldParameter[];
  /** Validation errors encountered */
  errors: ParameterResolutionError[];
}

/**
 * Schema for a resolved parameter with source choices populated.
 */
export interface ResolvedParameterSchema {
  /** Parameter definition */
  parameter: ScaffoldParameter;
  /** Resolved choices from dynamic source */
  resolvedChoices?: ScaffoldChoice[];
  /** Path map for cartridges (name -> absolute path) */
  pathMap?: Map<string, string>;
  /** Warning message if source resolution failed */
  warning?: string;
}

/**
 * Path to use for scaffold destination so files are generated under outputDir (e.g. working directory).
 * Returns a path relative to projectRoot when the cartridge is under projectRoot, so the executor
 * joins with outputDir instead of ignoring it. Otherwise returns the absolute path.
 */
function cartridgePathForDestination(absolutePath: string, projectRoot: string): string {
  const normalizedRoot = path.resolve(projectRoot);
  const normalizedPath = path.resolve(absolutePath);
  const relative = path.relative(normalizedRoot, normalizedPath);
  // Use relative path only when cartridge is under projectRoot (no leading '..')
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative;
  }
  return absolutePath;
}

/**
 * Resolve scaffold parameters by:
 * 1. Validating provided variables against sources
 * 2. Setting companion path variables for cartridges
 * 3. Applying defaults where appropriate
 * 4. Filtering by condition (`when` field)
 * 5. Collecting missing required parameters
 *
 * @param scaffold - The scaffold to resolve parameters for
 * @param options - Resolution options
 * @returns Resolved parameters, missing parameters, and any errors
 */
export async function resolveScaffoldParameters(
  scaffold: Scaffold,
  options: ResolveParametersOptions = {},
): Promise<ResolvedParameters> {
  const {providedVariables = {}, projectRoot = process.cwd(), useDefaults = false} = options;

  const variables: Record<string, string | boolean | string[]> = {...providedVariables};
  const missingParameters: ScaffoldParameter[] = [];
  const errors: ParameterResolutionError[] = [];

  // Cache for cartridge paths (only resolved once if needed)
  let cartridgePathMap: Map<string, string> | undefined;

  for (const param of scaffold.manifest.parameters) {
    // Check if conditional parameter should be evaluated
    if (param.when && !evaluateCondition(param.when, variables)) {
      continue;
    }

    // If value was already provided, validate it against source
    if (variables[param.name] !== undefined && param.source) {
      const providedValue = String(variables[param.name]);
      const validation = validateAgainstSource(param.source, providedValue, projectRoot);

      if (!validation.valid) {
        errors.push({
          parameter: param.name,
          message: `Invalid value "${providedValue}" for ${param.name}. Available ${param.source}: ${validation.availableChoices?.join(', ') || 'none'}`,
          value: providedValue,
          availableChoices: validation.availableChoices,
        });
        continue;
      }

      // Set companion path variable for cartridges source (relative to projectRoot when under it so outputDir is used)
      if (param.source === 'cartridges') {
        if (!cartridgePathMap) {
          const result = resolveLocalSource('cartridges', projectRoot);
          cartridgePathMap = result.pathMap;
        }
        const cartridgePath = cartridgePathMap?.get(providedValue);
        if (cartridgePath) {
          variables[`${param.name}Path`] = cartridgePathForDestination(cartridgePath, projectRoot);
        }
      }
      continue;
    }

    // Skip if already provided (no source validation needed)
    if (variables[param.name] !== undefined) {
      continue;
    }

    // Use default if available and useDefaults is enabled
    if (useDefaults && param.default !== undefined) {
      variables[param.name] = param.default;

      // Set companion path variable for cartridges source with default value
      if (param.source === 'cartridges' && typeof param.default === 'string') {
        if (!cartridgePathMap) {
          const result = resolveLocalSource('cartridges', projectRoot);
          cartridgePathMap = result.pathMap;
        }
        const cartridgePath = cartridgePathMap?.get(param.default);
        if (cartridgePath) {
          variables[`${param.name}Path`] = cartridgePathForDestination(cartridgePath, projectRoot);
        }
      }
      continue;
    }

    // Parameter is missing - track it
    if (param.required || param.default === undefined) {
      missingParameters.push(param);
    } else if (param.default !== undefined) {
      // Optional parameter with default - apply it
      variables[param.name] = param.default;
    }
  }

  return {variables, missingParameters, errors};
}

/**
 * Parse key=value option strings into variables object.
 * Handles boolean values and array values for multi-choice params.
 *
 * @param options - Array of "key=value" strings
 * @param scaffold - Optional scaffold for multi-choice detection
 * @returns Variables object
 */
export function parseParameterOptions(
  options: string[],
  scaffold?: Scaffold,
): Record<string, boolean | string | string[]> {
  const variables: Record<string, boolean | string | string[]> = {};

  // Build set of multi-choice parameter names
  const multiChoiceParams = new Set<string>();
  if (scaffold) {
    for (const param of scaffold.manifest.parameters) {
      if (param.type === 'multi-choice') {
        multiChoiceParams.add(param.name);
      }
    }
  }

  for (const opt of options) {
    const eqIndex = opt.indexOf('=');
    if (eqIndex === -1) {
      // No equals sign - treat as boolean flag
      variables[opt] = true;
    } else {
      const key = opt.slice(0, Math.max(0, eqIndex));
      const value = opt.slice(Math.max(0, eqIndex + 1));

      if (value === 'true') {
        variables[key] = true;
      } else if (value === 'false') {
        variables[key] = false;
      } else if (multiChoiceParams.has(key)) {
        // Split comma-separated values for multi-choice parameters
        variables[key] = value.split(',').map((v) => v.trim());
      } else {
        variables[key] = value;
      }
    }
  }

  return variables;
}

/**
 * Get parameter metadata with resolved source choices.
 * Useful for MCP/other consumers to build input schemas.
 *
 * @param scaffold - The scaffold to get parameter schemas for
 * @param options - Options for resolving sources
 * @returns Array of resolved parameter schemas
 */
export async function getParameterSchemas(
  scaffold: Scaffold,
  options: {projectRoot?: string; b2cInstance?: B2CInstance} = {},
): Promise<ResolvedParameterSchema[]> {
  const {projectRoot = process.cwd(), b2cInstance} = options;
  const schemas: ResolvedParameterSchema[] = [];

  for (const param of scaffold.manifest.parameters) {
    const schema: ResolvedParameterSchema = {parameter: param};

    if (param.source) {
      if (isRemoteSource(param.source)) {
        // Remote source - needs B2C instance
        if (b2cInstance) {
          try {
            schema.resolvedChoices = await resolveRemoteSource(param.source, b2cInstance);
          } catch (error) {
            schema.warning = `Could not fetch ${param.source}: ${(error as Error).message}`;
            schema.resolvedChoices = [];
          }
        } else {
          schema.warning = `Remote source '${param.source}' requires B2C instance`;
          schema.resolvedChoices = [];
        }
      } else {
        // Local source
        const result = resolveLocalSource(param.source, projectRoot);
        schema.resolvedChoices = result.choices;
        schema.pathMap = result.pathMap;
      }
    } else if (param.choices) {
      // Static choices
      schema.resolvedChoices = param.choices;
    }

    schemas.push(schema);
  }

  return schemas;
}
