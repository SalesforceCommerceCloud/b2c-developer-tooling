/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
export {run} from '@oclif/core';

// Re-export CLI utilities from b2c-tooling for convenience
export {
  // Command base classes
  BaseCommand,
  OAuthCommand,
  InstanceCommand,
  MrtCommand,
  // Config utilities
  loadConfig,
  findDwJson,
} from '@salesforce/b2c-tooling-sdk/cli';
export type {ResolvedConfig, LoadConfigOptions} from '@salesforce/b2c-tooling-sdk/cli';
