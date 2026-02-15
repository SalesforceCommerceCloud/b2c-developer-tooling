/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration types for the B2C SDK.
 *
 * This module defines the canonical configuration format and interfaces
 * for the configuration resolution system.
 *
 * @module config/types
 */
import type {AuthMethod, AuthStrategy} from '../auth/types.js';
import type {B2CInstance} from '../instance/index.js';

/**
 * Normalized B2C configuration with camelCase fields.
 *
 * This is the canonical intermediate format that all configuration sources
 * map to. It provides a consistent interface regardless of the source format
 * (dw.json uses kebab-case, env vars use SCREAMING_SNAKE_CASE, etc.).
 */
export interface NormalizedConfig {
  // Instance fields
  /** B2C instance hostname */
  hostname?: string;
  /** Separate hostname for WebDAV operations (if different from main hostname) */
  webdavHostname?: string;
  /** Code version for deployments */
  codeVersion?: string;

  // Auth fields (Basic)
  /** Username for Basic auth (WebDAV) */
  username?: string;
  /** Password/access-key for Basic auth (WebDAV) */
  password?: string;

  // Auth fields (OAuth)
  /** OAuth client ID */
  clientId?: string;
  /** OAuth client secret */
  clientSecret?: string;
  /** OAuth scopes */
  scopes?: string[];
  /** Allowed authentication methods in priority order */
  authMethods?: AuthMethod[];
  /** Account Manager hostname for OAuth (default: account.demandware.com) */
  accountManagerHost?: string;

  // SCAPI
  /** SCAPI short code */
  shortCode?: string;
  /** Tenant/Organization ID for SCAPI */
  tenantId?: string;

  // ODS (On-Demand Sandbox)
  /** ODS API hostname */
  sandboxApiHost?: string;

  // MRT fields
  /** MRT project slug */
  mrtProject?: string;
  /** MRT environment name (e.g., staging, production) */
  mrtEnvironment?: string;
  /** MRT API key */
  mrtApiKey?: string;
  /** MRT API origin URL override */
  mrtOrigin?: string;

  // Content
  /** Default content library ID for content export/list commands */
  contentLibrary?: string;

  // CIP
  /** Optional CIP analytics host override */
  cipHost?: string;

  // Metadata
  /** Instance name (from multi-config supporting sources) */
  instanceName?: string;

  // TLS/mTLS
  /** Path to PKCS12 certificate file for client mTLS (two-factor auth) */
  certificate?: string;
  /** Passphrase for the certificate */
  certificatePassphrase?: string;
  /** Whether to skip SSL/TLS certificate verification (self-signed certs) */
  selfSigned?: boolean;
}

/**
 * Warning codes for configuration resolution.
 */
export type ConfigWarningCode = 'HOSTNAME_MISMATCH' | 'DEPRECATED_FIELD' | 'MISSING_REQUIRED' | 'SOURCE_ERROR';

/**
 * A warning generated during configuration resolution.
 */
export interface ConfigWarning {
  /** Warning code for programmatic handling */
  code: ConfigWarningCode;
  /** Human-readable warning message */
  message: string;
  /** Additional details about the warning */
  details?: Record<string, unknown>;
}

/**
 * Information about a configuration source that contributed to resolution.
 */
export interface ConfigSourceInfo {
  /** Human-readable name of the source */
  name: string;
  /** Location of the source (file path, keychain entry, URL, etc.) */
  location?: string;
  /** All fields that this source provided values for */
  fields: (keyof NormalizedConfig)[];
  /** Fields that were not used because a higher priority source already provided them */
  fieldsIgnored?: (keyof NormalizedConfig)[];
}

/**
 * Result of configuration resolution.
 */
export interface ConfigResolutionResult {
  /** The resolved configuration */
  config: NormalizedConfig;
  /** Warnings generated during resolution */
  warnings: ConfigWarning[];
  /** Information about which sources contributed to the config */
  sources: ConfigSourceInfo[];
}

