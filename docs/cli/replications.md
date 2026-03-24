---
description: Commands for publishing individual items from staging to production using Granular Replications API.
---

# Granular Replications Commands

Commands for publishing individual items (products, price tables, content assets) from staging to production environments. Provides fine-grained control over what gets replicated, rather than full-site replication.

## Authentication

Granular Replications commands require an Account Manager API Client with OAuth credentials.

### Required Scopes

The following scopes are automatically requested by the CLI:

| Scope | Description |
|-------|-------------|
| `sfcc.granular-replications.rw` | Read and write access to Granular Replications API |
| `SALESFORCE_COMMERCE_API:<tenant_id>` | Tenant-specific access scope |

### Configuration

**Recommended:** Configure credentials once via environment variables or `dw.json`:

```bash
# Environment variables (recommended for CI/CD)
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_stg
export SFCC_SHORTCODE=kv7kzm78

# Or in dw.json
{
  "client-id": "my-client",
  "client-secret": "my-secret",
  "tenant-id": "zzxy_stg",
  "short-code": "kv7kzm78"
}
```

**Alternative:** Provide credentials via command-line flags:

```bash
b2c scapi replications list --client-id xxx --client-secret xxx --tenant-id zzxy_stg
```

::: tip
Once configured via environment variables or `dw.json`, you can omit authentication flags from all commands. Examples below assume credentials are already configured.
:::

