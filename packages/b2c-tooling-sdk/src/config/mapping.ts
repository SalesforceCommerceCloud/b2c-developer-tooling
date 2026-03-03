/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration mapping utilities.
 *
 * This module provides the single source of truth for mapping between
 * different configuration formats (dw.json, normalized config, etc.).
 *
 * @module config/mapping
 */
import type {AuthConfig} from '../auth/types.js';
import {B2CInstance, type InstanceConfig} from '../instance/index.js';
import type {DwJsonConfig} from './dw-json.js';
import type {NormalizedConfig, ConfigWarning} from './types.js';

/**
 * Converts a kebab-case string to camelCase.
 *
 * @param str - The kebab-case string to convert
 * @returns The camelCase equivalent
 *
 * @example
 * ```typescript
 * kebabToCamelCase('code-version'); // 'codeVersion'
 * kebabToCamelCase('client-id');    // 'clientId'
 * kebabToCamelCase('hostname');     // 'hostname' (no change)
 * ```
 */
export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Legacy/non-standard aliases that cannot be derived by kebab→camel conversion.
 * Maps alias → canonical camelCase field name.
 */
export const CONFIG_KEY_ALIASES: Record<string, string> = {
  server: 'hostname',
  'scapi-shortcode': 'shortCode',
  'webdav-server': 'webdavHostname',
  'secure-server': 'webdavHostname',
  secureHostname: 'webdavHostname',
  passphrase: 'certificatePassphrase',
  cloudOrigin: 'mrtOrigin',
  selfsigned: 'selfSigned',
  'oauth-scopes': 'oauthScopes',
  'auth-methods': 'authMethods',
  'cip-host': 'cipHost',
};

/**
 * Normalizes config keys to canonical camelCase form.
 *
 * Resolution order for each key:
 * 1. Check CONFIG_KEY_ALIASES for legacy/non-standard names
 * 2. Fall back to kebab→camelCase conversion
 * 3. First value wins when multiple keys resolve to the same canonical name
 *
 * @param raw - The raw config object with potentially mixed key formats
 * @returns A new object with all keys in canonical camelCase
 *
 * @example
 * ```typescript
 * normalizeConfigKeys({ 'client-id': 'abc', 'code-version': 'v1' });
 * // { clientId: 'abc', codeVersion: 'v1' }
 *
 * normalizeConfigKeys({ server: 'example.com', hostname: 'other.com' });
 * // { hostname: 'example.com' } (first value wins)
 * ```
 */
export function normalizeConfigKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    const canonical = CONFIG_KEY_ALIASES[key] ?? kebabToCamelCase(key);
    if (!(canonical in result)) {
      result[canonical] = value;
    }
  }
  return result;
}

/**
 * Maps dw.json fields to normalized config format.
 *
 * This is the SINGLE place where dw.json field mapping happens.
 * Keys are already normalized to camelCase by normalizeConfigKeys() in loadDwJson(),
 * so this function only handles genuine renames (e.g., `name` → `instanceName`,
 * `oauthScopes` → `scopes`).
 *
 * @param json - The normalized dw.json config (camelCase keys)
 * @returns Normalized configuration
 *
 * @example
 * ```typescript
 * import { mapDwJsonToNormalizedConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const dwJson = { hostname: 'example.com', codeVersion: 'v1' };
 * const config = mapDwJsonToNormalizedConfig(dwJson);
 * // { hostname: 'example.com', codeVersion: 'v1' }
 * ```
 */
export function mapDwJsonToNormalizedConfig(json: DwJsonConfig): NormalizedConfig {
  return {
    hostname: json.hostname,
    webdavHostname: json.webdavHostname,
    codeVersion: json.codeVersion,
    username: json.username,
    password: json.password,
    clientId: json.clientId,
    clientSecret: json.clientSecret,
    scopes: json.oauthScopes,
    shortCode: json.shortCode,
    tenantId: json.tenantId,
    sandboxApiHost: json.sandboxApiHost,
    realm: json.realm,
    contentLibrary: json.contentLibrary,
    cipHost: json.cipHost,
    instanceName: json.name,
    authMethods: json.authMethods,
    accountManagerHost: json.accountManagerHost,
    mrtProject: json.mrtProject,
    mrtEnvironment: json.mrtEnvironment,
    mrtApiKey: json.mrtApiKey,
    mrtOrigin: json.mrtOrigin,
    // TLS/mTLS options
    certificate: json.certificate,
    certificatePassphrase: json.certificatePassphrase,
    selfSigned: json.selfSigned,
  };
}

/**
 * Maps normalized config to dw.json format.
 *
 * This is the reverse of mapDwJsonToNormalizedConfig. It converts normalized
 * config (camelCase) back to dw.json format (kebab-case).
 *
 * @param config - The normalized configuration
 * @param name - Optional instance name to include
 * @returns DwJsonConfig structure
 *
 * @example
 * ```typescript
 * const config = { hostname: 'example.com', codeVersion: 'v1', clientId: 'abc' };
 * const dwJson = mapNormalizedConfigToDwJson(config, 'staging');
 * // { name: 'staging', hostname: 'example.com', 'code-version': 'v1', 'client-id': 'abc' }
 * ```
 */
