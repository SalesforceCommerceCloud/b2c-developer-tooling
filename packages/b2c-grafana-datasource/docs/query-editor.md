# Query Editor Guide

Complete guide to building queries with the B2C Commerce datasources.

## Metrics Datasource Query Editor

The Metrics datasource uses a tiered filtering interface to build queries against the Metrics API.

### Query Structure

Queries are built in this order:

1. **Category** (required): Which Metrics API endpoint to call
2. **Metrics** (multi-select): Which specific metrics to display
3. **Server Filters** (category-specific): Filter at API level (reduces data transfer)
4. **Label Filters** (optional): Post-fetch filtering on enriched dimensions
5. **Group By** (optional): Controls series naming in legends
6. **Format** (dropdown): Time series (0) or Table (1)

### 1. Category Selection

Choose from 9 metric categories:

| Category | Description | Typical Metrics |
|---|---|---|
| **overall** | High-level system metrics | Total calls, errors, latency |
| **sales** | Revenue and order metrics | Orders, AOV, revenue |
| **ecdn** | Edge CDN performance | Cache hits/misses, bandwidth, status codes |
| **third-party** | External service calls | Latency, errors, timeouts by service |
| **scapi** | Shopper API performance | Calls, latency, cache by API family |
| **scapi-hooks** | Hook execution metrics | Execution time, errors by hook |
| **mrt** | Managed Runtime performance | Requests, errors, p95 latency |
| **controller** | SFRA controller metrics | Calls, latency by pipeline/controller |
| **ocapi** | Open Commerce API | Calls, errors by category/endpoint |

### 2. Metrics Multi-select

After selecting a category, the available metrics appear. Select one or more metrics to display:

- **Single metric**: Clean chart with one unit (e.g., "totalCalls" in requests/sec)
- **Multiple metrics**: Useful when metrics share units (e.g., "cacheHits" + "cacheMisses")
- **Mixed units**: Grafana handles multiple Y-axes, but legends can be noisy

**Tip**: Start with a single metric per panel for clarity.

### 3. Server Filters (Category-specific)

Filters reduce data at the API level before it reaches Grafana. Available filters depend on category:

#### SCAPI Category

- **API Family**: Filter to specific API family
  - Examples: `product`, `checkout`, `customer`, `search`
  - Leave empty to see all families
  
- **API Name**: Filter to specific API
  - Examples: `shopper-products`, `shopper-baskets`, `shopper-customers`
  - Requires API Family when used

- **API Version**: Filter to specific version (optional)
  - Example: `v1`, `v2`

#### OCAPI Category

- **OCAPI Category**: Filter to OCAPI category
  - Examples: `shop`, `data`
  
- **OCAPI API**: Filter to specific endpoint
  - Depends on category selected

#### Third-party Category

- **Service ID**: Filter to specific external service identifier
  - Examples: payment processor IDs, shipping service IDs

#### Other Categories

Most other categories have no server filters (return aggregated metrics).

### 4. Label Filters (Post-fetch)

After data is fetched, you can filter on any enriched label. Available labels vary by category:

**Common Labels**:
- `realm`: Tenant realm (e.g., `bdpx`)
- `environment`: Environment (e.g., `prd`, `stg`)
- `metricId`: The metric identifier

**Category-specific Labels**:
- **SCAPI**: `apiFamily`, `apiName`, `apiVersion`, `cacheStatus` (HIT/MISS), `statusClass` (2xx/4xx/5xx)
- **eCDN**: `host` (PoP location), `cacheStatus`, `statusClass`
- **OCAPI**: `ocapiCategory`, `ocapiApi`, `statusClass`
- **Controller**: `controller` (pipeline name)
- **Third-party**: `host` (service identifier), `exceptionType`

**Filter Syntax**:
- **Equals**: `apiFamily=product`
- **Not equals**: `apiFamily!=product`
- **Regex match**: `apiFamily=~product|checkout`
- **Multiple filters**: Add multiple rows (AND logic)

### 5. Group By

Controls how series are named and grouped in legends. Select one or more labels to group by:

- **No group-by**: Single series per metric (aggregated)
- **Single label**: One series per label value (e.g., group by `apiFamily` → separate lines for `product`, `checkout`, etc.)
- **Multiple labels**: One series per combination (e.g., group by `apiFamily,cacheStatus` → `product·HIT`, `product·MISS`, etc.)

**Series Naming**:
- Grouped values joined with `·` (e.g., `product · HIT`)
- If collision, distinguishing label auto-appended (e.g., `product (HIT)`, `product (MISS)`)
- Series with no data points in window are hidden

**Custom Legends**:
Override legend via **Panel → Standard options → Display name** with template:

```
${__field.labels.apiFamily} - ${__field.labels.cacheStatus}
```

