/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Read identity, roles and tenant access from an Account Manager access token.
 *
 * Account Manager includes the `roles` and `tenantFilter` claims when the token
 * is requested with the `roles` and `tenantFilter` scopes (the SDK's default
 * user sign-in requests both). The helpers here only decode the token; they do
 * not verify its signature. Treat the result as a hint for UI and setup
 * decisions, and let the API you call be the authority.
 *
 * @module auth/account-manager-claims
 */
import {decodeJWT} from './oauth.js';
import {extractJwtScopes} from './jwt-utils.js';

/** Account Manager role enum name for Account Administrator. */
export const AM_ROLE_ACCOUNT_ADMIN = 'AM_ACCOUNT_ADMIN';
/** Account Manager role enum name for API Administrator. */
export const AM_ROLE_API_ADMIN = 'AM_API_ADMIN';
/** Account Manager role enum name for User Administrator. */
export const AM_ROLE_USER_ADMIN = 'AM_USER_ADMIN';
/** Account Manager role enum name for the API client role that grants SCAPI Admin access. */
export const AM_ROLE_COMMERCE_API = 'SALESFORCE_COMMERCE_API';

/**
 * Display names for common Account Manager role enum names, as shown in the
 * Account Manager UI. For the complete, current list, use `fetchRoleMapping`
 * from `@salesforce/b2c-tooling-sdk/clients`.
 */
export const ACCOUNT_MANAGER_ROLE_DISPLAY_NAMES: Readonly<Record<string, string>> = Object.freeze({
  AM_ACCOUNT_ADMIN: 'Account Administrator',
  AM_API_ADMIN: 'API Administrator',
  AM_USER_ADMIN: 'User Administrator',
  ECOM_ADMIN: 'Business Manager Administrator',
  ECOM_USER: 'Business Manager User',
  CCDX_SBX_USER: 'Sandbox API User',
  SANDBOX_API_CLIENT: 'Sandbox API Client',
  SALESFORCE_COMMERCE_API: 'Salesforce Commerce API',
  SLAS_ORGANIZATION_ADMIN: 'SLAS Organization Administrator',
  CRM_ORG_ADMIN: 'Managed Runtime Admin',
  CRM_ORG_USER: 'Managed Runtime User',
});

/** Account Manager roles that can create and manage API clients. */
export const ACCOUNT_MANAGER_API_CLIENT_ADMIN_ROLES: readonly string[] = Object.freeze([
  AM_ROLE_ACCOUNT_ADMIN,
  AM_ROLE_API_ADMIN,
]);

/**
 * Claims read from an Account Manager access token.
 */
export interface AccountManagerClaims {
  /** Subject: the user's login for user tokens, the client ID for client tokens. */
  sub?: string;
  /** Client the token was issued to (`client_id`, falling back to `azp`). */
  clientId?: string;
  /**
   * OAuth grant that produced the token, such as `authorization_code` (user
   * sign-in), `implicit`, `client_credentials` or
   * `urn:ietf:params:oauth:grant-type:jwt-bearer`.
   */
  grantType?: string;
  /**
   * Whether the token represents a signed-in user rather than an API client.
   * `undefined` when the grant type is missing or unrecognized.
   */
  isUser?: boolean;
  /** Issuer URL. */
  issuer?: string;
  /** Expiry, from the `exp` claim. */
  expires?: Date;
  /** Granted OAuth scopes. */
  scopes: string[];
  /** Account Manager role enum names (e.g. `AM_ACCOUNT_ADMIN`). Empty when the `roles` scope wasn't granted. */
  roles: string[];
  /**
   * Tenants per role, parsed from `tenantFilter` (`ROLE:tenant1,tenant2;ROLE2:tenant3`).
   * Global roles that aren't tenant-scoped don't appear here.
   */
  tenantFilter: Record<string, string[]>;
  /** Every tenant that appears in `tenantFilter`, de-duplicated and sorted. */
  tenants: string[];
}

const USER_GRANT_TYPES = new Set(['authorization_code', 'implicit', 'refresh_token', 'password']);
const CLIENT_GRANT_TYPES = new Set(['client_credentials', 'urn:ietf:params:oauth:grant-type:jwt-bearer']);

/**
 * Parse an Account Manager tenant filter string (`ROLE:t1,t2;ROLE2:t3`) into a
 * role → tenants map. Whitespace and empty segments are ignored; a role that
 * appears more than once has its tenants merged.
 */
export function parseAccountManagerTenantFilter(tenantFilter: string | undefined | null): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!tenantFilter) return result;
  for (const segment of tenantFilter.split(';')) {
    const separator = segment.indexOf(':');
    if (separator <= 0) continue;
    const role = segment.slice(0, separator).trim();
    if (!role) continue;
    const tenants = segment
      .slice(separator + 1)
      .split(',')
      .map((tenant) => tenant.trim())
      .filter(Boolean);
    const existing = result[role] ?? [];
    result[role] = [...new Set([...existing, ...tenants])];
  }
  return result;
}

