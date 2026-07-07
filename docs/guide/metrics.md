---
description: Query observability metrics from SCAPI Metrics API to monitor SCAPI, OCAPI, MRT, SFRA controllers, and overall system performance.
---

# Metrics

::: danger CLOSED BETA
The Metrics API is a closed beta feature. It must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.
:::

Use the `b2c metrics` commands to query observability metrics from the SCAPI Metrics API (`observability/metrics/v1`). This provides insights into request volume, latency, error rates, cache performance, and other technical health indicators across nine metric categories.

## What is the Metrics API?

The Metrics API is part of SCAPI Admin and provides time-series metrics data for monitoring and analyzing your Commerce Cloud environment. It exposes detailed performance data across:

- **Overall**: Aggregate system-wide metrics
- **Sales**: Sales transaction metrics
- **eCDN**: Edge CDN performance
- **Third-party**: Third-party service integrations
- **SCAPI**: Storefront Commerce API metrics (request volume, latency, errors, cache hit ratio)
- **SCAPI Hooks**: SCAPI hook execution metrics
- **MRT**: Managed Runtime (PWA Kit) metrics
- **Controller**: SFRA controller performance
- **OCAPI**: Open Commerce API metrics

Each metric contains one or more data series with timestamped values, allowing you to track performance trends over time.

## Authentication

Metrics commands require OAuth client credentials authentication:

| Requirement   | How to provide                            |
| ------------- | ----------------------------------------- |
| Client ID     | `--client-id` or `SFCC_CLIENT_ID`         |
| Client Secret | `--client-secret` or `SFCC_CLIENT_SECRET` |
| Short Code    | `--short-code` or `SFCC_SHORTCODE`        |
| Tenant ID     | `--tenant-id` or `SFCC_TENANT_ID`         |

Your API client must include:

- **Salesforce Commerce API** role
- The OAuth scope `sfcc.metrics` (automatically requested by the CLI)
- A tenant filter that includes your target tenant

For setup instructions, see the [Authentication Guide](/guide/authentication).

::: tip Configuration
Like other SCAPI commands, metrics commands resolve `tenantId`, `shortCode`, `clientId`, and `clientSecret` from `dw.json`, environment variables, or the active instance. You only need to pass flags to override configured values. Run `b2c setup inspect` to see your resolved configuration.
:::

## Commands

The `b2c metrics` topic provides two commands:

| Command                      | Description                           |
| ---------------------------- | ------------------------------------- |
| `b2c metrics list`           | List available metric categories      |
| `b2c metrics get <category>` | Fetch metrics for a specific category |

## Listing Metric Categories

Use `b2c metrics list` to see all available categories:

```bash
# List categories with descriptions
b2c metrics list

# Output as JSON
b2c metrics list --json
```

The nine categories are:

- `overall` — System-wide aggregate metrics
- `sales` — Sales transaction metrics
- `ecdn` — Edge CDN performance
- `third-party` — Third-party service metrics
- `scapi` — SCAPI request metrics
- `scapi-hooks` — SCAPI hook execution metrics
- `mrt` — Managed Runtime (PWA Kit) metrics
- `controller` — SFRA controller metrics
- `ocapi` — OCAPI request metrics

## Fetching Metrics

Use `b2c metrics get <category>` to retrieve metrics for a specific category:

```bash
# Get overall metrics (API default window)
b2c metrics get overall

# Get metrics for the last hour
b2c metrics get overall --window 1h

# Get a 1-hour window from 7 days ago
b2c metrics get scapi --from 7d --window 1h

# Get metrics for a specific ISO 8601 time range
b2c metrics get scapi --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00"

# Get third-party metrics for a specific service
b2c metrics get third-party --third-party-service-id my-service

# Get SCAPI metrics filtered by API family and name
b2c metrics get scapi --api-family product --api-name shopper-products

# Get OCAPI metrics filtered by category and API
b2c metrics get ocapi --ocapi-category shop --ocapi-api baskets

# Output as JSON
b2c metrics get overall --json
```

### Time Windows

Metrics commands accept flexible time-window specifications via three flags:

- `--from` — Start bound: relative duration (`1h`, `7d` = that long ago) or ISO 8601 timestamp
- `--to` — End bound: relative duration or ISO 8601 timestamp
- `--window` (alias `--for`) — Window duration (`1h`, `30m`, `2d`)

**Resolution rules:**

- `--from` + `--to` → used as given
- `--from` + `--window` → end = start + window (e.g., `--from 7d --window 1h` = a 1-hour window, 7 days ago)
- `--to` + `--window` → start = end − window
- `--window` alone → the last `<window>` (end = now, start = now − window)
- `--from` alone → only start is sent; the API applies its own forward window
- `--to` alone → only end is sent
- Nothing → no time params sent; the API applies its default window

You can specify at most two of the three flags. Specifying all three is an error.

**Examples:**

