/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Args, Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {validateScaffoldDirectory, type ValidationResult} from '@salesforce/b2c-tooling-sdk/scaffold';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Response type for the validate command.
 */
interface ScaffoldValidateResponse extends ValidationResult {
  path: string;
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

    // Use SDK validation function
    const result = await validateScaffoldDirectory(scaffoldPath, {
      strict: this.flags.strict,
    });

    const response: ScaffoldValidateResponse = {
      path: scaffoldPath,
      ...result,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    // Display results
    this.log('');
    this.log(`Validating scaffold at: ${scaffoldPath}`);
    this.log('');

    if (result.issues.length === 0) {
      this.log('No issues found.');
    } else {
      for (const issue of result.issues) {
        const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN';
        const fileInfo = issue.file ? ` (${issue.file})` : '';
        this.log(`  ${prefix}: ${issue.message}${fileInfo}`);
      }
    }

    this.log('');
    this.log(`Summary: ${result.errors} error(s), ${result.warnings} warning(s)`);

    if (result.valid) {
      this.log('');
      this.log('Scaffold is valid.');
    } else {
      this.log('');
      this.error('Validation failed');
    }

    return response;
  }
}
