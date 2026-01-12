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
import type {HttpMiddlewareProvider} from '../clients/middleware-registry.js';

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

// ============================================================================
// HTTP Middleware Hook
// ============================================================================

/**
 * Options passed to the `b2c:http-middleware` hook.
 */
export interface HttpMiddlewareHookOptions {
  /**
   * All parsed CLI flags from the current command.
   *
   * Plugins can inspect flags but cannot add new flags to commands.
   * For plugin-specific configuration, use environment variables instead.
   */
  flags?: Record<string, unknown>;
  /** Index signature for oclif hook compatibility */
  [key: string]: unknown;
}

/**
 * Result returned by the `b2c:http-middleware` hook.
 *
 * Plugins return one or more HttpMiddlewareProvider instances that will be
 * registered with the global middleware registry.
 */
export interface HttpMiddlewareHookResult {
  /** Middleware providers to register */
  providers: HttpMiddlewareProvider[];
}

/**
 * Hook type for `b2c:http-middleware`.
 *
 * Implement this hook in your oclif plugin to provide custom HTTP middleware
 * that will be applied to all API clients (OCAPI, SLAS, WebDAV, etc.).
 *
 * The hook is called during command initialization, after flags are parsed
 * but before any API clients are created.
 *
 * ## Plugin Registration
 *
 * Register the hook in your plugin's package.json:
 *
 * ```json
 * {
 *   "oclif": {
 *     "hooks": {
 *       "b2c:http-middleware": "./dist/hooks/http-middleware.js"
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
 * import type { HttpMiddlewareHook } from '@salesforce/b2c-tooling-sdk/cli';
 * import type { HttpMiddlewareProvider } from '@salesforce/b2c-tooling-sdk/clients';
 *
 * const hook: HttpMiddlewareHook = async function(options) {
 *   this.debug('Registering custom middleware');
 *
 *   const metricsProvider: HttpMiddlewareProvider = {
 *     name: 'metrics-collector',
 *     getMiddleware(clientType) {
 *       return {
 *         onRequest({ request }) {
 *           (request as any)._startTime = Date.now();
 *           return request;
 *         },
 *         onResponse({ request, response }) {
 *           const duration = Date.now() - (request as any)._startTime;
 *           console.log(`[${clientType}] ${request.method} ${request.url} ${response.status} ${duration}ms`);
 *           return response;
 *         },
 *       };
 *     },
 *   };
 *
 *   return { providers: [metricsProvider] };
 * };
 *
 * export default hook;
 * ```
 */
export type HttpMiddlewareHook = Hook<'b2c:http-middleware'>;

// Re-export B2C lifecycle types for convenience
export type {
  B2COperationType,
  B2COperationContext,
  BeforeB2COperationResult,
  B2COperationResult,
  AfterB2COperationResult,
  B2COperationLifecycleProvider,
  B2COperationLifecycleHookOptions,
  B2COperationLifecycleHookResult,
  B2COperationLifecycleHook,
} from './lifecycle.js';
export {createB2COperationContext, B2CLifecycleRunner} from './lifecycle.js';

// Re-export cartridge provider types for convenience
export type {
  CartridgeDiscoveryOptions,
  CartridgeProvider,
  CartridgeTransformer,
  CartridgeProvidersHookOptions,
  CartridgeProvidersHookResult,
  CartridgeProvidersHook,
} from './cartridge-providers.js';
export {CartridgeProviderRunner} from './cartridge-providers.js';

// Module augmentation for oclif to recognize the custom hooks
declare module '@oclif/core' {
  interface Hooks {
    'b2c:config-sources': {
      options: ConfigSourcesHookOptions;
      return: ConfigSourcesHookResult;
    };
    'b2c:http-middleware': {
      options: HttpMiddlewareHookOptions;
      return: HttpMiddlewareHookResult;
    };
    'b2c:operation-lifecycle': {
      options: import('./lifecycle.js').B2COperationLifecycleHookOptions;
      return: import('./lifecycle.js').B2COperationLifecycleHookResult;
    };
    'b2c:cartridge-providers': {
      options: import('./cartridge-providers.js').CartridgeProvidersHookOptions;
      return: import('./cartridge-providers.js').CartridgeProvidersHookResult;
    };
  }
}
