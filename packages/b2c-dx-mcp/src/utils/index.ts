/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Utility modules for the B2C DX MCP server.
 *
 * @module utils
 */

// Note: We use .js extensions in imports for ESM compatibility.
// TypeScript resolves .js → .ts at compile time, but the compiled
// output needs .js extensions to work at runtime with Node.js ESM.
export * from './constants.js';
export * from './types.js';
