/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Business Manager user operations for B2C Commerce instances.
 *
 * Provides functions for querying and managing instance-level users via OCAPI Data API.
 *
 * Note: Most production B2C Commerce instances delegate user identity to Account Manager
 * (SSO), so creating local Business Manager users via the Data API typically fails with
 * `LocalUserCreationException`. These operations focus on read/search/lifecycle of
 * AM-managed users plus access-key administration.
 */
import type {B2CInstance} from '../../instance/index.js';
import type {components} from '../../clients/ocapi.generated.js';
import {throwOcapiError} from '../../clients/error-utils.js';
import {SCAPI_MERCHANT_USERS_READ_SCOPES, SCAPI_MERCHANT_USERS_RW_SCOPES} from '../../clients/scapi-merchant-users.js';

// SCAPI Merchant Users scopes named in the OCAPI-deprecation message for the
// dual-backend operations (list/get/update/delete). search, whoami, and the
// access-key operations are OCAPI-only and use the generic guidance.
const USERS_READ_SCOPES = [...SCAPI_MERCHANT_USERS_READ_SCOPES, ...SCAPI_MERCHANT_USERS_RW_SCOPES];
const USERS_RW_SCOPES = SCAPI_MERCHANT_USERS_RW_SCOPES;

/**
 * BM user from OCAPI.
 */
export type BmUser = components['schemas']['user'];

/**
 * BM users collection from OCAPI.
 */
export type BmUsers = components['schemas']['users'];

/**
 * BM user search result from OCAPI.
 */
export type BmUserSearchResult = components['schemas']['user_search_result'];

/**
 * Access key details for an externally-managed user.
 */
export type BmAccessKeyDetails = components['schemas']['access_key_details'];

/**
 * Valid access-key scopes accepted by the Data API
 * `/users/{login}/access_key/{scope}` endpoints.
 */
export const ACCESS_KEY_SCOPES = ['WEBDAV_AND_STUDIO', 'AGENT_USER_AND_OCAPI', 'STOREFRONT'] as const;

/**
 * Access-key scope. One of {@link ACCESS_KEY_SCOPES}.
 */
export type AccessKeyScope = (typeof ACCESS_KEY_SCOPES)[number];

/**
 * Updatable user fields for `patch` operations.
 *
 * Note: `locked` and `password` cannot be modified via PATCH per the API spec.
 */
export interface UpdateBmUserChanges {
  disabled?: boolean;
  email?: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  preferred_data_locale?: string;
  preferred_ui_locale?: string;
}

/**
 * Options for listing BM users.
 */
export interface ListBmUsersOptions {
  /** Start index (default 0) */
  start?: number;
  /** Number of items to return (default 25) */
  count?: number;
  /** Property selector (default returns shallow user fields) */
  select?: string;
}

/**
 * Options for searching BM users.
 *
 * Searchable fields per the Data API spec: login, email, first_name, last_name,
 * external_id, last_login_date, is_locked, is_disabled.
 */
export interface SearchBmUsersOptions {
  /**
   * Pre-built OCAPI query object (e.g. `{text_query: {fields: ['login'], search_phrase: 'foo'}}`).
   * If omitted, one is built from the convenience flags below.
   */
  query?: unknown;
  /** Free-text phrase searched across login/email/first_name/last_name */
  searchPhrase?: string;
  /** Match users with a specific login */
  login?: string;
  /** Match users with a specific email */
  email?: string;
  /** Match locked users */
  locked?: boolean;
  /** Match disabled users */
  disabled?: boolean;
  /** Field to sort by (e.g. 'login', 'email', 'last_login_date') */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Start index (default 0) */
  start?: number;
  /** Number of items to return (default 25) */
  count?: number;
  /** Property selector (default returns shallow user fields) */
  select?: string;
}

/**
 * Lists all users on a B2C Commerce instance.
 *
 * @param instance - B2C instance to query
 * @param options - Pagination options
 * @returns Users collection with pagination info
 */
export async function listBmUsers(instance: B2CInstance, options: ListBmUsersOptions = {}): Promise<BmUsers> {
  const {start, count, select} = options;

  const {data, error, response} = await instance.ocapi.GET('/users', {
    params: {query: {start, count, select: select ?? '(**)'}},
  });

  if (error) {
    throwOcapiError(error, response, 'Failed to list users', USERS_READ_SCOPES);
  }

  return data as BmUsers;
}

/**
 * Gets a single user by login (email).
 *
 * @param instance - B2C instance
 * @param login - User login
 * @returns User details
 */
export async function getBmUser(instance: B2CInstance, login: string): Promise<BmUser> {
  const {data, error, response} = await instance.ocapi.GET('/users/{login}', {
    params: {path: {login}},
  });

  if (error) {
    throwOcapiError(error, response, `Failed to get user ${login}`, USERS_READ_SCOPES);
  }

  return data as BmUser;
}

/**
 * Returns details for the currently authenticated user (the user the OAuth token resolves to).
 *
 * Useful for verifying which BM identity is in use on an instance.
 *
 * @param instance - B2C instance
 * @returns Current user details (includes password expiration info)
 */
export async function whoamiBmUser(instance: B2CInstance): Promise<BmUser> {
  const {data, error, response} = await instance.ocapi.GET('/users/this');

  if (error) {
    throwOcapiError(error, response, 'Failed to get current user');
  }

  return data as BmUser;
}

/**
 * Updates an existing user. The `locked` flag and the user `password` cannot be updated
 * with this resource.
 *
 * @param instance - B2C instance
 * @param login - User login
 * @param changes - Fields to update
 * @returns Updated user
 */
