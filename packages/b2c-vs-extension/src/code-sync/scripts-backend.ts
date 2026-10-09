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
 *
 * SCAPI coordinates, auth, and the `apiBackend` preference all come from the
 * instance ({@link B2CInstance.scapiClientConfig} / {@link B2CInstance.apiBackend}),
 * which the extension builds from resolved config — so nothing extra needs to
 * be threaded here.
 */
import {createScriptsBackend, type ScriptsBackend} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';

export function createScriptsBackendFromExtension(instance: B2CInstance): ScriptsBackend {
  return createScriptsBackend({instance});
}
