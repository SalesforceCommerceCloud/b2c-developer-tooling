---
name: b2c-cip
description: Run analytics reports and SQL queries against B2C Commerce Intelligence data using the b2c CLI. Use this skill whenever the user needs sales analytics, search query performance metrics, payment data, or KPI exports, OR technical/developer analytics such as SCAPI/OCAPI request volume, API error rates, response-time/latency distributions, cache hit ratios, or SFRA controller health. Also use when they need to discover available data tables, run custom SQL, or pull aggregate reports — even if they just say "show me sales data", "what are our top search terms", or "which SCAPI endpoints are slow or erroring".
---

# B2C CIP Skill

Use `b2c cip` commands to query B2C Commerce Intelligence (CIP), also known as Commerce Cloud Analytics (CCAC).

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli`.

## Command Structure

```text
cip
├── tables                        - list metadata catalog tables
├── describe <table>              - describe table columns
├── query                         - raw SQL execution
└── report                        - curated report topic
    ├── list                       - list the catalog grouped by category
    ├── Sales:      sales-analytics, sales-summary, revenue-by-channel
    ├── Technical:  ocapi-requests, ocapi-client-usage, scapi-traffic-latency,
    │               scapi-error-rate-by-status, scapi-latency-distribution,
    │               scapi-cache-hit-ratio, controller-health-scorecard,
    │               controller-error-rate-trend, remote-include-performance
    ├── Product:    top-selling-products, product-co-purchase-analysis, recommender-effectiveness
    ├── Promotion:  promotion-discount-analysis, promotion-roi-leaderboard, discount-depth-breakdown
    ├── Search:     search-query-performance, zero-result-searches
    ├── Customer:   customer-registration-trends, new-vs-returning-buyer-revenue
    ├── Payment:    payment-method-performance
    ├── Traffic:    top-referrers, checkout-funnel-dropoff, bot-traffic-share
    └── Inventory:  inventory-stockout-by-location
```

Run `b2c cip report list` (or `--help`) for the live catalog; each report's exact flags come from `b2c cip report <name> --describe`.

## Configuration

Values like `tenantId`, `clientId`, and `clientSecret` resolve from `dw.json` / `SFCC_*` env vars / the active instance / configuration plugins. Examples below show minimal usage; **add flags only to override configured values** — passing `--client-id`/`--client-secret`/`--tenant-id` is usually unnecessary. If a required value is missing, the CLI emits an actionable error pointing at the flag, env var, and config key.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (`--json` for scripting, `--unmask` to reveal secrets). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

Relevant overrides:

- `--tenant-id` (alias `--tenant`) / `SFCC_TENANT_ID` / `tenantId`
- `--client-id` / `SFCC_CLIENT_ID` / `clientId`
- `--client-secret` / `SFCC_CLIENT_SECRET` / `clientSecret`
- `--cip-host` / `SFCC_CIP_HOST` to override the default host
- `--staging` / `SFCC_CIP_STAGING` to force staging analytics host

## Requirements

- OAuth client credentials (CIP supports client credentials only; `--user-auth` is not supported)
- API client has `Salesforce Commerce API` role with tenant filter for your instance

::: warning Availability
This feature is typically used with production analytics tenants (for example `abcd_prd`).

Starting with release 26.1, reports and dashboards data can also be enabled for non-production instances (ODS/dev/staging and designated test realms) using the **Enable Reports & Dashboards Data Tracking** feature switch.

Reports & Dashboards non-production URL: `https://ccac.stg.analytics.commercecloud.salesforce.com`
:::

## Quick Workflow

1. Discover available tables (`b2c cip tables`) or curated reports (`b2c cip report --help`).
2. Use `b2c cip describe <table>` or report `--describe` to inspect structure/parameters.
3. Use report `--sql` to preview generated SQL.
4. Pipe SQL into `cip query` when you need custom execution/output handling.

## Metadata Discovery Examples

```bash
# List warehouse tables (uses configured tenant)
b2c cip tables

# Filter table names
b2c cip tables --pattern "ccdw_aggr_%"

# Describe table columns
b2c cip describe ccdw_aggr_ocapi_request

# Target a different tenant than the active config
b2c cip tables --tenant-id abcd_prd
```

