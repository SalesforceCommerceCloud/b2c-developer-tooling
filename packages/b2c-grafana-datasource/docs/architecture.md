# Architecture Guide

Technical architecture of the B2C Commerce Grafana datasources.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Grafana UI                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │ Config      │  │ Query       │  │ DataSource   │            │
│  │ Editor      │  │ Editor      │  │ API          │            │
│  │ (Settings)  │  │ (Query UI)  │  │ (Bridge)     │            │
│  └─────────────┘  └─────────────┘  └──────────────┘            │
└────────────────────────────┬────────────────────────────────────┘
                             │ JSON-RPC over HTTP/gRPC
┌────────────────────────────┴────────────────────────────────────┐
│              Grafana Backend Plugins (Go)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Metrics Plugin (gpx_b2c_metrics)                         │   │
│  │ - pkg/plugin/datasource.go                               │   │
│  │   ├── QueryData(): Execute metric queries                │   │
│  │   ├── CheckHealth(): Validate connectivity               │   │
│  │   └── CallResource(): /categories, /filters, etc.        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CIP Plugin (gpx_b2c_cip)                                 │   │
│  │ - pkg/cip/plugin/datasource.go                           │   │
│  │   ├── QueryData(): Execute SQL queries (via sqlds/v4)    │   │
│  │   ├── CheckHealth(): Validate CIP connection             │   │
│  │   └── CallResource(): /tables, /columns, etc.            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ B2C Tooling SDK Go (shared, via replace directive)      │   │
│  │                                                           │   │
│  │ ├── auth.OAuthStrategy                                   │   │
│  │ │   - Client credentials flow                            │   │
│  │ │   - Token caching (scope + expiry)                     │   │
│  │ │   - Auto-refresh on 401                                │   │
│  │ │                                                         │   │
│  │ ├── clients/metrics.Client                               │   │
│  │ │   - 9 category endpoints (GetOverallMetrics, etc.)     │   │
│  │ │   - Auto-adds sfcc.metrics + tenant scope              │   │
│  │ │   - Normalizes timestamps (seconds → milliseconds)     │   │
│  │ │   - Enriches series with tags                          │   │
│  │ │                                                         │   │
│  │ ├── clients/cip.Client                                   │   │
│  │ │   - JDBC-over-Avatica connection                       │   │
│  │ │   - Sticky session handling                            │   │
│  │ │   - Query execution + metadata                         │   │
│  │ │                                                         │   │
│  │ └── operations/metrics                                    │   │
│  │     ├── ResolveMetricsWindow()                           │   │
│  │     │   - 30-day retention enforcement                    │   │
│  │     │   - 24-hour default window                          │   │
│  │     │                                                     │   │
│  │     └── ParseSeriesTags()                                │   │
│  │         - Extracts structured tags from series IDs        │   │
│  │         - 32 golden test cases (parity with TS SDK)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┴────────────────────────────────────┐
│           Backend APIs                                           │
│                                                                   │
│  account.demandware.com                                          │
│  ├── POST /dwsso/oauth2/access_token                            │
│  │   - Client credentials grant                                 │
│  │   - Returns access_token + expires_in                        │
│  │                                                               │
│  {shortCode}.api.commercecloud.salesforce.com                   │
│  └── GET /observability/metrics/v1/organizations/{orgId}/...   │
│      ├── /metrics/overall                                       │
│      ├── /metrics/scapi                                         │
│      └── ... (9 categories)                                     │
│                                                                   │
│  cip-{region}.commercecloud.salesforce.com                      │
│  └── POST /avatica                                              │
│      - Apache Avatica JSON protocol                             │
│      - Calcite SQL execution                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Plugin Architecture

### Two Independent Datasources

The B2C Commerce plugin packages two separate Grafana datasources:

1. **Metrics Datasource** (`salesforce-b2c-metrics-datasource`)
   - Plugin ID: `salesforce-b2c-metrics-datasource`
   - Backend binary: `gpx_b2c_metrics`
   - Source: `pkg/plugin/`, `src/`
   - Purpose: Time-series metrics from Metrics API

