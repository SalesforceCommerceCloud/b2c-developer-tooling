/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Links resolution results to the source objects that produced them.
 *
 * Kept out of {@link ConfigSourceInfo} so serialized diagnostics never carry
 * source instances (which may hold environment maps or secrets).
 *
 * @module config/config-origins
 */
import type {ConfigSource, ConfigSourceInfo, ResolveConfigOptions} from './types.js';

/** A source that took part in resolution, with the options it was loaded with. */
export interface ConfigOrigin {
  source: ConfigSource;
  info: ConfigSourceInfo;
  options: ResolveConfigOptions;
}

const origins = new WeakMap<object, readonly ConfigOrigin[]>();

/** @internal Associate origins with a resolution result or resolved config. */
export function recordConfigOrigins(target: object, entries: readonly ConfigOrigin[] | undefined): void {
  if (entries) origins.set(target, entries);
}

/** Origins recorded for a resolution result or resolved config, in priority order. */
export function getConfigOrigins(target: object): readonly ConfigOrigin[] | undefined {
  return origins.get(target);
}