## Known Tables

For an efficient table catalog grouped by aggregate/dimension/fact families, use:

- `references/KNOWN_TABLES.md`

For a general-purpose starter query pack with ready-to-run SQL patterns, use:

- `references/STARTER_QUERIES.md`

The list is derived from official JDBC documentation and intended as a quick discovery aid.

## Curated Report Examples

```bash
# Discover the catalog grouped by category (no credentials needed)
b2c cip report list
b2c cip report list --category "Technical Analytics"

# Run a report (tenant resolves from config)
b2c cip report sales-analytics \
  --site-id Sites-RefArch-Site \
  --from 2025-01-01 \
  --to 2025-01-31

# Show report parameter contract (flags are auto-derived per report)
b2c cip report top-referrers --describe

# Print generated SQL and stop
b2c cip report top-referrers --site-id Sites-RefArch-Site --limit 25 --sql

# Force staging analytics host
b2c cip report top-referrers --site-id Sites-RefArch-Site --limit 25 --staging --sql
```

### Technical / developer reports

These analyze SCAPI, OCAPI, and SFRA controller request data. The request tables carry a
response-time histogram (`num_requests_bucket1..11`, fastest→slowest), so the latency-distribution
and health-scorecard reports surface the **slow-tail percentage** that a plain average hides.
SCAPI traffic is often attributed to a headless site (or no site), so `--site-id` is optional on
SCAPI reports — omit it to span all sites.

```bash
# SCAPI latency distribution + slow-tail %, all sites
b2c cip report scapi-latency-distribution --from 2025-01-01 --to 2025-01-31

# SCAPI endpoints ranked by 5xx error rate
b2c cip report scapi-error-rate-by-status --from 2025-01-01 --to 2025-01-31 --status-class 5xx

# SCAPI cache hit ratio (find cacheable endpoints running as MISS)
b2c cip report scapi-cache-hit-ratio --from 2025-01-01 --to 2025-01-31

# OCAPI usage per integration client_id
b2c cip report ocapi-client-usage --from 2025-01-01 --to 2025-01-31

# SFRA controller health scorecard / daily error-rate trend
b2c cip report controller-health-scorecard --site-id Sites-RefArch-Site --from 2025-01-01 --to 2025-01-31
b2c cip report controller-error-rate-trend --site-id Sites-RefArch-Site --from 2025-01-01 --to 2025-01-31
```

### SQL Pipeline Pattern

```bash
b2c cip report sales-analytics --site-id Sites-RefArch-Site --sql \
  | b2c cip query
```

## Raw SQL Query Examples

```bash
b2c cip query "SELECT * FROM ccdw_aggr_sales_summary LIMIT 10"
```

You can also use:

- `--file ./query.sql`
- pipe query text from standard input (for example `cat query.sql | b2c cip query ...`)

### Date Placeholders

`b2c cip query` supports placeholder replacement:

- `<FROM>` with `--from YYYY-MM-DD`
- `<TO>` with `--to YYYY-MM-DD`
- `--from` defaults to first day of current month
- `--to` defaults to today

If you provide `--site-id`, the common CIP format is `Sites-{siteId}-Site`. The command warns when `siteId` does not match that pattern but still runs with your input.

## Output Formats

Both raw query and report commands support:

- `--format table` (default)
- `--format csv`
- `--format json`
- `--json` (global JSON mode)

## Service Limits and Best Practices

The underlying JDBC analytics service has strict limits. Keep requests scoped:

- avoid broad `SELECT *` queries
- use narrow date ranges and incremental windows
- prefer aggregate tables when possible
- use report commands for common KPI workflows

Limits can change over time. Use the official JDBC access guide for current NFR limits:

- https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_access_guide.html

## Troubleshooting

- **`tenant-id is required`**: set `--tenant-id` (or `SFCC_TENANT_ID`)
- **Auth method error**: CIP supports client credentials only; remove `--user-auth`
- **403/unauthorized**: verify API client role and tenant filter include target instance
- **Rate/timeout failures**: reduce date window, select fewer columns, query aggregate tables

For full command reference, use `b2c cip --help` and [CLI docs](/cli/cip).
