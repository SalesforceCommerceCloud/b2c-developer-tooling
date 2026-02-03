/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {
  resolveLocalSource as sdkResolveLocalSource,
  resolveRemoteSource as sdkResolveRemoteSource,
  type DynamicParameterSource,
  type ScaffoldChoice,
  type SourceResult,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import {loadConfig} from '@salesforce/b2c-tooling-sdk/cli';

// Re-export SDK functions and types
export {isRemoteSource, validateAgainstSource, type SourceResult} from '@salesforce/b2c-tooling-sdk/scaffold';

/**
 * @deprecated Use SourceResult from '@salesforce/b2c-tooling-sdk/scaffold' instead.
 * This type alias is kept for backwards compatibility.
 */
export type LocalSourceResult = SourceResult;

/**
 * Resolves a local (non-remote) parameter source.
 * Delegates to SDK function.
 *
 * @param source - The source type to resolve
 * @param projectRoot - Project root directory for cartridge discovery
 * @returns Resolved choices and optional path mapping
 */
export function resolveLocalSource(source: DynamicParameterSource, projectRoot: string): SourceResult {
  return sdkResolveLocalSource(source, projectRoot);
}

/**
 * CLI wrapper for remote source resolution.
 * Handles auth orchestration using CLI config loading.
 *
 * @param source - The source type to resolve
 * @returns Promise resolving to choices array
 * @throws Error if authentication fails or API call fails
 */
export async function resolveRemoteSource(source: DynamicParameterSource): Promise<ScaffoldChoice[]> {
  const config = loadConfig({}, {configPath: undefined});

  if (!config.hasB2CInstanceConfig() || !config.hasOAuthConfig()) {
    throw new Error('B2C instance configuration with OAuth required for sites source');
  }

  const instance = config.createB2CInstance();
  return sdkResolveRemoteSource(source, instance);
}
