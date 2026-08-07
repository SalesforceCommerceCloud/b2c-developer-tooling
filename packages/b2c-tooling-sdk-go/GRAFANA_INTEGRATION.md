# Grafana Plugin Integration Guide

This document describes how to integrate the Go B2C Tooling SDK into a Grafana backend datasource plugin for the Metrics API.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Grafana Frontend (React)                                     │
│ ├── ConfigEditor (datasource settings)                       │
│ ├── QueryEditor (query builder UI)                           │
│ └── DataSourceApi (query execution bridge)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ JSON-RPC over HTTP
┌───────────────────────────┴─────────────────────────────────┐
│ Grafana Backend Plugin (Go)                                  │
│ ├── plugin.json (metadata)                                   │
│ ├── datasource.go (QueryDataHandler, CheckHealthHandler)     │
│ └── B2C Tooling SDK                                          │
│     ├── auth.OAuthStrategy (client credentials)              │
│     ├── metrics.Client (category endpoints)                  │
│     └── operations/metrics (window + tags)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┴─────────────────────────────────┐
│ Metrics API                                                   │
│ https://{shortCode}.api.commercecloud.salesforce.com/        │
│         observability/metrics/v1                              │
└───────────────────────────────────────────────────────────────┘
```

## Plugin Configuration

### plugin.json

```json
{
  "type": "datasource",
  "name": "B2C Commerce Metrics",
  "id": "salesforce-b2c-metrics",
  "backend": true,
  "executable": "gpx_b2c_metrics",
  "alerting": true,
  "metrics": true,
  "routes": [],
  "info": {
    "version": "0.1.0",
    "description": "B2C Commerce Metrics API datasource",
    "author": { "name": "Salesforce" },
    "logos": {
      "small": "img/logo.svg",
      "large": "img/logo.svg"
    }
  }
}
```

### Datasource Settings

#### jsonData (non-sensitive)

```json
{
  "shortCode": "kv7kzm78",
  "tenantId": "bdpx_prd",
  "accountManagerHost": "account.demandware.com"  // Optional
}
```

#### secureJsonData (encrypted server-side)

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}
```

Accessed in Go via:
```go
settings.DecryptedSecureJSONData["clientId"]
settings.DecryptedSecureJSONData["clientSecret"]
```

## Backend Implementation

### Main Plugin Registration

```go
package main

import (
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
    "github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
    if err := datasource.Manage(
        "salesforce-b2c-metrics",
        newDatasource,
        datasource.ManageOpts{},
    ); err != nil {
        log.DefaultLogger.Error(err.Error())
    }
}

func newDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (backend.DataSource, error) {
    return &B2CMetricsDatasource{
        settings: settings,
    }, nil
}
```

### Datasource Handler

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"

    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
    "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients/metrics"
    metricsops "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/operations/metrics"
)

type B2CMetricsDatasource struct {
    settings backend.DataSourceInstanceSettings
}

// QueryModel represents the query submitted from the frontend.
type QueryModel struct {
    RefID           string `json:"refId"`
    Category        string `json:"category"`        // "overall", "scapi", "ocapi", etc.
    APIFamily       string `json:"apiFamily"`       // SCAPI filter
    APIName         string `json:"apiName"`         // SCAPI filter
    OcapiCategory   string `json:"ocapiCategory"`   // OCAPI filter
    OcapiAPI        string `json:"ocapiApi"`        // OCAPI filter
    ThirdPartyID    string `json:"thirdPartyServiceId"` // Third-party filter
}