export function mapNormalizedConfigToDwJson(config: Partial<NormalizedConfig>, name?: string): DwJsonConfig {
  const result: DwJsonConfig = {};

  if (name !== undefined) {
    result.name = name;
  }
  if (config.hostname !== undefined) {
    result.hostname = config.hostname;
  }
  if (config.webdavHostname !== undefined) {
    result.webdavHostname = config.webdavHostname;
  }
  if (config.codeVersion !== undefined) {
    result.codeVersion = config.codeVersion;
  }
  if (config.username !== undefined) {
    result.username = config.username;
  }
  if (config.password !== undefined) {
    result.password = config.password;
  }
  if (config.clientId !== undefined) {
    result.clientId = config.clientId;
  }
  if (config.clientSecret !== undefined) {
    result.clientSecret = config.clientSecret;
  }
  if (config.scopes !== undefined) {
    result.oauthScopes = config.scopes;
  }
  if (config.shortCode !== undefined) {
    result.shortCode = config.shortCode;
  }
  if (config.tenantId !== undefined) {
    result.tenantId = config.tenantId;
  }
  if (config.authMethods !== undefined) {
    result.authMethods = config.authMethods;
  }
  if (config.accountManagerHost !== undefined) {
    result.accountManagerHost = config.accountManagerHost;
  }
  if (config.cipHost !== undefined) {
    result.cipHost = config.cipHost;
  }
  if (config.mrtProject !== undefined) {
    result.mrtProject = config.mrtProject;
  }
  if (config.mrtEnvironment !== undefined) {
    result.mrtEnvironment = config.mrtEnvironment;
  }
  if (config.mrtOrigin !== undefined) {
    result.mrtOrigin = config.mrtOrigin;
  }
  if (config.certificate !== undefined) {
    result.certificate = config.certificate;
  }
  if (config.certificatePassphrase !== undefined) {
    result.certificatePassphrase = config.certificatePassphrase;
  }
  if (config.selfSigned !== undefined) {
    result.selfSigned = config.selfSigned;
  }

  return result;
}

/**
 * Options for merging configurations.
 */
export interface MergeConfigOptions {
  /**
   * Whether to apply hostname mismatch protection.
   * When true, if overrides.hostname differs from base.hostname,
   * the entire base config is ignored.
   * @default true
   */
  hostnameProtection?: boolean;
}

/**
 * Result of merging configurations.
 */
export interface MergeConfigResult {
  /** The merged configuration */
  config: NormalizedConfig;
  /** Warnings generated during merge (e.g., hostname mismatch) */
  warnings: ConfigWarning[];
  /** Whether a hostname mismatch was detected and base was ignored */
  hostnameMismatch: boolean;
}

/**
 * Merges configurations with hostname mismatch protection.
 *
 * Applies the precedence rule: overrides > base.
 * If hostname protection is enabled and the override hostname differs from
 * the base hostname, the entire base config is ignored to prevent
 * credential leakage between different instances.
 *
 * @param overrides - Higher-priority config values (e.g., from CLI flags/env)
 * @param base - Lower-priority config values (e.g., from dw.json)
 * @param options - Merge options
 * @returns Merged config with warnings
 *
 * @example
 * ```typescript
 * import { mergeConfigsWithProtection } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const { config, warnings } = mergeConfigsWithProtection(
 *   { hostname: 'staging.example.com' },
 *   { hostname: 'prod.example.com', clientId: 'abc' },
 *   { hostnameProtection: true }
 * );
 * // config = { hostname: 'staging.example.com' }
 * // warnings = [{ code: 'HOSTNAME_MISMATCH', ... }]
 * ```
 */
