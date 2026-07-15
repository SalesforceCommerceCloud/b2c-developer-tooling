# Configuration Guide

Complete guide to configuring the B2C Commerce datasources in Grafana.

## Datasource Types

The B2C Commerce plugin provides two datasource types:

1. **Salesforce B2C Commerce Metrics** (`salesforce-b2c-metrics-datasource`)
   - Access to the Metrics API (9 endpoint categories)
   - Time-series metrics for SCAPI, OCAPI, eCDN, MRT, etc.
   - 30-day retention

2. **Salesforce B2C Commerce Intelligence (CIP)** (`salesforce-b2c-cip-datasource`)
   - Raw SQL access to the CIP analytics warehouse
   - Calcite SQL dialect with Grafana time macros
   - Typically 13-month retention

Both datasources use OAuth2 client credentials flow and support multi-tenant configurations.

## Adding a Datasource

### Via Grafana UI

1. Navigate to **Configuration → Data sources** (or **Connections → Data sources** in Grafana 10+)
2. Click **Add data source**
3. Search for **Salesforce B2C Commerce Metrics** or **Salesforce B2C Commerce Intelligence (CIP)**
4. Configure settings (see below)
5. Click **Save & Test**

### Via Provisioning

For automated deployments, use Grafana's provisioning system. Create a YAML file in `/etc/grafana/provisioning/datasources/`:

```yaml
apiVersion: 1
datasources:
  - name: B2C Commerce Metrics
    type: salesforce-b2c-metrics-datasource
    access: proxy
    uid: b2c-metrics-prod
    jsonData:
      shortCode: kv7kzm78
      tenantId: bdpx_prd
      accountManagerHost: account.demandware.com
    secureJsonData:
      clientId: your-client-id
      clientSecret: your-client-secret
```

## Configuration Fields

### Metrics Datasource

#### JSON Data (plaintext, stored in Grafana database)

- **Short Code** (required): Your B2C instance short code (e.g., `kv7kzm78`)
  - Found in Business Manager URL or from Account Manager
  - Used to construct API endpoint: `https://{shortCode}.api.commercecloud.salesforce.com`

- **Tenant ID** (required): Your tenant/realm ID (e.g., `bdpx_prd`)
  - Format: `{realm}_{environment}` (e.g., `bdpx_prd`, `bdpx_stg`)
  - Or prefixed: `f_ecom_bdpx_prd` (backend normalizes automatically)
  - Used for OAuth scoping and organization ID

- **Account Manager Host** (optional): OAuth token endpoint host
  - Default: `account.demandware.com`
  - Only change if using a non-standard Account Manager instance

#### Secure JSON Data (encrypted at rest)

- **Client ID** (required): OAuth client ID
  - Must have `sfcc.metrics` scope
  - Obtain from Account Manager

- **Client Secret** (required): OAuth client secret
  - Stored encrypted in Grafana database
  - Decrypted only server-side during API calls

### CIP Datasource

#### JSON Data

- **CIP Host** (required): CIP query endpoint host
  - Format: `https://cip-{region}.commercecloud.salesforce.com`
  - Example: `https://cip-us.commercecloud.salesforce.com`

- **Tenant ID** (required): Same as Metrics datasource

- **Account Manager Host** (optional): Same as Metrics datasource

#### Secure JSON Data

- **Client ID** (required): OAuth client ID
  - Must have appropriate CIP query scope

- **Client Secret** (required): OAuth client secret

## OAuth Authentication

Both datasources use OAuth2 **client credentials flow**:

1. Backend exchanges client ID + secret for access token
2. Token cached in memory (scope-specific) until expiry
3. Token includes required scopes:
   - Metrics: `sfcc.metrics` + `SALESFORCE_COMMERCE_API:{tenantId}`
   - CIP: CIP-specific scope + tenant scope
4. Auto-refresh on 401 (token expiry)

### Token Caching

- **Cache key**: `host:clientId:method:scopes` (sorted, comma-joined)
- **Lifetime**: Token reused until `expires_in - 60s` margin
- **Memory**: ~2KB per cached token
- **Concurrency**: Single-flight token fetch (prevents duplicate requests)

### Security Model

- **Credentials storage**:
  - Client ID: Stored plaintext (non-sensitive identifier)
  - Client Secret: Encrypted in Grafana database, decrypted server-side only
- **Token storage**: In-memory only (never persisted to disk)
- **Network**: All calls over HTTPS (TLS 1.2+)

## Multi-tenant Configuration

### Scenario 1: Same Realm, Multiple Environments

When staging and production share the same realm and OAuth client:

**Option A: Single datasource + dashboard variable**

1. Configure datasource with default tenant (e.g., `bdpx_prd`)
2. Create dashboard variable `$tenant` (type: Text box)
3. Queries can override `tenantId` per panel
4. User enters tenant in variable (e.g., `bdpx_stg`)

