/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Mobify (~/.mobify) configuration source for MRT API key.
 *
 * @internal This module is internal to the SDK. Use ConfigResolver instead.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type {ConfigSource, ConfigLoadResult, ResolveConfigOptions} from '../types.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Mobify config file structure (~/.mobify)
 */
interface MobifyConfigFile {
  username?: string;
  api_key?: string;
}

/**
 * Configuration source that loads MRT API key from ~/.mobify file.
 *
 * The mobify config file is a JSON file located at ~/.mobify containing:
 * ```json
 * {
 *   "username": "user@example.com",
 *   "api_key": "your-api-key"
 * }
 * ```
 *
 * When a cloudOrigin is provided in options, looks for ~/.mobify--[hostname] instead.
 *
 * @internal
 */
export class MobifySource implements ConfigSource {
  readonly name = 'MobifySource';
  readonly priority = 0;

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const logger = getLogger();

    // Use explicit credentialsFile if provided, otherwise use default path
    const mobifyPath = options.credentialsFile ?? this.getMobifyPath(options.cloudOrigin);

    logger.trace({location: mobifyPath}, '[MobifySource] Checking for credentials file');

    if (!fs.existsSync(mobifyPath)) {
      logger.trace({location: mobifyPath}, '[MobifySource] No credentials file found');
      return undefined;
    }

    try {
      const content = fs.readFileSync(mobifyPath, 'utf8');
      const config = JSON.parse(content) as MobifyConfigFile;

      if (!config.api_key) {
        logger.trace({location: mobifyPath}, '[MobifySource] Credentials file found but no api_key present');
        return undefined;
      }

      logger.trace({location: mobifyPath, fields: ['mrtApiKey']}, '[MobifySource] Loaded credentials');

      return {
        config: {mrtApiKey: config.api_key},
        location: mobifyPath,
      };
    } catch (error) {
      // Invalid JSON or read error
      const message = error instanceof Error ? error.message : String(error);
      logger.trace({location: mobifyPath, error: message}, '[MobifySource] Failed to parse credentials file');
      return undefined;
    }
  }

  /**
   * Determines the mobify config file path based on cloud origin.
   */
  private getMobifyPath(cloudOrigin?: string): string {
    if (cloudOrigin) {
      // Extract hostname from origin URL for the config file suffix
      try {
        const url = new URL(cloudOrigin);
        return path.join(os.homedir(), `.mobify--${url.hostname}`);
      } catch {
        // If URL parsing fails, use the origin as-is
        return path.join(os.homedir(), `.mobify--${cloudOrigin}`);
      }
    }
    return path.join(os.homedir(), '.mobify');
  }
}
