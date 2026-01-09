---
name: b2c-scapi-custom
description: Salesforce B2C Commerce Custom API endpoint management Skill
---

# B2C SCAPI Custom APIs Skill

Use the `b2c` CLI plugin to manage SCAPI Custom API endpoints and check their registration status.

## Examples

### Get Custom API Endpoint Status

```bash
# list all Custom API endpoints for an organization
b2c scapi custom status --tenant-id f_ecom_zzxy_prd

# list with JSON output
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --json
```

### Filter by Status

```bash
# list only active endpoints
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --status active

# list only endpoints that failed to register
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --status not_registered
```

### Group by Type or Site

```bash
# group endpoints by API type (Admin vs Shopper)
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --group-by type

# group endpoints by site
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --group-by site
```

### Customize Output Columns

```bash
# show extended columns (includes error reasons, sites, etc.)
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --extended

# select specific columns to display
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --columns type,apiName,status,sites

# available columns: type, apiName, apiVersion, cartridgeName, endpointPath, httpMethod, status, sites, securityScheme, operationId, schemaFile, implementationScript, errorReason, id
```

### Debug Failed Registrations

```bash
# quickly find and diagnose failed Custom API registrations
b2c scapi custom status --tenant-id f_ecom_zzxy_prd --status not_registered --columns type,apiName,endpointPath,errorReason
```

### Configuration

The tenant ID and short code can be set via environment variables:
- `SFCC_TENANT_ID`: Organization/tenant ID
- `SFCC_SHORTCODE`: SCAPI short code

### More Commands

See `b2c scapi custom --help` for a full list of available commands and options.
