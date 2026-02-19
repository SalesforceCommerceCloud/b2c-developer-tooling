---
description: Check registration status of custom SCAPI endpoints deployed on your B2C instance.
---

# scapi_custom_apis_status

List custom SCAPI endpoint registration status (active/not_registered). Returns one row per endpoint per site with detailed status information.

## Overview

The `scapi_custom_apis_status` tool checks the registration status of custom API endpoints deployed on your B2C Commerce instance. It:

- Returns individual HTTP endpoints (e.g., `GET /hello`, `POST /items/{id}`)
- Shows registration status: `active` or `not_registered`
- Provides per-site details (one row per endpoint per site)
- Supports filtering, grouping, and column selection

**Important:** This tool is **remote only** - it queries your live instance. For schema definitions, use [`scapi_schemas_list`](./scapi-schemas-list) with `apiFamily: "custom"`.

## Authentication

Requires OAuth credentials with the `sfcc.custom-apis` scope:

- `hostname` - B2C instance hostname
- `client-id` - OAuth client ID
- `client-secret` - OAuth client secret
- OAuth scope: `sfcc.custom-apis` (required)

**Configuration priority:**
1. Flags (`--server`, `--client-id`, `--client-secret`)
2. Environment variables (`SFCC_SERVER`, `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`)
3. `dw.json` config file

**Note:** Instance configuration (shortCode, tenantId) is also required and is auto-detected from credentials.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `"active"` \| `"not_registered"` | No | Filter by endpoint status. Omit to return all endpoints. |
| `groupBy` | `"site"` \| `"type"` | No | Group output by `siteId` or `type` (Admin/Shopper). Omit for flat list. |
| `columns` | string | No | Comma-separated field names to include. Omit for defaults (7 fields). Use all field names for complete data. |

### Available Columns

**Default columns (7 fields):**
- `type` - API type (Admin/Shopper)
- `apiName` - Custom API name
- `cartridgeName` - Cartridge containing the endpoint
- `endpointPath` - Endpoint path (e.g., `/hello`)
- `httpMethod` - HTTP method (GET, POST, etc.)
- `status` - Registration status (active/not_registered)
- `siteId` - Site ID

**All available fields:**
- `type`, `apiName`, `apiVersion`, `cartridgeName`, `endpointPath`, `httpMethod`, `status`, `siteId`, `securityScheme`, `operationId`, `schemaFile`, `implementationScript`, `errorReason`, `id`

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

## Output

### Default Output

Returns endpoints with 7 default fields:

```json
{
  "endpoints": [
    {
      "type": "Shopper",
      "apiName": "loyalty-points",
      "cartridgeName": "app_custom",
      "endpointPath": "/hello",
      "httpMethod": "GET",
      "status": "active",
      "siteId": "RefArch"
    }
  ],
  "total": 1,
  "activeCodeVersion": "v1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Grouped Output

When `groupBy` is set, returns grouped structure:

```json
{
  "groups": {
    "RefArch": [...],
    "SiteGenesis": [...]
  },
  "total": 5,
  "activeCodeVersion": "v1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Error Output

On authentication or API errors:

```json
{
  "total": 0,
  "activeCodeVersion": null,
  "remoteError": "Failed to fetch remote endpoints: ...",
  "message": "Failed to fetch Custom API endpoints: ...",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Use Cases

- **Verify deployment**: Check if custom API endpoints are properly registered
- **Troubleshoot registration failures**: Find endpoints with `not_registered` status
- **Per-site analysis**: See which endpoints are active for each site
- **API type filtering**: Distinguish between Admin and Shopper APIs

## Requirements

- OAuth credentials with `sfcc.custom-apis` scope
- B2C Commerce instance hostname
- Instance configuration (shortCode, tenantId) - auto-detected
- Custom APIs deployed on the instance

## Error Handling

The tool returns a `remoteError` field if:

- OAuth authentication fails
- `sfcc.custom-apis` scope is missing
- Instance configuration is invalid
- API request fails

Check the `message` field for detailed error information.

## Related Tools

- Part of the **[SCAPI](../toolsets#scapi)**, **[PWAV3](../toolsets#pwav3)**, and **[STOREFRONTNEXT](../toolsets#storefrontnext)** toolsets
- Always enabled (base toolset)
- For schema definitions, use [`scapi_schemas_list`](./scapi-schemas-list) with `apiFamily: "custom"`

## See Also

- [SCAPI Toolset](../toolsets#scapi) - Overview of SCAPI discovery tools
- [scapi_schemas_list](./scapi-schemas-list) - List and fetch SCAPI schemas
- [Configuration](../configuration) - Configure OAuth credentials
- [CLI Reference](../../cli/custom-apis) - Equivalent CLI command: `b2c scapi custom status`
