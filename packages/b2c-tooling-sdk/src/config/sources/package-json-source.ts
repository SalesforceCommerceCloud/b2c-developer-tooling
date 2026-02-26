/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * package.json configuration source.
 *
 * Reads configuration from the `b2c` key in package.json.
 * Only loads from cwd (project root), not from parent directories.
 *
 * @internal This module is internal to the SDK. Use ConfigResolver instead.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {ConfigSource, ConfigLoadResult, ResolveConfigOptions, NormalizedConfig} from '../types.js';
import {getPopulatedFields, normalizeConfigKeys} from '../mapping.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Fields allowed to be configured in package.json.
 * These are non-sensitive, non-instance-specific configuration.
 */
const ALLOWED_FIELDS: (keyof NormalizedConfig)[] = [
  'shortCode',
  'clientId',
  'contentLibrary',
  'mrtProject',
  'mrtOrigin',
  'accountManagerHost',
  'sandboxApiHost',
];

/**
 * Structure of the b2c config in package.json
 */
interface PackageJsonB2CConfig {
  shortCode?: string;
  clientId?: string;
  contentLibrary?: string;
  mrtProject?: string;
  mrtOrigin?: string;
  accountManagerHost?: string;
  sandboxApiHost?: string;
  [key: string]: unknown;
}

/**
 * Configuration source that loads from package.json `b2c` key.
 *
 * This source has the lowest priority (1000) and only provides
 * non-sensitive, project-level defaults.
 *
 * @internal
 */
export class PackageJsonSource implements ConfigSource {
  readonly name = 'PackageJsonSource';
  readonly priority = 1000;

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const logger = getLogger();

    // Only look in cwd (or projectDirectory if provided)
    const searchDir = options.projectDirectory ?? options.workingDirectory ?? process.cwd();
    const packageJsonPath = path.join(searchDir, 'package.json');

    logger.trace({location: packageJsonPath}, '[PackageJsonSource] Checking for package.json');

    if (!fs.existsSync(packageJsonPath)) {
      logger.trace('[PackageJsonSource] No package.json found');
      return undefined;
    }

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content) as {b2c?: PackageJsonB2CConfig};

      if (!packageJson.b2c) {
        logger.trace('[PackageJsonSource] No b2c key in package.json');
        return undefined;
      }

      // Normalize keys to camelCase (accepts both kebab-case and camelCase)
      const b2cConfig = normalizeConfigKeys(packageJson.b2c as Record<string, unknown>);
      const config: NormalizedConfig = {};

      // Only copy allowed fields
      for (const field of ALLOWED_FIELDS) {
        const value = b2cConfig[field];
        if (value !== undefined) {
          (config as Record<string, unknown>)[field] = value;
        }
      }

      // Warn about disallowed fields (check post-normalization keys)
      const disallowedFields = Object.keys(b2cConfig).filter(
        (key) => !ALLOWED_FIELDS.includes(key as keyof NormalizedConfig),
      );
      if (disallowedFields.length > 0) {
        logger.warn(
          {disallowedFields},
          '[PackageJsonSource] Ignoring sensitive/instance-specific fields in package.json b2c config',
        );
      }

      const fields = getPopulatedFields(config);
      if (fields.length === 0) {
        logger.trace('[PackageJsonSource] b2c key present but no allowed fields populated');
        return undefined;
      }

      logger.trace({location: packageJsonPath, fields}, '[PackageJsonSource] Loaded config');

      return {config, location: packageJsonPath};
    } catch (error) {
      // Invalid JSON or read error - log at trace level and re-throw
      // The resolver will catch this and create a SOURCE_ERROR warning
      const message = error instanceof Error ? error.message : String(error);
      logger.trace({location: packageJsonPath, error: message}, '[PackageJsonSource] Failed to parse package.json');
      throw error;
    }
  }
}
