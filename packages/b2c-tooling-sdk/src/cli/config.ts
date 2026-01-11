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
 * For most use cases, prefer using {@link resolveConfig} directly from the
 * `config` module, which provides a richer API with factory methods.
 *
 * @module cli/config
 */
import type {AuthMethod} from '../auth/types.js';
import {ALL_AUTH_METHODS} from '../auth/types.js';
import {resolveConfig, type NormalizedConfig, type ConfigSource} from '../config/index.js';
import {findDwJson} from '../config/dw-json.js';
import {getLogger} from '../logging/logger.js';

// Re-export for convenience
export type {AuthMethod};
export {ALL_AUTH_METHODS};
export {findDwJson};

/**
 * Resolved configuration for CLI commands.
 *
 * This type is an alias for NormalizedConfig to maintain backward compatibility
 * with existing CLI code. For new code, prefer using {@link resolveConfig}
 * which returns a {@link ResolvedB2CConfig} with factory methods.
 */
export type ResolvedConfig = NormalizedConfig;

/**
 * Options for loading configuration.
 */
export interface LoadConfigOptions {
  /** Named instance from dw.json "configs" array */
  instance?: string;
  /** Explicit path to config file (skips searching if provided) */
  configPath?: string;
  /** Cloud origin for MRT ~/.mobify lookup (e.g., https://cloud-staging.mobify.com) */
  cloudOrigin?: string;
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
 * @returns Resolved configuration values
 *
 * @example
 * ```typescript
 * // In a CLI command
 * const config = loadConfig(
 *   { hostname: this.flags.server, clientId: this.flags['client-id'] },
 *   { instance: this.flags.instance }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // For richer API with factory methods, use resolveConfig directly:
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig(flags, options);
 * if (config.hasB2CInstanceConfig()) {
 *   const instance = config.createB2CInstance();
 * }
 * ```
 */
export function loadConfig(
  flags: Partial<ResolvedConfig> = {},
  options: LoadConfigOptions = {},
  pluginSources: PluginSources = {},
): ResolvedConfig {
  const logger = getLogger();

  const resolved = resolveConfig(flags, {
    instance: options.instance,
    configPath: options.configPath,
    hostnameProtection: true,
    cloudOrigin: options.cloudOrigin,
    sourcesBefore: pluginSources.before,
    sourcesAfter: pluginSources.after,
  });

  // Log warnings
  for (const warning of resolved.warnings) {
    logger.trace({warning}, `[Config] ${warning.message}`);
  }

  const config = resolved.values;

  // Handle instanceName from options if not in resolved config
  // This preserves backward compatibility with the old behavior
  if (!config.instanceName && options.instance) {
    config.instanceName = options.instance;
  }

  return config as ResolvedConfig;
}
