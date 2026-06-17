/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipReportDefinition} from './types.js';
import {booleanLiteral, dateLiteral, integerLiteral, quoteIdentifierIfReserved, stringLiteral} from './sql.js';

function getRequiredString(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new Error(`Missing required report parameter: ${key}`);
  }

  return value;
}

function getDateLiteral(params: Record<string, string>, key: string): string {
  try {
    return dateLiteral(getRequiredString(params, key));
  } catch {
    throw new Error(`Invalid date for parameter "${key}": expected YYYY-MM-DD`);
  }
}

function getStringLiteral(params: Record<string, string>, key: string): string {
  return stringLiteral(getRequiredString(params, key));
}

function getBooleanLiteral(params: Record<string, string>, key: string): string {
  try {
    return booleanLiteral(getRequiredString(params, key));
  } catch {
    throw new Error(`Invalid boolean for parameter "${key}": expected true or false`);
  }
}

function getOptionalIntegerLiteral(
  params: Record<string, string>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): string {
  const raw = params[key];
  if (!raw) {
    return String(fallback);
  }

  try {
    return integerLiteral(raw, min, max);
  } catch {
    throw new Error(`Invalid integer for parameter "${key}": expected ${min}-${max}`);
  }
}

/** Alias for builders that reference reserved column names (for example `method`). */
const col = quoteIdentifierIfReserved;

/**
 * Builds the optional site-dimension join and WHERE predicate for tables whose
 * `site_id` is nullable or where site scoping is optional (for example the SCAPI
 * and OCAPI request tables). When `siteId` is absent both fragments are empty so
 * the report spans all sites; when present an inner join restricts to that site.
 */
function optionalSiteJoin(params: Record<string, string>, factAlias: string): {join: string; predicate: string} {
  if (!params.siteId) {
    return {join: '', predicate: ''};
  }

  return {
    join: ` JOIN ccdw_dim_site s ON s.site_id = ${factAlias}.site_id`,
    predicate: ` AND s.nsite_id = ${getStringLiteral(params, 'siteId')}`,
  };
}