2. **CIP Datasource** (`salesforce-b2c-cip-datasource`)
   - Plugin ID: `salesforce-b2c-cip-datasource`
   - Backend binary: `gpx_b2c_cip`
   - Source: `pkg/cip/plugin/`, `src/cip/`
   - Purpose: Raw SQL queries against CIP warehouse

Both share:
- The same Go SDK (auth, clients, operations)
- Similar OAuth configuration UI
- Separate registration, configuration, query models

### Frontend Architecture

**Metrics Frontend** (`src/`):
- `ConfigEditor.tsx`: Datasource settings form
- `QueryEditor.tsx`: Tiered filter interface
- `datasource.ts`: DataSourceApi implementation
- `types.ts`: TypeScript interfaces
- `module.ts`: Plugin registration

**CIP Frontend** (`src/cip/`):
- `ConfigEditor.tsx`: CIP settings form
- `QueryEditor.tsx`: SQL editor + schema browser
- `VariableQueryEditor.tsx`: Variable query interface
- `datasource.ts`: DataSourceApi implementation
- `types.ts`: TypeScript interfaces
- `module.ts`: Plugin registration

Both frontends are built with:
- React + TypeScript
- Grafana plugin SDK (`@grafana/data`, `@grafana/ui`, `@grafana/runtime`)
- Webpack bundling (dual-entry: `module.ts` + `cip/module.ts`)

### Backend Architecture

**Metrics Backend** (`pkg/plugin/`):
- `main.go`: Plugin entry point (21 lines)
- `datasource.go`: Core logic (405 lines)
  - `NewDatasource()`: Factory, parses settings
  - `QueryData()`: Executes metric queries
  - `CheckHealth()`: Validates connectivity
  - `CallResource()`: Serves /categories, /filters, /metrics, /label-keys, /label-values

**CIP Backend** (`pkg/cip/plugin/`):
- `main.go`: Plugin entry point
- `datasource.go`: Core logic (uses grafana/sqlds/v4)
  - Inherits QueryData from sqlds.Driver
  - `CheckHealth()`: Pings CIP with SELECT 1
  - `CallResource()`: Serves /tables, /columns
- `macros.go`: SQL macro expansion (`$__timeFilter`, `$__timeGroup`, etc.)
- `driver.go`: sqlds.Driver implementation (opens connections, executes queries)

Both backends use:
- `grafana-plugin-sdk-go/backend`: Plugin framework
- `b2c-tooling-sdk-go`: OAuth + API clients

## Data Flow

### Metrics Query Execution

1. **User Action**: User configures query in dashboard
   - Selects category (e.g., `scapi`)
   - Sets filters (e.g., `apiFamily=product`)
   - Sets time range in Grafana UI

2. **Frontend → Backend**: Grafana sends `QueryDataRequest`
   ```json
   {
     "queries": [{
       "refId": "A",
       "category": "scapi",
       "apiFamily": "product",
       "timeRange": {
         "from": "2026-07-13T12:00:00Z",
         "to": "2026-07-14T12:00:00Z"
       }
     }]
   }
   ```

3. **Backend Processing** (`QueryData()`):
   - Parse query JSON → `QueryModel`
   - Resolve time window (enforce 30-day retention, default 24h)
   - Build filter map from query model
   - Route to SDK client method based on category
   - SDK handles OAuth (fetch/cache token)
   - SDK calls Metrics API
   - SDK normalizes response (timestamps ×1000, tag extraction)
   - Convert to Grafana frames

4. **Frame Construction**:
   - For each metric in response:
     - For each series in metric:
       - Create `data.Frame` with:
         - Time field: `[]time.Time`
         - Value field: `[]float64` with labels from tags
         - Field config: unit, display name
       - Add metadata: executed query, notices

5. **Backend → Frontend**: Return `QueryDataResponse`
   ```go
   backend.DataResponse{
     Frames: []{
       {
         Name: "SCAPI Total Calls (product, bdpx/prd)",
         Fields: [
           {Name: "time", Values: [...]},
           {Name: "scapi.totalCalls", Labels: {...}, Values: [...]}
         ]
       }
     }
   }
   ```

6. **Grafana Rendering**: UI renders frames as time series

