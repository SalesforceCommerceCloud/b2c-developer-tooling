#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// The project .env (or --dotenv-file / SFCC_DOTENV_FILE) is loaded by each command
// before its flags are parsed, so it is not loaded here.

import {execute} from '@oclif/core';

await execute({dir: import.meta.url});
