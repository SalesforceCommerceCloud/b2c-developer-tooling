/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {cloneRedirects, type CloneRedirectsResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

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
 * Clone redirects from one environment to another.
 */
export default class MrtRedirectClone extends MrtCommand<typeof MrtRedirectClone> {
  static description = t('commands.mrt.redirect.clone.description', 'Clone redirects from one environment to another');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --from staging --to production',
    '<%= config.bin %> <%= command.id %> -p my-storefront --from staging --to production --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    from: Flags.string({
      description: 'Source environment to clone redirects from',
      required: true,
    }),
    to: Flags.string({
      description: 'Destination environment to clone redirects to',
      required: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<CloneRedirectsResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {from: fromTarget, to: toTarget, force} = this.flags;

    // Confirm clone unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t(
          'commands.mrt.redirect.clone.confirm',
          'WARNING: This will REPLACE all redirects in {{toTarget}} with redirects from {{fromTarget}}. Continue?',
          {fromTarget, toTarget},
        ),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.redirect.clone.cancelled', 'Clone cancelled.'));
        return {count: 0, redirects: []};
      }
    }

    this.log(
      t('commands.mrt.redirect.clone.cloning', 'Cloning redirects from {{fromTarget}} to {{toTarget}}...', {
        fromTarget,
        toTarget,
      }),
    );

    try {
      const result = await cloneRedirects(
        {
          projectSlug: project,
          fromTargetSlug: fromTarget,
          toTargetSlug: toTarget,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t(
            'commands.mrt.redirect.clone.success',
            'Cloned {{count}} redirect(s) from {{fromTarget}} to {{toTarget}}.',
            {
              count: result.count,
              fromTarget,
              toTarget,
            },
          ),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.redirect.clone.failed', 'Failed to clone redirects: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
