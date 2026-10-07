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
import {readFileSync, writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import type {AuthMethod} from '../../auth/types.js';
import {CLIENT_AUTH_METHODS} from '../../auth/client-credentials.js';
import {getPopulatedFields} from '../mapping.js';
import type {
  ConfigSource,
  ConfigLoadResult,
  ConfigUpdateResult,
  NormalizedConfig,
  ResolveConfigOptions,
} from '../types.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Storefront Next variables accepted as fallbacks for equivalent toolkit settings.
 *
 * These are read by {@link StorefrontNextEnvSource}, which sits below dw.json:
 * they only fill settings that the selected instance and toolkit variables leave unset.
 */
export const STOREFRONT_NEXT_ENV_VAR_MAP: Record<string, keyof NormalizedConfig> = {
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
  SFCC_SCAPI_SCHEMAS: 'scapiSchemas',
  SFCC_AUTH_METHODS: 'authMethods',
  SFCC_ACCOUNT_MANAGER_HOST: 'accountManagerHost',
  SFCC_CLIENT_AUTH_METHOD: 'clientAuthMethod',
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

/** Fields that should be parsed as comma-separated arrays. */
const ARRAY_FIELDS = new Set<keyof NormalizedConfig>([
  'scopes',
  'authMethods',
  'cartridges',
  'importSetExclude',
  'catalogs',
  'docsCategories',
  'scapiSchemas',
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
  clientAuthMethod: CLIENT_AUTH_METHODS,
  mrtBackend: ['auto', 'legacy', 'scapi'],
};

/**
 * Maps environment variables to config fields, applying enum, boolean and array parsing.
 */
function readEnvironmentConfig(
  env: Record<string, string | undefined>,
  map: Record<string, keyof NormalizedConfig>,
  sourceName: string,
): NormalizedConfig {
  const logger = getLogger();
  const config: NormalizedConfig = {};

  for (const [envVar, configField] of Object.entries(map)) {
    const value = env[envVar];
    if (value === undefined || value === '') continue;

    const allowed = ENUM_FIELDS[configField];
    if (allowed && !allowed.includes(value)) {
      logger.warn(`[${sourceName}] Ignoring ${envVar}: "${value}" is not one of ${allowed.join(', ')}`);
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

  return config;
}

/** Options for environment-backed config sources. */
export interface EnvSourceOptions {
  /** Source name for diagnostics (default: `EnvSource`) */
  name?: string;
  /** Location reported for diagnostics (default: `environment variables`) */
  location?: string;
}

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
 * Storefront Next variables are not read here; add a
 * {@link StorefrontNextEnvSource} for those.
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
  readonly name: string;
  readonly priority = -10;

  private readonly env: Record<string, string | undefined>;
  private readonly location: string;

  /**
   * @param env - Environment object to read from. Defaults to `process.env`.
   * @param options - Diagnostic name and location
   */
  constructor(env?: Record<string, string | undefined>, options: EnvSourceOptions = {}) {
    this.env = env ?? process.env;
    this.name = options.name ?? 'EnvSource';
    this.location = options.location ?? 'environment variables';
  }

  load(_options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const logger = getLogger();
    const config = readEnvironmentConfig(this.env, ENV_VAR_MAP, this.name);

    const fields = getPopulatedFields(config);
    if (fields.length === 0) {
      logger.trace(`[${this.name}] No supported B2C environment variables found`);
      return undefined;
    }

    logger.trace({fields}, `[${this.name}] Loaded config from environment variables`);

    return {config, location: this.location};
  }
}

const ENV_LINE = /^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;

/** Format a config value in the comma-separated form {@link EnvSource} reads. */
function formatEnvValue(field: string, value: unknown): string {
  let text: string;
  if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'boolean' || typeof value === 'number') {
    text = String(value);
  } else if (Array.isArray(value) && value.every((item) => typeof item === 'string' && !item.includes(','))) {
    text = value.join(',');
  } else {
    throw new Error(`${field} can't be represented as an environment variable; set it in dw.json instead.`);
  }
  if (/^[^\s#'"`\\]*$/.test(text)) return text;
  if (!text.includes("'") && !text.includes('\n')) return `'${text}'`;
  throw new Error(`${field} contains characters that can't be written safely to a .env file.`);
}

/** Line indices of assignments to `names`, refusing multi-line values that can't be edited safely. */
function findAssignments(lines: string[], names: string[]): Array<{index: number; name: string; prefix: string}> {
  const found: Array<{index: number; name: string; prefix: string}> = [];
  for (const [index, line] of lines.entries()) {
    const match = ENV_LINE.exec(line);
    if (!match || !names.includes(match[2])) continue;
    const value = match[3].trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'" || quote === '`') && value.indexOf(quote, 1) === -1) {
      throw new Error(`${match[2]} spans multiple lines in the .env file; edit it by hand.`);
    }
    found.push({index, name: match[2], prefix: match[1]});
  }
  return found;
}

/**
 * The project `.env` file, as a writable configuration source.
 *
 * Reads like {@link EnvSource}. Writes edit the file in place: the
 * highest-precedence variable already present for a field is replaced,
 * otherwise the field's canonical (highest-precedence) variable is appended. Removing a field
 * deletes every variable that maps to it.
 *
 * @internal
 */
export class DotenvFileSource extends EnvSource {
  /**
   * @param filePath - The .env file
   * @param env - Values applied from the file (defaults to the file's contents)
   */
  constructor(
    private readonly filePath: string,
    env?: Record<string, string | undefined>,
  ) {
    super(env ?? parseEnv(readFileSync(filePath, 'utf8')), {name: 'DotenvFile', location: filePath});
  }

  updateConfig(patch: Partial<NormalizedConfig>, _options: ResolveConfigOptions): ConfigUpdateResult {
    let lines = readFileSync(this.filePath, 'utf8').split('\n');
    for (const [field, value] of Object.entries(patch)) {
      // ENV_VAR_MAP lists aliases from lowest to highest precedence.
      const names = Object.entries(ENV_VAR_MAP)
        .filter(([, mapped]) => mapped === field)
        .map(([name]) => name);
      if (names.length === 0) throw new Error(`${field} has no environment variable form; set it in dw.json instead.`);
      const assignments = findAssignments(lines, names);
      if (value === undefined) {
        const removed = new Set(assignments.map((assignment) => assignment.index));
        lines = lines.filter((_line, index) => !removed.has(index));
        continue;
      }
      const text = formatEnvValue(field, value);
      const current = assignments.sort((a, b) => names.indexOf(b.name) - names.indexOf(a.name))[0];
      if (current) {
        lines[current.index] = `${current.prefix}${current.name}=${text}`;
      } else {
        const name = names.at(-1)!;
        if (lines.at(-1) === '') lines.splice(-1, 0, `${name}=${text}`);
        else lines.push(`${name}=${text}`, '');
      }
    }
    writeFileSync(this.filePath, lines.join('\n'), 'utf8');
    return {location: this.filePath};
  }
}

/**
 * Configuration source for Storefront Next environment variables
 * (`PUBLIC__app__commerce__api__*`, `COMMERCE_API_SLAS_SECRET`, `PUBLIC__app__defaultSiteId`).
 *
 * Priority 1 (just below dw.json at 0): these values are borrowed from the
 * storefront app, so they only fill settings that flags, toolkit variables and
 * the selected dw.json instance leave unset. Credential pairs are still merged
 * as a group, so a Storefront Next SLAS secret is never paired with a
 * different source's SLAS client ID.
 *
 * @internal
 */
export class StorefrontNextEnvSource implements ConfigSource {
  readonly name: string;
  readonly priority = 1;
  /**
   * Present when every value came from one .env file: writes there use toolkit
   * (`SFCC_*`) variables. Settings the Storefront Next variables hold are
   * refused, since those belong to the storefront app.
   */
  readonly updateConfig?: (patch: Partial<NormalizedConfig>, options: ResolveConfigOptions) => ConfigUpdateResult;

  private readonly env: Record<string, string | undefined>;
  private readonly location: string;

  /**
   * @param env - Environment object to read from. Defaults to `process.env`.
   * @param options - Diagnostic name and location; `envFile` makes the source writable
   */
  constructor(env?: Record<string, string | undefined>, options: EnvSourceOptions & {envFile?: string} = {}) {
    this.env = env ?? process.env;
    this.name = options.name ?? 'StorefrontNextEnvSource';
    this.location = options.location ?? 'environment variables';
    const {envFile} = options;
    if (envFile) {
      this.updateConfig = (patch, updateOptions) => {
        for (const field of Object.keys(patch)) {
          const variable = Object.keys(STOREFRONT_NEXT_ENV_VAR_MAP).find(
            (name) => STOREFRONT_NEXT_ENV_VAR_MAP[name] === field,
          );
          if (variable) {
            throw new Error(
              `${field} is a Storefront Next setting (${variable} in ${envFile}) that the storefront app also reads. Change it there.`,
            );
          }
        }
        return new DotenvFileSource(envFile).updateConfig(patch, updateOptions);
      };
    }
  }

  load(_options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const config = readEnvironmentConfig(this.env, STOREFRONT_NEXT_ENV_VAR_MAP, this.name);
    if (getPopulatedFields(config).length === 0) return undefined;
    return {config, location: this.location};
  }
}
