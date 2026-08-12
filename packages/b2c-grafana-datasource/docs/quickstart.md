# Quick Start Guide

Get started with the B2C Commerce Grafana datasources in 5 minutes using Docker.

## Prerequisites

- Docker 20+ with Compose v2+
- ~5 minutes for initial build

## Demo Mode with Mock Data

Demo mode runs the plugin with a local mock Metrics API for testing — no B2C credentials required.

### Launch Demo Environment

From the plugin directory (`packages/b2c-grafana-datasource`):

```bash
# Using make
make demo

# Or using docker compose directly
docker compose up --build
```

This starts two services:
- **mock-metrics** (port 8080): Mock OAuth + Metrics API with synthetic data
- **grafana** (port 3000): Grafana with both B2C datasource plugins pre-configured

### Access Grafana

1. Open http://localhost:3000 in your browser
2. Grafana is pre-configured for anonymous admin access (no login required)
3. Navigate to **Dashboards → B2C Commerce Metrics — Demo**

The demo dashboard includes panels for:
- Overall total calls
- SCAPI request latency by API family
- SCAPI cache hit rate
- OCAPI calls by category
- eCDN responses by status class
- Third-party service latency by host
- Controller latency by pipeline

### Mock Data Behavior

The provisioned datasource `B2C Commerce Metrics (Demo)` connects to the local mock server:

```yaml
jsonData:
  apiUrl: "http://mock-metrics:8080/observability/metrics/v1"
  tokenUrl: "http://mock-metrics:8080/dwsso/oauth2/access_token"
  shortCode: "demo"
  tenantId: "f_ecom_bdpx_prd"
  clientId: "demo"
secureJsonData:
  clientSecret: "demo"
```

The mock server:
- Accepts any credentials (no validation)
- Returns synthetic time-series data spanning the requested time window
- Generates realistic values per category (~1 point / 5 minutes)
- Uses packed series IDs for tag enrichment (e.g., "bdpx.product HIT", "2xx bdpx.host")

### Stop Demo

```bash
make down
# or
docker compose down
```

## Real Mode with Live B2C Tenant

Connect to a real B2C Commerce tenant using credentials from the **b2c CLI**.

### Prerequisites

- b2c CLI installed and configured (has credentials in dw.json + keychain)
- B2C Commerce tenant with Metrics API access (CLOSED BETA)
- Client credentials with `sfcc.metrics` scope

### Launch with Real Credentials

The `real` make target resolves credentials from the b2c CLI and injects them into Grafana at boot. No secrets are written to disk or committed.

```bash
# Uses the CLI instance named "bdpx-prd" by default
make real

# Or specify any configured CLI instance
make real INSTANCE=zzpq-019
```

Under the hood this:
1. Runs `b2c setup inspect -i <instance> --json --unmask` to get credentials
2. Exports `clientId`, `clientSecret`, `shortCode`, `tenantId` as `B2C_*` env vars
3. Boots `docker-compose.yml` + `docker-compose.real.yml` (swaps provisioning)
4. Backend derives real `https://{shortCode}.api.commercecloud.salesforce.com` endpoints

The provisioned datasource connects to the live Metrics API. All other steps are identical to demo mode.

## Multi-tenant Dashboards

Two ways to switch tenants without editing the datasource:

### Same-realm Multi-tenant (Recommended)

Use the **`$tenant` variable** built into the demo dashboard. When multiple tenants share the same realm and OAuth client (common for staging/production on the same realm):

1. In the dashboard, find the **Tenant** textbox variable at the top
2. Enter a tenant ID (e.g., `bdpx_stg` for staging, `bdpx_prd` for production)
3. All panels query that tenant using per-query `tenantId` override
4. Leave blank to use the datasource's configured tenant

This works when the datasource's OAuth client is authorized for all tenants (same realm/shortCode).

### Cross-realm Multi-tenant

For tenants with different credentials or shortCodes, create one datasource per tenant:

1. Add multiple datasources (one per tenant) with different credentials
2. Create a dashboard variable of type **Data source**
3. Filter to `salesforce-b2c-metrics-datasource` type
4. Panels reference `${datasource}` variable
5. Each tenant's credentials stay isolated

This is native Grafana — no plugin code needed.

## Your First Query

### Create a Visualization

1. Click **Create → Dashboard**
2. Click **Add visualization**
3. Select **Salesforce B2C Commerce Metrics** as datasource

### Configure Query

Start with a simple query to verify connectivity:

**Category**: `overall` (shows high-level system metrics)

Click **Run Query** — you should see time-series data appear.

### Example Queries

