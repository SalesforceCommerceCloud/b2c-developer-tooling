/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SafetyGuard: SDK-level safety evaluation engine.
 *
 * Evaluates operations against safety rules and levels, producing typed
 * evaluations (allow/block/confirm). Used by both the HTTP middleware
 * (automatic) and command-level checks (opt-in).
 *
 * @module safety/safety-guard
 */

import {Minimatch} from 'minimatch';
import {getLogger, type Logger} from '../logging/index.js';
import type {SafetyConfig} from './safety-middleware.js';
import {
  SafetyBlockedError,
  SafetyConfirmationRequired,
  checkLevelViolation,
  describeSafetyLevel,
} from './safety-middleware.js';
import type {SafetyAction, SafetyEvaluation, SafetyOperation, SafetyRule} from './types.js';

/** Regex to extract job ID from OCAPI job execution URLs. */
const JOB_EXECUTION_PATTERN = /\/jobs\/([^/]+)\/executions/;

/**
 * Extract a job ID from a URL path if it's a job execution endpoint.
 *
 * Matches patterns like:
 * - `/s/-/dw/data/v24_5/jobs/sfcc-site-archive-import/executions`
 * - `/jobs/sfcc-site-archive-export/executions`
 */
export function extractJobIdFromPath(path: string): string | undefined {
  const match = JOB_EXECUTION_PATTERN.exec(path);
  return match?.[1];
}

/**
 * Test whether a string matches a glob pattern.
 * Uses minimatch with dot matching enabled.
 */
function matchGlob(value: string, pattern: string): boolean {
  const matcher = new Minimatch(pattern, {dot: true, nocase: true});
  return matcher.match(value);
}

/**
 * Check if a rule matches an operation.
 */
function ruleMatchesOperation(rule: SafetyRule, operation: SafetyOperation): boolean {
  // Command matcher
  if (rule.command !== undefined) {
    if (!operation.commandId) return false;
    return matchGlob(operation.commandId, rule.command);
  }

  // Job matcher
  if (rule.job !== undefined) {
    const jobId = operation.jobId ?? (operation.path ? extractJobIdFromPath(operation.path) : undefined);
    if (!jobId) return false;
    return matchGlob(jobId, rule.job);
  }

  // HTTP method + path matcher
  if (rule.path !== undefined) {
    if (!operation.path) return false;
    if (!matchGlob(operation.path, rule.path)) return false;
    // If method is specified, it must also match
    if (rule.method !== undefined) {
      if (!operation.method) return false;
      return matchGlob(operation.method.toUpperCase(), rule.method.toUpperCase());
    }
    return true;
  }

  // Method-only matcher (no path)
  if (rule.method !== undefined) {
    if (!operation.method) return false;
    return matchGlob(operation.method.toUpperCase(), rule.method.toUpperCase());
  }

  // Rule has no matchers — does not match anything
  return false;
}

/**
 * SafetyGuard evaluates operations against safety rules and levels.
 *
 * The guard provides three levels of API:
 * - {@link evaluate} — returns a {@link SafetyEvaluation} describing what should happen
 * - {@link assert} — throws {@link SafetyBlockedError} or {@link SafetyConfirmationRequired}
 * - {@link temporarilyAllow} — creates a scoped exemption for confirmed operations
 *
 * The HTTP middleware uses the guard internally so all HTTP requests are
 * evaluated automatically. CLI commands and other consumers can use the
 * guard directly for richer safety interaction (command-level checks,
 * confirmation flows).
 *
 * @example
 * ```typescript
 * const guard = new SafetyGuard({
 *   level: 'NO_UPDATE',
 *   confirm: true,
 *   rules: [{ job: 'sfcc-site-archive-export', action: 'allow' }],
 * });
 *
 * const evaluation = guard.evaluate({ type: 'job', jobId: 'sfcc-site-archive-export' });
 * // evaluation.action === 'allow'
 * ```
 */
export class SafetyGuard {
  private temporaryAllows: SafetyRule[] = [];
  private readonly logger: Logger;

  constructor(public readonly config: SafetyConfig) {
    this.logger = getLogger();
  }

  /**
   * Evaluate an operation against safety rules and level.
   *
   * Evaluation order:
   * 1. Temporary allows (from confirmed retries) — if matched, allow
   * 2. Config rules in order — first matching rule's action wins
   * 3. Level-based default — confirm if `confirm: true`, otherwise block/allow
   *
   * All evaluations are trace-logged for diagnostics.
   */
  evaluate(operation: SafetyOperation): SafetyEvaluation {
    // 1. Check temporary allows (confirmed operations)
    for (const rule of this.temporaryAllows) {
      if (ruleMatchesOperation(rule, operation)) {
        const evaluation: SafetyEvaluation = {
          action: 'allow',
          reason: 'Temporarily allowed after confirmation',
          operation,
          rule,
        };
        this.logger.trace({operation, evaluation}, '[SafetyGuard] Allowed by temporary exemption');
        return evaluation;
      }
    }

    // 2. Check config rules (first match wins)
    if (this.config.rules) {
      for (const rule of this.config.rules) {
        if (ruleMatchesOperation(rule, operation)) {
          const evaluation: SafetyEvaluation = {
            action: rule.action,
            reason: this.describeRuleMatch(rule, operation),
            operation,
            rule,
          };
          this.logger.trace({operation, rule, action: rule.action}, '[SafetyGuard] Matched rule');
          return evaluation;
        }
      }
    }

    // 3. Fall back to level-based evaluation
    return this.evaluateByLevel(operation);
  }

