/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {glob} from 'glob';
import type {ScaffoldManifest, FileMapping} from './types.js';
import {validateScaffoldManifest} from './validators.js';

/**
 * Severity of a validation issue.
 */
export type ValidationIssueSeverity = 'error' | 'warning';

/**
 * A validation issue found during scaffold validation.
 */
export interface ValidationIssue {
  /** Severity of the issue */
  severity: ValidationIssueSeverity;
  /** Human-readable message describing the issue */
  message: string;
  /** File path where the issue was found, if applicable */
  file?: string;
}

/**
 * Result of validating a scaffold directory.
 */
export interface ValidationResult {
  /** Whether the scaffold is valid (no errors) */
  valid: boolean;
  /** Number of errors found */
  errors: number;
  /** Number of warnings found */
  warnings: number;
  /** All issues found during validation */
  issues: ValidationIssue[];
}

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory.
 */
async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Load and parse a manifest file.
 */
async function loadManifest(manifestPath: string): Promise<{manifest: ScaffoldManifest | null; error: string | null}> {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    return {manifest: JSON.parse(content) as ScaffoldManifest, error: null};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {manifest: null, error: 'scaffold.json not found'};
    }
    return {manifest: null, error: 'scaffold.json is not valid JSON'};
  }
}

/**
 * Validate EJS syntax in template content.
 *
 * Checks for:
 * - Mismatched opening/closing EJS tags
 * - Invalid EJS tag patterns
 * - Empty output tags
 *
 * @param content - Template content to validate
 * @param filename - Optional filename for error reporting
 * @returns Array of validation issues found
 */
