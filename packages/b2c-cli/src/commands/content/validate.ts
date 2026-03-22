/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {glob} from 'glob';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  CONTENT_SCHEMA_TYPES,
  MetaDefinitionDetectionError,
  validateMetaDefinitionFile,
  type ContentSchemaType,
  type MetaDefinitionValidationResult,
} from '@salesforce/b2c-tooling-sdk/operations/content';

interface ContentValidateResponse {
  results: MetaDefinitionValidationResult[];
  totalErrors: number;
  totalFiles: number;
  validFiles: number;
}

export default class ContentValidate extends BaseCommand<typeof ContentValidate> {
  static args = {
    files: Args.string({
      description: 'File(s), directory, or glob pattern(s) for JSON metadefinition files to validate',
      required: true,
    }),
  };

  static description = 'Validate Page Designer metadefinition JSON files against schemas';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> cartridge/experience/pages/storePage.json',
    '<%= config.bin %> <%= command.id %> --type componenttype mycomponent.json',
    "<%= config.bin %> <%= command.id %> 'cartridge/experience/**/*.json'",
    '<%= config.bin %> <%= command.id %> cartridge/experience/',
    '<%= config.bin %> <%= command.id %> storePage.json --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'Schema type (auto-detected if not specified)',
      options: [...CONTENT_SCHEMA_TYPES],
    }),
  };

  // Allow multiple file arguments
  static strict = false;

  protected operations = {
    glob,
    validateMetaDefinitionFile,
  };

  async run(): Promise<ContentValidateResponse> {
    const {argv, flags} = await this.parse(ContentValidate);
    const patterns = argv as string[];

    if (patterns.length === 0) {
      this.error('At least one file path, directory, or glob pattern is required.');
    }

    // Expand directories to recursive JSON globs, then resolve all patterns in parallel
    const resolvedPatterns = patterns.map((pattern) =>
      fs.existsSync(pattern) && fs.statSync(pattern).isDirectory() ? path.join(pattern, '**/*.json') : pattern,
    );
    const allMatches = await Promise.all(
      resolvedPatterns.map((resolved) => this.operations.glob(resolved, {nodir: true})),
    );
    const filePaths: string[] = [];
    for (const [i, matches] of allMatches.entries()) {
      if (matches.length === 0) {
        this.warn(`No files matched: ${patterns[i]}`);
      }
      filePaths.push(...matches);
    }

    if (filePaths.length === 0) {
      this.error('No files found matching the provided patterns.');
    }

    const results: MetaDefinitionValidationResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = this.operations.validateMetaDefinitionFile(filePath, {
          type: flags.type as ContentSchemaType | undefined,
        });
        results.push(result);
      } catch (error) {
        if (error instanceof MetaDefinitionDetectionError) {
          const relativePath = path.relative(process.cwd(), path.resolve(filePath));
          this.error(`${relativePath}: ${error.message}`);
        }
        throw error;
      }
    }

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const validFiles = results.filter((r) => r.valid).length;

    const response: ContentValidateResponse = {
      results,
      totalErrors,
      totalFiles: results.length,
      validFiles,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    for (const result of results) {
      const relativePath = path.relative(process.cwd(), result.filePath ?? '');
      const typeInfo = result.schemaType ? ` (${result.schemaType})` : '';

      if (result.valid) {
        ux.stdout(`${ux.colorize('green', 'PASS')}: ${relativePath}${typeInfo}`);
      } else {
        ux.stdout(`${ux.colorize('red', 'FAIL')}: ${relativePath}${typeInfo}`);
        for (const error of result.errors) {
          const location = error.path && error.path !== '/' ? ` at ${error.path}` : '';
          ux.stdout(`  ${ux.colorize('red', 'ERROR')}${location}: ${error.message}`);
        }
      }
    }

    ux.stdout('');
    ux.stdout(`${validFiles}/${results.length} file(s) valid, ${totalErrors} error(s)`);

    if (totalErrors > 0) {
      this.error('Validation failed', {exit: 1});
    }

    return response;
  }
}
