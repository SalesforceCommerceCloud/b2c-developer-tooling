---
name: MCP CIP Analytics
description: Discover and run CIP reports or analytics SQL for sales, merchandising, and technical operations. Resolve warehouse access, bound results, and interpret site/date scope.
---

# CIP analytics

Use CIP for warehouse analytics: sales, products, promotions, search, payments,
traffic, inventory, and API/controller trends. Use SCAPI for current records;
logs/metrics for immediate diagnosis.
Read this skill once through resources or `skills_read` (`mcp/cip`), then pass
`skillRead: true` to `cip_query`. Discovery needs no acknowledgment.

## Choose and discover

1. `cip_discover` defaults to report search; use `query` for task terms, then
   `action: "report", name` for parameters, tables used, and available result notes. The catalog is offline.
2. Prefer a curated report when its dimensions/filters answer the question.
   Preview SQL with `params` only when adapting the report or checking a definition
   absent from its notes; a standard report does not need a preview before running.
3. For custom analysis, `action: "tables", query: "ccdw_aggr_%"` lists live metadata;
   `action: "table", name` returns columns. Narrow names/schema and reuse findings.
   These calls require CIP access. Columns default to 50 per page (lists: 20).
   Follow `nextOffset` only for needed columns, not to exhaust unrelated metadata.
4. `cip_query` accepts either `report` plus string-valued `params`, or `sql`.
   Do not invent parameters or use a narrower report that omits requested evidence.

## Configuration and access

Reuse `projectDirectory` / `instanceName` and resolved configuration. Requires
`tenantId`, Account Manager `clientId` and `clientSecret`; no instance hostname
or SCAPI short code is needed. Authentication is managed; do not obtain tokens.
CIP supports client credentials only, not user/SLAS/JWT flows. The client needs
the **Salesforce Commerce API** role with the selected tenant in its tenant filter;
the SDK requests `SALESFORCE_COMMERCE_API:<tenant>`.

Tenants ending `_prd` use production analytics; other tenants use staging analytics.
`staging: true` / `SFCC_CIP_STAGING=true` forces staging; configured `cipHost` /
`SFCC_CIP_HOST` takes precedence. Staging analytics is a service destination,
not permission to switch the user's target instance. Non-production data requires
Reports & Dashboards data tracking enabled on supported 26.1+ environments.
No data or rejected access does not establish zero sales or a healthy system.

Missing values: `config_inspect` with masking; ask the user if the target cannot
be determined. [MCP configuration](skill://mcp/b2c-config/SKILL.md) explains resolution.
For CLI equivalents, configuration, host selection, and availability caveats:
[existing CIP skill](skill://b2c-cli/b2c-cip/SKILL.md) (`skills_read` ID `b2c-cli/b2c-cip`)
and [analytics guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/analytics-reports-cip-ccac),
plus the [CLI reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/cip).
Read these conditionally, not as extra prerequisites. If that collection is
excluded, use `docs_read` query `cli-cip` or the guide URL.
Official [JDBC setup and limits](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/jdbc_access_guide.html).

## Query and interpret

- Fix the date window and site scope before querying. Report `from`/`to` are
  inclusive dates. Supply required dates explicitly; do not silently use this month.
- Warehouse numeric `site_id` differs from natural `nsite_id` (often
  `Sites-Example-Site`) and SCAPI site IDs. Resolve through `ccdw_dim_site`;
  do not synthesize a natural ID from a configured SCAPI site ID.
- Prefer aggregate tables and explicit columns. Filter by date/site, group and
  calculate in SQL, use stable ordering and LIMIT. Avoid wide `SELECT *`, large
  fact-table joins, and repeated exploratory full-table queries.
- `maxRows` defaults 50, maximum 500; output also caps at 24 KB. `rowCount` counts
  returned rows, never all matches. If `truncated`, narrow/aggregate or query a
  disjoint ordered window. No retained cursor; do not present a sample as a total.
- Queries time out after 60 seconds by default (maximum 120). Cancellation closes
  connections best-effort. Quota/rate/timeout errors: narrow the work; do not retry
  in a loop. Preserve SQLState/HTTP errors and any incomplete evidence.
- Warehouse freshness, reporting timezone, currency, and status definitions affect
  comparisons. Query time is not data freshness. Explain unknown freshness rather
  than treating warehouse values as live storefront truth.
- For period AOV, divide summed revenue by summed orders; never average daily AOVs.
  Zero orders means undefined AOV; missing dates mean no returned rows, not proven
  zero sales. Fix complete calendar-week boundaries in the chosen timezone.
- Safety Mode applies. CIP uses POST even for metadata and SELECT;
  READ_ONLY can block these calls. Explain the specific restriction and use only
  authorized, narrowly scoped exceptions. Skill acknowledgment is not authorization.

Read further only for an unresolved question:
- Sales gaps, period comparisons, or latest activity:
  [sales interpretation](skill://b2c-cli/b2c-cip/references/SALES_ANALYSIS.md).
- Adapting custom SQL beyond a report: read the matching section in
  [starter queries](skill://b2c-cli/b2c-cip/references/STARTER_QUERIES.md), not the whole file.
Stop when the report and evidence answer the task; no follow-up skill read is required.
For incidents, correlate trends with logs and the relevant `b2c-ops` runbook.
