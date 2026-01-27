/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteRedirect} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Prompt for confirmation.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Delete a redirect from an MRT environment.
 */
export default class MrtRedirectDelete extends MrtCommand<typeof MrtRedirectDelete> {
  static args = {
    fromPath: Args.string({
      description: 'Source path of the redirect to delete',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.redirect.delete.description', 'Delete a redirect from a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-redirect-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> /old-page --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> /old-page -p my-storefront -e staging --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<{fromPath: string; deleted: boolean}> {
    this.requireMrtCredentials();

    const {fromPath} = this.args;
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {force} = this.flags;

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.redirect.delete.confirm', 'Are you sure you want to delete redirect "{{fromPath}}"?', {
          fromPath,
        }),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.redirect.delete.cancelled', 'Deletion cancelled.'));
        return {fromPath, deleted: false};
      }
    }

    this.log(t('commands.mrt.redirect.delete.deleting', 'Deleting redirect {{fromPath}}...', {fromPath}));

    try {
      await deleteRedirect(
        {
          projectSlug: project,
          targetSlug: environment,
          fromPath,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.redirect.delete.success', 'Redirect {{fromPath}} deleted.', {fromPath}));
      }

      return {fromPath, deleted: true};
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.redirect.delete.failed', 'Failed to delete redirect: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