### CIP Query Execution

1. **User Action**: User writes SQL query with macros

2. **Frontend → Backend**: Grafana sends `QueryDataRequest` with SQL

3. **Backend Processing** (via `grafana/sqlds/v4`):
   - Expand macros: `$__timeFilter` → `WHERE submit_date >= ... AND submit_date < ...`
   - Open CIP connection (via SDK's `cip.Client`)
   - Execute query via JDBC-over-Avatica
   - Fetch rows + metadata
   - Convert to Grafana frames:
     - Time series: Requires `time` column + numeric values
     - Table: Any column structure

4. **Frame Construction**:
   - `sqlds` handles conversion (rows → frames)
   - Backend adds:
     - Field types (time, number, string)
     - Display names
     - Metadata (executed query)

5. **Backend → Frontend**: Return `QueryDataResponse`

6. **Grafana Rendering**: UI renders as time series or table

## Configuration Flow

### Datasource Initialization

1. **User Action**: Add datasource in Grafana UI
   - Enters shortCode, tenantId in `jsonData` (plaintext)
   - Enters clientId, clientSecret in `secureJsonData` (encrypted)

2. **Backend Initialization** (`NewDatasource()`):
   - Parse settings from `DataSourceInstanceSettings`
   - Validate required fields
   - Create `auth.OAuthStrategy` with credentials
   - Create `metrics.Client` or `cip.Client` with config
   - SDK auto-adds required scopes:
     - Metrics: `sfcc.metrics` + `SALESFORCE_COMMERCE_API:{tenantId}`
     - CIP: CIP scope + tenant scope

3. **Health Check** (`CheckHealth()`):
   - **Metrics**: Fetch last 5 minutes of "overall" metrics
   - **CIP**: Execute `SELECT 1` test query
   - Return success or error message

### Security Model

**Credential Storage**:
- `jsonData` (visible in Grafana UI): shortCode, tenantId, accountManagerHost
- `secureJsonData` (encrypted at rest): clientId, clientSecret
  - Encrypted in Grafana database
  - Decrypted server-side into `DecryptedSecureJSONData` map
  - Never exposed to frontend

**Token Management**:
- OAuth tokens in-memory only (not persisted)
- Cache key: `host:clientId:method:scopes` (sorted, comma-joined)
- Reused until `expires_in - 60s` margin
- On 401 after prior success: invalidate + retry once
- Typical lifetime: ~3600s

**Network Security**:
- All calls over HTTPS (enforced by Go http.Client)
- TLS 1.2+ required
- OAuth client credentials flow (no user password exposure)
- Scopes enforce least-privilege access

## Performance Characteristics

### Token Caching

- **Cold start**: 1 token fetch per datasource instance
- **Warm state**: Token reused for ~3600s
- **Concurrent queries**: Single-flight token fetch (golang.org/x/oauth2)
- **Memory**: ~2KB per cached token

### HTTP Connection Pooling

- Go's default `http.Client` pools connections
- Typical: 100 idle connections, 90s keep-alive
- Reused across all queries to same host

### Query Performance

**Metrics**:
- **Small query** (5m window): ~200ms (token + API + transform)
- **Large query** (30d window): ~2-5s (depends on cardinality)
- **Parallel queries**: Plugin is goroutine-safe

**CIP**:
- **Simple aggregation** (1h window): ~500ms
- **Large scan** (13m history): ~5-30s (depends on table size)
- **Connection pooling**: CIP connections are session-scoped (sticky)

### Data Transfer

**Metrics**:
- Typical series: 1-10 data points per minute
- 24-hour query: ~1440 points per series
- JSON response: ~100 bytes per point
- Frame serialization: ~50% overhead (Grafana Arrow format)

**CIP**:
- Depends on query (SELECT * → large, aggregations → small)
- Row limit enforced (default 1000 rows for unbounded queries)
- DECIMAL columns transmitted as strings (Avatica limitation)

## Error Handling

### OAuth Errors

- **401 Unauthorized**: Invalid credentials → surface to user
- **403 Forbidden**: Insufficient scope → surface to user
- **Network timeout**: Retry with backoff (handled by SDK)

### Metrics API Errors

- **400 Bad Request**: Invalid query params → parse error message
- **404 Not Found**: Wrong endpoint → check shortCode/tenantId
- **429 Rate Limited**: Too many requests → surface retry-after
- **500 Internal Server Error**: API issue → log + surface to user

### CIP Errors

- **SQL syntax error**: Calcite validation error → surface to user
- **Connection refused**: CIP unavailable → surface to user
- **Query timeout**: Long-running query → suggest adding LIMIT

### Time Window Errors

- **Beyond retention** (Metrics): Clamp to 30 days + add warning notice
- **Invalid range**: from > to → return error

## Backend Contract

This section defines the contract between the React frontend and the Go backend.

### Metrics Query Model

The frontend sends queries with this structure:

```typescript
interface B2CMetricsQuery extends DataQuery {
  category: string;               // Required: 'overall', 'scapi', etc.
  metrics: string[];              // Optional: metric IDs to fetch
  apiFamily?: string;             // SCAPI filter
  apiName?: string;               // SCAPI filter
  apiVersion?: string;            // SCAPI filter
  ocapiCategory?: string;         // OCAPI filter
  ocapiApi?: string;              // OCAPI filter
  thirdPartyServiceId?: string;   // Third-party filter
  labelFilters?: LabelFilter[];   // Post-fetch filtering
  groupBy?: string[];             // Label keys to group by
  format: 0 | 1;                  // 0=time series, 1=table
}
```

**Backend receives**: Unmarshaled from `backend.DataQuery.JSON`

### CIP Query Model

```typescript
interface B2CCIPQuery extends DataQuery {
  rawSql: string;                 // SQL query with macros
  format: 0 | 1;                  // 0=time series, 1=table
  timeColumn?: string;            // Column with timestamps
  metricColumn?: string;          // Column with values
  fillMode?: 'null' | 'previous' | 'value';
}
```

**Backend receives**: Unmarshaled, then macros expanded before execution

### Configuration Model

**JSON Data** (plaintext):
```typescript
interface DataSourceOptions {
  shortCode: string;              // Instance short code
  tenantId: string;               // Tenant ID
  accountManagerHost?: string;    // Optional, defaults to account.demandware.com
  // CIP-specific:
  cipHost?: string;               // CIP endpoint (for CIP datasource)
}
```

**Secure JSON Data** (encrypted):
```typescript
interface SecureJsonData {
  clientId: string;               // OAuth client ID
  clientSecret: string;           // OAuth client secret
}
```

**Backend receives**: Via `backend.DataSourceInstanceSettings`
- `JSONData`: Unmarshaled from jsonData
- `DecryptedSecureJSONData`: Map with decrypted secrets

### Response Format

**Success**:
```go
backend.DataResponse{
  Frames: data.Frames{...},
  Error: nil,
}
```

**Error**:
```go
backend.DataResponse{
  Frames: nil,
  Error: fmt.Errorf("user-friendly error message"),
}
```

## Testing Strategy

### Unit Tests (SDK level)

- `auth/oauth_test.go`: OAuth flow with mock token server
- `operations/metrics/window_test.go`: Window resolution edge cases
- `operations/metrics/tags_golden_test.go`: Tag extraction (32 cases)
- `clients/metrics/*_test.go`: Metrics client + partitioning
- `clients/cip/*_test.go`: CIP client + sticky sessions

### Integration Tests (Plugin level)

- Mock Metrics API with `httptest.NewServer`
- Verify QueryData produces correct frames
- Test CheckHealth success/failure paths
- Validate CallResource routes

### Manual Testing

- Local Grafana instance with plugin installed
- Demo mode (mock server)
- Real mode (live B2C credentials)
- Verify dashboards render correctly
- Test all 9 categories + filters

## Deployment Architecture

### Development

```
Developer Machine
├── Go 1.26 toolchain
├── Grafana 9.0+ (local or Docker)
└── Plugin source code
    - Edit Go code
    - `go build ./pkg` + `go build ./pkg/cip`
    - Copy to Grafana plugins dir
    - Restart Grafana
```

### Production

```
Grafana Server (Linux)
├── /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/
│   ├── dist/gpx_b2c_metrics_linux_amd64  (binary)
│   └── src/plugin.json                    (metadata)
├── /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/
│   ├── dist/gpx_b2c_cip_linux_amd64      (binary)
│   └── src/cip/plugin.json               (metadata)
├── grafana.ini
│   - allow_loading_unsigned_plugins = salesforce-b2c-metrics-datasource,salesforce-b2c-cip-datasource
└── Grafana process (systemd)
    - Loads plugins at startup
    - Spawns binaries as subprocesses
    - Communicates via gRPC/JSON-RPC
```

### Cloud Grafana

- Upload signed plugin to Grafana Cloud
- Or use private plugin registry
- Binary built with cross-compilation for multiple platforms

## Dependencies

### Direct Dependencies

- `grafana-plugin-sdk-go` v0.257.0 (plugin framework)
- `grafana/sqlds` v4 (CIP SQL driver framework)
- `b2c-tooling-sdk-go` (local monorepo, via replace directive)

### Transitive Dependencies

- `golang.org/x/oauth2` (OAuth client)
- `google.golang.org/grpc` (plugin communication)
- `github.com/apache/arrow/go/v15` (data frames)

### Build Dependencies

- Go 1.26 toolchain
- Node.js + npm (for frontend build)
- Docker (for demo/testing)

## File Manifest

```
packages/b2c-grafana-datasource/
├── go.mod                    # Go module definition
├── go.sum                    # Dependency checksums
├── package.json              # npm scripts
├── Makefile                  # Build automation
├── docker-compose.yml        # Demo environment
│
├── README.md                 # Overview
├── docs/
│   ├── quickstart.md         # 5-minute setup
│   ├── configuration.md      # Datasource settings
│   ├── query-editor.md       # Query builder guide
│   ├── api-reference.md      # CallResource endpoints
│   └── architecture.md       # This file
│
├── pkg/
│   ├── main.go               # Metrics plugin entry
│   └── plugin/
│       └── datasource.go     # Metrics core logic
│
├── pkg/cip/
│   └── plugin/
│       ├── main.go           # CIP plugin entry
│       ├── datasource.go     # CIP core logic
│       ├── driver.go         # sqlds driver
│       └── macros.go         # SQL macro expansion
│
├── src/
│   ├── module.ts             # Metrics frontend entry
│   ├── plugin.json           # Metrics plugin metadata
│   ├── ConfigEditor.tsx      # Metrics config UI
│   ├── QueryEditor.tsx       # Metrics query UI
│   ├── datasource.ts         # Metrics DataSourceApi
│   └── types.ts              # Metrics TypeScript types
│
├── src/cip/
│   ├── module.ts             # CIP frontend entry
│   ├── plugin.json           # CIP plugin metadata
│   ├── ConfigEditor.tsx      # CIP config UI
│   ├── QueryEditor.tsx       # CIP query UI (SQL editor)
│   ├── VariableQueryEditor.tsx  # CIP variable queries
│   ├── datasource.ts         # CIP DataSourceApi
│   └── types.ts              # CIP TypeScript types
│
└── dist/                     # Build output (gitignored)
    ├── gpx_b2c_metrics       # Metrics backend binary
    ├── gpx_b2c_cip           # CIP backend binary
    ├── module.js             # Metrics frontend bundle
    └── cip/module.js         # CIP frontend bundle
```

## Parity with TypeScript SDK

The Go SDK ensures exact parity with the TypeScript SDK for:

1. **Tag Extraction**: 32 golden test cases shared between TS and Go
2. **Window Resolution**: Same retention/default/clamping logic
3. **Tenant ID Normalization**: Identical prefix stripping
4. **Timestamp Handling**: Both normalize API seconds → milliseconds
5. **OAuth Scopes**: Same scope construction

Any drift is caught by the golden test harness (`operations/metrics/catalog_parity_test.go`).

## Next Steps

- **Configuration**: Set up datasources in [Configuration Guide](./configuration.md)
- **Query Editor**: Build queries in [Query Editor Guide](./query-editor.md)
- **API Reference**: Explore CallResource endpoints in [API Reference](./api-reference.md)
