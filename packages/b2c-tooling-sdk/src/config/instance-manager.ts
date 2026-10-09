/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Instance management service.
 *
 * Aggregates instance management operations across multiple config sources.
 *
 * @module config/instance-manager
 */
import {getLogger} from '../logging/logger.js';
import {CREDENTIAL_GROUPS, createConfigSources} from './resolver.js';
import type {
  ConfigSource,
  InstanceInfo,
  CreateInstanceOptions,
  ResolveConfigOptions,
  NormalizedConfig,
} from './types.js';

/** Where {@link InstanceManager.createInstance} stored an instance. */
export interface InstanceCreateResult {
  /** Name of the source that stores the instance */
  source: string;
  /** Credential fields stored in a credential store instead, and that store's name */
  credentials: Array<{field: keyof NormalizedConfig; source: string}>;
}

/**
 * Service for managing B2C instances across multiple config sources.
 *
 * This class aggregates instance management operations from all sources
 * that implement the optional instance management methods. Sources are used
 * in priority order (lower number first), the same order configuration
 * resolution uses.
 *
 * @example
 * ```typescript
 * import { createInstanceManager } from '@salesforce/b2c-tooling-sdk/config';
 *
 * // dw.json plus any globally registered (plugin) sources
 * const manager = createInstanceManager();
 *
 * // List all instances
 * const instances = await manager.listAllInstances();
 *
 * // Create a new instance
 * await manager.createInstance({
 *   name: 'staging',
 *   config: { hostname: 'staging.example.com' },
 *   setActive: true,
 * });
 * ```
 */
export class InstanceManager {
  private readonly sources: ConfigSource[];

