/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {validateCap, type CapValidationResult} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

export default class CapValidate extends BaseCommand<typeof CapValidate> {
  static args = {
    path: Args.string({
      description: 'Path to a CAP directory or .zip file',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.cap.validate.description', 'Validate the structure and manifest of a Commerce App Package (CAP)'),
    '/cli/cap.html#b2c-cap-validate',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5',
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5.zip',
  ];

  async run(): Promise<CapValidationResult> {
    const {path} = this.args;

    this.log(t('commands.cap.validate.validating', 'Validating CAP: {{path}}', {path}));

    const result = await validateCap(path);

    if (result.errors.length > 0) {
      this.log(`\nErrors (${result.errors.length}):`);
      for (const err of result.errors) {
        this.log(`  ✗ ${err}`);
      }
    }

    if (result.warnings.length > 0) {
      this.log(`\nWarnings (${result.warnings.length}):`);
      for (const warn of result.warnings) {
        this.log(`  ⚠ ${warn}`);
      }
    }

    if (result.valid) {
      const appInfo = result.manifest ? ` (${result.manifest.name} v${result.manifest.version})` : '';
      this.log(t('commands.cap.validate.valid', '\n✓ CAP is valid{{appInfo}}', {appInfo}));
    } else {
      this.error(`CAP validation failed with ${result.errors.length} error(s)`, {exit: 1});
    }

    return result;
  }
}
