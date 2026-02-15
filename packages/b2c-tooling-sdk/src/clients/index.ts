/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * API clients for B2C Commerce operations.
 *
 * This module provides typed client classes for interacting with B2C Commerce
 * APIs including WebDAV, OCAPI, SCAPI, and ODS.
 *
 * ## Available Clients
 *
 * - {@link WebDavClient} - File operations via WebDAV
 * - {@link OcapiClient} - Data API operations via OCAPI (openapi-fetch Client)
 * - {@link SlasClient} - SLAS Admin API for managing tenants and clients
 * - {@link OdsClient} - On-Demand Sandbox API for managing developer sandboxes
 * - {@link CustomApisClient} - Custom APIs DX API for retrieving endpoint status
 * - {@link ScapiSchemasClient} - SCAPI Schemas API for discovering and retrieving OpenAPI schemas
 *
 * ## Usage
 *
 * **Note:** These clients are typically accessed via `B2CInstance` rather than
 * instantiated directly. The `B2CInstance` class handles authentication setup
 * and provides convenient `webdav` and `ocapi` getters.
 *
 * ```typescript
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig({
 *   clientId: process.env.SFCC_CLIENT_ID,
 *   clientSecret: process.env.SFCC_CLIENT_SECRET,
 * });
 * const instance = config.createB2CInstance();
 *
 * // WebDAV operations via instance.webdav
 * await instance.webdav.put('Cartridges/v1/app.zip', content);
 *
 * // OCAPI operations via instance.ocapi (openapi-fetch)
 * const { data } = await instance.ocapi.GET('/sites', {});
 * ```
 *
 * ## Direct Client Usage
 *
 * For advanced use cases, clients can be instantiated directly:
 *
 * ```typescript
 * import { WebDavClient, createOcapiClient, createSlasClient } from '@salesforce/b2c-tooling-sdk/clients';
 *
 * const webdav = new WebDavClient('sandbox.demandware.net', authStrategy);
 * const ocapi = createOcapiClient('sandbox.demandware.net', authStrategy);
 *
 * // SLAS client for managing SLAS clients and tenants
 * const slas = createSlasClient({ shortCode: 'kv7kzm78' }, oauthStrategy);
 * ```
 *
 * ## Creating New API Clients
 *
 * API clients follow a consistent pattern using
 * {@link https://openapi-ts.dev/openapi-fetch/ | openapi-fetch} for type-safe
 * HTTP requests and {@link https://openapi-ts.dev/ | openapi-typescript} for
 * generating TypeScript types from OpenAPI specifications.
 *
 * ### Step 1: Add the OpenAPI Specification
 *
 * Place the OpenAPI spec (JSON or YAML) in `specs/`:
 *
 * ```
 * packages/b2c-tooling/specs/my-api-v1.yaml
 * ```
 *
 * ### Step 2: Generate TypeScript Types
 *
 * Add a generation command to `package.json` and run it:
 *
 * ```bash
 * openapi-typescript specs/my-api-v1.yaml -o src/clients/my-api.generated.ts
 * ```
 *
 * ### Step 3: Create the Client Module
 *
 * Create a new client file following this pattern:
 *
 * ```typescript
 * // src/clients/my-api.ts
 * import createClient, { type Client } from 'openapi-fetch';
 * import type { AuthStrategy } from '../auth/types.js';
 * import type { paths, components } from './my-api.generated.js';
 * import { createAuthMiddleware, createLoggingMiddleware } from './middleware.js';
 *
 * export type { paths, components };
 * export type MyApiClient = Client<paths>;
 *
 * export function createMyApiClient(config: MyApiConfig, auth: AuthStrategy): MyApiClient {
 *   const client = createClient<paths>({
 *     baseUrl: `https://${config.host}/api/v1`,
 *   });
 *
 *   // Add middleware - auth first, logging last (so logging sees complete request)
 *   client.use(createAuthMiddleware(auth));
 *   client.use(createLoggingMiddleware('MYAPI'));
 *
 *   return client;
 * }
 * ```
 *
 * ### Conventions
 *
 * - **Factory function**: Use `createXxxClient()` pattern (not classes)
 * - **Type exports**: Re-export `paths` and `components` for consumers
 * - **Client type**: Export a type alias `XxxClient = Client<paths>`
 * - **Middleware order**: Logging first, then auth (auth runs last on request)
 * - **Log prefix**: Use short, uppercase identifier (e.g., 'OCAPI', 'SLAS', 'SCAPI')
 * - **Generated files**: Name as `xxx.generated.ts` to indicate auto-generation
 *
 * @module clients
 */
export {WebDavClient} from './webdav.js';
export type {PropfindEntry, WebDavClientOptions} from './webdav.js';

export {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createLoggingMiddleware,
  createExtraParamsMiddleware,
  createUserAgentMiddleware,
} from './middleware.js';
export type {
  ExtraParamsConfig,
  LoggingMiddlewareConfig,
  UserAgentConfig,
  RateLimitMiddlewareConfig,
} from './middleware.js';

// User-Agent provider (auto-registers on import)
export {setUserAgent, getUserAgent, resetUserAgent, userAgentProvider} from './user-agent.js';

export {MiddlewareRegistry, globalMiddlewareRegistry} from './middleware-registry.js';
export type {HttpClientType, HttpMiddlewareProvider, UnifiedMiddleware} from './middleware-registry.js';

export {createOcapiClient} from './ocapi.js';
export type {
  OcapiClient,
  OcapiClientOptions,
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

export {
  createCustomApisClient,
  toOrganizationId,
  toTenantId,
  buildTenantScope,
  ORGANIZATION_ID_PREFIX,
  SCAPI_TENANT_SCOPE_PREFIX,
  CUSTOM_APIS_DEFAULT_SCOPES,
} from './custom-apis.js';
export type {
  CustomApisClient,
  CustomApisClientConfig,
  CustomApisError,
  CustomApisResponse,
  paths as CustomApisPaths,
  components as CustomApisComponents,
} from './custom-apis.js';

export {createScapiSchemasClient, SCAPI_SCHEMAS_DEFAULT_SCOPES} from './scapi-schemas.js';
export type {
  ScapiSchemasClient,
  ScapiSchemasClientConfig,
  ScapiSchemasError,
  ScapiSchemasResponse,
  SchemaListItem,
  SchemaListResult,
  OpenApiSchema,
  paths as ScapiSchemasPaths,
  components as ScapiSchemasComponents,
} from './scapi-schemas.js';

export {
  createAccountManagerClient,
  createAccountManagerUsersClient,
  getUser,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  purgeUser,
  resetUser,
  findUserByLogin,
  fetchRoleMapping,
  resolveToInternalRole,
  resolveFromInternalRole,
  createAccountManagerRolesClient,
  getRole,
  listRoles,
  createAccountManagerApiClientsClient,
  createAccountManagerOrgsClient,
  isValidRoleTenantFilter,
  ROLE_TENANT_FILTER_PATTERN,
} from './am-api.js';
export type {
  AccountManagerClient,
  AccountManagerClientConfig,
  AccountManagerUsersClient,
  AccountManagerUser,
  AccountManagerResponse,
  AccountManagerError,
  UserExpandOption,
  UserCreate,
  UserUpdate,
  UserCollection,
  UserState,
  ListUsersOptions,
  AccountManagerRolesClient,
  AccountManagerRole,
  AccountManagerRolesResponse,
  AccountManagerRolesError,
  RoleCollection,
  ListRolesOptions,
  RoleMapping,
  OrgMapping,
  AccountManagerApiClientsClient,
  AccountManagerApiClient,
  APIClientCreate,
  APIClientUpdate,
  APIClientCollection,
  ApiClientExpandOption,
  ListApiClientsOptions,
  AccountManagerOrgsClient,
  AccountManagerOrganization,
  OrganizationCollection,
  ListOrgsOptions,
} from './am-api.js';

export {createCdnZonesClient, CDN_ZONES_READ_SCOPES, CDN_ZONES_RW_SCOPES} from './cdn-zones.js';
export type {
  CdnZonesClient,
  CdnZonesClientConfig,
  CdnZonesClientOptions,
  CdnZonesError,
  CdnZonesResponse,
  Zone,
  ZonesEnvelope,
  Certificate,
  SecuritySetting,
  SpeedSetting,
  paths as CdnZonesPaths,
  components as CdnZonesComponents,
} from './cdn-zones.js';

export {createMrtB2CClient, DEFAULT_MRT_B2C_ORIGIN} from './mrt-b2c.js';
export type {
  MrtB2CClient,
  MrtB2CClientConfig,
  MrtB2CError,
  MrtB2CResponse,
  B2COrgInfo,
  B2CTargetInfo,
  PatchedB2CTargetInfo,
  paths as MrtB2CPaths,
  components as MrtB2CComponents,
} from './mrt-b2c.js';

export {createCipClient, CipClient, DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST} from './cip.js';
export type {
  CipClientConfig,
  CipColumn,
  CipExecuteResponse,
  CipFetchResponse,
  CipFrame,
  CipQueryOptions,
  CipQueryResult,
} from './cip.js';

export {getApiErrorMessage} from './error-utils.js';

export {createTlsDispatcher} from './tls-dispatcher.js';
export type {TlsOptions} from './tls-dispatcher.js';
