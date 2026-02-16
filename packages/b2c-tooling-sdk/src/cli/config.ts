/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * CLI configuration utilities.
 *
 * This module provides configuration loading for CLI commands.
 * It uses {@link resolveConfig} internally for consistent behavior.
 *
 * @module cli/config
 */
import type {AuthMethod} from '../auth/types.js';
import {ALL_AUTH_METHODS} from '../auth/types.js';
import {resolveConfig, type NormalizedConfig, type ConfigSource, type ResolvedB2CConfig} from '../config/index.js';
import {findDwJson} from '../config/dw-json.js';
import {getLogger} from '../logging/logger.js';

// Re-export for convenience
export type {AuthMethod};
export {ALL_AUTH_METHODS};
export {findDwJson};

/**
 * Type for oclif parsed flags object.
 * Using Record<string, unknown> since flags can have various types.
 */
export type ParsedFlags = Record<string, unknown>;

/**
 * Extracts OAuth-related configuration from oclif flags.
 *
 * Use this to extract OAuth flags (--client-id, --client-secret, etc.)
 * from parsed oclif flags into a NormalizedConfig partial.
 *
 * @param flags - Parsed oclif flags
 * @returns Partial NormalizedConfig with OAuth fields
 *
 * @example
 * ```typescript
 * const flagConfig = extractOAuthFlags(this.flags);
 * return loadConfig(flagConfig, options);
 * ```
 */
export function extractOAuthFlags(flags: ParsedFlags): Partial<NormalizedConfig> {
  const scopes = flags['auth-scope'] as string[] | undefined;

  // Parse auth methods from --auth-methods or --user-auth flag
  const authMethodValues = flags['auth-methods'] as string[] | undefined;
  let authMethods: AuthMethod[] | undefined;
  if (flags['user-auth']) {
    authMethods = ['implicit'];
  } else if (authMethodValues && authMethodValues.length > 0) {
    const methods = authMethodValues
      .map((s) => s.trim())
      .filter((s): s is AuthMethod => ALL_AUTH_METHODS.includes(s as AuthMethod));
    authMethods = methods.length > 0 ? methods : undefined;
  }

  return {
    clientId: flags['client-id'] as string | undefined,
    clientSecret: flags['client-secret'] as string | undefined,
    shortCode: flags['short-code'] as string | undefined,
    tenantId: flags['tenant-id'] as string | undefined,
    authMethods,
    accountManagerHost: flags['account-manager-host'] as string | undefined,
    scopes: scopes && scopes.length > 0 ? scopes : undefined,
  };
}

/**
 * Extracts ODS-related configuration from oclif flags.
 *
 * Includes OAuth flags since ODS operations require OAuth authentication.
 *
 * @param flags - Parsed oclif flags
 * @returns Partial NormalizedConfig with ODS and OAuth fields
 */
export function extractOdsFlags(flags: ParsedFlags): Partial<NormalizedConfig> {
  return {
    sandboxApiHost: flags['sandbox-api-host'] as string | undefined,
    ...extractOAuthFlags(flags),
  };
}

/**
 * Extracts B2C instance-related configuration from oclif flags.
 *
 * Includes both instance-specific flags (--server, --username, etc.)
 * and OAuth flags since instance operations often need both.
 *
 * @param flags - Parsed oclif flags
 * @returns Partial NormalizedConfig with instance and OAuth fields
 *
 * @example
 * ```typescript
 * const flagConfig = extractInstanceFlags(this.flags);
 * return loadConfig(flagConfig, options);
 * ```
 */
export function extractInstanceFlags(flags: ParsedFlags): Partial<NormalizedConfig> {
  return {
    // Instance-specific flags
    hostname: flags.server as string | undefined,
    webdavHostname: flags['webdav-server'] as string | undefined,
    codeVersion: flags['code-version'] as string | undefined,
    cipHost: flags['cip-host'] as string | undefined,
    username: flags.username as string | undefined,
    password: flags.password as string | undefined,
    // TLS/mTLS options
    certificate: flags.certificate as string | undefined,
    certificatePassphrase: flags.passphrase as string | undefined,
    selfSigned: (flags.selfsigned as boolean) || !(flags.verify as boolean),
    // Include OAuth flags (instance operations often need OAuth too)
    ...extractOAuthFlags(flags),
  };
}

/**
 * Result of extracting MRT flags from oclif parsed flags.
 *
 * Contains both config values (for loadConfig's first argument) and
 * loading options (to spread into LoadConfigOptions).
 */
export interface ExtractedMrtFlags {
  /** MRT config values to pass to loadConfig's first argument */
  config: Partial<NormalizedConfig>;
  /** MRT loading options to spread into LoadConfigOptions */
  options: Pick<LoadConfigOptions, 'cloudOrigin' | 'credentialsFile'>;
}

