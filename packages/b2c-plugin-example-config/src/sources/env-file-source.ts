/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Example ConfigSource that loads configuration from a .env.b2c file.
 *
 * This demonstrates how plugin authors can implement custom configuration
 * sources that integrate with the B2C CLI configuration resolution system.
 */
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import type {ConfigSource, ConfigLoadResult, ResolveConfigOptions} from '@salesforce/b2c-tooling-sdk/config';

/**
 * ConfigSource implementation that loads from .env.b2c files.
 *
 * ## Configuration
 *
 * Set `B2C_ENV_FILE_PATH` to override the default file location:
 *
 * ```bash
 * export B2C_ENV_FILE_PATH=/path/to/custom/.env.b2c
 * b2c code deploy
 * ```
 *
 * ## Supported Fields
 *
 * The .env.b2c file supports the following environment variables:
 * - HOSTNAME: B2C instance hostname
 * - WEBDAV_HOSTNAME: Separate WebDAV hostname (optional)
 * - CODE_VERSION: Code version
 * - USERNAME: Basic auth username
 * - PASSWORD: Basic auth password
 * - CLIENT_ID: OAuth client ID
 * - CLIENT_SECRET: OAuth client secret
 * - SCOPES: OAuth scopes (comma-separated)
 * - SHORT_CODE: SCAPI short code
 * - MRT_PROJECT: MRT project slug
 * - MRT_ENVIRONMENT: MRT environment name
 * - MRT_API_KEY: MRT API key
 *
 * @example
 * ```
 * # .env.b2c
 * HOSTNAME=example.sandbox.us03.dx.commercecloud.salesforce.com
 * CLIENT_ID=my-client-id
 * CLIENT_SECRET=my-client-secret
 * CODE_VERSION=version1
 * ```
 */
export class EnvFileSource implements ConfigSource {
  readonly name = 'env-file (.env.b2c)';

  /**
   * Load configuration from .env.b2c file.
   *
   * File location priority:
   * 1. B2C_ENV_FILE_PATH environment variable (explicit override)
   * 2. .env.b2c in workingDirectory (from options)
   * 3. .env.b2c in current working directory
   *
   * @param options - Resolution options (workingDirectory used for file lookup)
   * @returns Parsed configuration and location, or undefined if file not found
   */
  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    // Check for explicit path override via environment variable
    const envOverride = process.env.B2C_ENV_FILE_PATH;
    let envFilePath: string;
    if (envOverride) {
      envFilePath = envOverride;
    } else {
      const searchDir = options.workingDirectory ?? process.cwd();
      envFilePath = join(searchDir, '.env.b2c');
    }

    if (!existsSync(envFilePath)) {
      return undefined;
    }

    const content = readFileSync(envFilePath, 'utf-8');
    const vars = this.parseEnvFile(content);

    return {
      config: {
        hostname: vars.HOSTNAME,
        webdavHostname: vars.WEBDAV_HOSTNAME,
        codeVersion: vars.CODE_VERSION,
        username: vars.USERNAME,
        password: vars.PASSWORD,
        clientId: vars.CLIENT_ID,
        clientSecret: vars.CLIENT_SECRET,
        scopes: vars.SCOPES ? vars.SCOPES.split(',').map((s) => s.trim()) : undefined,
        shortCode: vars.SHORT_CODE,
        mrtProject: vars.MRT_PROJECT,
        mrtEnvironment: vars.MRT_ENVIRONMENT,
        mrtApiKey: vars.MRT_API_KEY,
      },
      location: envFilePath,
    };
  }

  /**
   * Parse a .env file format into key-value pairs.
   *
   * @param content - File content
   * @returns Parsed environment variables
   */
  private parseEnvFile(content: string): Record<string, string | undefined> {
    const vars: Record<string, string | undefined> = {};

    for (const line of content.split('\n')) {
      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE format
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Handle quoted values
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      vars[key] = value;
    }

    return vars;
  }
}
