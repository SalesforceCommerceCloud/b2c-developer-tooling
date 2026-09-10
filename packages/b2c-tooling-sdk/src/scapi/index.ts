/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Bundled SCAPI contracts and local JavaScript execution with SDK-authenticated requests. @module scapi */
export {loadScapiSchemas, findScapiOperation, resolveScapiReference} from './catalog.js';
export type {ApiDocument, ScapiSchemaEntry, ScapiSchemaDocument} from './catalog.js';
export {runScapiCode} from './runtime.js';
export type {ScapiCodeOptions} from './runtime.js';
export {
  loadBuiltinScapiSnippets,
  loadScapiSnippets,
  saveScapiSnippet,
  getScapiSnippetDirectory,
  initializeScapiSnippetStore,
} from './snippets.js';
export type {ScapiSnippet} from './snippets.js';
export {createScapiRequest} from './request.js';
export type {ScapiRequestOptions} from './request.js';
export {getScapiAuthInfo} from './authentication.js';
export type {ScapiAuthType, ScapiAuthInfo, ScapiAuthDiagnostic} from './authentication.js';