export function mergeConfigsWithProtection(
  overrides: Partial<NormalizedConfig>,
  base: NormalizedConfig,
  options: MergeConfigOptions = {},
): MergeConfigResult {
  const warnings: ConfigWarning[] = [];
  const hostnameProtection = options.hostnameProtection !== false;

  // Check for hostname mismatch
  const hostnameExplicitlyProvided = Boolean(overrides.hostname);
  const hostnameMismatch = hostnameExplicitlyProvided && Boolean(base.hostname) && overrides.hostname !== base.hostname;

  if (hostnameMismatch && hostnameProtection) {
    warnings.push({
      code: 'HOSTNAME_MISMATCH',
      message: `Server override "${overrides.hostname}" differs from config file "${base.hostname}". Config file values ignored.`,
      details: {
        providedHostname: overrides.hostname,
        configHostname: base.hostname,
      },
    });

    // Return only overrides, ignore base entirely
    return {
      config: {...overrides} as NormalizedConfig,
      warnings,
      hostnameMismatch: true,
    };
  }

  // Normal merge - overrides win, use ?? for proper undefined handling
  return {
    config: {
      hostname: overrides.hostname ?? base.hostname,
      webdavHostname: overrides.webdavHostname ?? base.webdavHostname,
      codeVersion: overrides.codeVersion ?? base.codeVersion,
      username: overrides.username ?? base.username,
      password: overrides.password ?? base.password,
      clientId: overrides.clientId ?? base.clientId,
      clientSecret: overrides.clientSecret ?? base.clientSecret,
      scopes: overrides.scopes ?? base.scopes,
      authMethods: overrides.authMethods ?? base.authMethods,
      accountManagerHost: overrides.accountManagerHost ?? base.accountManagerHost,
      shortCode: overrides.shortCode ?? base.shortCode,
      tenantId: overrides.tenantId ?? base.tenantId,
      contentLibrary: overrides.contentLibrary ?? base.contentLibrary,
      cipHost: overrides.cipHost ?? base.cipHost,
      sandboxApiHost: overrides.sandboxApiHost ?? base.sandboxApiHost,
      realm: overrides.realm ?? base.realm,
      instanceName: overrides.instanceName ?? base.instanceName,
      projectDirectory: overrides.projectDirectory ?? base.projectDirectory,
      workingDirectory: overrides.workingDirectory ?? base.workingDirectory,
      mrtProject: overrides.mrtProject ?? base.mrtProject,
      mrtEnvironment: overrides.mrtEnvironment ?? base.mrtEnvironment,
      mrtApiKey: overrides.mrtApiKey ?? base.mrtApiKey,
      mrtOrigin: overrides.mrtOrigin ?? base.mrtOrigin,
      // TLS/mTLS options
      certificate: overrides.certificate ?? base.certificate,
      certificatePassphrase: overrides.certificatePassphrase ?? base.certificatePassphrase,
      selfSigned: overrides.selfSigned ?? base.selfSigned,
    },
    warnings,
    hostnameMismatch: false,
  };
}

/**
 * Gets the list of fields that have values in a config.
 *
 * Used for tracking which sources contributed which fields during
 * configuration resolution.
 *
 * @param config - The configuration to inspect
 * @returns Array of field names that have non-empty values
 *
 * @example
 * ```typescript
 * const config = { hostname: 'example.com', clientId: 'abc' };
 * const fields = getPopulatedFields(config);
 * // ['hostname', 'clientId']
 * ```
 */
export function getPopulatedFields(config: NormalizedConfig): (keyof NormalizedConfig)[] {
  const fields: (keyof NormalizedConfig)[] = [];
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined && value !== null && value !== '') {
      fields.push(key as keyof NormalizedConfig);
    }
  }
  return fields;
}

/**
 * Builds an AuthConfig from a NormalizedConfig.
 *
 * This is the single source of truth for converting normalized config
 * to the AuthConfig format expected by B2CInstance.
 *
 * @param config - The normalized configuration
 * @returns AuthConfig for B2CInstance
 *
 * @example
 * ```typescript
 * const config = {
 *   clientId: 'my-client-id',
 *   clientSecret: 'my-secret',
 *   username: 'admin',
 *   password: 'pass',
 * };
 * const authConfig = buildAuthConfigFromNormalized(config);
 * // { oauth: { clientId: '...', clientSecret: '...' }, basic: { username: '...', password: '...' } }
 * ```
 */
export function buildAuthConfigFromNormalized(config: NormalizedConfig): AuthConfig {
  const authConfig: AuthConfig = {
    authMethods: config.authMethods,
  };

  if (config.username && config.password) {
    authConfig.basic = {
      username: config.username,
      password: config.password,
    };
  }

  if (config.clientId) {
    authConfig.oauth = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scopes: config.scopes,
      accountManagerHost: config.accountManagerHost,
    };
  }

  return authConfig;
}

/**
 * Creates a B2CInstance from a NormalizedConfig.
 *
 * This utility provides a single source of truth for instance creation
 * from resolved configuration. It is used by both ConfigResolver.createInstance()
 * and CLI commands (e.g., InstanceCommand).
 *
 * @param config - The normalized configuration (must include hostname)
 * @returns Configured B2CInstance
 * @throws Error if hostname is not available in config
 *
 * @example
 * ```typescript
 * import { createInstanceFromConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = { hostname: 'example.demandware.net', clientId: 'abc' };
 * const instance = createInstanceFromConfig(config);
 * await instance.webdav.mkcol('Cartridges/v1');
 * ```
 */
export function createInstanceFromConfig(config: NormalizedConfig): B2CInstance {
  if (!config.hostname) {
    throw new Error('Hostname is required. Set in dw.json or provide via overrides.');
  }

  const instanceConfig: InstanceConfig = {
    hostname: config.hostname,
    codeVersion: config.codeVersion,
    webdavHostname: config.webdavHostname,
    // Include TLS options if certificate or self-signed mode is configured
    tlsOptions:
      config.certificate || config.selfSigned
        ? {
            certificate: config.certificate,
            passphrase: config.certificatePassphrase,
            rejectUnauthorized: config.selfSigned !== true,
          }
        : undefined,
  };

  const authConfig = buildAuthConfigFromNormalized(config);

  return new B2CInstance(instanceConfig, authConfig);
}
