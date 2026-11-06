/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Create an Account Manager API client for Commerce API (SCAPI Admin) access
 * on a user's behalf, as Business Manager's Storefronts setup does.
 *
 * @module clients/am-provisioning
 */
import {randomBytes} from 'node:crypto';
import {getLogger} from '../logging/logger.js';
import {AM_ROLE_COMMERCE_API, formatAccountManagerTenantFilter} from '../auth/account-manager-claims.js';
import {
  createApiClient,
  isValidRoleTenantFilter,
  type AccountManagerApiClient,
  type AccountManagerApiClientsClient,
  type APIClientCreate,
} from './am-api.js';

/** Account Manager's limits for an API client password. */
export const API_CLIENT_PASSWORD_MIN_LENGTH = 12;
export const API_CLIENT_PASSWORD_MAX_LENGTH = 128;

const PASSWORD_CLASSES = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '-_.~!@#%^*+='] as const;

function randomIndex(max: number): number {
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % max);
  for (;;) {
    const [byte] = randomBytes(1);
    if (byte < limit) return byte % max;
  }
}

/**
 * Generate an API client password (client secret). It has at least one
 * uppercase letter, lowercase letter, digit and symbol, which satisfies Account
 * Manager's rule of three of the four character classes, and is within its
 * 12–128 character limit.
 *
 * @param length - Password length (default 40; 12–128)
 */
