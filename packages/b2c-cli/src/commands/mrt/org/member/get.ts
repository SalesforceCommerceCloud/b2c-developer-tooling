/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getOrgMember,
  ORG_ROLES,
  type MrtOrgMember,
  type OrgRoleValue,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

export default class MrtOrgMemberGet extends MrtCommand<typeof MrtOrgMemberGet> {
  static args = {
    email: Args.string({description: 'Email address of the member', required: true}),
  };

  static description = withDocs(
    t('commands.mrt.org.member.get.description', 'Get details for a Managed Runtime organization member'),
    '/cli/mrt.html#b2c-mrt-org-member-get',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> alice@example.com --org my-org'];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
  };

  async run(): Promise<MrtOrgMember> {
    this.requireMrtCredentials();

    const {email} = this.args;
    const {org} = this.flags;

    const member = await getOrgMember(
      {organizationSlug: org, email, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      const ui = cliui({width: process.stdout.columns || 80});
      const w = 22;
      ui.div('');
      ui.div({text: 'Email:', width: w}, {text: member.email ?? member.user ?? '-'});
      ui.div({text: 'Name:', width: w}, {text: [member.first_name, member.last_name].filter(Boolean).join(' ') || '-'});
      ui.div({text: 'Role:', width: w}, {text: ORG_ROLES[member.role as OrgRoleValue] ?? String(member.role)});
      ui.div({text: 'View All Projects:', width: w}, {text: member.can_view_all_projects ? 'Yes' : 'No'});
      ui.div(
        {text: 'Cert Permission:', width: w},
        {text: member.custom_domain_cert_permission === 2 ? 'Enabled' : 'Disabled'},
      );
      ux.stdout(ui.toString());
    }

    return member;
  }
}
