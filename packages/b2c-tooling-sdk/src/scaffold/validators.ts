/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {
  ScaffoldManifest,
  ParameterValidationError,
  ParameterValidationResult,
  ScaffoldCategory,
  DynamicParameterSource,
} from './types.js';

/** Valid scaffold categories */
const VALID_CATEGORIES: ScaffoldCategory[] = ['cartridge', 'custom-api', 'page-designer', 'job', 'metadata'];

/** Valid parameter types */
const VALID_PARAMETER_TYPES = ['string', 'boolean', 'choice', 'multi-choice'];

/** Reserved variable names that cannot be used as parameter names */
const RESERVED_NAMES = ['kebabCase', 'camelCase', 'pascalCase', 'snakeCase', 'year', 'date', 'uuid'];

/** Valid dynamic parameter sources */
const VALID_SOURCES: DynamicParameterSource[] = ['cartridges', 'hook-points', 'sites'];

/**
 * Validate a scaffold manifest
 * @param manifest - The manifest to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateScaffoldManifest(manifest: unknown): string[] {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return ['Manifest must be an object'];
  }

  const m = manifest as Record<string, unknown>;

  // Required fields
  if (!m.name || typeof m.name !== 'string') {
    errors.push('Manifest must have a "name" field (string)');
  } else if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(m.name) && m.name.length > 1) {
    errors.push('Manifest "name" must be kebab-case (lowercase letters, numbers, hyphens)');
  }

  if (!m.displayName || typeof m.displayName !== 'string') {
    errors.push('Manifest must have a "displayName" field (string)');
  }

  if (!m.description || typeof m.description !== 'string') {
    errors.push('Manifest must have a "description" field (string)');
  }

  if (!m.category || typeof m.category !== 'string') {
    errors.push('Manifest must have a "category" field (string)');
  } else if (!VALID_CATEGORIES.includes(m.category as ScaffoldCategory)) {
    errors.push(`Manifest "category" must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!m.version || m.version !== '1.0') {
    errors.push('Manifest must have "version": "1.0"');
  }

  // Parameters validation
  if (!Array.isArray(m.parameters)) {
    errors.push('Manifest must have a "parameters" array');
  } else {
    const paramNames = new Set<string>();
    for (let i = 0; i < m.parameters.length; i++) {
      const param = m.parameters[i];
      const prefix = `parameters[${i}]`;

      if (!param || typeof param !== 'object') {
        errors.push(`${prefix}: must be an object`);
        continue;
      }

      const p = param as Record<string, unknown>;

      if (!p.name || typeof p.name !== 'string') {
        errors.push(`${prefix}: must have a "name" field (string)`);
      } else {
        if (!/^[a-z][a-zA-Z0-9]*$/.test(p.name)) {
          errors.push(`${prefix}: "name" must be camelCase (start with lowercase letter)`);
        }
        if (paramNames.has(p.name)) {
          errors.push(`${prefix}: duplicate parameter name "${p.name}"`);
        }
        if (RESERVED_NAMES.includes(p.name)) {
          errors.push(`${prefix}: "${p.name}" is a reserved name`);
        }
        paramNames.add(p.name);
      }

      if (!p.prompt || typeof p.prompt !== 'string') {
        errors.push(`${prefix}: must have a "prompt" field (string)`);
      }

      if (!p.type || typeof p.type !== 'string') {
        errors.push(`${prefix}: must have a "type" field (string)`);
      } else if (!VALID_PARAMETER_TYPES.includes(p.type)) {
        errors.push(`${prefix}: "type" must be one of: ${VALID_PARAMETER_TYPES.join(', ')}`);
      }

      if (typeof p.required !== 'boolean') {
        errors.push(`${prefix}: must have a "required" field (boolean)`);
      }

      // Source validation
      if (p.source !== undefined) {
        if (typeof p.source !== 'string') {
          errors.push(`${prefix}: "source" must be a string`);
        } else if (!VALID_SOURCES.includes(p.source as DynamicParameterSource)) {
          errors.push(`${prefix}: "source" must be one of: ${VALID_SOURCES.join(', ')}`);
        }
      }

      // Choice validation (choices are optional if source is provided)
      if ((p.type === 'choice' || p.type === 'multi-choice') && !Array.isArray(p.choices) && !p.source) {
        errors.push(`${prefix}: choice/multi-choice types must have a "choices" array or a "source" field`);
      } else if (Array.isArray(p.choices)) {
        for (let j = 0; j < p.choices.length; j++) {
          const choice = p.choices[j] as Record<string, unknown>;
          if (!choice || typeof choice !== 'object') {
            errors.push(`${prefix}.choices[${j}]: must be an object`);
          } else {
            if (!choice.value || typeof choice.value !== 'string') {
              errors.push(`${prefix}.choices[${j}]: must have a "value" field (string)`);
            }
            if (!choice.label || typeof choice.label !== 'string') {
              errors.push(`${prefix}.choices[${j}]: must have a "label" field (string)`);
            }
          }
        }
      }

      // Pattern validation
      if (p.pattern !== undefined && typeof p.pattern !== 'string') {
        errors.push(`${prefix}: "pattern" must be a string`);
      } else if (typeof p.pattern === 'string') {
        try {
          new RegExp(p.pattern);
        } catch {
          errors.push(`${prefix}: "pattern" is not a valid regex`);
        }
      }
    }
  }

  // Files validation (optional)
  if (m.files !== undefined) {
    if (!Array.isArray(m.files)) {
      errors.push('Manifest "files" must be an array');
    } else {
      for (let i = 0; i < m.files.length; i++) {
        const file = m.files[i] as Record<string, unknown>;
        const prefix = `files[${i}]`;

        if (!file || typeof file !== 'object') {
          errors.push(`${prefix}: must be an object`);
          continue;
        }

        if (!file.template || typeof file.template !== 'string') {
          errors.push(`${prefix}: must have a "template" field (string)`);
        }

        if (!file.destination || typeof file.destination !== 'string') {
          errors.push(`${prefix}: must have a "destination" field (string)`);
        }
      }
    }
  }

  return errors;
}

/**
 * Check if a condition expression is satisfied
 * @param condition - The condition expression (e.g., "paramName=value" or "paramName")
 * @param variables - The current variable values
 * @returns Whether the condition is satisfied
 */