/**
 * Options for configuration resolution.
 */
export interface ResolveConfigOptions {
  /** Named instance for supporting ConfigSources */
  instance?: string;
  /** Explicit path to config file (defaults to auto-discover) */
  configPath?: string;
  /** Starting directory for config file search */
  startDir?: string;
  /** Whether to apply hostname mismatch protection (default: true) */
  hostnameProtection?: boolean;
  /** Cloud origin for ~/.mobify lookup (MRT) */
  cloudOrigin?: string;
  /** Path to custom MRT credentials file (overrides default ~/.mobify) */
  credentialsFile?: string;
  /** Account Manager hostname for OAuth (passed to plugins for host-specific config) */
  accountManagerHost?: string;

  /**
   * Custom sources to add BEFORE default sources (higher priority).
   * These sources can override values from dw.json and ~/.mobify.
   */
  sourcesBefore?: ConfigSource[];

  /**
   * Custom sources to add AFTER default sources (lower priority).
   * These sources fill in gaps left by dw.json and ~/.mobify.
   */
  sourcesAfter?: ConfigSource[];

  /** Replace default sources entirely (instead of appending) */
  replaceDefaultSources?: boolean;
}

/**
 * Result of loading configuration from a source.
 */
export interface ConfigLoadResult {
  /** The loaded configuration */
  config: NormalizedConfig;
  /**
   * Location of the source (for diagnostics).
   * May be a file path, keychain entry, URL, or other identifier.
   */
  location?: string;
}

/**
 * A configuration source that can contribute config values.
 *
 * Implement this interface to create custom configuration sources.
 * Sources are called in order, and later sources can override earlier ones.
 *
 * @example
 * ```typescript
 * import type { ConfigSource, ConfigLoadResult, ResolveConfigOptions } from '@salesforce/b2c-tooling-sdk/config';
 *
 * class MyCustomSource implements ConfigSource {
 *   name = 'my-custom-source';
 *
 *   load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
 *     // Load config from your custom source
 *     return { config: { hostname: 'example.com' }, location: '/path/to/config' };
 *   }
 * }
 * ```
 */
export interface ConfigSource {
  /** Human-readable name for diagnostics */
  name: string;

  /**
   * Priority for source ordering. Lower numbers = higher priority.
   *
   * Recommended ranges:
   * - < 0: Before built-in sources (override defaults)
   * - 0: Built-in sources (DwJsonSource, MobifySource)
   * - 1-999: After built-in sources (fill gaps)
   * - 1000: Lowest priority (PackageJsonSource)
   *
   * @default 0
   */
  priority?: number;

  /**
   * Load configuration from this source.
   *
   * @param options - Resolution options
   * @returns Config and location from this source, or undefined if source not available
   */
  load(options: ResolveConfigOptions): ConfigLoadResult | undefined;

  // === Instance Management (for dw.json-style sources) ===

  /**
   * List all instances from this source.
   * @param options - Resolution options
   * @returns Array of instance info objects
   */
  listInstances?(options?: ResolveConfigOptions): InstanceInfo[];

  /**
   * Create a new instance in this source.
   * @param options - Creation options including name and config
   */
  createInstance?(options: CreateInstanceOptions & ResolveConfigOptions): void;

  /**
   * Remove an instance from this source.
   * @param name - Instance name to remove
   * @param options - Resolution options
   */
  removeInstance?(name: string, options?: ResolveConfigOptions): void;

  /**
   * Set an instance as active.
   * @param name - Instance name to set as active
   * @param options - Resolution options
   */
  setActiveInstance?(name: string, options?: ResolveConfigOptions): void;

  // === Credential Storage (for keychain-style sources) ===

  /**
   * Fields this source can securely store (e.g., ['password', 'clientSecret']).
   */
  credentialFields?: (keyof NormalizedConfig)[];

