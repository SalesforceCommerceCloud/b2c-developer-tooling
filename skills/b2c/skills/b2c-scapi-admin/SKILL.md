---
name: b2c-scapi-admin
description: Build backend integrations that sync data between B2C Commerce and external systems like ERPs, OMS, WMS, or CRMs using SCAPI Admin APIs. Use this skill whenever the user needs to pull or push orders, products, inventory, or customer data programmatically from a backend service, set up server-to-server authentication with Account Manager client credentials and admin OAuth scopes, implement bulk inventory imports with NDJSON, or call any Commerce API from a script or pipeline (not a storefront). Also use when building nightly data exports, warehouse sync jobs, or customer data integrations — even if they just say "pull orders into our ERP" or "sync inventory from the warehouse".
---

# SCAPI Admin APIs

Build backend integrations or manage Commerce data through standard Admin APIs.
Use [Shopper APIs](../b2c-scapi-shopper/SKILL.md) for storefront flows.

## Tool choice

When B2C MCP is available:
- Prefer a dedicated task tool. Otherwise read `skill://mcp/scapi/SKILL.md` once
  through resources or `skills_read`, then use `skillRead: true`.
- `scapi_search`: bundled standard contracts, offline. Find method/path/operationId,
  then inspect selected parameters, fields, and security scopes. Return compact projections.
- `scapi_execute`: supported Admin JSON operations with configured Account Manager
  auth and automatic operation/tenant scopes. Use `config_inspect` with masking;
  do not fetch or print tokens manually for these calls.
- `scapi_schemas_list`: live tenant schemas, including custom attributes and APIs.
  `scapi_custom_apis_get_status`: custom registration. Custom execution and binary
  transfers are unsupported by code mode; use an appropriate integration client.
- `docs_search`/`docs_read`: platform semantics, limits, and auth setup. No duplicate
  docs lookup is needed merely to repeat a discovered contract.

For CLI/integration development: `b2c scapi schemas list` and
`b2c scapi schemas get <family> <name> <version>` retrieve live contracts.
Read [integration examples](references/CLIENT-EXAMPLES.md) only when implementing
an external client, token flow, or bulk import. There is no CLI code-mode equivalent.

## Execute deliberately

- Use configured short code, tenant, and site values. Admin auth requires an
  Account Manager client, API grants, and `SALESFORCE_COMMERCE_API:<tenant_id>`.
  SLAS credentials do not replace Admin credentials.
- Inspect the operation before use; examples are illustrative. For tenant-specific
  fields use live schemas. Check official docs for version-specific semantics.
- Distinguish creation from update; PUT may do both. Verify existence and intent,
  then read back meaningful fields. Check earlier writes before retrying a failure.
- Page/filter at the API and return IDs, selected fields, totals/hasMore, and errors.
  Do not emit whole response trees or log credentials.
- Safety is method-based: POST searches can require a targeted allow rule.
  Confirmation-required code-mode requests stop; do not bypass them.

## Conditional references

- [OAuth scopes](references/OAUTH-SCOPES.md): integration grants; compare with the operation's security.
- [Integration patterns](references/INTEGRATION-PATTERNS.md): ETL, sync, bulk import.
- [Configuration](../../../b2c-cli/skills/b2c-config/SKILL.md): CLI credentials and precedence.
- Official docs: `commerce-api/authorization-for-admin-apis`, `commerce-api/auth-z-scope-catalog`,
  `commerce-api/timeouts-limits`, `commerce-api/throttle-rates`,
  `commerce-api/inventory-impex-best-practices`.