func (d *B2CMetricsDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()

    // Parse datasource settings
    var jsonData struct {
        ShortCode           string `json:"shortCode"`
        TenantID            string `json:"tenantId"`
        AccountManagerHost  string `json:"accountManagerHost"`
    }
    if err := json.Unmarshal(req.PluginContext.DataSourceInstanceSettings.JSONData, &jsonData); err != nil {
        return response, fmt.Errorf("failed to parse datasource settings: %w", err)
    }

    // Get credentials from secure storage
    clientID := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientId"]
    clientSecret := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientSecret"]
    if clientID == "" || clientSecret == "" {
        return response, fmt.Errorf("missing client credentials")
    }

    // Create OAuth strategy
    authCfg := auth.OAuthConfig{
        ClientID:           clientID,
        ClientSecret:       clientSecret,
        AccountManagerHost: jsonData.AccountManagerHost,
    }
    if authCfg.AccountManagerHost == "" {
        authCfg.AccountManagerHost = auth.DefaultAccountManagerHost
    }
    authStrategy := auth.NewOAuthStrategy(authCfg)

    // Create metrics client
    client := metrics.NewClient(metrics.Config{
        ShortCode: jsonData.ShortCode,
        TenantID:  jsonData.TenantID,
    }, authStrategy)

    // Process each query
    for _, query := range req.Queries {
        var qm QueryModel
        if err := json.Unmarshal(query.JSON, &qm); err != nil {
            response.Responses[query.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("failed to parse query: %v", err))
            continue
        }

        // Resolve time window (enforce retention)
        window, err := metricsops.ResolveMetricsWindow(metricsops.MetricsWindowInput{
            From: query.TimeRange.From.UnixMilli(),
            To:   query.TimeRange.To.UnixMilli(),
        }, time.Now())
        if err != nil {
            response.Responses[qm.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("invalid time window: %v", err))
            continue
        }

        // Build category filters
        filters := map[string]string{
            "apiFamily":           qm.APIFamily,
            "apiName":             qm.APIName,
            "ocapiCategory":       qm.OcapiCategory,
            "ocapiApi":            qm.OcapiAPI,
            "thirdPartyServiceId": qm.ThirdPartyID,
        }

        // Fetch metrics for the category
        var data *metrics.MetricsDataResponse
        switch qm.Category {
        case "overall":
            data, err = client.GetOverallMetrics(ctx, window.From, window.To, filters)
        case "scapi":
            data, err = client.GetScapiMetrics(ctx, window.From, window.To, filters)
        case "ocapi":
            data, err = client.GetOcapiMetrics(ctx, window.From, window.To, filters)
        case "third-party":
            data, err = client.GetThirdPartyMetrics(ctx, window.From, window.To, filters)
        case "ecdn":
            data, err = client.GetEcdnMetrics(ctx, window.From, window.To, filters)
        default:
            err = fmt.Errorf("unknown category: %s", qm.Category)
        }

        if err != nil {
            response.Responses[qm.RefID] = backend.ErrDataResponse(backend.StatusInternal, fmt.Sprintf("metrics API error: %v", err))
            continue
        }

        // Convert to Grafana frames (one time field + one value field per series)
        frames := convertToFrames(data, qm, window)
        response.Responses[qm.RefID] = backend.DataResponse{Frames: frames}
    }

    return response, nil
}

// convertToFrames converts Metrics API response to Grafana data frames.
// Each series becomes a separate frame with:
// - One time field (timestamps)
// - One value field (data points)
// - Labels from enriched tags
func convertToFrames(data *metrics.MetricsDataResponse, qm QueryModel, window *metricsops.ResolvedMetricsWindow) data.Frames {
    var frames data.Frames

    for _, metric := range data.Data {
        for _, series := range metric.DataSeries {
            // Extract timestamps and values
            timeVals := make([]time.Time, len(series.Data))
            valueVals := make([]float64, len(series.Data))
            for i, point := range series.Data {
                timeVals[i] = time.UnixMilli(point.Timestamp)
                valueVals[i] = point.Value
            }

            // Build frame name from tags
            frameName := buildFrameName(metric.Title, series.Tags)

            // Create frame with time + value fields
            frame := data.NewFrame(frameName,
                data.NewField("time", nil, timeVals),
                data.NewField(metric.MetricID, data.Labels(series.Tags), valueVals),
            )

            // Set field config (unit, display name)
            if metric.Unit != "" {
                frame.Fields[1].Config = &data.FieldConfig{
                    Unit: metric.Unit,
                }
            }

            // Add metadata
            frame.Meta = &data.FrameMeta{
                ExecutedQueryString: fmt.Sprintf("category=%s from=%s to=%s", qm.Category, window.FromIso, window.ToIso),
            }

            if window.ClampedFrom {
                frame.Meta.Notices = append(frame.Meta.Notices, data.Notice{
                    Severity: data.NoticeSeverityWarning,
                    Text:     "Time range was clamped to 30-day retention window",
                })
            }

            frames = append(frames, frame)
        }
    }

    return frames
}

