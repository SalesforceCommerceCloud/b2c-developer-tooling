/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Test helper for isolating tests from host environment configuration.
 *
 * This helper clears environment variables that affect config loading:
 * - All SFCC_* env vars (CLI flags)
 * - All MRT_* env vars (MRT credentials file path)
 * - Additional vars that affect output (LANGUAGE, NO_COLOR)
 *
 * @example
 * ```typescript
 * import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';
 *
 * describe('my-test', () => {
 *   beforeEach(() => {
 *     isolateConfig();
 *   });
 *
 *   afterEach(() => {
 *     restoreConfig();
 *   });
 *
 *   // ... tests run in isolated environment
 * });
 * ```
 */

/** Additional non-SFCC env vars that affect config loading */
const ADDITIONAL_ENV_VARS = ['LANGUAGE', 'NO_COLOR'];

interface IsolationState {
  savedEnvVars: Record<string, string | undefined>;
}

let state: IsolationState | null = null;

/**
 * Isolates tests from host environment configuration.
 *
 * Must be called in beforeEach() and paired with restoreConfig() in afterEach().
 *
 * @throws Error if called without first calling restoreConfig()
 */
export function isolateConfig(): void {
  if (state) throw new Error('isolateConfig() called without cleanup - call restoreConfig() first');

  const savedEnvVars: Record<string, string | undefined> = {};

  // Clear all SFCC_* AND MRT_* env vars
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('SFCC_') || key.startsWith('MRT_')) {
      savedEnvVars[key] = process.env[key];
      delete process.env[key];
    }
  }

  // Clear additional non-SFCC vars that affect config
  for (const key of ADDITIONAL_ENV_VARS) {
    savedEnvVars[key] = process.env[key];
    delete process.env[key];
  }

  // SET isolation env vars - oclif will pick these up during flag parsing
  // /dev/null exists but is empty (JSON.parse fails), so config sources find nothing
  process.env.SFCC_CONFIG = '/dev/null';
  process.env.MRT_CREDENTIALS_FILE = '/dev/null';

  state = {savedEnvVars};
}

/**
 * Restores the host environment after test isolation.
 *
 * Must be called in afterEach() after isolateConfig() was called in beforeEach().
 * Safe to call even if isolateConfig() was not called (no-op).
 */
export function restoreConfig(): void {
  if (!state) return;

  // Remove isolation env vars we set
  delete process.env.SFCC_CONFIG;
  delete process.env.MRT_CREDENTIALS_FILE;

  // Restore original env vars
  for (const [key, value] of Object.entries(state.savedEnvVars)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  state = null;
}
