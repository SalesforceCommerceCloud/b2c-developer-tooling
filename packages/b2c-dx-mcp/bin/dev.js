#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Set NODE_ENV to development if not already set (disables production telemetry)
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load .env file if present (Node.js native support)
try {
  process.loadEnvFile();
} catch {
  // .env file not found or not readable, continue without it
}

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
