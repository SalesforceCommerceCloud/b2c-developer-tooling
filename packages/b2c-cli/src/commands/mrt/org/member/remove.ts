/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {removeOrgMember} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';
import {confirm} from '../../../../prompts.js';

export default class MrtOrgMemberRemove extends MrtCommand<typeof MrtOrgMemberRemove> {
  static args = {
    email: Args.string({description: 'Email address of the member to remove', required: true}),
  };

  static description = withDocs(
    t('commands.mrt.org.member.remove.description', 'Remove a member from a Managed Runtime organization'),
    '/cli/mrt.html#b2c-mrt-org-member-remove',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> alice@example.com --org my-org'];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
    force: Flags.boolean({char: 'f', description: 'Skip confirmation prompt', default: false}),
  };

  async run(): Promise<{email: string; removed: boolean}> {
    this.requireMrtCredentials();

    const {email} = this.args;
    const {org, force} = this.flags;

    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.org.member.remove.confirm', 'Remove {{email}} from {{org}}?', {email, org}),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.org.member.remove.cancelled', 'Cancelled.'));
        return {email, removed: false};
      }
    }

    await removeOrgMember(
      {organizationSlug: org, email, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.org.member.remove.success', 'Removed {{email}} from {{org}}.', {email, org}));
    }

    return {email, removed: true};
  }
}
