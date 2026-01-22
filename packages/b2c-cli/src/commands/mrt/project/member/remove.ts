/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {removeMember} from '@salesforce/b2c-tooling-sdk/operations/mrt';
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
 * Remove a member from an MRT project.
 */
export default class MrtMemberRemove extends MrtCommand<typeof MrtMemberRemove> {
  static args = {
    email: Args.string({
      description: 'Email address of the member to remove',
      required: true,
    }),
  };

  static description = t('commands.mrt.member.remove.description', 'Remove a member from a Managed Runtime project');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --project my-storefront',
    '<%= config.bin %> <%= command.id %> user@example.com -p my-storefront --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<{email: string; removed: boolean}> {
    this.requireMrtCredentials();

    const {email} = this.args;
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {force} = this.flags;

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.member.remove.confirm', 'Are you sure you want to remove {{email}} from {{project}}?', {
          email,
          project,
        }),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.member.remove.cancelled', 'Removal cancelled.'));
        return {email, removed: false};
      }
    }

    this.log(t('commands.mrt.member.remove.removing', 'Removing {{email}} from {{project}}...', {email, project}));

    try {
      await removeMember(
        {
          projectSlug: project,
          email,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.member.remove.success', 'Member {{email}} removed.', {email}));
      }

      return {email, removed: true};
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.member.remove.failed', 'Failed to remove member: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
