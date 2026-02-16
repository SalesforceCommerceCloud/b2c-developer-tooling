#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Load .env file if present (Node.js native support)
try {
  process.loadEnvFile();
} catch {
  // .env file not found or not readable, continue without it
}

import {execute} from '@oclif/core';

function shouldBufferCipQueryStdin(argv) {
  return argv.includes('cip') && argv.includes('query') && argv.includes('--stdin');
}

if (shouldBufferCipQueryStdin(process.argv) && !process.stdin.isTTY) {
  let bufferedInput = '';
  for await (const chunk of process.stdin) {
    bufferedInput += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  }

  process.env.SFCC_CIP_QUERY_STDIN = bufferedInput;
}

await execute({dir: import.meta.url});
