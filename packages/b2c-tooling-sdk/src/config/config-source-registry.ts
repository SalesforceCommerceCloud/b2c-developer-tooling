/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Config Source Registry for B2C SDK.
 *
 * Provides a global registry for {@link ConfigSource} instances that are
 * automatically included in configuration resolution via {@link resolveConfig}.
 *
 * ## SDK Usage
 *
 * ```typescript
 * import { globalConfigSourceRegistry, type ConfigSource } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const envSource: ConfigSource = {
 *   name: 'env-vars',
 *   load() {
 *     return {
 *       config: { hostname: process.env.SFCC_SERVER },
 *       location: 'environment',
 *     };
 *   },
 * };
 *
 * globalConfigSourceRegistry.register(envSource);
 * ```
 *
 * ## CLI Plugin Usage
 *
 * Plugins can provide config sources via the `b2c:config-sources` hook.
 * Sources are registered with this registry during command initialization.
 *
 * @module config/config-source-registry
 */
import type {ConfigSource} from './types.js';

/**
 * Registry for configuration sources.
 *
 * The registry collects {@link ConfigSource} instances and makes them available
 * to {@link resolveConfig}, which automatically includes globally registered
 * sources in every resolution. Sources are sorted by priority alongside
 * default and explicitly-passed sources.
 *
 * ## Usage Modes
 *
 * **SDK Mode**: Register sources directly via `register()`:
 * ```typescript
 * globalConfigSourceRegistry.register(mySource);
 * ```
 *
 * **CLI Mode**: Sources are collected via the `b2c:config-sources` hook
 * and registered during command initialization.
 */
export class ConfigSourceRegistry {
  private sources: ConfigSource[] = [];

  /**
   * Registers a config source.
   *
   * Sources participate in priority sorting alongside default sources
   * when {@link resolveConfig} is called. Set the source's `priority`
   * property to control ordering (lower number = higher priority).
   *
   * @param source - The config source to register
   */
  register(source: ConfigSource): void {
    if (this.sources.some((s) => s.name === source.name)) return;
    this.sources.push(source);
  }

  /**
   * Unregisters a config source by name.
   *
   * @param name - The name of the source to remove
   * @returns true if a source was removed, false if not found
   */
  unregister(name: string): boolean {
    const index = this.sources.findIndex((s) => s.name === name);
    if (index >= 0) {
      this.sources.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Returns all registered sources.
   *
   * Returns a shallow copy to prevent external mutation of the registry.
   *
   * @returns Array of registered config sources
   */
  getSources(): ConfigSource[] {
    return [...this.sources];
  }

  /**
   * Clears all registered sources.
   *
   * Primarily useful for testing.
   */
  clear(): void {
    this.sources = [];
  }

  /**
   * Returns the number of registered sources.
   */
  get size(): number {
    return this.sources.length;
  }

  /**
   * Returns the names of all registered sources.
   */
  getSourceNames(): string[] {
    return this.sources.map((s) => s.name);
  }
}

/**
 * Global config source registry instance.
 *
 * This is the default registry used by {@link resolveConfig}. Register
 * config sources here to have them automatically included in configuration
 * resolution.
 *
 * @example
 * ```typescript
 * import { globalConfigSourceRegistry } from '@salesforce/b2c-tooling-sdk/config';
 *
 * globalConfigSourceRegistry.register({
 *   name: 'my-source',
 *   load(options) {
 *     return {
 *       config: { hostname: 'example.com' },
 *       location: 'my-source',
 *     };
 *   },
 * });
 * ```
 */
export const globalConfigSourceRegistry = new ConfigSourceRegistry();
