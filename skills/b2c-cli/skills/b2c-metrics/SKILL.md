---
name: b2c-metrics
description: Query observability metrics from SCAPI Metrics API (CLOSED BETA). Use this skill whenever the user needs request volume, latency distributions, error rates, cache performance, or technical health indicators for SCAPI, OCAPI, MRT, SFRA controllers, or overall system performance. Also use when they want to monitor third-party integrations, sales metrics, or eCDN performance -- even if they just say 'show me SCAPI metrics', 'what is my error rate', or 'check API performance'.
---

# B2C Metrics Skill

::: danger CLOSED BETA
The Metrics API is a closed beta feature. It must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.
:::

Use the `b2c metrics` commands to query observability metrics from the SCAPI Metrics API (`observability/metrics/v1`). This provides time-series metrics data for monitoring and analyzing Commerce Cloud technical performance.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli`.

## Command Structure

```text
metrics
├── list                          - list available metric categories
└── get <category>                - fetch metrics for a category
    ├── Categories:
    │   ├── overall                - system-wide aggregate metrics
    │   ├── sales                  - sales transaction metrics
    │   ├── ecdn                   - edge CDN performance
    │   ├── third-party            - third-party service integrations
    │   ├── scapi                  - SCAPI request volume/latency/errors/cache
    │   ├── scapi-hooks            - SCAPI hook execution metrics
    │   ├── mrt                    - Managed Runtime (PWA Kit) metrics
    │   ├── controller             - SFRA controller performance
    │   └── ocapi                  - OCAPI request metrics
    └── Flags:
        ├── --since / --until      - time window (relative "5m"/"1h"/"2d" or ISO 8601)
        ├── --third-party-service-id - filter third-party category
        ├── --api-family / --api-name - filter SCAPI category
        └── --ocapi-category / --ocapi-api - filter OCAPI category
```

## Configuration

Values like `tenantId`, `shortCode`, `clientId`, and `clientSecret` resolve from `dw.json` / `SFCC_*` env vars / the active instance / configuration plugins. Examples below show minimal usage; **add flags only to override configured values** — passing `--client-id`/`--client-secret`/`--tenant-id`/`--short-code` is usually unnecessary. If a required value is missing, the CLI emits an actionable error pointing at the flag, env var, and config key.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (`--json` for scripting, `--unmask` to reveal secrets). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

Relevant overrides:

- `--tenant-id` (alias `--tenant`) / `SFCC_TENANT_ID` / `tenantId`
- `--short-code` / `SFCC_SHORTCODE` / `shortCode`
- `--client-id` / `SFCC_CLIENT_ID` / `clientId`
- `--client-secret` / `SFCC_CLIENT_SECRET` / `clientSecret`

## Requirements

- OAuth client credentials (Metrics API uses client credentials only; `--user-auth` is not supported)
- API client has `Salesforce Commerce API` role with tenant filter for your instance
- OAuth scope `sfcc.metrics` (automatically requested by the CLI)

::: danger CLOSED BETA
The Metrics API is a closed beta feature. It must be enabled for your organization before use.
:::

## Quick Workflow

1. List available categories (`b2c metrics list`)
2. Fetch metrics for a category (`b2c metrics get <category>`)
3. Filter by time range (`--since`/`--until` — relative like `1h`/`7d` or ISO 8601) or category-specific filters

## Metric Categories

| Category      | Description                               | Filters                           |
| ------------- | ----------------------------------------- | --------------------------------- |
| `overall`     | System-wide aggregate metrics             | None                              |
| `sales`       | Sales transaction metrics                 | None                              |
| `ecdn`        | Edge CDN performance                      | None                              |
| `third-party` | Third-party service integrations          | `--third-party-service-id`        |
| `scapi`       | SCAPI request volume/latency/errors/cache | `--api-family`, `--api-name`      |
| `scapi-hooks` | SCAPI hook execution metrics              | None                              |
| `mrt`         | Managed Runtime (PWA Kit) metrics         | None                              |
| `controller`  | SFRA controller performance               | None                              |
| `ocapi`       | OCAPI request metrics                     | `--ocapi-category`, `--ocapi-api` |

## Discovery Examples

```bash
# List all categories (uses configured tenant)
b2c metrics list

# List as JSON
b2c metrics list --json

# Target a different tenant than the active config
b2c metrics list --tenant-id zzxy_prd
```

## Fetch Metrics Examples

```bash
# Get overall metrics
b2c metrics get overall

