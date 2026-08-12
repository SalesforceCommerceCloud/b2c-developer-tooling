/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {CodeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';
import {confirm} from '../../prompts.js';

export default class CodeDelete extends CodeCommand<typeof CodeDelete> {
  static args = {
    codeVersion: Args.string({
      description: 'Code version ID to delete',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.code.delete.description', 'Delete a code version'),
    '/cli/code.html#b2c-code-delete',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> old-version',
    '<%= config.bin %> <%= command.id %> old-version --force',
    '<%= config.bin %> <%= command.id %> old-version --server my-sandbox.demandware.net',
  ];

  static flags = {
    ...CodeCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  static hiddenAliases = ['code:delete'];

  protected operations = {
    confirm,
  };

  async run(): Promise<void> {
    this.assertDestructiveOperationAllowed('delete code version');

    this.requireOAuthCredentials();

    const codeVersion = this.args.codeVersion;
    const hostname = this.resolvedConfig.values.hostname!;

    if (!this.flags.force) {
      const confirmed = await this.operations.confirm(
        t(
          'commands.code.delete.confirm',
          'Are you sure you want to delete code version "{{codeVersion}}" on {{hostname}}?',
          {codeVersion, hostname},
        ),
      );

      if (!confirmed) {
        this.log(t('commands.code.delete.cancelled', 'Deletion cancelled'));
        return;
      }
    }

    const backend = this.createScriptsBackend();
    this.logger.debug(`Using ${backend.name} backend for code delete`);

    this.log(
      t('commands.code.delete.deleting', 'Deleting code version {{codeVersion}} from {{hostname}}...', {
        hostname,
        codeVersion,
      }),
    );

    await backend.deleteCodeVersion(codeVersion);
    this.log(t('commands.code.delete.deleted', 'Code version {{codeVersion}} deleted successfully', {codeVersion}));
  }
}
