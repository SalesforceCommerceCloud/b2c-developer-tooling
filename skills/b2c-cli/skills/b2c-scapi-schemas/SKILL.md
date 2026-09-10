---
name: b2c-scapi-schemas
description: Browse and retrieve SCAPI OpenAPI schema specifications. Use this skill whenever the user needs to list available SCAPI APIs, inspect endpoint paths or request/response shapes, explore data models for products or orders, check which fields an API returns, or understand SCAPI versioning. Also use when looking up API details before building an integration -- even if they just say 'what fields does the product API return' or 'show me the SCAPI endpoints'.
---

# B2C SCAPI Schemas Skill

Browse standard or tenant-specific SCAPI OpenAPI contracts.

## Tool choice

When B2C MCP is available, prefer offline `scapi_search` for standard Admin and
Shopper contracts. Read `skill://mcp/scapi/SKILL.md` via resource or `skills_read`
first; pass `skillRead: true`. Discover method/path/operationId, then selected
inputs and fields. No credentials or live Schemas API access needed.

Use `scapi_schemas_list` for live schemas, custom attributes, and custom APIs.
For tenant fields, supply API family/name/version, `includeSchemas: true`, and
`expandCustomProperties: true`; `expandAll: true` preserves full definitions.
For large schemas, fetch/filter through code mode as described in the MCP SCAPI skill.
Use `scapi_custom_apis_get_status` for registration status. Live schema access needs
`sfcc.scapi-schemas`. Prefer a dedicated task tool for execution, otherwise
`scapi_execute` supports Admin JSON calls with configured auth/scopes. Shopper,
custom API, and binary execution are unsupported. Use docs tools for semantics
and limits rather than duplicating contract discovery.

For CLI work, use `b2c scapi schemas list` and
`b2c scapi schemas get <family> <name> <version>`; both use live access.
CLI get expands custom properties by default; `--no-expand-custom-properties`
requests the standard contract. MCP expansion is opt-in. Confirmed custom fields
can be sent through standard Admin code-mode requests; no offline schema refresh is needed.
`config_inspect` is the masked MCP equivalent of `b2c setup inspect`.
Read [CLI examples](references/CLI-EXAMPLES.md) for filters, selective expansion,
custom properties, and file output. There is no CLI code-mode equivalent.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli scapi schemas list`).

## Configuration

Values like `tenantId`, `shortCode`, `clientId`, and `clientSecret` resolve from `dw.json` / `SFCC_*` env vars / the active instance / configuration plugins. Examples below show minimal usage; **add flags only to override configured values** — passing `--client-id`/`--client-secret`/`--tenant-id`/`--short-code` is usually unnecessary. If a required value is missing, the CLI emits an actionable error pointing at the flag, env var, and config key.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (`--json` for scripting; secrets stay masked by default). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

## Tenant ID vs. Organization ID

The tenant ID identifies your B2C Commerce instance for SCAPI calls. It is **not** the same as the organization ID:

- **Tenant ID**: `zzxy_prd` (the `tenantId` value in dw.json, or `--tenant-id` override)
- **Organization ID**: `f_ecom_zzxy_prd` (used in SCAPI URLs, has `f_ecom_` prefix)

### Deriving Tenant ID from Hostname

For sandbox instances, derive the tenant ID from the hostname by replacing hyphens with underscores:

| Hostname                                   | Tenant ID  |
| ------------------------------------------ | ---------- |
| `zzpq-013.dx.commercecloud.salesforce.com` | `zzpq_013` |
| `zzxy-001.dx.commercecloud.salesforce.com` | `zzxy_001` |
| `abcd-dev.dx.commercecloud.salesforce.com` | `abcd_dev` |

For production instances, use your realm and instance identifier (e.g., `zzxy_prd`).
