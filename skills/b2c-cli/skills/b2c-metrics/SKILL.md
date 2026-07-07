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
        ├── --from / --to / --window  - time window (relative "1h"/"7d" or ISO 8601)
        ├── --third-party-service-id  - filter third-party category
        ├── --api-family / --api-name - filter SCAPI category
        ├── --ocapi-category / --ocapi-api - filter OCAPI category
        └── --tags / --no-tags        - enrich series with structured tags (default: true)
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
3. Filter by time window (`--from`/`--to`/`--window` — relative like `1h`/`7d` or ISO 8601) or category-specific filters

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
# Get overall metrics (last 24 hours by default)
b2c metrics get overall

# Get metrics for the last hour
b2c metrics get overall --window 1h

# Get a 1-hour window from 7 days ago
b2c metrics get scapi --from 7d --window 1h

# Get metrics for a specific ISO 8601 time range
b2c metrics get scapi --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00"

# Get SCAPI metrics filtered by API family
b2c metrics get scapi --api-family product

# Get SCAPI metrics for a specific API
b2c metrics get scapi --api-family product --api-name shopper-products

# Get third-party metrics for a specific service
b2c metrics get third-party --third-party-service-id my-integration

# Get OCAPI metrics filtered by category and API
b2c metrics get ocapi --ocapi-category shop --ocapi-api baskets

# Get controller metrics for the last 6 hours
b2c metrics get controller --window 6h

# Output as JSON
b2c metrics get overall --json
```

## Time Windows

Metrics commands accept flexible time-window specifications via three flags:

- `--from` — Start bound: relative duration (`1h`, `7d` = that long ago) or ISO 8601 timestamp
- `--to` — End bound: relative duration or ISO 8601 timestamp
- `--window` (alias `--for`) — Window duration (`1h`, `30m`, `2d`)

The commands always send an explicit `from`+`to` range, defaulting to a **24-hour window**. The Metrics API pairs a request that omits `to` with its own "now" and enforces a **24-hour maximum window**, so an open-ended `--from` older than a day would always be rejected; filling the window client-side makes the behavior predictable.

**Resolution rules:**

- `--from` + `--to` → used as given (a range wider than 24h is sent as-is; the API returns its own error)
- `--from` + `--window` → end = start + window (e.g., `--from 7d --window 1h` = a 1-hour window, 7 days ago)
- `--to` + `--window` → start = end − window
- `--window` alone → the last `<window>` (end = now, start = now − window)
- `--from` alone → a 24-hour window forward from it: end = min(start + 24h, now)
- `--to` alone → a 24-hour window back from it: start = end − 24h
- Nothing → the last 24 hours (end = now, start = now − 24h)

You can specify at most two of the three flags.

**Examples:**

```bash
# Last hour
b2c metrics get overall --window 1h

# Last 7 days
b2c metrics get sales --window 7d

# 1-hour window starting 7 days ago
b2c metrics get scapi --from 7d --window 1h

# Specific ISO 8601 range
b2c metrics get scapi --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00"

