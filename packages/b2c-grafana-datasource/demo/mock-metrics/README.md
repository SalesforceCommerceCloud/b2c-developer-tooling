# Mock Metrics + OAuth Server

A standalone Go HTTP server that provides synthetic time-series data for B2C Commerce Metrics API demo dashboards.

## Endpoints

### OAuth Token Endpoint
- **Path**: `POST /dwsso/oauth2/access_token`
- **Response**: Returns a well-formed JWT-ish token with `sfcc.metrics` scope
- **Example**:
  ```bash
  curl -X POST http://localhost:8080/dwsso/oauth2/access_token
  ```

### Metrics Endpoint
- **Path**: `GET /observability/metrics/v1/organizations/{organizationId}/metrics/{category}`
- **Query Parameters**:
  - `from` (required): Start time in epoch seconds
  - `to` (required): End time in epoch seconds
  - `apiFamily` (optional): Filter SCAPI metrics by API family
  - `apiName` (optional): Filter SCAPI metrics by API name
  - `ocapiCategory` (optional): Filter OCAPI metrics by category (shop/data)
  - `ocapiApi` (optional): Filter OCAPI metrics by API
  - `thirdPartyServiceId` (optional): Filter third-party metrics by service ID

#### Supported Categories
- `overall` - Total calls across all services
- `sales` - Order revenue and counts
- `ecdn` - Edge CDN status counts
- `third-party` - Third-party service calls and latency
- `scapi` - SCAPI calls, status, cache, and latency
- `scapi-hooks` - SCAPI hook invocations and latency
- `mrt` - Lambda function invocations and duration
- `controller` - Controller invocation counts and latency
- `ocapi` - OCAPI calls and latency

#### Example Requests

```bash
# Overall metrics
curl 'http://localhost:8080/observability/metrics/v1/organizations/f_ecom_bdpx_prd/metrics/overall?from=1720000000&to=1720010000'

# SCAPI metrics with filter
curl 'http://localhost:8080/observability/metrics/v1/organizations/f_ecom_bdpx_prd/metrics/scapi?from=1720000000&to=1720010000&apiFamily=product'

# Third-party metrics
curl 'http://localhost:8080/observability/metrics/v1/organizations/f_ecom_bdpx_prd/metrics/third-party?from=1720000000&to=1720010000'

# OCAPI metrics with filter
curl 'http://localhost:8080/observability/metrics/v1/organizations/f_ecom_bdpx_prd/metrics/ocapi?from=1720000000&to=1720010000&ocapiCategory=shop'
```

## Response Format

All metrics endpoints return JSON with the following structure:

```json
{
  "data": [
    {
      "metricId": "totalCalls",
      "title": "Total Calls",
      "description": "Total API calls across all services",
      "unit": "calls",
      "dataSeries": [
        {
          "id": "bdpx.total",
          "name": "total",
          "data": [
            {"timestamp": 1720000000, "value": 5234.5},
            {"timestamp": 1720000300, "value": 5421.2}
          ]
        }
      ]
    }
  ]
}
```

## Synthetic Data

The mock server generates synthetic time-series data with the following characteristics:

- **Time Points**: ~1 data point every 5 minutes within the requested `[from, to]` window
- **Timestamps**: Epoch seconds (matching the real API format)
- **Values**: Deterministic but varied using sine waves with jitter to simulate realistic patterns
- **Series IDs**: Realistic packed format for tag enrichment (e.g., `bdpx.product HIT`, `2xx bdpx.host`)
- **Realm**: All series use realm `bdpx`

### Series ID Patterns by Category

- **SCAPI**: `bdpx.product`, `bdpx.custom`, `bdpx.product HIT`, `bdpx.product MISS`, `bdpx.product 2xx`
- **OCAPI**: `bdpx.shop`, `bdpx.data`
- **eCDN**: `2xx bdpx.host`, `3xx bdpx.host`, `4xx bdpx.host`, `5xx bdpx.host`
- **Third-Party**: `bdpx.login.salesforce.com`, `bdpx.api.stripe.com`
- **Controllers**: `bdpx.Product-Show`, `bdpx.Search-Show`, `bdpx.Cart-AddProduct`

## Running the Server

### Standalone (go run)
```bash
cd /Users/clavery/code/b2c-developer-tooling/feature-grafana/packages/b2c-grafana-datasource/demo/mock-metrics
go run .
```

### Build and Run
```bash
go build -o mock-metrics .
./mock-metrics
```

### Docker
```bash
docker build -t mock-metrics .
docker run -p 8080:8080 mock-metrics
```

### Docker Compose
The server is configured as the `mock-metrics` service in the parent demo's `docker-compose.yml`, accessible at `http://mock-metrics:8080` from other services.

## Configuration

The server listens on port `8080` by default. This is fixed in the code but can be changed in `main.go` if needed.

## Use in Grafana Datasource

Configure the B2C Metrics datasource with:

```json
{
  "shortCode": "demo",
  "tenantId": "f_ecom_bdpx_prd",
  "clientId": "demo",
  "apiUrl": "http://mock-metrics:8080/observability/metrics/v1",
  "tokenUrl": "http://mock-metrics:8080/dwsso/oauth2/access_token"
}
```

With `secureJsonData.clientSecret = "demo"`.
