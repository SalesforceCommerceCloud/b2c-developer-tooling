/**
 * API clients for B2C Commerce operations.
 *
 * This module provides typed client classes for interacting with B2C Commerce
 * APIs including WebDAV and OCAPI.
 *
 * ## Available Clients
 *
 * - {@link WebDavClient} - File operations via WebDAV
 * - {@link OcapiClient} - Data API operations via OCAPI (openapi-fetch Client)
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
 * import { WebDavClient, createOcapiClient } from '@salesforce/b2c-tooling/clients';
 *
 * const webdav = new WebDavClient('sandbox.demandware.net', authStrategy);
 * const ocapi = createOcapiClient('sandbox.demandware.net', authStrategy);
 * ```
 *
 * @module clients
 */
export {WebDavClient} from './webdav.js';
export type {PropfindEntry} from './webdav.js';

export {createOcapiClient, createAuthMiddleware, createLoggingMiddleware} from './ocapi.js';
export type {
  OcapiClient,
  OcapiError,
  OcapiResponse,
  paths as OcapiPaths,
  components as OcapiComponents,
} from './ocapi.js';
