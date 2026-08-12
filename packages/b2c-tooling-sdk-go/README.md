# B2C Tooling SDK for Go

Go SDK for Salesforce B2C Commerce APIs — provides typed clients for the **Metrics API** and **CIP analytics warehouse**, with OAuth2 authentication, tenant ID normalization, and structured tag extraction.

This SDK is **standalone** (no Grafana dependencies) and can be used in any Go application. It powers the [b2c-grafana-datasource](../b2c-grafana-datasource/) plugins but is designed for general-purpose use.

## Features

- **Metrics API Client**: 9 category endpoints (overall, scapi, ecdn, mrt, etc.)
- **CIP Client**: JDBC-over-Avatica connection for SQL queries
- **OAuth2 Authentication**: Client credentials flow with token caching and auto-refresh
- **Tag Enrichment**: Automatic extraction of structured labels from series IDs
- **Time Window Resolution**: 30-day retention enforcement, flexible input formats
- **Tenant ID Helpers**: Normalization and scope construction
- **Error Handling**: Typed errors with context
- **Testing**: 100% test coverage with golden test fixtures

## Installation

```bash
go get github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go
```

**Module path**: `github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go`

**Go version**: 1.26+

## Quick Start

### Metrics API Example

```go
package main

import (
    "context"
    "fmt"
    "time"
    
    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients/metrics"
)

func main() {
    // 1. Create OAuth strategy
    authClient := auth.NewOAuthStrategy(auth.OAuthConfig{
        ClientID:           "your-client-id",
        ClientSecret:       "your-client-secret",
        AccountManagerHost: auth.DefaultAccountManagerHost, // "account.demandware.com"
    })
    
    // 2. Create Metrics client
    client := metrics.NewClient(metrics.Config{
        ShortCode: "kv7kzm78",
        TenantID:  "bdpx_prd",
    }, authClient)
    
    // 3. Fetch overall metrics for last 24 hours
    ctx := context.Background()
    from := time.Now().Add(-24 * time.Hour)
    to := time.Now()
    
    resp, err := client.GetOverallMetrics(ctx, from, to, nil)
    if err != nil {
        panic(err)
    }
    
    // 4. Access metrics data
    fmt.Printf("Fetched %d metrics\n", len(resp.Data))
    for _, metric := range resp.Data {
        fmt.Printf("Metric: %s (%s)\n", metric.Title, metric.ID)
        for _, series := range metric.DataSeries {
            // Tags are automatically enriched (realm, environment, etc.)
            fmt.Printf("  Series: %s, Tags: %+v\n", series.ID, series.Tags)
            fmt.Printf("  Data points: %d\n", len(series.Data))
        }
    }
}
```

### CIP SQL Query Example

```go
package main

import (
    "context"
    "fmt"
    
    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients/cip"
)

func main() {
    // 1. Create OAuth strategy
    authClient := auth.NewOAuthStrategy(auth.OAuthConfig{
        ClientID:     "your-client-id",
        ClientSecret: "your-client-secret",
    })
    
    // 2. Create CIP client
    client, err := cip.NewClient(cip.Config{
        Host:     "https://cip-us.commercecloud.salesforce.com",
        TenantID: "bdpx_prd",
    }, authClient)
    if err != nil {
        panic(err)
    }
    defer client.Close()
    
    // 3. Execute SQL query
    ctx := context.Background()
    query := `
        SELECT site_id, COUNT(*) as order_count
        FROM orders
        WHERE submit_date >= CURRENT_DATE - INTERVAL '7' DAY
        GROUP BY site_id
        ORDER BY order_count DESC
        LIMIT 10
    `
    
    rows, err := client.Query(ctx, query)
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    
    // 4. Process results
    for rows.Next() {
        var siteID string
        var orderCount int64
        if err := rows.Scan(&siteID, &orderCount); err != nil {
            panic(err)
        }
        fmt.Printf("%s: %d orders\n", siteID, orderCount)
    }
}
```

## Package Overview

### `auth`

OAuth2 client credentials flow with token caching.

**Key Types**:
- `OAuthStrategy`: Main authentication client
- `OAuthConfig`: Configuration (client ID, secret, host)

**Features**:
- Token caching by scope (in-memory)
- Auto-refresh on expiry (401 responses)
- x-dw-client-id header injection
- Configurable Account Manager host

**Example**:
```go
authClient := auth.NewOAuthStrategy(auth.OAuthConfig{
    ClientID:     "your-client-id",
    ClientSecret: "your-client-secret",
})
```

