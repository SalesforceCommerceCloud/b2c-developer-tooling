/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerApiClient, ApiClientExpandOption} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

const VALID_EXPAND_VALUES: readonly ApiClientExpandOption[] = ['organizations', 'roles'] as const;

/**
 * Command to get details of a single Account Manager API client.
 */
export default class ClientGet extends AmCommand<typeof ClientGet> {
  static args = {
    'api-client-id': Args.string({
      description: 'API client ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.client.get.description', 'Get details of an Account Manager API client');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <api-client-id>',
    '<%= config.bin %> <%= command.id %> <api-client-id> --json',
    '<%= config.bin %> <%= command.id %> <api-client-id> --expand organizations,roles',
  ];

  static flags = {
    expand: Flags.string({
      description: t(
        'flags.expand.client.description',
        'Comma-separated list of fields to expand. Valid values: organizations, roles',
      ),
    }),
  };

  async run(): Promise<AccountManagerApiClient> {
    const apiClientId = this.args['api-client-id'];
    const expandRaw = this.flags.expand;

    let expand: ApiClientExpandOption[] | undefined;
    if (expandRaw) {
      const values = expandRaw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const invalid: string[] = [];
      const valid: ApiClientExpandOption[] = [];
      for (const value of values) {
        if (VALID_EXPAND_VALUES.includes(value as ApiClientExpandOption)) {
          valid.push(value as ApiClientExpandOption);
        } else {
          invalid.push(value);
        }
      }
      if (invalid.length > 0) {
        this.error(
          t('commands.client.get.invalidExpand', 'Invalid expand value(s): {{invalid}}. Valid values are: {{valid}}', {
            invalid: invalid.join(', '),
            valid: VALID_EXPAND_VALUES.join(', '),
          }),
        );
      }
      if (valid.length > 0) {
        expand = valid;
      }
    }

    this.log(t('commands.client.get.fetching', 'Fetching API client {{id}}...', {id: apiClientId}));

    let client: AccountManagerApiClient;
    try {
      client = await this.accountManagerClient.getApiClient(apiClientId, expand);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        this.error(t('commands.client.get.notFound', 'API client {{id}} not found', {id: apiClientId}));
      }
      throw error;
    }

    if (this.jsonEnabled()) {
      return client;
    }

    this.printClientDetails(client);

    return client;
  }

  private printBasicFields(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    const passwordModified =
      c.passwordModificationTimestamp !== null && c.passwordModificationTimestamp !== undefined
        ? new Date(c.passwordModificationTimestamp).toLocaleString()
        : undefined;
    const fields: [string, string | undefined][] = [
      ['ID', c.id],
      ['Name', c.name],
      ['Description', c.description ?? undefined],
      ['Active', c.active ? 'Yes' : 'No'],
      ['Auth Method', c.tokenEndpointAuthMethod ?? undefined],
      ['Created', c.createdAt ? new Date(c.createdAt).toLocaleString() : undefined],
      ['Password Modified', passwordModified],
      ['Last Authenticated', c.lastAuthenticatedDate ?? undefined],
      ['Disabled', c.disabledTimestamp ? new Date(c.disabledTimestamp).toLocaleString() : undefined],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }
  }

  private printClientDetails(c: AccountManagerApiClient): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'API Client Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    this.printBasicFields(ui, c);
    this.printRedirectUrls(ui, c);
    this.printScopes(ui, c);
    this.printDefaultScopes(ui, c);
    this.printOrganizations(ui, c);
    this.printRoles(ui, c);
    this.printRoleTenantFilters(ui, c);
    this.printVersionControl(ui, c);

    ux.stdout(ui.toString());
  }

  private printDefaultScopes(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    if (c.defaultScopes === undefined || c.defaultScopes.length === 0) {
      return;
    }

    ui.div({text: 'Default Scopes', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});
    ui.div(
      {text: 'Default Scopes:', width: 25, padding: [0, 2, 0, 0]},
      {text: c.defaultScopes.join(', '), padding: [0, 0, 0, 0]},
    );
  }

  private printOrganizations(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    if (c.organizations === undefined || c.organizations.length === 0) {
      return;
    }

    ui.div({text: 'Organizations', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const orgIds = c.organizations.map((o) => (typeof o === 'string' ? o : (o as {id?: string}).id || 'Unknown'));
    ui.div(
      {text: 'Organization IDs:', width: 25, padding: [0, 2, 0, 0]},
      {text: orgIds.join(', '), padding: [0, 0, 0, 0]},
    );
  }

  private printRedirectUrls(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    if (c.redirectUrls === undefined || c.redirectUrls.length === 0) {
      return;
    }

    ui.div({text: 'Redirect URLs', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});
    ui.div({text: 'URLs:', width: 25, padding: [0, 2, 0, 0]}, {text: c.redirectUrls.join(', '), padding: [0, 0, 0, 0]});
  }

  private printRoles(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    if (c.roles === undefined || c.roles.length === 0) {
      return;
    }

    ui.div({text: 'Roles', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const roleNames = c.roles.map((r) =>
      typeof r === 'string'
        ? r
        : (r as {roleEnumName?: string; id?: string}).roleEnumName || (r as {id?: string}).id || 'Unknown',
    );
    ui.div({text: 'Role IDs:', width: 25, padding: [0, 2, 0, 0]}, {text: roleNames.join(', '), padding: [0, 0, 0, 0]});
  }

  private printRoleTenantFilters(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    const map = c.roleTenantFilterMap as Record<string, string> | undefined;
    const hasMap = map !== undefined && typeof map === 'object' && Object.keys(map).length > 0;
    const filterStr =
      typeof c.roleTenantFilter === 'string' && c.roleTenantFilter.length > 0 ? c.roleTenantFilter : undefined;

    if (!hasMap && !filterStr) {
      return;
    }

    ui.div({text: 'Role Tenant Filters', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    if (hasMap) {
      for (const [roleId, filter] of Object.entries(map)) {
        const filterValue = typeof filter === 'string' ? filter : JSON.stringify(filter);
        ui.div({text: `${roleId}:`, width: 30, padding: [0, 2, 0, 0]}, {text: filterValue, padding: [0, 0, 0, 0]});
      }
    } else if (filterStr) {
      ui.div({text: 'Filter:', width: 25, padding: [0, 2, 0, 0]}, {text: filterStr, padding: [0, 0, 0, 0]});
    }
  }

  private printScopes(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    if (c.scopes === undefined || c.scopes.length === 0) {
      return;
    }

    ui.div({text: 'Scopes', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});
    ui.div({text: 'Scopes:', width: 25, padding: [0, 2, 0, 0]}, {text: c.scopes.join(', '), padding: [0, 0, 0, 0]});
  }

  private printVersionControl(ui: ReturnType<typeof cliui>, c: AccountManagerApiClient): void {
    if (c.versionControl === undefined || c.versionControl.length === 0) {
      return;
    }

    ui.div({text: 'Version Control', padding: [2, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});
    ui.div(
      {text: 'Identifiers:', width: 25, padding: [0, 2, 0, 0]},
      {text: c.versionControl.join(', '), padding: [0, 0, 0, 0]},
    );
  }
}
