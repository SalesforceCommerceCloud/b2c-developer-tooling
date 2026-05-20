/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {AmCommand, printFieldsBlock, type DetailField, type DetailSection} from '@salesforce/b2c-tooling-sdk/cli';
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

  private buildTenantFilterSection(c: AccountManagerApiClient): DetailSection | undefined {
    const map = c.roleTenantFilterMap as Record<string, string> | undefined;
    const hasMap = map !== undefined && typeof map === 'object' && Object.keys(map).length > 0;
    const filterStr =
      typeof c.roleTenantFilter === 'string' && c.roleTenantFilter.length > 0 ? c.roleTenantFilter : undefined;

    if (!hasMap && !filterStr) {
      return undefined;
    }

    const fields: DetailField[] = [];
    if (hasMap && map) {
      for (const [roleId, filter] of Object.entries(map)) {
        const filterValue = typeof filter === 'string' ? filter : JSON.stringify(filter);
        fields.push([roleId, filterValue]);
      }
    } else if (filterStr) {
      fields.push(['Filter', filterStr]);
    }

    return {title: 'Role Tenant Filters', fields};
  }

  private printClientDetails(c: AccountManagerApiClient): void {
    const passwordModified =
      c.passwordModificationTimestamp !== null && c.passwordModificationTimestamp !== undefined
        ? new Date(c.passwordModificationTimestamp).toLocaleString()
        : undefined;

    const basicFields: DetailField[] = [
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

    const sections: DetailSection[] = [];

    if (c.redirectUrls && c.redirectUrls.length > 0) {
      sections.push({title: 'Redirect URLs', fields: [['URLs', c.redirectUrls.join(', ')]]});
    }

    if (c.scopes && c.scopes.length > 0) {
      sections.push({title: 'Scopes', fields: [['Scopes', c.scopes.join(', ')]]});
    }

    if (c.defaultScopes && c.defaultScopes.length > 0) {
      sections.push({title: 'Default Scopes', fields: [['Default Scopes', c.defaultScopes.join(', ')]]});
    }

    if (c.organizations && c.organizations.length > 0) {
      const orgIds = c.organizations.map((o) => (typeof o === 'string' ? o : (o as {id?: string}).id || 'Unknown'));
      sections.push({title: 'Organizations', fields: [['Organization IDs', orgIds.join(', ')]]});
    }

    if (c.roles && c.roles.length > 0) {
      const roleNames = c.roles.map((r) =>
        typeof r === 'string'
          ? r
          : (r as {roleEnumName?: string; id?: string}).roleEnumName || (r as {id?: string}).id || 'Unknown',
      );
      sections.push({title: 'Roles', fields: [['Role IDs', roleNames.join(', ')]]});
    }

    const tenantFilterSection = this.buildTenantFilterSection(c);
    if (tenantFilterSection) {
      sections.push(tenantFilterSection);
    }

    if (c.versionControl && c.versionControl.length > 0) {
      sections.push({title: 'Version Control', fields: [['Identifiers', c.versionControl.join(', ')]]});
    }

    printFieldsBlock('API Client Details', basicFields, {sections});
  }
}
