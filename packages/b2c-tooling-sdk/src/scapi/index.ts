/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Bundled, live, and local SCAPI contracts and local JavaScript execution with SDK-authenticated requests. @module scapi */
export {loadScapiSchemas, findScapiOperation, resolveScapiReference} from './catalog.js';
export type {ApiDocument, ScapiSchemaEntry, ScapiSchemaDocument} from './catalog.js';
export {
  ScapiLiveSchemaCache,
  createLiveScapiDocument,
  matchesScapiApi,
  mergeScapiSchemas,
  scapiTenantKey,
  suggestScapiApis,
} from './live.js';
export {isRemoteScapiSchema, loadLocalScapiSchemas, loadScapiSchemaOverrides} from './local.js';
export type {ScapiSchemaOverrideOptions} from './local.js';
export {
  SCAPI_SCHEMA_EXPANSIONS,
  SCAPI_STANDARD_SCHEMA_EXPAND,
  normalizeScapiSchemaExpand,
  scapiExpandIncludes,
  isFullScapiExpand,
  scapiSchemaExpandFor,
  findBundledScapiSchema,
  listBundledScapiSchemas,
  fetchScapiSchemaWithFallback,
  listScapiSchemasWithFallback,
} from './schema-source.js';
export type {
  ScapiSchemaExpansion,
  ScapiSchemaNeeds,
  ScapiSchemaIdentity,
  ScapiSchemaFilter,
  ScapiSchemaSource,
  ScapiSchemaFetchResult,
  ScapiSchemaListFetchResult,
} from './schema-source.js';
export type {ScapiLiveSchemaCacheOptions, ScapiLiveSchemaLoadOptions, ScapiLiveSchemaLoadResult} from './live.js';
export {ScapiShopperSessions} from './shopper.js';
export type {ScapiShopperAuth, ScapiShopperConfig} from './shopper.js';
export {runScapiCode} from './runtime.js';
export {createScapiAuth} from './auth-primitives.js';
export type {ScapiCodeOptions, ScapiRuntimeControl} from './runtime.js';
export {
  loadBuiltinScapiSnippets,
  loadScapiSnippets,
  saveScapiSnippet,
  getScapiSnippetDirectory,
  initializeScapiSnippetStore,
} from './snippets.js';
export type {ScapiSnippet} from './snippets.js';
export {createScapiRequest} from './request.js';
export type {ScapiRequestOptions, ScapiConfirmation} from './request.js';
export {getScapiAuthInfo, selectScapiAuth} from './authentication.js';
export type {ScapiAuthType, ScapiAuthInfo, ScapiAuthDiagnostic, ScapiRequestAuth} from './authentication.js';
