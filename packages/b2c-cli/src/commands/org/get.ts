/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {OrgCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getOrg, getOrgByName} from '@salesforce/b2c-tooling-sdk/operations/orgs';
import type {AccountManagerOrganization} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

/**
 * Command to get details of a single Account Manager organization.
 */
export default class OrgGet extends OrgCommand<typeof OrgGet> {
  static args = {
    org: Args.string({
      description: 'Organization ID or name',
      required: true,
    }),
  };

  static description = t('commands.org.get.description', 'Get details of an Account Manager organization');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> org-id',
    '<%= config.bin %> <%= command.id %> "My Organization"',
    '<%= config.bin %> <%= command.id %> org-id --json',
  ];

  async run(): Promise<AccountManagerOrganization> {
    const {org} = this.args;

    this.log(t('commands.org.get.fetching', 'Fetching organization {{org}}...', {org}));

    // Try to get by ID first, then by name
    let organization: AccountManagerOrganization;
    try {
      organization = await getOrg(this.accountManagerOrgsClient, org);
    } catch (error) {
      // If not found by ID, try by name
      if (error instanceof Error && error.message.includes('not found')) {
        try {
          organization = await getOrgByName(this.accountManagerOrgsClient, org);
        } catch (nameError) {
          // Preserve the specific error message if it's already a "not found" error
          if (nameError instanceof Error && nameError.message.includes('not found')) {
            throw nameError;
          }
          throw new Error(t('commands.org.get.notFound', 'Organization {{org}} not found', {org}));
        }
      } else {
        throw error;
      }
    }

    if (this.jsonEnabled()) {
      return organization;
    }

    this.printOrgDetails(organization);

    return organization;
  }

  private printAccountIds(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    const sfAccountIds = org.sfAccountIds as string[] | undefined;
    if (sfAccountIds && sfAccountIds.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Account Ids', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      for (const accountId of sfAccountIds) {
        ui.div({text: `  - ${accountId}`, padding: [0, 0, 0, 0]}, {text: '', padding: [0, 0, 0, 0]});
      }
    }
  }

  private printAllowedVerifierTypes(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    if (org.allowedVerifierTypes && org.allowedVerifierTypes.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Allowed Verifier Types', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      for (const verifierType of org.allowedVerifierTypes) {
        ui.div({text: `  - ${verifierType}`, padding: [0, 0, 0, 0]}, {text: '', padding: [0, 0, 0, 0]});
      }
    }
  }

  private printBasicFields(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    ui.div({text: 'Organization Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['ID', org.id],
      ['Name', org.name],
      ['2FA Enabled', org.twoFAEnabled ? 'Yes' : 'No'],
      ['VaaS Enabled', org.vaasEnabled ? 'Yes' : 'No'],
      ['SF Identity', org.sfIdentityFederation ? 'Yes' : 'No'],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 20, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }
  }

  private printContactUsers(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    const contactUsers = org.contactUsers as string[] | undefined;
    if (contactUsers && contactUsers.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Contact Users', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      for (const userId of contactUsers) {
        ui.div({text: `  - ${userId}`, padding: [0, 0, 0, 0]}, {text: '', padding: [0, 0, 0, 0]});
      }
    }
  }

  private printEmailDomains(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    const emailsDomains = org.emailsDomains as string[] | undefined;
    if (emailsDomains && emailsDomains.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Email Domains', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      for (const domain of emailsDomains) {
        ui.div({text: `  - ${domain}`, padding: [0, 0, 0, 0]}, {text: '', padding: [0, 0, 0, 0]});
      }
    }
  }

  private printOrgDetails(org: AccountManagerOrganization): void {
    const ui = cliui({width: process.stdout.columns || 80});

    this.printBasicFields(ui, org);
    this.printContactUsers(ui, org);
    this.printAllowedVerifierTypes(ui, org);
    this.printAccountIds(ui, org);
    this.printRealms(ui, org);
    this.printEmailDomains(ui, org);
    this.printTwoFARoles(ui, org);
    this.printPasswordPolicy(ui, org);

    ux.stdout(ui.toString());
  }

  private printPasswordPolicy(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    const passwordMinEntropy = org.passwordMinEntropy as number | undefined;
    const passwordHistorySize = org.passwordHistorySize as number | undefined;
    const passwordDaysExpiration = org.passwordDaysExpiration as number | undefined;

    // Only show section if at least one password policy attribute exists
    if (passwordMinEntropy === undefined && passwordHistorySize === undefined && passwordDaysExpiration === undefined) {
      return;
    }

    ui.div({text: '', padding: [0, 0, 0, 0]});
    ui.div({text: 'Password Policy', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['Minimum Password Length', passwordMinEntropy === undefined ? undefined : passwordMinEntropy.toString()],
      ['Length of Password History', passwordHistorySize === undefined ? undefined : passwordHistorySize.toString()],
      [
        'Days Until Password Expires',
        passwordDaysExpiration === undefined ? undefined : passwordDaysExpiration.toString(),
      ],
    ];

    for (const [label, value] of fields) {
      if (value === undefined) {
        continue;
      }
      ui.div({text: `${label}:`, width: 30, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
    }
  }

  private printRealms(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    if (org.realms && org.realms.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Realms', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});
      ui.div({text: org.realms.join(', '), padding: [0, 0, 0, 0]}, {text: '', padding: [0, 0, 0, 0]});
    }
  }

  private printTwoFARoles(ui: ReturnType<typeof cliui>, org: AccountManagerOrganization): void {
    if (org.twoFARoles && org.twoFARoles.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: '2FA Roles', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      for (const role of org.twoFARoles) {
        ui.div({text: `  - ${role}`, padding: [0, 0, 0, 0]}, {text: '', padding: [0, 0, 0, 0]});
      }
    }
  }
}
