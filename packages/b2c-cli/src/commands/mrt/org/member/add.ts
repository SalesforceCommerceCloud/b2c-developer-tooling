/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  addOrgMember,
  ORG_ROLES,
  type MrtOrgMember,
  type OrgRoleValue,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

const ROLE_NAMES_LOWER = Object.values(ORG_ROLES).map((n) => n.toLowerCase());

function roleNameToValue(name: string): OrgRoleValue {
  const lower = name.toLowerCase();
  for (const [value, label] of Object.entries(ORG_ROLES)) {
    if (label.toLowerCase() === lower) {
      return Number(value) as OrgRoleValue;
    }
  }
  // Unreachable because the flag is constrained by `options`.
  throw new Error(`Unknown role: ${name}`);
}

export default class MrtOrgMemberAdd extends MrtCommand<typeof MrtOrgMemberAdd> {
  static args = {
    email: Args.string({description: 'Email address of the member to add', required: true}),
  };

  static description = withDocs(
    t('commands.mrt.org.member.add.description', 'Add a member to a Managed Runtime organization'),
    '/cli/mrt.html#b2c-mrt-org-member-add',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> alice@example.com --org my-org --role member',
    '<%= config.bin %> <%= command.id %> bob@example.com --org my-org --role owner --view-all-projects',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
    role: Flags.string({
      description: 'Role for the member',
      required: true,
      options: ROLE_NAMES_LOWER,
    }),
    'view-all-projects': Flags.boolean({
      description: 'Allow the member to view all projects in the organization',
      allowNo: true,
    }),
    'cert-permission': Flags.boolean({
      description: 'Allow the member to manage custom domain certificates',
      allowNo: true,
    }),
  };

  protected operations = {addOrgMember};

  async run(): Promise<MrtOrgMember> {
    this.requireMrtCredentials();

    const {email} = this.args;
    const {org, role: roleFlag, 'view-all-projects': viewAll, 'cert-permission': certPerm} = this.flags;

    const role = roleNameToValue(roleFlag);

    const result = await this.operations.addOrgMember(
      {
        organizationSlug: org,
        email,
        role,
        canViewAllProjects: viewAll,
        customDomainCertPermission: certPerm === undefined ? undefined : certPerm ? 2 : 1,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.org.member.add.success', 'Added {{email}} to {{org}} as {{role}}.', {
          email,
          org,
          role: ORG_ROLES[role],
        }),
      );
    }

    return result;
  }
}
