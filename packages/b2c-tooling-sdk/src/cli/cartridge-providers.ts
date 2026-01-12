/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Hook} from '@oclif/core';
import type {CartridgeMapping, FindCartridgesOptions} from '../operations/code/cartridges.js';
import type {B2CInstance} from '../instance/index.js';

/**
 * Extended options for cartridge discovery that includes instance context.
 */
export interface CartridgeDiscoveryOptions extends FindCartridgesOptions {
  /** Directory to search for cartridges */
  directory: string;
  /** Code version being deployed to (if known) */
  codeVersion?: string;
  /** B2C instance context (if available) */
  instance?: B2CInstance;
}

/**
 * Provider interface for custom cartridge discovery.
 *
 * Plugins can implement this interface to provide cartridges from custom sources
 * such as remote Git repos, manifest files, or other locations.
 *
 * @example
 * ```typescript
 * const manifestProvider: CartridgeProvider = {
 *   name: 'manifest-provider',
 *   priority: 'before',
 *   async findCartridges(options) {
 *     const manifest = JSON.parse(await fs.readFile('cartridges.json', 'utf-8'));
 *     return manifest.cartridges.map(c => ({
 *       name: c.name,
 *       src: path.resolve(c.path),
 *       dest: c.name,
 *     }));
 *   },
 * };
 * ```
 */
export interface CartridgeProvider {
  /** Unique name for this provider (used for logging) */
  readonly name: string;

  /**
   * Priority relative to default provider.
   * - 'before': Runs first, can provide cartridges that override defaults
   * - 'after': Runs after defaults, adds additional cartridges
   */
  readonly priority: 'before' | 'after';

  /**
   * Find cartridges from this provider.
   *
   * @param options - Discovery options including directory, filters, and instance context
   * @returns Array of cartridge mappings, or empty array if no cartridges available
   */
  findCartridges(options: CartridgeDiscoveryOptions): Promise<CartridgeMapping[]>;
}

/**
 * Transformer interface for modifying cartridge mappings before deployment.
 *
 * Transformers run after all providers have contributed cartridges and can
 * modify paths, rename cartridges, or filter the final list.
 *
 * @example
 * ```typescript
 * const versioningTransformer: CartridgeTransformer = {
 *   name: 'versioning-transformer',
 *   async transform(cartridges, options) {
 *     // Append version suffix to cartridge names
 *     return cartridges.map(c => ({
 *       ...c,
 *       dest: `${c.name}_v2`,
 *     }));
 *   },
 * };
 * ```
 */
export interface CartridgeTransformer {
  /** Unique name for this transformer (used for logging) */
  readonly name: string;

  /**
   * Transform cartridge mappings before deployment.
   *
   * Can modify paths, names, or filter cartridges.
   *
   * @param cartridges - Current list of cartridge mappings
   * @param options - Discovery options for context
   * @returns Transformed array of cartridge mappings
   */
  transform(cartridges: CartridgeMapping[], options: CartridgeDiscoveryOptions): Promise<CartridgeMapping[]>;
}

/**
 * Options passed to the b2c:cartridge-providers hook.
 */
export interface CartridgeProvidersHookOptions {
  /** Directory being searched for cartridges */
  directory: string;
  /** Command flags (for context) */
  flags?: Record<string, unknown>;
  /** Allow additional properties */
  [key: string]: unknown;
}

/**
 * Result returned from the b2c:cartridge-providers hook.
 */
export interface CartridgeProvidersHookResult {
  /** Cartridge providers to register */
  providers?: CartridgeProvider[];
  /** Cartridge transformers to register */
  transformers?: CartridgeTransformer[];
}

/**
 * Type for the b2c:cartridge-providers hook function.
 */
export type CartridgeProvidersHook = Hook<'b2c:cartridge-providers'>;

/**
 * Runner that manages cartridge providers and transformers.
 *
 * Collects providers from plugins and orchestrates discovery across
 * all sources with proper priority ordering and deduplication.
 */
export class CartridgeProviderRunner {
  private providers: CartridgeProvider[] = [];
  private transformers: CartridgeTransformer[] = [];
  private logger?: {debug: (msg: string) => void};

  constructor(logger?: {debug: (msg: string) => void}) {
    this.logger = logger;
  }

  /**
   * Add providers and transformers to the runner.
   */
  addProviders(providers: CartridgeProvider[]): void {
    this.providers.push(...providers);
  }

  /**
   * Add transformers to the runner.
   */
  addTransformers(transformers: CartridgeTransformer[]): void {
    this.transformers.push(...transformers);
  }

  /**
   * Get count of registered providers.
   */
  get providerCount(): number {
    return this.providers.length;
  }

  /**
   * Get count of registered transformers.
   */
  get transformerCount(): number {
    return this.transformers.length;
  }

  /**
   * Find cartridges using all registered providers and apply transformers.
   *
   * @param defaultCartridges - Cartridges from default discovery (SDK findCartridges)
   * @param options - Discovery options
   * @returns Final list of cartridge mappings
   */
  async findCartridges(
    defaultCartridges: CartridgeMapping[],
    options: CartridgeDiscoveryOptions,
  ): Promise<CartridgeMapping[]> {
    let cartridges: CartridgeMapping[] = [];

    // Run 'before' providers first
    const beforeProviders = this.providers.filter((p) => p.priority === 'before');
    for (const provider of beforeProviders) {
      try {
        this.logger?.debug(`Running cartridge provider: ${provider.name} (before)`);
        const found = await provider.findCartridges(options);
        cartridges.push(...found);
        this.logger?.debug(`Provider ${provider.name} found ${found.length} cartridge(s)`);
      } catch (error) {
        this.logger?.debug(
          `Provider ${provider.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Add default cartridges
    cartridges.push(...defaultCartridges);

    // Run 'after' providers
    const afterProviders = this.providers.filter((p) => p.priority === 'after');
    for (const provider of afterProviders) {
      try {
        this.logger?.debug(`Running cartridge provider: ${provider.name} (after)`);
        const found = await provider.findCartridges(options);
        cartridges.push(...found);
        this.logger?.debug(`Provider ${provider.name} found ${found.length} cartridge(s)`);
      } catch (error) {
        this.logger?.debug(
          `Provider ${provider.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Deduplicate by name (first wins)
    const seen = new Set<string>();
    cartridges = cartridges.filter((c) => {
      if (seen.has(c.name)) {
        return false;
      }
      seen.add(c.name);
      return true;
    });

    // Apply transformers in order
    for (const transformer of this.transformers) {
      try {
        this.logger?.debug(`Running cartridge transformer: ${transformer.name}`);
        cartridges = await transformer.transform(cartridges, options);
        this.logger?.debug(`Transformer ${transformer.name} returned ${cartridges.length} cartridge(s)`);
      } catch (error) {
        this.logger?.debug(
          `Transformer ${transformer.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return cartridges;
  }
}