# Get SCAPI metrics for the last hour
b2c metrics get scapi --since 1h

# Get SCAPI metrics filtered by API family
b2c metrics get scapi --api-family product

# Get SCAPI metrics for a specific API
b2c metrics get scapi --api-family product --api-name shopper-products

# Get third-party metrics for a specific service
b2c metrics get third-party --third-party-service-id my-integration

# Get OCAPI metrics filtered by category and API
b2c metrics get ocapi --ocapi-category shop --ocapi-api baskets

# Get controller metrics for the last 7 days
b2c metrics get controller --since 7d

# Output as JSON
b2c metrics get overall --json
```

## Time Windows

Use `--since` (start) and `--until` (end) to specify a time range. Both accept the same values as `b2c logs get --since`: a **relative** duration (`5m`, `1h`, `2d`) or an **ISO 8601** timestamp. `--until` defaults to now.

```bash
# Last 24 hours
b2c metrics get sales --since 1d

# Explicit ISO 8601 window
b2c metrics get sales --since "2026-01-25T00:00:00" --until "2026-02-01T00:00:00"
```

If omitted, the API returns the default time window (typically recent data). The CLI converts your input to the API's epoch-seconds wire format automatically.

## Response Format

Metrics responses contain an array of metrics. Each metric includes:

- **metricId**: Unique identifier (e.g., `requests_total`)
- **title**: Human-readable title
- **description**: What the metric measures
- **unit**: Unit of measurement (e.g., `requests`, `ms`, `%`); may be empty
- **dataSeries**: Array of data series, each containing:
  - **id**: Series identifier
  - **name**: Series name (e.g., `2xx`, `4xx`, `5xx` for HTTP status codes)
  - **data**: Array of timestamped values:
    - **timestamp**: Epoch milliseconds (the CLI normalizes from the API's epoch-seconds wire format)
    - **value**: Numeric value

Example response structure:

```json
{
  "data": [
    {
      "metricId": "requests_total",
      "title": "Total Requests",
      "description": "Total number of requests",
      "unit": "requests",
      "dataSeries": [
        {
          "id": "2xx",
          "name": "2xx",
          "data": [
            {"timestamp": 1704067200000, "value": 1500},
            {"timestamp": 1704070800000, "value": 1620}
          ]
        }
      ]
    }
  ]
}
```

## SDK Usage

The Metrics API is also available via the SDK:

```typescript
import {createMetricsClient} from '@salesforce/b2c-tooling-sdk/clients';
import {getScapiMetrics, getOverallMetrics} from '@salesforce/b2c-tooling-sdk';

// Create client
const client = createMetricsClient(
  {
    shortCode: 'kv7kzm78',
    tenantId: 'zzxy_prd',
  },
  {clientId: 'xxx', clientSecret: 'xxx'},
);

// Get overall metrics for the last 24 hours.
// `from`/`to` accept a Date or epoch milliseconds; the SDK converts to
// the API's epoch-seconds wire format.
const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const overallMetrics = await getOverallMetrics(client, 'zzxy_prd', {
  from: dayAgo,
});

// Get SCAPI metrics with filters
const scapiMetrics = await getScapiMetrics(client, 'zzxy_prd', {
  from: dayAgo,
  apiFamily: 'product',
  apiName: 'shopper-products',
});
```

Available operations: `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, `getMetricsByCategory`.

All operations accept `(client, tenantId, options?)` and return `Promise<MetricsDataResponse>`. Time-window `from`/`to` accept a `Date` or epoch **milliseconds** (converted to the API's epoch-seconds wire format); response data-point timestamps come back in epoch **milliseconds**. The tenant ID may be bare (e.g., `zzxy_prd`) or prefixed (e.g., `f_ecom_zzxy_prd`) — the SDK normalizes it automatically.

## Troubleshooting

- **`tenant-id is required`**: set `--tenant-id` (or `SFCC_TENANT_ID`)
- **Auth method error**: Metrics API supports client credentials only; remove `--user-auth`
- **403/unauthorized**: verify API client role and tenant filter include target instance
- **404/category not enabled**: the category may not be enabled for your organization (closed beta)
- **503/temporarily unavailable**: metrics service may be temporarily unavailable

For full command reference, use `b2c metrics --help` and see [CLI docs](/cli/metrics) and [Metrics Guide](/guide/metrics).
