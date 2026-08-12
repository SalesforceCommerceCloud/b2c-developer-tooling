# B2C Tooling SDK for Go - API Reference

## Package Structure

```
github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go
├── auth/                  # OAuth2 authentication
├── clients/               # Tenant ID helpers  
│   └── metrics/           # Metrics API client
└── operations/metrics/    # High-level metrics operations
```

## auth

### Constants

```go
const DefaultAccountManagerHost = "account.demandware.com"
const ClientIDHeader = "x-dw-client-id"
```

### Types

```go
type OAuthConfig struct {
    ClientID           string
    ClientSecret       string
    AccountManagerHost string   // Optional, defaults to DefaultAccountManagerHost
    Scopes             []string // Optional OAuth scopes
}
```

### Functions

```go
// NewOAuthStrategy creates a new OAuth2 authentication strategy using client credentials flow.
// Returns a strategy that provides an http.Client with automatic token management and header injection.
func NewOAuthStrategy(cfg OAuthConfig) *OAuthStrategy

// Client returns the http.Client configured with OAuth authentication.
func (s *OAuthStrategy) Client() *http.Client

// WithAdditionalScopes returns a new OAuthStrategy with additional scopes merged with existing scopes.
// Useful for creating scoped clients from a base strategy.
func (s *OAuthStrategy) WithAdditionalScopes(additionalScopes []string) *OAuthStrategy

// FormatScopes joins scopes into a space-delimited string for OAuth token requests.
func FormatScopes(scopes []string) string
```

## clients

### Constants

```go
const OrganizationIDPrefix = "f_ecom_"
const ScapiTenantScopePrefix = "SALESFORCE_COMMERCE_API:"
```

### Functions

```go
// NormalizeTenantID normalizes a tenant ID by:
// 1. Trimming whitespace
// 2. Taking substring before first dot (if present)
// 3. Stripping leading "f_ecom_" prefix (if present)
// 4. Replacing all hyphens with underscores
//
// Examples:
//   "f_ecom_bdpx_prd" → "bdpx_prd"
//   "abcd-123.dx.example.com" → "abcd_123"
func NormalizeTenantID(value string) string

// ToOrganizationID ensures a tenant ID has the required f_ecom_ prefix for SCAPI organizationId.
//
// Example: "bdpx_prd" → "f_ecom_bdpx_prd"
func ToOrganizationID(tenantID string) string

// BuildTenantScope constructs the tenant-specific SCAPI OAuth scope.
//
// Example: "bdpx_prd" → "SALESFORCE_COMMERCE_API:bdpx_prd"
func BuildTenantScope(tenantID string) string
```

## clients/metrics

### Constants

```go
const MetricsScope = "sfcc.metrics"
```

### Types

```go
type DataPoint struct {
    Timestamp int64   `json:"timestamp"` // Epoch milliseconds (normalized from API's seconds)
    Value     float64 `json:"value"`
}

type DataSeries struct {
    ID   string                       `json:"id"`
    Name string                       `json:"name"`
    Data []DataPoint                  `json:"data"`
    Tags metricsops.MetricSeriesTags  `json:"tags,omitempty"` // Enriched structured tags
}

type Metric struct {
    MetricID    string       `json:"metricId"`
    Title       string       `json:"title"`
    Description string       `json:"description"`
    Unit        string       `json:"unit,omitempty"`
    DataSeries  []DataSeries `json:"dataSeries"`
}

type MetricsDataResponse struct {
    Data []Metric `json:"data"`
}

type Config struct {
    ShortCode string // SCAPI instance short code (e.g., "kv7kzm78")
    TenantID  string // Tenant ID (with or without f_ecom_ prefix)
}
```

### Functions

```go
// NewClient creates a new Metrics API client.
// Automatically handles OAuth scopes, timestamp normalization, and tag enrichment.
func NewClient(cfg Config, authStrategy *auth.OAuthStrategy) *Client

// GetOverallMetrics retrieves overall application metrics.
func (c *Client) GetOverallMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetSalesMetrics retrieves sales metrics.
func (c *Client) GetSalesMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetEcdnMetrics retrieves eCDN metrics.
func (c *Client) GetEcdnMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetThirdPartyMetrics retrieves third-party service metrics.
// Filters: "thirdPartyServiceId"
func (c *Client) GetThirdPartyMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetScapiMetrics retrieves SCAPI metrics.
// Filters: "apiFamily", "apiName"
func (c *Client) GetScapiMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetScapiHooksMetrics retrieves SCAPI hooks metrics.
func (c *Client) GetScapiHooksMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetMrtMetrics retrieves MRT (Managed Runtime) metrics.
func (c *Client) GetMrtMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetControllerMetrics retrieves controller metrics.
func (c *Client) GetControllerMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)

// GetOcapiMetrics retrieves OCAPI metrics.
// Filters: "ocapiCategory", "ocapiApi"
func (c *Client) GetOcapiMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error)
```

