/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));

/**
 * Path to the built-in scaffolds data directory
 */
export const SCAFFOLDS_DATA_DIR = path.join(packageRoot, 'data/scaffolds');

/**
 * Scaffold category. Built-in scaffolds use 'cartridge', but custom scaffolds
 * can define their own categories.
 */
export type ScaffoldCategory = string;

/**
 * Parameter types supported by scaffold parameters
 */
export type ScaffoldParameterType = 'string' | 'boolean' | 'choice' | 'multi-choice';

/**
 * Dynamic sources for populating parameter choices at runtime.
 *
 * - `cartridges`: Discovers cartridges in project via .project files
 * - `hook-points`: Static list of common hook extension points
 * - `sites`: Remote - fetches sites from connected B2C instance
 */
export type DynamicParameterSource = 'cartridges' | 'hook-points' | 'sites';

/**
 * Overwrite behavior for generated files
 */
export type OverwriteBehavior = 'never' | 'always' | 'prompt' | 'merge';

/**
 * Choice option for choice/multi-choice parameters
 */
export interface ScaffoldChoice {
  /** The value to use when this choice is selected */
  value: string;
  /** Human-readable label for this choice */
  label: string;
}

/**
 * Parameter definition for scaffold prompts and flags
 */
export interface ScaffoldParameter {
  /** Parameter name (camelCase), used in templates as variable name */
  name: string;
  /** Prompt message shown in interactive mode */
  prompt: string;
  /** Type of the parameter */
  type: ScaffoldParameterType;
  /** Whether this parameter is required */
  required: boolean;
  /** Default value if not provided */
  default?: string | boolean | string[];
  /** Regex pattern for validation (string types only) */
  pattern?: string;
  /** Error message shown when validation fails */
  validationMessage?: string;
  /** Available choices for choice/multi-choice types */
  choices?: ScaffoldChoice[];
  /** CLI flag name override (e.g., "--name"). If not set, uses --{paramName} */
  flag?: string;
  /** Conditional expression: only prompt if condition is met (e.g., "otherParam=value") */
  when?: string;
  /** Dynamic source for populating choices at runtime */
  source?: DynamicParameterSource;
}

/**
 * File mapping from template to destination
 */
export interface FileMapping {
  /** Template file path relative to the scaffold's files/ directory */
  template: string;
  /** Destination path (supports {{variable}} substitution) */
  destination: string;
  /** Conditional expression: only generate if truthy */
  condition?: string;
  /** Overwrite behavior for existing files */
  overwrite?: OverwriteBehavior;
}

/**
 * File modification definition for modifying existing files
 */
export interface FileModification {
  /** Target file path (supports {{variable}} substitution) */
  target: string;
  /** Type of modification */
  type: 'json-merge' | 'insert-after' | 'insert-before' | 'append' | 'prepend';
  /** Content to insert/merge (for text modifications) */
  content?: string;
  /** Template file for the content */
  contentTemplate?: string;
  /** Marker string to find (for insert-after/insert-before) */
  marker?: string;
  /** JSON path for json-merge operations (e.g., "scripts") */
  jsonPath?: string;
  /** Conditional expression */
  condition?: string;
}

/**
 * Scaffold manifest (scaffold.json)
 */
export interface ScaffoldManifest {
  /** Unique identifier (kebab-case) */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of what this scaffold creates */
  description: string;
  /** Category for filtering and organization */
  category: ScaffoldCategory;
  /** Parameters for user input (prompts/flags) */
  parameters: ScaffoldParameter[];
  /** File mappings (optional - defaults to all files in files/ directory) */
  files?: FileMapping[];
  /** Modifications to existing files (optional) */
  modifications?: FileModification[];
  /** Instructions to show after generation */
  postInstructions?: string;
  /** Default output directory relative to cwd (created if needed) */
  defaultOutputDir?: string;
}

/**
 * Resolved scaffold with full paths and source information
 */
export interface Scaffold {
  /** Unique identifier */
  id: string;
  /** The manifest definition */
  manifest: ScaffoldManifest;
  /** Full path to the scaffold directory */
  path: string;
  /** Full path to the files/ directory within the scaffold */
  filesPath: string;
  /** Source of this scaffold */
  source: ScaffoldSource;
}

