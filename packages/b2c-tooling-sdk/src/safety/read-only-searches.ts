/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Minimatch} from 'minimatch';

/**
 * Search endpoints that use POST but only read data. `READ_ONLY` safety
 * allows POST to these paths; every other POST stays blocked.
 *
 * This is an explicit list (not a pattern) so a new endpoint is only allowed
 * once it has been checked. Each `*` matches one path segment. Configured
 * safety rules are evaluated first, so a rule can still block any of these.
 */
export const READ_ONLY_SEARCH_PATHS: readonly string[] = [
  // SCAPI Admin APIs
  '/configuration/preferences/v1/organizations/*/site-preference-groups/*/*/preference-search',
  '/custom-object/custom-objects/v1/organizations/*/custom-objects-search/*',
  '/customer/customers/v1/organizations/*/customer-group-search',
  '/customer/customers/v1/organizations/*/customer-lists/*/customer-search',
  '/dx/object-definitions/v1/organizations/*/system/object-types-search',
  '/dx/object-definitions/v1/organizations/*/system/object-types/*/attribute-definition-search',
  '/dx/object-definitions/v1/organizations/*/system/object-types/*/attribute-group-search',
  '/experience/experiences/v1/organizations/*/slot-configurations-search',
  '/experience/experiences/v1/organizations/*/slot-search',
  '/merchant/roles/v1/organizations/*/roles/*/user-search',
  '/operation/jobs/v1/organizations/*/job-execution-search',
  '/product/catalogs/v1/organizations/*/catalog-search',
  '/product/catalogs/v1/organizations/*/catalogs/*/categories/*/category-product-assignment-search',
  '/product/catalogs/v1/organizations/*/catalogs/*/category-search',
  '/product/catalogs/v1/organizations/*/category-search',
  '/product/price-books/v1/organizations/*/price-book-search',
  '/product/products/v1/organizations/*/product-search',
  '/product/products/v1/organizations/*/products/*/variant-search',
  '/product/products/v1/organizations/*/unassigned-product-search',
  '/site/sites/v1/organizations/*/site-search',
  '/store/stores/v1/organizations/*/store-search',
  // OCAPI Data API
  '/s/*/dw/data/*/catalog_search',
  '/s/*/dw/data/*/catalogs/*/categories/*/category_product_assignment_search',
  '/s/*/dw/data/*/catalogs/*/category_search',
  '/s/*/dw/data/*/category_search',
  '/s/*/dw/data/*/custom_object_definitions/*/attribute_definition_search',
  '/s/*/dw/data/*/custom_object_definitions/*/attribute_group_search',
  '/s/*/dw/data/*/customer_lists/*/customer_search',
  '/s/*/dw/data/*/inventory_list_search',
  '/s/*/dw/data/*/job_execution_search',
  '/s/*/dw/data/*/product_search',
  '/s/*/dw/data/*/products/*/variant_search',
  '/s/*/dw/data/*/role_search',
  '/s/*/dw/data/*/roles/*/user_search',
  '/s/*/dw/data/*/site_preferences/preference_groups/*/*/preference_search',
  '/s/*/dw/data/*/site_search',
  '/s/*/dw/data/*/sites/*/ab_test_search',
  '/s/*/dw/data/*/sites/*/campaign_search',
  '/s/*/dw/data/*/sites/*/coupon_redemption_search',
  '/s/*/dw/data/*/sites/*/coupon_search',
  '/s/*/dw/data/*/sites/*/customer_group_search',
  '/s/*/dw/data/*/sites/*/customer_groups/*/member_search',
  '/s/*/dw/data/*/sites/*/gift_certificate_search',
  '/s/*/dw/data/*/sites/*/promotion_campaign_assignment_search',
  '/s/*/dw/data/*/sites/*/promotion_search',
  '/s/*/dw/data/*/sites/*/slot_configuration_campaign_assignment_search',
  '/s/*/dw/data/*/sites/*/slot_configuration_search',
  '/s/*/dw/data/*/sites/*/slot_search',
  '/s/*/dw/data/*/sites/*/sorting_rule_search',
  '/s/*/dw/data/*/sites/*/source_code_group_search',
  '/s/*/dw/data/*/sites/*/store_search',
  '/s/*/dw/data/*/system_object_definition_search',
  '/s/*/dw/data/*/system_object_definitions/*/attribute_definition_search',
  '/s/*/dw/data/*/system_object_definitions/*/attribute_group_search',
  '/s/*/dw/data/*/user_search',
];

let matchers: Minimatch[] | undefined;

/**
 * Returns true when a request is a POST to a known read-only search endpoint
 * (see {@link READ_ONLY_SEARCH_PATHS}).
 */
export function isReadOnlySearch(method: string, path: string): boolean {
  if (method.toUpperCase() !== 'POST') return false;
  matchers ??= READ_ONLY_SEARCH_PATHS.map((pattern) => new Minimatch(pattern, {dot: true}));
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return matchers.some((matcher) => matcher.match(normalized));
}
