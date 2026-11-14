/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {MetadataRule} from '../types.js';
import {csrfAllowlist} from './csrf-allowlist.js';
import {ocapiBroadAccess, ocapiDemoClientId} from './ocapi.js';
import {preferenceSecretValue, secretAttributeNotPassword} from './secrets.js';
import {serviceCommunicationLog, serviceCredentialPassword, serviceInsecureUrl} from './services.js';

/**
 * Built-in metadata rules. To add one, create it in this directory, add it
 * here, add fixtures under `test/security/fixtures/<rule-id>/`, and add a
 * section to `docs/guide/security-rules.md`.
 */
export const METADATA_RULES: readonly MetadataRule[] = Object.freeze([
  csrfAllowlist,
  ocapiBroadAccess,
  ocapiDemoClientId,
  preferenceSecretValue,
  secretAttributeNotPassword,
  serviceCommunicationLog,
  serviceCredentialPassword,
  serviceInsecureUrl,
]);