  /**
   * Store a credential value for an instance.
   * @param instanceName - Instance name
   * @param field - Config field to store
   * @param value - Value to store
   * @param options - Resolution options
   */
  storeCredential?(
    instanceName: string,
    field: keyof NormalizedConfig,
    value: string,
    options?: ResolveConfigOptions,
  ): void;

  /**
   * Remove a credential for an instance.
   * @param instanceName - Instance name
   * @param field - Config field to remove
   * @param options - Resolution options
   */
  removeCredential?(instanceName: string, field: keyof NormalizedConfig, options?: ResolveConfigOptions): void;
}

/**
 * Options for creating OAuth auth strategy.
 */
export interface CreateOAuthOptions {
  /** Allowed OAuth methods (default: ['client-credentials', 'implicit']) */
  allowedMethods?: AuthMethod[];
}

/**
 * Result of configuration resolution with factory methods.
 *
 * Provides both raw configuration values and factory methods for creating
 * B2C SDK objects (B2CInstance, AuthStrategy, MrtClient) based on the
 * resolved configuration.
 *
 * @example
 * ```typescript
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig({
 *   hostname: process.env.SFCC_SERVER,
 *   clientId: process.env.SFCC_CLIENT_ID,
 * });
 *
 * if (config.hasB2CInstanceConfig()) {
 *   const instance = config.createB2CInstance();
 *   await instance.webdav.propfind('Cartridges');
 * }
 *
 * if (config.hasMrtConfig()) {
 *   const mrtAuth = config.createMrtAuth();
 * }
 * ```
 */
/**
 * Information about a configured instance.
 */
export interface InstanceInfo {
  /** Instance name */
  name: string;
  /** B2C instance hostname */
  hostname?: string;
  /** Whether this instance is currently active */
  active?: boolean;
  /** Source name for display */
  source: string;
  /** Location (file path, etc.) */
  location?: string;
}

/**
 * Options for creating an instance.
 */
export interface CreateInstanceOptions {
  /** Instance name */
  name: string;
  /** Configuration values for the instance */
  config: Partial<NormalizedConfig>;
  /** Whether to set as active instance */
  setActive?: boolean;
}

export interface ResolvedB2CConfig {
  /** Raw configuration values */
  readonly values: NormalizedConfig;

  /** Warnings generated during resolution */
  readonly warnings: ConfigWarning[];

  /** Information about which sources contributed to the config */
  readonly sources: ConfigSourceInfo[];

  // Validation methods

  /**
   * Check if B2C instance configuration is available.
   * Requires: hostname
   */
  hasB2CInstanceConfig(): boolean;

  /**
   * Check if MRT configuration is available.
   * Requires: mrtApiKey
   */
  hasMrtConfig(): boolean;

  /**
   * Check if OAuth configuration is available.
   * Requires: clientId
   */
  hasOAuthConfig(): boolean;

  /**
   * Check if Basic auth configuration is available.
   * Requires: username and password
   */
  hasBasicAuthConfig(): boolean;

  // Factory methods

  /**
   * Creates a B2CInstance from the resolved configuration.
   * @throws Error if hostname is not configured
   */
  createB2CInstance(): B2CInstance;

  /**
   * Creates a Basic auth strategy.
   * @throws Error if username or password is not configured
   */
  createBasicAuth(): AuthStrategy;

  /**
   * Creates an OAuth auth strategy.
   * @param options - OAuth options (allowed methods)
   * @throws Error if clientId is not configured
   */
  createOAuth(options?: CreateOAuthOptions): AuthStrategy;

  /**
   * Creates an MRT auth strategy (API key).
   * @throws Error if mrtApiKey is not configured
   */
  createMrtAuth(): AuthStrategy;

  /**
   * Creates a WebDAV auth strategy.
   * Prefers Basic auth if available, falls back to OAuth.
   * @throws Error if neither Basic auth nor OAuth is configured
   */
  createWebDavAuth(): AuthStrategy;
}
