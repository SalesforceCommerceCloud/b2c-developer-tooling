/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listOrgMembers,
  ORG_ROLES,
  type ListOrgMembersResult,
  type MrtOrgMember,
  type OrgRoleValue,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtOrgMember>> = {
  email: {
    header: 'Email',
    get: (m) => m.email ?? m.user ?? '-',
  },
  name: {
    header: 'Name',
    get: (m) => [m.first_name, m.last_name].filter(Boolean).join(' ') || '-',
  },
  role: {
    header: 'Role',
    get: (m) => ORG_ROLES[m.role as OrgRoleValue] ?? String(m.role),
  },
  allProjects: {
    header: 'View All Projects',
    get: (m) => (m.can_view_all_projects ? 'Yes' : 'No'),
  },
  certPerm: {
    header: 'Cert Perm',
    get: (m) => (m.custom_domain_cert_permission === 2 ? 'Enabled' : 'Disabled'),
  },
};

const DEFAULT_COLUMNS = ['email', 'name', 'role', 'allProjects', 'certPerm'];

export default class MrtOrgMemberList extends MrtCommand<typeof MrtOrgMemberList> {
  static description = withDocs(
    t('commands.mrt.org.member.list.description', 'List members of a Managed Runtime organization'),
    '/cli/mrt.html#b2c-mrt-org-member-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --org my-org',
    '<%= config.bin %> <%= command.id %> --org my-org --search alice',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({
      description: 'Organization slug',
      required: true,
    }),
    limit: Flags.integer({description: 'Maximum number of results to return'}),
    offset: Flags.integer({description: 'Offset for pagination'}),
    search: Flags.string({description: 'Search term for filtering'}),
  };

  async run(): Promise<ListOrgMembersResult> {
    this.requireMrtCredentials();

    const {org, limit, offset, search} = this.flags;

    const result = await listOrgMembers(
      {
        organizationSlug: org,
        limit,
        offset,
        search,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.members.length === 0) {
        this.log(t('commands.mrt.org.member.list.empty', 'No members found.'));
      } else {
        this.log(t('commands.mrt.org.member.list.count', 'Found {{count}} member(s):', {count: result.count}));
        createTable(COLUMNS).render(result.members, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
