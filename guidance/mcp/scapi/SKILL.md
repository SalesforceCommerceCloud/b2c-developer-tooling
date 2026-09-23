---
name: MCP SCAPI Code Mode
description: Discover standard and live custom SCAPI contracts, compose Admin requests, and verify changes using configured authentication and safety rules.
---

# SCAPI Code Mode

Prefer dedicated tools. Otherwise discover with `scapi_search`, compose with
`scapi_execute`. Use JavaScript async arrow functions; no TypeScript or imports.
Warehouse reports/SQL use `cip_discover` / `cip_query`, not code mode;
see [CIP analytics](skill://mcp/cip/SKILL.md).
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

### Task map

Use these API IDs to narrow discovery; inspect the operation's inputs before calling.
Snippet names below have the `builtin/` prefix. Describe only the relevant snippet.

| Task                                          | API / starting point                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Review runs, including successes              | `operation/jobs/v1`: `searchJobExecutions`; `job-execution-review` snippet                             |
| Inspect steps and exact log path              | `operation/jobs/v1`: `getJobExecution`; `job-execution-inspect` snippet                                |
| Investigate failures with detail reads        | `failed-job-triage` snippet; [jobs](references/jobs.md)                                                |
| Start a job / stop an execution               | `operation/jobs/v1`: `createJobExecution` / `deleteJobExecution`; confirm intent and active runs first |
| Active/rollback versions, activation metadata | `dx/scripts/v1`: `getCodeVersions`; `code-version-inspect` snippet                                     |
| Activate/create/delete a code version         | `dx/scripts/v1`: `updateCodeVersion` / `createCodeVersion` / `deleteCodeVersion`                       |
| Site status, catalog, ordered cartridge path  | `site/sites/v1`: `getSiteById`; `site-cartridge-inspect` snippet                                       |
| Change a site's custom cartridge path         | `site/sites/v1`: `replaceSiteCustomCartridges`; preserve order and unrelated entries                   |
| Basic product + optional category assignment  | `create-product` snippet; [products](references/products.md)                                           |
| Campaign assignments and promotion details    | `campaign-promotions` snippet; [promotions](references/promotions.md)                                  |

File content is WebDAV: `webdav_list` / `webdav_get` / `webdav_put`.
Deploy local cartridge files with `cartridge_deploy`. Job schedules/definitions
are not execution history; obtain expected schedules from Business Manager/user.
Do not fall back to a terminal merely because there is no dedicated job/site tool.

### Tenant custom properties and APIs

Bundled schemas omit tenant `c_*` definitions. Known custom fields can be sent
directly in standard Admin bodies; schema retrieval is optional. SCAPI validates
the payload. To discover tenant fields, fetch the live schema with
`scapi_schemas_list`: `includeSchemas: true`, `apiFamily`, `apiName`, `apiVersion`.
Custom-property expansion defaults to true; disable with `expandCustomProperties: false`.
`expandAll: true` retains full definitions; it is separate from custom-property
expansion. Large contracts: fetch through `scapi_execute` and return only relevant
fields ([example](references/custom-properties.md)). Requires `sfcc.scapi-schemas`.
Use the same project/instance for schema lookup and writes.

Live reads do not change offline `spec`. If schema access fails, report it; use
already-known fields or ask for missing details. The optional CLI equivalent is
`b2c scapi schemas get`, which also expands custom properties by default.

For custom endpoint contracts, use `scapi_schemas_list` with `apiFamily: "custom"`;
check registration with `scapi_custom_apis_get_status` when needed. Execute Admin
custom endpoints by fetching their live contract through `scapi.request` first
in each program, then making declared calls. The read enables that contract for
this execution only. Use `AmOAuth2` operations with their declared `c_*` scopes;
Shopper operations remain unsupported. [Custom API workflow](references/custom-apis.md).

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
- Limits: 20 calls, four outstanding, 30 seconds of active execution, 24 KB returned.
  Managed API/token calls are serialized within an execution. Narrow oversized
  discovery; reduce live pages/projections.
- SDK safety applies per request, including POST searches. Use only authorized
  targeted exceptions. Confirmation uses client elicitation; see below. Code mode does not
  transfer binaries; use WebDAV tools for instance files, an external client for
  binary SCAPI endpoints.
- `fetch` and `WebSocket` are disabled. Use `scapi.request()` inside programs;
  direct HTTP belongs in an external client, outside MCP Safety Mode. Do not use
  imports or other Node networking APIs to bypass this boundary.

## Confirmation and cancellation

- A request requiring approval retains the running program and returns MCP
  `input_required`. Let the client handle elicitation and the protocol retry;
  never manufacture approval responses or modify opaque `requestState`.
- Retries validate the original code, input, and target arguments, then resume
  the same execution. Repeated code is **not evaluated again**. Each request
  needs its own approval; a whole program is not a transaction.
- Later managed calls wait for the pending decision. Earlier writes remain
  applied. Prompts identify the target, method/path, payload preview, execution
  ID, and cancellation instructions. Results include operation outcomes; `unknown` requires
  checking the affected records before a fresh attempt.
- Decline/cancel terminates the entire execution, even if code catches errors.
  Explicitly stop work with `scapi_execute({action: "cancel", executionId, skillRead: true})`;
  omit code, input, project overrides, and protocol continuation state.
- Approval has no server deadline; waiting does not consume the active runtime
  budget. At most four executions may be active per server, including pending
  approvals. Cancel unwanted work to free a slot. Server shutdown or disconnect
  releases retained workers; state does not survive a restart. Clients may impose
  their own timeout. Duplicate responses never replay code or send a request twice.
- To change code/input/target, cancel unwanted retained work and start a fresh
  execution without continuation state. Cancellation does not roll back writes.
  Clients without form elicitation stop at confirmation-required requests.

For safety levels, rule matching, configuration precedence, and confirmation
semantics, read `docs_read({query: "guide-safety"})` when needed. If docs tools
are unavailable, use the [Safety Mode guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/safety.md).
This is an optional policy reference, not another prerequisite read.

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
- [Jobs](references/jobs.md): review runs, inspect steps/logs, investigate failures.

For explicit save requests, see [saving](references/saving.md).

No CLI code-mode equivalent. For missing settings such as promotion discounts,
consider [XML archives](skill://b2c-cli/b2c-site-import-export/SKILL.md)
([CLI docs](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/jobs)).
[Platform reference](https://developer.salesforce.com/docs/commerce/commerce-api/references).
[Configuration/access](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration).
