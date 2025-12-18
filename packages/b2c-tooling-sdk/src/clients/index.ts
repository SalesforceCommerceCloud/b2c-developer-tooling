/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
export {WebDavClient} from './webdav.js';
export type {PropfindEntry} from './webdav.js';

export {createAuthMiddleware, createLoggingMiddleware, createExtraParamsMiddleware} from './middleware.js';
export type {ExtraParamsConfig, LoggingMiddlewareConfig} from './middleware.js';

export {createOcapiClient} from './ocapi.js';
export type {
  OcapiClient,
  OcapiError,
  OcapiResponse,
  paths as OcapiPaths,
  components as OcapiComponents,
} from './ocapi.js';

export {createSlasClient} from './slas-admin.js';
export type {
  SlasClient,
  SlasClientConfig,
  SlasError,
  SlasResponse,
  paths as SlasPaths,
  components as SlasComponents,
} from './slas-admin.js';

export {createOdsClient} from './ods.js';
export type {
  OdsClient,
  OdsClientConfig,
  OdsError,
  OdsResponse,
  paths as OdsPaths,
  components as OdsComponents,
} from './ods.js';

export {createMrtClient, DEFAULT_MRT_ORIGIN} from './mrt.js';
export type {
  MrtClient,
  MrtClientConfig,
  MrtError,
  MrtResponse,
  BuildPushResponse,
  paths as MrtPaths,
  components as MrtComponents,
} from './mrt.js';
