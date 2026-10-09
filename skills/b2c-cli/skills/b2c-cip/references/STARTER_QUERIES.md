# CIP Starter Queries

Read only the section matching the custom analysis. Prefer a curated report
when it already answers the task. For sales interpretation/coverage, use
[Sales analysis](SALES_ANALYSIS.md).

Replace `Sites-Example-Site` with a verified natural site ID. Replace `<FROM>` /
`<TO>` with explicit inclusive dates before MCP execution. CLI `b2c cip query`
can replace them using `--from` / `--to`. Discover columns before adapting a query.
Date/site predicates bound the analysis; LIMIT only bounds returned rows.

## 1) Recent Daily Sales Snapshot

```sql
SELECT ss.submit_date, SUM(ss.num_orders) AS orders,
       SUM(ss.std_revenue) AS revenue
FROM ccdw_aggr_sales_summary ss
JOIN ccdw_dim_site s ON s.site_id = ss.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND ss.submit_date >= '<FROM>' AND ss.submit_date <= '<TO>'
GROUP BY ss.submit_date
ORDER BY ss.submit_date DESC
LIMIT 20
```

## 2) Sales by Site (Joined)

```sql
SELECT ss.submit_date, ds.nsite_id, SUM(ss.num_orders) AS orders, SUM(ss.std_revenue) AS revenue
FROM ccdw_aggr_sales_summary ss
JOIN ccdw_dim_site ds ON ss.site_id = ds.site_id
WHERE ds.nsite_id = 'Sites-Example-Site'
  AND ss.submit_date >= '<FROM>' AND ss.submit_date <= '<TO>'
GROUP BY ss.submit_date, ds.nsite_id
ORDER BY ss.submit_date DESC
LIMIT 30
```

## 3) Top-Selling Products by Revenue

```sql
SELECT p.nproduct_id, p.product_display_name, SUM(pss.std_revenue) AS revenue, SUM(pss.num_units) AS units
FROM ccdw_aggr_product_sales_summary pss
JOIN ccdw_dim_product p ON p.product_id = pss.product_id
JOIN ccdw_dim_site s ON s.site_id = pss.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND pss.submit_date >= '<FROM>' AND pss.submit_date <= '<TO>'
GROUP BY p.nproduct_id, p.product_display_name
ORDER BY revenue DESC
LIMIT 25
```

## 4) Promotion Impact Summary

```sql
SELECT p.promotion_class, SUM(pss.std_revenue) AS revenue, SUM(pss.std_total_discount) AS discount
FROM ccdw_aggr_promotion_sales_summary pss
JOIN ccdw_dim_promotion p ON p.promotion_id = pss.promotion_id
JOIN ccdw_dim_site s ON s.site_id = pss.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND pss.submit_date >= '<FROM>' AND pss.submit_date <= '<TO>'
GROUP BY p.promotion_class
ORDER BY revenue DESC
LIMIT 20
```

## 5) OCAPI Request Volume

```sql
SELECT request_date, api_name, api_resource, SUM(num_requests) AS total_requests, SUM(response_time) AS total_response_time
FROM ccdw_aggr_ocapi_request a
JOIN ccdw_dim_site s ON s.site_id = a.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND a.request_date >= '<FROM>' AND a.request_date <= '<TO>'
GROUP BY request_date, api_name, api_resource
ORDER BY request_date DESC, total_requests DESC
LIMIT 25
```

## 6) SCAPI Request Volume

Use a site filter only after verifying attribution; omit the site join/filter for
an explicitly requested all-site analysis. Headless traffic may have no site.

```sql
SELECT request_date, api_name, api_resource, SUM(num_requests) AS total_requests, SUM(response_time) AS total_response_time
FROM ccdw_aggr_scapi_request a
JOIN ccdw_dim_site s ON s.site_id = a.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND a.request_date >= '<FROM>' AND a.request_date <= '<TO>'
GROUP BY request_date, api_name, api_resource
ORDER BY request_date DESC, total_requests DESC
LIMIT 25
```

## 7) Top Search Terms by Revenue

```sql
SELECT LOWER(sc.query) AS search_term, SUM(sc.num_searches) AS searches, SUM(sc.num_orders) AS orders, SUM(sc.std_revenue) AS revenue
FROM ccdw_aggr_search_conversion sc
JOIN ccdw_dim_site s ON s.site_id = sc.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND sc.search_date >= '<FROM>' AND sc.search_date <= '<TO>'
GROUP BY LOWER(sc.query)
ORDER BY revenue DESC
LIMIT 30
```

## 8) Referrer Mix

```sql
SELECT referrer_medium, referrer_source, SUM(num_visits) AS visits
FROM ccdw_aggr_visit_referrer vr
JOIN ccdw_dim_site s ON s.site_id = vr.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND vr.visit_date >= '<FROM>' AND vr.visit_date <= '<TO>'
GROUP BY referrer_medium, referrer_source
ORDER BY visits DESC
LIMIT 30
```

## 9) Customer Registration Trend

```sql
SELECT registration_date, SUM(num_registrations) AS registrations
FROM ccdw_aggr_registration r
JOIN ccdw_dim_site s ON s.site_id = r.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND r.registration_date >= '<FROM>' AND r.registration_date <= '<TO>'
GROUP BY registration_date
ORDER BY registration_date DESC
LIMIT 30
```

## 10) Payment Method Performance

```sql
SELECT pm.display_name AS payment_method, SUM(pss.num_payments) AS payments, SUM(pss.std_captured_amount) AS captured_amount
FROM ccdw_aggr_payment_sales_summary pss
JOIN ccdw_dim_payment_method pm ON pm.payment_method_id = pss.payment_method_id
JOIN ccdw_dim_site s ON s.site_id = pss.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND pss.submit_date >= '<FROM>' AND pss.submit_date <= '<TO>'
GROUP BY pm.display_name
ORDER BY captured_amount DESC
LIMIT 20
```
