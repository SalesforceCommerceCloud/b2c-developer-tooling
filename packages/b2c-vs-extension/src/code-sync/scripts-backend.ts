/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Builds a Scripts (code-version) backend that honors the configured
 * `apiBackend` preference, mirroring how `CodeCommand` does it in the CLI.
 * In `auto` mode this lets SCAPI-only setups manage code versions through
 * `sfcc.scripts(.rw)` instead of OCAPI, with transparent OCAPI fallback on
 * `invalid_scope`.
 */
import {createScriptsBackend, type ScriptsBackend} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import type {B2CExtensionConfig} from '../config-provider.js';

export function createScriptsBackendFromExtension(
  configProvider: B2CExtensionConfig,
  instance: B2CInstance,
): ScriptsBackend {
  const resolved = configProvider.getConfig();
  const preference = resolved?.values.apiBackend ?? 'auto';
  const auth = resolved?.hasOAuthConfig() ? resolved.createOAuth() : undefined;

  return createScriptsBackend({
    preference,
    instance,
    shortCode: resolved?.values.shortCode,
    tenantId: resolved?.values.tenantId,
    auth,
  });
}
