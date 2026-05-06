/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Global test setup for CLI tests.
 *
 * - Skips plugin hook collection so real plugins installed on the developer's
 *   machine (keychain, password-store, etc.) don't pollute the test environment
 * - Clears all SDK global registries before each test to prevent state leakage
 */
import {globalMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {
  globalAuthMiddlewareRegistry,
  initializeStatefulStore,
  clearStoredSession,
} from '@salesforce/b2c-tooling-sdk/auth';
import {globalConfigSourceRegistry} from '@salesforce/b2c-tooling-sdk/config';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Prevent BaseCommand from running plugin hooks during tests
process.env.B2C_SKIP_PLUGIN_HOOKS = '1';

// Isolate the stateful auth session store to a unique per-process temp dir.
// Both the test setup and BaseCommand.init() will use this path, so tests
// (or parallel mocha workers) don't race on the developer's real auth file at
// ~/Library/Application Support/@salesforce/b2c-cli/auth-session.json.
const testDataDir = mkdtempSync(join(tmpdir(), 'b2c-cli-test-'));
process.env.B2C_TEST_DATA_DIR = testDataDir;
initializeStatefulStore(testDataDir);

export const mochaHooks = {
  beforeEach() {
    globalMiddlewareRegistry.clear();
    globalAuthMiddlewareRegistry.clear();
    globalConfigSourceRegistry.clear();
    // Re-isolate stateful store path before every test in case a prior test
    // called resetStatefulStoreForTesting(), and clear any leftover session.
    initializeStatefulStore(testDataDir);
    clearStoredSession();
  },
};
