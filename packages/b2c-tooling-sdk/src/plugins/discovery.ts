/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {Logger} from '../logging/types.js';

/**
 * Hook names that the plugin system supports.
 */
const SUPPORTED_HOOKS = ['b2c:config-sources', 'b2c:http-middleware', 'b2c:auth-middleware'] as const;

export type SupportedHookName = (typeof SUPPORTED_HOOKS)[number];

/**
 * A discovered plugin with its hook file paths.
 */
export interface DiscoveredPlugin {
  /** Plugin package name */
  name: string;
  /** Absolute path to the plugin's package directory */
  packageDir: string;
  /** Map of hook name to relative file path(s) within the plugin package */
  hooks: Partial<Record<SupportedHookName, string[]>>;
}

/**
 * Options for plugin discovery.
 */
export interface PluginDiscoveryOptions {
  /** Override the oclif data directory (for testing) */
  dataDir?: string;
  /** Override the dirname used to resolve the data directory (default: 'b2c') */
  dirname?: string;
  /** Logger for warnings */
  logger?: Logger;
}

/**
 * Resolves the oclif data directory for the CLI.
 *
 * Cross-platform: uses `$XDG_DATA_HOME/<dirname>` or `~/.local/share/<dirname>`
 * on POSIX; `$LOCALAPPDATA\<dirname>` on Windows.
 */
export function resolveOclifDataDir(dirname = 'b2c'): string {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, dirname);
  }

  const xdgDataHome = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share');
  return path.join(xdgDataHome, dirname);
}

/**
 * Reads a JSON file, returning undefined on any error.
 */
function readJsonSafe(filePath: string): unknown {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

/**
 * Normalizes a hook value (string or string[]) to a string array.
 */
function normalizeHookPaths(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

/**
 * Extracts the plugin name from an oclif plugins entry.
 *
 * Oclif stores user-installed plugins as objects: `{name, type, url}`,
 * while linked/dev plugins may appear as plain strings.
 */
function resolvePluginName(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null && 'name' in entry) {
    const name = (entry as {name: unknown}).name;
    if (typeof name === 'string') return name;
  }
  return undefined;
}

/**
 * Discovers installed b2c-cli plugins by reading the oclif data directory.
 *
 * Reads `<dataDir>/package.json` -> `oclif.plugins` array -> each plugin's
 * `package.json` -> `oclif.hooks` -> returns `DiscoveredPlugin[]`.
 *
 * Only hooks matching `b2c:config-sources`, `b2c:http-middleware`, and
 * `b2c:auth-middleware` are included.
 */
export function discoverPlugins(options: PluginDiscoveryOptions = {}): DiscoveredPlugin[] {
  const {logger} = options;
  const dataDir = options.dataDir ?? resolveOclifDataDir(options.dirname);
  const plugins: DiscoveredPlugin[] = [];

  // Read the root package.json in the data directory
  const rootPkgPath = path.join(dataDir, 'package.json');
  const rootPkg = readJsonSafe(rootPkgPath) as {oclif?: {plugins?: unknown[]}} | undefined;
  if (!rootPkg?.oclif?.plugins?.length) {
    return plugins;
  }

  const nodeModulesDir = path.join(dataDir, 'node_modules');

  for (const pluginEntry of rootPkg.oclif.plugins) {
    const pluginName = resolvePluginName(pluginEntry);
    if (!pluginName) continue;

    try {
      const pluginDir = path.join(nodeModulesDir, ...pluginName.split('/'));
      const pluginPkgPath = path.join(pluginDir, 'package.json');
      const pluginPkg = readJsonSafe(pluginPkgPath) as {oclif?: {hooks?: Record<string, unknown>}} | undefined;

      if (!pluginPkg?.oclif?.hooks) continue;

      const hookEntries = pluginPkg.oclif.hooks;
      const discoveredHooks: Partial<Record<SupportedHookName, string[]>> = {};
      let hasHooks = false;

      for (const hookName of SUPPORTED_HOOKS) {
        if (hookName in hookEntries) {
          const paths = normalizeHookPaths(hookEntries[hookName]);
          if (paths.length > 0) {
            discoveredHooks[hookName] = paths;
            hasHooks = true;
          }
        }
      }

      if (hasHooks) {
        plugins.push({
          name: pluginName,
          packageDir: pluginDir,
          hooks: discoveredHooks,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger?.warn(`Failed to discover plugin ${pluginName}: ${message}`);
    }
  }

  return plugins;
}