  constructor(sources: ConfigSource[]) {
    this.sources = [...sources].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  /**
   * Create an instance in the specified source (or the highest-priority source that can create instances).
   *
   * Credentials go to a credential store (a source declaring
   * {@link ConfigSource.credentialFields}) when the store declares every field
   * given for a credential pair, such as both `clientId` and `clientSecret`.
   * Pairs always stay together, because configuration resolution reads a pair
   * from one source only. Otherwise the credentials stay with the instance.
   *
   * @param options - Instance creation options
   * @param targetSource - Source name to use (optional, defaults to first available)
   * @returns Where the instance and any routed credentials were stored
   * @throws Error if no instance sources available or specified source not found
   */
  async createInstance(
    options: CreateInstanceOptions & ResolveConfigOptions,
    targetSource?: string,
  ): Promise<InstanceCreateResult> {
    const instanceSources = this.getInstanceSources();

    if (instanceSources.length === 0) {
      throw new Error('No config sources support instance creation');
    }

    let source: ConfigSource;
    if (targetSource) {
      const found = instanceSources.find((s) => s.name === targetSource);
      if (!found) {
        throw new Error(`Source "${targetSource}" not found or does not support instance creation`);
      }
      source = found;
    } else {
      // Default to first (highest priority) instance source
      source = instanceSources[0];
    }

    const config = {...options.config};
    const routed: Array<{field: keyof NormalizedConfig; source: ConfigSource; value: string}> = [];
    for (const group of CREDENTIAL_GROUPS) {
      const fields = group.filter((field) => typeof config[field] === 'string');
      if (fields.length === 0) continue;
      const covers = (s: ConfigSource) => fields.every((field) => s.credentialFields?.includes(field));
      if (covers(source)) continue;
      const store = this.sources.find((s) => s.storeCredential && covers(s));
      if (!store) continue;
      for (const field of fields) {
        routed.push({field, source: store, value: config[field] as string});
        delete config[field];
      }
    }

    await source.createInstance!({...options, config});
    for (const {field, source: store, value} of routed) {
      await store.storeCredential!(options.name, field, value, options);
    }

    return {source: source.name, credentials: routed.map(({field, source: store}) => ({field, source: store.name}))};
  }

  /**
   * Find an instance by name in the highest-priority source that lists it.
   *
   * @param name - Instance name
   * @param options - Resolution options
   * @returns The instance, or undefined if no source lists it
   */
  async findInstance(name: string, options?: ResolveConfigOptions): Promise<InstanceInfo | undefined> {
    return (await this.listAllInstances(options)).find((instance) => instance.name === name);
  }

  /**
   * Get sources that can store a specific credential field.
   *
   * @param field - The credential field to check
   * @returns Array of sources that can store the field
   */
  getCredentialSources(field: keyof NormalizedConfig): ConfigSource[] {
    return this.sources.filter((s) => s.credentialFields?.includes(field));
  }

  /**
   * Get sources that can create instances.
   *
   * @returns Array of sources with createInstance() method
   */
  getInstanceSources(): ConfigSource[] {
    return this.sources.filter((s) => s.createInstance);
  }

  /**
   * List instances from all sources that implement listInstances(), in source priority order.
   *
   * Each instance's `source` is the name of the source that lists it. A source
   * whose listing fails is skipped with a warning, so one broken plugin doesn't
   * hide every other instance.
   *
   * @param options - Resolution options
   * @returns Array of all instances from all sources
   */
  async listAllInstances(options?: ResolveConfigOptions): Promise<InstanceInfo[]> {
    const allInstances: InstanceInfo[] = [];

    for (const source of this.sources) {
      if (!source.listInstances) continue;
      try {
        // Report the owning source's name so callers can target it (setActiveInstance, removeInstance).
        allInstances.push(...(await source.listInstances(options)).map((i) => ({...i, source: source.name})));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        getLogger().warn({source: source.name, error: message}, `[InstanceManager] Could not list instances`);
      }
    }

    return allInstances;
  }

  /**
   * Remove an instance from the source that contains it.
   *
   * Also asks every credential store to remove that instance's credentials, so
   * no secrets are left behind. A store that fails to remove them is skipped
   * with a warning.
   *
   * @param name - Instance name to remove
   * @param options - Resolution options
   * @param sourceName - Source to remove it from (default: the highest-priority source that lists it)
   * @returns The removed instance
   * @throws Error if instance not found in any source
   */
  async removeInstance(name: string, options?: ResolveConfigOptions, sourceName?: string): Promise<InstanceInfo> {
    const {source, instance} = await this.findOwner(name, 'removeInstance', options, sourceName);
    await source.removeInstance!(name, options);

    for (const store of this.sources) {
      if (store === source || !store.removeCredential || !store.credentialFields) continue;
      for (const field of store.credentialFields) {
        try {
          await store.removeCredential(name, field, options);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          getLogger().warn(
            {source: store.name, field, error: message},
            `[InstanceManager] Could not remove a stored credential`,
          );
        }
      }
    }

    return instance;
  }

  /**
   * Set an instance as active in the source that contains it.
   *
   * @param name - Instance name to set as active
   * @param options - Resolution options
   * @param sourceName - Source that holds it (default: the highest-priority source that lists it)
   * @returns The activated instance
   * @throws Error if instance not found in any source
   */
  async setActiveInstance(name: string, options?: ResolveConfigOptions, sourceName?: string): Promise<InstanceInfo> {
    const {source, instance} = await this.findOwner(name, 'setActiveInstance', options, sourceName);
    await source.setActiveInstance!(name, options);
    return instance;
  }

  /**
   * Store a credential for an instance in the specified source.
   *
   * @param instanceName - Instance name
   * @param field - Config field to store
   * @param value - Value to store
   * @param targetSource - Source name to use (optional)
   * @param options - Resolution options
   * @throws Error if no credential sources support the field
   */
  async storeCredential(
    instanceName: string,
    field: keyof NormalizedConfig,
    value: string,
    targetSource?: string,
    options?: ResolveConfigOptions,
  ): Promise<void> {
    const credentialSources = this.getCredentialSources(field);

    if (credentialSources.length === 0) {
      throw new Error(`No config sources support storing credential field "${String(field)}"`);
    }

    let source: ConfigSource;
    if (targetSource) {
      const found = credentialSources.find((s) => s.name === targetSource);
      if (!found) {
        throw new Error(`Source "${targetSource}" not found or does not support credential storage`);
      }
      source = found;
    } else {
      source = credentialSources[0];
    }

    await source.storeCredential!(instanceName, field, value, options);
  }

  /** The highest-priority source (or the one named) that lists `name` and implements `method`. */
  private async findOwner(
    name: string,
    method: 'removeInstance' | 'setActiveInstance',
    options?: ResolveConfigOptions,
    sourceName?: string,
  ): Promise<{instance: InstanceInfo; source: ConfigSource}> {
    for (const source of this.sources) {
      if (!source.listInstances || !source[method] || (sourceName && source.name !== sourceName)) continue;
      const instance = (await source.listInstances(options)).find((i) => i.name === name);
      if (instance) return {source, instance};
    }

    throw new Error(`Instance "${name}" not found in ${sourceName ? `source "${sourceName}"` : 'any source'}`);
  }
}

/**
 * Create an InstanceManager with the given sources.
 *
 * @param sources - Config sources to use (default: the sources configuration
 *   resolution reads, including globally registered plugin sources)
 * @returns InstanceManager instance
 */
export function createInstanceManager(sources: ConfigSource[] = createConfigSources()): InstanceManager {
  return new InstanceManager(sources);
}
