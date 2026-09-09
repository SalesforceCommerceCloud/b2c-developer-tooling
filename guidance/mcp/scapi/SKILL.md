---
name: MCP SCAPI Code Mode
description: Discover standard SCAPI contracts, compose Admin requests, and verify changes using configured authentication and safety rules.
---

# SCAPI Code Mode

Prefer dedicated tools. For other Commerce API tasks, `scapi_search` discovers
contracts; `scapi_execute` runs requests. Both take a JavaScript async arrow
function, without TypeScript or imports. Read this skill once via resources or
`skills_read`; then pass `skillRead: true`. Acknowledgment does not authorize mutations.

## Discover

Discovery is offline; no credentials or Schemas API needed. Schemas and live
responses can be huge. Inspect them in code; return only what the next decision needs.

1. Find APIs with `spec.apis` or filter `spec.paths`; return method/path/operationId.
2. Narrow by `api`, path, or `authType`. Inspect one operation's inputs, required
   fields, and selected property definitions; inspect `allOf` when present.
3. Inspect response fields only as needed. Avoid returning entire operations,
   request/response trees, or recursively expanded schemas.

Tool descriptions provide object types and examples. Local refs are expanded;
recursive/deep refs retain `$ref`. `op.auth.executable` is runtime support, not
configured access; `op.security` gives scopes. Mixed auth matches either type.
Tenant custom properties/endpoints are excluded; inspect live contracts
with `scapi_schemas_list`, registration with `scapi_custom_apis_get_status`.

## Authentication

- Admin `AmOAuth2`: Account Manager credentials; operation/tenant scopes are
  requested automatically. Product creation needs `sfcc.products.rw`.
- Missing Admin config: inspect masked values; configure `clientId` and credentials.
  `slasClientId` is a separate Shopper identity.
- Rejected scopes: grant the reported scopes to the Account Manager client;
  check extra configured scopes too. Merely adding names to local config does
  not grant access. Reported read/write alternatives are alternatives.
- Shopper execution is unsupported; SLAS configuration cannot enable it.
  SLAS administration uses admin roles. [SLAS CLI/SDK](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/slas).
- HTTP 401/403 responses retain `status`/`data` and add `diagnostic` advice.
  Preserve diagnostics. A 403 alone does not prove missing scopes.

## Execute and verify

- Inspect unknown configuration with `config_inspect`; keep masking. Pass
  `projectDirectory` to execution. `organizationId`/`siteId` use resolved values.
- `scapi.request({method, path, query?, body?})` returns `{status, ok, data}`.
  Encode path IDs with `encodeURIComponent`; `organizationId` placeholders
  resolve automatically. SDK safety rules apply per request.
- Product `PUT` also updates. GET first: proceed on 404; otherwise require update
  intent. Resolve `owningCatalogId` from actual catalogs or the user. Read back.
- Await every request. Check `ok`/`status`; HTTP errors are returned, transport or
  auth/safety failures throw. SCAPI validates payloads.
- Filter/page at the API; use `filter`, `map`, `slice`, and aggregates before
  returning. Include totals/hasMore for partial lists, IDs and verification
  fields for records, and status/data/diagnostic on errors. Omit unrelated fields.
- Limits: 20 calls, four concurrent, 30 seconds, 24 KB returned data.
  On oversized/truncated discovery, narrow the operation or fields; for live
  reads, reduce the page/projection. Do not just stringify or crop the same payload.
- After execution failure, check earlier writes before retrying. Confirmation-required
  requests stop; no program replay or automatic cleanup deletion.
- `READ_ONLY` also blocks POST searches. Use a targeted method/path allow rule
  only when authorized; do not lower the whole policy to run a search.
- Binary uploads/downloads are unsupported. Use a file-capable client when needed.

## Tool choice

No CLI code-mode equivalent exists.
Contract omits required settings, such as promotion discount rules? Use
[XML archives](skill://b2c-cli/b2c-site-import-export/SKILL.md) when applicable;
verify those settings, not just metadata. [CLI docs](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/jobs).

Platform semantics: [SCAPI reference](https://developer.salesforce.com/docs/commerce/commerce-api/references).
Configuration and access: [MCP setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration).
