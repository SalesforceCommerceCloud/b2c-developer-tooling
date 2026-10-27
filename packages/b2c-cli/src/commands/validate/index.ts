/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  collectXmlFiles,
  validateXmlFiles,
  XmlSchemaLoadError,
  type XmlValidationResult,
  type XmlValidationSummary,
} from '@salesforce/b2c-tooling-sdk/xml-validation';

export default class Validate extends BaseCommand<typeof Validate> {
  static args = {
    paths: Args.string({
      description: 'XML file(s), directories, or glob patterns to validate (defaults to the current directory)',
    }),
  };

  static description =
    'Validate B2C Commerce import/export XML files against the bundled XSDs; the schema is chosen from each file’s root element namespace';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> site_template',
    '<%= config.bin %> <%= command.id %> catalog.xml pricebook.xml',
    "<%= config.bin %> <%= command.id %> 'site_template/**/*.xml' --exclude '**/sites/**'",
    '<%= config.bin %> <%= command.id %> custom-export.xml --schema catalog',
    '<%= config.bin %> <%= command.id %> data.xml --schema ./schemas/custom.xsd',
    '<%= config.bin %> <%= command.id %> site_template --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    schema: Flags.string({
      description:
        'Validate every file against this schema: a bundled schema ID (see "b2c docs schema --list") or a path to an .xsd file',
    }),
    exclude: Flags.string({
      description: 'Glob pattern of files to skip when expanding directories and globs (repeatable)',
      multiple: true,
    }),
    'fail-fast': Flags.boolean({
      description: 'Stop after the first file that fails',
      default: false,
    }),
  };

  // Allow multiple path arguments
  static strict = false;

  protected operations = {collectXmlFiles, validateXmlFiles};

  async run(): Promise<XmlValidationSummary> {
    const {argv, flags} = await this.parse(Validate);
    const inputs = argv.length > 0 ? (argv as string[]) : ['.'];

    const {explicitFiles, files, unmatched} = await this.operations.collectXmlFiles(inputs, {exclude: flags.exclude});
    for (const input of unmatched) this.warn(`No XML files matched: ${input}`);
    if (files.length === 0) this.error('No XML files found.');

    const json = this.jsonEnabled();
    let summary: XmlValidationSummary;
    try {
      summary = await this.operations.validateXmlFiles(files, {
        explicitFiles,
        failFast: flags['fail-fast'],
        onResult: json ? undefined : (result) => this.printResult(result),
        schema: flags.schema,
      });
    } catch (error) {
      if (error instanceof XmlSchemaLoadError) this.error(error.message);
      throw error;
    }

    if (json) {
      // Keep the summary as the JSON output, but still fail the process so CI notices.
      if (summary.failedFiles > 0) process.exitCode = 1;
      return summary;
    }

    const skipped = summary.skippedFiles > 0 ? `, ${summary.skippedFiles} skipped` : '';
    ux.stdout('');
    ux.stdout(`${summary.validFiles}/${summary.totalFiles} file(s) valid, ${summary.totalErrors} error(s)${skipped}`);

    if (summary.failedFiles > 0) {
      this.error('Validation failed', {exit: 1});
    }

    return summary;
  }

  private printResult(result: XmlValidationResult): void {
    const relativePath = path.relative(process.cwd(), result.filePath);
    const schemaInfo = result.schema ? ` (${result.schema})` : '';

    if (result.status === 'pass') {
      ux.stdout(`${ux.colorize('green', 'PASS')}: ${relativePath}${schemaInfo}`);
      return;
    }
    if (result.status === 'skip') {
      ux.stdout(`${ux.colorize('yellow', 'SKIP')}: ${relativePath} - ${result.reason}`);
      return;
    }

    ux.stdout(`${ux.colorize('red', 'FAIL')}: ${relativePath}${schemaInfo}`);
    if (result.reason) ux.stdout(`  ${ux.colorize('red', 'ERROR')}: ${result.reason}`);
    for (const error of result.errors) {
      const location = error.line > 0 ? ` line ${error.line}${error.column ? `:${error.column}` : ''}` : '';
      ux.stdout(`  ${ux.colorize('red', 'ERROR')}${location}: ${error.message}`);
    }
    if (result.truncated) ux.stdout('  (more errors not shown)');
  }
}
