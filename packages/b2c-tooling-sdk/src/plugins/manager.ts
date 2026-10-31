/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'node:path';
import type {ConfigSource} from '../config/types.js';
import {globalConfigSourceRegistry} from '../config/config-source-registry.js';
import type {HttpMiddlewareProvider} from '../clients/middleware-registry.js';
import {globalMiddlewareRegistry} from '../clients/middleware-registry.js';
import type {AuthMiddlewareProvider} from '../auth/middleware.js';
import {globalAuthMiddlewareRegistry} from '../auth/middleware.js';
import type {AuthSessionBackend} from '../auth/session-store.js';
import type {Logger} from '../logging/types.js';
import type {ConfigSourcesHookResult} from '../cli/hooks.js';
import type {HttpMiddlewareHookResult} from '../cli/hooks.js';
import type {AuthMiddlewareHookResult} from '../cli/hooks.js';
import type {AuthSessionStoreHookResult} from '../cli/hooks.js';
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
  /** Account Manager host override */
  accountManagerHost?: string;
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
  private _middlewareApplied = false;
  private _pluginNames: string[] = [];
  private _sourcesBefore: ConfigSource[] = [];
  private _sourcesAfter: ConfigSource[] = [];
  private _httpMiddleware: HttpMiddlewareProvider[] = [];
  private _authMiddleware: AuthMiddlewareProvider[] = [];
  private _authSessionBackend?: AuthSessionBackend;
  private _authSessionBackendPlugin?: string;
  private readonly logger?: Logger;
  private readonly discoveryOptions?: PluginDiscoveryOptions;

  constructor(options?: {logger?: Logger; discoveryOptions?: PluginDiscoveryOptions}) {
    this.logger = options?.logger;
    this.discoveryOptions = options?.discoveryOptions;
  }

  /**
   * Discovers installed plugins and invokes their hooks.
   *
   * Collects config sources, HTTP middleware, auth middleware providers, and
   * the auth session store.
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
              accountManagerHost: hookOptions?.accountManagerHost,
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

      // Auth session store hook (first plugin by name wins, same as the CLI)
      if (plugin.hooks['b2c:auth-session-store']) {
        for (const hookPath of plugin.hooks['b2c:auth-session-store']) {
          const absPath = path.resolve(plugin.packageDir, hookPath);
          const options = {flags: hookOptions?.flags ?? {}};
          const result = await invokeHook<AuthSessionStoreHookResult>(absPath, context, options, this.logger);
          if (!result?.backend) continue;
          if (this._authSessionBackend) {
            this.logger?.warn(
              `Plugin ${plugin.name} also provides an auth session store; using the one from ${this._authSessionBackendPlugin}`,
            );
            continue;
          }
          this._authSessionBackend = result.backend;
          this._authSessionBackendPlugin = plugin.name;
          this.logger?.debug(`Collected auth session store (from ${plugin.name})`);
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
   * Returns the auth session store provided by a plugin, if any.
   *
   * Not installed by {@link applyMiddleware}: hosts with their own secret storage
   * (such as the VS Code extension) decide whether to use it. To use it, pass it
   * to `setAuthSessionBackend()` from `@salesforce/b2c-tooling-sdk/auth`.
   */
  getAuthSessionBackend(): AuthSessionBackend | undefined {
    return this._authSessionBackend;
  }

  /**
   * Registers collected middleware providers and config sources with the global registries.
   *
   * After calling this method:
   * - HTTP middleware is available to all SDK client factories via {@link globalMiddlewareRegistry}
   * - Auth middleware is available to OAuth strategies via {@link globalAuthMiddlewareRegistry}
   * - Config sources are available to {@link resolveConfig} via {@link globalConfigSourceRegistry}
   */
  applyMiddleware(): void {
    if (this._middlewareApplied) return;
    this._middlewareApplied = true;

    for (const provider of this._httpMiddleware) {
      globalMiddlewareRegistry.register(provider);
      this.logger?.debug(`Registered HTTP middleware provider: ${provider.name}`);
    }

    for (const provider of this._authMiddleware) {
      globalAuthMiddlewareRegistry.register(provider);
      this.logger?.debug(`Registered auth middleware provider: ${provider.name}`);
    }

    for (const source of [...this._sourcesBefore, ...this._sourcesAfter]) {
      globalConfigSourceRegistry.register(source);
      this.logger?.debug(`Registered config source: ${source.name}`);
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