This leverages the Metrics datasource's per-query `tenantId` override feature.

**Option B: Multiple datasources**

1. Add one datasource per environment
2. Name them descriptively: `B2C Metrics (Production)`, `B2C Metrics (Staging)`
3. Create dashboard variable of type **Data source**, filtered to `salesforce-b2c-metrics-datasource`
4. Panels reference `${datasource}` variable

### Scenario 2: Different Realms or Credentials

When tenants have different shortCodes or OAuth clients:

1. Add one datasource per tenant (each with its own credentials)
2. Use datasource template variable for dynamic switching
3. Each tenant's credentials stay isolated

## Health Check

The **Save & Test** button runs a health check:

### Metrics Datasource Health Check

1. Validates required fields (shortCode, tenantId, credentials)
2. Acquires OAuth token
3. Fetches last 5 minutes of "overall" metrics
4. Returns success or error message

**Success**: "Successfully connected to B2C Commerce Metrics API"

**Common Errors**:
- **401 Unauthorized**: Invalid client ID or secret
- **403 Forbidden**: Client lacks tenant scope or `sfcc.metrics` scope
- **404 Not Found**: Wrong shortCode or tenant ID
- **Network error**: Firewall, DNS, or connectivity issue

### CIP Datasource Health Check

1. Validates configuration
2. Acquires OAuth token
3. Executes `SELECT 1` test query
4. Returns success or error message

## Advanced Settings

### Custom API Endpoints (Demo/Testing)

For local development or custom deployments, you can override API endpoints:

```yaml
jsonData:
  apiUrl: "http://localhost:8080/observability/metrics/v1"
  tokenUrl: "http://localhost:8080/dwsso/oauth2/access_token"
  shortCode: "demo"
  tenantId: "f_ecom_bdpx_prd"
```

This is used by the demo Docker Compose setup (connects to mock server).

### Timeout Configuration

Currently uses Go's default HTTP client settings:
- **Connection timeout**: 30s
- **Keep-alive**: 90s
- **Idle connections**: 100 per host

Future versions may expose timeout configuration in the UI.

## Datasource Permissions

Grafana's datasource permissions control who can:
- **Query**: Execute queries against the datasource
- **View**: See datasource configuration (except secrets)
- **Edit**: Modify datasource settings
- **Admin**: Delete datasource, manage permissions

For shared Grafana instances, restrict **Edit** and **Admin** permissions to platform admins.

## Best Practices

### Credential Management

1. **Use dedicated OAuth clients** per Grafana instance (isolates token usage)
2. **Rotate secrets** regularly (update secureJsonData)
3. **Audit access logs** in Account Manager

### Multi-tenant Strategy

1. **Same realm**: Use single datasource + dashboard variables
2. **Different realms**: Use separate datasources
3. **Credential isolation**: Never share OAuth clients across security boundaries

### CIP Read-only Access

**Important**: CIP datasource executes arbitrary SQL entered in the query editor. Grafana editors are trusted users, but as a defense-in-depth measure:

1. Use a **read-only database account** for CIP datasource credentials
2. Grant `SELECT` privileges only (no `INSERT`, `UPDATE`, `DELETE`)
3. Limit to necessary tables/schemas via database permissions

The CIP backend attempts to validate queries start with `SELECT`, but SQL injection via template variables is possible. Read-only credentials limit blast radius.

### Network Security

- **Firewall**: Allow Grafana server outbound HTTPS (443) to:
  - `account.demandware.com` (OAuth)
  - `{shortCode}.api.commercecloud.salesforce.com` (Metrics)
  - `cip-{region}.commercecloud.salesforce.com` (CIP)
- **TLS**: Enforce TLS 1.2+ (Go default)
- **Certificate validation**: Default enabled (disable only for testing with self-signed certs)

## Troubleshooting Configuration

### "Failed to parse settings"

- **Cause**: Invalid JSON in jsonData or secureJsonData
- **Fix**: Verify JSON syntax in provisioning YAML, or re-enter via UI

### "Missing required field: shortCode"

- **Cause**: Configuration incomplete
- **Fix**: Fill in all required fields before saving

### Token acquisition hangs

- **Cause**: Network connectivity to Account Manager blocked
- **Fix**: Check firewall rules, DNS resolution for `account.demandware.com`

### "Tenant not found"

- **Cause**: Tenant ID doesn't match any authorized tenant for this client
- **Fix**: Verify tenant ID format and client authorization in Account Manager

## Next Steps

- **Query Editor**: Learn how to build queries in [Query Editor Guide](./query-editor.md)
- **Architecture**: Understand token caching and request flow in [Architecture Guide](./architecture.md)
