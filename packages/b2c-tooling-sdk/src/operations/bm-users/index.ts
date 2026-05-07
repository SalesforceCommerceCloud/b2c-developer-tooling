/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Business Manager user operations for B2C Commerce instances.
 *
 * Provides functions for querying and managing instance-level users via OCAPI Data API.
 * These are distinct from Account Manager users managed via {@link @salesforce/b2c-tooling-sdk/operations/users | operations/users}.
 *
 * On instances using SSO with Account Manager (the default for production), creating local
 * BM users via the Data API is rejected with `LocalUserCreationException`. These operations
 * focus on read/search/lifecycle of AM-managed users plus access-key administration.
 *
 * ## Core User Functions
 *
 * - {@link listBmUsers} - List all users on an instance
 * - {@link getBmUser} - Get a user by login
 * - {@link whoamiBmUser} - Get the currently authenticated user
 * - {@link searchBmUsers} - Search users with filter expressions
 * - {@link updateBmUser} - Update user attributes (locale, external_id, disabled)
 * - {@link deleteBmUser} - Delete a user from the instance
 *
 * ## Access Keys (externally-managed users)
 *
 * - {@link getBmUserAccessKey} - Read access key details
 * - {@link createBmUserAccessKey} - Create / rotate an access key
 * - {@link setBmUserAccessKeyEnabled} - Enable / disable an access key
 * - {@link deleteBmUserAccessKey} - Delete an access key
 *
 * ## Usage
 *
 * ```typescript
 * import {listBmUsers, searchBmUsers, createBmUserAccessKey} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
 * import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig();
 * const instance = config.createB2CInstance();
 *
 * // List all users
 * const users = await listBmUsers(instance);
 *
 * // Search for locked users
 * const locked = await searchBmUsers(instance, {locked: true});
 *
 * // Provision a WebDAV access key for a user
 * const key = await createBmUserAccessKey(instance, 'user@example.com', 'WEBDAV');
 * console.log(key.access_key); // Only returned at creation time
 * ```
 *
 * @module operations/bm-users
 */
export {
  listBmUsers,
  getBmUser,
  whoamiBmUser,
  searchBmUsers,
  updateBmUser,
  deleteBmUser,
  getBmUserAccessKey,
  createBmUserAccessKey,
  setBmUserAccessKeyEnabled,
  deleteBmUserAccessKey,
} from './users.js';

export type {
  BmUser,
  BmUsers,
  BmUserSearchResult,
  BmAccessKeyDetails,
  ListBmUsersOptions,
  SearchBmUsersOptions,
  UpdateBmUserChanges,
} from './users.js';