  /**
   * Assert that an operation is allowed.
   *
   * @throws {SafetyBlockedError} if the operation is blocked
   * @throws {SafetyConfirmationRequired} if the operation needs confirmation
   */
  assert(operation: SafetyOperation): void {
    const evaluation = this.evaluate(operation);
    switch (evaluation.action) {
      case 'allow':
        return;
      case 'block':
        throw new SafetyBlockedError(evaluation.reason, operation.method ?? '', operation.url ?? '', this.config.level);
      case 'confirm':
        throw new SafetyConfirmationRequired(evaluation);
    }
  }

  /**
   * Create a temporary exemption for a confirmed operation.
   *
   * Returns a cleanup function that removes the exemption. Use this
   * to retry an operation after the user has confirmed.
   */
  temporarilyAllow(operation: SafetyOperation): () => void {
    const rule = this.operationToRule(operation);
    return this.temporarilyAddRule(rule);
  }

  /**
   * Add a temporary safety rule for a scoped exemption.
   *
   * Unlike {@link temporarilyAllow} which derives a rule from an operation,
   * this accepts an arbitrary rule — useful for granting broad temporary
   * access (e.g., allowing WebDAV DELETE on Impex paths during a job export).
   *
   * Returns a cleanup function that removes the rule.
   */
  temporarilyAddRule(rule: SafetyRule): () => void {
    this.temporaryAllows.push(rule);
    this.logger.trace({rule}, '[SafetyGuard] Added temporary rule');

    return () => {
      const idx = this.temporaryAllows.indexOf(rule);
      if (idx >= 0) {
        this.temporaryAllows.splice(idx, 1);
        this.logger.trace({rule}, '[SafetyGuard] Removed temporary rule');
      }
    };
  }

  /**
   * Evaluate an operation using only the safety level (no rules).
   */
  private evaluateByLevel(operation: SafetyOperation): SafetyEvaluation {
    // For HTTP operations, check the level
    if (operation.method && operation.path) {
      const violation = checkLevelViolation(operation.method, operation.path, this.config.level);
      if (violation) {
        const action: SafetyAction = this.config.confirm ? 'confirm' : 'block';
        const evaluation: SafetyEvaluation = {
          action,
          reason: this.describeLevelBlock(operation),
          operation,
        };
        this.logger.trace({operation, action, level: this.config.level}, '[SafetyGuard] Level evaluation');
        return evaluation;
      }
    }

    // For command operations, no level-based blocking (levels are HTTP-level)
    // Commands opt into safety via rules or assertDestructiveOperationAllowed()
    const evaluation: SafetyEvaluation = {
      action: 'allow',
      reason: 'No matching rule and level allows this operation',
      operation,
    };
    this.logger.trace({operation, level: this.config.level}, '[SafetyGuard] Allowed by level');
    return evaluation;
  }

  /**
   * Convert an operation to a temporary allow rule for retry.
   */
  private operationToRule(operation: SafetyOperation): SafetyRule {
    if (operation.commandId) {
      return {command: operation.commandId, action: 'allow'};
    }
    if (operation.jobId) {
      return {job: operation.jobId, action: 'allow'};
    }
    // HTTP operation — match exact method + path
    return {
      method: operation.method,
      path: operation.path,
      action: 'allow',
    };
  }

  /**
   * Describe why a rule matched, for user-facing messages.
   */
  private describeRuleMatch(rule: SafetyRule, operation: SafetyOperation): string {
    if (rule.command) {
      return `Command "${operation.commandId}" matched safety rule (command: "${rule.command}", action: ${rule.action})`;
    }
    if (rule.job) {
      return `Job "${operation.jobId}" matched safety rule (job: "${rule.job}", action: ${rule.action})`;
    }
    const method = operation.method ?? 'unknown';
    const path = operation.path ?? 'unknown';
    return `${method} ${path} matched safety rule (action: ${rule.action})`;
  }

  /**
   * Describe why the level blocked an operation, for user-facing messages.
   */
  private describeLevelBlock(operation: SafetyOperation): string {
    const method = operation.method ?? 'unknown';
    const path = operation.path ?? 'unknown';
    const levelDesc = describeSafetyLevel(this.config.level);
    return `${method} ${path} blocked by safety level ${this.config.level} — ${levelDesc}`;
  }
}
