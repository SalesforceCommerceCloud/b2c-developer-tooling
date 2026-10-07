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
import {existsSync} from 'node:fs';
import path from 'node:path';
import {
  loadDwJson,
  loadFullDwJson,
  addInstance,
  removeInstance,
  saveDwJson,
  setActiveInstance,
  updateInstanceConfig,
} from '../dw-json.js';
import {listConfigKeys} from '../config-write.js';
import {
  getPopulatedFields,
  kebabToCamelCase,
  mapDwJsonToNormalizedConfig,
  mapNormalizedConfigToDwJson,
} from '../mapping.js';
import type {
  ConfigSource,
  ConfigLoadResult,
  ResolveConfigOptions,
  InstanceInfo,
  CreateInstanceOptions,
  ConfigCatalogFile,
  ConfigUpdateResult,
  NormalizedConfig,
} from '../types.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Select the explicit, project-local, or global-default dw.json path.
 *
 * @throws Error if an empty config path selected no dw.json
 */
function selectConfigPath(options: ResolveConfigOptions): string | undefined {
  if (options.configPath === '') throw new Error('No dw.json is selected (empty config path).');
  if (options.configPath) return options.configPath;

  const projectConfigPath = path.join(options.projectDirectory ?? options.workingDirectory ?? process.cwd(), 'dw.json');
  if (existsSync(projectConfigPath)) return projectConfigPath;

  return options.defaultConfigPath;
}

/**
 * Select the ordered files that contribute instances to the effective catalog.
 *
 * An explicit config path is exact: it is the only file used, without the
 * global default. An empty config path selects no dw.json at all. A discovered
 * project dw.json is still supplemented by the global default.
 */
function selectConfigPaths(options: ResolveConfigOptions): string[] {
  if (options.configPath === '') return [];
  if (options.configPath !== undefined) {
    const explicitPath = path.resolve(options.configPath);
    return existsSync(explicitPath) ? [explicitPath] : [];
  }

  const paths: string[] = [];
  const primaryPath = path.resolve(
    path.join(options.projectDirectory ?? options.workingDirectory ?? process.cwd(), 'dw.json'),
  );

  if (existsSync(primaryPath)) paths.push(primaryPath);
  const defaultConfigPath = options.defaultConfigPath ? path.resolve(options.defaultConfigPath) : undefined;
  if (defaultConfigPath && existsSync(defaultConfigPath) && !paths.includes(defaultConfigPath)) {
    paths.push(defaultConfigPath);
  }
  return paths;
}

/** Whether a resolved file came from the shared global setting rather than the primary path. */
function isGlobalConfigPath(configPath: string, options: ResolveConfigOptions): boolean {
  if (!options.defaultConfigPath) return false;

  const primaryPath = path.resolve(
    options.configPath ?? path.join(options.projectDirectory ?? options.workingDirectory ?? process.cwd(), 'dw.json'),
  );
  const resolvedPath = path.resolve(configPath);
  return resolvedPath !== primaryPath && resolvedPath === path.resolve(options.defaultConfigPath);
}

/** Describe all files participating in instance selection. */
function createInstanceCatalog(
  configPaths: string[],
  selectedPath: string | undefined,
  options: ResolveConfigOptions,
): ConfigCatalogFile[] {
  const normalizedSelectedPath = selectedPath ? path.resolve(selectedPath) : undefined;
  return configPaths.map((configPath) => ({
    location: configPath,
    scope: isGlobalConfigPath(configPath, options) ? 'global' : 'primary',
    selected: path.resolve(configPath) === normalizedSelectedPath,
  }));
}

async function listInstancesFromPath(sourceName: string, configPath: string): Promise<InstanceInfo[]> {
  let result: Awaited<ReturnType<typeof loadFullDwJson>>;
  try {
    result = await loadFullDwJson({path: configPath});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    getLogger().warn({error: message}, '[DwJsonSource] Failed to read dw.json while listing instances');
    return [];
  }

  if (!result) return [];

  const instances: InstanceInfo[] = [];
  const {config, path: dwJsonPath} = result;
  if (config.name) {
    instances.push({
      name: config.name,
      hostname: config.hostname,
      active: config.active,
      source: sourceName,
      location: dwJsonPath,
    });
  }

  for (const item of config.configs ?? []) {
    if (item.name) {
      instances.push({
        name: item.name,
        hostname: item.hostname,
        active: item.active,
        source: sourceName,
        location: dwJsonPath,
      });
    }
  }
  return instances;
}

async function loadActiveConfig(configPath: string): Promise<Awaited<ReturnType<typeof loadDwJson>>> {
  const full = await loadFullDwJson({path: configPath});
  if (!full) return undefined;

  const active = full.config.configs?.find((item) => item.active === true);
  if (active?.name) return loadDwJson({path: configPath, instance: active.name});
  if (full.config.active === true) {
    return loadDwJson({path: configPath, instance: full.config.name});
  }
  return undefined;
}

/** Load a file's root/default entry only when it contains configuration fields. */
async function loadDefaultConfig(configPath: string): Promise<Awaited<ReturnType<typeof loadDwJson>>> {
  const result = await loadDwJson({path: configPath});
  if (!result) return undefined;
  if (result.config.active === false) return undefined;

  const config = mapDwJsonToNormalizedConfig(result.config);
  return getPopulatedFields(config).length > 0 ? result : undefined;
}

/**
 * Configuration source that loads from dw.json files.
 *
 * @internal
 */
export class DwJsonSource implements ConfigSource {
  readonly name = 'DwJsonSource';
  readonly priority = 0;

