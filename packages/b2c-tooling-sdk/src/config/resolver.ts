/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration resolution.
 *
 * This module provides the ConfigResolver class, the preferred high-level API
 * for loading B2C Commerce configuration from multiple sources.
 *
 * @module config/resolver
 */
import type {AuthCredentials} from '../auth/types.js';
import type {B2CInstance} from '../instance/index.js';
import {mergeConfigsWithProtection, getPopulatedFields, createInstanceFromConfig} from './mapping.js';
import {DwJsonSource, MobifySource, PackageJsonSource} from './sources/index.js';
import type {
  ConfigSource,
  ConfigSourceInfo,
  ConfigResolutionResult,
  NormalizedConfig,
  ResolveConfigOptions,
  ResolvedB2CConfig,
} from './types.js';
import {ResolvedConfigImpl} from './resolved-config.js';

/**
 * Credential groups that must come from the same source.
 *
 * When merging configuration, if any field in a group is already set by a
 * higher-priority source, all fields in that group from lower-priority
 * sources are skipped. This prevents mixing credentials that don't belong together.
 */
const CREDENTIAL_GROUPS: (keyof NormalizedConfig)[][] = [
  ['clientId', 'clientSecret'],
  ['username', 'password'],
];

/**
 * Get the set of credential groups that are already claimed in the config.
 *
 * A group is "claimed" if any of its fields are set.
 *
 * @param config - The current configuration
 * @returns Set of group indices that are claimed
 */
function getClaimedCredentialGroups(config: NormalizedConfig): Set<number> {
  const claimed = new Set<number>();
  for (let i = 0; i < CREDENTIAL_GROUPS.length; i++) {
    const group = CREDENTIAL_GROUPS[i];
    if (group.some((f) => config[f] !== undefined)) {
      claimed.add(i);
    }
  }
  return claimed;
}

/**
 * Check if a field belongs to a credential group in the claimed set.
 *
 * @param field - The field name to check
 * @param claimedGroups - Set of group indices that are already claimed
 * @returns true if the field's credential group is claimed
 */
function isFieldInClaimedGroup(field: string, claimedGroups: Set<number>): boolean {
  const groupIndex = CREDENTIAL_GROUPS.findIndex((g) => g.includes(field as keyof NormalizedConfig));
  if (groupIndex === -1) return false;
  return claimedGroups.has(groupIndex);
}

/**
 * Resolves configuration from multiple sources with consistent behavior.
 *
 * ConfigResolver is the preferred high-level API for loading B2C configuration.
 * It provides:
 * - Consistent hostname mismatch protection across SDK and CLI
 * - Extensibility via the ConfigSource interface
 * - Convenience methods for creating B2CInstance and auth credentials
 *
 * ## Resolution Priority
 *
 * Configuration is resolved with the following precedence (highest to lowest):
 * 1. Explicit overrides (passed to resolve methods)
 * 2. Sources in order (dw.json, ~/.mobify by default)
 *
 * ## Usage
 *
 * ```typescript
 * import { createConfigResolver } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const resolver = createConfigResolver();
 *
 * // Simple resolution
 * const { config, warnings } = resolver.resolve({
 *   hostname: process.env.SFCC_SERVER,
 *   clientId: process.env.SFCC_CLIENT_ID,
 * });
 *
 * // Create B2CInstance directly
 * const instance = resolver.createInstance({ hostname: '...' });
 *
 * // Get auth credentials for use with resolveAuthStrategy
 * const credentials = resolver.createAuthCredentials({ clientId: '...' });
 * ```
 *
 * ## Custom Sources
 *
 * You can provide custom configuration sources:
 *
 * ```typescript
 * import { ConfigResolver } from '@salesforce/b2c-tooling-sdk/config';
 *
 * class MySource implements ConfigSource {
 *   name = 'my-source';
 *   load(options) { return { hostname: 'custom.example.com' }; }
 * }
 *
 * const resolver = new ConfigResolver([new MySource()]);
 * ```
 */
export class ConfigResolver {
  private sources: ConfigSource[];

