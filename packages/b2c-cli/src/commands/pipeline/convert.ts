/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {convertPipeline, type ConvertResult} from '@salesforce/b2c-tooling-sdk/operations/pipeline';
import {glob} from 'glob';
import {t} from '../../i18n/index.js';

interface ConvertError {
  pipelineName: string;
  error: string;
}

interface ConvertResponse {
  results: ConvertResult[];
  errors: ConvertError[];
  totalPipelines: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
}

export default class PipelineConvert extends BaseCommand<typeof PipelineConvert> {
  static args = {
    input: Args.string({
      description: 'Pipeline XML file or glob pattern (e.g., "*.xml" or "pipelines/**/*.xml")',
      required: true,
    }),
  };

  static description = t(
    'commands.pipeline.convert.description',
    'Convert B2C Commerce pipeline XML files to JavaScript controllers',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Account.xml',
    '<%= config.bin %> <%= command.id %> Account.xml --output ./controllers',
    '<%= config.bin %> <%= command.id %> "pipelines/*.xml" --output ./controllers',
    '<%= config.bin %> <%= command.id %> Cart.xml --dry-run',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Output directory for generated controllers',
    }),
    'dry-run': Flags.boolean({
      description: 'Preview generated code without writing files',
      default: false,
    }),
    'allow-unsupported': Flags.boolean({
      description: 'Continue conversion with unsupported pipelets (generates TODO comments instead of failing)',
      default: false,
    }),
  };

  protected operations = {
    convertPipeline,
  };

  async run(): Promise<ConvertResponse> {
    const {input} = this.args;
    const {output, 'dry-run': dryRun, 'allow-unsupported': allowUnsupported} = this.flags;

    // Resolve input files
    const inputFiles = await this.resolveInputFiles(input);

    if (inputFiles.length === 0) {
      this.error(
        t('commands.pipeline.convert.noFilesFound', 'No pipeline XML files found matching: {{pattern}}', {
          pattern: input,
        }),
      );
    }

    // Process all files and collect results
    const conversionResults = await this.processFiles(inputFiles, output, dryRun, allowUnsupported);

    const response: ConvertResponse = {
      results: conversionResults.results,
      errors: conversionResults.errors,
      totalPipelines: inputFiles.length,
      successCount: conversionResults.successCount,
      failureCount: conversionResults.failureCount,
      warningCount: conversionResults.warningCount,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (!dryRun) {
      this.log('');
      if (conversionResults.failureCount > 0) {
        this.log(
          t(
            'commands.pipeline.convert.summaryWithFailures',
            'Converted {{success}} pipeline(s), {{failures}} failed, {{warnings}} warning(s)',
            {
              success: conversionResults.successCount,
              failures: conversionResults.failureCount,
              warnings: conversionResults.warningCount,
            },
          ),
        );
      } else {
        this.log(
          t('commands.pipeline.convert.summary', 'Converted {{count}} pipeline(s) with {{warnings}} warning(s)', {
            count: conversionResults.successCount,
            warnings: conversionResults.warningCount,
          }),
        );
      }
    }

    return response;
  }

  /**
   * Processes a single input file.
   */
  private async processFile(
    inputFile: string,
    output: string | undefined,
    dryRun: boolean,
    allowUnsupported: boolean,
  ): Promise<{result?: ConvertResult; success: boolean; error?: ConvertError}> {
    const pipelineName = basename(inputFile, '.xml');

    if (!dryRun) {
      this.log(
        t('commands.pipeline.convert.converting', 'Converting {{name}}...', {
          name: pipelineName,
        }),
      );
    }

    // Determine output path
    const outputPath = dryRun
      ? undefined
      : output
        ? join(output, `${pipelineName}.js`)
        : join(dirname(inputFile), `${pipelineName}.js`);

    try {
      const result = await this.operations.convertPipeline(inputFile, {
        outputPath,
        dryRun,
        allowUnsupported,
      });

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          this.warn(warning);
        }
      }

      let success = false;
      if (dryRun) {
        // In dry-run mode, output the generated code
        if (!this.jsonEnabled()) {
          ux.stdout(`\n// === ${pipelineName}.js ===\n`);
          ux.stdout(result.code);
          ux.stdout('\n');
        }
        success = true;
      } else if (outputPath) {
        // Write the file
        await writeFile(outputPath, result.code, 'utf8');
        this.log(
          t('commands.pipeline.convert.generated', 'Generated: {{path}}', {
            path: outputPath,
          }),
        );
        success = true;
      }

      return {result, success};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logToStderr(
        t('commands.pipeline.convert.failed', 'Failed to convert {{name}}: {{error}}', {
          name: pipelineName,
          error: errorMessage,
        }),
      );
      return {
        success: false,
        error: {pipelineName, error: errorMessage},
      };
    }
  }

  /**
   * Processes all input files and returns results.
   */
  private async processFiles(
    inputFiles: string[],
    output: string | undefined,
    dryRun: boolean,
    allowUnsupported: boolean,
  ): Promise<{
    results: ConvertResult[];
    errors: ConvertError[];
    successCount: number;
    failureCount: number;
    warningCount: number;
  }> {
    const results: ConvertResult[] = [];
    const errors: ConvertError[] = [];
    let successCount = 0;
    let failureCount = 0;
    let warningCount = 0;

    // Process files sequentially to maintain order and avoid concurrent file operations
    for (const inputFile of inputFiles) {
      // eslint-disable-next-line no-await-in-loop
      const fileResult = await this.processFile(inputFile, output, dryRun, allowUnsupported);
      if (fileResult.result) {
        results.push(fileResult.result);
        warningCount += fileResult.result.warnings.length;
      }
      if (fileResult.error) {
        errors.push(fileResult.error);
        failureCount++;
      }
      if (fileResult.success) {
        successCount++;
      }
    }

    return {results, errors, successCount, failureCount, warningCount};
  }

  /**
   * Resolves input pattern to list of files.
   */
  private async resolveInputFiles(pattern: string): Promise<string[]> {
    const resolvedPattern = resolve(pattern);

    // Check if it's a direct file path
    if (existsSync(resolvedPattern) && resolvedPattern.endsWith('.xml')) {
      return [resolvedPattern];
    }

    // Otherwise treat as glob pattern
    const files = await glob(pattern, {
      absolute: true,
      nodir: true,
    });

    // Filter to only XML files
    return files.filter((f) => f.endsWith('.xml'));
  }
}