  /**
   * Load configuration from dw.json.
   *
   * Searches for dw.json in the project directory and returns the resolved
   * configuration for the requested instance (or the active/root config when
   * no instance name is provided).
   *
   * @param options - Resolution options including instance name and project directory
   * @returns The loaded configuration and file location, or undefined if dw.json is not found
   */
  async load(options: ResolveConfigOptions): Promise<ConfigLoadResult | undefined> {
    const logger = getLogger();

    // Reported as a SOURCE_ERROR warning; an explicit path never falls back to another file.
    if (options.configPath && !existsSync(path.resolve(options.configPath))) {
      throw new Error(`Config file not found: ${path.resolve(options.configPath)}`);
    }

    const configPaths = selectConfigPaths(options);
    const result = await this.selectEntry(configPaths, options);

    const instanceCatalog = createInstanceCatalog(configPaths, result?.path, options);
    if (!result) {
      if (instanceCatalog.length > 0) {
        logger.trace({instanceCatalog}, '[DwJsonSource] No matching/default instance; catalog retained');
        return {config: {}, instanceCatalog};
      }
      return undefined;
    }

    const config = mapDwJsonToNormalizedConfig(result.config);
    const fields = getPopulatedFields(config);
    const scope = isGlobalConfigPath(result.path, options) ? 'global' : undefined;

    logger.trace({location: result.path, scope, fields}, '[DwJsonSource] Loaded config');

    return {config, location: result.path, scope, instanceCatalog};
  }

  /**
   * Update fields of the entry {@link load} selects for the same options.
   *
   * @throws Error if no entry is selected or a field has no dw.json key
   */
  async updateConfig(patch: Partial<NormalizedConfig>, options: ResolveConfigOptions): Promise<ConfigUpdateResult> {
    const selected = await this.selectEntry(selectConfigPaths(options), options);
    if (!selected) throw new Error('No dw.json entry is selected to update.');

    const dwPatch: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(patch)) {
      const key = listConfigKeys().find((entry) => entry.field === field);
      if (!key) throw new Error(`${field} can't be stored in dw.json.`);
      dwPatch[kebabToCamelCase(key.key)] = value;
    }
    const result = await updateInstanceConfig(dwPatch, {path: selected.path, instance: selected.config.name});
    return {location: result.path, instance: result.name};
  }

  /** Select the named, active, or root entry across the catalog files, in order. */
  private async selectEntry(
    configPaths: string[],
    options: ResolveConfigOptions,
  ): Promise<Awaited<ReturnType<typeof loadDwJson>>> {
    for (const configPath of configPaths) {
      const result = options.instance
        ? await loadDwJson({instance: options.instance, path: configPath})
        : ((await loadActiveConfig(configPath)) ?? (await loadDefaultConfig(configPath)));
      if (result) return result;
    }
    return undefined;
  }

  /**
   * List all instances from dw.json.
   */
  async listInstances(options?: ResolveConfigOptions): Promise<InstanceInfo[]> {
    const configPaths = options ? selectConfigPaths(options) : [path.join(process.cwd(), 'dw.json')];
    const instances: InstanceInfo[] = [];
    const names = new Set<string>();
    for (const configPath of configPaths) {
      for (const instance of await listInstancesFromPath(this.name, configPath)) {
        if (!names.has(instance.name)) {
          names.add(instance.name);
          instances.push(instance);
        }
      }
    }
    return instances;
  }

  /**
   * Create a new instance in dw.json.
   */
  async createInstance(options: CreateInstanceOptions & ResolveConfigOptions): Promise<void> {
    const dwJsonConfig = mapNormalizedConfigToDwJson(options.config, options.name);
    await addInstance(dwJsonConfig, {
      path: selectConfigPath(options),
      projectDirectory: options.projectDirectory ?? options.workingDirectory,
      setActive: options.setActive,
    });
    if (options.setActive) await this.setActiveInstance(options.name, options);
  }

  /**
   * Remove an instance from dw.json.
   */
  async removeInstance(name: string, options?: ResolveConfigOptions): Promise<void> {
    if (!options) return removeInstance(name);

    for (const configPath of selectConfigPaths(options)) {
      const instances = await listInstancesFromPath(this.name, configPath);
      if (instances.some((instance) => instance.name === name)) {
        return removeInstance(name, {path: configPath});
      }
    }
    throw new Error(`Instance "${name}" not found`);
  }

  /**
   * Set an instance as active in dw.json.
   */
  async setActiveInstance(name: string, options?: ResolveConfigOptions): Promise<void> {
    if (!options) return setActiveInstance(name);

    const configPaths = selectConfigPaths(options);
    let targetPath: string | undefined;
    for (const configPath of configPaths) {
      const instances = await listInstancesFromPath(this.name, configPath);
      if (instances.some((instance) => instance.name === name)) {
        targetPath = configPath;
        break;
      }
    }
    if (!targetPath) throw new Error(`Instance "${name}" not found`);

    await setActiveInstance(name, {path: targetPath});
    for (const configPath of configPaths) {
      if (configPath === targetPath) continue;
      const result = await loadFullDwJson({path: configPath});
      if (!result) continue;

      let changed = false;
      if (result.config.active === true) {
        result.config.active = false;
        changed = true;
      }
      for (const instance of result.config.configs ?? []) {
        if (instance.active === true) {
          instance.active = false;
          changed = true;
        }
      }
      if (changed) await saveDwJson(result.config, configPath);
    }
  }
}
