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
import {globalAuthMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/auth';
import {globalConfigSourceRegistry} from '@salesforce/b2c-tooling-sdk/config';

// Prevent BaseCommand from running plugin hooks during tests
process.env.B2C_SKIP_PLUGIN_HOOKS = '1';

export const mochaHooks = {
  beforeEach() {
    globalMiddlewareRegistry.clear();
    globalAuthMiddlewareRegistry.clear();
    globalConfigSourceRegistry.clear();
  },
};