export async function updateBmUser(
  instance: B2CInstance,
  login: string,
  changes: UpdateBmUserChanges,
): Promise<BmUser> {
  const {data, error, response} = await instance.ocapi.PATCH('/users/{login}', {
    params: {path: {login}},
    body: changes as components['schemas']['user'],
  });

  if (error) {
    throwOcapiError(error, response, `Failed to update user ${login}`, USERS_RW_SCOPES);
  }

  return data as BmUser;
}

/**
 * Deletes a user from an instance.
 *
 * @param instance - B2C instance
 * @param login - User login
 */
export async function deleteBmUser(instance: B2CInstance, login: string): Promise<void> {
  const {error, response} = await instance.ocapi.DELETE('/users/{login}', {
    params: {path: {login}},
  });

  if (error) {
    throwOcapiError(error, response, `Failed to delete user ${login}`, USERS_RW_SCOPES);
  }
}

/**
 * Searches users on an instance.
 *
 * Supports either a fully-formed OCAPI query (`options.query`) or convenience flags
 * (`searchPhrase`, `login`, `email`, `locked`, `disabled`) which are combined into a
 * `bool_query`. If no criteria are provided a `match_all_query` is used.
 *
 * @param instance - B2C instance
 * @param options - Search options
 * @returns User search result
 */
export async function searchBmUsers(
  instance: B2CInstance,
  options: SearchBmUsersOptions = {},
): Promise<BmUserSearchResult> {
  const {
    query: providedQuery,
    searchPhrase,
    login,
    email,
    locked,
    disabled,
    sortBy,
    sortOrder,
    start,
    count,
    select,
  } = options;

  let query: unknown = providedQuery;
  if (!query) {
    const queries: unknown[] = [];

    if (searchPhrase) {
      queries.push({
        text_query: {
          fields: ['login', 'email', 'first_name', 'last_name'],
          search_phrase: searchPhrase,
        },
      });
    }
    if (login) {
      queries.push({term_query: {fields: ['login'], operator: 'is', values: [login]}});
    }
    if (email) {
      queries.push({term_query: {fields: ['email'], operator: 'is', values: [email]}});
    }
    if (locked !== undefined) {
      queries.push({term_query: {fields: ['is_locked'], operator: 'is', values: [locked]}});
    }
    if (disabled !== undefined) {
      queries.push({term_query: {fields: ['is_disabled'], operator: 'is', values: [disabled]}});
    }

    if (queries.length === 0) {
      query = {match_all_query: {}};
    } else if (queries.length === 1) {
      query = queries[0];
    } else {
      query = {bool_query: {must: queries}};
    }
  }

  const sorts = sortBy ? [{field: sortBy, sort_order: sortOrder ?? 'asc'}] : undefined;

  const {data, error, response} = await instance.ocapi.POST('/user_search', {
    body: {
      query,
      start,
      count,
      sorts,
      select: select ?? '(**)',
    } as unknown as components['schemas']['search_request'],
  });

  if (error) {
    throwOcapiError(error, response, 'Failed to search users');
  }

  return data as BmUserSearchResult;
}

/**
 * Gets a single access key for an externally-managed user.
 *
 * @param instance - B2C instance
 * @param login - User login
 * @param scope - Access key scope (one of {@link ACCESS_KEY_SCOPES})
 * @returns Access key details
 */
export async function getBmUserAccessKey(
  instance: B2CInstance,
  login: string,
  scope: string,
): Promise<BmAccessKeyDetails> {
  const {data, error, response} = await instance.ocapi.GET('/users/{login}/access_key/{scope}', {
    params: {path: {login, scope}},
  });

  if (error) {
    throwOcapiError(error, response, `Failed to get access key (${scope}) for ${login}`);
  }

  return data as BmAccessKeyDetails;
}

/**
 * Creates a single access key for an externally-managed user (replaces any existing key
 * for the same scope).
 *
 * The returned object includes the newly-generated `access_key` value — this is the only
 * time it is returned, so callers should record it.
 *
 * @param instance - B2C instance
 * @param login - User login
 * @param scope - Access key scope
 * @returns Access key details (including the secret `access_key` value)
 */
export async function createBmUserAccessKey(
  instance: B2CInstance,
  login: string,
  scope: string,
): Promise<BmAccessKeyDetails> {
  const {data, error, response} = await instance.ocapi.PUT('/users/{login}/access_key/{scope}', {
    params: {path: {login, scope}},
  });

  if (error) {
    throwOcapiError(error, response, `Failed to create access key (${scope}) for ${login}`);
  }

  return data as BmAccessKeyDetails;
}

/**
 * Enables or disables an existing access key for an externally-managed user.
 *
 * @param instance - B2C instance
 * @param login - User login
 * @param scope - Access key scope
 * @param enabled - Whether the access key should be enabled
 * @returns Updated access key details
 */
export async function setBmUserAccessKeyEnabled(
  instance: B2CInstance,
  login: string,
  scope: string,
  enabled: boolean,
): Promise<BmAccessKeyDetails> {
  const {data, error, response} = await instance.ocapi.PATCH('/users/{login}/access_key/{scope}', {
    params: {path: {login, scope}},
    body: {enabled} as components['schemas']['access_key_update_request'],
  });

  if (error) {
    throwOcapiError(error, response, `Failed to update access key (${scope}) for ${login}`);
  }

  return data as BmAccessKeyDetails;
}

/**
 * Deletes a single access key for an externally-managed user.
 *
 * @param instance - B2C instance
 * @param login - User login
 * @param scope - Access key scope
 */
export async function deleteBmUserAccessKey(instance: B2CInstance, login: string, scope: string): Promise<void> {
  const {error, response} = await instance.ocapi.DELETE('/users/{login}/access_key/{scope}', {
    params: {path: {login, scope}},
  });

  if (error) {
    throwOcapiError(error, response, `Failed to delete access key (${scope}) for ${login}`);
  }
}
