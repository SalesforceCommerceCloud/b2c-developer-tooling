/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Test helpers and mock factories for unit tests.
 */

import type {NormalizedConfig, ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {Services} from '../src/services.js';

/**
 * Creates a minimal mock ResolvedB2CConfig for testing.
 * Provides empty/default implementations for all required methods.
 */
export function createMockResolvedConfig(values: Partial<NormalizedConfig> = {}): ResolvedB2CConfig {
  const config: ResolvedB2CConfig = {
    values: values as NormalizedConfig,
    warnings: [],
    sources: [],
    hasB2CInstanceConfig: () => false,
    hasMrtConfig: () => false,
    hasOAuthConfig: () => false,
    hasBasicAuthConfig: () => false,
    createB2CInstance(): B2CInstance {
      throw new Error('createB2CInstance not mocked');
    },
    createBasicAuth(): AuthStrategy {
      throw new Error('createBasicAuth not mocked');
    },
    createOAuth(): AuthStrategy {
      throw new Error('createOAuth not mocked');
    },
    createMrtAuth(): AuthStrategy {
      throw new Error('createMrtAuth not mocked');
    },
    createWebDavAuth(): AuthStrategy {
      throw new Error('createWebDavAuth not mocked');
    },
  };
  return config;
}

/**
 * Creates a loadServices function for testing.
 * Returns a function that always returns the same Services instance.
 *
 * @param services - Services instance to return
 * @returns Function that returns the Services instance
 */
export function createMockLoadServices(services: Services): () => Services {
  return () => services;
}
