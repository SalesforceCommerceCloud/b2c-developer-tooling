---
name: b2c-cip
description: Run analytics reports and SQL queries against B2C Commerce Intelligence data using the b2c CLI. Use this skill whenever the user needs sales analytics, search query performance metrics, payment data, or KPI exports. Also use when they need to discover available data tables, run custom SQL, or pull aggregate reports — even if they just say "show me sales data" or "what are our top search terms".
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
    ├── sales-analytics
    ├── sales-summary
    ├── ocapi-requests
    ├── top-selling-products
    ├── product-co-purchase-analysis
    ├── promotion-discount-analysis
    ├── search-query-performance
    ├── payment-method-performance
    ├── customer-registration-trends
    └── top-referrers
```

## Configuration

Values like `tenantId`, `clientId`, and `clientSecret` resolve from `dw.json` / `SFCC_*` env vars / the active instance. Examples below show minimal usage; add flags only to override configured values. If a required value is missing, the CLI emits an actionable error pointing at the flag, env var, and config key. See the `b2c-config` skill for precedence details.

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
# Show report commands
b2c cip report --help

# Run a report (tenant resolves from config)
b2c cip report sales-analytics \
  --site-id Sites-RefArch-Site \
  --from 2025-01-01 \
  --to 2025-01-31

# Show report parameter contract
b2c cip report top-referrers --describe

# Print generated SQL and stop
b2c cip report top-referrers --site-id Sites-RefArch-Site --limit 25 --sql

# Force staging analytics host
b2c cip report top-referrers --site-id Sites-RefArch-Site --limit 25 --staging --sql
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
