---
description: List or fetch SCAPI schema metadata and OpenAPI specs for standard and custom APIs.
---

# SCAPI Schemas

MCP tools for discovering and retrieving SCAPI schemas. Available in the **SCAPI**, **PWAV3**, and **STOREFRONTNEXT** toolsets (SCAPI is always enabled).

## scapi_schemas_list

Browse available SCAPI schemas (list mode) or fetch complete OpenAPI specifications (fetch mode). Works with standard SCAPI (Shop/Admin/Shopper) and custom APIs.

### Authentication

Requires OAuth credentials with `sfcc.scapi-schemas` scope. See [B2C Credentials](../configuration#b2c-credentials-dwjson) for complete details. For scope configuration, see [Configuring Scopes](../../guide/authentication#configuring-scopes).

**Configuration priority:** Flags → Environment variables → `dw.json` config file

### Parameters

| Parameter        | Type                          | Required | Description                                                                                                  |
| ---------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `apiFamily`      | string                        | No       | Filter by API family (e.g., `"shopper"`, `"product"`, `"checkout"`, `"custom"`). Custom APIs use `"custom"`. |
| `apiName`        | string                        | No       | Filter by API name (e.g., `"shopper-products"`, `"shopper-baskets"`).                                        |
| `apiVersion`     | string                        | No       | Filter by API version (e.g., `"v1"`, `"v2"`).                                                                |
| `status`         | `"current"` \| `"deprecated"` | No       | Filter by schema status. Only works in list mode.                                                            |
| `includeSchemas` | boolean                       | No       | Fetch full OpenAPI schema. Requires all three: `apiFamily`, `apiName`, and `apiVersion`.                     |
| `expandAll`      | boolean                       | No       | Return the full schema without collapsing. Requires `includeSchemas: true`.                                  |

**List mode:** omit `includeSchemas` or any identifier to browse available schemas.  
**Fetch mode:** set `includeSchemas: true` and provide all three identifiers (`apiFamily`, `apiName`, `apiVersion`).

**Returns (list mode):** `{schemas, total, availableApiFamilies, availableApiNames, availableApiVersions, timestamp}`.  
**Returns (fetch mode):** Full OpenAPI schema specification (JSON). Use `expandAll: true` to get the complete schema without collapsing.

### Usage

List all available schemas:

```
List all available SCAPI schemas.
```

Fetch a specific schema:

```
Get the OpenAPI schema for shopper-baskets v1.
```

Discover custom APIs:

```
List custom API definitions.
```

## See Also

- [SCAPI Custom APIs](./scapi-custom-apis) - Scaffold custom endpoints and check their registration status
- [SCAPI Toolset](../toolsets#scapi) - Overview of SCAPI discovery tools
- [Authentication Setup](../../guide/authentication#scapi-authentication) - Set up SCAPI authentication with required roles and scopes
- [Configuration](../configuration) - Configure OAuth credentials
- [CLI Reference](../../cli/scapi-schemas) - Equivalent CLI commands: `b2c scapi schemas list` and `b2c scapi schemas get`
