# SCAPI Schemas

Commands for browsing and retrieving SCAPI (Salesforce Commerce API) schema specifications.

## Global SCAPI Schemas Flags

These flags are available on all SCAPI Schemas commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | (Required) Organization/tenant ID |
| `--short-code` | `SFCC_SHORTCODE` | SCAPI short code |

## Authentication

SCAPI Schemas commands require an Account Manager API Client with OAuth credentials.

### Required Scopes

The following scopes are automatically requested by the CLI:

| Scope | Description |
|-------|-------------|
| `sfcc.scapi-schemas` | Access to SCAPI Schemas API |
| `SALESFORCE_COMMERCE_API:<tenant_id>` | Tenant-specific access scope |

### Configuration

```bash
# Set credentials via environment variables
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# Or provide via flags
b2c scapi schemas list --client-id xxx --client-secret xxx --tenant-id zzxy_prd
```

---

## b2c scapi schemas list

List available SCAPI schemas with optional filtering.

### Usage

```bash
b2c scapi schemas list --tenant-id <TENANT_ID>
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--tenant-id` | (Required) Organization/tenant ID | |
| `--api-family` | Filter by API family (e.g., shopper, admin) | |
| `--api-name` | Filter by API name (e.g., products, orders) | |
| `--api-version` | Filter by API version (e.g., v1) | |
| `--status`, `-s` | Filter by schema status (`current`, `deprecated`) | |
| `--columns`, `-c` | Columns to display (comma-separated) | |
| `--extended`, `-x` | Show all columns including extended fields | `false` |
| `--json` | Output results as JSON | `false` |

### Available Columns

Default columns: `apiFamily`, `apiName`, `apiVersion`, `status`

Extended columns (shown with `--extended`): `schemaVersion`, `link`

### Examples

```bash
# List all available SCAPI schemas
b2c scapi schemas list --tenant-id zzxy_prd

# Filter by API family
b2c scapi schemas list --tenant-id zzxy_prd --api-family shopper

# Filter by API name
b2c scapi schemas list --tenant-id zzxy_prd --api-name products

# Filter by status
b2c scapi schemas list --tenant-id zzxy_prd --status current
b2c scapi schemas list --tenant-id zzxy_prd --status deprecated

# Show extended columns
b2c scapi schemas list --tenant-id zzxy_prd --extended

# Output as JSON
b2c scapi schemas list --tenant-id zzxy_prd --json
```

### Output

Default table output:

```
Found 15 schema(s):

API Family  API Name    Version  Status
──────────────────────────────────────────
shopper     products    v1       current
shopper     orders      v1       current
shopper     customers   v1       current
admin       inventory   v1       current
...
```

---

## b2c scapi schemas get

Get a specific SCAPI schema with optional selective expansion.

### Usage

```bash
b2c scapi schemas get <apiFamily> <apiName> <apiVersion> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `apiFamily` | API family (e.g., shopper, admin) |
| `apiName` | API name (e.g., products, orders) |
| `apiVersion` | API version (e.g., v1) |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--tenant-id` | (Required) Organization/tenant ID | |
| `--expand-paths` | Paths to fully expand (comma-separated) | |
| `--expand-schemas` | Schema names to fully expand (comma-separated) | |
| `--expand-examples` | Example names to fully expand (comma-separated) | |
| `--expand-custom-properties` | Expand custom properties | `true` |
| `--no-expand-custom-properties` | Do not expand custom properties | |
| `--expand-all` | Return full schema without collapsing | `false` |
| `--list-paths` | List available paths and exit | `false` |
| `--list-schemas` | List available schema names and exit | `false` |
| `--list-examples` | List available example names and exit | `false` |
| `--yaml` | Output as YAML instead of JSON | `false` |
| `--json` | Output wrapped JSON with metadata | `false` |

### Schema Collapsing

By default, schemas are output in a collapsed/outline format optimized for context efficiency (ideal for agentic use cases and LLM consumption):

- **Paths**: Show only HTTP methods available: `{"/products": ["get", "post"]}`
- **Schemas**: Show only schema names: `{"Product": {}, "Order": {}}`
- **Examples**: Show only example names: `{"ProductExample": {}}`

Use the `--expand-*` flags for selective expansion or `--expand-all` for the full, unmodified schema.

### Examples

```bash
# Get collapsed/outline schema (default - context efficient)
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd

# Get full schema without collapsing
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --expand-all

# Expand specific paths only
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --expand-paths /products,/products/{id}

# Expand specific schemas only
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --expand-schemas Product,SearchResult

# Expand specific examples only
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --expand-examples ProductExample

# Combine selective expansions
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --expand-paths /products --expand-schemas Product

# List available paths in the schema
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --list-paths

# List available schema names
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --list-schemas

# List available examples
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --list-examples

# Output as YAML
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --yaml

# Output wrapped JSON with metadata
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --json

# Disable custom properties expansion
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --no-expand-custom-properties
```

### Output Formats

**Default (raw JSON to stdout)**: The schema is output directly to stdout as JSON. Use shell redirection to save to a file:

```bash
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd > schema.json
```

**YAML format (`--yaml`)**: Output as YAML for readability:

```bash
b2c scapi schemas get shopper products v1 --tenant-id zzxy_prd --yaml > schema.yaml
```

**Wrapped JSON (`--json`)**: Output includes metadata wrapper:

```json
{
  "apiFamily": "shopper",
  "apiName": "products",
  "apiVersion": "v1",
  "schema": { ... }
}
```

### Notes

- The collapsed output significantly reduces context size while preserving structure, making it ideal for AI/LLM consumption
- Use `--list-paths` to discover available paths before using `--expand-paths`
- Use `--list-schemas` to discover available schema names before using `--expand-schemas`
- Custom properties expansion is enabled by default and fetches tenant-specific custom attributes
