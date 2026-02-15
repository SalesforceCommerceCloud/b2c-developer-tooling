---
description: Run raw SQL and curated analytics reports against Commerce Intelligence Platform (CIP).
---

# CIP Commands

Use `b2c cip` to query Commerce Intelligence Platform (CIP) data.

## Requirements

- OAuth client credentials are required (`--client-id` and `--client-secret`)
- CIP instance uses tenant (`--tenant-id` or `--tenant`)

## `b2c cip query`

Run raw SQL directly against CIP.

```bash
# inline SQL
b2c cip query \
  --tenant-id zzxy_prd \
  --client-id <client-id> \
  --client-secret <client-secret> \
  "SELECT * FROM ccdw_aggr_sales_summary LIMIT 10"

# read from file
b2c cip query --file ./query.sql --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>

# read from stdin
cat ./query.sql | b2c cip query --stdin --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

### Placeholders

`cip query` supports simple date placeholder substitution in raw SQL:

- `<FROM>` is replaced by `--from`
- `<TO>` is replaced by `--to`

Defaults:

- `--from` defaults to the first day of the current month
- `--to` defaults to today

## `b2c cip report`

Run curated reports as dedicated subcommands.

Use `b2c cip report --help` to see available report commands.

```bash
# show report commands
b2c cip report --help

# run a report command
b2c cip report sales-analytics \
  --site-id Sites-SiteGenesis-Site \
  --from 2025-01-01 \
  --to 2025-01-31 \
  --tenant-id zzxy_prd \
  --client-id <client-id> \
  --client-secret <client-secret>

# print generated SQL and pipe to raw query execution
b2c cip report sales-analytics --site-id Sites-SiteGenesis-Site --sql \
  | b2c cip query --stdin --tenant-id zzxy_prd --client-id <client-id> --client-secret <client-secret>
```

Use `--describe` on a report command to show parameter details.

Note: when you pass `--site-id`, CIP commonly expects `Sites-{siteId}-Site`. The command warns when the value does not match that pattern, but it still uses your provided value.

## Output

Both commands support:

- `--format table` (default)
- `--format csv`
- `--format json`
- `--json` (oclif JSON mode)
