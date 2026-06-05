/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Global test setup for SDK tests.
 *
 * - Strips the developer's SFCC_ and MRT_ environment so tests never inherit
 *   real config (e.g. SFCC_CONFIG pointing at a personal dw.json)
 * - Sets log level to silent to reduce test output noise
 * - Skips plugin hook collection so real plugins don't pollute the test environment
 * - Clears all global registries before each test to prevent state leakage
 */
import {globalMiddlewareRegistry} from '../src/clients/middleware-registry.js';
import {globalAuthMiddlewareRegistry} from '../src/auth/middleware.js';
import {globalConfigSourceRegistry} from '../src/config/config-source-registry.js';

// Establish a clean baseline environment for the entire test run so no test
// inherits the developer's config. Individual tests may still layer their own
// isolateConfig()/restoreConfig() on top of this. This is intentionally not the
// stateful isolateConfig() helper — that one save/restores within a single test,
// whereas this is a permanent, non-restoring baseline for the whole process.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('SFCC_') || key.startsWith('MRT_')) {
    delete process.env[key];
  }
}

// Point config/credential lookups at /dev/null so file-based sources resolve to
// nothing even if a default dw.json/~/.mobify exists on the machine.
process.env.SFCC_CONFIG = '/dev/null';
process.env.MRT_CREDENTIALS_FILE = '/dev/null';

// Set silent log level by default for all tests
process.env.SFCC_LOG_LEVEL = 'silent';

// Prevent BaseCommand from running plugin hooks during tests
process.env.B2C_SKIP_PLUGIN_HOOKS = '1';

export const mochaHooks = {
  beforeEach() {
    globalMiddlewareRegistry.clear();
    globalAuthMiddlewareRegistry.clear();
    globalConfigSourceRegistry.clear();
  },
};
