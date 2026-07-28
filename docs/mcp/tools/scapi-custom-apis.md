---
description: MCP tools for scaffolding custom SCAPI endpoints and checking their registration status.
---

# SCAPI Custom APIs

MCP tools for working with custom SCAPI endpoints — scaffold a new endpoint locally, then check its registration status once deployed. Available in the **SCAPI**, **PWAV3**, and **STOREFRONTNEXT** toolsets (SCAPI is always enabled).

- [`scapi_custom_api_generate_scaffold`](#scapi-custom-api-generate-scaffold) — create the schema, manifest, and script stub for a new custom API in a cartridge (local, no auth).
- [`scapi_custom_apis_get_status`](#scapi-custom-apis-get-status) — check whether deployed custom API endpoints are registered on an instance (requires OAuth).

For schema definitions of custom APIs, use [`scapi_schemas_list`](./scapi-schemas-list) with `apiFamily: "custom"`.

---

## scapi_custom_api_generate_scaffold

Scaffold a new custom SCAPI endpoint in an existing cartridge. Creates `schema.yaml` (OAS 3.0 contract), `api.json` (endpoint mapping), and `script.js` (implementation stub) under `rest-apis/<apiName>/`.

### Authentication

No authentication or instance required. This tool writes files locally into your project.

### Parameters

| Parameter        | Type                     | Required | Description                                                                                                                        |
| ---------------- | ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apiName`        | string                   | Yes      | API name in kebab-case (e.g. `my-products`). Must start with a lowercase letter; only letters, numbers, and hyphens.               |
| `cartridgeName`  | string                   | No       | Cartridge that will contain the API. Omit to use the first cartridge found under the project (working directory or `projectRoot`). |
| `apiType`        | `"admin"` \| `"shopper"` | No       | **shopper** (siteId, customer-facing) or **admin** (no siteId). Default: `shopper`.                                                |
| `apiDescription` | string                   | No       | Short description of the API.                                                                                                      |
| `projectRoot`    | string                   | No       | Project root for cartridge discovery. Default: MCP working directory (`--project-directory` / `SFCC_PROJECT_DIRECTORY`).           |
| `outputDir`      | string                   | No       | Output directory override. Default: project root (scaffold writes under cartridge path).                                           |

**Returns:** `{scaffold, outputDir, files: [{path, action}], postInstructions}`. Errors if no cartridge is found.

### Usage

**Create a shopper API (default cartridge):**

```
Scaffold a custom API named product-recommendations, type shopper, with description "Product recommendations by segment".
```

**Create an admin API in a specific cartridge:**

```
Create a custom admin API named inventory-sync in cartridge app_custom.
```

### Next steps after scaffolding

1. **Edit** `schema.yaml` to define paths, request/response schemas, and operation IDs.
2. **Implement** `script.js` endpoint logic.
3. **Deploy** the cartridge and **activate** the code version to register the API.
4. **Verify** with [`scapi_custom_apis_get_status`](#scapi-custom-apis-get-status) that endpoints show as `active`.

Shopper APIs are available at `https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/v1/organizations/{organizationId}/...` and require the `siteId` query parameter and ShopperToken authentication.

---

## scapi_custom_apis_get_status

Check the registration status of custom SCAPI endpoints deployed on your B2C Commerce instance. Queries the live instance and returns endpoint status (`active` or `not_registered`) with per-site details.

### Authentication

Requires OAuth credentials with the `sfcc.custom-apis` scope. See [Configuring Scopes](../../guide/authentication#configuring-scopes) and [B2C Credentials](../configuration#b2c-credentials-dwjson) for setup details.

**Configuration priority:** Flags (`--server`, `--client-id`, `--client-secret`) → Environment variables (`SFCC_SERVER`, `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`) → `dw.json` config file

### Parameters

| Parameter | Type                             | Required | Description                                                                                                  |
| --------- | -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `status`  | `"active"` \| `"not_registered"` | No       | Filter by endpoint status. Omit to return all endpoints.                                                     |
| `groupBy` | `"site"` \| `"type"`             | No       | Group output by `siteId` or `type` (Admin/Shopper). Omit for flat list.                                      |
| `columns` | string                           | No       | Comma-separated field names to include. Omit for defaults (7 fields). Use all field names for complete data. |

Default columns: `type`, `apiName`, `cartridgeName`, `endpointPath`, `httpMethod`, `status`, `siteId`.

**Returns:** One row per endpoint per site with status (`active` or `not_registered`) and metadata (type, apiName, cartridgeName, endpointPath, httpMethod, siteId).

### Usage

**List all endpoints:**

```
List custom SCAPI endpoints on my instance.
```

**Show only active endpoints, grouped by site:**

```
List active custom API endpoints grouped by site.
```

---

## See Also

- [`scapi_schemas_list`](./scapi-schemas-list) — list or fetch SCAPI schemas (use `apiFamily: "custom"` for custom APIs)
- [SCAPI Toolset](../toolsets#scapi) — overview of SCAPI tools
- [Scaffolding Guide](../../guide/scaffolding#custom-api) — CLI and SDK scaffolding (including `b2c scaffold custom-api`)
- [Authentication Setup](../../guide/authentication#scapi-authentication) — SCAPI authentication, roles, and scopes
- [Configuration](../configuration) — configure OAuth credentials
- [CLI Reference](../../cli/custom-apis) — equivalent CLI command: `b2c scapi custom status`
