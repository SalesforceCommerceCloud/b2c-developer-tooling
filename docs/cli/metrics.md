---
description: Commands for querying observability metrics from SCAPI Metrics API.
---

# Metrics Commands

::: danger CLOSED BETA
The Metrics API is a closed beta feature. It must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.
:::

Use `b2c metrics` commands to query observability metrics from the SCAPI Metrics API (`observability/metrics/v1`).

## Command Overview

| Command                      | Description                           |
| ---------------------------- | ------------------------------------- |
| `b2c metrics list`           | List available metric categories      |
| `b2c metrics get <category>` | Fetch metrics for a specific category |

## Global Metrics Flags

These flags are available on all metrics commands.

### Tenant Flags

| Flag           | Environment Variable | Description          |
| -------------- | -------------------- | -------------------- |
| `--tenant-id`  | `SFCC_TENANT_ID`     | (Required) Tenant ID |
| `--short-code` | `SFCC_SHORTCODE`     | SCAPI short code     |

### Authentication Flags

| Flag                     | Environment Variable        | Description                                                                                          |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--client-id`            | `SFCC_CLIENT_ID`            | Client ID for OAuth                                                                                  |
| `--client-secret`        | `SFCC_CLIENT_SECRET`        | Client Secret for OAuth                                                                              |
| `--auth-scope`           | `SFCC_OAUTH_SCOPES`         | OAuth scopes to request (comma-separated, repeatable)                                                |
| `--auth-methods`         | `SFCC_AUTH_METHODS`         | Allowed auth methods in priority order (`client-credentials`, `jwt`, `implicit`, `basic`, `api-key`) |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname for OAuth (default: `account.demandware.com`)                               |
| `--jwt-cert`             | `SFCC_JWT_CERT`             | Path to JWT certificate file (`cert.pem`) for JWT Bearer authentication                              |
| `--jwt-key`              | `SFCC_JWT_KEY`              | Path to JWT private key file (`key.pem`) for JWT Bearer authentication                               |
| `--jwt-passphrase`       | `SFCC_JWT_PASSPHRASE`       | Passphrase for encrypted JWT private key                                                             |

### Common Flags

| Flag                  | Environment Variable     | Description                                                                 |
| --------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `--config`            | `SFCC_CONFIG`            | Path to config file (in `dw.json` format; defaults to `./dw.json`)          |
| `-i`, `--instance`    | `SFCC_INSTANCE`          | Instance name from configuration file (e.g. `dw.json`)                      |
| `--project-directory` | `SFCC_PROJECT_DIRECTORY` | Project directory                                                           |
| `-L`, `--lang`        |                          | Language for messages (e.g., `en`, `de`). Also respects `LANGUAGE` env var  |
| `--log-level`         | `SFCC_LOG_LEVEL`         | Set logging verbosity (`trace`, `debug`, `info`, `warn`, `error`, `silent`) |
| `-D`, `--debug`       | `SFCC_DEBUG`             | Enable debug logging (shorthand for `--log-level debug`)                    |
| `--extra-query`       | `SFCC_EXTRA_QUERY`       | Extra query parameters as JSON (e.g., `'{"debug":"true"}'`)                 |
| `--extra-body`        | `SFCC_EXTRA_BODY`        | Extra body fields to merge as JSON (e.g., `'{"_internal":true}'`)           |
| `--extra-headers`     | `SFCC_EXTRA_HEADERS`     | Extra HTTP headers as JSON (e.g., `'{"X-Custom-Header": "value"}'`)         |

### Output Flags

| Flag      | Environment Variable | Description                       |
| --------- | -------------------- | --------------------------------- |
| `--json`  |                      | Output result as JSON             |
| `--jsonl` | `SFCC_JSON_LOGS`     | Output log messages as JSON lines |

## Authentication

Metrics commands require OAuth client credentials.

### Required Scopes

The following scopes are automatically requested by the CLI:

| Scope                                 | Description                  |
| ------------------------------------- | ---------------------------- |
| `sfcc.metrics`                        | Access to Metrics API        |
| `SALESFORCE_COMMERCE_API:<tenant_id>` | Tenant-specific access scope |

### Configuration

```bash
# Set credentials via environment variables
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# Or provide via flags
b2c metrics list --client-id xxx --client-secret xxx --tenant-id zzxy_prd
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication).

---

## b2c metrics list

List available metric categories with descriptions.

### Usage

```bash
b2c metrics list [flags]
```

### Flags

| Flag               | Description                                | Default |
| ------------------ | ------------------------------------------ | ------- |
| `--tenant-id`      | (Required) Tenant ID                       |         |
| `--short-code`     | SCAPI short code                           |         |
| `--columns`, `-c`  | Columns to display (comma-separated)       |         |
| `--extended`, `-x` | Show all columns including extended fields | `false` |
| `--json`           | Output results as JSON                     | `false` |

