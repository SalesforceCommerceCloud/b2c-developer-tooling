/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Types for the safety evaluation system.
 *
 * @module safety/types
 */

/**
 * Action that a safety evaluation can produce.
 *
 * - `allow`: Operation is permitted
 * - `block`: Operation is refused
 * - `confirm`: Operation requires interactive confirmation before proceeding
 */
export type SafetyAction = 'allow' | 'block' | 'confirm';

/**
 * A safety rule that matches operations and specifies an action.
 *
 * Rules support three matcher types, all using glob patterns (via minimatch):
 * - `method` + `path`: Matches HTTP requests by method and URL path
 * - `job`: Matches job execution by job ID (extracted from OCAPI URLs)
 * - `command`: Matches CLI commands by oclif command ID (e.g., "sandbox:delete")
 *
 * @example
 * ```json
 * { "job": "sfcc-site-archive-export", "action": "allow" }
 * { "command": "ecdn:cache:purge", "action": "confirm" }
 * { "method": "DELETE", "path": "/code_versions/*", "action": "block" }
 * ```
 */
export interface SafetyRule {
  /** HTTP method pattern (e.g., "POST", "DELETE"). Omit to match any method. */
  method?: string;
  /** URL path glob pattern (e.g., "/jobs/&#42;/executions"). Matched with minimatch. */
  path?: string;
  /** Job ID glob pattern. Matches OCAPI job execution URLs by job ID. */
  job?: string;
  /** CLI command ID glob pattern (e.g., "sandbox:*", "ecdn:cache:purge"). */
  command?: string;
  /** Action to take when this rule matches. */
  action: SafetyAction;
}

/**
 * An operation being evaluated for safety.
 *
 * Constructed by the caller (HTTP middleware, CLI command, etc.) and passed
 * to {@link SafetyGuard.evaluate} for rule matching.
 */
export interface SafetyOperation {
  /** The type of operation being evaluated. */
  type: 'http' | 'job' | 'command';
  /** HTTP method (for http operations). */
  method?: string;
  /** Full request URL (for http operations). */
  url?: string;
  /** Parsed URL pathname (for http operations). */
  path?: string;
  /** Job identifier (for job operations, or extracted from http operation URLs). */
  jobId?: string;
  /** CLI command ID, e.g., "sandbox:delete" (for command operations). */
  commandId?: string;
}

/**
 * Result of evaluating an operation against safety rules.
 */
export interface SafetyEvaluation {
  /** The action determined by evaluation. */
  action: SafetyAction;
  /** Human-readable explanation of why this action was chosen. */
  reason: string;
  /** The operation that was evaluated. */
  operation: SafetyOperation;
  /** The rule that matched, or undefined if the level default was used. */
  rule?: SafetyRule;
}

/**
 * Validated safety actions for use in rule parsing.
 */
export const VALID_SAFETY_ACTIONS: readonly SafetyAction[] = ['allow', 'block', 'confirm'] as const;

/**
 * Check if a string is a valid SafetyAction.
 */
export function isValidSafetyAction(value: string): value is SafetyAction {
  return VALID_SAFETY_ACTIONS.includes(value as SafetyAction);
}
