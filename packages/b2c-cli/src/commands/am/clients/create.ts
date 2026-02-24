/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isValidRoleTenantFilter, type AccountManagerApiClient, type APIClientCreate} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';
import {resolveOrgId} from '../../../utils/am/resolve-org.js';

function splitCommaSeparated(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Command to create an Account Manager API client.
 */
export default class ClientCreate extends AmCommand<typeof ClientCreate> {
  static description = t('commands.client.create.description', 'Create an Account Manager API client');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --name my-client --orgs org-id-1 --password "SecureP@ss123"',
    '<%= config.bin %> <%= command.id %> --name my-client --orgs "My Organization" --password "SecureP@ss123" --roles SALESFORCE_COMMERCE_API',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'API client name',
      required: true,
    }),
    description: Flags.string({
      description: 'Description of the API client',
    }),
    orgs: Flags.string({
      char: 'o',
      description: 'Comma-separated organization IDs or names',
      required: true,
    }),
    password: Flags.string({
      char: 'p',
      description: 'Password for the API client (12–128 characters)',
      required: true,
    }),
    roles: Flags.string({
      char: 'r',
      description: 'Comma-separated role IDs (e.g. SALESFORCE_COMMERCE_API)',
    }),
    'role-tenant-filter': Flags.string({
      description:
        'Role tenant filter (format: ROLE:realm_instance,realm_instance;ROLE2:... e.g. SALESFORCE_COMMERCE_API:abcd_prd)',
    }),
    active: Flags.boolean({
      description: 'Create as active (default: false)',
      default: false,
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
    const flags = this.flags;
    const nameTrimmed = flags.name.trim();
    const orgInputs = splitCommaSeparated(flags.orgs);

    this.validateCreateInput(flags, nameTrimmed, orgInputs);

    const orgIds = await Promise.all(orgInputs.map((o) => resolveOrgId(this.accountManagerClient, o)));

    const body = this.buildCreateBody(flags, nameTrimmed, orgIds);

    this.log(t('commands.client.create.creating', 'Creating API client {{name}}...', {name: flags.name}));

    const client = await this.accountManagerClient.createApiClient(body);

    this.log(
      t('commands.client.create.success', 'API client {{name}} created successfully.', {
        name: client.name ?? flags.name,
      }),
    );

    return client;
  }

  private buildCreateBody(
    flags: typeof ClientCreate.prototype.flags,
    nameTrimmed: string,
    orgIds: string[],
  ): APIClientCreate {
    const body: APIClientCreate = {
      name: nameTrimmed,
      organizations: orgIds,
      password: flags.password,
      active: flags.active,
    };
    if (flags.description !== undefined && flags.description.trim().length > 0) {
      body.description = flags.description.trim();
    }
    if (flags.roles) {
      body.roles = splitCommaSeparated(flags.roles);
    }
    const rtf = flags['role-tenant-filter'];
    if (rtf !== undefined && rtf.trim().length > 0) {
      body.roleTenantFilter = rtf.trim();
    }
    if (flags['redirect-urls']) {
      body.redirectUrls = splitCommaSeparated(flags['redirect-urls']);
    }
    if (flags.scopes) {
      body.scopes = splitCommaSeparated(flags.scopes);
    }
    if (flags['default-scopes']) {
      body.defaultScopes = splitCommaSeparated(flags['default-scopes']);
    }
    if (flags['version-control']) {
      body.versionControl = splitCommaSeparated(flags['version-control']);
    }
    if (flags['token-endpoint-auth-method']) {
      body.tokenEndpointAuthMethod = flags['token-endpoint-auth-method'] as APIClientCreate['tokenEndpointAuthMethod'];
    }
    if (flags['jwt-public-key'] !== undefined) {
      body.jwtPublicKey = flags['jwt-public-key'].trim().length > 0 ? flags['jwt-public-key'].trim() : null;
    }
    return body;
  }

  private validateCreateInput(flags: typeof ClientCreate.prototype.flags, nameTrimmed: string, orgIds: string[]): void {
    if (nameTrimmed.length === 0) {
      this.error(t('commands.client.create.nameRequired', 'API client name cannot be empty'));
    }
    if (nameTrimmed.length > 200) {
      this.error(
        t('commands.client.create.nameMaxLength', 'Name must be at most 200 characters (received {{length}})', {
          length: nameTrimmed.length,
        }),
      );
    }
    if (flags.description !== undefined && flags.description.length > 256) {
      this.error(
        t(
          'commands.client.create.descriptionMaxLength',
          'Description must be at most 256 characters (received {{length}})',
          {length: flags.description.length},
        ),
      );
    }
    if (flags.password.length < 12) {
      this.error(
        t('commands.client.create.passwordMinLength', 'Password must be at least 12 characters (API requirement)'),
      );
    }
    if (flags.password.length > 128) {
      this.error(
        t('commands.client.create.passwordMaxLength', 'Password must be at most 128 characters (received {{length}})', {
          length: flags.password.length,
        }),
      );
    }
    const rtf = flags['role-tenant-filter'];
    if (rtf !== undefined && rtf.length > 0 && !isValidRoleTenantFilter(rtf)) {
      this.error(
        t(
          'commands.client.create.invalidRoleTenantFilter',
          'Role tenant filter must match pattern: ROLE:realm_instance(,realm_instance)*(;ROLE:...)* (e.g. SALESFORCE_COMMERCE_API:abcd_prd)',
        ),
      );
    }
    if (orgIds.length === 0) {
      this.error(t('commands.client.create.noOrgs', 'At least one organization is required'));
    }
  }
}
