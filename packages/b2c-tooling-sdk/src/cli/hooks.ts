/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Hook types for CLI plugin extensibility.
 *
 * This module defines the hook interfaces that plugins can implement to extend
 * CLI functionality, particularly for custom configuration sources.
 *
 * ## Custom Config Sources Hook
 *
 * The `b2c:config-sources` hook allows plugins to provide custom {@link ConfigSource}
 * implementations that integrate with the CLI's configuration resolution system.
 *
 * @example
 * ```typescript
 * // In your plugin's hooks/config-sources.ts
 * import type { ConfigSourcesHook } from '@salesforce/b2c-tooling-sdk/cli';
 * import { MyCustomSource } from '../sources/my-custom-source.js';
 *
 * const hook: ConfigSourcesHook = async function(options) {
 *   return {
 *     sources: [new MyCustomSource()],
 *     priority: 'before', // Override dw.json defaults
 *   };
 * };
 *
 * export default hook;
 * ```
 *
 * @module cli/hooks
 */
import type {Hook} from '@oclif/core';
import type {ConfigSource, ResolveConfigOptions} from '../config/types.js';

/**
 * Options passed to the `b2c:config-sources` hook.
 *
 * These options provide context about the current CLI invocation,
 * allowing plugins to customize their config sources based on user input.
 */
export interface ConfigSourcesHookOptions {
  /** The --instance flag value (if provided) */
  instance?: string;
  /** The --config flag value (if provided) */
  configPath?: string;
  /** Full ResolveConfigOptions for advanced sources that need more context */
  resolveOptions: ResolveConfigOptions;
  /**
   * All parsed CLI flags from the current command.
   *
   * Plugins can check for flags they care about. Note that plugins cannot
   * add flags to commands - they can only read flags that the CLI defines.
   * For plugin-specific configuration, use environment variables instead.
   */
  flags?: Record<string, unknown>;
  /** Index signature for oclif hook compatibility */
  [key: string]: unknown;
}

/**
 * Result returned by the `b2c:config-sources` hook.
 *
 * Plugins return one or more ConfigSource instances that will be integrated
 * into the configuration resolution chain.
 */
export interface ConfigSourcesHookResult {
  /** Config sources to add to the resolution chain */
  sources: ConfigSource[];
  /**
   * Where to insert sources relative to default sources.
   *
   * - `'before'`: Higher priority than dw.json/~/.mobify (plugin overrides defaults)
   * - `'after'`: Lower priority than defaults (plugin fills gaps)
   *
   * @default 'after'
   */
  priority?: 'before' | 'after';
}

/**
 * Hook type for `b2c:config-sources`.
 *
 * Implement this hook in your oclif plugin to provide custom configuration sources.
 * The hook is called during command initialization, after CLI flags are parsed
 * but before configuration is resolved.
 *
 * ## Plugin Registration
 *
 * Register the hook in your plugin's package.json:
 *
 * ```json
 * {
 *   "oclif": {
 *     "hooks": {
 *       "b2c:config-sources": "./dist/hooks/config-sources.js"
 *     }
 *   }
 * }
 * ```
 *
 * ## Hook Context
 *
 * Inside the hook function, you have access to:
 * - `this.config` - oclif Config object
 * - `this.debug()`, `this.log()`, `this.warn()`, `this.error()` - logging methods
 *
 * @example
 * ```typescript
 * import type { ConfigSourcesHook } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * const hook: ConfigSourcesHook = async function(options) {
 *   this.debug(`Hook called with instance: ${options.instance}`);
 *
 *   // Load config from a custom source (e.g., secrets manager)
 *   const source = new VaultConfigSource(options.instance);
 *
 *   return {
 *     sources: [source],
 *     priority: 'before', // Override dw.json with secrets
 *   };
 * };
 *
 * export default hook;
 * ```
 */
export type ConfigSourcesHook = Hook<'b2c:config-sources'>;

// Module augmentation for oclif to recognize the custom hook
declare module '@oclif/core' {
  interface Hooks {
    'b2c:config-sources': {
      options: ConfigSourcesHookOptions;
      return: ConfigSourcesHookResult;
    };
  }
}