### `clients/metrics`

Typed client for the Metrics API.

**Key Types**:
- `Client`: Metrics API client
- `Config`: Configuration (shortCode, tenantID)
- `MetricsResponse`: Structured API response

**Methods** (9 category endpoints):
- `GetOverallMetrics(ctx, from, to, filters)`
- `GetSalesMetrics(ctx, from, to, filters)`
- `GetECDNMetrics(ctx, from, to, filters)`
- `GetThirdPartyMetrics(ctx, from, to, filters)`
- `GetSCAPIMetrics(ctx, from, to, filters)`
- `GetSCAPIHooksMetrics(ctx, from, to, filters)`
- `GetMRTMetrics(ctx, from, to, filters)`
- `GetControllerMetrics(ctx, from, to, filters)`
- `GetOCAPIMetrics(ctx, from, to, filters)`

**Features**:
- Auto-adds `sfcc.metrics` + tenant scope
- Normalizes timestamps (API seconds → milliseconds)
- Enriches series with structured tags
- 30-day retention enforcement

**Example**:
```go
client := metrics.NewClient(metrics.Config{
    ShortCode: "kv7kzm78",
    TenantID:  "bdpx_prd",
}, authClient)

filters := map[string]string{"apiFamily": "product"}
resp, err := client.GetSCAPIMetrics(ctx, from, to, filters)
```

### `clients/cip`

JDBC-over-Avatica client for CIP analytics warehouse.

**Key Types**:
- `Client`: CIP connection client
- `Config`: Configuration (host, tenantID)

**Methods**:
- `Query(ctx, sql)`: Execute SQL query, returns `*sql.Rows`
- `QueryContext(ctx, sql, args...)`: Parameterized query
- `GetMetadata()`: Fetch table/column metadata
- `Close()`: Close connection

**Features**:
- Sticky session handling (required by CIP)
- Calcite SQL dialect support
- Connection pooling (session-scoped)
- DECIMAL handling (transmitted as strings)

**Example**:
```go
client, err := cip.NewClient(cip.Config{
    Host:     "https://cip-us.commercecloud.salesforce.com",
    TenantID: "bdpx_prd",
}, authClient)

rows, err := client.Query(ctx, "SELECT * FROM orders LIMIT 10")
defer rows.Close()
```

### `clients` (tenant helpers)

Tenant ID normalization and scope construction.

**Functions**:
- `NormalizeTenantID(tenantID string) string`: Strip `f_ecom_` prefix
- `ToOrganizationID(tenantID string) string`: Add `f_ecom_` prefix if missing
- `BuildTenantScope(tenantID string) string`: Construct OAuth scope

**Example**:
```go
normalized := clients.NormalizeTenantID("f_ecom_bdpx_prd")  // "bdpx_prd"
orgID := clients.ToOrganizationID("bdpx_prd")               // "f_ecom_bdpx_prd"
scope := clients.BuildTenantScope("bdpx_prd")               // "SALESFORCE_COMMERCE_API:bdpx_prd"
```

### `operations/metrics`

High-level operations for Metrics API.

**Functions**:
- `ResolveMetricsWindow(from, to TimeInput) (time.Time, time.Time, error)`: Enforce 30-day retention
- `ParseSeriesTags(params ParseSeriesTagsParams) map[string]string`: Extract tags from series ID

**Features**:
- Flexible time input (time.Time, epoch ms, ISO string, relative duration)
- 24-hour default window
- 30-day retention enforcement with 5-minute safety margin
- Tag extraction via declarative catalog (32 golden test cases)

**Example**:
```go
// Resolve time window
from, to, err := metrics.ResolveMetricsWindow("2026-07-13T00:00:00Z", time.Now())

// Parse series tags
tags := metrics.ParseSeriesTags(metrics.ParseSeriesTagsParams{
    Category: "scapi",
    MetricID: "totalCalls",
    SeriesID: "bdpx.product",
    Context:  metrics.MetricsTagContext{TenantID: "f_ecom_bdpx_prd"},
})
// Result: {"realm": "bdpx", "environment": "prd", "apiFamily": "product"}
```

## Error Handling

All client methods return typed errors:

```go
resp, err := client.GetOverallMetrics(ctx, from, to, nil)
if err != nil {
    // Check for specific error types
    if errors.Is(err, auth.ErrInvalidCredentials) {
        // Handle invalid OAuth credentials
    }
    if errors.Is(err, metrics.ErrRateLimited) {
        // Handle 429 rate limiting
    }
    // Generic error handling
    fmt.Printf("Error: %v\n", err)
}
```

