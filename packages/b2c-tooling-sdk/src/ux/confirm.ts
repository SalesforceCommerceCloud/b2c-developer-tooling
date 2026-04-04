/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as readline from 'node:readline';

export interface ConfirmOptions {
  /** Default to yes when the user presses Enter without typing. Defaults to false (no). */
  defaultYes?: boolean;
}

/**
 * Simple yes/no confirmation prompt.
 *
 * Output goes to stderr so it doesn't interfere with structured stdout output.
 *
 * @param message - Prompt message (the hint is appended automatically)
 * @param options - Options to control default behavior
 * @returns true if user confirmed, false otherwise
 */
export async function confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  const defaultYes = options?.defaultYes ?? false;
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
