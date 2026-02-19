---
name: b2c-docs
description: Search and read B2C Commerce (SFCC/Demandware) Script API documentation and XSD schemas with the b2c cli. Always reference when using the CLI to search or read Script API documentation, look up dw.* classes, or browse XSD schemas. Also use when writing B2C scripts, answering "how do I" questions about URLs/products/orders, or verifying class methods and properties.
---

# B2C Docs Skill

Use the `b2c` CLI to search and read bundled Script API documentation and XSD schemas for Salesforce B2C Commerce.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli docs search ProductMgr`).

## Examples

### Search Documentation

```bash
# Search for a class by name
b2c docs search ProductMgr

# Search with partial match
b2c docs search "catalog product"

# Limit results
b2c docs search status --limit 5

# List all available documentation
b2c docs search --list
```

### Read Documentation

```bash
# Read documentation for a class (renders in terminal)
b2c docs read ProductMgr

# Read by fully qualified name
b2c docs read dw.catalog.ProductMgr

# Output raw markdown (for piping)
b2c docs read ProductMgr --raw

# Output as JSON
b2c docs read ProductMgr --json
```

### Download Documentation

Download the latest Script API documentation from a B2C Commerce instance:

```bash
# Download to a directory
b2c docs download ./my-docs

# Download with specific server
b2c docs download ./docs --server sandbox.demandware.net

# Keep the original archive
b2c docs download ./docs --keep-archive
```

### Read XSD Schemas

Read bundled XSD schema files for import/export data formats:

```bash
# Read a schema by name
b2c docs schema catalog

# Fuzzy match schema name
b2c docs schema order

# List all available schemas
b2c docs schema --list

# Output as JSON
b2c docs schema catalog --json
```

## Common Classes

| Class | Description |
|-------|-------------|
| `dw.catalog.ProductMgr` | Product management and queries |
| `dw.catalog.Product` | Product data and attributes |
| `dw.order.Basket` | Shopping basket operations |
| `dw.order.Order` | Order processing |
| `dw.customer.CustomerMgr` | Customer management |
| `dw.system.Site` | Site configuration |
| `dw.web.URLUtils` | URL generation utilities |

## Common Schemas

| Schema | Description |
|--------|-------------|
| `catalog` | Product catalog import/export |
| `order` | Order data import/export |
| `customer` | Customer data import/export |
| `inventory` | Inventory data import/export |
| `pricebook` | Price book import/export |
| `promotion` | Promotion definitions |
| `coupon` | Coupon codes import/export |
| `jobs` | Job step definitions |

## More Commands

See `b2c docs --help` for a full list of available commands and options.