// buildFrameName constructs a human-readable frame name from tags.
func buildFrameName(metricTitle string, tags map[string]string) string {
    // Example: "SCAPI Total Calls (product, shopper-products, bdpx/prd)"
    parts := []string{metricTitle}
    
    if apiFamily, ok := tags["apiFamily"]; ok {
        parts = append(parts, apiFamily)
    }
    if apiName, ok := tags["apiName"]; ok {
        parts = append(parts, apiName)
    }
    if host, ok := tags["host"]; ok {
        parts = append(parts, host)
    }
    
    realm := tags["realm"]
    env := tags["environment"]
    if env != "" {
        parts = append(parts, fmt.Sprintf("%s/%s", realm, env))
    } else if realm != "" {
        parts = append(parts, realm)
    }
    
    return fmt.Sprintf("%s (%s)", parts[0], strings.Join(parts[1:], ", "))
}

func (d *B2CMetricsDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    // Parse settings and test OAuth + API connectivity
    // (Implementation similar to QueryData setup, but with a simple test request)
    return &backend.CheckHealthResult{
        Status:  backend.HealthStatusOk,
        Message: "Successfully connected to Metrics API",
    }, nil
}
```

## Frontend Integration

### QueryEditor.tsx

```tsx
import React from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineField, Select, Input } from '@grafana/ui';

const CATEGORIES: Array<SelectableValue<string>> = [
  { label: 'Overall', value: 'overall' },
  { label: 'SCAPI', value: 'scapi' },
  { label: 'OCAPI', value: 'ocapi' },
  { label: 'Third-party', value: 'third-party' },
  { label: 'eCDN', value: 'ecdn' },
  { label: 'MRT', value: 'mrt' },
  { label: 'Controller', value: 'controller' },
  { label: 'SCAPI Hooks', value: 'scapi-hooks' },
  { label: 'Sales', value: 'sales' },
];

export function QueryEditor(props: QueryEditorProps<DataSource, Query>) {
  const { query, onChange, onRunQuery } = props;

  return (
    <div>
      <InlineField label="Category" labelWidth={20}>
        <Select
          value={query.category}
          options={CATEGORIES}
          onChange={(v) => {
            onChange({ ...query, category: v.value });
            onRunQuery();
          }}
        />
      </InlineField>

      {query.category === 'scapi' && (
        <>
          <InlineField label="API Family" labelWidth={20}>
            <Input
              value={query.apiFamily || ''}
              onChange={(e) => onChange({ ...query, apiFamily: e.currentTarget.value })}
              onBlur={onRunQuery}
              placeholder="product, checkout, etc."
            />
          </InlineField>
          <InlineField label="API Name" labelWidth={20}>
            <Input
              value={query.apiName || ''}
              onChange={(e) => onChange({ ...query, apiName: e.currentTarget.value })}
              onBlur={onRunQuery}
              placeholder="shopper-products, etc."
            />
          </InlineField>
        </>
      )}

      {query.category === 'ocapi' && (
        <>
          <InlineField label="OCAPI Category" labelWidth={20}>
            <Input
              value={query.ocapiCategory || ''}
              onChange={(e) => onChange({ ...query, ocapiCategory: e.currentTarget.value })}
              onBlur={onRunQuery}
              placeholder="shop, data"
            />
          </InlineField>
          <InlineField label="OCAPI API" labelWidth={20}>
            <Input
              value={query.ocapiApi || ''}
              onChange={(e) => onChange({ ...query, ocapiApi: e.currentTarget.value })}
              onBlur={onRunQuery}
            />
          </InlineField>
        </>
      )}

      {query.category === 'third-party' && (
        <InlineField label="Service ID" labelWidth={20}>
          <Input
            value={query.thirdPartyServiceId || ''}
            onChange={(e) => onChange({ ...query, thirdPartyServiceId: e.currentTarget.value })}
            onBlur={onRunQuery}
          />
        </InlineField>
      )}
    </div>
  );
}
```

## Key Integration Points

### 1. OAuth Token Management

The SDK handles all token lifecycle:
- Initial fetch via client credentials
- Automatic refresh on expiry
- Single-flight token requests (no thundering herd)
- Header injection (Authorization + x-dw-client-id)

```go
authStrategy := auth.NewOAuthStrategy(auth.OAuthConfig{
    ClientID:     clientID,
    ClientSecret: clientSecret,
})
// authStrategy.Client() returns http.Client ready to use
```

### 2. Time Window Resolution

Grafana passes `query.TimeRange.From/To`. The SDK enforces retention:

```go
window, err := metricsops.ResolveMetricsWindow(metricsops.MetricsWindowInput{
    From: query.TimeRange.From.UnixMilli(),
    To:   query.TimeRange.To.UnixMilli(),
}, time.Now())

