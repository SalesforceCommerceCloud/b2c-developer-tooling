#!/usr/bin/env -S node --conditions development
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
// Disable telemetry by default in development mode (after loading .env so user config is respected)
// Support both SF_DISABLE_TELEMETRY (sf CLI standard) and SFCC_DISABLE_TELEMETRY
process.env.SF_DISABLE_TELEMETRY ??= 'true';
process.env.SFCC_DISABLE_TELEMETRY ??= 'true';
