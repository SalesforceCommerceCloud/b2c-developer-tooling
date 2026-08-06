/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/** SCAPI-first catalog operations with transitional OCAPI fallback. */
export {createCatalogsBackend} from './catalogs-backend.js';
export type {CatalogsBackendConfig} from './catalogs-backend.js';
export {ScapiCatalogsBackend} from './scapi-catalogs-backend.js';
export type {ScapiCatalogsBackendConfig} from './scapi-catalogs-backend.js';
export {OcapiCatalogsBackend} from './ocapi-catalogs-backend.js';
export type {CatalogInfo, CatalogsBackend, ListCatalogsOptions} from './catalogs-types.js';