**Common Errors**:
- `auth.ErrInvalidCredentials`: OAuth 401 (wrong client ID/secret)
- `auth.ErrForbidden`: OAuth 403 (insufficient scope)
- `metrics.ErrNotFound`: API 404 (wrong shortCode/tenantID)
- `metrics.ErrRateLimited`: API 429 (too many requests)
- `cip.ErrConnectionFailed`: CIP connection refused
- `cip.ErrQueryTimeout`: CIP query timeout

## Testing

The SDK includes comprehensive tests with 100% coverage:

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test -v ./auth
go test -v ./clients/metrics
go test -v ./clients/cip
go test -v ./operations/metrics
```

**Golden Test Fixtures**:
- `operations/metrics/data/metrics-tags.golden.json`: 32 tag extraction test cases
- `operations/metrics/data/metrics-tags-catalog.json`: Declarative tag rules
- Both files are identical to TypeScript SDK (parity enforced by `catalog_parity_test.go`)

## Versioning

This package is versioned via **git tags** (not npm changesets):
- Tag pattern: `go-sdk/vX.Y.Z`
- Example: `go-sdk/v0.1.0`
- Follows semantic versioning

**Releases**:
- Major: Breaking API changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

**To depend on a specific version**:
```bash
go get github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go@go-sdk/v0.1.0
```

## Architecture

The SDK is organized into distinct layers:

```
b2c-tooling-sdk-go/
├── auth/                      # OAuth2 client credentials
│   ├── oauth.go               # Token acquisition + caching
│   └── oauth_test.go
│
├── clients/                   # API clients
│   ├── tenant.go              # Tenant ID helpers
│   ├── tenant_test.go
│   ├── metrics/               # Metrics API client
│   │   ├── client.go          # 9 category endpoints
│   │   ├── client_test.go
│   │   ├── partition.go       # Request partitioning (>24h)
│   │   └── partition_test.go
│   └── cip/                   # CIP analytics client
│       ├── client.go          # JDBC-over-Avatica
│       └── client_test.go
│
├── operations/                # High-level operations
│   └── metrics/
│       ├── window.go          # Time window resolution
│       ├── window_test.go
│       ├── tags.go            # Tag extraction
│       ├── tags_golden_test.go
│       ├── catalog_parity_test.go
│       └── data/
│           ├── metrics-tags-catalog.json  # Tag rules
│           └── metrics-tags.golden.json   # Golden fixtures
│
├── go.mod                     # Module definition
├── go.sum                     # Checksums
└── README.md                  # This file
```

**Design Principles**:
- No Grafana dependencies (standalone SDK)
- Testable (interfaces, mock servers)
- Typed errors (via `errors.Is`/`errors.As`)
- Idiomatic Go (context-aware, error handling)
- Parity with TypeScript SDK (same golden tests)

## API Documentation

Full API documentation is available via godoc:

```bash
# Local godoc server
godoc -http=:6060

# Open http://localhost:6060/pkg/github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/
```

Or online at https://pkg.go.dev/github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go

## Related Packages

- **[b2c-grafana-datasource](../b2c-grafana-datasource/)**: Grafana plugins powered by this SDK
- **[b2c-tooling-sdk](../b2c-tooling-sdk/)**: TypeScript SDK (CLI + MCP)
- **[b2c-cli](../b2c-cli/)**: Command-line interface
- **[b2c-dx-mcp](../b2c-dx-mcp/)**: Model Context Protocol server

## Contributing

This SDK is part of the [b2c-developer-tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) monorepo.

**Development workflow**:
1. Make changes
2. Add tests (`go test ./...`)
3. Update godoc comments
4. Ensure golden tests pass
5. Open PR

**Golden test parity**:
- TypeScript catalog: `../b2c-tooling-sdk/specs/metrics-tags-catalog.json`
- Go catalog: `operations/metrics/data/metrics-tags-catalog.json`
- Must be byte-identical (enforced by `catalog_parity_test.go`)

## License

Copyright (c) 2025, Salesforce, Inc. Licensed under Apache-2.0.

See [license.txt](../../license.txt) in repository root.

## Support

- **Issues**: https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues
- **Documentation**: https://developer.salesforce.com/docs/commerce/commerce-api
- **B2C CLI**: Related tooling at https://github.com/SalesforceCommerceCloud/b2c-developer-tooling
