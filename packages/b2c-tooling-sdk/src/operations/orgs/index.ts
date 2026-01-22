/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager organization management operations.
 *
 * This module provides high-level functions for managing organizations in Account Manager,
 * including retrieving organization details and audit logs.
 *
 * ## Core Organization Functions
 *
 * - {@link getOrg} - Get organization details by ID
 * - {@link getOrgByName} - Get organization details by name
 * - {@link listOrgs} - List organizations with pagination
 * - {@link getOrgAuditLogs} - Get audit logs for an organization
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   getOrg,
 *   getOrgByName,
 *   listOrgs,
 *   getOrgAuditLogs,
 * } from '@salesforce/b2c-tooling-sdk/operations/orgs';
 * import {createAccountManagerOrgsClient} from '@salesforce/b2c-tooling-sdk/clients';
 * import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerOrgsClient({}, auth);
 *
 * // Get an organization by ID
 * const org = await getOrg(client, 'org-id');
 *
 * // Get an organization by name
 * const org = await getOrgByName(client, 'My Organization');
 *
 * // List organizations
 * const orgs = await listOrgs(client, {size: 25, page: 0});
 *
 * // Get audit logs
 * const logs = await getOrgAuditLogs(client, 'org-id');
 * ```
 *
 * ## Authentication
 *
 * Organization operations require OAuth authentication with appropriate Account Manager permissions.
 *
 * @module operations/orgs
 */
import type {
  AccountManagerOrgsClient,
  AccountManagerOrganization,
  OrganizationCollection,
  AuditLogCollection,
  ListOrgsOptions,
} from '../../clients/am-orgs-api.js';

// Re-export types
export type {
  AccountManagerOrgsClient,
  AccountManagerOrganization,
  OrganizationCollection,
  AuditLogCollection,
  ListOrgsOptions,
} from '../../clients/am-orgs-api.js';

/**
 * Gets an organization by ID.
 *
 * @param client - Account Manager Organizations client
 * @param orgId - Organization ID
 * @returns Organization details
 * @throws Error if organization is not found
 */
export async function getOrg(client: AccountManagerOrgsClient, orgId: string): Promise<AccountManagerOrganization> {
  return client.getOrg(orgId);
}

/**
 * Gets an organization by name (searches for exact or partial match).
 *
 * @param client - Account Manager Organizations client
 * @param name - Organization name
 * @returns Organization details
 * @throws Error if organization is not found or ambiguous
 */
export async function getOrgByName(
  client: AccountManagerOrgsClient,
  name: string,
): Promise<AccountManagerOrganization> {
  return client.getOrgByName(name);
}

/**
 * Lists organizations with pagination.
 *
 * @param client - Account Manager Organizations client
 * @param options - List options (size, page, all)
 * @returns Organization collection
 */
export async function listOrgs(
  client: AccountManagerOrgsClient,
  options?: ListOrgsOptions,
): Promise<OrganizationCollection> {
  return client.listOrgs(options);
}

/**
 * Gets audit logs for an organization.
 *
 * @param client - Account Manager Organizations client
 * @param orgId - Organization ID
 * @returns Audit log collection
 */
export async function getOrgAuditLogs(client: AccountManagerOrgsClient, orgId: string): Promise<AuditLogCollection> {
  return client.getOrgAuditLogs(orgId);
}
