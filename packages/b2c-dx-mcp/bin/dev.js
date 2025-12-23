#!/usr/bin/env -S node --conditions development --import tsx
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* global process */

/**
 * Development entry point for MCP server using oclif.
 *
 * This uses oclif's development mode which:
 * - Uses TypeScript source directly (via tsx loader in shebang)
 * - Supports the 'development' condition for exports
 * - Loads .env file if present for local configuration
 * - Provides better error messages and stack traces
 *
 * Run directly: ./bin/dev.js mcp --toolsets all
 * Or with node: node --conditions development --import tsx bin/dev.js mcp --toolsets all
 */

// Load .env file if present (Node.js native support)
try {
  process.loadEnvFile();
} catch {
  // .env file not found or not readable, continue without it
}

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
