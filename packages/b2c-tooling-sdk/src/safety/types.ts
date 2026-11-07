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
 * Rules support these matchers, all using glob patterns (via minimatch):
 * - `method` + `path`: Matches HTTP requests by method and URL path
 * - `operationId` / `api`: Match SCAPI requests made through `createScapiRequest` (code mode)
 *   by the schema operation ID (e.g. `getProduct`) or API ID (e.g. `product/products/v1`)
 * - `readOnlySearch`: Matches the search POSTs that `READ_ONLY` allows (see `READ_ONLY_SEARCH_PATHS`)
 * - `job`: Matches job execution by job ID (extracted from SCAPI or OCAPI URLs)
 * - `command`: Matches CLI commands by oclif command ID (e.g., "sandbox:delete")
 *
 * `job` and `command` rules match on that field alone. The other matchers can be
 * combined; every matcher a rule sets must match.
 *
 * @example
 * ```json
 * { "job": "sfcc-site-archive-export", "action": "allow" }
 * { "command": "ecdn:cache:purge", "action": "confirm" }
 * { "method": "DELETE", "path": "/code_versions/*", "action": "block" }
 * { "method": "GET", "api": "product/**", "action": "allow" }
 * { "operationId": "updateProduct", "action": "confirm" }
 * { "readOnlySearch": true, "action": "allow" }
 * { "path": "**", "action": "block" }
 * ```
 */
export interface SafetyRule {
  /** HTTP method pattern (e.g., "POST", "DELETE"). Omit to match any method. */
  method?: string;
  /** URL path glob pattern (e.g., "/jobs/&#42;/executions"). Matched with minimatch. */
  path?: string;
  /** Job ID glob pattern. Matches SCAPI and OCAPI job execution URLs by job ID. */
  job?: string;
  /** CLI command ID glob pattern (e.g., "sandbox:*", "ecdn:cache:purge"). */
  command?: string;
  /**
   * SCAPI schema operation ID glob (e.g. "getProduct", "*Product*"). Matches only
   * requests that carry an operation ID, which `createScapiRequest` sets.
   */
  operationId?: string;
  /**
   * SCAPI API ID glob, `<family>/<name>/<version>` (e.g. "product/products/v1",
   * "product/products/*", or "product/**" for a whole family; `*` does not cross `/`).
   * Matches only requests that carry an API ID, which `createScapiRequest` sets.
   */
  api?: string;
  /**
   * When `true`, matches only the search POSTs that `READ_ONLY` treats as reads
   * (see `READ_ONLY_SEARCH_PATHS`). Use `{readOnlySearch: true, action: 'allow'}`
   * ahead of a catch-all block rule to keep searches working.
   */
  readOnlySearch?: boolean;
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
  /** SCAPI schema operation ID (for SCAPI requests made through `createScapiRequest`). */
  operationId?: string;
  /** SCAPI API ID, `<family>/<name>/<version>` (for SCAPI requests made through `createScapiRequest`). */
  api?: string;
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

/**
 * Normalize one safety rule from untrusted JSON (dw.json, safety.json, normalized
 * config). Keeps only known fields with the right types and returns `undefined`
 * for a rule with an invalid action or a mistyped matcher, so a rule never
 * silently matches more than its author wrote.
 */
export function normalizeSafetyRule(raw: unknown): SafetyRule | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const input = raw as Record<string, unknown>;
  if (typeof input.action !== 'string' || !isValidSafetyAction(input.action)) return undefined;
  const rule: SafetyRule = {action: input.action};
  for (const key of ['method', 'path', 'job', 'command', 'operationId', 'api'] as const) {
    const value = input[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') return undefined;
    rule[key] = value;
  }
  if (input.readOnlySearch !== undefined) {
    if (typeof input.readOnlySearch !== 'boolean') return undefined;
    rule.readOnlySearch = input.readOnlySearch;
  }
  return rule;
}
