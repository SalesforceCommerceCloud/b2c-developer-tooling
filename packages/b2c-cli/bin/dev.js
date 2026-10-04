#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync, readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';

// The project .env (or --dotenv-file / SFCC_DOTENV_FILE) is loaded by each command
// before its flags are parsed. Only the telemetry opt-in is read from ./.env here.
const dotEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
const telemetrySetting = (name) => process.env[name] ?? dotEnv[name];

// Disable telemetry by default in development when both vars are unset.
// Set SFCC_DISABLE_TELEMETRY=false (or SF_DISABLE_TELEMETRY=false) in .env to enable COMMAND_START/COMMAND_SUCCESS.
const userWantsTelemetryEnabled =
  telemetrySetting('SF_DISABLE_TELEMETRY') === 'false' || telemetrySetting('SFCC_DISABLE_TELEMETRY') === 'false';
if (userWantsTelemetryEnabled) {
  process.env.SF_DISABLE_TELEMETRY = 'false';
  process.env.SFCC_DISABLE_TELEMETRY = 'false';
} else {
  process.env.SF_DISABLE_TELEMETRY = 'true';
  process.env.SFCC_DISABLE_TELEMETRY = 'true';
}

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
