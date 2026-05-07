/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {getLogger} from '../logging/logger.js';
import type {SafetyRule} from './types.js';
import {isValidSafetyAction} from './types.js';
import type {SafetyEvaluation} from './types.js';

/**
 * Safety levels for preventing destructive operations.
 *
 * - NONE: No safety restrictions (default)
 * - NO_DELETE: Block DELETE operations only
 * - NO_UPDATE: Block DELETE and destructive operations (reset, stop, restart)
 * - READ_ONLY: Block all write operations (only GET allowed)
 */
export type SafetyLevel = 'NONE' | 'NO_DELETE' | 'NO_UPDATE' | 'READ_ONLY';

/**
 * Safety configuration.
 *
 * Supports both simple level-based blocking and granular per-rule actions.
 */
export interface SafetyConfig {
  /** The base safety level. */
  level: SafetyLevel;
  /** When true, operations that the level would block require confirmation instead of hard-blocking. */
  confirm?: boolean;
  /** Ordered list of rules. First matching rule wins. */
  rules?: SafetyRule[];
}

/**
 * Ordering of safety levels from least to most restrictive.
 */
const LEVEL_ORDER: Record<SafetyLevel, number> = {
  NONE: 0,
  NO_DELETE: 1,
  NO_UPDATE: 2,
  READ_ONLY: 3,
};

/**
 * Valid safety level strings.
 */
const VALID_LEVELS: readonly SafetyLevel[] = ['NONE', 'NO_DELETE', 'NO_UPDATE', 'READ_ONLY'] as const;

/**
 * Returns the more restrictive of two safety levels.
 */
export function maxSafetyLevel(a: SafetyLevel, b: SafetyLevel): SafetyLevel {
  return LEVEL_ORDER[a] >= LEVEL_ORDER[b] ? a : b;
}

/**
 * Check if a string is a valid SafetyLevel.
 */
export function isValidSafetyLevel(value: string): value is SafetyLevel {
  return VALID_LEVELS.includes(value as SafetyLevel);
}

/**
 * Parse a string to a SafetyLevel, returning undefined for invalid values.
 * Accepts case-insensitive input and converts dashes to underscores.
 */
export function parseSafetyLevelString(value: string | undefined): SafetyLevel | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().replace(/-/g, '_');
  return isValidSafetyLevel(normalized) ? normalized : undefined;
}

/**
 * Safety error thrown when an operation is blocked by safety configuration.
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
 * Error thrown when an operation requires interactive confirmation.
 *
 * Callers can catch this error, prompt the user, and retry the operation
 * using {@link withSafetyConfirmation}.
 */
export class SafetyConfirmationRequired extends Error {
  constructor(public readonly evaluation: SafetyEvaluation) {
    super(`Confirmation required: ${evaluation.reason}`);
    this.name = 'SafetyConfirmationRequired';
  }
}

/**
 * Checks if an HTTP operation should be blocked based on a safety level.
 *
 * This is the low-level level check. For full rule-based evaluation,
 * use {@link SafetyGuard.evaluate}.
 *
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param path - URL pathname
 * @param level - Safety level to check against
 * @returns Error message if blocked, undefined if allowed
 */
