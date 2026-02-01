/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {Args, Flags} from '@oclif/core';
import {glob} from 'glob';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {validateScaffoldManifest, type FileMapping, type ScaffoldManifest} from '@salesforce/b2c-tooling-sdk/scaffold';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Validation issue severity.
 */
type IssueSeverity = 'error' | 'warning';

/**
 * A validation issue found in the scaffold.
 */
interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  file?: string;
}

/**
 * Response type for the validate command.
 */
interface ScaffoldValidateResponse {
  path: string;
  valid: boolean;
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
}

/**
 * Check if a file exists
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
 * Check if a path is a directory
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
 * Load and parse manifest file
 */
async function loadManifest(manifestPath: string): Promise<{manifest: null | ScaffoldManifest; error: null | string}> {
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
 * Validate manifest structure and return issues
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
 * Check template files exist and return issues
 */
async function checkTemplateFiles(filesDir: string, manifest: ScaffoldManifest): Promise<ValidationIssue[]> {
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
 * Check for orphaned template files
 */
function checkOrphanedFiles(allTemplates: string[], manifest: ScaffoldManifest): ValidationIssue[] {
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
 * Validate EJS syntax in template content
 */
function validateEjsSyntax(content: string, filename: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for unclosed EJS tags
  const openTags = (content.match(/<%/g) || []).length;
  const closeTags = (content.match(/%>/g) || []).length;

  if (openTags !== closeTags) {
    issues.push({
      severity: 'error',
      message: `Mismatched EJS tags: ${openTags} opening, ${closeTags} closing`,
      file: `files/${filename}`,
    });
  }

  // Check for common EJS errors
  const invalidPatterns = [
    {pattern: /<%[^%=_\-\s#]/, message: 'Invalid EJS tag opening (missing space or modifier)'},
    {pattern: /<%=\s*%>/, message: 'Empty EJS output tag'},
  ];

  for (const {pattern, message} of invalidPatterns) {
    if (pattern.test(content)) {
      issues.push({severity: 'warning', message, file: `files/${filename}`});
    }
  }

  return issues;
}

/**
 * Validate EJS syntax in all template files
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
 * Command to validate a custom scaffold.
 */
export default class ScaffoldValidate extends BaseCommand<typeof ScaffoldValidate> {
  static args = {
    path: Args.string({
      description: 'Path to the scaffold directory',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.scaffold.validate.description', 'Validate a custom scaffold manifest and templates'),
    '/cli/scaffold.html#b2c-scaffold-validate',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./my-scaffold',
    '<%= config.bin %> <%= command.id %> ~/.b2c/scaffolds/my-scaffold',
    '<%= config.bin %> <%= command.id %> .b2c/scaffolds/my-scaffold --json',
  ];

  static flags = {
    strict: Flags.boolean({
      description: 'Treat warnings as errors',
      default: false,
    }),
  };

  async run(): Promise<ScaffoldValidateResponse> {
    const scaffoldPath = path.resolve(this.args.path);
    const issues: ValidationIssue[] = [];

    // Check if path exists and is a directory
    if (!(await isDirectory(scaffoldPath))) {
      this.error(`Path does not exist or is not a directory: ${scaffoldPath}`);
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

    // Calculate results
    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const valid = this.flags.strict ? errors === 0 && warnings === 0 : errors === 0;

    const response: ScaffoldValidateResponse = {
      path: scaffoldPath,
      valid,
      errors,
      warnings,
      issues,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    // Display results
    this.log('');
    this.log(`Validating scaffold at: ${scaffoldPath}`);
    this.log('');

    if (issues.length === 0) {
      this.log('No issues found.');
    } else {
      for (const issue of issues) {
        const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN';
        const fileInfo = issue.file ? ` (${issue.file})` : '';
        this.log(`  ${prefix}: ${issue.message}${fileInfo}`);
      }
    }

    this.log('');
    this.log(`Summary: ${errors} error(s), ${warnings} warning(s)`);

    if (valid) {
      this.log('');
      this.log('Scaffold is valid.');
    } else {
      this.log('');
      this.error('Validation failed');
    }

    return response;
  }
}
