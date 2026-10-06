# SCAPI discovery, result limits and tenant schemas

Every operation carries `summary`, `description` and `tags` (plus parameters, security and responses), so
search the prose as well as `operationId` and path. Descriptions are long: return `op.summary` when listing
candidates, and read `op.description` only for the operations you are about to call.

`scapi_search` returns each operation as an outline by default: its own `summary`, `description` and `tags`, with
parameters, schemas and responses but without nested descriptions or examples. Pass `detail: "full"` when you need
property-level descriptions or example payloads for the operations you are about to call (`scapi_execute` always
sees full operations). Results are capped at 24 KB of JSON for both tools (`SCAPI_RESULT_TOO_LARGE`). A whole resolved operation is
typically 6-20 KB and some exceed the cap alone, so never return `op` or `spec.paths` entries unprojected: list
`{operationId, method, path, summary}`, then return only `parameters` or `requestBody` for the operations you will call.

The `spec` object has exactly three members; there is no `spec.schemas` and no need to probe it:

- `spec.apis`: array of `{id, apiFamily, apiName, apiVersion, status, origin?}` (`id` is e.g. `product/catalogs/v1`).
- `spec.paths`: `{[fullPath]: {[method]: operation}}`, where `fullPath` starts with the API id (`/product/catalogs/v1/organizations/{organizationId}/catalogs/{catalogId}`) and methods are lowercase. Operations carry `operationId`, `api`, `summary`, `description`, `tags`, `parameters`, `requestBody`, `responses`, `security` and `auth`.
- `spec.resolve(value, apiId)`: expands local `$ref`s in a fragment.

## Discover

Discovery defaults to the bundled standard contracts offline; no credentials needed.
Pass `schemas: "live"` to search the configured tenant's Schemas API contracts
instead: tenant `c_*` properties, custom APIs, and APIs newer than the bundle.
Live search needs `sfcc.scapi-schemas`, uses the same project context as
`scapi_execute`, and caches per tenant for the server session (`refresh: true` refetches). Contracts that
failed to load are listed in `schemaFailures`. The result's `schemaSource` says which corpus was searched. If live
access fails (missing configuration, credentials or access), the search falls back to the bundled contracts,
reports `schemaSource: "bundled"` and explains why in `warnings`; tell the user when tenant `c_*` fields or custom
APIs matter, since the bundle has neither. Asking for a custom API (`custom/...`) never falls back. APIs with `origin: "local"` are
developer-supplied beta contracts (`--scapi-schemas`). They replace the bundled and live versions in search and
execution. Schemas and responses can be huge.
Return only what the next decision needs:

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
| Investigate failures with detail reads        | `failed-job-triage` snippet; [jobs](jobs.md)                                                           |
| Start a job / stop an execution               | `operation/jobs/v1`: `createJobExecution` / `deleteJobExecution`; confirm intent and active runs first |
| Active/rollback versions, activation metadata | `dx/scripts/v1`: `getCodeVersions`; `code-version-inspect` snippet                                     |
| Activate/create/delete a code version         | `dx/scripts/v1`: `updateCodeVersion` / `createCodeVersion` / `deleteCodeVersion`                       |
| Site status, catalog, ordered cartridge path  | `site/sites/v1`: `getSiteById`; `site-cartridge-inspect` snippet                                       |
| Change a site's custom cartridge path         | `site/sites/v1`: `replaceSiteCustomCartridges`; preserve order and unrelated entries                   |
| Basic product + optional category assignment  | `create-product` snippet; [products](products.md)                                                      |
| Campaign assignments and promotion details    | `campaign-promotions` snippet; [promotions](promotions.md)                                             |

File content is WebDAV: `webdav_list` / `webdav_get` / `webdav_put`.
Deploy local cartridge files with `cartridge_deploy`. Job schedules/definitions
are not execution history; obtain expected schedules from Business Manager/user.
Do not fall back to a terminal merely because there is no dedicated job/site tool.

### Tenant custom properties and APIs

Bundled schemas omit tenant `c_*` definitions. Known custom fields can be sent
directly in standard Admin bodies; schema retrieval is optional. SCAPI validates
the payload. To discover tenant fields, search with `schemas: "live"` (narrow with
`api`), or fetch the live schema with `scapi_schemas_list`: `includeSchemas: true`,
`apiFamily`, `apiName`, `apiVersion`.
Custom-property expansion defaults to true; disable with `expandCustomProperties: false`.
`expandAll: true` returns the full contract (operation prose, examples, custom properties) instead of the
collapsed outline, which asks the Schemas API for only what it keeps. `include` selects Schemas API `expand`
sections directly (`summaries`, `descriptions`, `examples`, `external_docs`, `tags`, `titles`,
`custom_properties`, or `all`) when you want, say, only summaries. If live access fails, `scapi_schemas_list` returns
the bundled contract with `source: "bundled"` and a `warning`. Large contracts: fetch through `scapi_execute` and return only relevant
fields ([example](custom-properties.md)). Requires `sfcc.scapi-schemas`.
Use the same project/instance for schema lookup and writes.

Live contracts found by `schemas: "live"` search, expanded `scapi_schemas_list`
fetches, or Schemas API reads inside `scapi_execute` are cached for that tenant.
`scapi_execute` then routes to them, replacing bundled versions; they never change
the offline `spec`. If schema access fails, report it; use
already-known fields or ask for missing details. The optional CLI equivalent is
`b2c scapi schemas get`, which also expands custom properties by default.

For custom endpoint contracts, search with `schemas: "live"` or use
`scapi_schemas_list` with `apiFamily: "custom"`; check registration with
`scapi_custom_apis_get_status` when needed. Custom endpoints found through live
search are callable from `scapi_execute` for the same tenant. Otherwise fetch the
live contract through `scapi.request` in the program before making declared calls. `AmOAuth2`
and `ShopperToken` operations use their declared `c_*` scopes. [Custom API workflow](custom-apis.md).
