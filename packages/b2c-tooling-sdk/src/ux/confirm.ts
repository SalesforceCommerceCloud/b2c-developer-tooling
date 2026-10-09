/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as readline from 'node:readline';
import {getAgentContext, isInteractive} from './agent-context.js';

export interface ConfirmOptions {
  /** Default to yes when the user presses Enter without typing. Defaults to false (no). */
  defaultYes?: boolean;
  /**
   * Behavior when prompting is not possible (no TTY on stdin, or an AI agent
   * is driving the process):
   *
   * - `'error'` (default): throw {@link ConfirmationRequiredError} so the
   *   command fails fast with a non-zero exit instead of hanging
   * - `'default'`: resolve to the default answer (`defaultYes`) without prompting
   */
  nonInteractive?: 'default' | 'error';
}

/**
 * Thrown by {@link confirm} when a confirmation is required but cannot be
 * prompted for. Callers should skip the prompt with an explicit flag
 * (typically `--force` or `--yes`).
 */
export class ConfirmationRequiredError extends Error {
  readonly code = 'CONFIRMATION_REQUIRED';

  constructor(
    /** The confirmation message that could not be prompted. */
    readonly prompt: string,
  ) {
    const agent = getAgentContext().harness;
    const reason = agent
      ? `running under an AI agent (${agent.name}), so interactive prompts are disabled`
      : 'no interactive terminal is available';
    super(
      `Confirmation required but ${reason}:\n  ${prompt.trim()}\n` +
        `Re-run with the command's --force (or --yes) flag to proceed without prompting.`,
    );
    this.name = 'ConfirmationRequiredError';
  }
}

/**
 * Simple yes/no confirmation prompt.
 *
 * Output goes to stderr so it doesn't interfere with structured stdout output.
 *
 * When prompting is not possible (stdin is not a TTY, or an AI agent is
 * detected), this throws {@link ConfirmationRequiredError} by default rather
 * than waiting on input that will never arrive. See {@link ConfirmOptions.nonInteractive}.
 *
 * @param message - Prompt message (the hint is appended automatically)
 * @param options - Options to control default behavior
 * @returns true if user confirmed, false otherwise
 * @throws ConfirmationRequiredError when prompting is not possible and `nonInteractive` is `'error'`
 */
export async function confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  const defaultYes = options?.defaultYes ?? false;

  if (!isInteractive()) {
    if (options?.nonInteractive === 'default') return defaultYes;
    throw new ConfirmationRequiredError(message);
  }

  const hint = defaultYes ? '(Y/n)' : '(y/N)';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} ${hint} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') {
        resolve(defaultYes);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}
