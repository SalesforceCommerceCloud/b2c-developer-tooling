/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {BackendBase} from '../../clients/scapi-backend-utils.js';

export interface CatalogInfo {
  id: string;
  name?: string;
  online?: boolean;
  _raw?: unknown;
}

export interface ListCatalogsOptions {
  start?: number;
  count?: number;
}

export interface CatalogsBackend extends BackendBase {
  listCatalogs(options?: ListCatalogsOptions): Promise<CatalogInfo[]>;
}
