---
description: Generate a new custom SCAPI endpoint (OAS 3.0 schema, api.json, script.js) in an existing cartridge.
---

# scapi_custom_api_scaffold

Generate a new custom SCAPI endpoint in an existing cartridge. Creates `schema.yaml` (OAS 3.0 contract), `api.json` (endpoint mapping), and `script.js` (implementation) under the cartridge's `rest-apis/<apiName>/` directory.

## Overview

The `scapi_custom_api_scaffold` tool scaffolds a new custom API using the B2C tooling SDK's `custom-api` scaffold. It:

- Creates an OpenAPI 3.0 schema, API manifest, and script stub in your project.
- Uses the first cartridge found in the project if you don't specify one.
- Supports **shopper** (siteId, customer-facing) or **admin** (no siteId) API types.

**No instance or OAuth required** — this tool works locally and only writes files into your project. To check registration status after deployment, use [`scapi_custom_apis_status`](./scapi-custom-apis-status).

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiName` | string | Yes | API name in kebab-case (e.g. `my-products`). Must start with a lowercase letter; only letters, numbers, and hyphens. |
| `cartridgeName` | string | No | Cartridge that will contain the API. Omit to use the first cartridge found under the project (working directory or `projectRoot`). |
| `apiType` | `"admin"` \| `"shopper"` | No | `shopper` (siteId, customer-facing) or `admin` (no siteId). Default: `shopper`. |
| `apiDescription` | string | No | Short description of the API. |
| `projectRoot` | string | No | Project root for cartridge discovery. Default: MCP working directory (`--project-directory` / `SFCC_PROJECT_DIRECTORY`). |
| `outputDir` | string | No | Output directory override. Default: project root (scaffold writes under cartridge path). |

## Usage Examples

### Create a custom API (default cartridge and type)

```
Use the MCP tool to create a custom API named my-loyalty-api.
```

### Create a shopper API with a description

```
Use the MCP tool to scaffold a custom API named product-recommendations, type shopper, with description "Product recommendations by segment".
```

### Create an admin API in a specific cartridge

```
Use the MCP tool to create a custom admin API named inventory-sync in cartridge app_custom.
```

## Output

### Success

Returns the scaffold ID, output directory, and list of created files:

```json
{
  "scaffold": "custom-api",
  "outputDir": "/path/to/project",
  "dryRun": false,
  "files": [
    { "path": ".../rest-apis/my-custom-api/schema.yaml", "action": "created" },
    { "path": ".../rest-apis/my-custom-api/api.json", "action": "created" },
    { "path": ".../rest-apis/my-custom-api/script.js", "action": "created" }
  ],
  "postInstructions": "Custom API 'my-custom-api' has been created in cartridge 'app_storefrontnext_base'. ..."
}
```

### Errors

- **No cartridges found** — Project has no cartridge (e.g. no `.project` in a cartridge directory). Create a cartridge first (e.g. `b2c scaffold cartridge`).
- **Scaffold not found** — SDK `custom-api` scaffold is missing; ensure `@salesforce/b2c-tooling-sdk` is installed.
- **Parameter validation failed** — Invalid `apiName` (e.g. not kebab-case) or other parameter issue.

## Next steps after scaffolding

1. **Edit** `schema.yaml` to define paths, request/response schemas, and operation IDs.
2. **Edit** `script.js` to implement the endpoint logic.
3. **Deploy** the cartridge to your instance and **activate** the code version to register the API.
4. **Verify** with [`scapi_custom_apis_status`](./scapi-custom-apis-status) that endpoints show as `active`.

Shopper APIs are available at:
`https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/v1/organizations/{organizationId}/...` and require the `siteId` query parameter and ShopperToken authentication.

## Related Tools

- Part of the [SCAPI](../toolsets#scapi), [PWAV3](../toolsets#pwav3), and [STOREFRONTNEXT](../toolsets#storefrontnext) toolsets
- [`scapi_custom_apis_status`](./scapi-custom-apis-status) — Check custom API endpoint registration status after deployment
- [`scapi_schemas_list`](./scapi-schemas-list) — List or fetch custom API schemas (use `apiFamily: "custom"`)

## See Also

- [SCAPI Toolset](../toolsets#scapi) — Overview of SCAPI tools
- [Scaffolding Guide](../../guide/scaffolding#custom-api) — CLI and SDK scaffolding (including `b2c scaffold custom-api`)
- [CLI Reference](../../cli/scaffold) — `b2c scaffold` commands
