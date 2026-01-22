/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listMembers,
  type ListMembersResult,
  type MrtMember,
  type MemberRoleValue,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtMember>> = {
  email: {
    header: 'Email',
    get: (member) => member.user ?? '-',
  },
  role: {
    header: 'Role',
    get: (member) => member.role?.name ?? '-',
  },
  roleValue: {
    header: 'Role ID',
    get: (member) => member.role?.value?.toString() ?? '-',
  },
};

const DEFAULT_COLUMNS = ['email', 'role'];

/**
 * List members for an MRT project.
 */
export default class MrtMemberList extends MrtCommand<typeof MrtMemberList> {
  static description = t('commands.mrt.member.list.description', 'List members for a Managed Runtime project');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --role 0',
    '<%= config.bin %> <%= command.id %> -p my-storefront --search user@example.com',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
    role: Flags.integer({
      description: 'Filter by role (0=Admin, 1=Developer, 2=Marketer, 3=Read Only)',
      options: ['0', '1', '2', '3'],
    }),
    search: Flags.string({
      description: 'Search term for filtering',
    }),
  };

  async run(): Promise<ListMembersResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {limit, offset, role, search} = this.flags;

    this.log(t('commands.mrt.member.list.fetching', 'Fetching members for {{project}}...', {project}));

    const result = await listMembers(
      {
        projectSlug: project,
        limit,
        offset,
        role: role as MemberRoleValue | undefined,
        search,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.members.length === 0) {
        this.log(t('commands.mrt.member.list.empty', 'No members found.'));
      } else {
        this.log(t('commands.mrt.member.list.count', 'Found {{count}} member(s):', {count: result.count}));
        this.log(t('commands.mrt.member.list.roles', 'Roles: Admin=0, Developer=1, Marketer=2, Read Only=3'));
        createTable(COLUMNS).render(result.members, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
