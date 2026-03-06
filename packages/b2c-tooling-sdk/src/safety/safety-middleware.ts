/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Safety levels for preventing destructive operations.
 *
 * - NONE: No safety restrictions (default)
 * - NO_DELETE: Block DELETE operations only
 * - NO_UPDATE: Block DELETE and destructive operations (reset, stop, restart)
 * - READ_ONLY: Block all write operations (only GET allowed)
 */
export type SafetyLevel = 'NONE' | 'NO_DELETE' | 'NO_UPDATE' | 'READ_ONLY';

export interface SafetyConfig {
  level: SafetyLevel;
  allowedPaths?: string[]; // Whitelist specific paths (e.g., ['/auth/token'])
  blockedPaths?: string[]; // Blacklist specific paths
}

/**
 * Safety error thrown when an operation is blocked by safety middleware.
 */
export class SafetyBlockedError extends Error {
  constructor(
    message: string,
    public readonly method: string,
    public readonly url: string,
    public readonly safetyLevel: SafetyLevel,
  ) {
    super(message);
    this.name = 'SafetyBlockedError';
  }
}

/**
 * Checks if an HTTP operation should be blocked based on safety configuration.
 *
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param url - Request URL
 * @param config - Safety configuration
 * @returns Error message if blocked, undefined if allowed
 */
export function checkSafetyViolation(method: string, url: string, config: SafetyConfig): string | undefined {
  const upperMethod = method.toUpperCase();
  const path = new URL(url, 'http://dummy').pathname;

  // Check whitelist first
  if (config.allowedPaths && config.allowedPaths.some((allowed) => path.startsWith(allowed))) {
    return undefined; // Explicitly allowed
  }

  // Check blacklist
  if (config.blockedPaths && config.blockedPaths.some((blocked) => path.startsWith(blocked))) {
    return `Operation blocked: ${upperMethod} ${path} is in the blocked paths list`;
  }

  switch (config.level) {
    case 'NONE':
      return undefined; // No restrictions

    case 'NO_DELETE':
      if (upperMethod === 'DELETE') {
        return `Delete operation blocked: DELETE ${path} (NO_DELETE mode prevents deletions)`;
      }
      return undefined;

    case 'NO_UPDATE':
      // Block DELETE operations
      if (upperMethod === 'DELETE') {
        return `Delete operation blocked: DELETE ${path} (NO_UPDATE mode prevents deletions)`;
      }
      // Block operations that contain reset, stop, restart in path or might be destructive
      const destructivePatterns = ['/reset', '/stop', '/restart', '/operations'];
      if (destructivePatterns.some((pattern) => path.includes(pattern)) && upperMethod === 'POST') {
        return `Destructive operation blocked: POST ${path} (NO_UPDATE mode prevents reset/stop/restart)`;
      }
      return undefined;

    case 'READ_ONLY':
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod)) {
        return `Write operation blocked: ${upperMethod} ${path} (READ_ONLY mode prevents all modifications)`;
      }
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Parse safety level from environment variable or config.
 *
 * Reads from SFCC_SAFETY_LEVEL environment variable.
 * Also supports legacy naming for backward compatibility with early adopters.
 *
 * @param defaultLevel - Default level if no environment variable is set
 * @returns Parsed safety level
 */
export function getSafetyLevel(defaultLevel: SafetyLevel = 'NONE'): SafetyLevel {
  const safetyLevelEnv = process.env['SFCC_SAFETY_LEVEL'];
  if (safetyLevelEnv) {
    const upper = safetyLevelEnv.toUpperCase().replace('-', '_');
    if (['NONE', 'NO_DELETE', 'NO_UPDATE', 'READ_ONLY'].includes(upper)) {
      return upper as SafetyLevel;
    }

    // Backward compatibility: map old names to new names (for early adopters)
    if (upper === 'NO_DESTRUCTIVE') {
      return 'NO_UPDATE';
    }
    if (upper === 'READONLY') {
      return 'READ_ONLY';
    }
  }

  return defaultLevel;
}

/**
 * Get a user-friendly description of the safety level.
 */
export function describeSafetyLevel(level: SafetyLevel): string {
  switch (level) {
    case 'NONE':
      return 'No safety restrictions';
    case 'NO_DELETE':
      return 'Delete operations blocked';
    case 'NO_UPDATE':
      return 'Destructive operations blocked (delete, reset, stop, restart)';
    case 'READ_ONLY':
      return 'Read-only mode - all write operations blocked';
    default:
      return 'Unknown safety level';
  }
}
