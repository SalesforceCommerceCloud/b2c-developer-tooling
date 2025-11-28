/**
 * API clients for B2C Commerce operations.
 *
 * This module provides typed client classes for interacting with B2C Commerce
 * APIs including WebDAV and OCAPI.
 *
 * ## Available Clients
 *
 * - {@link WebDavClient} - File operations via WebDAV
 * - {@link OcapiClient} - Data API operations via OCAPI
 *
 * ## Usage
 *
 * Clients are typically accessed via {@link B2CInstance} rather than
 * instantiated directly:
 *
 * ```typescript
 * const instance = B2CInstance.fromDwJson();
 *
 * // WebDAV operations
 * await instance.webdav.put('Cartridges/v1/app.zip', content);
 *
 * // OCAPI operations
 * const sites = await instance.ocapi.get('sites');
 * ```
 *
 * @module clients
 */
export {WebDavClient} from './webdav.js';
export type {PropfindEntry} from './webdav.js';

export {createOcapiClient, createAuthMiddleware} from './ocapi.js';
export type {
  OcapiClient,
  OcapiError,
  OcapiResponse,
  paths as OcapiPaths,
  components as OcapiComponents,
} from './ocapi.js';
