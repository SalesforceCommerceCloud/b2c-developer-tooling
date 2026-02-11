#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Disable telemetry in development to avoid polluting production data.
// Honor SF_DISABLE_TELEMETRY (sf CLI) and SFCC_DISABLE_TELEMETRY.
// If user explicitly enables (either is 'false'), respect that and sync both to 'false'.
// Otherwise, default to disabling in dev.
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
