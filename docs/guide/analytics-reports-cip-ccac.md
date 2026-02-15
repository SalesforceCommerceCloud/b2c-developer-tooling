---
description: User guide for running CIP/CCAC analytics reports and SQL queries with the B2C CLI.
---

# Analytics Reports (CIP/CCAC)

The B2C CLI includes a `cip` command family for **B2C Commerce Intelligence (CIP)**, also known as **Commerce Cloud Analytics (CCAC)** reporting.

It is based on the **B2C Commerce Intelligence JDBC Driver** and gives you two workflows:

- curated report commands (`b2c cip report <report-command>`) for common analytics use cases
- raw SQL (`b2c cip query`) for custom exploration

Official JDBC reference:

- [B2C Commerce Intelligence JDBC Driver](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_intro.html)

::: warning Availability
Reports and dashboards are typically used with production tenants (for example, `abcd_prd`) and require Commerce Cloud Analytics (CCAC) to be enabled.
:::

## Authentication and Access

`cip` commands require an Account Manager API client configured for **client credentials** authentication.

Minimum requirements:

- API client with **Salesforce Commerce API** role
- role tenant filter includes your target production instance (for example `zzxy_prd`)
- client ID and client secret available to the CLI

Recommended environment setup:

```bash
export SFCC_CLIENT_ID=<client-id>
export SFCC_CLIENT_SECRET=<client-secret>
export SFCC_TENANT_ID=<tenant-id>
```

See also: [Authentication Setup](/guide/authentication)

## Non-Production Support (26.1+)

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

## Quick Start

Start with curated reports:

```bash
# discover available report commands
b2c cip report --help

# run a report
b2c cip report sales-analytics \
  --site-id Sites-RefArch-Site \
  --from 2025-01-01 \
  --to 2025-01-31
```

Inspect generated SQL before running:

```bash
b2c cip report sales-analytics --site-id Sites-RefArch-Site --sql
```

Pipe generated SQL into raw query execution:

```bash
b2c cip report sales-analytics --site-id Sites-RefArch-Site --sql \
  | b2c cip query --stdin

# force staging analytics host
b2c cip report sales-analytics --site-id Sites-RefArch-Site --staging --sql
```

### Host Selection Behavior

- tenant IDs ending in `_prd` use production host by default
- other tenant IDs use staging analytics host by default
- `--staging` forces staging host
- `--cip-host` overrides host selection explicitly

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
The JDBC analytics service has strict operational limits. Design queries accordingly.

- Up to **10 queries per minute**
- Queries returning over **450,000 rows** count as multiple queries
- Daily data quota of **25 GB** (resets at **12:00 AM UTC**)
- Maximum query execution time of **30 minutes**
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

## Next Steps

- [CIP Commands](/cli/cip) for full command reference and flags
- [Configuration](/guide/configuration) for env vars and `dw.json` settings
- [Authentication Setup](/guide/authentication) for API client role and tenant filter setup
