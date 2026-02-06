#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

// Load .env file from this package's directory if present
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
try {
  process.loadEnvFile(join(packageDir, '.env'));
} catch {
  // .env file not found or not readable, continue without it
}

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
