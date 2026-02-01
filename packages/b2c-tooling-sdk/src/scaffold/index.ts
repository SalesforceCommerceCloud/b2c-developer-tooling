/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Scaffold generation for B2C Commerce projects.
 *
 * This module provides functions for discovering, validating, and executing
 * project scaffolds (templates) for cartridges, custom APIs, Page Designer
 * components, jobs, and other B2C artifacts.
 *
 * ## Scaffold Discovery
 *
 * Scaffolds are discovered from multiple sources in priority order:
 *
 * 1. **Project scaffolds** (`.b2c/scaffolds/`) - highest priority
 * 2. **Plugin scaffolds** (via `b2c:scaffold-providers` hook)
 * 3. **User scaffolds** (`~/.b2c/scaffolds/`)
 * 4. **Built-in scaffolds** - lowest priority
 *
 * Later sources override earlier ones by name.
 *
 * - {@link ScaffoldRegistry} - Registry for managing scaffold discovery
 * - {@link createScaffoldRegistry} - Create a new registry instance
 *
 * ## Scaffold Generation
 *
 * - {@link generateFromScaffold} - Generate files from a scaffold
 * - {@link previewScaffold} - Preview generation without writing files
 *
 * ## Template Engine
 *
 * - {@link ScaffoldEngine} - EJS-based template rendering engine
 *
 * ## Validation
 *
 * - {@link validateScaffoldManifest} - Validate a scaffold manifest
 * - {@link validateParameters} - Validate parameter values
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   createScaffoldRegistry,
 *   generateFromScaffold,
 * } from '@salesforce/b2c-tooling-sdk/scaffold';
 *
 * // Create registry and find scaffolds
 * const registry = createScaffoldRegistry();
 * const scaffolds = await registry.getScaffolds();
 *
 * // Get a specific scaffold
 * const cartridgeScaffold = await registry.getScaffold('cartridge');
 *
 * // Generate files
 * const result = await generateFromScaffold(cartridgeScaffold, {
 *   outputDir: './output',
 *   variables: { cartridgeName: 'app_custom' },
 * });
 * ```
 *
 * @module scaffold
 */

// Types
export type {
  ScaffoldManifest,
  ScaffoldParameter,
  ScaffoldChoice,
  ScaffoldParameterType,
  ScaffoldCategory,
  ScaffoldManifestVersion,
  DynamicParameterSource,
  FileMapping,
  FileModification,
  OverwriteBehavior,
  Scaffold,
  ScaffoldSource,
  ScaffoldDiscoveryOptions,
  ScaffoldProvider,
  ScaffoldProviderPriority,
  ScaffoldTransformer,
  ScaffoldContext,
  ScaffoldGenerateOptions,
  ScaffoldGenerateResult,
  GeneratedFile,
  ParameterValidationError,
  ParameterValidationResult,
  TemplateHelpers,
} from './types.js';

export {SCAFFOLDS_DATA_DIR} from './types.js';

// Registry
export {ScaffoldRegistry, createScaffoldRegistry} from './registry.js';

// Engine
export {
  ScaffoldEngine,
  createTemplateContext,
  createTemplateHelpers,
  renderTemplate,
  renderPathTemplate,
  kebabCase,
  camelCase,
  pascalCase,
  snakeCase,
} from './engine.js';
export type {TemplateContext} from './engine.js';

// Executor
export {generateFromScaffold, previewScaffold} from './executor.js';

// Validators
export {
  validateScaffoldManifest,
  validateParameters,
  evaluateCondition,
  isValidScaffoldName,
  isValidParameterName,
} from './validators.js';

// Merge utilities
export {mergeJson, insertAfter, insertBefore, appendContent, prependContent} from './merge.js';
export type {JsonMergeOptions, TextInsertOptions} from './merge.js';