export function checkLevelViolation(method: string, path: string, level: SafetyLevel): string | undefined {
  const upperMethod = method.toUpperCase();

  switch (level) {
    case 'NONE':
      return undefined;

    case 'NO_DELETE':
      if (upperMethod === 'DELETE') {
        return `Delete operation blocked: DELETE ${path} (NO_DELETE mode prevents deletions)`;
      }
      return undefined;

    case 'NO_UPDATE': {
      if (upperMethod === 'DELETE') {
        return `Delete operation blocked: DELETE ${path} (NO_UPDATE mode prevents deletions)`;
      }
      const destructivePatterns = ['/reset', '/stop', '/restart', '/operations'];
      if (destructivePatterns.some((pattern) => path.includes(pattern)) && upperMethod === 'POST') {
        return `Destructive operation blocked: POST ${path} (NO_UPDATE mode prevents reset/stop/restart)`;
      }
      return undefined;
    }

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
 * Checks if an HTTP operation should be blocked based on safety configuration.
 *
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param url - Request URL
 * @param config - Safety configuration
 * @returns Error message if blocked, undefined if allowed
 * @deprecated Use {@link SafetyGuard.evaluate} for full rule-based evaluation.
 */
export function checkSafetyViolation(method: string, url: string, config: SafetyConfig): string | undefined {
  const path = new URL(url, 'http://dummy').pathname;
  return checkLevelViolation(method, path, config.level);
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
    const parsed = parseSafetyLevelString(safetyLevelEnv);
    if (parsed) return parsed;

    getLogger().warn(
      {envValue: safetyLevelEnv, validValues: VALID_LEVELS},
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

/** Shape of the global safety.json file (unvalidated strings, same as dw.json safety). */
interface RawSafetyConfig {
  level?: string;
  confirm?: boolean;
  rules?: Array<{method?: string; path?: string; job?: string; command?: string; action: string}>;
}

/** Validated safety config fragment (shared by global and per-instance). */
export interface SafetyConfigFragment {
  level?: SafetyLevel;
  confirm?: boolean;
  rules?: SafetyRule[];
}

/**
 * Load global safety configuration from a JSON file.
 *
 * Resolution order:
 * 1. `SFCC_SAFETY_CONFIG` env var — explicit path to a safety config file
 * 2. `{configDir}/safety.json` — oclif config directory (e.g., `~/.config/b2c/safety.json`)
 *
 * The file has the same shape as the `safety` object in dw.json:
 * ```json
 * { "level": "NO_DELETE", "confirm": true, "rules": [...] }
 * ```
 *
 * @param configDir - oclif config directory path (e.g., `this.config.configDir`)
 * @returns Validated safety config fragment, or undefined if no file found
 */
export function loadGlobalSafetyConfig(configDir?: string): SafetyConfigFragment | undefined {
  const logger = getLogger();

  // 1. Check SFCC_SAFETY_CONFIG env var
  const envPath = process.env['SFCC_SAFETY_CONFIG'];
  const filePath = envPath || (configDir ? join(configDir, 'safety.json') : undefined);

  if (!filePath || !existsSync(filePath)) {
    return undefined;
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as RawSafetyConfig;
    const result: SafetyConfigFragment = {};

    if (raw.level) {
      const parsed = parseSafetyLevelString(raw.level);
      if (parsed) {
        result.level = parsed;
      } else {
        logger.warn({level: raw.level, file: filePath}, 'Invalid safety level in global safety config; ignoring');
      }
    }

    if (raw.confirm !== undefined) {
      result.confirm = raw.confirm === true;
    }

    if (raw.rules && Array.isArray(raw.rules)) {
      result.rules = raw.rules.filter((r) => {
        if (!isValidSafetyAction(r.action)) {
          logger.warn({rule: r, file: filePath}, 'Invalid safety rule action in global safety config; skipping rule');
          return false;
        }
        return true;
      }) as SafetyRule[];
    }

    logger.trace({filePath, level: result.level, ruleCount: result.rules?.length}, 'Loaded global safety config');
    return result;
  } catch (error) {
    logger.warn({error, file: filePath}, 'Failed to load global safety config; ignoring');
    return undefined;
  }
}

/**
 * Compute effective safety config by merging environment variables, global
 * safety config, and per-instance config.
 *
 * Merge strategy:
 * - **Level**: `max(env, global, instance)` — most restrictive wins
 * - **Confirm**: OR across all sources
 * - **Rules**: instance rules first, then global rules (first-match-wins,
 *   so instance rules can override global policy)
 *
 * @param instanceSafety - Per-instance safety config from dw.json
 * @param globalSafety - Global safety config from safety.json
 * @returns Merged SafetyConfig
 */
export function resolveEffectiveSafetyConfig(
  instanceSafety?: SafetyConfigFragment,
  globalSafety?: SafetyConfigFragment,
): SafetyConfig {
  const envLevel = getSafetyLevel('NONE');
  const envConfirm = process.env['SFCC_SAFETY_CONFIRM'] === 'true' || process.env['SFCC_SAFETY_CONFIRM'] === '1';

  const instanceLevel = instanceSafety?.level ?? 'NONE';
  const globalLevel = globalSafety?.level ?? 'NONE';

  // Merge rules: instance first, then global (first-match-wins)
  const instanceRules = instanceSafety?.rules ?? [];
  const globalRules = globalSafety?.rules ?? [];
  const mergedRules = [...instanceRules, ...globalRules];

  return {
    level: maxSafetyLevel(envLevel, maxSafetyLevel(globalLevel, instanceLevel)),
    confirm: envConfirm || instanceSafety?.confirm === true || globalSafety?.confirm === true,
    rules: mergedRules.length > 0 ? mergedRules : undefined,
  };
}
