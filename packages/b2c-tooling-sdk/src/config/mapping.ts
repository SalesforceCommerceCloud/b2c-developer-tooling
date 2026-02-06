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
 * Maps dw.json fields to normalized config format.
 *
 * This is the SINGLE place where dw.json field mapping happens.
 * Handles multiple field name variants for backward compatibility:
 * - WebDAV hostname: `webdav-hostname`, `webdav-server`, `secureHostname`, `secure-server`
 * - Short code: `shortCode`, `short-code`, `scapi-shortcode`
 *
 * @param json - The raw dw.json config
 * @returns Normalized configuration
 *
 * @example
 * ```typescript
 * import { mapDwJsonToNormalizedConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const dwJson = { hostname: 'example.com', 'code-version': 'v1' };
 * const config = mapDwJsonToNormalizedConfig(dwJson);
 * // { hostname: 'example.com', codeVersion: 'v1' }
 * ```
 */
export function mapDwJsonToNormalizedConfig(json: DwJsonConfig): NormalizedConfig {
  return {
    hostname: json.hostname || json.server,
    // Support multiple field names for webdav hostname (priority order)
    webdavHostname: json['webdav-hostname'] || json['webdav-server'] || json.secureHostname || json['secure-server'],
    codeVersion: json['code-version'],
    username: json.username,
    password: json.password,
    clientId: json['client-id'],
    clientSecret: json['client-secret'],
    scopes: json['oauth-scopes'],
    // Support multiple field names for short code (priority order)
    shortCode: json.shortCode || json['short-code'] || json['scapi-shortcode'],
    tenantId: json['tenant-id'],
    sandboxApiHost: json['sandbox-api-host'],
    instanceName: json.name,
    authMethods: json['auth-methods'],
    accountManagerHost: json['account-manager-host'],
    mrtProject: json.mrtProject,
    mrtEnvironment: json.mrtEnvironment,
    mrtApiKey: json.mrtApiKey,
    mrtOrigin: json.mrtOrigin || json.cloudOrigin,
    // TLS/mTLS options
    certificate: json.certificate,
    certificatePassphrase: json['certificate-passphrase'] || json.passphrase,
    selfSigned: json['self-signed'] ?? json.selfsigned,
  };
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
      sandboxApiHost: overrides.sandboxApiHost ?? base.sandboxApiHost,
      instanceName: overrides.instanceName ?? base.instanceName,
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
