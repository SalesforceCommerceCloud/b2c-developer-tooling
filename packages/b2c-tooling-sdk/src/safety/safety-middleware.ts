/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {getLogger} from '../logging/logger.js';

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
 * Parse safety level from environment variable.
 *
 * Reads from SFCC_SAFETY_LEVEL. Valid values: NONE, NO_DELETE, NO_UPDATE, READ_ONLY
 * (case-insensitive; dashes converted to underscores). Invalid values are logged
 * as a warning and the default level is returned.
 *
 * @param defaultLevel - Default level if no environment variable is set or value is invalid
 * @returns Parsed safety level
 */
export function getSafetyLevel(defaultLevel: SafetyLevel = 'NONE'): SafetyLevel {
  const safetyLevelEnv = process.env['SFCC_SAFETY_LEVEL'];
  if (safetyLevelEnv) {
    const upper = safetyLevelEnv.toUpperCase().replace(/-/g, '_');
    if (['NONE', 'NO_DELETE', 'NO_UPDATE', 'READ_ONLY'].includes(upper)) {
      return upper as SafetyLevel;
    }
    getLogger().warn(
      {envValue: safetyLevelEnv, validValues: ['NONE', 'NO_DELETE', 'NO_UPDATE', 'READ_ONLY']},
      'SFCC_SAFETY_LEVEL has an invalid value; using default safety level',
    );
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
