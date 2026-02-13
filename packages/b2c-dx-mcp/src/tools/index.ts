/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * MCP Tools for B2C Commerce developer experience.
 *
 * This module exports all available tools and utilities.
 * Tools use the @salesforce/b2c-tooling-sdk operations layer directly.
 *
 * > ⚠️ **PLACEHOLDER - ACTIVE DEVELOPMENT**
 * > Tools are currently placeholder implementations that return mock responses.
 * > Actual implementations are coming soon. Use `--allow-non-ga-tools` flag to enable.
 *
 * @module tools
 */

// Tool adapter utilities
export * from './adapter.js';

// Toolset exports
export * from './cartridges/index.js';
export * from './mrt/index.js';
export * from './pwav3/index.js';
export * from './scapi/index.js';
export * from './storefrontnext/index.js';
