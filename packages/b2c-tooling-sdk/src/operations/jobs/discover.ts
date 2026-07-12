/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Discovery of exportable data units on a B2C Commerce instance.
 *
 * Lists the IDs that can be selected when building an
 * {@link ExportDataUnitsConfiguration} for a site archive export — sites,
 * catalogs, and inventory lists. These are the data-unit categories for which
 * OCAPI exposes a "list all" endpoint.
 *
 * Categories without a list-all OCAPI endpoint (libraries, customer lists,
 * price books) are not discoverable and must be entered by ID.
 */
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';

/**
 * IDs discovered on an instance, grouped by data-unit category. Each list is
 * sorted alphabetically. A category that could not be read (e.g. missing OCAPI
 * permission) is returned as an empty array with a matching entry in
 * {@link ExportableUnits.warnings}.
 */
export interface ExportableUnits {
  /** Site IDs (from `GET /sites`). */
  sites: string[];
  /** Catalog IDs (from `GET /catalogs`). */
  catalogs: string[];
  /** Inventory list IDs (from `GET /inventory_lists`). */
  inventoryLists: string[];
  /** Per-category warnings for endpoints that failed (e.g. permission denied). */
  warnings: string[];
}

/** A discoverable category and the OCAPI path used to list it. */
const DISCOVERABLE = [
  {key: 'sites', path: '/sites', label: 'sites'},
  {key: 'catalogs', path: '/catalogs', label: 'catalogs'},
  {key: 'inventoryLists', path: '/inventory_lists', label: 'inventory lists'},
] as const;

/** Page size for paginated list endpoints (OCAPI default is 25). */
const PAGE_COUNT = 200;

/**
 * Lists one paginated OCAPI collection, following `start`/`count` until all
 * documents are read. Returns the `id` of each document.
 */
async function listIds(instance: B2CInstance, path: '/sites' | '/catalogs' | '/inventory_lists'): Promise<string[]> {
  const ids: string[] = [];
  let start = 0;

  // OCAPI collections page via start/count; `total` reports the full size.
  for (;;) {
    const {data, error} = await instance.ocapi.GET(path, {
      params: {query: {start, count: PAGE_COUNT}},
    });

    if (error || !data) {
      throw new Error(error?.fault?.message ?? `Failed to list ${path}`);
    }

    for (const item of data.data ?? []) {
      if (item.id) {
        ids.push(item.id);
      }
    }

    const total = data.total ?? ids.length;
    start += PAGE_COUNT;
    if (start >= total || !data.data?.length) {
      break;
    }
  }

  return ids;
}

/**
 * Discovers the data units that can be exported from an instance.
 *
 * Each category is read independently: a failure in one (e.g. the OCAPI client
 * lacks read permission for catalogs) records a warning and leaves that list
 * empty rather than failing the whole discovery, so the caller can still offer
 * the categories that succeeded.
 *
 * @param instance - B2C instance to query
 * @returns Discovered IDs grouped by category, with per-category warnings
 *
 * @example
 * ```typescript
 * const units = await discoverExportableUnits(instance);
 * console.log(units.catalogs); // ['storefront-catalog', 'master-catalog']
 * ```
 */
export async function discoverExportableUnits(instance: B2CInstance): Promise<ExportableUnits> {
  const logger = getLogger();
  const result: ExportableUnits = {sites: [], catalogs: [], inventoryLists: [], warnings: []};

  await Promise.all(
    DISCOVERABLE.map(async ({key, path, label}) => {
      try {
        result[key] = (await listIds(instance, path)).sort((a, b) => a.localeCompare(b));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.debug({path, err: message}, `Failed to discover ${label}`);
        result.warnings.push(`Could not list ${label}: ${message}`);
      }
    }),
  );

  return result;
}
