/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'node:path';
import type {ConfigSource} from '../config/types.js';
import type {HttpMiddlewareProvider} from '../clients/middleware-registry.js';
import {globalMiddlewareRegistry} from '../clients/middleware-registry.js';
import type {AuthMiddlewareProvider} from '../auth/middleware.js';
import {globalAuthMiddlewareRegistry} from '../auth/middleware.js';
import type {Logger} from '../logging/types.js';
import type {ConfigSourcesHookResult} from '../cli/hooks.js';
import type {HttpMiddlewareHookResult} from '../cli/hooks.js';
import type {AuthMiddlewareHookResult} from '../cli/hooks.js';
import {discoverPlugins, type PluginDiscoveryOptions} from './discovery.js';
import {createHookContext, invokeHook} from './loader.js';

/**
 * Options passed to plugin hooks during initialization.
 * Mirrors the shape of the CLI hook options but without oclif-specific fields.
 */
export interface PluginHookOptions {
  /** Named instance (if known) */
  instance?: string;
  /** Explicit config file path (if known) */
  configPath?: string;
  /** CLI flags or equivalent options */
  flags?: Record<string, unknown>;
}

/**
 * Orchestrates plugin discovery, loading, and hook invocation for non-oclif consumers
 * (VS Code extension, MCP server, etc.).
 *
 * Replicates the hook collection logic from `base-command.ts:412-530` without
 * depending on `@oclif/core`.
 */
export class B2CPluginManager {
  private _initialized = false;
  private _pluginNames: string[] = [];
  private _sourcesBefore: ConfigSource[] = [];
  private _sourcesAfter: ConfigSource[] = [];
  private _httpMiddleware: HttpMiddlewareProvider[] = [];
  private _authMiddleware: AuthMiddlewareProvider[] = [];
  private readonly logger?: Logger;
  private readonly discoveryOptions?: PluginDiscoveryOptions;

  constructor(options?: {logger?: Logger; discoveryOptions?: PluginDiscoveryOptions}) {
    this.logger = options?.logger;
    this.discoveryOptions = options?.discoveryOptions;
  }

  /**
   * Discovers installed plugins and invokes their hooks.
   *
   * Collects config sources, HTTP middleware, and auth middleware providers.
   */
  async initialize(hookOptions?: PluginHookOptions): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const plugins = discoverPlugins({
      ...this.discoveryOptions,
      logger: this.logger,
    });

    if (plugins.length === 0) return;

    this._pluginNames = plugins.map((p) => p.name);
    this.logger?.debug(`Discovered ${plugins.length} plugin(s): ${this._pluginNames.join(', ')}`);

    const context = createHookContext({logger: this.logger});

    for (const plugin of plugins) {
      // Config sources hook
      if (plugin.hooks['b2c:config-sources']) {
        for (const hookPath of plugin.hooks['b2c:config-sources']) {
          const absPath = path.resolve(plugin.packageDir, hookPath);
          const options = {
            instance: hookOptions?.instance,
            configPath: hookOptions?.configPath,
            flags: hookOptions?.flags ?? {},
            resolveOptions: {
              instance: hookOptions?.instance,
              configPath: hookOptions?.configPath,
            },
          };
          const result = await invokeHook<ConfigSourcesHookResult>(absPath, context, options, this.logger);
          if (result?.sources?.length) {
            this.collectConfigSources(result, plugin.name);
          }
        }
      }

      // HTTP middleware hook
      if (plugin.hooks['b2c:http-middleware']) {
        for (const hookPath of plugin.hooks['b2c:http-middleware']) {
          const absPath = path.resolve(plugin.packageDir, hookPath);
          const options = {flags: hookOptions?.flags ?? {}};
          const result = await invokeHook<HttpMiddlewareHookResult>(absPath, context, options, this.logger);
          if (result?.providers?.length) {
            this._httpMiddleware.push(...result.providers);
            for (const provider of result.providers) {
              this.logger?.debug(`Collected HTTP middleware provider: ${provider.name} (from ${plugin.name})`);
            }
          }
        }
      }

      // Auth middleware hook
      if (plugin.hooks['b2c:auth-middleware']) {
        for (const hookPath of plugin.hooks['b2c:auth-middleware']) {
          const absPath = path.resolve(plugin.packageDir, hookPath);
          const options = {flags: hookOptions?.flags ?? {}};
          const result = await invokeHook<AuthMiddlewareHookResult>(absPath, context, options, this.logger);
          if (result?.providers?.length) {
            this._authMiddleware.push(...result.providers);
            for (const provider of result.providers) {
              this.logger?.debug(`Collected auth middleware provider: ${provider.name} (from ${plugin.name})`);
            }
          }
        }
      }
    }
  }

  /**
   * Collects config sources from a hook result, applying priority mapping
   * matching `base-command.ts:434-457`.
   */
  private collectConfigSources(result: ConfigSourcesHookResult, pluginName: string): void {
    // Priority mapping: 'before' -> -1, 'after' -> 10, number -> as-is, undefined -> 10
    const numericPriority =
      result.priority === 'before'
        ? -1
        : result.priority === 'after'
          ? 10
          : typeof result.priority === 'number'
            ? result.priority
            : 10; // default 'after'

    // Apply priority to sources that don't already have one set
    for (const source of result.sources) {
      if (source.priority === undefined) {
        (source as {priority?: number}).priority = numericPriority;
      }
    }

    // Split into before/after arrays (same as base-command.ts:453-457)
    if (numericPriority < 0) {
      this._sourcesBefore.push(...result.sources);
    } else {
      this._sourcesAfter.push(...result.sources);
    }

    this.logger?.debug(
      `Collected ${result.sources.length} config source(s) from ${pluginName} (priority: ${result.priority ?? 'default'})`,
    );
  }

  /**
   * Returns the collected config sources split by priority.
   */
  getConfigSources(): {sourcesBefore: ConfigSource[]; sourcesAfter: ConfigSource[]} {
    return {
      sourcesBefore: this._sourcesBefore,
      sourcesAfter: this._sourcesAfter,
    };
  }

  /**
   * Registers collected middleware providers with the global registries.
   */
  applyMiddleware(): void {
    for (const provider of this._httpMiddleware) {
      globalMiddlewareRegistry.register(provider);
      this.logger?.debug(`Registered HTTP middleware provider: ${provider.name}`);
    }

    for (const provider of this._authMiddleware) {
      globalAuthMiddlewareRegistry.register(provider);
      this.logger?.debug(`Registered auth middleware provider: ${provider.name}`);
    }
  }

  /** Names of all discovered plugins */
  get pluginNames(): string[] {
    return this._pluginNames;
  }

  /** Whether initialize() has been called */
  get initialized(): boolean {
    return this._initialized;
  }
}
