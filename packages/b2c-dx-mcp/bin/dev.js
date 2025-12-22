#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning
/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Development entry point for MCP server using oclif.
 *
 * This uses oclif's development mode which:
 * - Uses TypeScript source directly (via ts-node/esm loader in shebang)
 * - Supports the 'development' condition for exports
 * - Provides better error messages and stack traces
 *
 * Run directly: ./bin/dev.js -s all
 * Or with node: node bin/dev.js -s all (uses compiled dist/ files)
 */

import { execute } from "@oclif/core";

await execute({ development: true, dir: import.meta.url });
