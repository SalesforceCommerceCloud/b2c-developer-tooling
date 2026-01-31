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
import type {
  ConfigSource,
  InstanceInfo,
  CreateInstanceOptions,
  ResolveConfigOptions,
  NormalizedConfig,
} from './types.js';

/**
 * Service for managing B2C instances across multiple config sources.
 *
 * This class aggregates instance management operations from all sources
 * that implement the optional instance management methods.
 *
 * @example
 * ```typescript
 * import { InstanceManager, DwJsonSource } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const manager = new InstanceManager([new DwJsonSource()]);
 *
 * // List all instances
 * const instances = manager.listAllInstances();
 *
 * // Create a new instance
 * manager.createInstance({
 *   name: 'staging',
 *   config: { hostname: 'staging.example.com' },
 *   setActive: true,
 * });
 * ```
 */
export class InstanceManager {
  constructor(private readonly sources: ConfigSource[]) {}

  /**
   * List instances from all sources that implement listInstances().
   *
   * @param options - Resolution options
   * @returns Array of all instances from all sources
   */
  listAllInstances(options?: ResolveConfigOptions): InstanceInfo[] {
    const allInstances: InstanceInfo[] = [];

    for (const source of this.sources) {
      if (source.listInstances) {
        const instances = source.listInstances(options);
        allInstances.push(...instances);
      }
    }

    return allInstances;
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
   * Get sources that can store a specific credential field.
   *
   * @param field - The credential field to check
   * @returns Array of sources that can store the field
   */
  getCredentialSources(field: keyof NormalizedConfig): ConfigSource[] {
    return this.sources.filter((s) => s.credentialFields?.includes(field));
  }

  /**
   * Create an instance in the specified source (or default to first instance source).
   *
   * @param options - Instance creation options
   * @param targetSource - Source name to use (optional, defaults to first available)
   * @throws Error if no instance sources available or specified source not found
   */
  createInstance(options: CreateInstanceOptions & ResolveConfigOptions, targetSource?: string): void {
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

    source.createInstance!(options);
  }

  /**
   * Remove an instance from the source that contains it.
   *
   * @param name - Instance name to remove
   * @param options - Resolution options
   * @throws Error if instance not found in any source
   */
  removeInstance(name: string, options?: ResolveConfigOptions): void {
    // Find the source that has this instance
    for (const source of this.sources) {
      if (source.listInstances && source.removeInstance) {
        const instances = source.listInstances(options);
        if (instances.some((i) => i.name === name)) {
          source.removeInstance(name, options);
          return;
        }
      }
    }

    throw new Error(`Instance "${name}" not found in any source`);
  }

  /**
   * Set an instance as active in the source that contains it.
   *
   * @param name - Instance name to set as active
   * @param options - Resolution options
   * @throws Error if instance not found in any source
   */
  setActiveInstance(name: string, options?: ResolveConfigOptions): void {
    // Find the source that has this instance
    for (const source of this.sources) {
      if (source.listInstances && source.setActiveInstance) {
        const instances = source.listInstances(options);
        if (instances.some((i) => i.name === name)) {
          source.setActiveInstance(name, options);
          return;
        }
      }
    }

    throw new Error(`Instance "${name}" not found in any source`);
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
  storeCredential(
    instanceName: string,
    field: keyof NormalizedConfig,
    value: string,
    targetSource?: string,
    options?: ResolveConfigOptions,
  ): void {
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

    source.storeCredential!(instanceName, field, value, options);
  }
}

/**
 * Create an InstanceManager with the given sources.
 *
 * @param sources - Config sources to use
 * @returns InstanceManager instance
 */
export function createInstanceManager(sources: ConfigSource[]): InstanceManager {
  return new InstanceManager(sources);
}
