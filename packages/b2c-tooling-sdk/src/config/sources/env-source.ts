/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Environment variable configuration source.
 *
 * Maps SFCC_* environment variables to NormalizedConfig fields.
 * Not included in default sources — opt-in only via `sourcesBefore`.
 *
 * @internal This module is internal to the SDK. Use ConfigResolver instead.
 */
import type {AuthMethod} from '../../auth/types.js';
import {getPopulatedFields} from '../mapping.js';
import type {ConfigSource, ConfigLoadResult, NormalizedConfig, ResolveConfigOptions} from '../types.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Mapping of SFCC_* environment variable names to NormalizedConfig field names.
 */
const ENV_VAR_MAP: Record<string, keyof NormalizedConfig> = {
  SFCC_SERVER: 'hostname',
  SFCC_WEBDAV_SERVER: 'webdavHostname',
  SFCC_CODE_VERSION: 'codeVersion',
  SFCC_USERNAME: 'username',
  SFCC_PASSWORD: 'password',
  SFCC_CERTIFICATE: 'certificate',
  SFCC_CERTIFICATE_PASSPHRASE: 'certificatePassphrase',
  SFCC_SELFSIGNED: 'selfSigned',
  SFCC_CLIENT_ID: 'clientId',
  SFCC_CLIENT_SECRET: 'clientSecret',
  SFCC_OAUTH_SCOPES: 'scopes',
  SFCC_SHORTCODE: 'shortCode',
  SFCC_TENANT_ID: 'tenantId',
  SFCC_CARTRIDGES: 'cartridges',
  SFCC_AUTH_METHODS: 'authMethods',
  SFCC_ACCOUNT_MANAGER_HOST: 'accountManagerHost',
  SFCC_SANDBOX_API_HOST: 'sandboxApiHost',
  // MRT env vars — MRT_* listed first as fallback, SFCC_MRT_* listed second to take precedence
  MRT_API_KEY: 'mrtApiKey',
  SFCC_MRT_API_KEY: 'mrtApiKey',
  MRT_PROJECT: 'mrtProject',
  SFCC_MRT_PROJECT: 'mrtProject',
  MRT_ENVIRONMENT: 'mrtEnvironment',
  SFCC_MRT_ENVIRONMENT: 'mrtEnvironment',
  MRT_CLOUD_ORIGIN: 'mrtOrigin',
  SFCC_MRT_CLOUD_ORIGIN: 'mrtOrigin',
};

/** Fields that should be parsed as comma-separated arrays. */
const ARRAY_FIELDS = new Set<keyof NormalizedConfig>(['scopes', 'authMethods', 'cartridges']);

/** Fields that should be parsed as booleans. */
const BOOLEAN_FIELDS = new Set<keyof NormalizedConfig>(['selfSigned']);

/**
 * Configuration source that reads SFCC_* environment variables.
 *
 * Priority -10 (higher than dw.json at 0), matching CLI behavior where
 * env vars override file-based config.
 *
 * Not added to default sources — opt-in only. The CLI handles env vars
 * via oclif flag `env:` mappings; this source is for consumers like
 * the VS Code extension that call `resolveConfig()` directly.
 *
 * @example
 * ```typescript
 * import { resolveConfig, EnvSource } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig({}, {
 *   sourcesBefore: [new EnvSource()],
 * });
 * ```
 *
 * @internal
 */
export class EnvSource implements ConfigSource {
  readonly name = 'EnvSource';
  readonly priority = -10;

  private readonly env: Record<string, string | undefined>;

  /**
   * @param env - Environment object to read from. Defaults to `process.env`.
   */
  constructor(env?: Record<string, string | undefined>) {
    this.env = env ?? process.env;
  }

  load(_options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const logger = getLogger();
    const config: NormalizedConfig = {};

    for (const [envVar, configField] of Object.entries(ENV_VAR_MAP)) {
      const value = this.env[envVar];
      if (value === undefined || value === '') continue;

      if (BOOLEAN_FIELDS.has(configField)) {
        (config as Record<string, unknown>)[configField] = value === 'true' || value === '1';
      } else if (ARRAY_FIELDS.has(configField)) {
        (config as Record<string, unknown>)[configField] = value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean) as string[] | AuthMethod[];
      } else {
        (config as Record<string, unknown>)[configField] = value;
      }
    }

    const fields = getPopulatedFields(config);
    if (fields.length === 0) {
      logger.trace('[EnvSource] No SFCC_* environment variables found');
      return undefined;
    }

    logger.trace({fields}, '[EnvSource] Loaded config from environment variables');

    return {config, location: 'environment variables'};
  }
}
