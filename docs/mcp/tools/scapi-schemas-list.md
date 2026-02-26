---
description: List or fetch SCAPI schema metadata and OpenAPI specs for standard and custom APIs.
---

# scapi_schemas_list

List or fetch SCAPI schema metadata and OpenAPI specs for standard SCAPI (Shop/Admin/Shopper) and custom APIs. Supports both discovery (list mode) and detailed schema fetching.

## Overview

The `scapi_schemas_list` tool provides two modes of operation.

1. **List (Discovery)**: Browse available schemas without fetching full OpenAPI specs.
2. **Fetch**: Retrieve complete OpenAPI schema for a specific API.

This tool works with both standard SCAPI (Shop, Admin, Shopper APIs) and custom APIs. For endpoint registration status, use [`scapi_custom_apis_status`](./scapi-custom-apis-status) instead.

## Authentication

Requires OAuth credentials. See [B2C Credentials](../configuration#b2c-credentials) (OAuth Client Credentials section) for complete details.

**Required scope:** `sfcc.scapi-schemas` (required for fetch mode)

**Note:** OAuth credentials are optional for local schema discovery (list mode), but required for fetching full schemas.

**Configuration priority:**
1. Flags (`--server`, `--client-id`, `--client-secret`)
2. Environment variables (`SFCC_SERVER`, `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`)
3. `dw.json` config file

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiFamily` | string | No | Filter by API family (for example, `"shopper"`, `"product"`, `"checkout"`, `"custom"`). Use `"custom"` for custom APIs. |
| `apiName` | string | No | Filter by API name (for example, `"shopper-products"`, `"shopper-baskets"`). |
| `apiVersion` | string | No | Filter by API version (for example, `"v1"`, `"v2"`). |
| `status` | `"current"` \| `"deprecated"` | No | Filter by schema status. Use `"current"` for active schemas, `"deprecated"` for phased-out schemas. Only works in list mode. |
| `includeSchemas` | boolean | No | Include full OpenAPI schemas. Requires all three: `apiFamily`, `apiName`, and `apiVersion`. |
| `expandAll` | boolean | No | Return the full schema without collapsing. Only works when `includeSchemas: true`. |

## Operation Modes

### List Mode (Discovery)

Omit `includeSchemas` or any identifier to browse available schemas:

**Returns:**
- `schemas` - Array of schema metadata
- `total` - Total number of schemas found
- `availableApiFamilies` - List of available API families
- `availableApiNames` - List of available API names
- `availableApiVersions` - List of available API versions

**Example prompts:**
- ✅ "Use the MCP tool to list all available SCAPI schemas."
- ✅ "Use the MCP tool to show me what checkout APIs exist." → `apiFamily: "checkout"`
- ✅ "Use the MCP tool to discover SCAPI product endpoints." → `apiFamily: "product"`
- ✅ "Use the MCP tool to list custom API definitions." → `apiFamily: "custom"`

### Fetch Mode

Set `includeSchemas: true` and provide all three identifiers (`apiFamily`, `apiName`, `apiVersion`) to fetch a complete OpenAPI schema:

**Returns:**
- Full OpenAPI schema specification
- Use `expandAll: true` to get the complete schema without collapsing

**Example prompts:**
- ✅ "Use the MCP tool to get the OpenAPI schema for shopper-baskets v1." → `apiFamily: "shopper"`, `apiName: "shopper-baskets"`, `apiVersion: "v1"`, `includeSchemas: true`
- ✅ "Use the MCP tool to show me the full OpenAPI spec for shopper-products v1." → `includeSchemas: true`, `expandAll: true`
- ✅ "Use the MCP tool to show me the loyalty-points custom API schema." → `apiFamily: "custom"`, `apiName: "loyalty-points"`, `apiVersion: "v1"`, `includeSchemas: true`

## Usage Examples

### Standard SCAPI Discovery

List all available SCAPI schemas:

```
Use the MCP tool to list all available SCAPI schemas.
```

Filter by API family:

```
Use the MCP tool to show me what checkout APIs exist.
```

### Custom API Discovery

List custom API definitions:

```
Use the MCP tool to list custom API definitions.
```

Fetch a specific custom API schema:

```
Use the MCP tool to show me the loyalty-points custom API schema.
```

### Fetch Full Schema

Get complete OpenAPI specification:

```
Use the MCP tool to get the OpenAPI schema for shopper-baskets v1.
```

Get expanded schema without collapsing:

```
Use the MCP tool to show me the full OpenAPI spec for shopper-products v1.
```

## Rules and Constraints

- `includeSchemas` requires all three identifiers: `apiFamily`, `apiName`, and `apiVersion`
- `status` only works in list mode (discovery)
- Custom APIs use `apiFamily: "custom"`
- `expandAll` only works when `includeSchemas: true`

## Output

### List Mode Output

```json
{
  "schemas": [...],
  "total": 42,
  "availableApiFamilies": ["shopper", "admin", "shop"],
  "availableApiNames": ["shopper-products", "shopper-baskets", ...],
  "availableApiVersions": ["v1", "v2"],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Fetch Mode Output

```json
{
  "openapi": "3.0.0",
  "info": {...},
  "paths": {...},
  "components": {...}
}
```

## Requirements

- OAuth credentials with `sfcc.scapi-schemas` scope (for fetch mode)
- B2C Commerce instance hostname
- Organization ID (auto-detected from credentials)

## Related Tools

- Part of the [SCAPI](../toolsets#scapi), [PWAV3](../toolsets#pwav3), and [STOREFRONTNEXT](../toolsets#storefrontnext) toolsets
- Always enabled (base toolset)
- For endpoint registration status, use [`scapi_custom_apis_status`](./scapi-custom-apis-status)

## See Also

- [SCAPI Toolset](../toolsets#scapi) - Overview of SCAPI discovery tools
- [scapi_custom_apis_status](./scapi-custom-apis-status) - Check custom API endpoint registration status
- [scapi_custom_api_scaffold](./scapi-custom-api-scaffold) - Generate a new custom API in a cartridge
- [Authentication Setup](../../guide/authentication#scapi-authentication) - Set up SCAPI authentication with required roles and scopes
- [Configuration](../configuration) - Configure OAuth credentials
- [CLI Reference](../../cli/scapi-schemas) - Equivalent CLI commands: `b2c scapi schemas list` and `b2c scapi schemas get`
