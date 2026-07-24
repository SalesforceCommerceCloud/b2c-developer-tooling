# API Reference

Reference for CallResource endpoints exposed by the B2C Commerce datasources.

## Overview

Grafana datasource plugins expose HTTP resource endpoints via the `CallResource` mechanism. These endpoints are used by the frontend (query editor, variable editor) to fetch dynamic data like available categories, filters, schema metadata, etc.

**Base URL**: `/api/datasources/proxy/uid/{datasource-uid}/`

## Metrics Datasource Endpoints

### GET /categories

Returns the list of available metric categories for dropdowns and template variables.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-metrics-prod/categories
```

**Response** (200 OK):
```json
[
  {"label": "Overall", "value": "overall"},
  {"label": "Sales", "value": "sales"},
  {"label": "eCDN", "value": "ecdn"},
  {"label": "Third-party", "value": "third-party"},
  {"label": "SCAPI", "value": "scapi"},
  {"label": "SCAPI Hooks", "value": "scapi-hooks"},
  {"label": "MRT", "value": "mrt"},
  {"label": "Controller", "value": "controller"},
  {"label": "OCAPI", "value": "ocapi"}
]
```

**Fields**:
- `label`: Human-readable category name (for UI display)
- `value`: Category identifier (used in query model)

**Notes**:
- Static list (no API call to backend services)
- Matches the 9 Metrics API endpoints

---

### GET /filters

Returns the applicable server filters for a given category.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-metrics-prod/filters?category=scapi
```

**Query Parameters**:
- `category` (required): Category identifier (e.g., `scapi`, `ocapi`, `third-party`)

**Response** (200 OK) for `category=scapi`:
```json
[
  {
    "name": "apiFamily",
    "label": "API Family",
    "placeholder": "product, checkout, etc."
  },
  {
    "name": "apiName",
    "label": "API Name",
    "placeholder": "shopper-products, etc."
  },
  {
    "name": "apiVersion",
    "label": "API Version",
    "placeholder": "v1, v2, etc."
  }
]
```

**Response** (200 OK) for `category=ocapi`:
```json
[
  {
    "name": "ocapiCategory",
    "label": "OCAPI Category",
    "placeholder": "shop, data"
  },
  {
    "name": "ocapiApi",
    "label": "OCAPI API",
    "placeholder": ""
  }
]
```

**Response** (200 OK) for `category=third-party`:
```json
[
  {
    "name": "thirdPartyServiceId",
    "label": "Service ID",
    "placeholder": "External service identifier"
  }
]
```

**Response** (200 OK) for `category=overall` (no filters):
```json
[]
```

**Fields**:
- `name`: Filter field name (used in query model)
- `label`: Human-readable label for UI
- `placeholder`: Example values for help text

**Notes**:
- Static mapping (no API call)
- Categories without server filters return empty array

---

### GET /metrics

Returns available metrics for a given category.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-metrics-prod/metrics?category=scapi
```

**Query Parameters**:
- `category` (required): Category identifier

**Response** (200 OK):
```json
[
  {"label": "Total Calls", "value": "scapi.totalCalls", "unit": "requests/sec"},
  {"label": "Cache Hit Rate", "value": "scapi.cacheHitRate", "unit": "percent"},
  {"label": "P95 Latency", "value": "scapi.p95Latency", "unit": "ms"}
]
```

**Fields**:
- `label`: Human-readable metric name
- `value`: Metric identifier (as returned by API)
- `unit`: Measurement unit (for display)

**Notes**:
- Performs a "probe" API call with 5-minute window
- Caches result for 5 minutes
- May return empty array if category has no data for this tenant

**Error Response** (500 Internal Server Error):
```json
{
  "error": "Failed to fetch metrics: 403 Forbidden"
}
```

---

### GET /label-keys

Returns available label keys for filtering and grouping.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-metrics-prod/label-keys?category=scapi
```

**Query Parameters**:
- `category` (required): Category identifier

**Response** (200 OK):
```json
[
  {"label": "API Family", "value": "apiFamily"},
  {"label": "API Name", "value": "apiName"},
  {"label": "Cache Status", "value": "cacheStatus"},
  {"label": "Status Class", "value": "statusClass"},
  {"label": "Realm", "value": "realm"},
  {"label": "Environment", "value": "environment"}
]
```

**Fields**:
- `label`: Human-readable label key name
- `value`: Label key identifier (as enriched by SDK)

**Notes**:
- Based on tag catalog (static + category-specific)
- Used for label filters and group-by dropdowns

---

### GET /label-values

Returns observed values for a given label key.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-metrics-prod/label-values?category=scapi&labelKey=apiFamily
```

**Query Parameters**:
- `category` (required): Category identifier
- `labelKey` (required): Label key to fetch values for

**Response** (200 OK):
```json
["product", "checkout", "customer", "search"]
```

**Notes**:
- Performs a "probe" API call with 5-minute window
- Extracts unique values from series labels
- Caches result for 5 minutes
- May be empty if no data in window

**Error Response** (400 Bad Request):
```json
{
  "error": "Missing required parameter: labelKey"
}
```

---

## CIP Datasource Endpoints

### GET /tables

Returns list of available tables in the CIP warehouse.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-cip-prod/tables
```

**Response** (200 OK):
```json
[
  {"name": "orders", "type": "TABLE"},
  {"name": "order_line_items", "type": "TABLE"},
  {"name": "products", "type": "TABLE"},
  {"name": "customers", "type": "TABLE"}
]
```