For complete setup instructions, see the [Authentication Guide](/guide/authentication#scapi-authentication).

### Available Flags

These flags are available on all Granular Replications commands (optional when configured via environment or `dw.json`):

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | Organization/tenant ID |
| `--short-code` | `SFCC_SHORTCODE` | SCAPI short code |
| `--client-id` | `SFCC_CLIENT_ID` | OAuth Client ID |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth Client Secret |

### Prerequisites

**Enterprise Feature:** Granular replications is an enterprise feature that requires:
- Permanent staging and production infrastructure
- Feature flag enabled for your organization
- Contact your Salesforce account team if you receive a 403 error

**Staging Only:** All granular replication operations must be executed from **staging instances**. Publishing from production instances will return a 422 error.

**API Limits:** Maximum 50 items can be queued per publish operation.

---

## b2c scapi replications list

List granular replication processes with optional pagination and filtering.

### Usage

```bash
b2c scapi replications list
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--limit`, `-l` | Maximum number of results | `20` |
| `--offset`, `-o` | Result offset for pagination | `0` |
| `--columns`, `-c` | Columns to display (comma-separated) | |
| `--extended`, `-x` | Show all columns | `false` |
| `--json` | Output results as JSON | `false` |

### Available Columns

Default columns: `id`, `status`, `entityType`, `entityId`, `startTime`

Extended columns (shown with `--extended`): `endTime`, `initiatedBy`

### Examples

```bash
# List recent replication processes
b2c scapi replications list

# Show more results
b2c scapi replications list --limit 50

# Show all columns
b2c scapi replications list --extended

# Custom columns
b2c scapi replications list --columns id,status,entityType

# Output as JSON
b2c scapi replications list --json
```

### Output

Default table output:

```
ID                           Status       Entity Type    Entity ID        Started
─────────────────────────────────────────────────────────────────────────────────────
xmRhi7394HymoeRkfwAAAZeg3W  completed    Product        PROD-123         2025-02-01...
ymSij8405IznpfSlgxBBBAfh4X  in_progress  Price Table    usd-list-prices  2025-02-01...

Total: 2 processes
```

---

## b2c scapi replications get

Get details of a specific replication process by ID.

### Usage

```bash
b2c scapi replications get <PROCESS_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `process-id` | Publish process ID | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--json` | Output results as JSON | `false` |

### Examples

```bash
# Get process details
b2c scapi replications get xmRhi7394HymoeRkfwAAAZeg3WiM

# Output as JSON
b2c scapi replications get xmRhi7394HymoeRkfwAAAZeg3WiM --json
```

### Output

Default formatted output:

```
Replication Process Details
────────────────────────────────────────────────────────
ID:           xmRhi7394HymoeRkfwAAAZeg3WiM
Status:       completed
Started:      2025-02-01T10:30:00Z
Completed:    2025-02-01T10:35:00Z
Initiated By: admin@example.com

Entity: Product
Product ID: PROD-123
```

For content assets, also shows:
```
Entity: Content Asset
Content ID: hero-banner
Type:       private
Site ID:    RefArch
```

---

## b2c scapi replications publish

Queue an item for granular replication (publish to production).

### Usage

```bash
# Publish a product
b2c scapi replications publish --product-id <SKU>

# Publish a price table
b2c scapi replications publish --price-table-id <TABLE_ID>

# Publish private content asset
b2c scapi replications publish --content-id <ID> \
  --content-type private --site-id <SITE_ID>

# Publish shared content asset
b2c scapi replications publish --content-id <ID> \
  --content-type shared --library-id <LIBRARY_ID>
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Required |
|------|-------------|----------|
| `--product-id` | Product ID (SKU) to publish | * |
| `--price-table-id` | Price table ID to publish | * |
| `--content-id` | Content asset ID to publish | * |
| `--content-type` | Content asset library type (`private` or `shared`) | If using `--content-id` |
| `--site-id` | Site ID (required for private content assets) | If `--content-type` is `private` |
| `--library-id` | Library ID (required for shared content assets) | If `--content-type` is `shared` |
| `--json` | Output results as JSON | No |

\* Must specify exactly one of: `--product-id`, `--price-table-id`, or `--content-id`

### Entity Types

**Products:** Publishes a single product by SKU from staging to production.

**Price Tables:** Publishes a price table (continuously valid period) from staging to production.

**Content Assets (Private):** Publishes content from a site-specific private library. Requires `--site-id`.

**Content Assets (Shared):** Publishes content from a shared library. Requires `--library-id`.

### Examples

```bash
# Publish a product
b2c scapi replications publish --product-id PROD-123

# Publish a price table
b2c scapi replications publish --price-table-id usd-list-prices

# Publish content asset from private library
b2c scapi replications publish \
  --content-id hero-banner --content-type private --site-id RefArch

# Publish content asset from shared library
b2c scapi replications publish \
  --content-id footer-links --content-type shared --library-id SharedLibrary

# Output as JSON
b2c scapi replications publish --product-id PROD-123 --json
```

### Output

Returns the process ID for tracking:

```
Item queued for publishing. Process ID: xmRhi7394HymoeRkfwAAAZeg3WiM
```

---

## b2c scapi replications wait

Wait for a granular replication process to complete by polling its status.

### Usage

```bash
b2c scapi replications wait <PROCESS_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `process-id` | Publish process ID returned by `publish` command | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--timeout`, `-t` | Timeout in seconds | `300` |
| `--interval`, `-i` | Poll interval in seconds | `5` |
| `--json` | Output results as JSON | `false` |

### Examples

```bash
# Wait with default settings (5 min timeout, 5 sec interval)
b2c scapi replications wait xmRhi7394HymoeRkfwAAAZeg3WiM

# Custom timeout and interval
b2c scapi replications wait xmRhi7394HymoeRkfwAAAZeg3WiM --timeout 600 --interval 10

# Output as JSON
b2c scapi replications wait xmRhi7394HymoeRkfwAAAZeg3WiM --json
```

### Output

Shows status updates during polling:

```
Status: in_progress
Status: in_progress
Status: completed
Process completed successfully
```

Returns the final process details when completed or failed.

---

## Common Workflows

### Complete Product Publishing Workflow

```bash
# 1. Queue product for publishing
PROCESS_ID=$(b2c scapi replications publish \
  --product-id PROD-123 \
  --json | jq -r '.id')

# 2. Wait for completion
b2c scapi replications wait $PROCESS_ID

# 3. Verify on production instance
# Log into production and confirm PROD-123 was replicated
```

### Publishing Multiple Content Assets

```bash
# Publish hero banner (private library)
b2c scapi replications publish \
  --content-id hero-banner --content-type private --site-id RefArch

# Publish footer links (shared library)
b2c scapi replications publish \
  --content-id footer-links --content-type shared --library-id SharedLibrary

# List all processes
b2c scapi replications list
```

### Error Handling

Common errors you may encounter:

**403 Forbidden - Feature Not Enabled**
```
Error: Feature not enabled for this organization
```
**Solution:** Contact Salesforce support to enable granular replications for your organization.

**422 Unprocessable Entity - Not on Staging**
```
Error: Granular replication can only be initiated from staging instances
```
**Solution:** Ensure you're running commands from a staging instance, not production.

**409 Conflict - Replication Running**
```
Error: Cannot queue items while full replication is running
```
**Solution:** Wait for full site replication to complete before queuing items.

**404 Not Found - Invalid Entity**
```
Error: Product not found
```
**Solution:** Verify the entity ID exists on your staging instance.