export function validateEjsSyntax(content: string, filename?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fileRef = filename ? `files/${filename}` : undefined;

  // Check for unclosed EJS tags
  const openTags = (content.match(/<%/g) || []).length;
  const closeTags = (content.match(/%>/g) || []).length;

  if (openTags !== closeTags) {
    issues.push({
      severity: 'error',
      message: `Mismatched EJS tags: ${openTags} opening, ${closeTags} closing`,
      file: fileRef,
    });
  }

  // Check for common EJS errors
  const invalidPatterns = [
    {pattern: /<%[^%=_\-\s#]/, message: 'Invalid EJS tag opening (missing space or modifier)'},
    {pattern: /<%=\s*%>/, message: 'Empty EJS output tag'},
  ];

  for (const {pattern, message} of invalidPatterns) {
    if (pattern.test(content)) {
      issues.push({severity: 'warning', message, file: fileRef});
    }
  }

  return issues;
}

/**
 * Check that all referenced template files exist.
 *
 * @param filesDir - Path to the files/ directory
 * @param manifest - Scaffold manifest
 * @returns Array of validation issues for missing files
 */
export async function checkTemplateFiles(filesDir: string, manifest: ScaffoldManifest): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const filesToCheck: Array<{path: string; template: string}> = [];

  // Collect files from file mappings
  if (manifest.files && Array.isArray(manifest.files)) {
    for (const mapping of manifest.files as FileMapping[]) {
      filesToCheck.push({path: path.join(filesDir, mapping.template), template: mapping.template});
    }
  }

  // Collect files from modifications
  if (manifest.modifications) {
    for (const mod of manifest.modifications) {
      if (mod.contentTemplate) {
        filesToCheck.push({path: path.join(filesDir, mod.contentTemplate), template: mod.contentTemplate});
      }
    }
  }

  // Check all files in parallel
  const results = await Promise.all(
    filesToCheck.map(async ({path: filePath, template}) => {
      const exists = await fileExists(filePath);
      return {template, exists};
    }),
  );

  for (const {template, exists} of results) {
    if (!exists) {
      issues.push({
        severity: 'error',
        message: `Template file not found: ${template}`,
        file: `files/${template}`,
      });
    }
  }

  return issues;
}

/**
 * Check for orphaned template files not referenced in manifest.
 *
 * @param allTemplates - All template file paths in files/ directory
 * @param manifest - Scaffold manifest
 * @returns Array of validation issues for orphaned files
 */
export function checkOrphanedFiles(allTemplates: string[], manifest: ScaffoldManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const referencedTemplates = new Set<string>();

  if (manifest.files) {
    for (const f of manifest.files as FileMapping[]) {
      referencedTemplates.add(f.template);
    }
  }

  if (manifest.modifications) {
    for (const mod of manifest.modifications) {
      if (mod.contentTemplate) {
        referencedTemplates.add(mod.contentTemplate);
      }
    }
  }

  for (const template of allTemplates) {
    if (!referencedTemplates.has(template)) {
      issues.push({
        severity: 'warning',
        message: `Template file not referenced in manifest: ${template}`,
        file: `files/${template}`,
      });
    }
  }

  return issues;
}

/**
 * Validate manifest structure and return issues.
 */
function validateManifestStructure(manifest: ScaffoldManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const manifestErrors = validateScaffoldManifest(manifest);
  for (const error of manifestErrors) {
    issues.push({severity: 'error', message: error, file: 'scaffold.json'});
  }

  if (!manifest.postInstructions) {
    issues.push({
      severity: 'warning',
      message: 'Consider adding postInstructions to guide users after generation',
      file: 'scaffold.json',
    });
  }

  return issues;
}

/**
 * Validate EJS syntax in all template files.
 */
async function validateAllEjsTemplates(filesDir: string, allTemplates: string[]): Promise<ValidationIssue[]> {
  const ejsTemplates = allTemplates.filter((t) => t.endsWith('.ejs'));

  const results = await Promise.all(
    ejsTemplates.map(async (template) => {
      try {
        const content = await fs.readFile(path.join(filesDir, template), 'utf8');
        return validateEjsSyntax(content, template);
      } catch {
        return [];
      }
    }),
  );

  return results.flat();
}

/**
 * Options for scaffold directory validation.
 */
export interface ValidateScaffoldOptions {
  /** Treat warnings as errors */
  strict?: boolean;
}

/**
 * Validate a complete scaffold directory.
 *
 * Performs comprehensive validation including:
 * - Checking scaffold.json exists and is valid JSON
 * - Validating manifest structure against schema
 * - Verifying files/ directory exists
 * - Checking all referenced template files exist
 * - Finding orphaned template files
 * - Validating EJS syntax in templates
 *
 * @param scaffoldPath - Path to the scaffold directory
 * @param options - Validation options
 * @returns Validation result with issues found
 */
export async function validateScaffoldDirectory(
  scaffoldPath: string,
  options: ValidateScaffoldOptions = {},
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Check if path exists and is a directory
  if (!(await isDirectory(scaffoldPath))) {
    issues.push({
      severity: 'error',
      message: `Path does not exist or is not a directory: ${scaffoldPath}`,
    });
    return buildResult(issues, options.strict);
  }

  // Load and validate manifest
  const manifestPath = path.join(scaffoldPath, 'scaffold.json');
  const {manifest, error: manifestError} = await loadManifest(manifestPath);

  if (manifestError) {
    issues.push({severity: 'error', message: manifestError, file: 'scaffold.json'});
  }

  if (manifest) {
    issues.push(...validateManifestStructure(manifest));
  }

  // Check files directory
  const filesDir = path.join(scaffoldPath, 'files');
  const filesExist = await isDirectory(filesDir);

  if (!filesExist) {
    issues.push({severity: 'error', message: 'files/ directory not found'});
  }

  if (filesExist && manifest) {
    // Get all template files
    const allTemplates = await glob('**/*', {cwd: filesDir, nodir: true, dot: true});

    // Check template files exist, orphans, and EJS syntax
    issues.push(
      ...(await checkTemplateFiles(filesDir, manifest)),
      ...checkOrphanedFiles(allTemplates, manifest),
      ...(await validateAllEjsTemplates(filesDir, allTemplates)),
    );
  }

  return buildResult(issues, options.strict);
}

/**
 * Build a ValidationResult from issues.
 */
function buildResult(issues: ValidationIssue[], strict?: boolean): ValidationResult {
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const valid = strict ? errors === 0 && warnings === 0 : errors === 0;

  return {valid, errors, warnings, issues};
}
