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
 * Utility modules for the B2C DX MCP server.
 *
 * @module utils
 */

// Note: We use .js extensions in imports for ESM compatibility.
// TypeScript resolves .js → .ts at compile time, but the compiled
// output needs .js extensions to work at runtime with Node.js ESM.
export * from "./constants.js";
export * from "./types.js";
