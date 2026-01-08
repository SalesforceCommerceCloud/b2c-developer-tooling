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
import type {AuthMethod} from '../auth/types.js';

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

  // MRT fields
  /** MRT project slug */
  mrtProject?: string;
  /** MRT environment name (e.g., staging, production) */
  mrtEnvironment?: string;
  /** MRT API key */
  mrtApiKey?: string;
  /** MRT API origin URL override */
  mrtOrigin?: string;

  // Metadata
  /** Instance name (from multi-config dw.json) */
  instanceName?: string;
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
  /** Path to the source file (if applicable) */
  path?: string;
  /** Fields that this source contributed to the final config */
  fieldsContributed: (keyof NormalizedConfig)[];
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
  /** Named instance from dw.json "configs" array */
  instance?: string;
  /** Explicit path to config file (defaults to auto-discover) */
  configPath?: string;
  /** Starting directory for config file search */
  startDir?: string;
  /** Whether to apply hostname mismatch protection (default: true) */
  hostnameProtection?: boolean;
  /** Cloud origin for ~/.mobify lookup (MRT) */
  cloudOrigin?: string;
}

/**
 * A configuration source that can contribute config values.
 *
 * Implement this interface to create custom configuration sources.
 * Sources are called in order, and later sources can override earlier ones.
 *
 * @example
 * ```typescript
 * import type { ConfigSource, NormalizedConfig, ResolveConfigOptions } from '@salesforce/b2c-tooling-sdk/config';
 *
 * class MyCustomSource implements ConfigSource {
 *   name = 'my-custom-source';
 *
 *   load(options: ResolveConfigOptions): NormalizedConfig | undefined {
 *     // Load config from your custom source
 *     return { hostname: 'example.com' };
 *   }
 * }
 * ```
 */
export interface ConfigSource {
  /** Human-readable name for diagnostics */
  name: string;

  /**
   * Load configuration from this source.
   *
   * @param options - Resolution options
   * @returns Partial config from this source, or undefined if source not available
   */
  load(options: ResolveConfigOptions): NormalizedConfig | undefined;

  /**
   * Get the path to this source's file (if applicable).
   * Used for diagnostics and source info.
   */
  getPath?(): string | undefined;
}
