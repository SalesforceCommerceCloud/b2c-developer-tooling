/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {commerceAppPackage, type CommerceAppPackageResult} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

export default class CapPackage extends BaseCommand<typeof CapPackage> {
  static args = {
    path: Args.string({
      description: 'Path to the CAP source directory',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.cap.package.description', 'Package a Commerce App directory into a distributable .zip file'),
    '/cli/cap.html#b2c-cap-package',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5',
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5 --output ./dist',
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5 --output ./dist/my-app.zip',
  ];

  static flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output path (directory or .zip filename). Defaults to current directory.',
    }),
  };

  protected operations = {
    commerceAppPackage,
  };

  async run(): Promise<CommerceAppPackageResult> {
    const {path} = this.args;
    const {output} = this.flags;

    this.log(t('commands.cap.package.packaging', 'Packaging CAP: {{path}}', {path}));

    let result: CommerceAppPackageResult;
    try {
      result = await this.operations.commerceAppPackage(path, {outputPath: output});
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.cap.package.error', 'Package error: {{message}}', {message: error.message}));
      }
      throw error;
    }

    this.log(
      t('commands.cap.package.completed', 'Packaged {{name}} v{{version}} → {{outputPath}}', {
        name: result.manifest.name,
        version: result.manifest.version,
        outputPath: result.outputPath,
      }),
    );

    return result;
  }
}
