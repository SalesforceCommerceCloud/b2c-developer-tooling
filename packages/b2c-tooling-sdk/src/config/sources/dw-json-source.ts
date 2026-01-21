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
import {loadDwJson} from '../dw-json.js';
import {getPopulatedFields} from '../mapping.js';
import {mapDwJsonToNormalizedConfig} from '../mapping.js';
import type {ConfigSource, ConfigLoadResult, ResolveConfigOptions} from '../types.js';
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
}