  /**
   * Creates a new ConfigResolver.
   *
   * @param sources - Custom configuration sources. If not provided, uses default sources (dw.json, ~/.mobify, package.json).
   *                  Sources are automatically sorted by priority (lower number = higher priority).
   */
  constructor(sources?: ConfigSource[]) {
    const configSources = sources ?? [new DwJsonSource(), new MobifySource(), new PackageJsonSource()];
    // Sort sources by priority (lower number = higher priority, undefined = 0)
    this.sources = [...configSources].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  /**
   * Resolves configuration from all sources.
   *
   * @param overrides - Explicit values that take highest priority
   * @param options - Resolution options
   * @returns Resolution result with config, warnings, and source info
   *
   * @example
   * ```typescript
   * const { config, warnings, sources } = resolver.resolve(
   *   { hostname: process.env.SFCC_SERVER },
   *   { instance: 'staging' }
   * );
   *
   * if (warnings.length > 0) {
   *   console.warn('Config warnings:', warnings);
   * }
   * ```
   */
  resolve(overrides: Partial<NormalizedConfig> = {}, options: ResolveConfigOptions = {}): ConfigResolutionResult {
    const sourceInfos: ConfigSourceInfo[] = [];
    const baseConfig: NormalizedConfig = {};

    // Create enriched options that will be updated with accumulated config values.
    // This allows later sources (like plugins) to use values discovered by earlier sources (like dw.json).
    // CLI-provided options always take precedence over accumulated values.
    const enrichedOptions: ResolveConfigOptions = {...options};

    // Load from each source in order, merging results
    // Earlier sources have higher priority - later sources only fill in missing values
    for (const source of this.sources) {
      const result = source.load(enrichedOptions);
      if (result && result.config) {
        const {config: sourceConfig, location} = result;
        const fields = getPopulatedFields(sourceConfig);
        if (fields.length > 0) {
          // Capture which credential groups are already claimed BEFORE processing this source
          // This allows a single source to provide complete credential pairs
          const claimedGroups = getClaimedCredentialGroups(baseConfig);

          // Track which fields are ignored during merge
          const fieldsIgnored: (keyof NormalizedConfig)[] = [];

          // Merge: source values fill in gaps (don't override existing values)
          for (const [key, value] of Object.entries(sourceConfig)) {
            if (value === undefined) continue;

            const fieldKey = key as keyof NormalizedConfig;

            // Skip if already set by higher-priority source
            if (baseConfig[fieldKey] !== undefined) {
              fieldsIgnored.push(fieldKey);
              continue;
            }

            // Skip if this field's credential group was already claimed by a higher-priority source
            // This prevents mixing credentials from different sources
            if (isFieldInClaimedGroup(key, claimedGroups)) {
              fieldsIgnored.push(fieldKey);
              continue;
            }

            (baseConfig as Record<string, unknown>)[key] = value;
          }

          sourceInfos.push({
            name: source.name,
            location,
            fields,
            fieldsIgnored: fieldsIgnored.length > 0 ? fieldsIgnored : undefined,
          });

          // Enrich options with accumulated config values for subsequent sources.
          // Only set if not already provided via CLI options.
          if (!enrichedOptions.accountManagerHost && baseConfig.accountManagerHost) {
            enrichedOptions.accountManagerHost = baseConfig.accountManagerHost;
          }
          if (!enrichedOptions.cloudOrigin && baseConfig.mrtOrigin) {
            enrichedOptions.cloudOrigin = baseConfig.mrtOrigin;
          }
        }
      }
    }

    // Apply overrides with hostname mismatch protection
    const {config, warnings} = mergeConfigsWithProtection(overrides, baseConfig, {
      hostnameProtection: options.hostnameProtection,
    });

    return {config, warnings, sources: sourceInfos};
  }

  /**
   * Creates a B2CInstance from resolved configuration.
   *
   * This is a convenience method that combines configuration resolution
   * with B2CInstance creation.
   *
   * @param overrides - Explicit values that take highest priority
   * @param options - Resolution options
   * @returns Configured B2CInstance
   * @throws Error if hostname is not available in resolved config
   *
   * @example
   * ```typescript
   * const instance = resolver.createInstance({
   *   clientId: process.env.SFCC_CLIENT_ID,
   *   clientSecret: process.env.SFCC_CLIENT_SECRET,
   * });
   *
   * await instance.webdav.put('path/file.txt', content);
   * ```
   */
  createInstance(overrides: Partial<NormalizedConfig> = {}, options: ResolveConfigOptions = {}): B2CInstance {
    const {config, warnings} = this.resolve(overrides, options);

    // Log warnings (in production, this would use the SDK logger)
    for (const warning of warnings) {
      // Could integrate with getLogger() here if desired
      console.warn(`[ConfigResolver] ${warning.message}`);
    }

    return createInstanceFromConfig(config);
  }

  /**
   * Creates auth credentials from resolved configuration.
   *
   * The returned credentials can be used with `resolveAuthStrategy()`
   * to automatically select the best authentication method.
   *
   * @param overrides - Explicit values that take highest priority
   * @param options - Resolution options
   * @returns Auth credentials suitable for resolveAuthStrategy()
   *
   * @example
   * ```typescript
   * import { resolveAuthStrategy } from '@salesforce/b2c-tooling-sdk';
   *
   * const credentials = resolver.createAuthCredentials({
   *   clientId: process.env.SFCC_CLIENT_ID,
   * });
   *
   * const strategy = resolveAuthStrategy(credentials);
   * ```
   */
  createAuthCredentials(
    overrides: Partial<NormalizedConfig> = {},
    options: ResolveConfigOptions = {},
  ): AuthCredentials {
    const {config} = this.resolve(overrides, options);

    return {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scopes: config.scopes,
      username: config.username,
      password: config.password,
      apiKey: config.mrtApiKey,
    };
  }
}

/**
 * Creates a ConfigResolver with default sources (dw.json, ~/.mobify).
 *
 * This is the recommended way to create a ConfigResolver for most use cases.
 *
 * @returns ConfigResolver with default configuration sources
 *
 * @example
 * ```typescript
 * import { createConfigResolver } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const resolver = createConfigResolver();
 * const { config } = resolver.resolve({ hostname: 'example.com' });
 * ```
 */
export function createConfigResolver(): ConfigResolver {
  return new ConfigResolver();
}

/**
 * Resolves configuration from multiple sources and returns a rich config object.
 *
 * This is the preferred high-level API for configuration resolution. It returns
 * a {@link ResolvedB2CConfig} object with validation methods and factory methods
 * for creating SDK objects.
 *
 * ## Resolution Priority
 *
 * 1. Explicit overrides (passed as first argument)
 * 2. Default sources (dw.json, ~/.mobify)
 * 3. Custom sources (via options.sources)
 *
 * ## Example
 *
 * ```typescript
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig({
 *   hostname: process.env.SFCC_SERVER,
 *   clientId: process.env.SFCC_CLIENT_ID,
 *   mrtApiKey: process.env.MRT_API_KEY,
 * });
 *
 * // Check what's available and create objects
 * if (config.hasB2CInstanceConfig()) {
 *   const instance = config.createB2CInstance();
 *   await instance.webdav.propfind('Cartridges');
 * }
 *
 * if (config.hasMrtConfig()) {
 *   const mrtClient = config.createMrtClient({ project: 'my-project' });
 * }
 * ```
 *
 * @param overrides - Explicit configuration values (highest priority)
 * @param options - Resolution options
 * @returns Resolved configuration with factory methods
 */
export function resolveConfig(
  overrides: Partial<NormalizedConfig> = {},
  options: ResolveConfigOptions = {},
): ResolvedB2CConfig {
  // Build sources list with priority ordering:
  // 1. sourcesBefore (high priority - override defaults)
  // 2. default sources (dw.json, ~/.mobify, package.json)
  // 3. sourcesAfter (low priority - fill gaps)
  let sources: ConfigSource[];

  if (options.replaceDefaultSources) {
    // Replace mode: only use provided sources (no default dw.json/~/.mobify/package.json)
    sources = [...(options.sourcesBefore ?? []), ...(options.sourcesAfter ?? [])];
  } else {
    // Normal mode: before + defaults + after
    const defaultSources: ConfigSource[] = [new DwJsonSource(), new MobifySource(), new PackageJsonSource()];

    // Combine all sources
    sources = [...(options.sourcesBefore ?? []), ...defaultSources, ...(options.sourcesAfter ?? [])];
  }

  // ConfigResolver constructor will sort by priority
  const resolver = new ConfigResolver(sources);
  const {config, warnings, sources: sourceInfos} = resolver.resolve(overrides, options);

  return new ResolvedConfigImpl(config, warnings, sourceInfos);
}
