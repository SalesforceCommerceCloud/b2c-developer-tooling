/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {UserCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getUserByLogin} from '@salesforce/b2c-tooling-sdk/operations/users';
import type {AccountManagerUser} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

/**
 * Command to get details of a single Account Manager user.
 */
export default class UserGet extends UserCommand<typeof UserGet> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.user.get.description', 'Get details of an Account Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com',
    '<%= config.bin %> <%= command.id %> user@example.com --json',
  ];

  async run(): Promise<AccountManagerUser> {
    const {login} = this.args;

    this.log(t('commands.user.get.fetching', 'Fetching user {{login}}...', {login}));

    const user = await getUserByLogin(this.accountManagerClient, login);

    if (this.jsonEnabled()) {
      return user;
    }

    this.printUserDetails(user);

    return user;
  }

  private printBasicFields(ui: ReturnType<typeof cliui>, user: AccountManagerUser): void {
    const isPasswordExpired = user.passwordExpirationTimestamp
      ? user.passwordExpirationTimestamp < Date.now()
      : undefined;
    const twoFAEnabled = user.verifiers && user.verifiers.length > 0 ? 'Yes' : 'No';

    const fields: [string, string | undefined][] = [
      ['ID', user.id],
      ['Email', user.mail],
      ['First Name', user.firstName],
      ['Last Name', user.lastName],
      ['Display Name', user.displayName],
      ['State', user.userState],
      ['Primary Organization', user.primaryOrganization],
      ['Preferred Locale', user.preferredLocale || undefined],
      ['Business Phone', user.businessPhone || undefined],
      ['Home Phone', user.homePhone || undefined],
      ['Mobile Phone', user.mobilePhone || undefined],
      ['Linked to SF Identity', user.linkedToSfIdentity?.toString()],
      ['2FA Enabled', twoFAEnabled],
      ['Password Expired', isPasswordExpired === undefined ? undefined : isPasswordExpired ? 'Yes' : 'No'],
      ['Last Login', user.lastLoginDate || undefined],
      ['Created At', user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined],
      ['Last Modified', user.lastModified ? new Date(user.lastModified).toLocaleString() : undefined],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }
  }

  private printOrganizations(ui: ReturnType<typeof cliui>, user: AccountManagerUser): void {
    if (user.organizations === undefined || user.organizations.length === 0) {
      return;
    }

    ui.div({text: 'Organizations', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const orgIds = user.organizations.map((o) => (typeof o === 'string' ? o : o.id || 'Unknown'));
    ui.div(
      {text: 'Organization IDs:', width: 25, padding: [0, 2, 0, 0]},
      {text: orgIds.join(', '), padding: [0, 0, 0, 0]},
    );
  }

  private printRoles(ui: ReturnType<typeof cliui>, user: AccountManagerUser): void {
    if (user.roles === undefined || user.roles.length === 0) {
      return;
    }

    ui.div({text: 'Roles', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const roleNames = user.roles.map((r) => (typeof r === 'string' ? r : r.roleEnumName || r.id || 'Unknown'));
    ui.div({text: 'Role IDs:', width: 25, padding: [0, 2, 0, 0]}, {text: roleNames.join(', '), padding: [0, 0, 0, 0]});
  }

  private printRoleTenantFilters(ui: ReturnType<typeof cliui>, user: AccountManagerUser): void {
    if (user.roleTenantFilterMap === undefined || Object.keys(user.roleTenantFilterMap).length === 0) {
      return;
    }

    ui.div({text: 'Role Tenant Filters', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    for (const [roleId, filter] of Object.entries(user.roleTenantFilterMap)) {
      const filterValue = typeof filter === 'string' ? filter : JSON.stringify(filter);
      ui.div({text: `${roleId}:`, width: 30, padding: [0, 2, 0, 0]}, {text: filterValue, padding: [0, 0, 0, 0]});
    }
  }

  private printUserDetails(user: AccountManagerUser): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'User Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    this.printBasicFields(ui, user);
    this.printOrganizations(ui, user);
    this.printRoles(ui, user);
    this.printRoleTenantFilters(ui, user);

    ux.stdout(ui.toString());
  }
}