Available keys: `metricId`, `apiFamily`, `apiName`, `statusClass`, `cacheStatus`, `host`, `ocapiCategory`, `controller`, `exceptionType`, `aggregation`, `realm`, `environment`.

### 6. Format

- **Time series (0)**: Standard time-series visualization (default)
- **Table (1)**: Tabular format showing all label columns

Most panels use Time series format.

### Example Queries

**Monitor Product API Cache Performance**:
```
Category: scapi
Metrics: cacheHitRate
Server Filters:
  - apiFamily: product
  - apiName: shopper-products
Group By: cacheStatus
```

**Track eCDN Error Rate Across All PoPs**:
```
Category: ecdn
Metrics: errorRate
Label Filters: statusClass=~5xx
Group By: host
```

**OCAPI Shop Endpoint Latency**:
```
Category: ocapi
Metrics: p95Latency
Server Filters:
  - ocapiCategory: shop
Group By: ocapiApi
```

## CIP Datasource Query Editor

The CIP datasource provides raw SQL access to the analytics warehouse using Calcite SQL dialect.

### Query Editor Interface

- **SQL Editor**: CodeMirror-based SQL editor with syntax highlighting
- **Schema Browser**: Browse available tables and columns
- **Format**: Time series vs Table
- **Time Column**: Which column contains timestamps (for time series)
- **Metric Column**: Which column contains values (for time series)
- **Fill Mode**: How to handle missing data points

### Writing SQL Queries

#### Basic Query

```sql
SELECT
  submit_date,
  COUNT(*) as order_count
FROM orders
WHERE $__timeFilter(submit_date)
GROUP BY submit_date
ORDER BY submit_date
```

#### Calcite SQL Dialect

CIP uses Apache Calcite SQL (similar to PostgreSQL with differences):

**Supported**:
- Standard SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT
- JOINs (INNER, LEFT, RIGHT, FULL)
- Subqueries and CTEs (WITH)
- Aggregations: COUNT, SUM, AVG, MIN, MAX
- String functions: UPPER, LOWER, SUBSTRING, CONCAT
- Date functions: EXTRACT, FLOOR, CEIL

**Not Supported** (compared to PostgreSQL):
- `::type` casting (use `CAST(x AS type)`)
- `INTERVAL '1 day'` (use integer arithmetic)
- Some PostgreSQL-specific functions

### Grafana Time Macros

The backend replaces macros with Calcite SQL before execution:

#### `$__timeFilter(column)`

Filters rows to Grafana's selected time range.

**Example**:
```sql
WHERE $__timeFilter(submit_date)
```

**Expands to**:
```sql
WHERE submit_date >= TIMESTAMP '2026-07-13 00:00:00'
  AND submit_date < TIMESTAMP '2026-07-14 00:00:00'
```

#### `$__timeGroup(column, interval)`

Groups timestamps into time buckets.

**Example**:
```sql
GROUP BY $__timeGroup(submit_date, 1h)
```

**Expands to**:
```sql
GROUP BY FLOOR(submit_date TO HOUR)
```

**Supported intervals**: `5m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`, `1w`

#### `$__timeGroupAlias(column, interval)`

Same as `$__timeGroup` but adds `AS "time"` alias (required for time series visualization).

**Example**:
```sql
SELECT
  $__timeGroupAlias(submit_date, 1h),
  SUM(revenue) as total_revenue
FROM orders
WHERE $__timeFilter(submit_date)
GROUP BY $__timeGroup(submit_date, 1h)
ORDER BY 1
```

**Expands to**:
```sql
SELECT
  FLOOR(submit_date TO HOUR) AS "time",
  SUM(revenue) as total_revenue
FROM orders
WHERE submit_date >= ... AND submit_date < ...
GROUP BY FLOOR(submit_date TO HOUR)
ORDER BY 1
```

#### `$__interval`

Grafana's auto-calculated interval (e.g., `5m`, `1h`). Use with `$__timeGroup`:

```sql
GROUP BY $__timeGroup(submit_date, $__interval)
```

This adapts bucket size based on dashboard time range (wider range → bigger buckets).

### Schema Browser

Click **Schema Browser** to explore available tables:

**Structure**:
```
CIP Warehouse
├── orders
│   ├── order_id (STRING)
│   ├── submit_date (TIMESTAMP)
│   ├── revenue (DECIMAL)
│   └── ...
├── products
│   ├── product_id (STRING)
│   ├── name (STRING)
│   └── ...
└── ...
```

**Usage**:
1. Browse tables and columns
2. Click table name to insert into query
3. Click column to append to SELECT clause

**Note**: Schema is live from CIP metadata (reflects current warehouse structure).

### Template Variables

Use Grafana template variables in SQL queries:

**Variable Setup** (Dashboard Settings → Variables):
```
Name: tenant
Type: Text box
Default: bdpx_prd
```

**Query with Variable**:
```sql
SELECT * FROM orders
WHERE tenant_id = '${tenant}'
```

