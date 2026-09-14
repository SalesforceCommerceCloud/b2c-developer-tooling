---
description: Explore B2C Commerce sales, search, promotions, and technical performance with your AI assistant, IDE, or CLI.
---

# Analytics Reports (CIP/CCAC)

Understand sales trends, find searches with no results, review promotion
performance, and investigate slow or failing APIs. The toolkit connects to
**B2C Commerce Intelligence (CIP)**, also known as **Commerce Cloud Analytics (CCAC)**,
with ready-to-use reports and custom SQL analysis.

Ask your [AI assistant](#use-your-ai-assistant), explore reports in the
[IDE Extension](#vs-code-ide-integration), or export results with the
[B2C CLI](#quick-start). All three use your B2C Commerce analytics access.

::: warning Availability
Reports and dashboards are typically used with production tenants (for example, `abcd_prd`) and require Commerce Cloud Analytics (CCAC) to be enabled.
:::

## Use Your AI Assistant

Connect the [B2C MCP](/mcp/) and describe the question you want answered. Compare
sales across periods, identify merchandising opportunities, or examine API and
controller performance without writing SQL or installing a separate CLI.
For questions beyond the included reports, your assistant can explore available
analytics data and build a custom analysis.

<ExamplePrompt>

> Which search terms returned no results on my site last week? Rank them by frequency and explain what the data covers.

</ExamplePrompt>

<ExamplePrompt>

> Compare daily sales and average order value for my site over the last two complete weeks. Explain any missing days and whether there's enough data to identify a trend.

</ExamplePrompt>

Tell your assistant which instance, site, and period to use. Analytics can lag
storefront activity; a day without records does not necessarily mean zero sales.

See [MCP analytics tools](/mcp/toolsets#cip) for capabilities and limits.

## Authentication and Access

CIP requires an Account Manager API client configured for **client credentials** authentication.

Minimum requirements:

- API client with **Salesforce Commerce API** role
- role tenant filter includes your target instance (for example `abcd_prd`)
- client ID and client secret in your toolkit configuration

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

To enable non-production support, turn on **Enable Reports & Dashboards Data Tracking** in Business Manager feature switches.

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

## Use the B2C CLI {#quick-start}

### Curated reports (`cip report`)

Start by discovering and running a curated report command:

```bash
# discover available report commands
b2c cip report --help

# run a report
b2c cip report sales-analytics \
  --tenant-id abcd_prd \
  --site-id Sites-RefArch-Site \
  --from 2026-02-03 \
  --to 2026-02-04
```

Illustrative output:

```text
date        std_revenue  orders  std_aov  units  aos  std_tax  std_shipping
─────────────────────────────────────────────────────────────────────────────
2026-02-03  227.92       1       227.92   2      2    11.7     13.98
2026-02-04  227.92       1       227.92   2      2    11.4     9.99
```

To inspect or adapt a report, preview its SQL:

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

Illustrative output:

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

Start with `cip report` for common sales, search, payment, and technical questions.
Use `cip query` for custom filters, calculations, or datasets beyond those reports.

## Rate Limits and Query Discipline

CIP enforces query timeouts, quotas, and rate limits. Start with a narrow period,
request only needed fields, and prefer summary tables for large analyses.
For custom SQL, LIMIT controls returned rows; date and site filters constrain
the data being analyzed. See the official
[query limits](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/jdbc_access_guide.html).

## Site ID Parameter Note

Many curated reports use `--site-id`.

Common CIP format:

`Sites-{siteId}-Site`

The CLI warns if the value does not match that pattern, but it does not rewrite your input.

## JSON Output

For scripting and automation, use:

- `--json` for standard CLI JSON mode
- `--format json` to print JSON to stdout for query/report output paths

## Explore in Your IDE {#vs-code-ide-integration}

The B2C Commerce IDE Extension provides visual query building, ready-to-use reports, and CSV/JSON exports. Open the **Analytics** view in the activity bar to access them.

::: tip
No separate CLI installation is needed. Use your existing [toolkit configuration](/guide/configuration) or configure an analytics connection in the extension.
:::

### Available panels

- **Query Builder** — visual SELECT / FROM / WHERE / ORDER BY / LIMIT composer with a "Saved Queries" library so you can bookmark frequently-used queries per tenant. Switch to **SQL** mode for raw query editing.
- **Tables Browser** — schema explorer that lists every CIP warehouse table for the active tenant. Click a table to inspect its columns and types.
- **Curated Reports** — choose a report, select its site and dates, and explore a sortable result grid. Export results as CSV or JSON.

### Realm management

The sidebar tree groups tenants under named realms. Each realm can hold multiple connections (e.g., production + sandbox). Use the toolbar actions to:

- **Add Realm** — create a new realm group (e.g. `abcd`).
- **Configure / Edit** — set tenant ID, environment (production / staging / custom host), and run a connection test.
- **Switch Connection** — change which realm/tenant the open panels query against. All open Query Builder, Tables Browser, and Report panels follow the active connection.

### Saving queries

Inside the Query Builder, the **Save** button persists the current SQL into a workspace-scoped library, tagged with the active tenant. Saved queries appear in the **Saved Queries** dropdown — those authored against the current tenant are listed first; queries from other tenants appear dimmed below a divider so you can still recall them after switching connections.

Saved queries stay in your editor workspace; they are not committed to source control.

### Safety mode

Your [Safety Mode policy](/guide/safety) can block analytics actions or require confirmation. For analytics access and read-only policy exceptions, see [CIP access](/mcp/security#cip).

Query text and results are not collected as telemetry. See [privacy settings](/vscode-extension/configuration#verbosity-polling-telemetry) for controls.

## SDK Support

For custom analytics tooling and integrations, the TypeScript SDK exposes
[CIP queries](/api/clients/classes/CipClient) and
[report and table operations](/api/operations/cip/). These support the same
analytics workflows as the CLI, MCP, and IDE Extension.

## Next Steps

- [CIP Commands](/cli/cip) for full command reference and flags
- [Configuration](/guide/configuration) for env vars and `dw.json` settings
- [Authentication Setup](/guide/authentication) for API client role and tenant filter setup
