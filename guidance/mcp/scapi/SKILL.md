---
name: MCP SCAPI Code Mode
description: Discover standard SCAPI contracts, compose Admin requests, and verify changes using configured authentication and safety rules.
---

# SCAPI Code Mode

`scapi_search` discovers contracts; `scapi_execute` runs requests. Both accept a
JavaScript async arrow function, without TypeScript or imports. Preview:
`--allow-non-ga-tools`. Read this skill via resources or `skills_read` before
either tool; pass `skillRead: true` afterward. One read suffices; acknowledgment
does not authorize mutations.

## Discover

Bundled discovery needs no credentials or Schemas API.
`spec.apis` lists IDs, versions, and `authTypes`; `spec.paths` maps full paths to
lowercase methods. `authType: "admin" | "shopper"` filters operations; mixed
operations match either. `op.auth` reports `types`, `schemes`, and `executable`
(runtime support, not configured access). `op.security` retains required scopes.

```javascript
async () => {
  const path = '/product/products/v1/organizations/{organizationId}/products/{productId}';
  const op = spec.paths[path].put;
  const body = spec.resolve(op.requestBody, op.api).content['application/json'].schema;
  const wanted = [...new Set([...(body.required ?? []), 'name', 'owningCatalogId', 'onlineFlag'])];
  return {path, operationId: op.operationId, parameters: spec.resolve(op.parameters, op.api),
    required: body.required, fields: Object.fromEntries(wanted.map(k => [k, body.properties[k]])),
    auth: op.auth, security: op.security};
}
```

Filter before returning details; `api` limits to family/name/version. Cycles retain
`$ref`. Return required and task-relevant field definitions, not whole schemas or
response objects. Project live results to IDs and verification fields too.
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
  Shopper flows need a SLAS client, site, token/scopes, and private-client secret.
  SLAS administration uses admin roles. CLI/SDK: [SLAS](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/slas).
- HTTP 401/403 responses retain `status`/`data` and add `diagnostic` advice.
  Return that advice on failure. A 403 does not alone prove missing scopes.

## Execute and verify

- Inspect unknown configuration with `config_inspect`; keep masking. Pass
  `projectDirectory` to execution. `organizationId`/`siteId` use resolved values.
- `scapi.request({method, path, query?, body?})` returns `{status, ok, data}`.
  Substitute path IDs with `encodeURIComponent`; `organizationId` placeholders
  also resolve automatically. SDK safety rules apply per request.
- Product `PUT` also updates. GET first: proceed on 404; otherwise require update
  intent. Resolve `owningCatalogId` from actual catalogs or the user. Read back.
- Await every request. Check `ok`/`status`; HTTP errors are returned, transport or
  auth/safety failures throw. SCAPI validates payloads. Limits: 20 calls,
  four concurrent, 30 seconds; return at most 24 KB of selected fields.
- After failure, check earlier writes before retrying. Confirmation-required
  requests stop; no program replay or automatic cleanup deletion.

## Tool choice

Prefer existing task tools for their workflows. No CLI code-mode equivalent exists.
Contract omits required settings, such as promotion discount rules? Use
[XML archives](skill://b2c-cli/b2c-site-import-export/SKILL.md) when applicable;
verify those settings, not just metadata. [CLI docs](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/job).

Platform semantics: [SCAPI reference](https://developer.salesforce.com/docs/commerce/commerce-api/references).
Configuration and access: [MCP setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration).
