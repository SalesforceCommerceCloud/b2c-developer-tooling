/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {
  ExportDataUnitsConfiguration,
  ExportGlobalDataConfiguration,
  ExportSitesConfiguration,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';

/**
 * Categories whose members are plain IDs (no nested flags). Each maps directly
 * to a `Record<id, true>` field of {@link ExportDataUnitsConfiguration}.
 */
export type SimpleCategory = 'catalogs' | 'libraries' | 'price_books' | 'customer_lists' | 'inventory_lists';

/**
 * Per-category metadata: the matching {@link ExportDataUnitsConfiguration} key,
 * a human label, and whether IDs can be discovered from the instance (vs.
 * entered manually because OCAPI has no list-all endpoint for them).
 */
export const SIMPLE_CATEGORIES: ReadonlyArray<{key: SimpleCategory; label: string; discoverable: boolean}> = [
  {key: 'catalogs', label: 'Catalogs', discoverable: true},
  {key: 'inventory_lists', label: 'Inventory Lists', discoverable: true},
  {key: 'libraries', label: 'Libraries', discoverable: false},
  {key: 'price_books', label: 'Price Books', discoverable: false},
  {key: 'customer_lists', label: 'Customer Lists', discoverable: false},
];

// Compile-time drift guards: these object literals must list every key of the
// SDK interfaces (minus `all`, handled specially). If the SDK adds or removes a
// flag, the literal becomes incomplete/excess and tsc fails here — forcing the
// flag lists below to be updated rather than silently drifting.
const SITE_FLAG_MAP: Record<Exclude<keyof ExportSitesConfiguration, 'all'>, true> = {
  ab_tests: true,
  active_data_feeds: true,
  cache_settings: true,
  campaigns_and_promotions: true,
  commerce_feature_states: true,
  content: true,
  coupons: true,
  custom_objects: true,
  customer_cdn_settings: true,
  customer_groups: true,
  distributed_commerce_extensions: true,
  dynamic_file_resources: true,
  gift_certificates: true,
  ocapi_settings: true,
  payment_methods: true,
  payment_processors: true,
  redirect_urls: true,
  search_settings: true,
  shipping: true,
  site_descriptor: true,
  site_preferences: true,
  sitemap_settings: true,
  slots: true,
  sorting_rules: true,
  source_codes: true,
  static_dynamic_alias_mappings: true,
  stores: true,
  tax: true,
  url_rules: true,
};

const GLOBAL_FLAG_MAP: Record<Exclude<keyof ExportGlobalDataConfiguration, 'all'>, true> = {
  access_roles: true,
  csc_settings: true,
  csrf_whitelists: true,
  custom_preference_groups: true,
  custom_quota_settings: true,
  custom_types: true,
  geolocations: true,
  global_custom_objects: true,
  job_schedules: true,
  job_schedules_deprecated: true,
  locales: true,
  meta_data: true,
  oauth_providers: true,
  ocapi_settings: true,
  page_meta_tags: true,
  preferences: true,
  price_adjustment_limits: true,
  services: true,
  sorting_rules: true,
  static_resources: true,
  system_type_definitions: true,
  users: true,
  webdav_client_permissions: true,
};

/** All selectable per-site data flags (excludes the special `all`), sorted. */
export const SITE_FLAGS: ReadonlyArray<keyof ExportSitesConfiguration> = (
  Object.keys(SITE_FLAG_MAP) as Array<keyof ExportSitesConfiguration>
).sort((a, b) => a.localeCompare(b));

/** All selectable global-data flags (excludes the special `all`), sorted. */
export const GLOBAL_FLAGS: ReadonlyArray<keyof ExportGlobalDataConfiguration> = (
  Object.keys(GLOBAL_FLAG_MAP) as Array<keyof ExportGlobalDataConfiguration>
).sort((a, b) => a.localeCompare(b));

/** A flagged unit (a site or the global-data group) is either "all" or a set of flags. */
interface FlagSelection {
  all: boolean;
  flags: Set<string>;
}

function emptyFlagSelection(): FlagSelection {
  return {all: false, flags: new Set()};
}

/**
 * Mutable, in-memory record of what the user has checked for an export. The
 * tree provider reads it to render checkbox state; commands read
 * {@link ExportSelection.toDataUnits} to build the SDK export request.
 *
 * Flagged units (sites, global data) are authoritative at the parent level:
 * checking a site stores `all` directly, so the resulting `data_units` is
 * correct even if the site's flag children were never expanded in the tree.
 */
export class ExportSelection {
  private readonly simple = new Map<SimpleCategory, Set<string>>();
  private readonly sites = new Map<string, FlagSelection>();
  private global = emptyFlagSelection();

  // --- Simple (ID-only) categories ---

  isSimpleChecked(category: SimpleCategory, id: string): boolean {
    return this.simple.get(category)?.has(id) ?? false;
  }

  toggleSimple(category: SimpleCategory, id: string, checked: boolean): void {
    let set = this.simple.get(category);
    if (!set) {
      set = new Set();
      this.simple.set(category, set);
    }
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
  }

  /** Selects or deselects a whole list of IDs in one category (select-all on a category node). */
  setSimpleAll(category: SimpleCategory, ids: readonly string[], checked: boolean): void {
    for (const id of ids) {
      this.toggleSimple(category, id, checked);
    }
  }

  // --- Sites (flagged units) ---

  isSiteChecked(siteId: string): boolean {
    const sel = this.sites.get(siteId);
    return sel ? sel.all || sel.flags.size > 0 : false;
  }

  isSiteFlagChecked(siteId: string, flag: string): boolean {
    const sel = this.sites.get(siteId);
    return sel ? sel.all || sel.flags.has(flag) : false;
  }

  /** Checking a site selects all of its data; unchecking removes it entirely. */
  toggleSite(siteId: string, checked: boolean): void {
    if (checked) {
      this.sites.set(siteId, {all: true, flags: new Set()});
    } else {
      this.sites.delete(siteId);
    }
  }

  toggleSiteFlag(siteId: string, flag: string, checked: boolean): void {
    const sel = this.sites.get(siteId) ?? emptyFlagSelection();
    this.sites.set(siteId, sel);
    this.applyFlag(sel, SITE_FLAGS as readonly string[], flag, checked);
    if (!sel.all && sel.flags.size === 0) {
      this.sites.delete(siteId);
    }
  }

  // --- Global data (flagged unit) ---

  isGlobalChecked(): boolean {
    return this.global.all || this.global.flags.size > 0;
  }

  isGlobalFlagChecked(flag: string): boolean {
    return this.global.all || this.global.flags.has(flag);
  }

  toggleGlobal(checked: boolean): void {
    this.global = checked ? {all: true, flags: new Set()} : emptyFlagSelection();
  }

  toggleGlobalFlag(flag: string, checked: boolean): void {
    this.applyFlag(this.global, GLOBAL_FLAGS as readonly string[], flag, checked);
  }

  // --- Whole-selection operations ---

  clear(): void {
    this.simple.clear();
    this.sites.clear();
    this.global = emptyFlagSelection();
  }

  isEmpty(): boolean {
    if (this.global.all || this.global.flags.size > 0) {
      return false;
    }
    if (this.sites.size > 0) {
      return false;
    }
    for (const set of this.simple.values()) {
      if (set.size > 0) {
        return false;
      }
    }
    return true;
  }

  /** Builds the `data_units` payload for the SDK export, omitting empty groups. */
  toDataUnits(): ExportDataUnitsConfiguration {
    const config: ExportDataUnitsConfiguration = {};

    for (const [category, ids] of this.simple) {
      if (ids.size > 0) {
        config[category] = Object.fromEntries([...ids].sort().map((id) => [id, true]));
      }
    }

    if (this.sites.size > 0) {
      const sites: NonNullable<ExportDataUnitsConfiguration['sites']> = {};
      for (const [siteId, sel] of this.sites) {
        sites[siteId] = this.flagSelectionToConfig(sel);
      }
      config.sites = sites;
    }

    if (this.global.all || this.global.flags.size > 0) {
      config.global_data = this.flagSelectionToConfig(this.global);
    }

    return config;
  }

  /**
   * Toggles one flag. Unchecking a flag while `all` is set expands `all` into
   * the full flag list minus that flag, so the user gets the intuitive
   * "everything except this" result.
   */
  private applyFlag(sel: FlagSelection, allFlags: readonly string[], flag: string, checked: boolean): void {
    if (checked) {
      if (!sel.all) {
        sel.flags.add(flag);
      }
      return;
    }
    if (sel.all) {
      sel.all = false;
      sel.flags = new Set(allFlags.filter((f) => f !== flag));
    } else {
      sel.flags.delete(flag);
    }
  }

  private flagSelectionToConfig(sel: FlagSelection): Record<string, boolean> {
    if (sel.all) {
      return {all: true};
    }
    return Object.fromEntries([...sel.flags].sort().map((flag) => [flag, true]));
  }
}
