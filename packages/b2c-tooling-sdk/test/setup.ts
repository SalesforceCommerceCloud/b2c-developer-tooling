/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Global test setup - runs before all tests.
 * Sets SFCC_LOG_LEVEL to silent to reduce test output noise.
 */

// Set silent log level by default for all tests
process.env.SFCC_LOG_LEVEL = 'silent';