/**
 * Format a role → tenants map as an Account Manager tenant filter string
 * (`ROLE:t1,t2;ROLE2:t3`). Roles with no tenants are omitted.
 */
export function formatAccountManagerTenantFilter(filter: Record<string, readonly string[]>): string {
  return Object.entries(filter)
    .filter(([, tenants]) => tenants.length > 0)
    .map(([role, tenants]) => `${role}:${tenants.join(',')}`)
    .join(';');
}

function stringClaim(payload: Record<string, unknown>, name: string): string | undefined {
  const value = payload[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  if (typeof value === 'string') return value.split(/[\s,]+/).filter(Boolean);
  return [];
}

/**
 * Read identity, roles and tenants from an already-decoded JWT payload.
 * See {@link readAccountManagerClaims}.
 */
export function accountManagerClaimsFromPayload(payload: Record<string, unknown>): AccountManagerClaims {
  const grantType = stringClaim(payload, 'grant_type');
  const tenantFilter = parseAccountManagerTenantFilter(stringClaim(payload, 'tenantFilter'));
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
  return {
    sub: stringClaim(payload, 'sub'),
    clientId: stringClaim(payload, 'client_id') ?? stringClaim(payload, 'azp'),
    grantType,
    isUser: grantType
      ? USER_GRANT_TYPES.has(grantType)
        ? true
        : CLIENT_GRANT_TYPES.has(grantType)
          ? false
          : undefined
      : undefined,
    issuer: stringClaim(payload, 'iss'),
    expires: exp === undefined ? undefined : new Date(exp * 1000),
    scopes: extractJwtScopes(payload),
    roles: stringList(payload.roles),
    tenantFilter,
    tenants: [...new Set(Object.values(tenantFilter).flat())].sort(),
  };
}

/**
 * Decode an Account Manager access token and read its identity, roles and
 * tenant filter.
 *
 * This only decodes the token; the signature is not verified. Use the result as
 * a hint (for example, to decide whether to offer "Create an API client"), and
 * treat the API's response as authoritative.
 *
 * @param accessToken - Account Manager access token (JWT)
 * @throws Error if the token is not a decodable JWT
 *
 * @example
 * ```typescript
 * import {readAccountManagerClaims, isAccountManagerApiClientAdmin} from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const {accessToken} = await strategy.getTokenResponse();
 * const claims = readAccountManagerClaims(accessToken);
 * if (isAccountManagerApiClientAdmin(claims)) {
 *   // offer to create an API client, letting the user pick from claims.tenants
 * }
 * ```
 */
export function readAccountManagerClaims(accessToken: string): AccountManagerClaims {
  return accountManagerClaimsFromPayload(decodeJWT(accessToken).payload);
}

/** Whether the claims include an Account Manager role (by enum name, e.g. `AM_API_ADMIN`). */
export function hasAccountManagerRole(claims: Pick<AccountManagerClaims, 'roles'>, role: string): boolean {
  return claims.roles.includes(role);
}

/** Whether the claims include a role that can create and manage API clients (Account or API Administrator). */
export function isAccountManagerApiClientAdmin(claims: Pick<AccountManagerClaims, 'roles'>): boolean {
  return ACCOUNT_MANAGER_API_CLIENT_ADMIN_ROLES.some((role) => claims.roles.includes(role));
}

/** Tenants the claims grant for a role, from `tenantFilter`. Empty when the role isn't tenant-scoped or not held. */
export function getAccountManagerRoleTenants(
  claims: Pick<AccountManagerClaims, 'tenantFilter'>,
  role: string,
): string[] {
  return claims.tenantFilter[role] ?? [];
}

/**
 * Whether the claims grant a role on a tenant, according to `tenantFilter`.
 * Tenant IDs are compared case-insensitively, with `-` treated as `_`
 * (`zzpq-013` matches `zzpq_013`); the `f_ecom_` prefix is ignored.
 */
export function hasAccountManagerTenantRole(
  claims: Pick<AccountManagerClaims, 'tenantFilter'>,
  role: string,
  tenant: string,
): boolean {
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/^f_ecom_/, '')
      .replaceAll('-', '_');
  const wanted = normalize(tenant);
  return getAccountManagerRoleTenants(claims, role).some((item) => normalize(item) === wanted);
}

/** Display name for an Account Manager role enum name, falling back to the enum name itself. */
export function getAccountManagerRoleDisplayName(role: string): string {
  return ACCOUNT_MANAGER_ROLE_DISPLAY_NAMES[role] ?? role;
}
