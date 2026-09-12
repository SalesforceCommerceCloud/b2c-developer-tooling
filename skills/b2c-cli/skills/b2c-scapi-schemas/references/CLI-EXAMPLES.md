# SCAPI Schema CLI Examples


### List Available Schemas

```bash
# list all available SCAPI schemas (uses configured tenant)
b2c scapi schemas list

# list with JSON output
b2c scapi schemas list --json

# target a different tenant than the active config
b2c scapi schemas list --tenant-id zzxy_prd
```

### Filter Schemas

```bash
# filter by API family (e.g., product, checkout, search)
b2c scapi schemas list --api-family product

# filter by API name
b2c scapi schemas list --api-name shopper-products

# filter by status
b2c scapi schemas list --status current
```

### Get Schema (Collapsed/Outline - Default)

By default, schemas are output in a collapsed format optimized for context efficiency. This is ideal for agentic use cases and LLM consumption.

```bash
# get collapsed schema (paths show methods, schemas show names only)
b2c scapi schemas get product shopper-products v1

# save to file
b2c scapi schemas get product shopper-products v1 > schema.json
```

### Get Schema with Selective Expansion

Expand only the parts of the schema you need:

```bash
# expand specific paths
b2c scapi schemas get product shopper-products v1 --expand-paths /products,/products/{productId}

# expand specific schemas
b2c scapi schemas get product shopper-products v1 --expand-schemas Product,ProductResult

# combine expansions
b2c scapi schemas get product shopper-products v1 --expand-paths /products --expand-schemas Product
```

### Get Full Schema

```bash
# get full schema without any collapsing
b2c scapi schemas get product shopper-products v1 --expand-all
```

### List Available Paths/Schemas/Examples

Discover what's available in a schema before expanding:

```bash
# list all paths in the schema
b2c scapi schemas get product shopper-products v1 --list-paths

# list all schema names
b2c scapi schemas get product shopper-products v1 --list-schemas

# list all examples
b2c scapi schemas get product shopper-products v1 --list-examples
```

### Output Formats

```bash
# output as YAML
b2c scapi schemas get product shopper-products v1 --yaml

# output wrapped JSON with metadata (apiFamily, apiName, apiVersion, schema)
b2c scapi schemas get product shopper-products v1 --json
```

### Custom Properties

```bash
# include custom properties (default behavior)
b2c scapi schemas get product shopper-products v1

# exclude custom properties
b2c scapi schemas get product shopper-products v1 --no-expand-custom-properties
```

### Configuration Overrides

The tenant ID and short code can be overridden via flags or environment variables:

- `--tenant-id` / `SFCC_TENANT_ID` / `tenantId` in dw.json
- `--short-code` / `SFCC_SHORTCODE` / `shortCode` in dw.json

### More Commands

See `b2c scapi schemas --help` for a full list of available commands and options.
