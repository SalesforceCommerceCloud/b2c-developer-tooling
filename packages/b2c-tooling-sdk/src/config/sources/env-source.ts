/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Environment variable configuration source.
 *
 * Maps CLI configuration environment variables to NormalizedConfig fields.
 * Not included in default sources — opt-in only via `sourcesBefore`.
 *
 * @internal This module is internal to the SDK. Use ConfigResolver instead.
 */
import type {AuthMethod} from '../../auth/types.js';
import {getPopulatedFields} from '../mapping.js';
import type {ConfigSource, ConfigLoadResult, NormalizedConfig, ResolveConfigOptions} from '../types.js';
import {getLogger} from '../../logging/logger.js';

/** Storefront Next variables accepted as fallbacks for equivalent toolkit settings. */
const STOREFRONT_NEXT_ENV_VAR_MAP: Record<string, keyof NormalizedConfig> = {
  PUBLIC__app__commerce__api__clientId: 'slasClientId',
  PUBLIC__app__commerce__api__organizationId: 'tenantId',
  PUBLIC__app__commerce__api__shortCode: 'shortCode',
  COMMERCE_API_SLAS_SECRET: 'slasClientSecret',
  PUBLIC__app__defaultSiteId: 'siteId',
};

/**
 * Mapping of CLI environment variable names and aliases to NormalizedConfig fields.
 */
const ENV_VAR_MAP: Record<string, keyof NormalizedConfig> = {
  // Storefront Next aliases — listed first so toolkit-specific names win
  ...STOREFRONT_NEXT_ENV_VAR_MAP,
  // sfcc-ci legacy aliases — listed first so canonical names below take precedence
  SFCC_OAUTH_CLIENT_ID: 'clientId',
  SFCC_OAUTH_CLIENT_SECRET: 'clientSecret',
  SFCC_LOGIN_URL: 'accountManagerHost',
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
  SFCC_SHORT_CODE: 'shortCode',
  SFCC_SHORTCODE: 'shortCode',
  SFCC_TENANT_ID: 'tenantId',
  SFCC_SLAS_CLIENT_ID: 'slasClientId',
  SFCC_SLAS_CLIENT_SECRET: 'slasClientSecret',
  SFCC_SITE_ID: 'siteId',
  SFCC_CARTRIDGES: 'cartridges',
  SFCC_IMPORT_SET_EXCLUDE: 'importSetExclude',
  SFCC_CATALOGS: 'catalogs',
  SFCC_LIBRARIES: 'libraries',
  SFCC_ASSET_QUERY: 'assetQuery',
  SFCC_DOCS_CATEGORIES: 'docsCategories',
  SFCC_AUTH_METHODS: 'authMethods',
  SFCC_ACCOUNT_MANAGER_HOST: 'accountManagerHost',
  SFCC_SANDBOX_API_HOST: 'sandboxApiHost',
  SFCC_API_BACKEND: 'apiBackend',
  SFCC_CIP_HOST: 'cipHost',
  // JWT Bearer auth env vars
  SFCC_JWT_CERT: 'jwtCertPath',
  SFCC_JWT_KEY: 'jwtKeyPath',
  SFCC_JWT_PASSPHRASE: 'jwtPassphrase',
  // MRT aliases — listed from lowest to highest precedence to match MrtCommand flags
  SFCC_MRT_API_KEY: 'mrtApiKey',
  MRT_API_KEY: 'mrtApiKey',
  SFCC_MRT_PROJECT: 'mrtProject',
  MRT_PROJECT: 'mrtProject',
  MRT_TARGET: 'mrtEnvironment',
  SFCC_MRT_ENVIRONMENT: 'mrtEnvironment',
  MRT_ENVIRONMENT: 'mrtEnvironment',
  SFCC_MRT_CLOUD_ORIGIN: 'mrtOrigin',
  MRT_CLOUD_ORIGIN: 'mrtOrigin',
  SFCC_MRT_BACKEND: 'mrtBackend',
  MRT_BACKEND: 'mrtBackend',
};

/**
 * Reads only the Storefront Next compatibility variables.
 *
 * Used by the CLI as a lower-priority fallback after oclif has resolved explicit
 * flags and the toolkit's canonical environment variables.
 *
 * @internal
 */
export function getStorefrontNextEnvironmentConfig(
  env: Record<string, string | undefined> = process.env,
): Partial<NormalizedConfig> {
  const config: Partial<NormalizedConfig> = {};
  for (const [envVar, configField] of Object.entries(STOREFRONT_NEXT_ENV_VAR_MAP)) {
    const value = env[envVar];
    if (value !== undefined && value !== '') {
      (config as Record<string, unknown>)[configField] = value;
    }
  }

  return config;
}

/** Fields that should be parsed as comma-separated arrays. */
const ARRAY_FIELDS = new Set<keyof NormalizedConfig>([
  'scopes',
  'authMethods',
  'cartridges',
  'importSetExclude',
  'catalogs',
  'docsCategories',
  'libraries',
  'assetQuery',
]);

/** Fields that should be parsed as booleans. */
const BOOLEAN_FIELDS = new Set<keyof NormalizedConfig>(['selfSigned']);

/**
 * Enum-valued fields and their allowed values. Values outside the set are
 * skipped with a warning, mirroring the CLI flag's `options` validation so the
 * env var behaves the same for SDK consumers (e.g. the VS Code extension).
 */
const ENUM_FIELDS: Partial<Record<keyof NormalizedConfig, readonly string[]>> = {
  apiBackend: ['ocapi', 'scapi', 'auto'],
  mrtBackend: ['auto', 'legacy', 'scapi'],
};

/**
 * Configuration source that reads CLI configuration environment variables.
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

      const allowed = ENUM_FIELDS[configField];
      if (allowed && !allowed.includes(value)) {
        logger.warn(`[EnvSource] Ignoring ${envVar}: "${value}" is not one of ${allowed.join(', ')}`);
        continue;
      }

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
      logger.trace('[EnvSource] No supported B2C environment variables found');
      return undefined;
    }

    logger.trace({fields}, '[EnvSource] Loaded config from environment variables');

    return {config, location: 'environment variables'};
  }
}
