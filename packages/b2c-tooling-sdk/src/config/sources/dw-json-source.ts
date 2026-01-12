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
import {loadDwJson, findDwJson} from '../dw-json.js';
import {mapDwJsonToNormalizedConfig} from '../mapping.js';
import type {ConfigSource, NormalizedConfig, ResolveConfigOptions} from '../types.js';

/**
 * Configuration source that loads from dw.json files.
 *
 * @internal
 */
export class DwJsonSource implements ConfigSource {
  readonly name = 'dw.json';
  private lastPath?: string;

  load(options: ResolveConfigOptions): NormalizedConfig | undefined {
    const dwConfig = loadDwJson({
      instance: options.instance,
      path: options.configPath,
      startDir: options.startDir,
    });

    if (!dwConfig) {
      this.lastPath = undefined;
      return undefined;
    }

    // Track the path for diagnostics
    this.lastPath = options.configPath || findDwJson(options.startDir);

    return mapDwJsonToNormalizedConfig(dwConfig);
  }

  getPath(): string | undefined {
    return this.lastPath;
  }
}