**Monitor SCAPI Performance**:
- Category: `scapi`
- API Family: `product`
- API Name: `shopper-products`

Shows request rates, latency, error rates for Product API.

**Track eCDN Edge Performance**:
- Category: `ecdn`

Shows edge CDN cache hits/misses, bandwidth, errors across all PoPs.

**OCAPI Usage**:
- Category: `ocapi`
- OCAPI Category: `shop`

Shows OCAPI shop endpoint performance.

## Query Editor Basics

### Metrics Datasource

The query editor has three tiers of filtering:

1. **Category** (required): Select metric category (overall, scapi, ecdn, etc.)
2. **Metrics** (multi-select): Choose specific metrics to display
3. **Filters** (category-specific): Narrow by API family, host, etc.
4. **Label Filters** (optional): Post-fetch filtering on any enriched tag
5. **Group By** (optional): Controls series naming in legends

### CIP Datasource

The CIP datasource lets you query the analytics warehouse with raw SQL:

1. Write Calcite SQL in the editor
2. Use time macros: `$__timeFilter(column)`, `$__timeGroup(column, $__interval)`, `$__timeGroupAlias(column, $__interval)`
3. Browse available tables via **Schema Browser**
4. Use template variables for dynamic queries

See [Query Editor Guide](./query-editor.md) for details.

## Time Range Handling

- **Metrics retention**: 30 days maximum
- **Default window**: 24 hours (when not specified)
- **Clamping**: Queries beyond 30 days are automatically clamped with a warning notice
- **CIP retention**: Varies by table (typically 13 months for fact tables)

## Troubleshooting

### Plugin Not Loading

**Symptom**: Grafana shows "Plugin not found" or "Failed to load plugin"

**Solutions**:

1. **Unsigned plugin not allowed**:
   - Verify `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS` includes plugin IDs:
     - `salesforce-b2c-metrics-datasource`
     - `salesforce-b2c-cip-datasource`
   - Check Grafana logs: `make logs`

2. **Backend binary architecture mismatch**:
   - Grafana looks for `gpx_b2c_metrics_<goos>_<goarch>` matching the container
   - Dockerfile builds for both `linux_amd64` and `linux_arm64`
   - If different architecture, rebuild with `make build-backend`

3. **Missing files in plugin directory**:
   - Verify each plugin directory contains:
     - `plugin.json`
     - `module.js`
     - `img/logo.svg`
     - Backend binary (`gpx_b2c_metrics_linux_amd64` or `gpx_b2c_cip_linux_amd64`)

### Backend Logs

To see backend plugin logs:

```bash
# Follow all logs (includes backend)
make logs

# Or filter for plugin logs
docker compose logs -f grafana | grep gpx_b2c
```

### Mock Metrics Service Not Responding

**Symptom**: "Failed to connect to Metrics API" in health check

**Solutions**:

1. Check mock-metrics is running:
   ```bash
   docker compose ps mock-metrics
   ```

2. Verify network connectivity:
   ```bash
   docker compose exec grafana wget -O- http://mock-metrics:8080/dwsso/oauth2/access_token
   ```

3. Check mock-metrics logs:
   ```bash
   docker compose logs mock-metrics
   ```

### Dashboard Shows No Data

**Possible causes**:

1. **Time range too narrow**: Mock generates ~1 point / 5 minutes. Expand to 6h or more.
2. **Wrong datasource UID**: Verify panels reference correct datasource UID
3. **Backend not fetching data**: Test datasource via **Connections → Data sources → [datasource] → Save & Test**

### Health Check Fails: "401 Unauthorized"

**Cause**: Invalid client credentials

**Fix**:
1. Verify Client ID and Secret are correct
2. Ensure client has `sfcc.metrics` scope
3. Check tenant ID format (should be `bdpx_prd`, not `f_ecom_bdpx_prd`)

### Health Check Fails: "403 Forbidden"

**Cause**: Client lacks tenant scope

**Fix**:
1. Verify tenant ID matches your B2C instance
2. Ensure client has access to the specified tenant
3. Check short code is correct for the tenant

### "Time range was clamped" Warning

**This is normal**: Metrics API retains 30 days. Queries beyond that are automatically adjusted. The warning just informs you the range was changed.

## Next Steps

- **Configuration**: Learn about datasource settings in [Configuration Guide](./configuration.md)
- **Query Editor**: Master the query builders in [Query Editor Guide](./query-editor.md)
- **Architecture**: Understand how it works in [Architecture Guide](./architecture.md)
- **API Reference**: CallResource endpoints in [API Reference](./api-reference.md)
