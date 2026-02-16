---
description: User guide for running CIP/CCAC analytics reports and SQL queries with the B2C CLI.
---

# Analytics Reports (CIP/CCAC)

The B2C CLI includes a `cip` command family for **B2C Commerce Intelligence (CIP)**, also known as **Commerce Cloud Analytics (CCAC)** reporting.

It is based on the **B2C Commerce Intelligence JDBC Driver** and gives you three practical workflows:

- curated report commands (`b2c cip report <report-command>`) for common analytics use cases
- raw SQL (`b2c cip query`) for custom exploration
- metadata discovery (`b2c cip tables`, `b2c cip describe`) for schema/table inspection

Official JDBC reference:

- [B2C Commerce Intelligence JDBC Driver](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_intro.html)

::: warning Availability
Reports and dashboards are typically used with production tenants (for example, `abcd_prd`) and require Commerce Cloud Analytics (CCAC) to be enabled.
:::

## Authentication and Access

`cip` commands require an Account Manager API client configured for **client credentials** authentication.

Minimum requirements:

- API client with **Salesforce Commerce API** role
- role tenant filter includes your target production instance (for example `abcd_prd`)
- client ID and client secret available to the CLI

Recommended environment setup:

```bash
export SFCC_CLIENT_ID=<client-id>
export SFCC_CLIENT_SECRET=<client-secret>
export SFCC_TENANT_ID=<tenant-id>
```

See also: [Authentication Setup](/guide/authentication)

### Non-Production Support (26.1+)

Starting with B2C Commerce release **26.1**, reports and dashboards data can also be available for non-production instances, including:

- On-Demand Sandboxes (ODS)
- Development instances
- Staging instances
- Production instances in designated test realms (realms not serving live traffic)

To enable this, turn on **Enable Reports & Dashboards Data Tracking** in Business Manager feature switches.

