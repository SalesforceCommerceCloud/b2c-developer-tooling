/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {CodeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

export default class CodeActivate extends CodeCommand<typeof CodeActivate> {
  static args = {
    codeVersion: Args.string({
      description: 'Code version ID to activate',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.code.activate.description', 'Activate or reload a code version'),
    '/cli/code.html#b2c-code-activate',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> v1',
    '<%= config.bin %> <%= command.id %> v1 --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --reload',
    '<%= config.bin %> <%= command.id %> v1 --reload',
  ];

  static flags = {
    ...CodeCommand.baseFlags,
    reload: Flags.boolean({
      char: 'r',
      description: 'Reload the code version (OCAPI only — forces a code cache reload via toggle)',
      default: false,
    }),
  };

  static hiddenAliases = ['code:activate'];

  async run(): Promise<void> {
    this.requireOAuthCredentials();

    const codeVersionArg = this.args.codeVersion;
    const hostname = this.resolvedConfig.values.hostname!;

    const codeVersion = codeVersionArg ?? this.resolvedConfig.values.codeVersion;

    if (!this.flags.reload && !codeVersion) {
      this.error(
        t(
          'commands.code.activate.versionRequired',
          'Code version is required. Provide as argument or use --code-version flag.',
        ),
      );
    }

    const backend = this.createScriptsBackend();
    this.logger.debug(`Using ${backend.name} backend for code activate`);

    if (this.flags.reload) {
      this.log(
        t('commands.code.activate.reloading', 'Reloading code version{{version}} on {{hostname}}...', {
          hostname,
          version: codeVersion ? ` ${codeVersion}` : '',
        }),
      );

      try {
        await backend.reloadCodeVersion(codeVersion);
        this.log(
          t('commands.code.activate.reloaded', 'Code version{{version}} reloaded successfully', {
            version: codeVersion ? ` ${codeVersion}` : '',
          }),
        );
      } catch (error) {
        if (error instanceof Error) {
          this.error(
            t('commands.code.activate.reloadFailed', 'Failed to reload code version: {{message}}', {
              message: error.message,
            }),
          );
        }
        throw error;
      }
    } else {
      this.log(
        t('commands.code.activate.activating', 'Activating code version {{codeVersion}} on {{hostname}}...', {
          hostname,
          codeVersion,
        }),
      );

      try {
        await backend.activateCodeVersion(codeVersion!);
        this.log(
          t('commands.code.activate.activated', 'Code version {{codeVersion}} activated successfully', {codeVersion}),
        );
      } catch (error) {
        if (error instanceof Error) {
          this.error(
            t('commands.code.activate.failed', 'Failed to activate code version: {{message}}', {
              message: error.message,
            }),
          );
        }
        throw error;
      }
    }
  }
}
