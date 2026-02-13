/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerUser, UserExpandOption} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';
import {printUserDetails} from '../../../utils/am/user-display.js';

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

    const [roleMapping, orgMapping] = await Promise.all([
      this.accountManagerClient.getRoleMapping(),
      this.accountManagerClient.getOrgMapping(),
    ]);
    printUserDetails(user, roleMapping, orgMapping);

    return user;
  }
}
