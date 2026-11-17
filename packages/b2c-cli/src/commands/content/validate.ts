/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {glob} from 'glob';
import {readPageInputs} from './push.js';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  CONTENT_SCHEMA_TYPES,
  MetaDefinitionDetectionError,
  validateMetaDefinitionFile,
  type ContentSchemaType,
  type MetaDefinitionValidationResult,
  type PageValidationResult,
  catalogFromLocalCartridges,
  validatePageRequest,
} from '@salesforce/b2c-tooling-sdk/operations/content';

interface ContentValidateResponse {
  results: MetaDefinitionValidationResult[];
  totalErrors: number;
  totalFiles: number;
  validFiles: number;
}

interface ContentPageValidateResponse {
  pages: Array<PageValidationResult & {source: string}>;
  totalErrors: number;
  totalPages: number;
  validPages: number;
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
    '<%= config.bin %> <%= command.id %> --page pages/campaign.json --types-dir ./cartridges',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'Schema type (auto-detected if not specified)',
      options: [...CONTENT_SCHEMA_TYPES],
    }),
    page: Flags.boolean({
      description:
        'Validate page bodies (Experiences API page JSON or exported library XML) against local page and component types instead of metadefinition files',
      default: false,
    }),
    'types-dir': Flags.string({
      description:
        'Directory searched for cartridge experience/ type definitions in --page mode (defaults to the current directory); use "content push --dry-run" to validate against instance types',
      multiple: true,
    }),
  };

  // Allow multiple file arguments
  static strict = false;

  protected operations: {
    catalogFromLocalCartridges: typeof catalogFromLocalCartridges;
    glob: (pattern: string, options?: {nodir?: boolean}) => Promise<string[]>;
    readPageInputs: typeof readPageInputs;
    validateMetaDefinitionFile: typeof validateMetaDefinitionFile;
  } = {
    catalogFromLocalCartridges,
    glob,
    readPageInputs,
    validateMetaDefinitionFile,
  };

  async run(): Promise<ContentPageValidateResponse | ContentValidateResponse> {
    const {argv, flags} = await this.parse(ContentValidate);
    const patterns = argv as string[];

    if (patterns.length === 0) {
      this.error('At least one file path, directory, or glob pattern is required.');
    }

    if (flags.page) {
      return this.validatePages(patterns, flags['types-dir'] ?? [process.cwd()]);
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

  private async validatePages(files: string[], typeDirs: string[]): Promise<ContentPageValidateResponse> {
    const catalog = await this.operations.catalogFromLocalCartridges(typeDirs);
    if (catalog.pageTypes.size === 0 && catalog.componentTypes.size === 0) {
      this.warn(`No experience/ type definitions found under ${typeDirs.join(', ')}`);
    }

    const results: Array<PageValidationResult & {source: string}> = [];
    for (const file of files) {
      if (!fs.existsSync(file)) this.error(`File not found: ${file}`);
      let inputs;
      try {
        // eslint-disable-next-line no-await-in-loop
        inputs = await this.operations.readPageInputs(file);
      } catch (error) {
        this.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
      for (const {page, source} of inputs) {
        results.push({...validatePageRequest(page, catalog), source});
      }
    }

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const response: ContentPageValidateResponse = {
      pages: results,
      totalErrors,
      totalPages: results.length,
      validPages: results.filter((r) => r.valid).length,
    };
    if (this.jsonEnabled()) return response;

    for (const r of results) {
      ux.stdout(
        `${r.valid ? ux.colorize('green', 'PASS') : ux.colorize('red', 'FAIL')}: ${r.pageId || '(no id)'} (${r.source})`,
      );
      for (const e of r.errors) ux.stdout(`  ${ux.colorize('red', 'ERROR')} at ${e.path || '/'}: ${e.message}`);
      for (const w of r.warnings) ux.stdout(`  ${ux.colorize('yellow', 'WARNING')} at ${w.path || '/'}: ${w.message}`);
    }
    ux.stdout('');
    ux.stdout(`${response.validPages}/${results.length} page(s) valid, ${totalErrors} error(s)`);
    if (totalErrors > 0) this.error('Validation failed', {exit: 1});
    return response;
  }
}