export function generateApiClientPassword(length = 40): string {
  if (!Number.isInteger(length) || length < API_CLIENT_PASSWORD_MIN_LENGTH || length > API_CLIENT_PASSWORD_MAX_LENGTH) {
    throw new RangeError(
      `API client passwords must be ${API_CLIENT_PASSWORD_MIN_LENGTH}-${API_CLIENT_PASSWORD_MAX_LENGTH} characters.`,
    );
  }
  const all = PASSWORD_CLASSES.join('');
  const chars = PASSWORD_CLASSES.map((set) => set[randomIndex(set.length)]);
  while (chars.length < length) chars.push(all[randomIndex(all.length)]);
  // Fisher–Yates, so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Normalize a tenant ID for use in an API client role tenant filter:
 * `f_ecom_zzpq_013` and `zzpq-013` both become `zzpq_013`.
 */
export function normalizeTenantIdForFilter(tenantId: string): string {
  return tenantId
    .trim()
    .toLowerCase()
    .replace(/^f_ecom_/, '')
    .replaceAll('-', '_');
}

/**
 * Build the role tenant filter for a `SALESFORCE_COMMERCE_API` client scoped to
 * `tenants`, e.g. `SALESFORCE_COMMERCE_API:zzpq_013,zzpq_014`.
 *
 * @throws Error when `tenants` is empty or the result doesn't match `ROLE_TENANT_FILTER_PATTERN`
 */
export function buildCommerceApiRoleTenantFilter(tenants: readonly string[]): string {
  const normalized = [...new Set(tenants.map(normalizeTenantIdForFilter).filter(Boolean))];
  if (normalized.length === 0) throw new Error('At least one tenant is required.');
  const filter = formatAccountManagerTenantFilter({[AM_ROLE_COMMERCE_API]: normalized});
  if (!isValidRoleTenantFilter(filter)) {
    throw new Error(`Invalid tenant IDs for a role tenant filter: ${normalized.join(', ')}`);
  }
  return filter;
}

/** Options for {@link buildCommerceApiClientRequest} and {@link provisionCommerceApiClient}. */
export interface CommerceApiClientOptions {
  /** API client name shown in Account Manager. */
  name: string;
  /** Account Manager organization ID the client belongs to. */
  organizationId: string;
  /** Tenants the client may access through SCAPI (e.g. `zzpq_013` or `f_ecom_zzpq_013`). */
  tenants: readonly string[];
  /**
   * OAuth scopes the client may request (e.g. `sfcc.products`, `sfcc.catalogs`).
   * They are also set as the client's default scopes.
   */
  scopes: readonly string[];
  /** Optional description shown in Account Manager. */
  description?: string;
  /** How the client authenticates at the token endpoint. Default `client_secret_post`. */
  tokenEndpointAuthMethod?: 'client_secret_basic' | 'client_secret_post';
  /** Client password (secret). Default: {@link generateApiClientPassword}. */
  password?: string;
  /** Create the client enabled. Default `true`. */
  active?: boolean;
}

/**
 * Build the Account Manager create request for a Commerce API client:
 * the `SALESFORCE_COMMERCE_API` role scoped to `tenants`, the given scopes as
 * allowed and default scopes, and a generated password unless one is passed.
 */
export function buildCommerceApiClientRequest(options: CommerceApiClientOptions): APIClientCreate {
  const name = options.name.trim();
  if (!name) throw new Error('API client name is required.');
  if (name.length > 200) throw new Error('API client name must be at most 200 characters.');
  if (!options.organizationId.trim()) throw new Error('Organization ID is required.');
  const password = options.password ?? generateApiClientPassword();
  if (password.length < API_CLIENT_PASSWORD_MIN_LENGTH || password.length > API_CLIENT_PASSWORD_MAX_LENGTH) {
    throw new Error(
      `API client password must be ${API_CLIENT_PASSWORD_MIN_LENGTH}-${API_CLIENT_PASSWORD_MAX_LENGTH} characters.`,
    );
  }
  const scopes = [...new Set(options.scopes.map((scope) => scope.trim()).filter(Boolean))];
  const body: APIClientCreate = {
    name,
    organizations: [options.organizationId.trim()],
    password,
    active: options.active ?? true,
    roles: [AM_ROLE_COMMERCE_API],
    roleTenantFilter: buildCommerceApiRoleTenantFilter(options.tenants),
    scopes,
    defaultScopes: scopes,
    tokenEndpointAuthMethod: options.tokenEndpointAuthMethod ?? 'client_secret_post',
  };
  const description = options.description?.trim();
  if (description) body.description = description;
  return body;
}

/** Result of {@link provisionCommerceApiClient}. */
export interface ProvisionedCommerceApiClient {
  /** The new client's ID. */
  clientId: string;
  /** The client secret. Returned once; store it securely and never log it. */
  clientSecret: string;
  /** The client as Account Manager returned it (no secret). */
  apiClient: AccountManagerApiClient;
}

/**
 * Create an Account Manager API client for Commerce API (SCAPI Admin) access,
 * scoped to the given tenants, and return its ID and secret.
 *
 * The caller needs the Account Administrator or API Administrator role (see
 * `isAccountManagerApiClientAdmin`), but Account Manager's response is
 * authoritative. A newly created client can take a short time before its
 * credentials work.
 *
 * @throws NotPermittedError when Account Manager refuses the request (401/403)
 *
 * @example
 * ```typescript
 * import {createAccountManagerApiClientsClient, provisionCommerceApiClient} from '@salesforce/b2c-tooling-sdk/clients';
 *
 * const apiClients = createAccountManagerApiClientsClient({hostname}, userAuth);
 * const {clientId, clientSecret} = await provisionCommerceApiClient(apiClients, {
 *   name: 'My App – jane@example.com – 2026-11-06',
 *   organizationId,
 *   tenants: ['zzpq_013'],
 *   scopes: ['sfcc.products', 'sfcc.catalogs'],
 * });
 * ```
 */
export async function provisionCommerceApiClient(
  client: AccountManagerApiClientsClient,
  options: CommerceApiClientOptions,
): Promise<ProvisionedCommerceApiClient> {
  const body = buildCommerceApiClientRequest(options);
  const logger = getLogger();
  logger.debug(
    {name: body.name, organizations: body.organizations, roleTenantFilter: body.roleTenantFilter, scopes: body.scopes},
    '[AM] Provisioning Commerce API client',
  );
  const apiClient = await createApiClient(client, body);
  if (!apiClient.id) throw new Error('Account Manager did not return the new API client ID.');
  logger.debug({clientId: apiClient.id}, '[AM] Provisioned Commerce API client');
  return {clientId: apiClient.id, clientSecret: body.password, apiClient};
}
