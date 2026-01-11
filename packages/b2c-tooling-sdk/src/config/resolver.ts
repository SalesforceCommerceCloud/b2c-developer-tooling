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
import {DwJsonSource, MobifySource} from './sources/index.js';
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
   * @param sources - Custom configuration sources. If not provided, uses default sources (dw.json, ~/.mobify).
   */
  constructor(sources?: ConfigSource[]) {
    this.sources = sources ?? [new DwJsonSource(), new MobifySource()];
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

    // Load from each source in order, merging results
    // Earlier sources have higher priority - later sources only fill in missing values
    for (const source of this.sources) {
      const sourceConfig = source.load(options);
      if (sourceConfig) {
        const fieldsContributed = getPopulatedFields(sourceConfig);
        if (fieldsContributed.length > 0) {
          sourceInfos.push({
            name: source.name,
            path: source.getPath?.(),
            fieldsContributed,
          });

          // Merge: source values fill in gaps (don't override existing values)
          for (const [key, value] of Object.entries(sourceConfig)) {
            if (value !== undefined && baseConfig[key as keyof NormalizedConfig] === undefined) {
              (baseConfig as Record<string, unknown>)[key] = value;
            }
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
  // 2. default sources (dw.json, ~/.mobify)
  // 3. sourcesAfter / sources (low priority - fill gaps)
  let sources: ConfigSource[];

  if (options.replaceDefaultSources && (options.sources || options.sourcesAfter)) {
    // Replace mode: only use provided sources
    sources = [...(options.sourcesBefore ?? []), ...(options.sourcesAfter ?? options.sources ?? [])];
  } else {
    // Normal mode: before + defaults + after
    const defaultSources: ConfigSource[] = [new DwJsonSource(), new MobifySource()];

    // Combine: sourcesBefore > defaults > sourcesAfter/sources
    sources = [
      ...(options.sourcesBefore ?? []),
      ...defaultSources,
      ...(options.sourcesAfter ?? []),
      // Backward compat: 'sources' is treated as 'after' priority
      ...(options.sources ?? []),
    ];
  }

  const resolver = new ConfigResolver(sources);
  const {config, warnings, sources: sourceInfos} = resolver.resolve(overrides, options);

  return new ResolvedConfigImpl(config, warnings, sourceInfos);
}
