---
description: Run raw SQL and curated analytics reports against Commerce Intelligence Platform (CIP).
---

# CIP Commands

Use `b2c cip` to query Commerce Intelligence Platform (CIP/CCAC) analytics data.

::: tip Production and Non-Production Hosts
By default, CIP uses the production analytics host for tenants ending in `_prd` and the staging analytics host for other tenant IDs. Use `--staging` to force the staging host, or `--cip-host` for an explicit override.
:::

## Command Overview

| Command                           | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `b2c cip tables`                  | List tables from the CIP metadata catalog      |
| `b2c cip describe <table>`        | Describe columns for a CIP table               |
| `b2c cip query`                   | Run raw SQL (argument, file, or stdin)         |
| `b2c cip report`                  | Report topic help and report command discovery |
| `b2c cip report <report-command>` | Run a curated report command                   |

::: warning Availability
These commands target Commerce Cloud Analytics (CCAC) data and are primarily used with production analytics tenants. Non-production access is available when Reports & Dashboards data tracking is enabled for supported 26.1+ environments.
:::

## Authentication

CIP commands use **OAuth client credentials only**.

| Requirement           | How to provide                                 |
| --------------------- | ---------------------------------------------- |
| Client ID             | `--client-id` or `SFCC_CLIENT_ID`              |
| Client Secret         | `--client-secret` or `SFCC_CLIENT_SECRET`      |
| Tenant (CIP instance) | `--tenant-id` / `--tenant` or `SFCC_TENANT_ID` |

Your API client must include the **Salesforce Commerce API** role with a tenant filter that includes your target instance.

## Connection and Output Flags

These flags are available on all CIP commands:

| Flag           | Description                           | Default                                       |
| -------------- | ------------------------------------- | --------------------------------------------- |
| `--format`     | Output format: `table`, `csv`, `json` | `table`                                       |
| `--fetch-size` | Frame fetch size for paging           | `1000`                                        |
| `--cip-host`   | CIP host override                     | `jdbc.analytics.commercecloud.salesforce.com` |
| `--staging`    | Use staging analytics host            | `false`                                       |

## Query and Report Date Flags

These flags are available on `cip query` and `cip report <report-command>` commands:

| Flag     | Description                       | Default                    |
| -------- | --------------------------------- | -------------------------- |
| `--from` | Inclusive start date (YYYY-MM-DD) | First day of current month |
| `--to`   | Inclusive end date (YYYY-MM-DD)   | Today                      |

## b2c cip tables

List tables from the CIP metadata catalog.

### Usage

```bash
b2c cip tables [flags]
```

### Flags

| Flag        | Description                                          |
| ----------- | ---------------------------------------------------- |
| `--schema`  | Metadata schema to inspect (default: `warehouse`)    |
| `--pattern` | Table name pattern using SQL `LIKE` semantics        |
| `--all`     | Include all table types (default filters to `TABLE`) |

### Examples

```bash
# List warehouse tables
b2c cip tables --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>

# Filter by table prefix
b2c cip tables --tenant-id zzxy_prd --pattern "ccdw_aggr_%" --client-id <client-id> --client-secret <client-secret>

# Include metadata/system tables
b2c cip tables --tenant-id zzxy_prd --schema metadata --all --client-id <client-id> --client-secret <client-secret>
```

## b2c cip describe

Describe table columns using CIP metadata catalog.

### Usage

```bash
b2c cip describe <table> [flags]
```

### Flags

| Flag       | Description                                                 |
| ---------- | ----------------------------------------------------------- |
| `--schema` | Metadata schema containing the table (default: `warehouse`) |

### Examples

```bash
# Describe a warehouse table
b2c cip describe ccdw_aggr_ocapi_request --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>

# Describe metadata system table
b2c cip describe COLUMNS --schema metadata --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

## b2c cip query

Run raw SQL directly against CIP.

### Usage

```bash
b2c cip query [SQL] [flags]
```

### SQL Input Sources

Provide SQL from exactly one source:

1. Positional argument (`b2c cip query "SELECT ..."`)
2. `--file <path>`
3. Piped stdin (for example `cat query.sql | b2c cip query ...`)

### Query-Specific Flags

| Flag           | Description              |
| -------------- | ------------------------ |
| `--file`, `-f` | Read SQL query from file |

### Placeholders

`cip query` supports placeholder substitution:

- `<FROM>` is replaced by `--from`
- `<TO>` is replaced by `--to`

### Examples

```bash
# Inline SQL argument
b2c cip query \
  --tenant-id zzxy_prd \
  --client-id <client-id> \
  --client-secret <client-secret> \
  "SELECT submit_date, num_orders FROM ccdw_aggr_sales_summary LIMIT 10"

# Non-production / staging analytics host
b2c cip query \
  --tenant-id zzxy_stg \
  --staging \
  --client-id <client-id> \
  --client-secret <client-secret> \
  "SELECT submit_date, num_orders FROM ccdw_aggr_sales_summary LIMIT 10"

# Read SQL from file
b2c cip query --file ./query.sql --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>

# Read SQL from stdin
cat ./query.sql | b2c cip query --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

## b2c cip report

Run curated reports using dedicated subcommands.

### Usage

```bash
b2c cip report --help
b2c cip report <report-command> [flags]
```

### Shared Report Flags

| Flag         | Description                                 |
| ------------ | ------------------------------------------- |
| `--describe` | Show report metadata and parameter contract |
| `--sql`      | Print generated SQL and exit                |

Use `--sql` to pipe into `cip query`:

```bash
b2c cip report sales-analytics --site-id Sites-RefArch-Site --sql \
  | b2c cip query --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

### Report Commands

| Command                        | Description                           | Extra Flags                  |
| ------------------------------ | ------------------------------------- | ---------------------------- |
| `sales-analytics`              | Daily sales performance with AOV/AOS  | `--site-id`                  |
| `sales-summary`                | Detailed sales records                | `--site-id` (optional)       |
| `ocapi-requests`               | OCAPI request volume and latency      | `--site-id`                  |
| `top-selling-products`         | Top products by units/revenue         | `--site-id`                  |
| `product-co-purchase-analysis` | Frequently co-purchased products      | `--site-id`                  |
| `promotion-discount-analysis`  | Promotion discount impact             | none                         |
| `search-query-performance`     | Search revenue and conversion metrics | `--site-id`, `--has-results` |
| `payment-method-performance`   | Payment method adoption/performance   | `--site-id`                  |
| `customer-registration-trends` | Registration trends by date/device    | `--site-id`                  |
| `top-referrers`                | Referrer traffic share                | `--site-id`, `--limit`       |

### Site ID Format

For report commands that accept `--site-id`, the common CIP format is:

`Sites-{siteId}-Site`

If your value does not match this pattern, the command warns and still uses your provided value.

### Examples

```bash
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

# Generate SQL only
b2c cip report top-referrers --site-id Sites-RefArch-Site --limit 25 --sql
```

## Output Formats

Both `cip query` and report commands support:

- `--format table` (default)
- `--format csv` (writes CSV to stdout)
- `--format json` (writes JSON to stdout)
- `--json` (global JSON mode)