export function evaluateCondition(
  condition: string | undefined,
  variables: Record<string, string | boolean | string[]>,
): boolean {
  if (!condition) {
    return true;
  }

  // Handle equality check: "paramName=value"
  if (condition.includes('=')) {
    const [paramName, expectedValue] = condition.split('=', 2);
    const actualValue = variables[paramName];

    if (Array.isArray(actualValue)) {
      return actualValue.includes(expectedValue);
    }

    return String(actualValue) === expectedValue;
  }

  // Handle negation: "!paramName"
  if (condition.startsWith('!')) {
    const paramName = condition.slice(1);
    const value = variables[paramName];
    return !value || value === '' || (Array.isArray(value) && value.length === 0);
  }

  // Handle truthy check: "paramName"
  const value = variables[condition];
  return Boolean(value) && value !== '' && !(Array.isArray(value) && value.length === 0);
}

/**
 * Validate parameter values against a manifest
 * @param manifest - The scaffold manifest
 * @param values - The parameter values to validate
 * @returns Validation result
 */
export function validateParameters(
  manifest: ScaffoldManifest,
  values: Record<string, string | boolean | string[] | undefined>,
): ParameterValidationResult {
  const errors: ParameterValidationError[] = [];
  const resolvedValues: Record<string, string | boolean | string[]> = {};

  for (const param of manifest.parameters) {
    // Check if this parameter should be evaluated (based on `when` condition)
    if (param.when && !evaluateCondition(param.when, resolvedValues)) {
      // Parameter is conditional and condition not met - skip it
      continue;
    }

    let value = values[param.name];

    // Use default if not provided
    if (value === undefined || value === '') {
      if (param.default !== undefined) {
        value = param.default;
      }
    }

    // Required check
    if (param.required) {
      const isEmpty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        errors.push({
          parameter: param.name,
          message: `"${param.name}" is required`,
          value,
        });
        continue;
      }
    }

    // Type-specific validation
    if (value !== undefined && value !== '') {
      switch (param.type) {
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push({
              parameter: param.name,
              message: `"${param.name}" must be a boolean`,
              value,
            });
          } else {
            // Normalize to boolean
            resolvedValues[param.name] = value === true || value === 'true';
          }
          break;

        case 'string':
          if (typeof value !== 'string') {
            errors.push({
              parameter: param.name,
              message: `"${param.name}" must be a string`,
              value,
            });
          } else {
            // Pattern validation
            if (param.pattern) {
              const regex = new RegExp(param.pattern);
              if (!regex.test(value)) {
                errors.push({
                  parameter: param.name,
                  message: param.validationMessage || `"${param.name}" does not match required pattern`,
                  value,
                });
              }
            }
            resolvedValues[param.name] = value;
          }
          break;

        case 'choice':
          if (typeof value !== 'string') {
            errors.push({
              parameter: param.name,
              message: `"${param.name}" must be a string`,
              value,
            });
          } else if (param.choices) {
            const validValues = param.choices.map((c) => c.value);
            if (!validValues.includes(value)) {
              errors.push({
                parameter: param.name,
                message: `"${param.name}" must be one of: ${validValues.join(', ')}`,
                value,
              });
            } else {
              resolvedValues[param.name] = value;
            }
          }
          break;

        case 'multi-choice':
          {
            const arr = Array.isArray(value) ? value : [String(value)];
            if (param.choices) {
              const validValues = param.choices.map((c) => c.value);
              for (const v of arr) {
                if (!validValues.includes(v)) {
                  errors.push({
                    parameter: param.name,
                    message: `"${param.name}" contains invalid value "${v}". Must be one of: ${validValues.join(', ')}`,
                    value,
                  });
                }
              }
            }
            resolvedValues[param.name] = arr;
          }
          break;
      }
    } else if (value !== undefined) {
      // Value is defined but empty - still store it if not required
      if (param.type === 'multi-choice') {
        resolvedValues[param.name] = [];
      } else if (param.type === 'boolean') {
        resolvedValues[param.name] = false;
      } else {
        resolvedValues[param.name] = '';
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    values: resolvedValues,
  };
}

/**
 * Validate that a string is a valid scaffold name (kebab-case)
 * @param name - The name to validate
 * @returns Whether the name is valid
 */
export function isValidScaffoldName(name: string): boolean {
  return /^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) || /^[a-z]$/.test(name);
}

/**
 * Validate that a string is a valid parameter name (camelCase)
 * @param name - The name to validate
 * @returns Whether the name is valid
 */
export function isValidParameterName(name: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(name) && !RESERVED_NAMES.includes(name);
}