### Available Categories

The nine metric categories are:

| Category      | Description                                            |
| ------------- | ------------------------------------------------------ |
| `overall`     | System-wide aggregate metrics                          |
| `sales`       | Sales transaction metrics                              |
| `ecdn`        | Edge CDN performance metrics                           |
| `third-party` | Third-party service integration metrics                |
| `scapi`       | SCAPI request volume, latency, errors, cache hit ratio |
| `scapi-hooks` | SCAPI hook execution metrics                           |
| `mrt`         | Managed Runtime (PWA Kit) metrics                      |
| `controller`  | SFRA controller performance metrics                    |
| `ocapi`       | OCAPI request metrics                                  |

### Examples

```bash
# List all categories
b2c metrics list --tenant-id zzxy_prd

# Output as JSON
b2c metrics list --tenant-id zzxy_prd --json
```

### Output

Default table output:

```
Metric Categories:

Category      Description
─────────────────────────────────────────────────────
overall       System-wide aggregate metrics
sales         Sales transaction metrics
ecdn          Edge CDN performance metrics
third-party   Third-party service integration metrics
scapi         SCAPI request metrics
scapi-hooks   SCAPI hook execution metrics
mrt           Managed Runtime (PWA Kit) metrics
controller    SFRA controller performance metrics
ocapi         OCAPI request metrics
```

---

## b2c metrics get

Fetch metrics for a specific category with optional time range and category-specific filters.

### Usage

```bash
b2c metrics get <category> [flags]
```

### Arguments

| Argument   | Description                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `category` | Metric category: `overall`, `sales`, `ecdn`, `third-party`, `scapi`, `scapi-hooks`, `mrt`, `controller`, `ocapi` |

### Flags

| Flag                       | Description                                                  | Default |
| -------------------------- | ------------------------------------------------------------ | ------- |
| `--tenant-id`              | (Required) Tenant ID                                         |         |
| `--short-code`             | SCAPI short code                                             |         |
| `--from`                   | Start bound: relative (`1h`, `7d` ago) or ISO 8601 timestamp |         |
| `--to`                     | End bound: relative or ISO 8601 timestamp                    |         |
| `--window` / `--for`       | Window duration (`1h`, `30m`, `2d`)                          |         |
| `--third-party-service-id` | Filter by third-party service ID (third-party category only) |         |
| `--api-family`             | Filter by SCAPI API family (scapi category only)             |         |
| `--api-name`               | Filter by SCAPI API name (scapi category only)               |         |
| `--ocapi-category`         | Filter by OCAPI category (ocapi category only)               |         |
| `--ocapi-api`              | Filter by OCAPI API (ocapi category only)                    |         |
| `--json`                   | Output results as JSON (wrapped as `{query, data}`)          | `false` |

### Time Windows

Metrics commands accept flexible time-window specifications via three flags:

- `--from` — Start bound: relative duration (`1h`, `7d` = that long ago) or ISO 8601 timestamp
- `--to` — End bound: relative duration or ISO 8601 timestamp
- `--window` (alias `--for`) — Window duration (`1h`, `30m`, `2d`)

The commands always send an explicit `from`+`to` range, defaulting to a **24-hour window**. The Metrics API pairs a request that omits `to` with its own "now" and enforces a **24-hour maximum window**, so an open-ended `--from` older than a day would always be rejected; filling the window client-side makes the behavior predictable.

**Resolution rules:**

- `--from` + `--to` → used as given (a range wider than 24h is sent as-is; the API returns its own error)
- `--from` + `--window` → end = start + window
- `--to` + `--window` → start = end − window
- `--window` alone → the last `<window>` (end = now, start = now − window)
- `--from` alone → a 24-hour window forward from it: end = min(start + 24h, now)
- `--to` alone → a 24-hour window back from it: start = end − 24h
- Nothing → the last 24 hours (end = now, start = now − 24h)

You can specify at most two of the three flags. Specifying all three is an error.

**Examples:**

```bash
# Last hour
b2c metrics get overall --window 1h --tenant-id zzxy_prd

# Last 7 days
b2c metrics get sales --window 7d --tenant-id zzxy_prd

# 1-hour window starting 7 days ago
b2c metrics get scapi --from 7d --window 1h --tenant-id zzxy_prd

# Specific ISO 8601 range
b2c metrics get scapi --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00" --tenant-id zzxy_prd

# From 24 hours ago until now (--from alone → default 24h window, capped at now)
b2c metrics get overall --from 24h --tenant-id zzxy_prd
```