- Reference: [Set Feature Switches (Toggles) in B2C Commerce](https://help.salesforce.com/s/articleView?id=cc.b2c_feature_switches.htm&type=5)
- Provisioning can take up to **2 hours** after enabling

Reports & Dashboards non-production URL:

- `https://ccac.stg.analytics.commercecloud.salesforce.com`

For CLI commands, you can target the staging analytics host with `--staging`.

### Host Selection Behavior

- tenant IDs ending in `_prd` use production host by default
- other tenant IDs use staging analytics host by default
- `--staging` forces staging host
- `--cip-host` overrides host selection explicitly

## Quick Start

### Curated reports (`cip report`)

Start by discovering and running a curated report command:

```bash
# discover available report commands
b2c cip report --help

# run a report
b2c cip report sales-analytics \
  --tenant-id abcd_prd \
  --site-id Sites-RefArch-Site \
  --from 2025-01-01 \
  --to 2025-01-31
```

Example output:

```text
date        std_revenue  orders  std_aov  units  aos  std_tax  std_shipping
─────────────────────────────────────────────────────────────────────────────
2026-02-03  227.92       1       227.92   2      2    11.7     13.98
2026-02-04  227.92       1       227.92   2      2    11.4     9.99
```

Inspect generated SQL before running:

```bash
b2c cip report sales-analytics --tenant-id abcd_prd --site-id Sites-RefArch-Site --sql
```

Pipe generated SQL into raw query execution:

```bash
b2c cip report sales-analytics --tenant-id abcd_prd --site-id Sites-RefArch-Site --sql \
  | b2c cip query --tenant-id abcd_prd

# force staging analytics host
b2c cip report sales-analytics --tenant-id abcd_prd --site-id Sites-RefArch-Site --staging --sql
```

For machine-readable report output:

```bash
b2c cip report sales-analytics --tenant-id abcd_prd --site-id Sites-RefArch-Site --format json
b2c cip report sales-analytics --tenant-id abcd_prd --site-id Sites-RefArch-Site --format csv
```

### Raw SQL (`cip query`)

You can run direct SQL with `b2c cip query`. This is useful for custom questions or lightweight troubleshooting.

The example below is a simplified OCAPI traffic query (similar in intent to the curated `ocapi-requests` report command):

```bash
b2c cip query \
  --tenant-id abcd_prd \
  --from 2026-02-03 \
  --to 2026-02-04 \
  "SELECT request_date, api_name, SUM(num_requests) AS total_requests
   FROM ccdw_aggr_ocapi_request
   WHERE request_date >= '<FROM>'
     AND request_date <= '<TO>'
   GROUP BY request_date, api_name
   ORDER BY request_date, total_requests DESC
   LIMIT 5"
```

`cip query` supports token substitution for date filters:

- `<FROM>` -> value of `--from`
- `<TO>` -> value of `--to`

If your SQL does not include these tokens, the query is sent unchanged.

Example output:

```text
request_date  api_name  total_requests
──────────────────────────────────────
2026-02-03    shop      120
2026-02-04    data      98
```

Use `--format json` or `--format csv` when you need machine-readable output.

### Metadata discovery (`cip tables`, `cip describe`)

Use metadata commands to discover table names and inspect columns before writing larger SQL queries.

```bash
# list table names in warehouse schema
b2c cip tables --tenant-id abcd_prd --pattern "ccdw_aggr_%"

# inspect table columns
b2c cip describe ccdw_aggr_ocapi_request --tenant-id abcd_prd
```

## Choosing Query vs Report

Use `cip report` when you want:

- stable, reusable report semantics
- safer parameter handling
- fast onboarding for common sales/search/payment analytics

Use `cip query` when you need:

- fully custom SQL
- exploratory analysis over additional tables/joins
- iterative SQL tuning

## Rate Limits and Query Discipline

::: warning Tight Limits
The JDBC analytics service enforces query timeout, quota, and rate limits, and these limits can change over time.

Always check the official documentation before designing high-volume workloads.

- [B2C Commerce Intelligence JDBC Access Guide](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_access_guide.html)
- See the **Non-Functional Requirements (NFR)** section (Query Execution Timeout, Quota Limit, Rate Limit)
  :::

Practical guidance:

- prefer aggregate tables over large fact tables when possible
- avoid `SELECT *`; request only required columns
- keep date ranges narrow and run incremental windows
- test with smaller windows first, then scale up

Reference source for limits and best practices:

- [Setting Up the B2C Commerce Intelligence JDBC Driver](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_access_guide.html)

## Site ID Parameter Note

Many curated reports use `--site-id`.

Common CIP format:

`Sites-{siteId}-Site`

The CLI warns if the value does not match that pattern, but it does not rewrite your input.

## JSON Output

For scripting and automation, use:

- `--json` for standard CLI JSON mode
- `--format json` to print JSON to stdout for query/report output paths

## SDK Support

If you're building applications or automation directly in TypeScript/Node.js, the SDK exposes CIP support:

- `createCipClient` for raw SQL execution
- `listCipTables`, `describeCipTable` for table/column metadata discovery
- `buildCipReportSql`, `listCipReports`, `executeCipReport` for curated report workflows

Example:

```ts
import {OAuthStrategy, createCipClient, executeCipReport} from '@salesforce/b2c-tooling-sdk';

const auth = new OAuthStrategy({
  clientId: process.env.SFCC_CLIENT_ID!,
  clientSecret: process.env.SFCC_CLIENT_SECRET!,
});

const cip = createCipClient({instance: 'abcd_prd'}, auth);

// Raw SQL
const raw = await cip.query('SELECT submit_date, num_orders FROM ccdw_aggr_sales_summary LIMIT 10');

// Curated report
const report = await executeCipReport(cip, 'sales-analytics', {
  params: {
    siteId: 'Sites-RefArch-Site',
    from: '2025-01-01',
    to: '2025-01-31',
  },
});
```

See the SDK API reference:

- [API Reference](/api/)
- [CipClient class](/api/clients/classes/CipClient)
- [createCipClient helper](/api/clients/functions/createCipClient)
- [CIP Operations API](/api/operations/cip/)

## Next Steps

- [CIP Commands](/cli/cip) for full command reference and flags
- [Configuration](/guide/configuration) for env vars and `dw.json` settings
- [Authentication Setup](/guide/authentication) for API client role and tenant filter setup
