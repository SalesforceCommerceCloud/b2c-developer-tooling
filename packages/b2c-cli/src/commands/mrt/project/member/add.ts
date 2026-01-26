/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  addMember,
  MEMBER_ROLES,
  type MrtMember,
  type MemberRoleValue,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Add a member to an MRT project.
 */
export default class MrtMemberAdd extends MrtCommand<typeof MrtMemberAdd> {
  static args = {
    email: Args.string({
      description: 'Email address of the user to add',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.member.add.description', 'Add a member to a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-member-add',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --project my-storefront --role 1',
    '<%= config.bin %> <%= command.id %> user@example.com -p my-storefront --role 0',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    role: Flags.integer({
      char: 'r',
      description: 'Role for the member (0=Admin, 1=Developer, 2=Marketer, 3=Read Only)',
      options: ['0', '1', '2', '3'],
      required: true,
    }),
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

    const {role} = this.flags;
    const roleValue = role as MemberRoleValue;
    const roleName = MEMBER_ROLES[roleValue];

    this.log(
      t('commands.mrt.member.add.adding', 'Adding {{email}} as {{roleName}} to {{project}}...', {
        email,
        roleName,
        project,
      }),
    );

    try {
      const result = await addMember(
        {
          projectSlug: project,
          email,
          role: roleValue,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.member.add.success', 'Member {{email}} added with role {{roleName}}.', {
            email,
            roleName,
          }),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.mrt.member.add.failed', 'Failed to add member: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
