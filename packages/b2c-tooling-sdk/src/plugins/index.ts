/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Plugin discovery and loading for non-oclif consumers.
 *
 * This module enables VS Code extensions, MCP servers, and other non-CLI consumers
 * to load b2c-cli plugins installed via `b2c plugins:install`. It discovers plugins
 * from the oclif data directory and invokes their hooks without requiring `@oclif/core`.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { B2CPluginManager } from '@salesforce/b2c-tooling-sdk/plugins';
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const manager = new B2CPluginManager();
 * await manager.initialize();
 * manager.applyMiddleware();
 *
 * const { sourcesBefore, sourcesAfter } = manager.getConfigSources();
 * const config = resolveConfig({}, { sourcesBefore, sourcesAfter });
 * ```
 *
 * @module plugins
 */

export {B2CPluginManager, type PluginHookOptions} from './manager.js';
export {
  discoverPlugins,
  resolveOclifDataDir,
  type DiscoveredPlugin,
  type PluginDiscoveryOptions,
  type SupportedHookName,
} from './discovery.js';
export {createHookContext, invokeHook, type HookContext, type HookContextOptions} from './loader.js';
