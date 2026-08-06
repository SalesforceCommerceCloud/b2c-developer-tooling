/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Canonical types and backend interface for Business Manager user operations.
 *
 * Both the OCAPI Data API (`/users`) and the SCAPI Merchant Users API
 * (`merchant/users/v1`) manage instance-level users on a B2C Commerce
 * instance. We expose a single canonical shape (camelCase, matching SCAPI)
 * so command code is agnostic to which backend serves the request.
 *
 * @module operations/bm-users/types
 */
import type {BackendBase} from '../../clients/scapi-backend-utils.js';

/**
 * Canonical Business Manager user. CamelCase fields match SCAPI; OCAPI
 * mapping converts from snake_case.
 */
export interface UserInfo {
  login: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  disabled?: boolean;
  locked?: boolean;
  lastLoginDate?: string;
  passwordExpirationDate?: string;
  passwordModificationDate?: string;
  preferredDataLocale?: string;
  preferredUiLocale?: string;
  roles?: string[];
  /** Original backend response, for advanced consumers. */
  _raw?: unknown;
}

/**
 * Patch fields. SCAPI uses camelCase; OCAPI backend translates to snake_case.
 */
export interface UpdateUserChanges {
  email?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  disabled?: boolean;
  preferredDataLocale?: string;
  preferredUiLocale?: string;
}

/**
 * Result of listing users — paginated.
 */
export interface ListUsersResult {
  total: number;
  start: number;
  count: number;
  hits: UserInfo[];
}

export interface ListUsersOptions {
  start?: number;
  count?: number;
}

/** Portable user search criteria supported by both backends. */
export interface SearchUsersOptions extends ListUsersOptions {
  /** Raw OCAPI query. In auto mode this deliberately selects the OCAPI fallback. */
  query?: unknown;
  searchPhrase?: string;
  login?: string;
  email?: string;
  locked?: boolean;
  disabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Body for create/replace (PUT). Required: login.
 */
export interface CreateUserInput {
  login: string;
  email: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  password?: string;
  disabled?: boolean;
  preferredDataLocale?: string;
  preferredUiLocale?: string;
  roles?: string[];
}

/**
 * Backend contract for BM user operations.
 *
 * Merchant Users has no server-side search endpoint, so the SCAPI backend
 * implements portable search criteria over its paginated user listing.
 * Raw OCAPI query DSL, access keys, and `whoami` remain OCAPI-only.
 */
export interface UsersBackend extends BackendBase {
  listUsers(options?: ListUsersOptions): Promise<ListUsersResult>;
  searchUsers(options?: SearchUsersOptions): Promise<ListUsersResult>;
  getUser(login: string): Promise<UserInfo>;
  createOrReplaceUser(login: string, input: CreateUserInput): Promise<UserInfo>;
  updateUser(login: string, changes: UpdateUserChanges): Promise<UserInfo>;
  deleteUser(login: string): Promise<void>;
}
