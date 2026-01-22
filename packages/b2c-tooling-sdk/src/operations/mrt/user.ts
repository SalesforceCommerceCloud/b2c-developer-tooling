/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * User operations for Managed Runtime.
 *
 * Handles user profile, API key, and email preferences management.
 *
 * @module operations/mrt/user
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * User profile type from API.
 */
export type MrtUserProfile = components['schemas']['APIUserProfile'];

/**
 * User email preferences type from API.
 */
export type MrtEmailPreferences = components['schemas']['UserEmailPreferences'];

/**
 * Patched email preferences type from API.
 */
export type PatchedMrtEmailPreferences = components['schemas']['PatchedUserEmailPreferences'];

/**
 * Base options for user operations.
 */
export interface UserOperationOptions {
  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of API key generation/reset.
 */
export interface ApiKeyResult {
  /**
   * The generated or reset API key.
   */
  api_key: string;
}

/**
 * Options for updating email preferences.
 */
export interface UpdateEmailPreferencesOptions extends UserOperationOptions {
  /**
   * Whether to receive Node.js deprecation notifications.
   */
  nodeDeprecationNotifications?: boolean;
}

/**
 * Gets the profile information for the authenticated user.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns User profile
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getProfile } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const profile = await getProfile({}, auth);
 * console.log(`User: ${profile.first_name} ${profile.last_name}`);
 * ```
 */
export async function getProfile(options: UserOperationOptions, auth: AuthStrategy): Promise<MrtUserProfile> {
  const logger = getLogger();
  const {origin} = options;

  logger.debug('[MRT] Getting user profile');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/users/me/profile/');

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get user profile: ${errorMessage}`);
  }

  logger.debug({email: data.email}, '[MRT] User profile retrieved');

  return data;
}

/**
 * Generates or resets the API key for the authenticated user.
 *
 * Warning: This will invalidate your current API key.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The new API key
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { resetApiKey } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await resetApiKey({}, auth);
 * console.log(`New API key: ${result.api_key}`);
 * // Important: Update your stored API key!
 * ```
 */
export async function resetApiKey(options: UserOperationOptions, auth: AuthStrategy): Promise<ApiKeyResult> {
  const logger = getLogger();
  const {origin} = options;

  logger.debug('[MRT] Resetting API key');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/users/me/api_key/');

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to reset API key: ${errorMessage}`);
  }

  logger.debug('[MRT] API key reset successfully');

  // Response schema is loose in spec, cast to expected shape
  const response = data as unknown as ApiKeyResult;

  return response;
}

/**
 * Gets email notification preferences for the authenticated user.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Email preferences
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getEmailPreferences } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const prefs = await getEmailPreferences({}, auth);
 * console.log(`Node deprecation notifications: ${prefs.node_deprecation_notifications}`);
 * ```
 */
export async function getEmailPreferences(
  options: UserOperationOptions,
  auth: AuthStrategy,
): Promise<MrtEmailPreferences> {
  const logger = getLogger();
  const {origin} = options;

  logger.debug('[MRT] Getting email preferences');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/users/me/email-preferences/');

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get email preferences: ${errorMessage}`);
  }

  logger.debug('[MRT] Email preferences retrieved');

  return data;
}

/**
 * Updates email notification preferences for the authenticated user.
 *
 * @param options - Update options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Updated email preferences
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { updateEmailPreferences } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const prefs = await updateEmailPreferences({
 *   nodeDeprecationNotifications: false
 * }, auth);
 *
 * console.log(`Updated: ${prefs.node_deprecation_notifications}`);
 * ```
 */
export async function updateEmailPreferences(
  options: UpdateEmailPreferencesOptions,
  auth: AuthStrategy,
): Promise<MrtEmailPreferences> {
  const logger = getLogger();
  const {origin, nodeDeprecationNotifications} = options;

  logger.debug({nodeDeprecationNotifications}, '[MRT] Updating email preferences');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: PatchedMrtEmailPreferences = {};
  if (nodeDeprecationNotifications !== undefined) {
    body.node_deprecation_notifications = nodeDeprecationNotifications;
  }

  const {data, error} = await client.PATCH('/api/users/me/email-preferences/', {
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update email preferences: ${errorMessage}`);
  }

  logger.debug('[MRT] Email preferences updated');

  return data;
}
