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
import path from 'node:path';
import type {AuthMethod} from '../auth/types.js';
import type {ClientAuthMethod} from '../auth/client-credentials.js';
import {ALL_AUTH_METHODS} from '../auth/types.js';
import {resolveConfig, type NormalizedConfig, type ConfigSource, type ResolvedB2CConfig} from '../config/index.js';
import {findDwJson} from '../config/dw-json.js';
import {readEnvFile} from '../config/project-environment.js';
import {STOREFRONT_NEXT_ENV_VAR_MAP, StorefrontNextEnvSource} from '../config/sources/env-source.js';
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

/** Splits comma-separated list values, dropping blanks; `undefined` when nothing remains. */
function toList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const items = (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

/**
 * Flag `default` that reads a comma-separated list from an environment variable.
 *
 * Use this instead of `env:` on `multiple: true` flags. oclif does not split
 * env values for multiple flags — `SFCC_OAUTH_SCOPES="a,b"` arrives as the
 * single string `"a,b"`, and with `options` the whole string fails validation.
 * Defaults also skip `options` validation, so pass `allowed` to keep it.
 *
 * @example
 * ```typescript
 * 'auth-scope': Flags.string({multiple: true, delimiter: ',', default: listFromEnv('SFCC_OAUTH_SCOPES')}),
 * ```
 */
export function listFromEnv(envVar: string, allowed?: readonly string[]): () => Promise<string[] | undefined> {
  return async () => {
    const values = toList(process.env[envVar]);
    const invalid = allowed ? values?.filter((value) => !allowed.includes(value)) : undefined;
    if (invalid?.length) {
      throw new Error(`Expected ${envVar} values to be one of: ${allowed!.join(', ')}. Got: ${invalid.join(', ')}`);
    }
    return values;
  };
}

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
  const scopes = toList(flags['auth-scope']);

  // Parse auth methods from --auth-methods or --user-auth flag
  const authMethodValues = toList(flags['auth-methods']);
  let authMethods: AuthMethod[] | undefined;
  if (flags['user-auth']) {
    authMethods = ['user'];
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
    clientAuthMethod: flags['client-auth-method'] as ClientAuthMethod | undefined,
    scopes,
    // JWT Bearer auth flags
    jwtCertPath: flags['jwt-cert'] as string | undefined,
    jwtKeyPath: flags['jwt-key'] as string | undefined,
    jwtPassphrase: flags['jwt-passphrase'] as string | undefined,
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
    importSetExclude: toList(flags['import-set-exclude']),
    // TLS/mTLS options
    certificate: flags.certificate as string | undefined,
    certificatePassphrase: flags.passphrase as string | undefined,
    selfSigned: (flags.selfsigned as boolean) || !(flags.verify as boolean),
    // API backend
    apiBackend: flags['api-backend'] as NormalizedConfig['apiBackend'],
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
 * return loadConfig(mrt.config, options);
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
      mrtBackend: flags['mrt-backend'] as NormalizedConfig['mrtBackend'],
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
  /** Fallback config file used when no explicit or project-local dw.json exists */
  defaultConfigPath?: string;
  /** Starting directory for config file search (default: current project directory) */
  projectDirectory?: string;
  /** @deprecated Use projectDirectory instead */
  workingDirectory?: string;
  /** Cloud origin for MRT ~/.mobify lookup (e.g., https://cloud-staging.mobify.com) */
  cloudOrigin?: string;
  /** Path to custom MRT credentials file (overrides default ~/.mobify) */
  credentialsFile?: string;
  /** Account Manager hostname for OAuth (passed to plugins for host-specific config) */
  accountManagerHost?: string;
  /**
   * Env file in effect for this command (see {@link resolveEnvFilePath}).
   *
   * Its Storefront Next variables fill settings left unset by flags, toolkit
   * variables and dw.json. Toolkit variables (`SFCC_*`, `MRT_*`) from the file
   * are expected to be loaded into the environment already (see {@link applyEnvFile}),
   * so they resolve like shell variables.
   */
  envFile?: string;
}

/**
 * Plugin-provided configuration sources with priority ordering.
 *
 * @deprecated Plugin config sources are now registered with the global
 * {@link globalConfigSourceRegistry} and automatically included in
 * {@link resolveConfig}. This type is retained for backwards compatibility.
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
 * Loads configuration with precedence: CLI flags/env vars > dw.json > Storefront Next variables > ~/.mobify
 *
 * OCLIF handles environment variables automatically via flag `env` properties.
 * The flags parameter already contains resolved env var values.
 *
 * Uses {@link resolveConfig} internally for consistent behavior across CLI and SDK.
 *
 * @param flags - Configuration values from CLI flags/env vars
 * @param options - Loading options
 * @param pluginSources - @deprecated Plugin sources are now registered globally via
 *   {@link globalConfigSourceRegistry}. This parameter is retained for backwards compatibility.
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
export async function loadConfig(
  flags: Partial<NormalizedConfig> = {},
  options: LoadConfigOptions = {},
  pluginSources: PluginSources = {},
): Promise<ResolvedB2CConfig> {
  const logger = getLogger();

  // Preserve instanceName and projectDirectory from options if not already in flags
  const effectiveFlags = {
    ...flags,
    instanceName: flags.instanceName ?? options.instance,
    projectDirectory: flags.projectDirectory ?? options.projectDirectory,
    workingDirectory: flags.workingDirectory ?? options.workingDirectory,
  };

  const resolved = await resolveConfig(effectiveFlags, {
    instance: options.instance,
    configPath: options.configPath,
    defaultConfigPath: options.defaultConfigPath,
    projectDirectory: options.projectDirectory,
    workingDirectory: options.workingDirectory,
    hostnameProtection: true,
    clientIdProtection: true,
    cloudOrigin: options.cloudOrigin,
    credentialsFile: options.credentialsFile,
    accountManagerHost: options.accountManagerHost,
    overrideOrigins: describeOverrideOrigins(flags, options.envFile),
    sourcesBefore: pluginSources.before,
    sourcesAfter: [...(pluginSources.after ?? []), createStorefrontNextSource(options.envFile)],
  });

  // Log warnings (at warn level so users can see configuration issues)
  for (const warning of resolved.warnings) {
    logger.warn({warning}, `[Config] ${warning.message}`);
  }

  return resolved;
}

/** Flag and env vars (highest precedence first) behind each mismatch-protected override field. */
const OVERRIDE_INPUTS: Partial<Record<keyof NormalizedConfig, {env: string[]; flag: string}>> = {
  hostname: {flag: '--server', env: ['SFCC_SERVER']},
  clientId: {flag: '--client-id', env: ['SFCC_CLIENT_ID', 'SFCC_OAUTH_CLIENT_ID']},
  clientSecret: {flag: '--client-secret', env: ['SFCC_CLIENT_SECRET', 'SFCC_OAUTH_CLIENT_SECRET']},
};

/**
 * Describes where each mismatch-protected override came from — an env file
 * variable, a shell environment variable, or a flag — for warning messages.
 * A flag whose value matches an env var is reported as the env var; the value
 * is the same either way.
 */
function describeOverrideOrigins(
  flags: Partial<NormalizedConfig>,
  envFile?: string,
): Partial<Record<keyof NormalizedConfig, string>> {
  const fileValues = envFile ? readEnvFile(envFile) : {};
  const origins: Partial<Record<keyof NormalizedConfig, string>> = {};
  for (const [field, input] of Object.entries(OVERRIDE_INPUTS) as [
    keyof NormalizedConfig,
    {env: string[]; flag: string},
  ][]) {
    const value = flags[field];
    if (value === undefined) continue;
    const name = input.env.find((envName) => process.env[envName] === value);
    if (!name) {
      origins[field] = input.flag;
    } else if (envFile && fileValues[name] === value) {
      origins[field] = `${path.basename(envFile)} (${name})`;
    } else {
      origins[field] = `environment variable ${name}`;
    }
  }
  return origins;
}

/**
 * Creates the Storefront Next fallback source from the environment, labelled
 * with the env file when every value it provides came from that file.
 */
function createStorefrontNextSource(envFile?: string): StorefrontNextEnvSource {
  const fileValues = envFile ? readEnvFile(envFile) : {};
  const env = {...fileValues, ...process.env};
  const used = Object.keys(STOREFRONT_NEXT_ENV_VAR_MAP).filter((key) => env[key]);
  const fromFile = envFile !== undefined && used.length > 0 && used.every((key) => fileValues[key] === env[key]);
  return fromFile
    ? new StorefrontNextEnvSource(env, {location: envFile, envFile})
    : new StorefrontNextEnvSource(env, {location: 'environment variables'});
}
