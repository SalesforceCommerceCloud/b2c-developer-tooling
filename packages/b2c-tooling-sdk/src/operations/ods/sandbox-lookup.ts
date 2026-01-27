/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Sandbox ID lookup utilities for resolving friendly sandbox identifiers.
 *
 * @module operations/ods/sandbox-lookup
 */
import type {OdsClient} from '../../clients/ods.js';

/**
 * UUID regex pattern (standard 8-4-4-4-12 format).
 */
const UUID_REGEX = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

/**
 * Friendly sandbox ID pattern: realm-instance or realm_instance
 * - realm: 4 alphanumeric characters
 * - separator: dash or underscore
 * - instance: 1+ alphanumeric characters
 */
const FRIENDLY_ID_REGEX = /^([a-z\d]{4})[-_]([a-z\d]+)$/i;

/**
 * Error thrown when a sandbox cannot be found by its friendly identifier.
 */
export class SandboxNotFoundError extends Error {
  constructor(
    public readonly identifier: string,
    public readonly realm?: string,
    public readonly instance?: string,
  ) {
    const message =
      realm && instance
        ? `Sandbox not found: ${identifier} (realm=${realm}, instance=${instance})`
        : `Sandbox not found: ${identifier}`;
    super(message);
    this.name = 'SandboxNotFoundError';
  }
}

/**
 * Checks if a string is a valid UUID.
 *
 * @param value - The string to check
 * @returns true if the value is a valid UUID
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Checks if a string matches the friendly sandbox ID format (realm-instance or realm_instance).
 *
 * @param value - The string to check
 * @returns true if the value matches the friendly format
 */
export function isFriendlySandboxId(value: string): boolean {
  return FRIENDLY_ID_REGEX.test(value);
}

/**
 * Parses a friendly sandbox ID into its realm and instance components.
 *
 * @param value - The friendly ID to parse (e.g., "abcd-123" or "abcd_123")
 * @returns Object with realm and instance, or null if not a valid friendly ID
 */
export function parseFriendlySandboxId(value: string): {realm: string; instance: string} | null {
  const match = value.match(FRIENDLY_ID_REGEX);
  if (!match) {
    return null;
  }
  return {
    realm: match[1].toLowerCase(),
    instance: match[2].toLowerCase(),
  };
}

/**
 * Resolves a sandbox identifier to a UUID.
 *
 * If the identifier is already a UUID, it is returned directly without making an API call.
 * If the identifier is a friendly format (realm-instance), it queries the ODS API to find
 * the matching sandbox and returns its UUID.
 *
 * @param client - The ODS API client
 * @param identifier - Sandbox identifier (UUID or friendly format like "abcd-123")
 * @returns The sandbox UUID
 * @throws {SandboxNotFoundError} If the sandbox cannot be found
 *
 * @example
 * ```typescript
 * // UUID is returned directly
 * const uuid = await resolveSandboxId(client, 'abc12345-1234-1234-1234-abc123456789');
 * // => 'abc12345-1234-1234-1234-abc123456789'
 *
 * // Friendly ID is looked up
 * const uuid = await resolveSandboxId(client, 'zzzv-123');
 * // => 'abc12345-1234-1234-1234-abc123456789' (actual UUID from API)
 * ```
 */
export async function resolveSandboxId(client: OdsClient, identifier: string): Promise<string> {
  // If already a UUID, return directly
  if (isUuid(identifier)) {
    return identifier;
  }

  // Try to parse as friendly ID
  const parsed = parseFriendlySandboxId(identifier);
  if (!parsed) {
    // Not a UUID and not a friendly ID - treat as UUID and let API return 404
    return identifier;
  }

  // Query sandboxes filtered by realm
  const {data, error} = await client.GET('/sandboxes', {
    params: {
      query: {
        filter_params: `realm=${parsed.realm}`,
      },
    },
  });

  if (error || !data?.data) {
    throw new SandboxNotFoundError(identifier, parsed.realm, parsed.instance);
  }

  // Find sandbox with matching instance
  const sandbox = data.data.find((s) => s.instance?.toLowerCase() === parsed.instance);

  if (!sandbox?.id) {
    throw new SandboxNotFoundError(identifier, parsed.realm, parsed.instance);
  }

  return sandbox.id;
}
