/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * dw.json configuration source.
 *
 * @internal This module is internal to the SDK. Use ConfigResolver instead.
 */
import {loadDwJson, loadFullDwJson, addInstance, removeInstance, setActiveInstance} from '../dw-json.js';
import {getPopulatedFields, mapDwJsonToNormalizedConfig, mapNormalizedConfigToDwJson} from '../mapping.js';
import type {
  ConfigSource,
  ConfigLoadResult,
  ResolveConfigOptions,
  InstanceInfo,
  CreateInstanceOptions,
} from '../types.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Configuration source that loads from dw.json files.
 *
 * @internal
 */
export class DwJsonSource implements ConfigSource {
  readonly name = 'DwJsonSource';
  readonly priority = 0;

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const logger = getLogger();

    const result = loadDwJson({
      instance: options.instance,
      path: options.configPath,
      startDir: options.startDir,
    });

    if (!result) {
      return undefined;
    }

    const config = mapDwJsonToNormalizedConfig(result.config);
    const fields = getPopulatedFields(config);

    logger.trace({location: result.path, fields}, '[DwJsonSource] Loaded config');

    return {config, location: result.path};
  }

  /**
   * List all instances from dw.json.
   */
  listInstances(options?: ResolveConfigOptions): InstanceInfo[] {
    const result = loadFullDwJson({
      path: options?.configPath,
      startDir: options?.startDir,
    });

    if (!result) {
      return [];
    }

    const instances: InstanceInfo[] = [];
    const {config, path: dwJsonPath} = result;

    // Add root config if it has a name
    if (config.name) {
      instances.push({
        name: config.name,
        hostname: config.hostname,
        active: config.active,
        source: this.name,
        location: dwJsonPath,
      });
    }

    // Add configs array entries
    if (config.configs) {
      for (const c of config.configs) {
        if (c.name) {
          instances.push({
            name: c.name,
            hostname: c.hostname,
            active: c.active,
            source: this.name,
            location: dwJsonPath,
          });
        }
      }
    }

    return instances;
  }

  /**
   * Create a new instance in dw.json.
   */
  createInstance(options: CreateInstanceOptions & ResolveConfigOptions): void {
    const dwJsonConfig = mapNormalizedConfigToDwJson(options.config, options.name);
    addInstance(dwJsonConfig, {
      path: options.configPath,
      startDir: options.startDir,
      setActive: options.setActive,
    });
  }

  /**
   * Remove an instance from dw.json.
   */
  removeInstance(name: string, options?: ResolveConfigOptions): void {
    removeInstance(name, {
      path: options?.configPath,
      startDir: options?.startDir,
    });
  }

  /**
   * Set an instance as active in dw.json.
   */
  setActiveInstance(name: string, options?: ResolveConfigOptions): void {
    setActiveInstance(name, {
      path: options?.configPath,
      startDir: options?.startDir,
    });
  }
}