/**
 * Source/origin of a scaffold
 */
export type ScaffoldSource = 'built-in' | 'user' | 'project' | 'plugin';

/**
 * Priority ordering for scaffold providers
 */
export type ScaffoldProviderPriority = 'before' | 'after';

/**
 * Options for scaffold discovery
 */
export interface ScaffoldDiscoveryOptions {
  /** Filter by category */
  category?: ScaffoldCategory;
  /** Search query for name/description */
  query?: string;
  /** Include only scaffolds from specific sources */
  sources?: ScaffoldSource[];
  /** Project root directory (for project-local scaffolds) */
  projectRoot?: string;
}

/**
 * Scaffold provider interface for extensibility
 */
export interface ScaffoldProvider {
  /** Provider name for identification */
  readonly name: string;
  /** Priority: 'before' runs before built-in, 'after' runs after */
  readonly priority: ScaffoldProviderPriority;
  /** Get scaffolds from this provider */
  getScaffolds(options: ScaffoldDiscoveryOptions): Promise<Scaffold[]>;
}

/**
 * Scaffold transformer interface for modifying scaffolds
 */
export interface ScaffoldTransformer {
  /** Transformer name for identification */
  readonly name: string;
  /** Transform a scaffold definition */
  transform(scaffold: Scaffold, context: ScaffoldContext): Promise<Scaffold>;
}

/**
 * Context passed during scaffold operations
 */
export interface ScaffoldContext {
  /** Output directory for generated files */
  outputDir: string;
  /** Resolved parameter values */
  variables: Record<string, string | boolean | string[]>;
  /** Whether running in dry-run mode */
  dryRun: boolean;
  /** Whether to force overwrite existing files */
  force: boolean;
  /** Whether running in interactive mode */
  interactive: boolean;
}

/**
 * Options for scaffold generation
 */
export interface ScaffoldGenerateOptions {
  /** Output directory (defaults to cwd) */
  outputDir?: string;
  /** Pre-supplied variable values (from flags/env) */
  variables?: Record<string, string | boolean | string[]>;
  /** Preview without writing files */
  dryRun?: boolean;
  /** Skip prompts and overwrite existing files */
  force?: boolean;
  /** Enable interactive prompts (defaults to true if TTY) */
  interactive?: boolean;
}

/**
 * Result of a file generation operation
 */
export interface GeneratedFile {
  /** Relative path from output directory */
  path: string;
  /** Absolute path to the file */
  absolutePath: string;
  /** Action taken */
  action: 'created' | 'skipped' | 'overwritten' | 'merged';
  /** Reason for skip (if action is 'skipped') */
  skipReason?: string;
}

/**
 * Result of scaffold generation
 */
export interface ScaffoldGenerateResult {
  /** The scaffold that was used */
  scaffold: Scaffold;
  /** Files that were generated */
  files: GeneratedFile[];
  /** Post-generation instructions */
  postInstructions?: string;
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Output directory */
  outputDir: string;
}

/**
 * Validation error for scaffold parameters
 */
export interface ParameterValidationError {
  /** Parameter name */
  parameter: string;
  /** Error message */
  message: string;
  /** The invalid value */
  value?: unknown;
}

/**
 * Result of parameter validation
 */
export interface ParameterValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors (if any) */
  errors: ParameterValidationError[];
  /** Resolved parameter values */
  values: Record<string, string | boolean | string[]>;
}

/**
 * Template rendering helpers available in EJS templates
 */
export interface TemplateHelpers {
  /** Convert to kebab-case */
  kebabCase: (str: string) => string;
  /** Convert to camelCase */
  camelCase: (str: string) => string;
  /** Convert to PascalCase */
  pascalCase: (str: string) => string;
  /** Convert to snake_case */
  snakeCase: (str: string) => string;
  /** Current year */
  year: number;
  /** Current date (YYYY-MM-DD) */
  date: string;
  /** Generate a UUID v4 */
  uuid: () => string;
}

/**
 * Result of resolving a dynamic parameter source.
 */
export interface SourceResult {
  /** Available choices */
  choices: ScaffoldChoice[];
  /** For cartridges: map of name to absolute path */
  pathMap?: Map<string, string>;
}