**Data retention:** The Metrics API retains 30 days of data. If `--from` lands at or beyond the retention edge, the CLI adjusts it forward by a small safety margin (5 minutes) to avoid rejection due to clock differences, and emits a warning showing the adjusted start time.

**Wire units:** Request bounds are sent to the API as epoch **seconds**; response data-point timestamps come back as epoch **milliseconds** (JS-native, so `new Date(point.timestamp)` works directly)

### Category-Specific Filters

**Third-party metrics:**

```bash
b2c metrics get third-party --third-party-service-id my-integration --tenant-id zzxy_prd
```

**SCAPI metrics:**

```bash
# Filter by API family
b2c metrics get scapi --api-family product --tenant-id zzxy_prd

# Filter by API family and name
b2c metrics get scapi --api-family product --api-name shopper-products --tenant-id zzxy_prd
```

**OCAPI metrics:**

```bash
# Filter by OCAPI category
b2c metrics get ocapi --ocapi-category shop --tenant-id zzxy_prd

# Filter by category and API
b2c metrics get ocapi --ocapi-category shop --ocapi-api baskets --tenant-id zzxy_prd
```

### Examples

```bash
# Get overall metrics (last 24 hours by default)
b2c metrics get overall --tenant-id zzxy_prd

# Get metrics for the last hour
b2c metrics get overall --window 1h --tenant-id zzxy_prd

# Get a 1-hour window from 7 days ago
b2c metrics get scapi --from 7d --window 1h --tenant-id zzxy_prd

# Get metrics for a specific ISO 8601 time range
b2c metrics get scapi --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00" --tenant-id zzxy_prd

# Get SCAPI metrics filtered by API family
b2c metrics get scapi --api-family product --tenant-id zzxy_prd

# Get SCAPI metrics for specific API
b2c metrics get scapi --api-family product --api-name shopper-products --tenant-id zzxy_prd

# Get third-party metrics for a specific service
b2c metrics get third-party --third-party-service-id my-service --tenant-id zzxy_prd

# Get OCAPI metrics filtered by category and API
b2c metrics get ocapi --ocapi-category shop --ocapi-api baskets --tenant-id zzxy_prd

# Output as JSON (wrapped with query echo)
b2c metrics get overall --tenant-id zzxy_prd --json
```

### Response Format

The response contains an array of metrics. Each metric includes:

- **metricId**: Unique identifier (e.g., `requests_total`)
- **title**: Human-readable title
- **description**: What the metric measures
- **unit**: Unit of measurement (e.g., `requests`, `ms`, `%`); may be empty
- **dataSeries**: Array of data series, each containing:
  - **id**: Series identifier
  - **name**: Series name (e.g., `2xx`, `4xx`, `5xx` for HTTP status codes)
  - **data**: Array of timestamped values:
    - **timestamp**: Epoch milliseconds (normalized by the CLI/SDK from the API's epoch-seconds wire format, so `new Date(timestamp)` is correct)
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

The `query` object always includes both `from`/`to` (and `fromEpochSeconds`/`toEpochSeconds`). When a bound was derived from the 24-hour default window (e.g. `--from` alone, or no time flags), `query.defaultedWindow` is `true`.

### Output

Default table output displays each metric with its data series in a readable format. Use `--json` for machine-readable output.

### Error Responses

Common error scenarios:

| Status | Description                                                              |
| ------ | ------------------------------------------------------------------------ |
| 400    | Invalid time range or filter parameters                                  |
| 401    | Authentication failed                                                    |
| 403    | Insufficient permissions (missing `sfcc.metrics` scope or tenant filter) |
| 404    | Category not enabled for your organization                               |
| 503    | Metrics service temporarily unavailable                                  |

### Notes

- Time values are sent to the API as epoch **seconds**; response data-point timestamps come back as epoch **milliseconds** (JS-native)
- The Metrics API caps a window at **24 hours** (a request that omits `to` is paired with the server's "now" against this cap) and retains **30 days** of data; both are enforced by the API
- The CLI always sends an explicit `from`+`to` range, defaulting any open bound to a 24-hour window so the behavior is predictable rather than relying on the server's implicit end. An explicit range wider than 24h is still sent as-is and the API returns its own error
- When `--from` is at the retention edge (30 days ago), the CLI clamps it forward by 5 minutes to avoid rejection due to clock skew and emits a warning
- The tenant ID may be bare (e.g., `zzxy_prd`) or prefixed (e.g., `f_ecom_zzxy_prd`) — the CLI normalizes it
- Category-specific filters only apply to their respective categories; they are ignored for other categories
- The Metrics API is a closed beta feature and must be enabled for your organization
