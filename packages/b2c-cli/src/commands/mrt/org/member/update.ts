/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateOrgMember, type MrtOrgMember} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

export default class MrtOrgMemberUpdate extends MrtCommand<typeof MrtOrgMemberUpdate> {
  static args = {
    email: Args.string({description: 'Email address of the member to update', required: true}),
  };

  static description = withDocs(
    t('commands.mrt.org.member.update.description', "Update a Managed Runtime organization member's permissions"),
    '/cli/mrt.html#b2c-mrt-org-member-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> alice@example.com --org my-org --view-all-projects',
    '<%= config.bin %> <%= command.id %> alice@example.com --org my-org --no-cert-permission',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
    'view-all-projects': Flags.boolean({
      description: 'Whether the member can view all projects',
      allowNo: true,
    }),
    'cert-permission': Flags.boolean({
      description: 'Whether the member can manage custom domain certificates',
      allowNo: true,
    }),
  };

  async run(): Promise<MrtOrgMember> {
    this.requireMrtCredentials();

    const {email} = this.args;
    const {org, 'view-all-projects': viewAll, 'cert-permission': certPerm} = this.flags;

    if (viewAll === undefined && certPerm === undefined) {
      this.error(
        t(
          'commands.mrt.org.member.update.noChanges',
          'No changes specified. Provide --view-all-projects and/or --cert-permission.',
        ),
      );
    }

    const result = await updateOrgMember(
      {
        organizationSlug: org,
        email,
        canViewAllProjects: viewAll,
        customDomainCertPermission: certPerm === undefined ? undefined : certPerm ? 2 : 1,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.org.member.update.success', 'Updated permissions for {{email}}.', {email}));
    }

    return result;
  }
}
