/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerApiClient, APIClientUpdate} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

/** Role tenant filter pattern: ROLE_ENUM:realm_instance(,realm_instance)*(;ROLE_ENUM:...)* e.g. SALESFORCE_COMMERCE_API:abcd_prd */
const ROLE_TENANT_FILTER_PATTERN = /^(\w+:\w{4,}_\w{3,}(,\w{4,}_\w{3,})*(;)?)*$/;

function splitCommaSeparated(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Command to update an Account Manager API client.
 */
export default class ClientUpdate extends AmCommand<typeof ClientUpdate> {
  static args = {
    'api-client-id': Args.string({
      description: 'API client ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.client.update.description', 'Update an Account Manager API client');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <api-client-id> --name new-name',
    '<%= config.bin %> <%= command.id %> <api-client-id> --active',
    '<%= config.bin %> <%= command.id %> <api-client-id> --scopes "mail,openid" --default-scopes "mail"',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'API client name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Description of the API client',
    }),
    organizations: Flags.string({
      char: 'o',
      description: 'Comma-separated organization IDs',
    }),
    roles: Flags.string({
      char: 'r',
      description: 'Comma-separated role IDs',
    }),
    'role-tenant-filter': Flags.string({
      description:
        'Role tenant filter (format: ROLE:realm_instance,realm_instance;ROLE2:... e.g. SALESFORCE_COMMERCE_API:abcd_prd)',
    }),
    active: Flags.boolean({
      description: 'Set active state (true/false)',
    }),
    'redirect-urls': Flags.string({
      description: 'Comma-separated list of allowed redirect URLs for OAuth flows',
    }),
    scopes: Flags.string({
      description: 'Comma-separated OAuth scopes available to this API client',
    }),
    'default-scopes': Flags.string({
      description: 'Comma-separated default OAuth scopes granted to this API client',
    }),
    'version-control': Flags.string({
      description: 'Comma-separated version control system identifiers',
    }),
    'token-endpoint-auth-method': Flags.string({
      description: 'Token endpoint auth method: private_key_jwt, client_secret_post, client_secret_basic, or none',
      options: ['private_key_jwt', 'client_secret_post', 'client_secret_basic', 'none'],
    }),
    'jwt-public-key': Flags.string({
      description: 'Public key for JWT authentication (PEM or inline)',
    }),
  };

  async run(): Promise<AccountManagerApiClient> {
    const apiClientId = this.args['api-client-id'];
    const {
      name,
      description,
      organizations,
      roles,
      'role-tenant-filter': roleTenantFilter,
      active,
      'redirect-urls': redirectUrls,
      scopes,
      'default-scopes': defaultScopes,
      'version-control': versionControl,
      'token-endpoint-auth-method': tokenEndpointAuthMethod,
      'jwt-public-key': jwtPublicKey,
    } = this.flags;

    const hasChanges =
      name !== undefined ||
      description !== undefined ||
      organizations !== undefined ||
      roles !== undefined ||
      roleTenantFilter !== undefined ||
      active !== undefined ||
      redirectUrls !== undefined ||
      scopes !== undefined ||
      defaultScopes !== undefined ||
      versionControl !== undefined ||
      tokenEndpointAuthMethod !== undefined ||
      jwtPublicKey !== undefined;

    if (!hasChanges) {
      this.error(t('commands.client.update.noChanges', 'No changes specified. Provide at least one flag to update.'));
    }

    if (name !== undefined && name.length > 200) {
      this.error(
        t('commands.client.update.nameMaxLength', 'Name must be at most 200 characters (received {{length}})', {
          length: name.length,
        }),
      );
    }
    if (description !== undefined && description.length > 256) {
      this.error(
        t(
          'commands.client.update.descriptionMaxLength',
          'Description must be at most 256 characters (received {{length}})',
          {length: description.length},
        ),
      );
    }
    if (
      roleTenantFilter !== undefined &&
      roleTenantFilter.length > 0 &&
      !ROLE_TENANT_FILTER_PATTERN.test(roleTenantFilter)
    ) {
      this.error(
        t(
          'commands.client.update.invalidRoleTenantFilter',
          'Role tenant filter must match pattern: ROLE:realm_instance(,realm_instance)*(;ROLE:...)* (e.g. SALESFORCE_COMMERCE_API:abcd_prd)',
        ),
      );
    }

    const body = this.buildUpdateBody(this.flags);

    this.log(t('commands.client.update.updating', 'Updating API client {{id}}...', {id: apiClientId}));

    const client = await this.accountManagerClient.updateApiClient(apiClientId, body);

    this.log(t('commands.client.update.success', 'API client {{id}} updated successfully.', {id: apiClientId}));

    return client;
  }

  /**
   * Builds update body with only explicitly provided flags (minimal partial update).
   * Omitting fields lets the API keep current values and avoids "invalid argument APIClient" when
   * only updating e.g. roleTenantFilter.
   */
  private buildUpdateBody(flags: {
    name?: string;
    description?: string;
    organizations?: string;
    roles?: string;
    'role-tenant-filter'?: string;
    active?: boolean;
    'redirect-urls'?: string;
    scopes?: string;
    'default-scopes'?: string;
    'version-control'?: string;
    'token-endpoint-auth-method'?: string;
    'jwt-public-key'?: string;
  }): APIClientUpdate {
    const body: Record<string, unknown> = {};
    if (flags.active !== undefined) body.active = flags.active;
    if (flags.name !== undefined) body.name = flags.name;
    if (flags.description !== undefined) body.description = flags.description;
    if (flags.organizations !== undefined) body.organizations = splitCommaSeparated(flags.organizations);
    if (flags.roles !== undefined) body.roles = splitCommaSeparated(flags.roles);
    if (flags['role-tenant-filter'] !== undefined) body.roleTenantFilter = flags['role-tenant-filter'];
    if (flags['redirect-urls'] !== undefined) body.redirectUrls = splitCommaSeparated(flags['redirect-urls']);
    if (flags.scopes !== undefined) body.scopes = splitCommaSeparated(flags.scopes);
    if (flags['default-scopes'] !== undefined) body.defaultScopes = splitCommaSeparated(flags['default-scopes']);
    if (flags['version-control'] !== undefined) body.versionControl = splitCommaSeparated(flags['version-control']);
    if (flags['token-endpoint-auth-method'] !== undefined) {
      body.tokenEndpointAuthMethod = flags['token-endpoint-auth-method'];
    }
    if (flags['jwt-public-key'] !== undefined) body.jwtPublicKey = flags['jwt-public-key'].trim() || null;
    return body as APIClientUpdate;
  }
}
