/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Confirmation flow utility for safety-guarded operations.
 *
 * @module safety/with-confirmation
 */

import type {SafetyGuard} from './safety-guard.js';
import type {SafetyEvaluation} from './types.js';
import {SafetyBlockedError, SafetyConfirmationRequired} from './safety-middleware.js';

/**
 * Handler that prompts a user for confirmation.
 *
 * Implementations vary by context:
 * - CLI: readline-based prompt
 * - VS Code: `vscode.window.showWarningMessage({ modal: true })`
 * - MCP/non-interactive: always returns `false`
 *
 * @param evaluation - The safety evaluation that triggered confirmation
 * @returns true if the user confirmed, false to cancel
 */
export type ConfirmHandler = (evaluation: SafetyEvaluation) => Promise<boolean>;

/**
 * Execute an operation with safety confirmation support.
 *
 * If the operation throws {@link SafetyConfirmationRequired}, the
 * `confirmHandler` is called. If the user confirms, the operation
 * is retried with a temporary exemption. If the user cancels (or
 * the handler returns false), a {@link SafetyBlockedError} is thrown.
 *
 * Non-confirmation errors are re-thrown as-is.
 *
 * @param guard - The SafetyGuard instance
 * @param operation - The operation to execute
 * @param confirmHandler - Context-specific confirmation handler
 * @returns The operation's return value
 *
 * @example
 * ```typescript
 * // CLI usage
 * const result = await withSafetyConfirmation(
 *   guard,
 *   () => instance.ocapi.POST('/jobs/import/executions', ...),
 *   async (eval) => {
 *     if (!process.stdin.isTTY) return false;
 *     return confirm(`Safety: ${eval.reason}. Proceed?`);
 *   },
 * );
 *
 * // VS Code usage
 * const result = await withSafetyConfirmation(
 *   guard,
 *   () => runJobImport(),
 *   async (eval) => {
 *     const choice = await vscode.window.showWarningMessage(eval.reason, { modal: true }, 'Proceed');
 *     return choice === 'Proceed';
 *   },
 * );
 * ```
 */
export async function withSafetyConfirmation<T>(
  guard: SafetyGuard,
  operation: () => Promise<T>,
  confirmHandler: ConfirmHandler,
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (err instanceof SafetyConfirmationRequired) {
      const confirmed = await confirmHandler(err.evaluation);
      if (!confirmed) {
        throw new SafetyBlockedError(
          `Operation cancelled: ${err.evaluation.reason}`,
          err.evaluation.operation.method ?? '',
          err.evaluation.operation.url ?? '',
          guard.config.level,
        );
      }

      // Temporarily allow this specific operation and retry
      const cleanup = guard.temporarilyAllow(err.evaluation.operation);
      try {
        return await operation();
      } finally {
        cleanup();
      }
    }
    throw err;
  }
}
