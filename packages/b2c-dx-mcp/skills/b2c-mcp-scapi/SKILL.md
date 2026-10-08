---
name: b2c-mcp-scapi
description: Required before scapi_search or scapi_execute. Discover standard and live custom SCAPI contracts, compose Admin and Shopper requests, and verify changes under configured authentication and Safety Mode.
---

# SCAPI Code Mode

Dedicated tool first. Else `scapi_search` (find op) then `scapi_execute` (call it). Code = JS async arrow fn. No TypeScript, no imports.
Read this once, then pass `skillRead: true`. Reading does not authorize mutations.
Warehouse SQL/reports: `cip_*`, not here. Files: `webdav_*`. Local build/fs: terminal.
Operations or incidents (jobs, checkout, orders, eCDN traffic/bots): read the matching `b2c-ops` runbook from the [skill index](skill://mcp/b2c-mcp-server/SKILL.md#skill-index) first.

## `spec` shape (search and execute)

Only these exist. No `spec.schemas`, no `spec.operations`. Do not probe.

```ts
declare const spec: {
  apis: Array<{id: string; apiFamily: string; apiName: string; apiVersion: string; status: string}>; // id: 'product/catalogs/v1'
  paths: Record<string, Record<string, Operation>>; // fullPath -> lowercase method -> op
  resolve(value: unknown, apiId: string): unknown; // expand local $ref
  // ranked fuzzy search over summary/description/tags/operationId/path; newest API version only
  search(query: string, o?: {limit?: number}): Promise<Array<Match>>; // limit default 10, max 50
};
// spec.paths[m.path][m.method] is the full op; otherVersions = older versions with the same op
type Match = {api: string; method: string; path: string; operationId?: string; summary?: string; score: number; otherVersions?: string[]};
// fullPath = '/' + api id + path, e.g. '/product/catalogs/v1/organizations/{organizationId}/catalogs/{catalogId}'
interface Operation {
  api: string;
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters: Array<{name: string; in: string; required?: boolean; schema?: unknown}>;
  requestBody?: {required?: boolean; content: Record<string, {schema: any}>};
  responses?: Record<string, unknown>;
  security: Array<Record<string, string[]>>;
  auth: {types: string[]; schemes: string[]; executable: boolean}; // executable = runtime support, not access
}
```

`scapi_execute` also has (`async (input) => ...`, `input` = tool input):

```ts
declare const organizationId: string | undefined;
declare const siteId: string | undefined;
declare const scapi: {
  request(o: {
    method: string;
    path: string;
    query?: Record<string, unknown>;
    body?: unknown;
  }): Promise<{status: number; ok: boolean; data: any; diagnostic?: {code: string; message: string}}>;
};
```

## Rules

- Result cap 24 KB (`SCAPI_RESULT_TOO_LARGE`). Whole op = 6-20 KB. NEVER return `op` or `spec.paths` entries whole. List `{operationId, method, path, summary}`; then return only `parameters`/`requestBody` of ops you will call.
- Start with `await spec.search('task words')`; it matches prose (`summary`, `description`, `tags`) and tolerates typos. Regex over `spec.paths` to narrow or enumerate.
- `scapi_search` default `detail:"outline"` drops nested descriptions/examples. `detail:"full"` restores. Execute sees full.
- Default corpus = bundled standard. `schemas:"live"` = tenant (`c_*`, custom APIs, newer APIs); falls back to bundled with `warnings`. Tell user if `c_*`/custom APIs matter.
- `scapi.request` auths itself. Never fetch tokens first. Path `{organizationId}` auto-fills.
- Check `ok`/`status`. Writes: read back. Check before retry. Await every request.
- Limits: 20 calls, 4 parallel, 30 s. `fetch`/`WebSocket` disabled.
- Write needing approval pauses for client elicitation. Decline = whole run ends. Never fake approval.

```js
// rank candidates by prose (await it)
async () => spec.search('apply coupon to basket', {limit: 8});

// enumerate with a filter
async () =>
  Object.entries(spec.paths)
    .flatMap(([path, methods]) =>
      Object.entries(methods).map(([method, op]) => ({method, path, operationId: op.operationId, summary: op.summary})),
    )
    .filter((o) => /basket/i.test(o.summary ?? '') && /coupon|promotion/i.test(o.summary ?? ''));

// inspect only needed fields
async () => {
  const op = spec.paths['/product/products/v1/organizations/{organizationId}/products/{productId}'].put;
  const body = op.requestBody.content['application/json'].schema;
  return {parameters: op.parameters, required: body.required, security: op.security, auth: op.auth};
};
```

## Authentication

- Admin `AmOAuth2`: Account Manager `clientId`/secret. Shopper `ShopperToken`: SLAS guest (`slasClientId`, needs `siteId`).
- Op's declared security picks credential. No auth option.
- Missing creds: `config_inspect`. 401/403: keep `status`/`data`/`diagnostic`. 403 alone != missing scope.
- Unsupported: registered-shopper-only ops, SLAS itself (`shopper/auth/v1`).
- Detail: [authentication](references/authentication.md).

## Read when needed (do not read all)

| Need                                                                                                                | Read                                                                           |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Pick API for a task (jobs, code versions, sites, products, promotions); live/custom schemas; `c_*` fields; `expand` | [discover](references/discover.md)                                             |
| Compose multi-call program, verify, paging, limits                                                                  | [compose-verify](references/compose-verify.md)                                 |
| Approval, cancel, `input_required`                                                                                  | [confirmation](references/confirmation.md)                                     |
| Auth, scopes, token export                                                                                          | [authentication](references/authentication.md), [tokens](references/tokens.md) |
| Snippets (`codemode.search/describe/run`, `builtin/`, `user/`)                                                      | [workflows](references/workflows.md)                                           |
| Custom API                                                                                                          | [custom-apis](references/custom-apis.md)                                       |
