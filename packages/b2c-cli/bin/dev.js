#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Load .env file if present (Node.js native support; same as main run.js)
// For development, place .env in the package directory and run from there.
try {
  process.loadEnvFile();
} catch {
  // .env file not found or not readable, continue without it
}

// Disable telemetry by default in development when both vars are unset.
// Set SFCC_DISABLE_TELEMETRY=false (or SF_DISABLE_TELEMETRY=false) in .env to enable COMMAND_START/COMMAND_SUCCESS.
const userWantsTelemetryEnabled =
  process.env.SF_DISABLE_TELEMETRY === 'false' || process.env.SFCC_DISABLE_TELEMETRY === 'false';
if (userWantsTelemetryEnabled) {
  process.env.SF_DISABLE_TELEMETRY = 'false';
  process.env.SFCC_DISABLE_TELEMETRY = 'false';
} else {
  process.env.SF_DISABLE_TELEMETRY = 'true';
  process.env.SFCC_DISABLE_TELEMETRY = 'true';
}

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