# From 24 hours ago until now (--from alone → default 24h window, capped at now)
b2c metrics get overall --from 24h
```

**Data retention:** The Metrics API retains 30 days of data. If `--from` lands at or beyond the retention edge, the CLI adjusts it forward by a small safety margin (5 minutes) and emits a warning.

**Wire units:** Request bounds are sent to the API as epoch **seconds**; response timestamps come back as epoch **milliseconds** (JS-native)

## Series Tags

By default, the CLI enriches each data series with a structured `tags` object to make filtering and grouping easier. The Metrics API returns series identifiers that pack multiple dimensions into a single string (e.g., `bdpx.product`, `bdpx.product HIT`, `2xx bdpx.host`). The `tags` object unpacks these into discrete key-value pairs.

**Tag contents (three tiers):**

1. **Realm and environment** — always present, derived from the requested tenant/org ID (`f_ecom_bdpx_prd` → `realm=bdpx`, `environment=prd`).
2. **Per-series dimensions** — parsed from the packed series ID: `apiFamily`, `apiName`, `host`, `cacheStatus`, `statusClass`, `ocapiCategory`, `controller`, `exceptionType`, `aggregation`.
3. **Applied filters** — any category-specific filter you passed (`--api-family`, etc.) is folded in authoritatively, overriding heuristic guesses.

**Example:**

- `scapi cacheHitRate` series `bdpx.product HIT` → `{"realm":"bdpx","environment":"prd","apiFamily":"product","cacheStatus":"HIT"}`

**Disabling tags:**

Pass `--no-tags` to disable enrichment and return the raw API shape (no `tags` key on series).

**Important framing:**

Tag parsing is a **client-side, best-effort bridge** over the API's current packed-string format. The `realm`/`environment` and applied-filter tiers are always reliable; the string-parsed dimensions are heuristic.

## Response Format

Metrics responses contain an array of metrics. Each metric includes:

- **metricId**: Unique identifier (e.g., `requests_total`)
- **title**: Human-readable title
- **description**: What the metric measures
- **unit**: Unit of measurement (e.g., `requests`, `ms`, `%`); may be empty
- **dataSeries**: Array of data series, each containing:
  - **id**: Series identifier
  - **name**: Series name (e.g., `2xx`, `4xx`, `5xx` for HTTP status codes)
  - **tags**: Structured dimension tags (enabled by default)
  - **data**: Array of timestamped values:
    - **timestamp**: Epoch milliseconds (the CLI normalizes from the API's epoch-seconds wire format)
    - **value**: Numeric value

With `--json`, the response is wrapped as `{query, data}` where `query` echoes the resolved time bounds and filters:

```json
{
  "query": {
    "category": "overall",
    "from": "2026-01-25T10:00:00.000Z",
    "to": "2026-01-25T11:00:00.000Z",
    "fromEpochSeconds": 1737802800,
    "toEpochSeconds": 1737806400
  },
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
          "tags": {
            "realm": "bdpx",
            "environment": "prd",
            "statusClass": "2xx"
          },
          "data": [
            {"timestamp": 1737802800000, "value": 1500},
            {"timestamp": 1737803400000, "value": 1620}
          ]
        }
      ]
    }
  ]
}
```

The `query` object always includes both `from`/`to` (and `fromEpochSeconds`/`toEpochSeconds`). When a bound was derived from the 24-hour default window (e.g. `--from` alone, or no time flags), `query.defaultedWindow` is `true`; when `--from` was clamped forward off the retention edge, `query.clampedFrom` is `true`.

## SDK Usage

The Metrics API is also available via the SDK:

```typescript
import {createMetricsClient} from '@salesforce/b2c-tooling-sdk/clients';
import {getScapiMetrics, getOverallMetrics, resolveMetricsWindow} from '@salesforce/b2c-tooling-sdk';

// Create client
const client = createMetricsClient(
  {
    shortCode: 'kv7kzm78',
    tenantId: 'zzxy_prd',
  },
  {clientId: 'xxx', clientSecret: 'xxx'},
);

// Get overall metrics
// `from`/`to` accept a Date or epoch milliseconds; the SDK converts to
// the API's epoch-seconds wire format.
const overallMetrics = await getOverallMetrics(client, 'zzxy_prd', {
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  to: new Date(),
});

// Get SCAPI metrics with filters
const scapiMetrics = await getScapiMetrics(client, 'zzxy_prd', {
  from: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  apiFamily: 'product',
  apiName: 'shopper-products',
});

// Use resolveMetricsWindow to handle from/to/window resolution
const window = resolveMetricsWindow({from: '7d', window: '1h'});
const historicalMetrics = await getScapiMetrics(client, 'zzxy_prd', {
  from: window.from,
  to: window.to,
  apiFamily: 'product',
});
```

Available operations: `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, `getMetricsByCategory`.

Available helpers: `resolveMetricsWindow({from, to, window})`, `parseMetricsBound(value)`, `enrichMetricsTags(response, category, context)`, `parseSeriesTags({category, metricId, seriesId, context})`.

All operations accept `(client, tenantId, options?)` and return `Promise<MetricsDataResponse>`. Time-window `from`/`to` accept a `Date` or epoch **milliseconds** (converted to the API's epoch-seconds wire format); response data-point timestamps come back in epoch **milliseconds**. The tenant ID may be bare (e.g., `zzxy_prd`) or prefixed (e.g., `f_ecom_zzxy_prd`) — the SDK normalizes it automatically.

## Troubleshooting

- **`tenant-id is required`**: set `--tenant-id` (or `SFCC_TENANT_ID`)
- **Auth method error**: Metrics API supports client credentials only; remove `--user-auth`
- **403/unauthorized**: verify API client role and tenant filter include target instance
- **404/category not enabled**: the category may not be enabled for your organization (closed beta)
- **503/temporarily unavailable**: metrics service may be temporarily unavailable

For full command reference, use `b2c metrics --help` and see [CLI docs](/cli/metrics) and [Metrics Guide](/guide/metrics).
