/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {getLogger} from '../logging/logger.js';

export const B2C_SETTINGS_FILENAME = 'settings.json';

/** User-level settings shared by the B2C CLI, MCP server, and SDK consumers. */
export interface B2CSettings {
  [key: string]: unknown;
  /** Global dw.json-format instance catalog used after an explicit or project-local file. */
  defaultConfigPath?: string;
}

/** Options for resolving the shared B2C settings location. */
export interface B2CSettingsPathOptions {
  /** Explicit oclif-compatible configuration directory. */
  configDirectory?: string;
  /** Environment used for platform path resolution. Defaults to process.env. */
  environment?: NodeJS.ProcessEnv;
  /** Home directory used when no platform environment override is set. */
  homeDirectory?: string;
  /** Platform used for path resolution. Defaults to process.platform. */
  platform?: NodeJS.Platform;
}

/** Resolve the shared oclif-compatible B2C configuration directory. */
export function getB2CConfigDirectory(options: B2CSettingsPathOptions = {}): string {
  if (options.configDirectory) return path.resolve(options.configDirectory);

  const environment = options.environment ?? process.env;
  const homeDirectory = options.homeDirectory ?? os.homedir();
  const platform = options.platform ?? process.platform;
  const baseDirectory =
    environment.B2C_CONFIG_DIR ??
    environment.XDG_CONFIG_HOME ??
    (platform === 'win32' ? environment.LOCALAPPDATA : undefined) ??
    path.join(homeDirectory, '.config');

  return path.join(baseDirectory, 'b2c');
}

/** Resolve the shared settings.json path. */
export function getB2CSettingsPath(options: B2CSettingsPathOptions = {}): string {
  return path.join(getB2CConfigDirectory(options), B2C_SETTINGS_FILENAME);
}

/** Read shared B2C settings. Missing or invalid files are treated as unset. */
export function readB2CSettings(options: B2CSettingsPathOptions = {}): B2CSettings {
  const settingsPath = getB2CSettingsPath(options);
  if (!existsSync(settingsPath)) return {};

  try {
    const parsed = JSON.parse(readFileSync(settingsPath, 'utf8')) as Record<string, unknown>;
    const defaultConfigPath = parsed.defaultConfigPath;
    if (defaultConfigPath === undefined) return parsed;
    if (typeof defaultConfigPath !== 'string' || defaultConfigPath.trim().length === 0) {
      getLogger().warn({settingsPath}, '[Config] Ignoring invalid defaultConfigPath in B2C settings');
      delete parsed.defaultConfigPath;
      return parsed;
    }

    return {
      ...parsed,
      defaultConfigPath: path.isAbsolute(defaultConfigPath)
        ? defaultConfigPath
        : path.resolve(path.dirname(settingsPath), defaultConfigPath),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    getLogger().warn({settingsPath, error: message}, '[Config] Failed to read B2C settings');
    return {};
  }
}

/** Write shared B2C settings atomically. */
export function writeB2CSettings(settings: B2CSettings, options: B2CSettingsPathOptions = {}): void {
  const settingsPath = getB2CSettingsPath(options);
  const configDirectory = path.dirname(settingsPath);
  const temporaryPath = `${settingsPath}.${process.pid}.tmp`;
  mkdirSync(configDirectory, {recursive: true});
  writeFileSync(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, {encoding: 'utf8', mode: 0o600});
  renameSync(temporaryPath, settingsPath);
}