**Variable Query** (populate from data):

In Variable settings, set **Query type** to **Query** and enter SQL:

```sql
SELECT DISTINCT site_id FROM orders ORDER BY site_id
```

This populates a dropdown with site IDs from the warehouse.

**Note**: Use read-only credentials for CIP datasource to prevent SQL injection attacks via template variables.

### Time Series vs Table Format

#### Time Series Format

Requirements:
- Must have a column named `time` (use `$__timeGroupAlias` macro)
- Must have at least one numeric value column
- Rows must be ordered by `time` ascending

**Example**:
```sql
SELECT
  $__timeGroupAlias(submit_date, $__interval),
  COUNT(*) as orders
FROM orders
WHERE $__timeFilter(submit_date)
GROUP BY $__timeGroup(submit_date, $__interval)
ORDER BY 1
```

Grafana renders this as a time-series line chart.

#### Table Format

No requirements — any SELECT result displays as a table.

**Example**:
```sql
SELECT
  site_id,
  COUNT(*) as order_count,
  SUM(revenue) as total_revenue
FROM orders
WHERE $__timeFilter(submit_date)
GROUP BY site_id
ORDER BY total_revenue DESC
LIMIT 10
```

Useful for Top-N queries, data exploration, or alerting on thresholds.

### Fill Mode

Controls how missing data points are handled in time series:

- **null**: Leave gaps (default, shows breaks in data)
- **previous**: Forward-fill (repeat last value)
- **0**: Fill with zero (useful for count metrics)

Set via **Transform → Replace missing values** in panel settings.

### Example CIP Queries

**Orders Over Time**:
```sql
SELECT
  $__timeGroupAlias(submit_date, 1h),
  COUNT(*) as orders,
  SUM(revenue) as revenue
FROM orders
WHERE $__timeFilter(submit_date)
  AND site_id = 'RefArch'
GROUP BY $__timeGroup(submit_date, 1h)
ORDER BY 1
```

**Top Products by Revenue**:
```sql
SELECT
  p.name,
  SUM(li.price * li.quantity) as revenue
FROM order_line_items li
  JOIN products p ON li.product_id = p.product_id
WHERE $__timeFilter(li.submit_date)
GROUP BY p.name
ORDER BY revenue DESC
LIMIT 10
```

**Conversion Funnel**:
```sql
SELECT
  $__timeGroupAlias(event_date, 1d) as time,
  SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as views,
  SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as adds,
  SUM(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) as checkouts
FROM events
WHERE $__timeFilter(event_date)
GROUP BY $__timeGroup(event_date, 1d)
ORDER BY 1
```

## Query Performance Tips

### Metrics Datasource

1. **Use server filters**: Reduce data at API level (apiFamily, ocapiCategory, etc.)
2. **Time range**: Metrics API retention is 30 days; queries beyond that are clamped
3. **Single metric**: Start with one metric per panel for clarity
4. **Group-by sparingly**: Too many grouped series can overwhelm visualizations

### CIP Datasource

1. **Always use `$__timeFilter`**: Don't query entire warehouse history
2. **Limit rows**: Add `LIMIT` for table queries (default max: 1000 rows)
3. **Index-aware**: CIP tables are partitioned by time; time filters are essential
4. **Aggregate**: Use `GROUP BY` to reduce cardinality
5. **Avoid SELECT ***: Name specific columns (better performance + clarity)
6. **Use variable queries**: Populate dropdowns with `DISTINCT` queries

## Troubleshooting Queries

### Metrics Datasource

**"No data" with valid query**:
- Check category has data for your tenant (try "overall" first)
- Expand time range (mock generates 1 point / 5 min)
- Remove filters (may be too restrictive)

**"Time range was clamped"**:
- Normal for queries >30 days (Metrics API retention limit)
- Adjust dashboard time range to last 30 days

**Wrong units in legend**:
- Mixed metric units → create separate panels
- Or use Grafana's multi-axis feature

### CIP Datasource

**"Syntax error near..."**:
- Verify Calcite SQL syntax (not PostgreSQL)
- Use `CAST(x AS type)`, not `x::type`
- Check macro expansion (preview in query inspector)

**"Column 'time' not found"**:
- For time series, must use `$__timeGroupAlias` (creates `time` alias)
- Or manually: `some_column AS "time"`

**Query timeout**:
- Add `$__timeFilter` (don't scan whole warehouse)
- Reduce time range
- Add `LIMIT` clause

**Empty result but data exists**:
- Check template variable values (wrong tenant/site?)
- Verify time range covers data (CIP retention varies by table)

## Next Steps

- **Configuration**: Set up datasources in [Configuration Guide](./configuration.md)
- **API Reference**: Understand CallResource endpoints in [API Reference](./api-reference.md)
- **Architecture**: Learn how queries are processed in [Architecture Guide](./architecture.md)