```bash
# Last hour
b2c metrics get overall --window 1h

# Last 6 hours
b2c metrics get sales --window 6h

# 1-hour window starting 7 days ago
b2c metrics get scapi --from 7d --window 1h

# Specific ISO 8601 range
b2c metrics get scapi --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00"

# From 7 days ago (API applies its forward window)
b2c metrics get overall --from 7d
```

**Data retention:** The Metrics API retains 30 days of data. If `--from` lands at or beyond the retention edge, the CLI adjusts it forward by a small safety margin (5 minutes) to avoid rejection due to clock differences, and emits a warning showing the adjusted start time.

**Wire units:** Request bounds are sent to the API as epoch **seconds**; response data-point timestamps come back as epoch **milliseconds** (JS-native, so `new Date(point.timestamp)` works directly)

### Category-Specific Filters

Some categories support additional filters:

**Third-party metrics:**

```bash
b2c metrics get third-party --third-party-service-id my-integration
```

**SCAPI metrics:**

```bash
# Filter by API family
b2c metrics get scapi --api-family product

# Filter by API family and name
b2c metrics get scapi --api-family product --api-name shopper-products
```

**OCAPI metrics:**

```bash
# Filter by OCAPI category
b2c metrics get ocapi --ocapi-category shop

# Filter by category and API
b2c metrics get ocapi --ocapi-category shop --ocapi-api baskets
```

### Response Format

Metrics responses contain an array of metrics. Each metric includes:

- **metricId**: Unique identifier (e.g., `requests_total`)
- **title**: Human-readable title
- **description**: What the metric measures
- **unit**: Unit of measurement (e.g., `requests`, `ms`, `%`); may be empty
- **dataSeries**: Array of data series, each containing:
  - **id**: Series identifier
  - **name**: Series name (e.g., `2xx`, `4xx`, `5xx` for HTTP status codes)
  - **data**: Array of timestamped values:
    - **timestamp**: Epoch milliseconds (normalized by the CLI/SDK from the API's epoch-seconds wire format, so `new Date(timestamp)` gives the correct instant)
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
          "data": [
            {"timestamp": 1737802800000, "value": 1500},
            {"timestamp": 1737803400000, "value": 1620}
          ]
        },
        {
          "id": "4xx",
          "name": "4xx",
          "data": [
            {"timestamp": 1737802800000, "value": 45},
            {"timestamp": 1737803400000, "value": 38}
          ]
        }
      ]
    }
  ]
}
```

The `query` object omits `from`/`to` fields when that bound wasn't sent to the API (e.g., when using `--from` alone, only `from`/`fromEpochSeconds` appear; the API applied its own forward window)

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
// `from`/`to` accept a Date or epoch MILLISECONDS (Date.now()-style);
// the SDK converts to the API's epoch-seconds wire format.
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
// (same logic the CLI uses)
const window = resolveMetricsWindow({from: '7d', window: '1h'});
const historicalMetrics = await getScapiMetrics(client, 'zzxy_prd', {
  from: window.from,
  to: window.to,
  apiFamily: 'product',
});

// Response timestamps are normalized to epoch milliseconds:
for (const metric of overallMetrics.data) {
  for (const series of metric.dataSeries) {
    for (const point of series.data) {
      console.log(new Date(point.timestamp).toISOString(), point.value);
    }
  }
}
```

The SDK exports:

- **Client factory**: `createMetricsClient(config, auth)`
- **Operations**: `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, `getMetricsByCategory`
- **Helpers**: `resolveMetricsWindow({from, to, window})`, `parseMetricsBound(value)`
- **Types**: `MetricsClient`, `MetricsDataResponse`, `Metric`, `MetricDataSeries`, `MetricDataPoint`, `MetricsError`

All operations accept `(client, tenantId, options?)` and return `Promise<MetricsDataResponse>`. Time-window `from`/`to` accept a `Date` or epoch **milliseconds** and are converted to the API's epoch-seconds wire format; response data-point timestamps are normalized back to epoch **milliseconds**. The tenant ID may be bare (e.g., `zzxy_prd`) or prefixed (e.g., `f_ecom_zzxy_prd`) — the SDK normalizes it automatically.

See the [SDK API Reference](/api/) for complete details.

## Common Flags

| Flag              | Environment Variable | Description                                                      |
| ----------------- | -------------------- | ---------------------------------------------------------------- |
| `--tenant-id`     | `SFCC_TENANT_ID`     | (Required) Tenant ID                                             |
| `--short-code`    | `SFCC_SHORTCODE`     | SCAPI short code                                                 |
| `--client-id`     | `SFCC_CLIENT_ID`     | OAuth client ID                                                  |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret                                              |
| `--from`          |                      | Start bound: relative (`1h`, `7d` ago) or ISO 8601               |
| `--to`            |                      | End bound: relative or ISO 8601                                  |
| `--window`        |                      | Window duration (`1h`, `30m`, `2d`); alias `--for`               |
| `--json`          |                      | Output as JSON (wrapped as `{query, data}` with resolved bounds) |

For a complete reference of all commands and flags, see [CLI: Metrics](/cli/metrics).
