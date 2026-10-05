#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Production entry point for MCP server using oclif.
 *
 * This uses oclif's production mode which:
 * - Uses compiled JavaScript from dist/
 * - Loads the project .env (or --dotenv-file / SFCC_DOTENV_FILE) for local configuration
 *
 */

import {execute} from '@oclif/core';
import {preloadEnvFile} from '@salesforce/b2c-tooling-sdk/config';

// Shell variables are never overridden.
preloadEnvFile();

await execute({dir: import.meta.url});
