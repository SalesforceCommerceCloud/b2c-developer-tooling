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
# Get overall metrics
b2c metrics get overall

# Get SCAPI metrics with a time range (epoch milliseconds)
b2c metrics get scapi --from 1704067200000 --to 1704153600000

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

All `get` commands support `--from` and `--to` flags for specifying the time range:

```bash
# Specify time range in epoch milliseconds
b2c metrics get sales --from 1704067200000 --to 1704153600000
```

Both flags are optional:

- If omitted, the API returns metrics for the default time window (typically recent data)
- Values are epoch timestamps in **milliseconds** (not seconds)

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
    - **timestamp**: Epoch milliseconds
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
        },
        {
          "id": "4xx",
          "name": "4xx",
          "data": [
            {"timestamp": 1704067200000, "value": 45},
            {"timestamp": 1704070800000, "value": 38}
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

// Get overall metrics
const overallMetrics = await getOverallMetrics(client, 'zzxy_prd', {
  from: 1704067200000,
  to: 1704153600000,
});

// Get SCAPI metrics with filters
const scapiMetrics = await getScapiMetrics(client, 'zzxy_prd', {
  from: 1704067200000,
  to: 1704153600000,
  apiFamily: 'product',
  apiName: 'shopper-products',
});
```

The SDK exports:

- **Client factory**: `createMetricsClient(config, auth)`
- **Operations**: `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, `getMetricsByCategory`
- **Types**: `MetricsClient`, `MetricsDataResponse`, `Metric`, `MetricDataSeries`, `MetricDataPoint`, `MetricsError`

All operations accept `(client, tenantId, options?)` and return `Promise<MetricsDataResponse>`. The tenant ID may be bare (e.g., `zzxy_prd`) or prefixed (e.g., `f_ecom_zzxy_prd`) — the SDK normalizes it automatically.

See the [SDK API Reference](/api/) for complete details.

## Common Flags

| Flag              | Environment Variable | Description                     |
| ----------------- | -------------------- | ------------------------------- |
| `--tenant-id`     | `SFCC_TENANT_ID`     | (Required) Tenant ID            |
| `--short-code`    | `SFCC_SHORTCODE`     | SCAPI short code                |
| `--client-id`     | `SFCC_CLIENT_ID`     | OAuth client ID                 |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret             |
| `--from`          |                      | Start of time window (epoch ms) |
| `--to`            |                      | End of time window (epoch ms)   |
| `--json`          |                      | Output as JSON                  |

For a complete reference of all commands and flags, see [CLI: Metrics](/cli/metrics).
