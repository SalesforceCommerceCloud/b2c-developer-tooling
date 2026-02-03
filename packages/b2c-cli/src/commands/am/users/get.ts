/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerUser, UserExpandOption} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

/**
 * Valid expand values for the users API.
 * Extracted from the generated API types to ensure consistency.
 */
const VALID_EXPAND_VALUES: readonly UserExpandOption[] = ['organizations', 'roles'] as const;

/**
 * Command to get details of a single Account Manager user.
 */
export default class UserGet extends AmCommand<typeof UserGet> {
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
    '<%= config.bin %> <%= command.id %> user@example.com --expand-all',
    '<%= config.bin %> <%= command.id %> user@example.com --expand organizations',
    '<%= config.bin %> <%= command.id %> user@example.com --expand organizations,roles',
  ];

  static flags = {
    expand: Flags.string({
      description: t(
        'flags.expand.description',
        'Comma-separated list of fields to expand. Valid values: organizations, roles',
      ),
      multiple: false,
    }),
    'expand-all': Flags.boolean({
      description: t('flags.expandAll.description', 'Expand both organizations and roles'),
      default: false,
    }),
  };

  async run(): Promise<AccountManagerUser> {
    const {login} = this.args;
    const {expand: expandRaw, 'expand-all': expandAll} = this.flags;

    // Validate and process expand flags
    let expand: undefined | UserExpandOption[];

    if (expandAll) {
      // --expand-all expands both
      expand = ['organizations', 'roles'];
    } else if (expandRaw) {
      // Parse comma-separated values
      const expandValues = expandRaw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      // Validate each value
      const invalidValues: string[] = [];
      const validValues: UserExpandOption[] = [];

      for (const value of expandValues) {
        if (VALID_EXPAND_VALUES.includes(value as UserExpandOption)) {
          validValues.push(value as UserExpandOption);
        } else {
          invalidValues.push(value);
        }
      }

      if (invalidValues.length > 0) {
        this.error(
          t('commands.user.get.invalidExpand', 'Invalid expand value(s): {{invalid}}. Valid values are: {{valid}}', {
            invalid: invalidValues.join(', '),
            valid: VALID_EXPAND_VALUES.join(', '),
          }),
        );
      }

      if (validValues.length > 0) {
        expand = validValues;
      }
    }

    this.log(t('commands.user.get.fetching', 'Fetching user {{login}}...', {login}));

    const user = await this.accountManagerClient.findUserByLogin(login, expand);

    if (!user) {
      this.error(t('commands.user.get.notFound', 'User {{login}} not found', {login}));
    }

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
