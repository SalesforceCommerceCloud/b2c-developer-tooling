/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager Organizations API client for B2C Commerce.
 *
 * Provides a client for the Account Manager Organizations REST API using
 * fetch with OAuth authentication middleware. Used for managing
 * organizations in Account Manager.
 *
 * @module clients/am-orgs-api
 */
import type {AuthStrategy} from '../auth/types.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {getLogger} from '../logging/logger.js';

/**
 * Account Manager Organization type.
 */
export interface AccountManagerOrganization {
  id: string;
  name: string;
  realms: string[];
  twoFARoles: string[];
  twoFAEnabled: boolean;
  allowedVerifierTypes: string[];
  vaasEnabled: boolean;
  sfIdentityFederation: boolean;
  [key: string]: unknown;
}

/**
 * Account Manager Organization collection response.
 */
export interface OrganizationCollection {
  content: AccountManagerOrganization[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  [key: string]: unknown;
}

/**
 * Account Manager audit log record.
 */
export interface AuditLogRecord {
  timestamp: string;
  authorDisplayName: string;
  authorEmail?: string;
  eventType: string;
  eventMessage: string;
  [key: string]: unknown;
}

/**
 * Audit log collection response.
 */
export interface AuditLogCollection {
  content: AuditLogRecord[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  [key: string]: unknown;
}

/**
 * Options for listing organizations.
 */
export interface ListOrgsOptions {
  /** Page size (default: 25, max: 5000) */
  size?: number;
  /** Page number (0-based, default: 0) */
  page?: number;
  /** Return all orgs (uses max page size of 5000) */
  all?: boolean;
}

/**
 * Transforms the API organization representation to an external format.
 * Removes internal properties like 'links' that should not be exposed.
 *
 * @param org - The original organization object
 * @returns The transformed organization object
 */
function toExternalOrg(org: AccountManagerOrganization): AccountManagerOrganization {
  // Create a copy to avoid mutating the original
  const transformed = {...org};
  // Always delete the links property
  delete transformed.links;
  return transformed;
}

/**
 * Configuration for creating an Account Manager Organizations client.
 */
export interface AccountManagerOrgsClientConfig {
  /**
   * Account Manager hostname.
   * Defaults to: account.demandware.com
   */
  hostname?: string;
}

/**
 * Account Manager Organizations API client.
 */
export interface AccountManagerOrgsClient {
  /**
   * Get organization by ID.
   */
  getOrg(orgId: string): Promise<AccountManagerOrganization>;

  /**
   * Get organization by name (searches for exact or partial match).
   */
  getOrgByName(name: string): Promise<AccountManagerOrganization>;

  /**
   * List organizations with pagination.
   */
  listOrgs(options?: ListOrgsOptions): Promise<OrganizationCollection>;

  /**
   * Get audit logs for an organization.
   */
  getOrgAuditLogs(orgId: string): Promise<AuditLogCollection>;
}

/**
 * Creates an Account Manager Organizations API client.
 *
 * @param config - Account Manager client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Organizations API client
 *
 * @example
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerOrgsClient({}, oauthStrategy);
 *
 * // List organizations
 * const orgs = await client.listOrgs({ size: 25, page: 0 });
 *
 * // Get organization by ID
 * const org = await client.getOrg('org-id');
 */
export function createAccountManagerOrgsClient(
  config: AccountManagerOrgsClientConfig,
  auth: AuthStrategy,
): AccountManagerOrgsClient {
  const hostname = config.hostname ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  const baseUrl = `https://${hostname}/dw/rest/v1`;
  const logger = getLogger();

  /**
   * Makes an authenticated request to the Account Manager API.
   */
  async function makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers = new Headers(options.headers);

    // Add authentication header
    if (auth.getAuthorizationHeader) {
      const authHeader = await auth.getAuthorizationHeader();
      headers.set('Authorization', authHeader);
    }

    logger.trace({url, method: options.method || 'GET'}, '[AM-ORGS] Making request');

    const response = await fetch(url, {
      ...options,
      headers,
    });

    logger.trace({url, status: response.status, statusText: response.statusText}, '[AM-ORGS] Received response');

    // Handle errors
    if (response.status === 401) {
      throw new Error('Authentication invalid. Please (re-)authenticate.');
    }
    if (response.status === 403) {
      throw new Error('Operation forbidden. Please make sure you have the permission to perform this operation.');
    }
    if (response.status >= 400) {
      throw new Error(`Operation failed. Error code ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    async getOrg(orgId: string): Promise<AccountManagerOrganization> {
      logger.debug({orgId}, '[AM-ORGS] Getting organization by ID');
      try {
        const org = await makeRequest<AccountManagerOrganization>(`/organizations/${orgId}`);
        return toExternalOrg(org);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Error code 404')) {
          throw new Error(`Organization ${orgId} not found`);
        }
        throw error;
      }
    },

    async getOrgByName(name: string): Promise<AccountManagerOrganization> {
      logger.debug({name}, '[AM-ORGS] Getting organization by name');
      const encodedName = encodeURIComponent(name);
      let result: OrganizationCollection;
      try {
        result = await makeRequest<OrganizationCollection>(
          `/organizations/search/findByName?startsWith=${encodedName}&ignoreCase=false`,
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('Error code 404')) {
          throw new Error(`Organization ${name} not found`);
        }
        throw error;
      }

      if (result.content.length === 0) {
        throw new Error(`Organization ${name} not found`);
      }

      if (result.content.length > 1) {
        // Attempt to find exact match
        const exactMatch = result.content.find((org) => org.name === name);
        if (exactMatch) {
          return toExternalOrg(exactMatch);
        }
        throw new Error(`Organization name "${name}" is ambiguous. Multiple organizations found.`);
      }

      return toExternalOrg(result.content[0]);
    },

    async listOrgs(options: ListOrgsOptions = {}): Promise<OrganizationCollection> {
      const {size = 25, page = 0, all = false} = options;
      const pageSize = all ? 5000 : size;

      logger.debug({size: pageSize, page}, '[AM-ORGS] Listing organizations');

      const result = await makeRequest<OrganizationCollection>(`/organizations?page=${page}&size=${pageSize}`);

      // Remove links from all organizations in the collection
      return {
        ...result,
        content: result.content.map((org) => toExternalOrg(org)),
      };
    },

    async getOrgAuditLogs(orgId: string): Promise<AuditLogCollection> {
      logger.debug({orgId}, '[AM-ORGS] Getting audit logs for organization');
      const logs = await makeRequest<AuditLogCollection>(`/organizations/${orgId}/audit-log-records`);
      return logs;
    },
  };
}
