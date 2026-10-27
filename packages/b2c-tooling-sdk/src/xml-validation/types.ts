/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Severity of a validation diagnostic. `fatal` means the document is not well-formed XML;
 * `error` means it is well-formed but does not conform to the schema.
 */
export type XmlDiagnosticSeverity = 'error' | 'fatal' | 'warning';

/**
 * A single diagnostic reported by libxml2 while parsing or validating a document.
 */
export interface XmlDiagnostic {
  /** libxml2 error code (`xmlParserErrors`). */
  code: number;
  /** Column number (1-based), when libxml2 reports one. Schema errors usually have none. */
  column?: number;
  /** Line number (1-based), or 0 when unknown. */
  line: number;
  /** Human-readable message. */
  message: string;
  severity: XmlDiagnosticSeverity;
}

/**
 * Outcome for one file: `pass` (valid), `fail` (invalid or unreadable), or `skip` (no schema applies).
 */
export type XmlValidationStatus = 'fail' | 'pass' | 'skip';

/**
 * Validation result for one XML file.
 */
export interface XmlValidationResult {
  /** Errors and fatal (well-formedness) errors. */
  errors: XmlDiagnostic[];
  filePath: string;
  /** Namespace of the root element, when one was found. */
  namespace?: string;
  /** Local name of the root element, when one was found. */
  rootElement?: string;
  /** Why the file was skipped, or why it failed without diagnostics (for example, no schema applies). */
  reason?: string;
  /** Bundled schema ID (for example `catalog`), or the path of a custom XSD. */
  schema?: string;
  status: XmlValidationStatus;
  /** True when more diagnostics were reported than are included. */
  truncated?: boolean;
  /** True when the file passed validation. Skipped files are not valid. */
  valid: boolean;
  warnings: XmlDiagnostic[];
}

/**
 * Totals for a validation run.
 */
export interface XmlValidationSummary {
  failedFiles: number;
  results: XmlValidationResult[];
  skippedFiles: number;
  totalErrors: number;
  totalFiles: number;
  validFiles: number;
}

/**
 * Options for validating XML files.
 */
export interface ValidateXmlOptions {
  /** Base directory for a relative `.xsd` path in `schema`. Defaults to the current directory. */
  cwd?: string;
  /**
   * Validate against this schema instead of detecting one from the root element namespace.
   * Either a bundled schema ID (see `b2c docs schema --list`) or a path to an `.xsd` file.
   */
  schema?: string;
}

/**
 * Options for validating a set of files.
 */
export interface ValidateXmlFilesOptions extends ValidateXmlOptions {
  /** Stop after the first file that fails. */
  failFast?: boolean;
  /** Called after each file is validated. */
  onResult?: (result: XmlValidationResult) => void;
  /**
   * Files that were named explicitly (rather than found by expanding a directory or glob).
   * An explicitly named file with no matching bundled schema fails instead of being skipped.
   */
  explicitFiles?: ReadonlySet<string>;
}

/**
 * Options for finding XML files to validate.
 */
export interface CollectXmlFilesOptions {
  /** Base directory for relative paths and globs. Defaults to the current directory. */
  cwd?: string;
  /** Glob patterns to leave out. */
  exclude?: string[];
}

/**
 * Files found by {@link collectXmlFiles}.
 */
export interface CollectedXmlFiles {
  /** Absolute paths that were named directly as files. */
  explicitFiles: Set<string>;
  /** Absolute paths of all files to validate, in a stable order. */
  files: string[];
  /** Inputs (paths or globs) that matched no XML files. */
  unmatched: string[];
}
