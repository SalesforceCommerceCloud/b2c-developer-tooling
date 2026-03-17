---
description: Check the registration status of custom SCAPI endpoints deployed on your B2C Commerce instance.
---

# scapi_custom_apis_get_status

List custom SCAPI endpoint registration status (active/not_registered). Returns one row per endpoint per site with detailed status information.

## Overview

Checks the registration status of custom API endpoints deployed on your B2C Commerce instance. Returns endpoint status (`active` or `not_registered`) with per-site details.

**Note:** This tool queries your live instance. For schema definitions, use [`scapi_schemas_list`](./scapi-schemas-list) with `apiFamily: "custom"`. To create a new custom API, use [`scapi_custom_api_generate_scaffold`](./scapi-custom-api-generate-scaffold).

## Authentication

Requires OAuth credentials. See [B2C Credentials](../configuration#b2c-credentials-dwjson) for complete details.

**Required scope:** `sfcc.custom-apis` (see [Configuring Scopes](../../guide/authentication#configuring-scopes))

**Configuration priority:**
1. Flags (`--server`, `--client-id`, `--client-secret`)
2. Environment variables (`SFCC_SERVER`, `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`)
3. `dw.json` config file


## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `"active"` \| `"not_registered"` | No | Filter by endpoint status. Omit to return all endpoints. |
| `groupBy` | `"site"` \| `"type"` | No | Group output by `siteId` or `type` (Admin/Shopper). Omit for flat list. |
| `columns` | string | No | Comma-separated field names to include. Omit for defaults (7 fields). Use all field names for complete data. |

### Available Columns

Default output includes: `type`, `apiName`, `cartridgeName`, `endpointPath`, `httpMethod`, `status`, `siteId`. Use the `columns` parameter to customize fields or include all available fields.

## Usage Examples

### List All Endpoints

List all custom API endpoints:

```
Use the MCP tool to list custom SCAPI endpoints on my instance.
```

### Filter by Status

Show only active endpoints:

```
Use the MCP tool to list only active custom API endpoints.
```

Find endpoints that failed to register:

```
Use the MCP tool to find custom API endpoints that failed to register.
```

### Group by Site

Group endpoints by site:

```
Use the MCP tool to list custom API endpoints grouped by site.
```

### Group by Type

Group endpoints by API type (Admin/Shopper):

```
Use the MCP tool to list custom API endpoints grouped by type.
```

### Custom Columns

Show specific fields:

```
Use the MCP tool to show only apiName and status for active endpoints.
```

Show all fields:

```
Use the MCP tool to show endpoint details with all fields.
```


## Requirements

- OAuth credentials with `sfcc.custom-apis` scope
- B2C Commerce instance hostname
- Custom APIs deployed on the instance

## Related Tools

- Part of the [SCAPI](../toolsets#scapi), [PWAV3](../toolsets#pwav3), and [STOREFRONTNEXT](../toolsets#storefrontnext) toolsets
- Always enabled (base toolset)
- For schema definitions, use [`scapi_schemas_list`](./scapi-schemas-list) with `apiFamily: "custom"`

## See Also

- [SCAPI Toolset](../toolsets#scapi) - Overview of SCAPI discovery tools
- [scapi_schemas_list](./scapi-schemas-list) - List and fetch SCAPI schemas
- [Authentication Setup](../../guide/authentication#scapi-authentication) - Set up SCAPI authentication with required roles and scopes
- [Configuration](../configuration) - Configure OAuth credentials
- [CLI Reference](../../cli/custom-apis) - Equivalent CLI command: `b2c scapi custom status`
