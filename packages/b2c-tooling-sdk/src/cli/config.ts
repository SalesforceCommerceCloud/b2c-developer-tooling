/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * CLI configuration utilities.
 *
 * This module provides configuration loading for CLI commands.
 * It uses the ConfigResolver internally for consistent behavior.
 *
 * @module cli/config
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type {AuthMethod} from '../auth/types.js';
import {ALL_AUTH_METHODS} from '../auth/types.js';
import {createConfigResolver, type NormalizedConfig} from '../config/index.js';
import {findDwJson} from '../config/dw-json.js';
import {getLogger} from '../logging/logger.js';

// Re-export for convenience
export type {AuthMethod};
export {ALL_AUTH_METHODS};
export {findDwJson};

/**
 * Resolved configuration for CLI commands.
 *
 * This type is an alias for NormalizedConfig to maintain backward compatibility
 * with existing CLI code. It may be extended with CLI-specific fields in the future.
 */
export type ResolvedConfig = NormalizedConfig;

/**
 * Options for loading configuration.
 */
export interface LoadConfigOptions {
  /** Named instance from dw.json "configs" array */
  instance?: string;
  /** Explicit path to config file (skips searching if provided) */
  configPath?: string;
  /** Cloud origin for MRT ~/.mobify lookup (e.g., https://cloud-staging.mobify.com) */
  cloudOrigin?: string;
}

/**
 * Loads configuration with precedence: CLI flags/env vars > dw.json
 *
 * OCLIF handles environment variables automatically via flag `env` properties.
 * The flags parameter already contains resolved env var values.
 *
 * Uses ConfigResolver internally for consistent behavior across CLI and SDK.
 *
 * @param flags - Configuration values from CLI flags/env vars
 * @param options - Loading options
 * @returns Resolved configuration
 *
 * @example
 * ```typescript
 * // In a CLI command
 * const config = loadConfig(
 *   { hostname: this.flags.server, clientId: this.flags['client-id'] },
 *   { instance: this.flags.instance }
 * );
 * ```
 */
export function loadConfig(flags: Partial<ResolvedConfig> = {}, options: LoadConfigOptions = {}): ResolvedConfig {
  const logger = getLogger();
  const resolver = createConfigResolver();

  const {config, warnings} = resolver.resolve(flags, {
    instance: options.instance,
    configPath: options.configPath,
    hostnameProtection: true,
    cloudOrigin: options.cloudOrigin,
  });

  // Log warnings
  for (const warning of warnings) {
    logger.trace({warning}, `[Config] ${warning.message}`);
  }

  // Handle instanceName from options if not in resolved config
  // This preserves backward compatibility with the old behavior
  if (!config.instanceName && options.instance) {
    config.instanceName = options.instance;
  }

  return config as ResolvedConfig;
}

/**
 * Mobify config file structure (~/.mobify)
 */
interface MobifyConfig {
  username?: string;
  api_key?: string;
}

/**
 * Result from loading mobify config
 */
export interface MobifyConfigResult {
  apiKey?: string;
  username?: string;
}

/**
 * Loads MRT API key from ~/.mobify config file.
 *
 * The mobify config file is a JSON file located at ~/.mobify containing:
 * ```json
 * {
 *   "username": "user@example.com",
 *   "api_key": "your-api-key"
 * }
 * ```
 *
 * When a cloudOrigin is provided, looks for ~/.mobify--[cloudOrigin] instead.
 * For example, if cloudOrigin is "https://cloud-staging.mobify.com", the file
 * would be ~/.mobify--cloud-staging.mobify.com
 *
 * @param cloudOrigin - Optional cloud origin URL to determine which config file to read
 * @returns The API key and username if found, undefined otherwise
 */
export function loadMobifyConfig(cloudOrigin?: string): MobifyConfigResult {
  const logger = getLogger();

  let mobifyPath: string;
  if (cloudOrigin) {
    // Extract hostname from origin URL for the config file suffix
    try {
      const url = new URL(cloudOrigin);
      mobifyPath = path.join(os.homedir(), `.mobify--${url.hostname}`);
    } catch {
      // If URL parsing fails, use the origin as-is
      mobifyPath = path.join(os.homedir(), `.mobify--${cloudOrigin}`);
    }
  } else {
    mobifyPath = path.join(os.homedir(), '.mobify');
  }

  logger.trace({path: mobifyPath}, '[Config] Checking for mobify config');

  if (!fs.existsSync(mobifyPath)) {
    logger.trace({path: mobifyPath}, '[Config] No mobify config found');
    return {};
  }

  try {
    const content = fs.readFileSync(mobifyPath, 'utf8');
    const config = JSON.parse(content) as MobifyConfig;

    const hasApiKey = Boolean(config.api_key);
    logger.trace({path: mobifyPath, hasApiKey, username: config.username}, '[Config] Loaded mobify config');

    return {
      apiKey: config.api_key,
      username: config.username,
    };
  } catch (error) {
    logger.trace({path: mobifyPath, error}, '[Config] Failed to parse mobify config');
    return {};
  }
}