// window.ClampedFrom indicates if from was moved forward into retention
// window.FromEpochSeconds / ToEpochSeconds are ready for API query params
```

### 3. Timestamp Normalization

The Metrics API returns epoch **seconds**. The SDK normalizes to **milliseconds**:

```go
for _, point := range series.Data {
    t := time.UnixMilli(point.Timestamp) // Already ×1000
}
```

### 4. Tag Enrichment

Every series gets structured tags automatically:

```go
for _, series := range metric.DataSeries {
    // series.Tags is map[string]string with realm, environment, apiFamily, etc.
    labels := data.Labels(series.Tags) // Convert to Grafana labels
}
```

## Testing Strategy

### Unit Tests

Already provided in the SDK:
- `auth/oauth_test.go` - OAuth flow with mock token endpoint
- `clients/tenant_test.go` - Tenant ID normalization
- `operations/metrics/tags_golden_test.go` - Tag extraction (32 golden cases)
- `operations/metrics/window_test.go` - Window resolution with retention

### Integration Test (Plugin)

```go
func TestDatasourceQueryData(t *testing.T) {
    // Use httptest to mock Metrics API
    apiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Return mock MetricsDataResponse JSON
        w.Write([]byte(`{...}`))
    }))
    defer apiServer.Close()

    // Create datasource with test settings pointing to mock server
    // Execute QueryData
    // Assert frames match expected structure
}
```

## Deployment

1. Build the plugin:
   ```bash
   mage -v
   ```

2. Sign the plugin (for distribution):
   ```bash
   npx @grafana/sign-plugin@latest
   ```

3. Install in Grafana:
   - Copy `dist/` to Grafana plugins directory
   - Restart Grafana
   - Add datasource via UI with credentials

## Security Notes

- **Client credentials** are stored in Grafana's encrypted secure JSON data (never in plain jsonData)
- **OAuth tokens** are cached in-memory by the SDK (not persisted)
- **TLS** is enforced for all Account Manager and Metrics API calls
- **Scopes** are automatically constructed (sfcc.metrics + tenant-specific)

## Performance

- **Token caching**: Reduces token endpoint load (1 token per scope set, reused until expiry)
- **HTTP connection pooling**: Provided by Go's default http.Client
- **Parallel queries**: Grafana executes multiple QueryData calls concurrently (SDK is safe for concurrent use)

## Parity Guarantee

The Go SDK's golden test ensures exact parity with the TypeScript SDK for tag extraction. Both implementations assert against the same `metrics-tags.golden.json` fixture, preventing drift.
