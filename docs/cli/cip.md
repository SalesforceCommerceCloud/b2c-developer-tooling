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
| `b2c cip report list`             | List the curated report catalog by category    |
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
| Tenant (CIP instance) | `--tenant-id` or `SFCC_TENANT_ID`              |

Your API client must include the **Salesforce Commerce API** role with a tenant filter that includes your target instance.

## Connection and Output Flags

These flags are available on `cip tables`, `cip describe`, `cip query`, and `cip report` subcommands:

| Flag           | Description                           | Default                                       |
| -------------- | ------------------------------------- | --------------------------------------------- |
| `--format`     | Output format: `table`, `csv`, `json` | `table`                                       |
| `--fetch-size` | Frame fetch size for paging           | `1000`                                        |
| `--cip-host`   | CIP host override                     | `jdbc.analytics.commercecloud.salesforce.com` |
| `--staging`    | Use staging analytics host            | `false`                                       |
| `--json`       | Output result as JSON                 | `false`                                       |

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

### Discovering Reports

List the full catalog grouped by category (no credentials required):

```bash
b2c cip report list
b2c cip report list --category "Technical Analytics"
b2c cip report list --json
```

### Report Commands

Report flags are derived from each report's parameter contract — run `b2c cip report <command> --describe` to see the exact flags and which are required.

**Sales Analytics**

| Command              | Description                                  | Extra Flags             |
| -------------------- | -------------------------------------------- | ----------------------- |
| `sales-analytics`    | Daily sales performance with AOV/AOS         | `--site-id`             |
| `sales-summary`      | Detailed sales records                       | `--site-id` (optional)  |
| `revenue-by-channel` | Revenue/AOV/discount by channel/device/locale | `--site-id`, `--limit`  |

**Technical Analytics**

| Command                       | Description                                            | Extra Flags                            |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------- |
| `ocapi-requests`              | OCAPI request volume and latency                       | `--site-id`                            |
| `ocapi-client-usage`          | OCAPI volume, error rate, latency per client_id        | `--site-id` (optional), `--limit`      |
| `scapi-traffic-latency`       | SCAPI endpoints by volume and average latency          | `--site-id` (optional), `--limit`      |
| `scapi-error-rate-by-status`  | SCAPI endpoints by 4xx/5xx error rate                  | `--site-id` (optional), `--status-class`, `--limit` |
| `scapi-latency-distribution`  | SCAPI latency histogram + slow-tail (SLA) percentage   | `--site-id` (optional), `--limit`      |
| `scapi-cache-hit-ratio`       | SCAPI cache hit ratio per endpoint                     | `--site-id` (optional), `--limit`      |
| `controller-health-scorecard` | SFRA controller volume/errors/slow-tail/cache          | `--site-id`, `--limit`                 |
| `controller-error-rate-trend` | Daily 4xx/5xx error rate per controller                | `--site-id`, `--limit`                 |
| `remote-include-performance`  | Remote-include child controllers by parent page        | `--site-id`, `--limit`                 |

**Product, Promotion & Search**

| Command                        | Description                           | Extra Flags                  |
| ------------------------------ | ------------------------------------- | ---------------------------- |
| `top-selling-products`         | Top products by units/revenue         | `--site-id`                  |
| `product-co-purchase-analysis` | Frequently co-purchased products      | `--site-id`                  |
| `recommender-effectiveness`    | Recommender engagement and ROI        | `--site-id`, `--limit`       |
| `promotion-discount-analysis`  | Promotion discount impact             | none                         |
| `promotion-roi-leaderboard`    | Promotions by revenue per discount $  | `--site-id`, `--limit`       |
| `discount-depth-breakdown`     | Promotional vs manual discount split  | `--site-id`                  |
| `search-query-performance`     | Search revenue and conversion metrics | `--site-id`, `--has-results` |
| `zero-result-searches`         | Search terms returning no results     | `--site-id`, `--limit`       |

**Customer, Traffic & Inventory**

| Command                          | Description                              | Extra Flags                  |
| -------------------------------- | ---------------------------------------- | ---------------------------- |
| `customer-registration-trends`   | Registration trends by date/device       | `--site-id`                  |
| `new-vs-returning-buyer-revenue` | First-time vs returning buyer revenue     | `--site-id`                  |
| `payment-method-performance`     | Payment method adoption/performance       | `--site-id`                  |
| `top-referrers`                  | Referrer traffic share                    | `--site-id`, `--limit`       |
| `checkout-funnel-dropoff`        | Visits and drop-off per checkout step     | `--site-id`                  |
| `bot-traffic-share`              | Bot vs human visit share by day           | `--site-id`, `--limit`       |
| `inventory-stockout-by-location` | Out-of-stock / low-stock SKUs by location | `--threshold`, `--limit`     |

::: tip Technical reports and latency buckets
The SCAPI/OCAPI/controller request tables record a response-time histogram (`num_requests_bucket1..11`, fastest to slowest). The `*-latency-distribution` and `*-health-scorecard` reports use these buckets to surface the slow-tail percentage that a plain average latency hides. SCAPI traffic is often attributed to a headless site (or no site at all), so `--site-id` is optional on SCAPI reports — omit it to span all sites.
:::

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

# Technical: SCAPI latency distribution (slow-tail %), all sites
b2c cip report scapi-latency-distribution \
  --tenant-id zzxy_prd --from 2025-01-01 --to 2025-01-31

# Technical: SCAPI endpoints by 5xx error rate
b2c cip report scapi-error-rate-by-status \
  --tenant-id zzxy_prd --from 2025-01-01 --to 2025-01-31 --status-class 5xx

# Technical: SFRA controller health scorecard
b2c cip report controller-health-scorecard \
  --tenant-id zzxy_prd --site-id Sites-RefArch-Site --from 2025-01-01 --to 2025-01-31

# Inventory: low/out-of-stock SKUs by location
b2c cip report inventory-stockout-by-location \
  --tenant-id zzxy_prd --from 2025-01-01 --to 2025-01-31 --threshold 10
```

## Output Formats

Both `cip query` and report commands support:

- `--format table` (default)
- `--format csv` (writes CSV to stdout)
- `--format json` (writes JSON to stdout)
- `--json` (global JSON mode; available on all CIP commands)
