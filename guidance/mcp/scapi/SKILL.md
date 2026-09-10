---
name: MCP SCAPI Code Mode
description: Discover standard SCAPI contracts, compose Admin requests, and verify changes using configured authentication and safety rules.
---

# SCAPI Code Mode

Prefer dedicated tools. Otherwise discover with `scapi_search`, compose with
`scapi_execute`. Use JavaScript async arrow functions; no TypeScript or imports.
Use code mode for API discovery, request composition, and result processing.
Use terminal/file tools for local development, builds, and filesystem work.
Filesystem APIs, subprocesses, worker threads, and native addons are restricted.
Read this skill once via resources or `skills_read`,
then pass `skillRead: true`. This does not authorize mutations.

## Discover

Discovery is offline; no credentials or Schemas API needed. Schemas and responses
can be huge. Return only what the next decision needs:

1. Find APIs/operations through `spec.apis`/`spec.paths`; return method/path/operationId.
2. Narrow by `api`, path, or `authType`; inspect required inputs and selected fields,
   including `allOf` when present.
3. Inspect response fields only as needed; avoid whole operations/schema trees.

Local refs expand; recursive/deep refs retain `$ref`. `op.auth.executable` means
runtime support, not configured access; `op.security` gives scopes.
For tenant custom fields/endpoints use `scapi_schemas_list`; check registration
with `scapi_custom_apis_get_status`. Custom API execution is unsupported.

## Authentication

- `scapi.request()` and snippets using it authenticate automatically. Do not acquire
  or pass tokens first. For an explicitly requested token or external HTTP client,
  use `auth.accountManager()` / `auth.slas()` in `scapi_execute`:
  [token exports](references/tokens.md). These helpers are unavailable in search.
- Admin `AmOAuth2`: Account Manager credentials. Each request selects operation/tenant
  scopes and reuses suitable cached tokens; no upfront scope union.
- Missing credentials: `config_inspect` with masking. `clientId` is Admin;
  `slasClientId` is Shopper. Configuration does not grant access.
- Scope rejection: grant reported scopes in Account Manager; check extra configured
  scopes. Read/write alternatives are alternatives. Later failures do not undo writes.
- Shopper requests through `scapi.request()` are unsupported; SLAS token export
  is available for external clients.
  SLAS admin roles differ: [CLI/SDK](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/slas).
- HTTP 401/403 retain `status`/`data` plus `diagnostic`; preserve these.
  A 403 alone does not prove missing scopes.

For missing values or wrong targets, read [MCP configuration](skill://mcp/b2c-config/SKILL.md)
(`skills_read` ID `mcp/b2c-config`). For external client/role/tenant-filter setup,
use `docs_read({query: "guide-authentication"})`; official Admin authorization:
`commerce-api/authorization-for-admin-apis`, scope definitions: `commerce-api/auth-z-scope-catalog`.
For other access questions, search `docs_search` with the specific error and API.
If docs are unavailable, use the [authentication guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication).
These are conditional setup references, not additional prerequisite reads.

## Compose and verify

- Pass the execution `projectDirectory`; reuse resolved `organizationId`/`siteId`.
  Encode path IDs. `{organizationId}` placeholders resolve automatically.
- Compose dependent calls with intermediate results and local helpers.
  Pause for unresolved intent or contracts.
- Sequence dependent writes; batch independent reads at most four at a time.
  Await all requests. Map rejections to `{id, error: String(error)}`;
  raw `Promise.allSettled()` reasons lose Error details in JSON.
- PUT can create or update: check existence and intent; read back writes.
- Check `ok`/`status`: HTTP errors return; transport/auth/safety failures throw.
  Preserve completed writes and failed stages. Check writes before retrying;
  no program replay or automatic cleanup deletion.
- Filter/page at the API, then project/aggregate in code. Include IDs, verification
  fields, errors, totals, and continuation inputs. Do not crop away missing data.
- Limits: 20 calls, four concurrent, 30 seconds, 24 KB returned. Narrow oversized
  discovery; reduce live pages/projections.
- SDK safety applies per request, including POST searches. Use only authorized
  targeted exceptions. Confirmation-required requests stop. Binary transfers
  need a file-capable client.
- `fetch` and `WebSocket` are disabled. Use `scapi.request()` inside programs;
  direct HTTP belongs in an external client, outside MCP Safety Mode. Do not use
  imports or other Node networking APIs to bypass this boundary.

## Reusable workflows

Find workflows with `codemode.search(query)`; `codemode.describe(name)`
returns source/inputSchema. Inspect before first use; `codemode.run(name, input)`
composes inside execution with shared limits/auth/safety. `builtin/` ships with
the MCP; `user/` persists locally. [Catalog](references/snippets.md).

Reuse a snippet when its inputs and verification cover the task. Otherwise adapt
its source or compose direct requests; do not omit requested fields to fit a
snippet. Inputs are schema-validated before invocation. Pass variable values
through the tool's `input` to `async (input)` when preparing reusable code.
Discover/describe inside either code tool; run snippets only inside `scapi_execute`.
Saving requires an explicit user request and a reviewed outcome; a completed
execution may still contain HTTP errors or partial failures.

- [Products](references/products.md): create, optionally assign a storefront category, verify both.
- [Promotions](references/promotions.md): join assignments/details in bounded batches.
- [Jobs](references/jobs.md): search failures, inspect a page, return continuation.

For explicit save requests, see [saving](references/saving.md).

No CLI code-mode equivalent. For missing settings such as promotion discounts,
consider [XML archives](skill://b2c-cli/b2c-site-import-export/SKILL.md)
([CLI docs](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/jobs)).
[Platform reference](https://developer.salesforce.com/docs/commerce/commerce-api/references).
[Configuration/access](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration).
