# Sales comparisons and coverage

Use only when interpreting sales gaps, comparing periods, or checking latest
activity. Standard report execution needs no extra reference read.

## Compare periods

- Resolve natural `nsite_id` and numeric `site_id` from `ccdw_dim_site`.
  Reuse verified IDs; do not derive one from a storefront identifier.
- Use equal complete windows with explicit inclusive dates. State the calendar
  week convention and timezone. Exclude an unfinished current week.
- `sales-analytics` sums across daily dimensions. `sales-summary` preserves them;
  individual rows are not daily totals. Apply report `resultNotes` when supplied.
- Period AOV = summed revenue / summed orders, not the average of daily AOV.
  Zero orders yields undefined AOV. Compute change only with a nonzero, comparable
  baseline and adequate coverage; otherwise explain why it is unavailable.
- `std_revenue` aggregates gross merchandise value in standard currency.
  Tax/shipping are separate measures. Resolve the reporting currency and taxation
  context before labeling amounts or comparing sites; do not assume net revenue.

## Coverage check

Run only if the user asks about freshness or returned dates leave a material gap.
Replace the example site and dates with the resolved task scope. This is a bounded
activity check, not an ingestion watermark or a count of zero-sales days.

```sql
SELECT CAST(MIN(ss.submit_date) AS VARCHAR) AS first_sales_date,
       CAST(MAX(ss.submit_date) AS VARCHAR) AS latest_sales_date,
       COUNT(DISTINCT ss.submit_date) AS days_with_rows
FROM ccdw_aggr_sales_summary ss
JOIN ccdw_dim_site s ON s.site_id = ss.site_id
WHERE s.nsite_id = 'Sites-Example-Site'
  AND ss.submit_date >= '2026-09-01'
  AND ss.submit_date <= '2026-09-07'
```

Missing rows can mean no activity, unavailable data, or incomplete ingestion.
Report which is known. A dimension's `last_update` does not establish freshness
of sales aggregates. If no documented refresh marker is available, state unknown
ingestion freshness and the latest activity date actually found in the window.
Do not infer warehouse date semantics from a client's serialized `Z` suffix.

## Definitions

For unresolved field meaning, consult the specific official table article:
[sales summary](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/jdbc_ccdw_aggr_sales_summary.html)
or [site dimension](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/jdbc_ccdw_dim_site.html).
For access/availability, use the
[analytics guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/analytics-reports-cip-ccac).
