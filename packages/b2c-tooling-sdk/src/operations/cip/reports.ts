/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipReportDefinition} from './types.js';

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

function getRequiredString(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new Error(`Missing required report parameter: ${key}`);
  }

  return value;
}

function getDateLiteral(params: Record<string, string>, key: string): string {
  const value = getRequiredString(params, key);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error(`Invalid date for parameter "${key}": expected YYYY-MM-DD`);
  }

  return `'${escapeSqlString(value)}'`;
}

function getStringLiteral(params: Record<string, string>, key: string): string {
  const value = getRequiredString(params, key);
  return `'${escapeSqlString(value)}'`;
}

function getBooleanLiteral(params: Record<string, string>, key: string): string {
  const value = getRequiredString(params, key).toLowerCase();
  if (value !== 'true' && value !== 'false') {
    throw new Error(`Invalid boolean for parameter "${key}": expected true or false`);
  }

  return value;
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

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid integer for parameter "${key}": expected ${min}-${max}`);
  }

  return String(parsed);
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
      {name: 'hasResults', description: 'Filter successful/unsuccessful searches', type: 'boolean', required: true},
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
];
