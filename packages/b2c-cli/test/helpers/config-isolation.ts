/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

const ADDITIONAL_ENV_VARS = ['LANGUAGE', 'NO_COLOR'];

interface IsolationState {
  savedEnvVars: Record<string, string | undefined>;
}

let state: IsolationState | null = null;

export function isolateConfig(): void {
  if (state) throw new Error('isolateConfig() called without cleanup - call restoreConfig() first');

  const savedEnvVars: Record<string, string | undefined> = {};

  for (const key of Object.keys(process.env)) {
    if (key.startsWith('SFCC_') || key.startsWith('MRT_')) {
      savedEnvVars[key] = process.env[key];
      delete process.env[key];
    }
  }

  for (const key of ADDITIONAL_ENV_VARS) {
    savedEnvVars[key] = process.env[key];
    delete process.env[key];
  }

  process.env.SFCC_CONFIG = '/dev/null';
  process.env.MRT_CREDENTIALS_FILE = '/dev/null';

  state = {savedEnvVars};
}

export function restoreConfig(): void {
  if (!state) return;

  delete process.env.SFCC_CONFIG;
  delete process.env.MRT_CREDENTIALS_FILE;

  for (const [key, value] of Object.entries(state.savedEnvVars)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  state = null;
}