## operations/metrics

### Constants

```go
const MetricsRetentionPeriod = 30 * 24 * time.Hour        // 30 days
const MetricsDefaultWindow = 24 * time.Hour                // 24 hours
const MetricsRetentionSafetyMargin = 5 * time.Minute      // 5 minutes
```

### Types

```go
type MetricSeriesTags map[string]string

// Always contains "realm" and optionally "environment".
// Category-specific keys: apiFamily, host, cacheStatus, statusClass,
// ocapiCategory, controller, exceptionType, aggregation.

type MetricsTagContext struct {
    TenantID            string
    APIFamily           string // Optional SCAPI filter
    APIName             string // Optional SCAPI filter
    OcapiCategory       string // Optional OCAPI filter
    OcapiAPI            string // Optional OCAPI filter
    ThirdPartyServiceID string // Optional third-party filter
}

type ParseSeriesTagsParams struct {
    Category string
    MetricID string
    SeriesID string
    Context  MetricsTagContext
}

type MetricsWindowInput struct {
    From   interface{} // time.Time, int64 (epoch ms), or string (relative/ISO)
    To     interface{} // time.Time, int64 (epoch ms), or string (relative/ISO)
    Window interface{} // time.Duration or string (relative)
}

type ResolvedMetricsWindow struct {
    From             time.Time
    To               time.Time
    FromEpochSeconds int64
    ToEpochSeconds   int64
    ClampedFrom      bool // True if from was clamped to stay within retention
    DefaultedWindow  bool // True if a bound was derived from the 24-hour default
}
```

### Functions

```go
// ParseSeriesTags extracts structured dimension tags from a series ID.
// Combines three tiers:
// 1. Request identity (realm/environment from tenant ID)
// 2. String heuristics (category/metric-specific parsing)
// 3. Applied filters (override heuristics)
func ParseSeriesTags(params ParseSeriesTagsParams) MetricSeriesTags

// ParseMetricsBound parses a single time bound into time.Time.
// Accepts: time.Time, int64 (epoch ms), or string (relative like "5m" or ISO 8601).
func ParseMetricsBound(value interface{}, now time.Time) (time.Time, error)

// ResolveMetricsWindow resolves from/to/window inputs into concrete bounds.
// Always produces explicit from+to. Enforces 30-day retention and 24-hour default window.
func ResolveMetricsWindow(input MetricsWindowInput, now time.Time) (*ResolvedMetricsWindow, error)
```

## Complete Usage Example

```go
package main

import (
    "context"
    "fmt"
    "time"

    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients/metrics"
    metricsops "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/operations/metrics"
)

func main() {
    // 1. Create OAuth strategy
    authClient := auth.NewOAuthStrategy(auth.OAuthConfig{
        ClientID:     "your-client-id",
        ClientSecret: "your-client-secret",
    })

    // 2. Create metrics client (scopes handled automatically)
    client := metrics.NewClient(metrics.Config{
        ShortCode: "kv7kzm78",
        TenantID:  "bdpx_prd",
    }, authClient)

    // 3. Resolve time window (with retention enforcement)
    window, err := metricsops.ResolveMetricsWindow(metricsops.MetricsWindowInput{
        From:   "24h",  // 24 hours ago
        Window: "1h",   // 1 hour window
    }, time.Now())
    if err != nil {
        panic(err)
    }

    // 4. Fetch metrics
    ctx := context.Background()
    resp, err := client.GetScapiMetrics(ctx, window.From, window.To, map[string]string{
        "apiFamily": "product",
    })
    if err != nil {
        panic(err)
    }

    // 5. Process enriched data
    for _, metric := range resp.Data {
        fmt.Printf("Metric: %s (%s)\n", metric.Title, metric.MetricID)
        for _, series := range metric.DataSeries {
            // Tags are automatically parsed and enriched
            fmt.Printf("  Series: %s\n", series.Name)
            fmt.Printf("  Tags: realm=%s, environment=%s, apiFamily=%s\n",
                series.Tags["realm"],
                series.Tags["environment"],
                series.Tags["apiFamily"],
            )
            for _, point := range series.Data {
                t := time.UnixMilli(point.Timestamp) // Already normalized to ms
                fmt.Printf("    %s: %.2f %s\n", t.Format(time.RFC3339), point.Value, metric.Unit)
            }
        }
    }
}
```

## Parity with TypeScript SDK

This Go SDK maintains exact behavioral parity with the TypeScript SDK:

- **Tag extraction**: Both SDKs assert against the same golden test fixture (`metrics-tags.golden.json`)
- **Window resolution**: Identical 30-day retention and 24-hour default window rules
- **Timestamp normalization**: API returns epoch seconds, both SDKs normalize to milliseconds
- **OAuth scopes**: Same automatic scope construction (sfcc.metrics + tenant-specific scope)
- **Tenant ID normalization**: Same string processing rules

The golden test ensures zero drift between implementations.
