/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Utility modules for the B2C DX MCP server.
 *
 * @module utils
 */

// Note: We use .js extensions in imports for ESM compatibility.
// TypeScript resolves .js → .ts at compile time, but the compiled
// output needs .js extensions to work at runtime with Node.js ESM.
export * from './constants.js';
export * from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load a value from the config.json file.
 * @param key - The key to load from the config file
 * @returns The value or undefined if not found
 */
function loadConfigValue(key: string): string | undefined {
  try {
    const cfgPath = path.resolve(__dirname, './config.json');
    if (!fs.existsSync(cfgPath)) return undefined;
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const cfg = JSON.parse(raw) as Record<string, unknown>;
    const v = cfg?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Load the Application Insights connection string from the config.json file.
 * @returns The connection string or undefined if not configured
 */
export function loadAppInsightsKey(): string | undefined {
  return loadConfigValue('applicationInsightsConnectionString');
}
