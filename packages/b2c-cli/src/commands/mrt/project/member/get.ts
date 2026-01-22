/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getMember, type MrtMember} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

/**
 * Print member details in a formatted table.
 */
function printMemberDetails(member: MrtMember, project: string): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 12;

  ui.div('');
  ui.div({text: 'Email:', width: labelWidth}, {text: member.user ?? ''});
  ui.div({text: 'Project:', width: labelWidth}, {text: project});
  ui.div({text: 'Role:', width: labelWidth}, {text: member.role?.name ?? '-'});
  ui.div({text: 'Role ID:', width: labelWidth}, {text: member.role?.value?.toString() ?? '-'});

  ux.stdout(ui.toString());
}

/**
 * Get details of a project member.
 */
export default class MrtMemberGet extends MrtCommand<typeof MrtMemberGet> {
  static args = {
    email: Args.string({
      description: 'Email address of the member',
      required: true,
    }),
  };

  static description = t('commands.mrt.member.get.description', 'Get details of a Managed Runtime project member');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --project my-storefront',
    '<%= config.bin %> <%= command.id %> user@example.com -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<MrtMember> {
    this.requireMrtCredentials();

    const {email} = this.args;
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    this.log(t('commands.mrt.member.get.fetching', 'Fetching member {{email}}...', {email}));

    try {
      const result = await getMember(
        {
          projectSlug: project,
          email,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        printMemberDetails(result, project);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.mrt.member.get.failed', 'Failed to get member: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