/**
 * Extracts MRT (Managed Runtime) configuration from oclif flags.
 *
 * Use this to extract MRT flags (--api-key, --project, --environment, --cloud-origin, --credentials-file)
 * from parsed oclif flags. Returns both config values and loading options.
 *
 * @param flags - Parsed oclif flags
 * @returns Object with `config` (NormalizedConfig partial) and `options` (LoadConfigOptions partial)
 *
 * @example
 * ```typescript
 * const mrt = extractMrtFlags(this.flags);
 * const options: LoadConfigOptions = {
 *   ...this.getBaseConfigOptions(),
 *   ...mrt.options,
 * };
 * return loadConfig(mrt.config, options, this.getPluginSources());
 * ```
 */
export function extractMrtFlags(flags: ParsedFlags): ExtractedMrtFlags {
  const cloudOrigin = flags['cloud-origin'] as string | undefined;
  const credentialsFile = flags['credentials-file'] as string | undefined;
  return {
    config: {
      mrtApiKey: flags['api-key'] as string | undefined,
      mrtProject: flags.project as string | undefined,
      mrtEnvironment: flags.environment as string | undefined,
      mrtOrigin: cloudOrigin,
    },
    options: {
      cloudOrigin,
      credentialsFile,
    },
  };
}

/**
 * Options for loading configuration.
 */
export interface LoadConfigOptions {
  /** Named instance from dw.json "configs" array */
  instance?: string;
  /** Explicit path to config file (skips searching if provided) */
  configPath?: string;
  /** Starting directory for config file search (default: current working directory) */
  startDir?: string;
  /** Cloud origin for MRT ~/.mobify lookup (e.g., https://cloud-staging.mobify.com) */
  cloudOrigin?: string;
  /** Path to custom MRT credentials file (overrides default ~/.mobify) */
  credentialsFile?: string;
  /** Account Manager hostname for OAuth (passed to plugins for host-specific config) */
  accountManagerHost?: string;
}

/**
 * Plugin-provided configuration sources with priority ordering.
 *
 * Used by BaseCommand to pass sources collected from the `b2c:config-sources` hook
 * to the configuration resolver.
 */
export interface PluginSources {
  /**
   * Sources with high priority (inserted BEFORE dw.json/~/.mobify).
   * These sources can override values from default configuration files.
   */
  before?: ConfigSource[];
  /**
   * Sources with low priority (inserted AFTER dw.json/~/.mobify).
   * These sources fill in gaps left by default configuration files.
   */
  after?: ConfigSource[];
}

/**
 * Loads configuration with precedence: CLI flags/env vars > dw.json > ~/.mobify
 *
 * OCLIF handles environment variables automatically via flag `env` properties.
 * The flags parameter already contains resolved env var values.
 *
 * Uses {@link resolveConfig} internally for consistent behavior across CLI and SDK.
 *
 * @param flags - Configuration values from CLI flags/env vars
 * @param options - Loading options
 * @param pluginSources - Optional sources from CLI plugins (via b2c:config-sources hook)
 * @returns Resolved configuration with factory methods
 *
 * @example
 * ```typescript
 * // In a CLI command
 * const config = loadConfig(
 *   { hostname: this.flags.server, clientId: this.flags['client-id'] },
 *   { instance: this.flags.instance }
 * );
 *
 * if (config.hasB2CInstanceConfig()) {
 *   const instance = config.createB2CInstance();
 * }
 * ```
 */
export function loadConfig(
  flags: Partial<NormalizedConfig> = {},
  options: LoadConfigOptions = {},
  pluginSources: PluginSources = {},
): ResolvedB2CConfig {
  const logger = getLogger();

  // Preserve instanceName and startDir from options if not already in flags
  const effectiveFlags = {
    ...flags,
    instanceName: flags.instanceName ?? options.instance,
    startDir: flags.startDir ?? options.startDir,
  };

  const resolved = resolveConfig(effectiveFlags, {
    instance: options.instance,
    configPath: options.configPath,
    startDir: options.startDir,
    hostnameProtection: true,
    cloudOrigin: options.cloudOrigin,
    credentialsFile: options.credentialsFile,
    accountManagerHost: options.accountManagerHost,
    sourcesBefore: pluginSources.before,
    sourcesAfter: pluginSources.after,
  });

  // Log source summary
  for (const source of resolved.sources) {
    logger.trace(
      {
        source: source.name,
        location: source.location,
        fields: source.fields,
        fieldsIgnored: source.fieldsIgnored,
      },
      `[${source.name}] Contributed fields`,
    );
  }

  // Log warnings (at warn level so users can see configuration issues)
  for (const warning of resolved.warnings) {
    logger.warn({warning}, `[Config] ${warning.message}`);
  }

  return resolved;
}
