/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ScriptRule} from '../rule.js';
import dynamicCode from './dynamic-code.js';
import filePathFromRequest from './file-path-from-request.js';
import hardcodedCredentials from './hardcoded-credentials.js';
import insecureCookie from './insecure-cookie.js';
import objectQueryInjection from './object-query-injection.js';
import openRedirect from './open-redirect.js';
import weakCrypto from './weak-crypto.js';

/**
 * Every built-in security rule. To add a rule, create a file in this
 * directory, add it here, add fixtures under `test/security/fixtures/<rule-id>/`,
 * and add a section to `docs/guide/security-rules.md`.
 */
export const SCRIPT_RULES: readonly ScriptRule[] = Object.freeze([
  dynamicCode,
  filePathFromRequest,
  hardcodedCredentials,
  insecureCookie,
  objectQueryInjection,
  openRedirect,
  weakCrypto,
]);
