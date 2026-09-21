---
name: b2c-cip
description: Query CIP/CCAC sales, merchandising, payment, traffic, and API/controller analytics with the B2C CLI or MCP. Discover reports/tables, scope SQL, export results, and resolve analytics access.
---

# CIP analytics

Use warehouse analytics for trends; use SCAPI/logs for current records and
immediate diagnosis. If `b2c` is unavailable, use `npx @salesforce/b2c-cli`.

## Choose the surface

- Prefer MCP `cip_discover` / `cip_query` when available. Read
  `skill://mcp/cip/SKILL.md` before querying and pass `skillRead: true`.
  Discovery/config inspection is ungated. No terminal or token export needed.
- Use CLI for explicit CLI requests, automation, or larger local CSV/JSON exports.
  MCP limits results to 500 rows / 24 KB; `truncated` means incomplete output,
  and `rowCount` counts returned rows. CLI defaults differ: date flags use the
  current month unless overridden. Set explicit dates for the user's task.
- Both surfaces use the same reports and toolkit configuration. Do not run both
  to repeat a successful result.

## Configuration and access

Reuse resolved `tenantId`, `clientId`, `clientSecret` from `dw.json`, environment,
instance selection, and configuration plugins. Use masked `b2c setup inspect`
only if target/access is unclear; ask for missing values instead of guessing.
Do not read secret files or export tokens for normal analytics requests.

Requires Account Manager client credentials and the **Salesforce Commerce API**
role with the target tenant in its tenant filter. User/SLAS/JWT flows do not apply.
Overrides:

| Value | CLI / environment |
| --- | --- |
| Tenant | `--tenant-id` (`--tenant`) / `SFCC_TENANT_ID` |
| Client | `--client-id` / `SFCC_CLIENT_ID` |
| Secret | `--client-secret` / `SFCC_CLIENT_SECRET` |
| Analytics host | `--cip-host` / `SFCC_CIP_HOST` |
| Force staging analytics | `--staging` / `SFCC_CIP_STAGING` |

Tenants ending `_prd` select production analytics; other tenants select staging.
Explicit host configuration wins. Staging analytics is a destination, not an
instruction to change the target instance. Non-production data requires 26.1+
**Enable Reports & Dashboards Data Tracking**. Production tenants in test realms
can also need staging analytics. Dashboard: `https://ccac.stg.analytics.commercecloud.salesforce.com`.

Missing configuration/availability:
[analytics guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/analytics-reports-cip-ccac).
Resolution details: `b2c-cli/b2c-config`. Read only the relevant section.

## Discover and execute

1. List/search reports; inspect the selected report's parameters. MCP report
   details also supply tables and available result notes.
2. Fix site/date scope. Warehouse `nsite_id` often resembles `Sites-Example-Site`;
   verify it in `ccdw_dim_site` rather than constructing it from a SCAPI site ID.
3. Run the report. Preview SQL only to adapt it or resolve an unclear definition.
   Inspect table columns when custom SQL needs them; avoid exhaustive browsing.

```bash
b2c cip report list --category "Sales Analytics"
b2c cip report sales-analytics --describe
b2c cip report sales-analytics --site-id Sites-Example-Site --from 2026-09-01 --to 2026-09-07

# Existing report does not fit: inspect the relevant table, then adapt SQL.
b2c cip tables --pattern "ccdw_aggr_sales%"
b2c cip describe ccdw_aggr_sales_summary
b2c cip report sales-analytics --site-id Sites-Example-Site --from 2026-09-01 --to 2026-09-07 --sql

# Execute a reviewed query; CLI replaces <FROM>/<TO> date placeholders.
b2c cip query --file ./query.sql --from 2026-09-01 --to 2026-09-07 --format csv > sales.csv
```

Raw SQL also accepts a positional query or stdin. MCP SQL must contain literal
dates; placeholder substitution is a CLI feature. Preserve exit status/errors
when redirecting output. `--format table|csv|json` controls report/query output;
`--json` uses the CLI's standard JSON envelope.

## Select technical reports

| Question | Report / constraint |
| --- | --- |
| Slow SCAPI endpoints | `scapi-latency-distribution`; histogram buckets describe a distribution, not exact percentiles |
| HTTP failures | `scapi-error-rate-by-status --status-class 5xx` |
| Cache effectiveness | `scapi-cache-hit-ratio` |
| Integration client usage | `ocapi-client-usage` |
| SFRA controllers | `controller-health-scorecard`, `controller-error-rate-trend`; site required |

SCAPI traffic can be headless or unassigned. Omit optional site filters only for
an intended all-site analysis; explain scope. Discover exact parameters with
`--describe` instead of inventing flags. All examples require a chosen date window.

## Query and interpret

Filter dates/sites and select needed columns; LIMIT alone does not bound database
work. Prefer aggregate tables over fact joins. Use summed revenue / summed orders
for period AOV, not daily averages. Preserve null ratios, missing dates, currency,
timezone, and coverage limits. Latest event date is not ingestion freshness.

Safety Mode applies; CIP uses POST even for SELECT/metadata. Do not bypass a
block. For 401/403, check credentials, role, and tenant filter without inferring
that every denial is a missing role. For quota/timeouts, narrow the window or
query; no retry loops. Official
[access and service limits](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/jdbc_access_guide.html).

## Conditional references

Read a matching section only when the task needs it:

- Sales comparisons, gaps, latest activity: [SALES_ANALYSIS.md](references/SALES_ANALYSIS.md).
- Custom SQL patterns: [STARTER_QUERIES.md](references/STARTER_QUERIES.md).
- Unknown table family: [KNOWN_TABLES.md](references/KNOWN_TABLES.md), then live metadata.
- CLI options: [command reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/cip).

Stop once the requested result and material limitations are established.
