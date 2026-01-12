/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Args, Command, Flags} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {findCartridges, type CartridgeMapping, type FindCartridgesOptions} from '../operations/code/cartridges.js';
import {
  CartridgeProviderRunner,
  type CartridgeDiscoveryOptions,
  type CartridgeProvidersHookOptions,
  type CartridgeProvidersHookResult,
} from './cartridge-providers.js';

/**
 * Base command for cartridge operations (deploy, watch, etc.).
 *
 * Extends InstanceCommand with:
 * - cartridgePath argument for specifying cartridge directory
 * - cartridge include/exclude flags for filtering
 *
 * @example
 * export default class MyCartridgeCommand extends CartridgeCommand<typeof MyCartridgeCommand> {
 *   async run(): Promise<void> {
 *     const cartridges = findCartridges(this.cartridgePath, this.cartridgeOptions);
 *     // ...
 *   }
 * }
 */
export abstract class CartridgeCommand<T extends typeof Command> extends InstanceCommand<T> {
  static baseArgs = {
    cartridgePath: Args.string({
      description: 'Path to cartridges directory',
      default: '.',
    }),
  };

  static cartridgeFlags = {
    cartridge: Flags.string({
      char: 'c',
      description: 'Include specific cartridge(s) (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'exclude-cartridge': Flags.string({
      char: 'x',
      description: 'Exclude specific cartridge(s) (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
  };

  /** Cartridge provider runner for custom cartridge discovery */
  protected cartridgeProviderRunner?: CartridgeProviderRunner;

  /**
   * Override init to collect cartridge providers from plugins.
   */
  public async init(): Promise<void> {
    await super.init();
    await this.collectCartridgeProviders();
  }

  /**
   * Collects cartridge providers from plugins via the `b2c:cartridge-providers` hook.
   */
  protected async collectCartridgeProviders(): Promise<void> {
    this.cartridgeProviderRunner = new CartridgeProviderRunner(this.logger);

    const hookOptions: CartridgeProvidersHookOptions = {
      directory: this.cartridgePath,
      flags: this.flags as Record<string, unknown>,
    };

    const hookResult = await this.config.runHook('b2c:cartridge-providers', hookOptions);

    for (const success of hookResult.successes) {
      const result = success.result as CartridgeProvidersHookResult | undefined;
      if (result?.providers?.length) {
        this.cartridgeProviderRunner.addProviders(result.providers);
      }
      if (result?.transformers?.length) {
        this.cartridgeProviderRunner.addTransformers(result.transformers);
      }
    }

    for (const failure of hookResult.failures) {
      this.logger?.warn(`Plugin ${failure.plugin.name} b2c:cartridge-providers hook failed: ${failure.error.message}`);
    }

    const providerCount = this.cartridgeProviderRunner.providerCount;
    const transformerCount = this.cartridgeProviderRunner.transformerCount;
    if (providerCount > 0 || transformerCount > 0) {
      this.logger?.debug(`Registered ${providerCount} cartridge provider(s) and ${transformerCount} transformer(s)`);
    }
  }

  /**
   * Gets the cartridge path from args.
   */
  protected get cartridgePath(): string {
    return this.args.cartridgePath as string;
  }

  /**
   * Gets the cartridge filter options from flags.
   */
  protected get cartridgeOptions(): FindCartridgesOptions {
    return {
      include: this.flags.cartridge as string[] | undefined,
      exclude: this.flags['exclude-cartridge'] as string[] | undefined,
    };
  }

  /**
   * Find cartridges using registered providers and the default discovery.
   *
   * This method integrates custom cartridge providers from plugins with the
   * default `.project` file-based discovery. Providers with priority 'before'
   * run first, then default discovery, then 'after' providers. Results are
   * deduplicated by name (first wins) and transformers are applied.
   *
   * @param directory - Directory to search (defaults to cartridgePath)
   * @param options - Filter options (defaults to cartridgeOptions)
   * @returns Array of cartridge mappings from all sources
   *
   * @example
   * ```typescript
   * // In a cartridge command
   * const cartridges = await this.findCartridgesWithProviders();
   * ```
   */
  protected async findCartridgesWithProviders(
    directory?: string,
    options?: FindCartridgesOptions,
  ): Promise<CartridgeMapping[]> {
    const searchDir = directory ?? this.cartridgePath;
    const filterOptions = options ?? this.cartridgeOptions;

    // Resolve to absolute path
    const absoluteDir = path.resolve(searchDir);

    // Run default discovery
    const defaultCartridges = findCartridges(absoluteDir, filterOptions);

    // If no provider runner or no providers/transformers, return default
    if (!this.cartridgeProviderRunner) {
      return defaultCartridges;
    }

    // Build discovery options with full context
    const discoveryOptions: CartridgeDiscoveryOptions = {
      directory: absoluteDir,
      include: filterOptions.include,
      exclude: filterOptions.exclude,
      codeVersion: this.resolvedConfig?.codeVersion,
      instance: this.instance,
    };

    // Run providers and transformers
    return this.cartridgeProviderRunner.findCartridges(defaultCartridges, discoveryOptions);
  }
}
