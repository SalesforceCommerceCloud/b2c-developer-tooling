/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {resetLogger} from '../logging/index.js';

const ADDITIONAL_ENV_VARS = ['B2C_CONFIG_DIR', 'COMMERCE_API_SLAS_SECRET', 'LANGUAGE', 'NO_COLOR'];

function isIsolatedEnvVar(key: string): boolean {
  return (
    key.startsWith('SFCC_') || key.startsWith('MRT_') || key.startsWith('PUBLIC__') || ADDITIONAL_ENV_VARS.includes(key)
  );
}

interface IsolationState {
  configDirectory: string;
  savedEnvVars: Record<string, string | undefined>;
}

let state: IsolationState | null = null;

export function isolateConfig(): void {
  if (state) throw new Error('isolateConfig() called without cleanup - call restoreConfig() first');

  const savedEnvVars: Record<string, string | undefined> = {};

  for (const key of Object.keys(process.env)) {
    if (isIsolatedEnvVar(key)) {
      savedEnvVars[key] = process.env[key];
      delete process.env[key];
    }
  }

  process.env.SFCC_CONFIG = '/dev/null';
  // Commands load no .env during tests
  process.env.SFCC_DOTENV_FILE = '';
  process.env.MRT_CREDENTIALS_FILE = '/dev/null';
  process.env.SFCC_LOG_LEVEL = 'silent';
  // An empty settings directory, so the user's global default dw.json is never read or written
  const configDirectory = mkdtempSync(path.join(tmpdir(), 'b2c-test-config-'));
  process.env.B2C_CONFIG_DIR = configDirectory;

  // Reset global logger so it picks up the new SFCC_LOG_LEVEL
  resetLogger();

  state = {configDirectory, savedEnvVars};
}

export function restoreConfig(): void {
  if (!state) return;

  // Reset logger before restoring env vars
  resetLogger();

  // Drop anything the test set, not just the variables isolateConfig() replaced
  for (const key of Object.keys(process.env)) {
    if (isIsolatedEnvVar(key)) delete process.env[key];
  }

  for (const [key, value] of Object.entries(state.savedEnvVars)) {
    if (value !== undefined) process.env[key] = value;
  }
  rmSync(state.configDirectory, {recursive: true, force: true});

  state = null;
}
