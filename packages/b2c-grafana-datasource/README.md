# Salesforce B2C Commerce Datasources for Grafana

Grafana datasource plugins for B2C Commerce observability — visualize metrics and query analytics data.

## Two Datasources

This package provides two independent Grafana datasources:

### 1. B2C Commerce Metrics

Time-series metrics from the **Metrics API** (CLOSED BETA):

- **9 Metric Categories**: Overall, Sales, eCDN, Third-party, SCAPI, SCAPI Hooks, MRT, Controller, OCAPI
- **Auto-enriched Labels**: Realm, environment, API family, host, cache status, status class
- **30-day Retention**: Automatic time range clamping
- **OAuth2 Authentication**: Client credentials flow with token caching

**Plugin ID**: `salesforce-b2c-metrics-datasource`

### 2. B2C Commerce Intelligence (CIP)

Raw SQL queries against the **CIP analytics warehouse**:

- **Calcite SQL Dialect**: Standard SQL with Grafana time macros
- **Schema Browser**: Explore tables and columns
- **Time Macros**: `$__timeFilter`, `$__timeGroup`, `$__interval`
- **13-month Retention**: Typical for fact tables (varies by table)

**Plugin ID**: `salesforce-b2c-cip-datasource`

Both datasources use OAuth2 client credentials and support multi-tenant configurations.

## Quick Start

Get started in 5 minutes with Docker:

```bash
# Demo mode (mock data, no credentials required)
make demo

# Open http://localhost:3000 (no login)
# Dashboard pre-configured with sample visualizations

# Real mode (connect to live B2C tenant via b2c CLI)
make real INSTANCE=bdpx-prd
```

See [Quick Start Guide](./docs/quickstart.md) for details.

## Prerequisites

- **Grafana**: 9.0 or later
- **B2C Commerce**: API credentials with appropriate scopes:
  - Metrics: `sfcc.metrics` scope (CLOSED BETA access required)
  - CIP: CIP query scope

## Installation

### From Source

```bash
# Build both datasource binaries
cd packages/b2c-grafana-datasource
go mod tidy
go build -o dist/gpx_b2c_metrics ./pkg
go build -o dist/gpx_b2c_cip ./pkg/cip

# Or use npm scripts
npm run build:backend        # Builds both binaries
```

### Install to Grafana

```bash
# Copy plugin to Grafana plugins directory
cp -r . /var/lib/grafana/plugins/b2c-commerce-grafana/

# Restart Grafana
sudo systemctl restart grafana-server
```

### Allow Unsigned Plugins

Both plugins are currently unsigned. Add to `grafana.ini`:

```ini
[plugins]
allow_loading_unsigned_plugins = salesforce-b2c-metrics-datasource,salesforce-b2c-cip-datasource
```

See [Quick Start Guide](./docs/quickstart.md) for Docker-based setup.

## Documentation

- **[Quick Start](./docs/quickstart.md)**: 5-minute Docker setup (demo + real mode)
- **[Configuration](./docs/configuration.md)**: Datasource settings, OAuth, multi-tenant
- **[Query Editor](./docs/query-editor.md)**: Metrics filters + CIP SQL/macros
- **[API Reference](./docs/api-reference.md)**: CallResource endpoints
- **[Architecture](./docs/architecture.md)**: Technical design + backend contract

## Example Use Cases

### Metrics Datasource

**Monitor SCAPI Product API Performance**:
- Category: `scapi`
- API Family: `product`
- Metrics: `totalCalls`, `p95Latency`, `cacheHitRate`

**Track eCDN Error Rate by PoP**:
- Category: `ecdn`
- Label Filter: `statusClass=~5xx`
- Group By: `host`

**OCAPI Shop Endpoint Latency**:
- Category: `ocapi`
- OCAPI Category: `shop`
- Metrics: `p95Latency`

### CIP Datasource

**Orders Over Time**:
```sql
SELECT
  $__timeGroupAlias(submit_date, 1h),
  COUNT(*) as orders,
  SUM(revenue) as revenue
FROM orders
WHERE $__timeFilter(submit_date)
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

## Development

### Build

```bash
# Backend (Go)
go build -o dist/gpx_b2c_metrics ./pkg
go build -o dist/gpx_b2c_cip ./pkg/cip

# Frontend (React + TypeScript)
npm install
npm run build

# Both
npm run build:all
```

### Test

```bash
# Go tests
go test -v ./...

# Demo environment
make demo
```

### Cross-compile

```bash
# Linux amd64
GOOS=linux GOARCH=amd64 go build -o dist/gpx_b2c_metrics_linux_amd64 ./pkg
GOOS=linux GOARCH=amd64 go build -o dist/gpx_b2c_cip_linux_amd64 ./pkg/cip

# Linux arm64
GOOS=linux GOARCH=arm64 go build -o dist/gpx_b2c_metrics_linux_arm64 ./pkg
GOOS=linux GOARCH=arm64 go build -o dist/gpx_b2c_cip_linux_arm64 ./pkg/cip
```

## Architecture

The plugins use a **Go backend + React frontend** architecture:

- **Backend**: Go binaries implementing Grafana's plugin SDK
  - Metrics: `pkg/plugin/` (hand-rolled QueryData)
  - CIP: `pkg/cip/plugin/` (uses grafana/sqlds/v4 SQL driver framework)
  - Shared SDK: `../b2c-tooling-sdk-go` (OAuth, clients, operations)

- **Frontend**: React + TypeScript query editors
  - Metrics: `src/` (tiered filters, label filters, group-by)
  - CIP: `src/cip/` (SQL editor, schema browser, macros)

Communication via JSON-RPC over HTTP/gRPC. See [Architecture Guide](./docs/architecture.md) for details.

## Related Packages

- **[b2c-tooling-sdk-go](../b2c-tooling-sdk-go/)**: Standalone Go SDK for Metrics API and CIP
- **[b2c-tooling-sdk](../b2c-tooling-sdk/)**: TypeScript SDK (CLI + MCP)
- **[b2c-cli](../b2c-cli/)**: Command-line interface
- **[b2c-dx-mcp](../b2c-dx-mcp/)**: Model Context Protocol server

## License

Copyright (c) 2025, Salesforce, Inc. Licensed under Apache-2.0.

See [license.txt](../../license.txt) in repository root.

## Support

- **Issues**: https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues
- **Documentation**: https://developer.salesforce.com/docs/commerce/commerce-api
- **B2C CLI**: Related tooling at https://github.com/SalesforceCommerceCloud/b2c-developer-tooling