export const CIP_REPORTS: CipReportDefinition[] = [
  {
    name: 'sales-analytics',
    description: 'Track daily sales performance with AOV and AOS metrics',
    category: 'Sales Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT CAST(ss.submit_date AS VARCHAR) AS "date", SUM(std_revenue) AS std_revenue, SUM(num_orders) AS orders, CAST(SUM(std_revenue) / SUM(num_orders) AS DECIMAL(15,2)) AS std_aov, SUM(num_units) AS units, CAST(SUM(num_units) / SUM(num_orders) AS DECIMAL(15,2)) AS aos, SUM(std_tax) AS std_tax, SUM(std_shipping) AS std_shipping FROM ccdw_aggr_sales_summary ss JOIN ccdw_dim_site s ON s.site_id = ss.site_id WHERE ss.submit_date >= ${from} AND ss.submit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY ss.submit_date ORDER BY ss.submit_date`;
    },
  },
  {
    name: 'sales-summary',
    description: 'Query detailed sales records for custom analysis',
    category: 'Sales Analytics',
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'siteId', description: 'Optional natural site id', type: 'string'},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const siteId = params.siteId ? ` AND s.nsite_id = ${getStringLiteral(params, 'siteId')}` : '';
      const joinSite = params.siteId ? ' JOIN ccdw_dim_site s ON s.site_id = ss.site_id' : '';
      return `SELECT ss.submit_date, ss.site_id, ss.business_channel_id, ss.registered, ss.first_time_buyer, ss.device_class_code, ss.locale_code, ss.std_revenue, ss.num_orders, ss.num_units, ss.std_tax, ss.std_shipping, ss.std_total_discount FROM ccdw_aggr_sales_summary ss${joinSite} WHERE ss.submit_date >= ${from} AND ss.submit_date <= ${to}${siteId}`;
    },
  },
  {
    name: 'ocapi-requests',
    description: 'Analyze OCAPI request volume and response latency',
    category: 'Technical Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT o.request_date, o.api_name, o.api_resource, SUM(o.num_requests) AS total_requests, SUM(o.response_time) AS total_response_time, CASE WHEN SUM(o.num_requests) > 0 THEN SUM(o.response_time) / SUM(o.num_requests) ELSE 0 END AS avg_response_time, o.client_id FROM ccdw_aggr_ocapi_request o JOIN ccdw_dim_site s ON s.site_id = o.site_id WHERE o.request_date >= ${from} AND o.request_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY o.request_date, o.api_name, o.api_resource, o.client_id ORDER BY total_requests DESC`;
    },
  },
  {
    name: 'top-selling-products',
    description: 'Identify top selling products across channels',
    category: 'Product Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT p.nproduct_id, p.product_display_name, SUM(pss.num_units) AS units_sold, SUM(pss.std_revenue) AS std_revenue, SUM(pss.num_orders) AS order_count, pss.device_class_code, pss.registered, s.nsite_id FROM ccdw_aggr_product_sales_summary pss JOIN ccdw_dim_product p ON p.product_id = pss.product_id JOIN ccdw_dim_site s ON s.site_id = pss.site_id WHERE pss.submit_date >= ${from} AND pss.submit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY p.nproduct_id, p.product_display_name, pss.device_class_code, pss.registered, s.nsite_id ORDER BY std_revenue DESC`;
    },
  },
  {
    name: 'product-co-purchase-analysis',
    description: 'Analyze frequently co-purchased products',
    category: 'Product Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT p1.nproduct_id AS product_1_id, p1.product_display_name AS product_1_name, p2.nproduct_id AS product_2_id, p2.product_display_name AS product_2_name, pcb.frequency_count AS co_purchase_count, pcb.std_cobuy_revenue FROM ccdw_aggr_product_cobuy pcb JOIN ccdw_dim_product p1 ON p1.product_id = pcb.product_one_id JOIN ccdw_dim_product p2 ON p2.product_id = pcb.product_two_id JOIN ccdw_dim_site s ON s.nsite_id = pcb.nsite_id WHERE pcb.submit_date >= ${from} AND pcb.submit_date <= ${to} AND s.nsite_id = ${siteId} ORDER BY pcb.frequency_count DESC`;
    },
  },
  {
    name: 'promotion-discount-analysis',
    description: 'Measure promotional discount impact on orders',
    category: 'Promotion Analytics',
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `WITH TOTAL_ORDERS AS (SELECT ss.submit_date AS submit_day, SUM(num_orders) AS total_orders FROM ccdw_aggr_sales_summary ss WHERE ss.submit_date >= ${from} AND ss.submit_date <= ${to} GROUP BY ss.submit_date), PROMOTION_DISCOUNT AS (SELECT pss.submit_date AS submit_day, p.promotion_class AS promotion_class, SUM(std_total_discount) AS std_total_discount, SUM(num_orders) AS promotion_orders FROM ccdw_aggr_promotion_sales_summary pss JOIN ccdw_dim_promotion p ON p.promotion_id = pss.promotion_id WHERE pss.submit_date >= ${from} AND pss.submit_date <= ${to} GROUP BY pss.submit_date, p.promotion_class) SELECT t.submit_day, t.total_orders, p.promotion_class, p.std_total_discount, p.promotion_orders, p.std_total_discount / p.promotion_orders AS avg_discount_per_order FROM TOTAL_ORDERS t LEFT JOIN PROMOTION_DISCOUNT p ON t.submit_day = p.submit_day`;
    },
  },
  {
    name: 'search-query-performance',
    description: 'Identify search terms driving revenue and conversion',
    category: 'Search Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {
        name: 'hasResults',
        description: 'Filter successful/unsuccessful searches',
        type: 'boolean',
        required: true,
        options: ['true', 'false'],
      },
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const hasResults = getBooleanLiteral(params, 'hasResults');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `WITH conversion AS (SELECT LOWER(sc.query) AS query, SUM(sc.num_searches) AS converted_searches, SUM(sc.num_orders) AS orders, SUM(sc.std_revenue) AS std_revenue, SUM(sc.std_revenue) / NULLIF(CAST(SUM(sc.num_orders) AS FLOAT), 0) AS std_revenue_per_order FROM ccdw_aggr_search_conversion sc JOIN ccdw_dim_site s ON s.site_id = sc.site_id WHERE sc.search_date >= ${from} AND sc.search_date <= ${to} AND s.nsite_id = ${siteId} AND sc.has_results = ${hasResults} GROUP BY LOWER(sc.query)) SELECT query, converted_searches, orders, std_revenue, std_revenue_per_order, CASE WHEN converted_searches > 0 THEN (CAST(orders AS FLOAT) / converted_searches) * 100 ELSE 0 END AS conversion_rate FROM conversion ORDER BY std_revenue DESC`;
    },
  },
  {
    name: 'payment-method-performance',
    description: 'Track payment method adoption and transaction metrics',
    category: 'Payment Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT pm.display_name AS payment_method, SUM(pss.num_payments) AS total_payments, SUM(pss.num_orders) AS orders_with_payment, SUM(pss.std_captured_amount) AS std_captured_amount, SUM(pss.std_refunded_amount) AS std_refunded_amount, SUM(pss.std_transaction_amount) AS std_transaction_amount, (SUM(pss.std_captured_amount) / SUM(pss.num_payments)) AS avg_payment_amount FROM ccdw_aggr_payment_sales_summary pss JOIN ccdw_dim_payment_method pm ON pm.payment_method_id = pss.payment_method_id JOIN ccdw_dim_site s ON s.site_id = pss.site_id WHERE pss.submit_date >= ${from} AND pss.submit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY pm.display_name ORDER BY std_captured_amount DESC`;
    },
  },
  {
    name: 'customer-registration-trends',
    description: 'Track customer registration trends by date and device',
    category: 'Customer Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT r.registration_date AS "date", SUM(r.num_registrations) AS new_registrations, r.device_class_code, s.nsite_id FROM ccdw_aggr_registration r JOIN ccdw_dim_site s ON s.site_id = r.site_id WHERE r.registration_date >= ${from} AND r.registration_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY r.registration_date, r.device_class_code, s.nsite_id ORDER BY r.registration_date`;
    },
  },
  {
    name: 'top-referrers',
    description: 'Identify top traffic referrers and visit share',
    category: 'Traffic Analytics',
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 20, 1, 500);
      return `WITH total AS (SELECT SUM(num_visits) AS total_visits FROM ccdw_aggr_visit_referrer WHERE visit_date >= ${from} AND visit_date <= ${to}) SELECT vr.referrer_medium AS traffic_medium, vr.referrer_source AS traffic_source, SUM(vr.num_visits) AS total_visits, SUM(vr.num_visits) * 100.0 / total.total_visits AS visit_percentage FROM ccdw_aggr_visit_referrer vr JOIN ccdw_dim_site s ON s.site_id = vr.site_id JOIN total ON TRUE WHERE vr.visit_date >= ${from} AND vr.visit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY vr.referrer_medium, vr.referrer_source, total.total_visits ORDER BY total_visits DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'scapi-traffic-latency',
    description: 'Rank SCAPI endpoints by request volume and average latency',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_scapi_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {
        name: 'siteId',
        description: 'Optional natural site id; SCAPI rows may be unattributed (omit to span all sites)',
        type: 'string',
      },
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 20, 1, 500);
      const site = optionalSiteJoin(params, 'r');
      return `SELECT r.api_family, r.api_name, r.api_resource, r.${col('method')}, SUM(r.num_requests) AS total_requests, SUM(r.response_time) AS total_response_ms, CAST(SUM(r.response_time) / NULLIF(SUM(r.num_requests), 0) AS DECIMAL(15,2)) AS avg_response_ms FROM ccdw_aggr_scapi_request r${site.join} WHERE r.request_date >= ${from} AND r.request_date <= ${to}${site.predicate} GROUP BY r.api_family, r.api_name, r.api_resource, r.${col('method')} ORDER BY total_requests DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'scapi-error-rate-by-status',
    description: 'Rank SCAPI endpoints by 4xx/5xx error rate over a date range',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_scapi_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'siteId', description: 'Optional natural site id (omit to span all sites)', type: 'string'},
      {
        name: 'statusClass',
        description: 'Optional HTTP error class filter',
        type: 'string',
        options: ['4xx', '5xx'],
      },
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 500);
      const site = optionalSiteJoin(params, 'r');
      const classFilter =
        params.statusClass === '4xx'
          ? ' AND r.status_code BETWEEN 400 AND 499'
          : params.statusClass === '5xx'
            ? ' AND r.status_code BETWEEN 500 AND 599'
            : '';
      return `SELECT r.api_family, r.api_name, r.api_resource, r.${col('method')}, SUM(r.num_requests) AS total_requests, SUM(CASE WHEN r.status_code BETWEEN 400 AND 499 THEN r.num_requests ELSE 0 END) AS error_4xx, SUM(CASE WHEN r.status_code BETWEEN 500 AND 599 THEN r.num_requests ELSE 0 END) AS error_5xx, SUM(CASE WHEN r.status_code BETWEEN 400 AND 599 THEN r.num_requests ELSE 0 END) AS error_total, CAST(100.0 * SUM(CASE WHEN r.status_code BETWEEN 400 AND 599 THEN r.num_requests ELSE 0 END) / NULLIF(SUM(r.num_requests), 0) AS DECIMAL(15,2)) AS error_pct FROM ccdw_aggr_scapi_request r${site.join} WHERE r.request_date >= ${from} AND r.request_date <= ${to}${site.predicate}${classFilter} GROUP BY r.api_family, r.api_name, r.api_resource, r.${col('method')} HAVING SUM(CASE WHEN r.status_code BETWEEN 400 AND 599 THEN r.num_requests ELSE 0 END) > 0 ORDER BY error_total DESC, error_pct DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'scapi-latency-distribution',
    description: 'Surface the SCAPI latency histogram and slow-tail (SLA breach) percentage per endpoint',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_scapi_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'siteId', description: 'Optional natural site id (omit to span all sites)', type: 'string'},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 20, 1, 500);
      const site = optionalSiteJoin(params, 'r');
      return `SELECT r.api_family, r.api_name, r.api_resource, SUM(r.num_requests) AS total_requests, CAST(100.0 * SUM(r.num_requests_bucket1 + r.num_requests_bucket2 + r.num_requests_bucket3) / NULLIF(SUM(r.num_requests), 0) AS DECIMAL(15,2)) AS fast_pct, CAST(100.0 * SUM(r.num_requests_bucket9 + r.num_requests_bucket10 + r.num_requests_bucket11) / NULLIF(SUM(r.num_requests), 0) AS DECIMAL(15,2)) AS slow_tail_pct, SUM(r.num_requests_bucket1) AS bucket1, SUM(r.num_requests_bucket2) AS bucket2, SUM(r.num_requests_bucket3) AS bucket3, SUM(r.num_requests_bucket4) AS bucket4, SUM(r.num_requests_bucket5) AS bucket5, SUM(r.num_requests_bucket6) AS bucket6, SUM(r.num_requests_bucket7) AS bucket7, SUM(r.num_requests_bucket8) AS bucket8, SUM(r.num_requests_bucket9) AS bucket9, SUM(r.num_requests_bucket10) AS bucket10, SUM(r.num_requests_bucket11) AS bucket11, CAST(SUM(r.response_time) / NULLIF(SUM(r.num_requests), 0) AS DECIMAL(15,2)) AS avg_response_ms FROM ccdw_aggr_scapi_request r${site.join} WHERE r.request_date >= ${from} AND r.request_date <= ${to}${site.predicate} GROUP BY r.api_family, r.api_name, r.api_resource ORDER BY total_requests DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'scapi-cache-hit-ratio',
    description: 'Measure SCAPI cache hit ratio per endpoint to find cacheable resources running as MISS',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_scapi_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'siteId', description: 'Optional natural site id (omit to span all sites)', type: 'string'},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 500);
      const site = optionalSiteJoin(params, 'r');
      return `SELECT r.api_family, r.api_name, r.api_resource, SUM(r.num_requests) AS total_requests, SUM(CASE WHEN r.cache_behavior = 'HIT' THEN r.num_requests ELSE 0 END) AS hits, SUM(CASE WHEN r.cache_behavior = 'MISS' THEN r.num_requests ELSE 0 END) AS misses, SUM(CASE WHEN r.cache_behavior = '__NON_CACHEABLE__' THEN r.num_requests ELSE 0 END) AS non_cacheable, CAST(100.0 * SUM(CASE WHEN r.cache_behavior = 'HIT' THEN r.num_requests ELSE 0 END) / NULLIF(SUM(CASE WHEN r.cache_behavior IN ('HIT', 'MISS') THEN r.num_requests ELSE 0 END), 0) AS DECIMAL(15,2)) AS hit_ratio_pct FROM ccdw_aggr_scapi_request r${site.join} WHERE r.request_date >= ${from} AND r.request_date <= ${to}${site.predicate} GROUP BY r.api_family, r.api_name, r.api_resource ORDER BY total_requests DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'ocapi-client-usage',
    description: 'Rank OCAPI client_ids by request volume with per-client error rate and latency',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_ocapi_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'siteId', description: 'Optional natural site id (omit to span all sites)', type: 'string'},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 500);
      const site = optionalSiteJoin(params, 'o');
      return `WITH totals AS (SELECT SUM(o.num_requests) AS grand_total FROM ccdw_aggr_ocapi_request o${site.join} WHERE o.request_date >= ${from} AND o.request_date <= ${to}${site.predicate}) SELECT o.client_id, SUM(o.num_requests) AS total_requests, CAST(SUM(o.num_requests) * 100.0 / NULLIF(t.grand_total, 0) AS DECIMAL(15,2)) AS traffic_pct, CAST(100.0 * SUM(CASE WHEN o.status_code >= 400 THEN o.num_requests ELSE 0 END) / NULLIF(SUM(o.num_requests), 0) AS DECIMAL(15,2)) AS error_pct, CAST(SUM(o.response_time) / NULLIF(SUM(o.num_requests), 0) AS DECIMAL(15,2)) AS avg_response_ms, COUNT(DISTINCT o.api_resource) AS distinct_resources FROM ccdw_aggr_ocapi_request o${site.join} JOIN totals t ON TRUE WHERE o.request_date >= ${from} AND o.request_date <= ${to}${site.predicate} GROUP BY o.client_id, t.grand_total ORDER BY total_requests DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'controller-health-scorecard',
    description: 'Score SFRA controller health by volume, errors, slow tail, and cache hit rate',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_controller_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 25, 1, 500);
      return `SELECT cr.controller_name, SUM(cr.num_requests) AS total_requests, CAST(SUM(cr.response_time) / NULLIF(SUM(cr.num_requests), 0) AS DECIMAL(15,2)) AS avg_response_ms, CAST(100.0 * SUM(CASE WHEN cr.status_code >= 400 THEN cr.num_requests ELSE 0 END) / NULLIF(SUM(cr.num_requests), 0) AS DECIMAL(15,2)) AS error_pct, CAST(100.0 * SUM(cr.num_requests_bucket9 + cr.num_requests_bucket10 + cr.num_requests_bucket11) / NULLIF(SUM(cr.num_requests), 0) AS DECIMAL(15,2)) AS slow_tail_pct, CAST(100.0 * SUM(CASE WHEN cr.cache_behavior = 'HIT' THEN cr.num_requests ELSE 0 END) / NULLIF(SUM(CASE WHEN cr.cache_behavior IN ('HIT', 'MISS') THEN cr.num_requests ELSE 0 END), 0) AS DECIMAL(15,2)) AS cache_hit_pct FROM ccdw_aggr_controller_request cr JOIN ccdw_dim_site s ON s.site_id = cr.site_id WHERE cr.request_date >= ${from} AND cr.request_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY cr.controller_name ORDER BY total_requests DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'controller-error-rate-trend',
    description: 'Daily 4xx/5xx error rate per storefront controller for catching deploy regressions',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_controller_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max controller/day rows (1-1000)', type: 'number', min: 1, max: 1000},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 100, 1, 1000);
      return `SELECT CAST(CAST(r.request_date AS DATE) AS VARCHAR) AS request_day, r.controller_name, SUM(r.num_requests) AS total_requests, SUM(CASE WHEN r.status_code BETWEEN 400 AND 499 THEN r.num_requests ELSE 0 END) AS client_error_4xx, SUM(CASE WHEN r.status_code BETWEEN 500 AND 599 THEN r.num_requests ELSE 0 END) AS server_error_5xx, CAST(100.0 * (SUM(CASE WHEN r.status_code BETWEEN 400 AND 499 THEN r.num_requests ELSE 0 END) + SUM(CASE WHEN r.status_code BETWEEN 500 AND 599 THEN r.num_requests ELSE 0 END)) / NULLIF(SUM(r.num_requests), 0) AS DECIMAL(15,2)) AS error_rate_pct FROM ccdw_aggr_controller_request r JOIN ccdw_dim_site s ON s.site_id = r.site_id WHERE CAST(r.request_date AS DATE) BETWEEN ${from} AND ${to} AND s.nsite_id = ${siteId} GROUP BY CAST(r.request_date AS DATE), r.controller_name ORDER BY server_error_5xx DESC, client_error_4xx DESC, request_day DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'remote-include-performance',
    description: 'Rank remote-include child controllers by load, latency, errors, and cache hit rate per parent page',
    category: 'Technical Analytics',
    tablesUsed: ['ccdw_aggr_include_controller_request', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-1000)', type: 'number', min: 1, max: 1000},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 1000);
      return `SELECT ic.main_controller_name, ic.controller_name, SUM(ic.num_requests) AS total_requests, SUM(ic.response_time) AS total_response_ms, CAST(SUM(ic.response_time) / NULLIF(SUM(ic.num_requests), 0) AS DECIMAL(15,2)) AS avg_response_ms, CAST(100.0 * SUM(CASE WHEN ic.status_code >= 400 THEN ic.num_requests ELSE 0 END) / NULLIF(SUM(ic.num_requests), 0) AS DECIMAL(15,2)) AS error_pct, CAST(100.0 * SUM(CASE WHEN ic.cache_behavior = 'HIT' THEN ic.num_requests ELSE 0 END) / NULLIF(SUM(CASE WHEN ic.cache_behavior IN ('HIT','MISS') THEN ic.num_requests ELSE 0 END), 0) AS DECIMAL(15,2)) AS cache_hit_pct FROM ccdw_aggr_include_controller_request ic JOIN ccdw_dim_site s ON s.site_id = ic.site_id WHERE ic.request_date >= ${from} AND ic.request_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY ic.main_controller_name, ic.controller_name ORDER BY total_requests DESC, total_response_ms DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'revenue-by-channel',
    description: 'Break down revenue, orders, AOV, and discount rate by channel, device, and locale',
    category: 'Sales Analytics',
    tablesUsed: ['ccdw_aggr_sales_summary', 'ccdw_dim_business_channel', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 500);
      return `WITH site_total AS (SELECT SUM(ss.std_revenue) AS total_std_revenue FROM ccdw_aggr_sales_summary ss JOIN ccdw_dim_site s ON s.site_id = ss.site_id WHERE ss.submit_date >= ${from} AND ss.submit_date <= ${to} AND s.nsite_id = ${siteId}) SELECT bc.order_channel, bc.business_type, ss.device_class_code, ss.locale_code, SUM(ss.std_revenue) AS std_revenue, SUM(ss.num_orders) AS orders, SUM(ss.num_units) AS units, CAST(SUM(ss.std_revenue) / NULLIF(SUM(ss.num_orders), 0) AS DECIMAL(15,2)) AS std_aov, CAST(SUM(ss.std_revenue) * 100.0 / NULLIF(t.total_std_revenue, 0) AS DECIMAL(15,2)) AS revenue_share_pct, CAST(SUM(ss.std_total_discount) * 100.0 / NULLIF(SUM(ss.std_revenue) + SUM(ss.std_total_discount), 0) AS DECIMAL(15,2)) AS discount_rate_pct FROM ccdw_aggr_sales_summary ss JOIN ccdw_dim_site s ON s.site_id = ss.site_id JOIN ccdw_dim_business_channel bc ON bc.business_channel_id = ss.business_channel_id JOIN site_total t ON TRUE WHERE ss.submit_date >= ${from} AND ss.submit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY bc.order_channel, bc.business_type, ss.device_class_code, ss.locale_code, t.total_std_revenue ORDER BY std_revenue DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'new-vs-returning-buyer-revenue',
    description: 'Split revenue, orders, AOV, and discount depth between first-time and returning buyers',
    category: 'Customer Analytics',
    tablesUsed: ['ccdw_aggr_sales_summary', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `WITH site_total AS (SELECT SUM(ss.std_revenue) AS total_std_revenue FROM ccdw_aggr_sales_summary ss JOIN ccdw_dim_site s ON s.site_id = ss.site_id WHERE s.nsite_id = ${siteId} AND ss.submit_date >= ${from} AND ss.submit_date <= ${to}) SELECT CASE WHEN ss.first_time_buyer THEN 'first_time' ELSE 'returning' END AS buyer_type, CASE WHEN ss.registered THEN 'registered' ELSE 'guest' END AS customer_type, SUM(ss.std_revenue) AS std_revenue, SUM(ss.num_orders) AS orders, SUM(ss.num_units) AS units, CAST(SUM(ss.std_revenue) / NULLIF(SUM(ss.num_orders), 0) AS DECIMAL(15,2)) AS std_aov, CAST(SUM(ss.std_revenue) * 100.0 / NULLIF(t.total_std_revenue, 0) AS DECIMAL(15,2)) AS revenue_share_pct, CAST(SUM(ss.std_total_discount) * 100.0 / NULLIF(SUM(ss.std_revenue) + SUM(ss.std_total_discount), 0) AS DECIMAL(15,2)) AS discount_rate_pct FROM ccdw_aggr_sales_summary ss JOIN ccdw_dim_site s ON s.site_id = ss.site_id JOIN site_total t ON TRUE WHERE s.nsite_id = ${siteId} AND ss.submit_date >= ${from} AND ss.submit_date <= ${to} GROUP BY ss.first_time_buyer, ss.registered, t.total_std_revenue ORDER BY std_revenue DESC`;
    },
  },
  {
    name: 'discount-depth-breakdown',
    description: 'Break down total discount into promotional vs manual by product, order, and shipping',
    category: 'Promotion Analytics',
    tablesUsed: ['ccdw_aggr_sales_summary', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      return `SELECT SUM(ss.std_revenue) AS std_revenue, SUM(COALESCE(ss.std_promotional_product_discount, 0)) AS std_promotional_product_discount, SUM(COALESCE(ss.std_promotional_order_discount, 0)) AS std_promotional_order_discount, SUM(COALESCE(ss.std_promotional_shipping_discount, 0)) AS std_promotional_shipping_discount, SUM(COALESCE(ss.std_manual_product_discount, 0)) AS std_manual_product_discount, SUM(COALESCE(ss.std_manual_order_discount, 0)) AS std_manual_order_discount, SUM(COALESCE(ss.std_manual_shipping_discount, 0)) AS std_manual_shipping_discount, SUM(COALESCE(ss.std_promotional_product_discount, 0) + COALESCE(ss.std_promotional_order_discount, 0) + COALESCE(ss.std_promotional_shipping_discount, 0)) AS promo_discount_total, SUM(COALESCE(ss.std_manual_product_discount, 0) + COALESCE(ss.std_manual_order_discount, 0) + COALESCE(ss.std_manual_shipping_discount, 0)) AS manual_discount_total, SUM(ss.std_total_discount) AS std_total_discount, CAST(SUM(ss.std_total_discount) * 100.0 / NULLIF(SUM(ss.std_revenue) + SUM(ss.std_total_discount), 0) AS DECIMAL(15,2)) AS effective_discount_rate_pct FROM ccdw_aggr_sales_summary ss JOIN ccdw_dim_site s ON s.site_id = ss.site_id WHERE ss.submit_date >= ${from} AND ss.submit_date <= ${to} AND s.nsite_id = ${siteId}`;
    },
  },
  {
    name: 'promotion-roi-leaderboard',
    description: 'Rank promotions by revenue per dollar of discount, with orders, uses, and AOV',
    category: 'Promotion Analytics',
    tablesUsed: ['ccdw_aggr_promotion_sales_summary', 'ccdw_dim_promotion', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 500);
      return `SELECT p.npromotion_id AS promotion_id, p.display_name AS promotion_name, p.promotion_class, SUM(pss.std_revenue) AS std_revenue, SUM(pss.std_total_discount) AS std_total_discount, SUM(pss.num_orders) AS num_orders, SUM(pss.num_promotion_uses) AS num_promotion_uses, CAST(SUM(pss.std_revenue) / NULLIF(SUM(pss.num_orders), 0) AS DECIMAL(15,2)) AS std_aov, CAST(SUM(pss.std_revenue) / NULLIF(SUM(pss.std_total_discount), 0) AS DECIMAL(15,2)) AS revenue_per_discount_dollar FROM ccdw_aggr_promotion_sales_summary pss JOIN ccdw_dim_promotion p ON p.promotion_id = pss.promotion_id JOIN ccdw_dim_site s ON s.site_id = pss.site_id WHERE pss.submit_date >= ${from} AND pss.submit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY p.npromotion_id, p.display_name, p.promotion_class ORDER BY revenue_per_discount_dollar DESC, std_revenue DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'recommender-effectiveness',
    description: 'Rank product recommenders by engagement, attributed revenue, and conversion',
    category: 'Product Analytics',
    tablesUsed: ['ccdw_aggr_product_recommendation_recommender', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 20, 1, 500);
      // Note: the CIP JDBC service rejects projections with too many SUM() calls
      // (observed ~7+ bare aggregate columns), so this report keeps the highest-value
      // raw metrics (views/clicks/cart_adds/orders/revenue) and derives CTR and
      // view-to-cart ratios rather than also projecting every raw funnel count.
      return `SELECT rr.recommender_name, SUM(rr.num_recommender_views) AS recommender_views, SUM(rr.num_clicks) AS clicks, SUM(rr.num_cart_adds) AS cart_adds, SUM(rr.num_orders) AS orders, SUM(rr.std_attributed_revenue) AS std_attributed_revenue, CAST(SUM(rr.num_clicks) * 100.0 / NULLIF(SUM(rr.num_recommender_views), 0) AS DECIMAL(15,2)) AS ctr_pct, CAST(SUM(rr.num_cart_adds) * 100.0 / NULLIF(SUM(rr.num_product_views), 0) AS DECIMAL(15,2)) AS view_to_cart_pct FROM ccdw_aggr_product_recommendation_recommender rr JOIN ccdw_dim_site s ON s.site_id = rr.site_id WHERE rr.recommendation_date >= ${from} AND rr.recommendation_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY rr.recommender_name ORDER BY std_attributed_revenue DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'zero-result-searches',
    description: 'Surface search terms that most often return zero results and the demand lost to them',
    category: 'Search Analytics',
    tablesUsed: ['ccdw_aggr_search_query', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 50, 1, 500);
      return `SELECT LOWER(sq.query) AS query, SUM(sq.num_searches_without_results) AS no_result_searches, SUM(sq.num_searches_with_results) AS with_result_searches, SUM(sq.num_visits_without_search_results) AS visits_without_results, CAST(100.0 * SUM(sq.num_searches_without_results) / NULLIF(SUM(sq.num_searches_without_results) + SUM(sq.num_searches_with_results), 0) AS DECIMAL(15,2)) AS no_result_rate_pct FROM ccdw_aggr_search_query sq JOIN ccdw_dim_site s ON s.site_id = sq.site_id WHERE sq.search_date >= ${from} AND sq.search_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY LOWER(sq.query) HAVING SUM(sq.num_searches_without_results) > 0 ORDER BY no_result_searches DESC, no_result_rate_pct DESC LIMIT ${limit}`;
    },
  },
  {
    name: 'checkout-funnel-dropoff',
    description: 'Visits reaching each checkout step with step-over-step drop-off to pinpoint funnel leaks',
    category: 'Traffic Analytics',
    tablesUsed: ['ccdw_aggr_visit_checkout', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      // Some tenants run parallel checkout implementations (e.g. SFRA + headless) that
      // write colliding step_numbers under different step_names into this table, which
      // makes a step_number-only funnel produce nonsensical drop-offs. Group by the
      // (step_number, step_name) identity and order the window by step_number then total
      // visits so each distinct checkout flow's steps stay in sequence; the dividend is
      // promoted with * 1.0 so Calcite does not truncate the ratio with integer division.
      return `WITH steps AS (SELECT vc.step_number AS step_number, vc.step_name AS step_name, SUM(vc.num_visits) AS num_visits, SUM(vc.num_hits) AS num_hits FROM ccdw_aggr_visit_checkout vc JOIN ccdw_dim_site s ON s.site_id = vc.site_id WHERE vc.visit_date >= ${from} AND vc.visit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY vc.step_number, vc.step_name) SELECT step_number, step_name, num_visits, num_hits, CAST(num_visits * 100.0 / NULLIF(FIRST_VALUE(num_visits) OVER (ORDER BY step_number, num_visits DESC), 0) AS DECIMAL(15,2)) AS pct_of_first_step, CAST((1.0 - num_visits * 1.0 / NULLIF(LAG(num_visits) OVER (ORDER BY step_number, num_visits DESC), 0)) * 100.0 AS DECIMAL(15,2)) AS dropoff_from_prev_pct FROM steps ORDER BY step_number, num_visits DESC`;
    },
  },
  {
    name: 'bot-traffic-share',
    description: 'Daily bot/crawler vs human visit share with the top bot family driving crawler traffic',
    category: 'Traffic Analytics',
    tablesUsed: ['ccdw_aggr_visit_robot', 'ccdw_aggr_visit_user_agent', 'ccdw_dim_site'],
    parameters: [
      {name: 'siteId', description: 'Natural site id', type: 'string', required: true},
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'limit', description: 'Max days returned (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const siteId = getStringLiteral(params, 'siteId');
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const limit = getOptionalIntegerLiteral(params, 'limit', 60, 1, 500);
      // Robot and human (user-agent) visits live in separate daily aggregate tables;
      // FULL OUTER JOIN on visit_date keeps days present in only one table. The top bot
      // family per day comes from a ROW_NUMBER() ranking CTE (ua_family is nullable, so
      // COALESCE to '(unknown)'). visit_date is CAST to VARCHAR for plain-string output.
      return `WITH robot AS (SELECT vr.visit_date AS visit_date, SUM(vr.num_visits) AS robot_visits FROM ccdw_aggr_visit_robot vr JOIN ccdw_dim_site s ON s.site_id = vr.site_id WHERE vr.visit_date >= ${from} AND vr.visit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY vr.visit_date), human AS (SELECT vu.visit_date AS visit_date, SUM(vu.num_visits) AS human_visits FROM ccdw_aggr_visit_user_agent vu JOIN ccdw_dim_site s ON s.site_id = vu.site_id WHERE vu.visit_date >= ${from} AND vu.visit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY vu.visit_date), bot_family_ranked AS (SELECT vr.visit_date AS visit_date, COALESCE(vr.ua_family, '(unknown)') AS ua_family, COALESCE(vr.ua_os_family, '(unknown)') AS ua_os_family, ROW_NUMBER() OVER (PARTITION BY vr.visit_date ORDER BY SUM(vr.num_visits) DESC, COALESCE(vr.ua_family, '(unknown)')) AS rn FROM ccdw_aggr_visit_robot vr JOIN ccdw_dim_site s ON s.site_id = vr.site_id WHERE vr.visit_date >= ${from} AND vr.visit_date <= ${to} AND s.nsite_id = ${siteId} GROUP BY vr.visit_date, COALESCE(vr.ua_family, '(unknown)'), COALESCE(vr.ua_os_family, '(unknown)')), top_bot_family AS (SELECT visit_date, ua_family, ua_os_family FROM bot_family_ranked WHERE rn = 1) SELECT CAST(COALESCE(r.visit_date, h.visit_date) AS VARCHAR) AS visit_day, COALESCE(r.robot_visits, 0) AS robot_visits, COALESCE(h.human_visits, 0) AS human_visits, COALESCE(r.robot_visits, 0) + COALESCE(h.human_visits, 0) AS total_visits, CAST(COALESCE(r.robot_visits, 0) * 100.0 / NULLIF(COALESCE(r.robot_visits, 0) + COALESCE(h.human_visits, 0), 0) AS DECIMAL(15,2)) AS bot_share_pct, tbf.ua_family AS top_bot_family, tbf.ua_os_family AS top_bot_os_family FROM robot r FULL OUTER JOIN human h ON r.visit_date = h.visit_date LEFT JOIN top_bot_family tbf ON tbf.visit_date = COALESCE(r.visit_date, h.visit_date) ORDER BY visit_day LIMIT ${limit}`;
    },
  },
  {
    name: 'inventory-stockout-by-location',
    description: 'Surface out-of-stock and low-stock SKUs by location for replenishment',
    category: 'Inventory Analytics',
    tablesUsed: ['ccdw_aggr_inventory_by_location', 'ccdw_dim_location', 'ccdw_dim_product'],
    parameters: [
      {name: 'from', description: 'Inclusive start date (YYYY-MM-DD)', type: 'date', required: true},
      {name: 'to', description: 'Inclusive end date (YYYY-MM-DD)', type: 'date', required: true},
      {
        name: 'threshold',
        description: 'Low-stock cutoff: available_to_order at or below this is flagged (default 10)',
        type: 'number',
        min: 0,
        max: 1000000,
      },
      {name: 'limit', description: 'Max rows (1-500)', type: 'number', min: 1, max: 500},
    ],
    buildSql(params) {
      const from = getDateLiteral(params, 'from');
      const to = getDateLiteral(params, 'to');
      const threshold = getOptionalIntegerLiteral(params, 'threshold', 10, 0, 1000000);
      const limit = getOptionalIntegerLiteral(params, 'limit', 100, 1, 500);
      // The CIP JDBC service rejects this 3-table join past ~9 projected columns
      // (a service-side query-complexity limit; the error misleadingly names the first
      // column). Keep the operationally essential columns and drop the surrogate id,
      // available_to_fulfill, and soft_reserved to stay within the limit.
      return `SELECT CAST(inv.record_date AS VARCHAR) AS record_date, l.nlocation_id AS location_id, p.nsku_id AS sku_id, p.sku_display_name, COALESCE(inv.on_hand, 0) AS on_hand, COALESCE(inv.available_to_order, 0) AS available_to_order, COALESCE(inv.reserved, 0) AS reserved, CASE WHEN COALESCE(inv.available_to_order, 0) <= 0 THEN 'out_of_stock' ELSE 'low' END AS stock_status, CAST(${threshold} - COALESCE(inv.available_to_order, 0) AS DECIMAL(15,2)) AS shortfall FROM ccdw_aggr_inventory_by_location inv JOIN ccdw_dim_location l ON l.location_id = inv.location_id JOIN ccdw_dim_product p ON p.sku_id = inv.sku_id WHERE inv.record_date >= ${from} AND inv.record_date <= ${to} AND COALESCE(inv.available_to_order, 0) <= ${threshold} ORDER BY shortfall DESC, l.nlocation_id, p.nsku_id LIMIT ${limit}`;
    },
  },
];
