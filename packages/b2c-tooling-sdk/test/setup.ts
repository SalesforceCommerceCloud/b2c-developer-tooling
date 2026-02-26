/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Global test setup for SDK tests.
 *
 * - Sets log level to silent to reduce test output noise
 * - Skips plugin hook collection so real plugins don't pollute the test environment
 * - Clears all global registries before each test to prevent state leakage
 */
import {globalMiddlewareRegistry} from '../src/clients/middleware-registry.js';
import {globalAuthMiddlewareRegistry} from '../src/auth/middleware.js';
import {globalConfigSourceRegistry} from '../src/config/config-source-registry.js';

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
