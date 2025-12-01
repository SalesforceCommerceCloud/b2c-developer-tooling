/**
 * API clients for B2C Commerce operations.
 *
 * This module provides typed client classes for interacting with B2C Commerce
 * APIs including WebDAV, OCAPI, and SCAPI.
 *
 * ## Available Clients
 *
 * - {@link WebDavClient} - File operations via WebDAV
 * - {@link OcapiClient} - Data API operations via OCAPI (openapi-fetch Client)
 * - {@link SlasClient} - SLAS Admin API for managing tenants and clients
 *
 * ## Usage
 *
 * **Note:** These clients are typically accessed via `B2CInstance` rather than
 * instantiated directly. The `B2CInstance` class handles authentication setup
 * and provides convenient `webdav` and `ocapi` getters.
 *
 * ```typescript
 * import { B2CInstance } from '@salesforce/b2c-tooling';
 *
 * const instance = B2CInstance.fromDwJson({
 *   clientSecret: process.env.SFCC_CLIENT_SECRET,
 * });
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
 * import { WebDavClient, createOcapiClient, createSlasClient } from '@salesforce/b2c-tooling/clients';
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
 *   // Add middleware - use a short identifier for log prefixes
 *   client.use(createLoggingMiddleware('MYAPI'));
 *   client.use(createAuthMiddleware(auth));
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
export type {PropfindEntry} from './webdav.js';

export {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';

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
