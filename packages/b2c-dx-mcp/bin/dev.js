#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

// Load .env file from package root (not cwd) if present
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
try {
  process.loadEnvFile(envPath);
} catch {
  // .env file not found or not readable, continue without it
}

// Disable telemetry in development mode (after loading .env so user config is respected)
process.env.SFCC_DISABLE_TELEMETRY ??= 'true';

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
