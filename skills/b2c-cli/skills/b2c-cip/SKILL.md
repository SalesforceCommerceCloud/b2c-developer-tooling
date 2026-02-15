---
name: b2c-cip
description: Run Commerce Intelligence Platform (CIP/CCAC) analytics reports and SQL queries with the b2c cli. Use when users ask for sales/search/payment analytics, KPI validation, report exports, or custom SQL against B2C Commerce Intelligence data.
---

# B2C CIP Skill

Use `b2c cip` commands to query B2C Commerce Intelligence (CIP), also known as Commerce Cloud Analytics (CCAC).

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli`.

## Command Structure

```text
cip
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

## Requirements

- OAuth client credentials: `--client-id`, `--client-secret`
- CIP tenant: `--tenant-id` (or `--tenant`)
- API client has `Salesforce Commerce API` role with tenant filter for your instance

Optional:

- `--cip-host` (or `SFCC_CIP_HOST`) to override the default host
- `--staging` (or `SFCC_CIP_STAGING`) to force staging analytics host

::: warning Availability
This feature is typically used with production analytics tenants (for example `zzxy_prd`).

Starting with release 26.1, reports and dashboards data can also be enabled for non-production instances (ODS/dev/staging and designated test realms) using the **Enable Reports & Dashboards Data Tracking** feature switch.

Reports & Dashboards non-production URL: `https://ccac.stg.analytics.commercecloud.salesforce.com`
:::

## Quick Workflow

1. Start with curated report commands (`b2c cip report --help`).
2. Use `--describe` to inspect expected parameters.
3. Use `--sql` to preview generated SQL.
4. Pipe SQL into `cip query --stdin` when you need custom execution/output handling.

## Curated Report Examples

```bash
# Show report commands
b2c cip report --help

# Run a report
b2c cip report sales-analytics \
  --site-id Sites-RefArch-Site \
  --from 2025-01-01 \
  --to 2025-01-31 \
  --tenant-id zzxy_prd \
  --client-id <client-id> \
  --client-secret <client-secret>

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
  | b2c cip query --stdin --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

## Raw SQL Query Examples

```bash
b2c cip query \
  --tenant-id zzxy_prd \
  --client-id <client-id> \
  --client-secret <client-secret> \
  "SELECT * FROM ccdw_aggr_sales_summary LIMIT 10"
```

You can also use:

- `--file ./query.sql`
- `--stdin` (pipe query text from standard input)

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

Important limits include:

- up to 10 queries per minute
- 25 GB per day data quota (UTC daily reset)
- 30-minute max execution time per query

## Troubleshooting

- **`tenant-id is required`**: set `--tenant-id` (or `SFCC_TENANT_ID`)
- **Auth method error**: CIP supports client credentials only; remove `--user-auth`
- **403/unauthorized**: verify API client role and tenant filter include target instance
- **Rate/timeout failures**: reduce date window, select fewer columns, query aggregate tables

For full command reference, use `b2c cip --help` and [CLI docs](/cli/cip).
