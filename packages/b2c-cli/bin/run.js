#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {execute} from '@oclif/core';
import {preloadEnvFile} from '@salesforce/b2c-tooling-sdk/config';

// Apply the project .env (or --dotenv-file / SFCC_DOTENV_FILE) before oclif starts so
// hooks and plugins see it. Shell variables are never overridden.
preloadEnvFile();

await execute({dir: import.meta.url});