**Fields**:
- `name`: Table name (use in FROM clause)
- `type`: Object type (TABLE, VIEW)

**Notes**:
- Queries CIP metadata via `getTables()` JDBC metadata call
- Cached for 15 minutes
- Authenticated (requires valid OAuth token)

**Error Response** (500 Internal Server Error):
```json
{
  "error": "Failed to fetch tables: connection failed"
}
```

---

### GET /columns

Returns columns for a given table.

**Request**:
```http
GET /api/datasources/proxy/uid/b2c-cip-prod/columns?table=orders
```

**Query Parameters**:
- `table` (required): Table name

**Response** (200 OK):
```json
[
  {"name": "order_id", "type": "STRING"},
  {"name": "submit_date", "type": "TIMESTAMP"},
  {"name": "revenue", "type": "DECIMAL"},
  {"name": "site_id", "type": "STRING"},
  {"name": "customer_id", "type": "STRING"}
]
```

**Fields**:
- `name`: Column name
- `type`: SQL data type (STRING, INTEGER, DECIMAL, TIMESTAMP, etc.)

**Notes**:
- Queries CIP metadata via `getColumns()` JDBC metadata call
- Cached for 15 minutes per table
- Used by schema browser

**Error Response** (400 Bad Request):
```json
{
  "error": "Missing required parameter: table"
}
```

---

### POST /query-preview

Validates a SQL query without executing it (dry-run).

**Request**:
```http
POST /api/datasources/proxy/uid/b2c-cip-prod/query-preview
Content-Type: application/json

{
  "query": "SELECT COUNT(*) FROM orders WHERE $__timeFilter(submit_date)"
}
```

**Response** (200 OK):
```json
{
  "valid": true,
  "expandedQuery": "SELECT COUNT(*) FROM orders WHERE submit_date >= TIMESTAMP '2026-07-13 00:00:00' AND submit_date < TIMESTAMP '2026-07-14 00:00:00'"
}
```

**Response** (200 OK with errors):
```json
{
  "valid": false,
  "error": "Syntax error: unexpected token 'FRUM' at line 1, column 14"
}
```

**Fields**:
- `valid`: Whether query passes syntax validation
- `expandedQuery`: Query with macros expanded (if valid)
- `error`: Error message (if invalid)

**Notes**:
- Expands Grafana macros (`$__timeFilter`, etc.)
- Does NOT execute query (no data returned)
- Useful for query editor validation

---

## Common HTTP Status Codes

### Success Codes

- **200 OK**: Request succeeded, response body contains data
- **204 No Content**: Request succeeded, no response body

### Client Error Codes

- **400 Bad Request**: Missing or invalid query parameters
- **401 Unauthorized**: OAuth token missing or invalid (should not reach frontend — datasource not configured)
- **403 Forbidden**: OAuth token lacks required scopes
- **404 Not Found**: Resource not found (wrong endpoint)

### Server Error Codes

- **500 Internal Server Error**: Backend error (API call failed, parsing error, etc.)
- **503 Service Unavailable**: Downstream service (Metrics API, CIP) unavailable

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

The `error` field contains a user-friendly message (safe to display in UI).

## Authentication

All CallResource requests are authenticated via the datasource's configured OAuth credentials:

1. Grafana includes datasource settings (client ID/secret) in backend context
2. Backend acquires OAuth token (cached, auto-refreshed)
3. Backend calls downstream API (Metrics API, CIP) with token
4. Backend returns response to frontend

Frontend never handles credentials directly.

## Rate Limiting

**Current behavior** (as of v0.1.0):
- No rate limiting on CallResource endpoints
- Discovery endpoints (`/metrics`, `/label-values`, `/tables`, `/columns`) can amplify API calls
- Future versions will add caching, singleflight, and backoff

**Best practices**:
- Don't poll CallResource endpoints in tight loops
- Rely on backend caching (5–15 minute TTLs)
- Implement debouncing in frontend (e.g., 300ms delay after typing)

## Caching Behavior

### Metrics Datasource

| Endpoint | Cache Duration | Cache Key |
|---|---|---|
| `/categories` | N/A (static) | N/A |
| `/filters` | N/A (static) | N/A |
| `/metrics` | 5 minutes | `category` |
| `/label-keys` | N/A (static per category) | N/A |
| `/label-values` | 5 minutes | `category:labelKey` |

### CIP Datasource

| Endpoint | Cache Duration | Cache Key |
|---|---|---|
| `/tables` | 15 minutes | `datasource-uid` |
| `/columns` | 15 minutes | `datasource-uid:table` |
| `/query-preview` | None (always validates) | N/A |

Cache is in-memory (per plugin instance). Restarting Grafana clears cache.

## Debugging CallResource Requests

### Via Browser DevTools

1. Open Grafana in browser
2. Open DevTools → Network tab
3. Filter by `datasources/proxy`
4. Inspect request/response

**Example**:
```
Request URL: http://localhost:3000/api/datasources/proxy/uid/b2c-metrics-demo/categories
Status: 200 OK
Response: [{"label":"Overall","value":"overall"},...]
```

### Via Grafana Logs

Backend logs CallResource requests at debug level:

```bash
docker compose logs -f grafana | grep CallResource
```

**Example log**:
```
level=debug msg="CallResource request" path=/categories datasource=b2c-metrics-demo
level=debug msg="CallResource response" path=/categories status=200 duration=2ms
```

## Next Steps

- **Query Editor**: Use these endpoints in [Query Editor Guide](./query-editor.md)
- **Architecture**: Understand request flow in [Architecture Guide](./architecture.md)
