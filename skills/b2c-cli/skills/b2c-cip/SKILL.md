---
name: b2c-cip
description: Run Commerce Intelligence Platform (CIP) SQL queries and curated analytics reports with the b2c cli. Use when investigating KPIs, validating analytics data, or exporting CIP report results.
---

# B2C CIP Skill

Use `b2c cip` commands to query CIP analytics data.

## Requirements

- OAuth client credentials: `--client-id`, `--client-secret`
- CIP instance: `--tenant-id` (or `--tenant`)

Optional:

- `--cip-host` (or `SFCC_CIP_HOST`) to override the default host

## Raw SQL Queries

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

## Curated Reports

Show report commands:

```bash
b2c cip report --help
```

Run a report command:

```bash
b2c cip report sales-analytics \
  --site-id Sites-SiteGenesis-Site \
  --from 2025-01-01 \
  --to 2025-01-31 \
  --tenant-id zzxy_prd \
  --client-id <client-id> \
  --client-secret <client-secret>
```

Print generated SQL and pipe it to raw query execution:

```bash
b2c cip report sales-analytics --site-id Sites-SiteGenesis-Site --sql \
  | b2c cip query --stdin --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

Use `--describe` on a report command to view parameter details.

If you provide `--site-id`, the common CIP format is `Sites-{siteId}-Site`. The command warns when `siteId` does not match that pattern but still runs with your input.

## Output Formats

Both commands support:

- `--format table` (default)
- `--format csv`
- `--format json`
- `--json`
