/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {B2CPluginManager} from '@salesforce/b2c-tooling-sdk/plugins';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {ConfigSource} from '@salesforce/b2c-tooling-sdk/config';

let manager: B2CPluginManager | undefined;

/**
 * Initializes the b2c-cli plugin system.
 *
 * Discovers plugins installed via `b2c plugins:install`, invokes their hooks,
 * and registers middleware with the global registries. All failures are
 * non-fatal — the extension continues to work without plugin support.
 */
export async function initializePlugins(): Promise<void> {
  try {
    const logger = getLogger();
    manager = new B2CPluginManager({logger});
    await manager.initialize();
    manager.applyMiddleware();

    if (manager.pluginNames.length > 0) {
      logger.info(`Loaded ${manager.pluginNames.length} plugin(s): ${manager.pluginNames.join(', ')}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      getLogger().warn(`Plugin initialization failed: ${message}`);
    } catch {
      // Logger not available — silently ignore
    }
    manager = undefined;
  }
}

/**
 * Returns config sources collected from plugins, split by priority.
 *
 * If plugins haven't been initialized yet (or initialization failed),
 * returns empty arrays — callers gracefully degrade to no-plugin behavior.
 */
export function getPluginConfigSources(): {sourcesBefore: ConfigSource[]; sourcesAfter: ConfigSource[]} {
  if (!manager?.initialized) {
    return {sourcesBefore: [], sourcesAfter: []};
  }
  return manager.getConfigSources();
}
