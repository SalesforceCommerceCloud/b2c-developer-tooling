/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * A model of a B2C Commerce project's server-side entry points, built from
 * cartridges on disk using SFRA and SiteGenesis idioms.
 *
 * The index lists storefront endpoints (`Controller-Action`) with their
 * accepted methods, HTTPS, login, and CSRF requirements and, for SFRA, the
 * middleware chain composed along the cartridge path (`server.extend`,
 * `append`, `prepend`, `replace`). It also lists hook registrations, Custom
 * API endpoints, and custom job step types. The result is plain JSON, so it
 * can be cached, sent to tools, or passed to lint rules as settings.
 *
 * @example
 * ```typescript
 * import {buildProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
 *
 * const index = buildProjectIndex({root: '.'});
 * const addProduct = index.endpoints.find((e) => e.id === 'Cart-AddProduct');
 * console.log(addProduct?.methods, addProduct?.csrf, addProduct?.chain?.map((m) => m.id));
 * ```
 *
 * @module project-index
 */

export {buildProjectIndex} from './build.js';
export type {BuildProjectIndexOptions} from './build.js';
export type {
  EndpointKind,
  EndpointMethod,
  IndexedCartridge,
  IndexedCustomApiEndpoint,
  IndexedEndpoint,
  IndexedHook,
  IndexedJobStep,
  IndexedMiddleware,
  ProjectIndex,
  RouteStep,
} from './types.js';
