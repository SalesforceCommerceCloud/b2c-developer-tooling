/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerUser} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';
import {resolveOrgId} from '../../../utils/am/resolve-org.js';
import {printUserDetails} from '../../../utils/am/user-display.js';

/**
 * Command to create a new Account Manager user.
 */
export default class UserCreate extends AmCommand<typeof UserCreate> {
  static description = t('commands.user.create.description', 'Create a new Account Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --org org-id --mail user@example.com --first-name John --last-name Doe',
    '<%= config.bin %> <%= command.id %> --org "My Organization" --mail user@example.com --first-name John --last-name Doe --json',
  ];

  static flags = {
    org: Flags.string({
      char: 'o',
      description: 'Organization ID or name',
      required: true,
    }),
    mail: Flags.string({
      char: 'm',
      description: 'User email (login)',
      required: true,
    }),
    'first-name': Flags.string({
      description: 'First name',
      required: true,
    }),
    'last-name': Flags.string({
      description: 'Last name',
      required: true,
    }),
  };

  async run(): Promise<AccountManagerUser> {
    const {org: orgInput, mail, 'first-name': firstName, 'last-name': lastName} = this.flags;

    const orgId = await resolveOrgId(this.accountManagerClient, orgInput);

    this.log(
      t('commands.user.create.creating', 'Creating user {{mail}} in organization {{org}}...', {mail, org: orgId}),
    );

    const user = await this.accountManagerClient.createUser({
      mail,
      firstName,
      lastName,
      organizations: [orgId],
      primaryOrganization: orgId,
    });

    if (this.jsonEnabled()) {
      return user;
    }

    this.log(
      t('commands.user.create.success', 'User {{mail}} created successfully in organization {{org}}.', {
        mail,
        org: orgId,
      }),
    );

    const [roleMapping, orgMapping] = await Promise.all([
      this.accountManagerClient.getRoleMapping(),
      this.accountManagerClient.getOrgMapping(),
    ]);
    printUserDetails(user, roleMapping, orgMapping);

    return user;
  }
}
