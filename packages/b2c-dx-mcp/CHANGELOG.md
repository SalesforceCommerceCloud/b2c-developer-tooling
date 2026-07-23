# @salesforce/b2c-dx-mcp

## 1.9.1

### Patch Changes

- [#581](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/581) [`1fe5ff2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1fe5ff2e49b4aef66c81ad9b9c9dd4b92d1da405) - Expose directly related documentation IDs from Salesforce Help child-topic links and Developer Center guide TOCs, including articles previously omitted from composite Help maps or hyphenated topic filenames. CLI and MCP documentation search results can now be paged by ranked position, so agents can traverse the full published content without surfacing future-profiled Help content. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`1fe5ff2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1fe5ff2e49b4aef66c81ad9b9c9dd4b92d1da405)]:
  - @salesforce/b2c-tooling-sdk@1.21.1

## 1.9.0

### Minor Changes

- [#568](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/568) [`633f3cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/633f3cb7d409132f107b012e26448ab7812ed506) - Log commands and tools can now access logs in `Logs/` subdirectories (such as `internal/`). Pass a path-like `--filter`/`prefixes` value containing a `/` — e.g. `--filter internal/server` to target `server-*.log` files under `internal/`, or `--filter internal/` for everything in that subdirectory. Plain prefix filters (and the default listing) are unchanged and still only scan the top-level `Logs/` directory, so there is no performance impact unless you opt in with a path filter. Works across `logs list`, `logs get`, `logs tail`, and the corresponding MCP tools. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`f169fa1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f169fa153f75f4f3b76622b4300c11631deb50b0), [`633f3cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/633f3cb7d409132f107b012e26448ab7812ed506)]:
  - @salesforce/b2c-tooling-sdk@1.21.0

## 1.8.1

### Patch Changes

- Updated dependencies [[`3b1152f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3b1152f4a21bf167b1c647677f36c1507d0a476c)]:
  - @salesforce/b2c-tooling-sdk@1.20.1

## 1.8.0

### Minor Changes

- [#563](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/563) [`9fb332d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9fb332d92cc3289d2796c97a4c70f839dfe5f999) - Add a Salesforce Help documentation corpus to `docs search`/`docs read` (and the MCP docs tools), covering Business Manager administration and merchandising content from help.salesforce.com. It is split into two categories — `help-admin` (import/export, jobs, replication, security, Account Manager, permissions, logs, inventory) and `help-merchant` (catalogs, products, promotions, search, content, analytics, SEO) — so you can search platform-administration and merchandising topics alongside the existing Script API, Developer Center, and tooling docs. (Thanks [@clavery](https://github.com/clavery)!)

  You can scope the whole docs corpus to chosen categories with the new `docsCategories` config field, sourced from `dw.json` (`docs-categories`), the `SFCC_DOCS_CATEGORIES` env var, or `package.json` — in addition to the existing `--topics` / `--docs-topics` flags (which still override config). For example, set `"docs-categories": ["script-api", "job-step", "help-admin", "tooling"]` in dw.json to expose only developer + admin docs.

### Patch Changes

- [#563](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/563) [`9fb332d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9fb332d92cc3289d2796c97a4c70f839dfe5f999) - `docs read` / `docs_read` now apply the same workspace-aware ranking as `docs search` when resolving a **fuzzy** query, so a fuzzy read (e.g. `productmgr`) returns the same top result that search ranks first for the current project. Exact id lookups (e.g. `dw.catalog.ProductMgr`) are unaffected — they resolve deterministically. The CLI gains a `--workspace` flag on `docs read` (defaults to auto-detect; `all` opts out); the MCP `docs_read` uses the server's detected workspace. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`9fb332d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9fb332d92cc3289d2796c97a4c70f839dfe5f999), [`9fb332d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9fb332d92cc3289d2796c97a4c70f839dfe5f999), [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767), [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767), [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767)]:
  - @salesforce/b2c-tooling-sdk@1.20.0

## 1.7.0

### Minor Changes

- [#557](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/557) [`71dfe3a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/71dfe3a86b7e752ffad9f3d44f1e7c6357e431fa) - Fix costly recursive filesystem scan on MCP server startup. Workspace auto-discovery previously did an unbounded `**/.project` walk from the launch directory, which could hang startup when the server was spawned from a home directory (as Cursor and Claude Code often do). Discovery is now skipped entirely when explicit `--toolsets`/`--tools` are provided, skipped for home and root directories, and otherwise depth-bounded and short-circuited at the first match. `findCartridges` gains optional `maxDepth` and `firstMatchOnly` options for callers that need a bounded search (existing callers are unaffected). (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`71dfe3a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/71dfe3a86b7e752ffad9f3d44f1e7c6357e431fa)]:
  - @salesforce/b2c-tooling-sdk@1.19.1

## 1.6.0

### Minor Changes

- [#552](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/552) [`fdf3c5f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/fdf3c5fe570ff71fddfc4aa0d83c9e3a05be5406) - Add Metrics API support (**CLOSED BETA**). The new SCAPI Observability Metrics API (`observability/metrics/v1`) is now available across the tooling: (Thanks [@clavery](https://github.com/clavery)!)
  - **SDK:** a typed `createMetricsClient` plus `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, and `getMetricsByCategory` operations that fetch operational time-series metrics for an organization. Admin OAuth scope `sfcc.metrics` is handled automatically. Time bounds accept a `Date` or epoch milliseconds and are sent to the API as epoch seconds; response timestamps are normalized to epoch milliseconds. Optional `enrichMetricsTags`/`parseSeriesTags` helpers add a structured `tags` object (`realm`, `environment`, applied filters, and per-series dimensions like `apiFamily`/`host`/`cacheStatus`) to each series, so consumers can group and filter by dimension instead of parsing the packed series id.
  - **CLI:** a new `metrics` topic with per-category commands (`b2c metrics overall`, `b2c metrics scapi`, `b2c metrics ocapi`, etc.) and `b2c metrics list` — with table and `--json` output. The time window is set with `--from`/`--to` (relative like `1h`/`7d` or ISO 8601) and an optional `--window` duration (e.g. `--from 7d --window 1h` for a one-hour window seven days ago). Any open bound defaults to a 24-hour window (the API caps a window at 24 hours), so requests always send an explicit range. Category-specific filter flags (`--api-family`, `--api-name`, `--ocapi-category`, `--ocapi-api`, `--third-party-service-id`) live only on the command they apply to. Each series is enriched with a structured `tags` object by default; use `--no-tags` for the raw API shape.
  - **MCP:** a `metrics_get` tool in the SCAPI toolset (gated as non-GA; requires `--allow-non-ga-tools`). Series are returned with the structured `tags` object.

  This is a closed beta feature: it must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.

### Patch Changes

- [#556](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/556) [`7fb1122`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7fb1122549bc4ace13049191ebb9a06e1f1ab925) - Pin the `b2c-dx-mcp` Claude Code plugin to the exact published MCP server version instead of `@latest`, and version its marketplace entry. `npx` reuses a cached package for a floating tag, so users could keep running a stale server (e.g. missing the latest docs tools) after an upgrade — an exact version forces a fetch, and versioning the marketplace entry makes clients re-pull the new pin. The pin and marketplace version track the MCP release automatically. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`fdf3c5f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/fdf3c5fe570ff71fddfc4aa0d83c9e3a05be5406)]:
  - @salesforce/b2c-tooling-sdk@1.19.0

## 1.5.0

### Minor Changes

- [#546](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/546) [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1) - Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` (CLI), the `docs_*` MCP tools, and the SDK docs module. Documentation search now spans Script API reference, standard job steps, Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), and this tooling's own guides, with content-aware ranking and workspace-aware results tuned to the detected project type. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#545](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/545) [`ed1e214`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ed1e21405f69503e693c7bcadb8b9cc1f4a09ddf) - Stop MCP debug tools from routinely suggesting the session cookie (`dwsid`). The cookie is only needed in the rare multi-app-server production instance group case where a breakpoint is never hit — it is now surfaced as a troubleshooting hint on breakpoint timeout instead of in the `debug_start_session`/`debug_list_sessions` descriptions. Also clarifies that the debugger needs standard Basic auth (account password or a `WebDAV File Access and UX Studio` access key) with no separate Business Manager enablement step. (Thanks [@clavery](https://github.com/clavery)!)

- [#546](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/546) [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1) - Documentation entries now expose both a human-facing `url` (the rendered `.html` page, for citing/opening in a browser) and a machine-readable `sourceUrl` (the raw `.md`). Content is always sourced from `.md`, and Script API reference entries gain durable `developer.salesforce.com` permalinks (previously only guides had URLs). Surface them in the CLI with `--columns url,sourceUrl` (or `-x`) and in the MCP `docs_search` `verbose` output. (Thanks [@clavery](https://github.com/clavery)!)

- [#525](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/525) [`3d0c4aa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3d0c4aae7a2c6c33cd82ad94cde35e4cdb5155ca) - Telemetry for MCP tool failures and VS Code extension activation failures now records the underlying error message (and cause, when present), instead of an empty value. Previously these failure events carried no error detail, which made it impossible to diagnose why a tool call or activation failed. No new data beyond the error text is collected, matching what the CLI already reports for command errors. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`04b02f3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/04b02f3b4b1c1e4c353ad081fc41304276c8bdb2), [`3d0c4aa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3d0c4aae7a2c6c33cd82ad94cde35e4cdb5155ca), [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1), [`7055134`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7055134e755c391cd7839c11c99d66df18672866), [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1), [`9418f08`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9418f088d7abfff01d41f4339beb62be29df7810), [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1), [`31ec679`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31ec679ca6058d2ba7f453528af873163a5baeff), [`b62b00b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b62b00b47855273dfedea62f932696cc24ef148f), [`31324e1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31324e16fd0fb5402a3da1340f3575708c336661), [`cab53af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cab53af8c1190f749adf2ab8d70c01f79d7d2dbc)]:
  - @salesforce/b2c-tooling-sdk@1.18.0

## 1.4.1

### Patch Changes

- Updated dependencies [[`2f79d71`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/2f79d711475add9707ee2474f6dfab416dd88ba6), [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88), [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88)]:
  - @salesforce/b2c-tooling-sdk@1.17.0

## 1.4.0

### Minor Changes

- [#522](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/522) [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019) - Expose the script debugger session cookie (`dwsid`) so you can route a triggering request to the same app server holding the debug session — required to reliably hit breakpoints on multi-app-server instances. (Thanks [@clavery](https://github.com/clavery)!)
  - **SDK:** new `SdapiClient.getCookie(name)` and `DebugSessionManager.getSessionCookie()`; the cookie is also logged at info level when the session connects.
  - **MCP:** `debug_start_session` and `debug_list_sessions` now return a `session_cookie` field.
  - **VS Code:** a new **Copy Debugger Session ID (dwsid)** command (available while a debug session is active) copies the cookie to the clipboard.

  Send your triggering request (storefront page load, SCAPI/OCAPI call) with `Cookie: dwsid=<value>`.

### Patch Changes

- Updated dependencies [[`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019), [`3958d6e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3958d6eb568a1e91061f4203c986a124c480e12f), [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019)]:
  - @salesforce/b2c-tooling-sdk@1.16.0

## 1.3.3

### Patch Changes

- Updated dependencies [[`3bc78c4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bc78c422d57b590b2435fd6ae0a31fffc4bd7e7)]:
  - @salesforce/b2c-tooling-sdk@1.15.1

## 1.3.2

### Patch Changes

- Updated dependencies [[`3bce44e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bce44e2e6d4cea3cf64e34eff1246d86e459b73), [`0d97ad1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d97ad1856d6a45d9349a3609c7e425d2b5e874a)]:
  - @salesforce/b2c-tooling-sdk@1.15.0

## 1.3.1

### Patch Changes

- [#510](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/510) [`1575070`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/15750709ca6b23838bb9fd954d6c09e8dbb67ed3) - Resolve all critical and high severity dependency advisories reported by `pnpm audit`. (Thanks [@clavery](https://github.com/clavery)!)

  Direct dependencies of the published packages were bumped in package.json so that consumers installing the SDK, CLI, or MCP server receive the patched versions: the SDK raises `js-yaml`, `minimatch`, `protobufjs`, and `undici`, and the MCP server raises `yaml` and `postcss`. The SDK also upgrades `applicationinsights` from 2.x to 3.x to pick up a non-vulnerable `@opentelemetry/core`; this is an internal telemetry change with no public API impact.

  Remaining transitive advisories with no direct-dependency lever are pinned to patched releases (within their existing major versions) via workspace overrides: fast-xml-parser, hono, @hono/node-server, ws, vite, rollup, form-data, http-proxy-middleware, path-to-regexp, serialize-javascript, lodash, underscore, flatted, fast-uri, tmp, express-rate-limit, brace-expansion, shell-quote, and @opentelemetry/core.

- Updated dependencies [[`1575070`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/15750709ca6b23838bb9fd954d6c09e8dbb67ed3)]:
  - @salesforce/b2c-tooling-sdk@1.14.1

## 1.3.0

### Minor Changes

- [#498](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/498) [`c58924d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c58924d643dc80251ff0cf35dbf8a647fb16d662) - Deprecate the Storefront Next MCP tools (`sfnext_*`) in favor of the `storefront-next` and `storefront-next-figma` agent-skills plugins. These tools are not compatible with the Storefront Next 1.0 GA release and will be removed in a future release. (Thanks [@clavery](https://github.com/clavery)!)

  The six `sfnext_*` tools have moved to a new `STOREFRONTNEXT_DEPRECATED` toolset that is never auto-enabled by project detection and is excluded from `--toolsets all`. To keep using them, request the toolset explicitly: `--toolsets STOREFRONTNEXT_DEPRECATED --allow-non-ga-tools`. Storefront Next projects still auto-enable the `STOREFRONTNEXT` toolset (MRT bundle push, SCAPI discovery/scaffolding, and diagnostics). Migrate to the agent-skills plugins — see the Agent Skills guide for installation.

- [#497](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/497) [`0f8cb8c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0f8cb8c3bda7ec6ed71db32476ec839c5a6e5f96) - Add MRT log-tail MCP tools (`mrt_logs_watch_start`, `mrt_logs_watch_poll`, `mrt_logs_watch_stop`, `mrt_logs_watch_list`) for streaming application logs from a Managed Runtime environment over a WebSocket. These mirror the SFCC instance `logs_watch_*` lifecycle — start a watch before triggering an action, poll to drain buffered entries, then stop — and are available in the DIAGNOSTICS, PWAV3, and STOREFRONTNEXT toolsets. Requires MRT project + environment + API key configuration. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1), [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1)]:
  - @salesforce/b2c-tooling-sdk@1.14.0

## 1.2.1

### Patch Changes

- Updated dependencies [[`19f059e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/19f059e7ba928d1070d7960920770f1256dfae73)]:
  - @salesforce/b2c-tooling-sdk@1.13.0

## 1.2.0

### Minor Changes

- [#420](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/420) [`de8d40b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/de8d40b54dc923c5805fac2ef587db8b86349a6b) - Add MCP tools for log inspection and documentation lookup. Logs: `logs_list_files`, `logs_get_recent`, and a `logs_watch_start` / `logs_watch_poll` / `logs_watch_stop` / `logs_watch_list` lifecycle that buffers entries between polls so agents don't miss logs produced between tool calls. Docs: `docs_search`, `docs_read`, `docs_list`, `docs_schema_search`, `docs_schema_read`, `docs_schema_list` for the bundled Script API and XSD schema corpora. Adds a new `DIAGNOSTICS` toolset that groups the script debugger and log tools; like `SCAPI`, it is always enabled (auto-discovered for every project type). SDK now also exports the log filter helpers (`parseSinceTime`, `filterBySince`, `filterByLevel`, `filterBySearch`, `matchesLevel`, `matchesSearch`) for reuse. (Thanks [@clavery](https://github.com/clavery)!)

  The log watch buffers `logs_watch_start` defaults to `last_entries: 0` (capture only new entries, matching the "start before triggering" workflow), bounds the entry buffer by bytes as well as count, reports each discovered file only once per poll, stops the underlying tail if a concurrent-start hostname race loses registration, and makes `logs_watch_stop` truly idempotent.

### Patch Changes

- Updated dependencies [[`b723939`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b72393951bb95b64f3291cd3cb76197e280a6a37), [`21bbed0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/21bbed0ea1b42e8750d4259669370f8bcf562c10), [`de8d40b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/de8d40b54dc923c5805fac2ef587db8b86349a6b), [`80e63fc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80e63fca888d9b83efd53c9c0054247fb2aa31b3), [`c8e0b60`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c8e0b602e1a8da88f7e6620e5d5614f3a55689bd)]:
  - @salesforce/b2c-tooling-sdk@1.12.0

## 1.1.3

### Patch Changes

- Updated dependencies [[`b8dcf74`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b8dcf741c253fee0df4219400bfa10a79c704e98)]:
  - @salesforce/b2c-tooling-sdk@1.11.1

## 1.1.2

### Patch Changes

- Updated dependencies [[`5d62ac2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5d62ac21a505c3ae4c58507fe0ffe65a5ee89087), [`db7b330`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db7b330cf60debf05d681b9e1dbb4e025d8eec02), [`5e43132`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5e43132ab1b10da33517a697b32e22737d2f9bb4)]:
  - @salesforce/b2c-tooling-sdk@1.11.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`e4b8238`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b82385bfddb93a17f874f34315e4ab73e7c84a)]:
  - @salesforce/b2c-tooling-sdk@1.10.0

## 1.1.0

### Minor Changes

- [#395](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/395) [`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe) - Add script debugger MCP tools to the CARTRIDGES and STOREFRONTNEXT toolsets. Includes `debug_start_session`, `debug_end_session`, `debug_list_sessions`, `debug_set_breakpoints`, `debug_wait_for_stop`, `debug_get_stack`, `debug_get_variables`, `debug_evaluate`, `debug_continue`, `debug_step_over`, `debug_step_into`, `debug_step_out`, and `debug_capture_at_breakpoint`. (Thanks [@clavery](https://github.com/clavery)!)

- [#395](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/395) [`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe) - Add `ServerContext` for persistent server-scoped state across MCP tool invocations. Enables stateful tools (debug sessions, log watches) while preserving per-call config reloading for existing tools. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#407](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/407) [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d) - - Telemetry send failures are no longer silently swallowed; they now log at debug level so deployment-monitoring drift is visible behind the `--debug` flag. (Thanks [@clavery](https://github.com/clavery)!)
  - `registerToolsets()` throws a clear error if invoked more than once for the same server instance (instead of producing a cryptic duplicate-tool error from the SDK).
- Updated dependencies [[`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe), [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c), [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d), [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29), [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29), [`51aed02`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/51aed020426f1ce3869b3d260d9af796db8a19e7), [`b53d75e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b53d75e196a6808b4fc9cac249c4495da2471846), [`b1600fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b1600fa014f9bd23c93488155b37ac2cc5c91fd2)]:
  - @salesforce/b2c-tooling-sdk@1.9.0

## 1.0.14

### Patch Changes

- Updated dependencies [[`4f30de7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4f30de783a049e33a121ec80a2cbd1c455f5d4e8)]:
  - @salesforce/b2c-tooling-sdk@1.8.0

## 1.0.13

### Patch Changes

- Updated dependencies [[`cb66b56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb66b563d5d5ca6a0f584d9007629ba392cb3424)]:
  - @salesforce/b2c-tooling-sdk@1.7.0

## 1.0.12

### Patch Changes

- Updated dependencies [[`485ef63`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/485ef63b901d91f7b08c56366d1f1756a03f60dc)]:
  - @salesforce/b2c-tooling-sdk@1.6.1

## 1.0.11

### Patch Changes

- Updated dependencies [[`1dc1ee5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1dc1ee55642f0d478d260867d538f02e32057d7e)]:
  - @salesforce/b2c-tooling-sdk@1.6.0

## 1.0.10

### Patch Changes

- Updated dependencies [[`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a), [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a)]:
  - @salesforce/b2c-tooling-sdk@1.5.0

## 1.0.9

### Patch Changes

- Updated dependencies [[`59dd584`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59dd584479cc024fa6eed365c7c91f64dc4110be), [`3dedc05`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3dedc05ade10f6d748b4168daef0e4c2fdaf1501), [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859)]:
  - @salesforce/b2c-tooling-sdk@1.4.0

## 1.0.8

### Patch Changes

- Updated dependencies [[`1b0b4ce`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b0b4ce2af63862438c0dae74df2efb35262139a)]:
  - @salesforce/b2c-tooling-sdk@1.3.2

## 1.0.7

### Patch Changes

- Updated dependencies [[`30de66b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/30de66bf59c250c5382a7427ba475049c68566cd)]:
  - @salesforce/b2c-tooling-sdk@1.3.1

## 1.0.6

### Patch Changes

- Updated dependencies [[`c04bbcb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c04bbcbb179d733bedc42f4d0eee2dff2256789e)]:
  - @salesforce/b2c-tooling-sdk@1.3.0

## 1.0.5

### Patch Changes

- Updated dependencies [[`464b9db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/464b9dbc3cf498e585d81ba5eb7ed0f17ff60a46), [`e6c6226`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e6c6226c256b8d181917cc8c66fa4d7bf992e106)]:
  - @salesforce/b2c-tooling-sdk@1.2.0

## 1.0.4

### Patch Changes

- Updated dependencies [[`6880a84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6880a846aacd029a1eb510023aa76f4b844ec26e)]:
  - @salesforce/b2c-tooling-sdk@1.1.0

## 1.0.3

### Patch Changes

- Updated dependencies [[`e597e61`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e597e6131b9965e88ef75954a935695fa7f6d70f)]:
  - @salesforce/b2c-tooling-sdk@1.0.1

## 1.0.2

### Patch Changes

- Updated dependencies [[`7ad490a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ad490a508b7f993292bd8a326f7a6c49c92d70c), [`c24e920`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c24e9204a5f253b773c43c0b30c064c7f4dec34a)]:
  - @salesforce/b2c-tooling-sdk@1.0.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e), [`cb74ce4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb74ce4c78a91cc49556f464be5124981a24c3ea), [`c10ddad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c10ddadf7277c93196c956b73af694f4f065a149), [`b7f78ca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b7f78ca6d2468e274b911c4fd1fc7c03a9e6b4fb)]:
  - @salesforce/b2c-tooling-sdk@0.13.0

## 1.0.0

### Major Changes

- [#289](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/289) [`7287490`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7287490d6ec4e3597822d0ee0e4d6775ae656845) - Document MCP server GA availability updates. CARTRIDGES, MRT, SCAPI, and PWAV3 tools are generally available and no longer require `--allow-non-ga-tools`; STOREFRONTNEXT tools remain in preview. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.5.4

### Patch Changes

- [#283](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/283) [`fb5ac83`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/fb5ac83b43db0666e8e17f62516eb04aac962c2d) - Fix marketplace schema validation for the `b2c-dx-mcp` plugin by adding the required `source` field (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.5.3

### Patch Changes

- Updated dependencies [[`f7229b4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f7229b4372bb23d8e107db75f722575c33f4a007)]:
  - @salesforce/b2c-tooling-sdk@0.12.0

## 0.5.2

### Patch Changes

- Updated dependencies [[`8c31081`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c31081b47e57e6a21e62425e6f19da036fc3e34), [`e4b5094`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b5094d9c1c2a60e1214bc236ce7ed84c5d158b)]:
  - @salesforce/b2c-tooling-sdk@0.11.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`b30e427`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b30e427f25807840dbcceef6c0005e2d9fd1be53), [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc), [`caa568e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/caa568e9de3e8c9d3f2e7b17e5f96c1a0ae3ca73)]:
  - @salesforce/b2c-tooling-sdk@0.10.0

## 0.5.0

### Minor Changes

- [#270](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/270) [`bf35222`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf352223881dccba4ba07c62bdf4d50a2832c835) - Rename MCP tools for clearer, action-oriented naming. scapi_custom_api_scaffold → scapi_custom_api_generate_scaffold. sfnext_map_tokens_to_theme → sfnext_match_tokens_to_theme. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.4.14

### Patch Changes

- Updated dependencies [[`16bd9d6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/16bd9d6a1c658d6ba3de04fa3acf89295e1e5e06), [`4cf7249`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4cf72497f5e01d627de7aae80290d072f4c914f6), [`9996eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9996eba2a8fe53a27bf52fb208eb722d618cd282), [`d50bf6b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d50bf6b91dcd40314f10c8c97a28805039161213)]:
  - @salesforce/b2c-tooling-sdk@0.9.0

## 0.4.13

### Patch Changes

- Updated dependencies [[`760a6cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/760a6cbe144ffcd7c72b32b05df861626d3d5a2c)]:
  - @salesforce/b2c-tooling-sdk@0.8.3

## 0.4.12

### Patch Changes

- Updated dependencies [[`d4423bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d4423bb218af3991396286b4900c3b051666e06b), [`69a98dc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/69a98dc21f3a326f551929fcd530741b9f0ca126)]:
  - @salesforce/b2c-tooling-sdk@0.8.2

## 0.4.11

### Patch Changes

- [#253](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/253) [`1147ea3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1147ea300b8faca02136d03900f734c73f002f16) - Changed oclif dirname from `b2c-dx-mcp` to `b2c` so the MCP server shares the same plugin directory as the CLI, enabling plugin discovery and unified plugin management. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

- [#253](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/253) [`1147ea3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1147ea300b8faca02136d03900f734c73f002f16) - Improved MCP documentation: added `@latest` to all examples to prevent Windows caching issues, standardized server name to `b2c-dx-mcp`, updated GitHub Copilot examples to use correct `servers` format with `type: stdio`, clarified MRT configuration options (`mrtProject`, `mrtEnvironment`, `mrtApiKey` in dw.json vs `api_key` in ~/.mobify), changed "Claude Desktop" to "Claude Code" throughout, simplified authentication sections, and improved flag documentation consistency across tool pages. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.4.10

### Patch Changes

- Updated dependencies [[`e790dfa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e790dfa8d5375fde7936ae4a10b2f3fd722ec087)]:
  - @salesforce/b2c-tooling-sdk@0.8.1

## 0.4.9

### Patch Changes

- Updated dependencies [[`b26ebeb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b26ebebd2b5dbff19689bdfadd5b9864597fbfb1)]:
  - @salesforce/b2c-tooling-sdk@0.8.0

## 0.4.8

### Patch Changes

- Updated dependencies [[`3758114`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3758114c328fcfffc54fb32a935df23503fc0ba2), [`1b9b477`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b9b4773110a5d97bfe81d37a093158088d94cee), [`732d4ad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/732d4ad1e52dd1e0f0676cee87305464ccf4ca9e)]:
  - @salesforce/b2c-tooling-sdk@0.7.0

## 0.4.7

### Patch Changes

- [#233](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/233) [`6eba028`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6eba028edbb30c47dd2933cd35f0de52a5b62ccb) - cartridge_deploy now reminds users to update the site cartridge path in Business Manager (Sites → Manage Sites → [site] → Settings tab → Cartridges) after deploy. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

- [#226](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/226) [`8c6665b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c6665ba8a51ddf1d572b9fbff66b9685699880e) - MCP MRT Push now uses correct defaults based on detected project type (Thanks [@patricksullivansf](https://github.com/patricksullivansf)!)

- Updated dependencies [[`8faf831`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8faf831b4e4827e252e48242b2a2b2155157f3c2)]:
  - @salesforce/b2c-tooling-sdk@0.6.0

## 0.4.6

### Patch Changes

- [`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc) - MRT environment variables now use non-prefixed names (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN`) as primary. The `SFCC_`-prefixed versions continue to work as fallbacks. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc)]:
  - @salesforce/b2c-tooling-sdk@0.5.5

## 0.4.5

### Patch Changes

- [#202](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/202) [`917c230`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/917c230d033b7b12bd0262d221173618f71cd0a7) - Unregister placeholder tools and update README for preview release (Thanks [@yhsieh1](https://github.com/yhsieh1)!)
  - Remove placeholder tools (PWA Kit, Storefront Next) so users only see implemented tools at startup
  - Update README: preview release wording, accurate tool tables, credential notes, example prompts
  - Fix package license to Apache-2.0

## 0.4.4

### Patch Changes

- Updated dependencies [[`f9ebb56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9ebb562d0c894aed9f0498b78ca01fce70db352)]:
  - @salesforce/b2c-tooling-sdk@0.5.4

## 0.4.3

### Patch Changes

- [#206](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/206) [`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4) - Add `globalConfigSourceRegistry` for automatic plugin config source inclusion in `resolveConfig()`, matching the existing middleware registry pattern. Plugin config sources are now picked up automatically by all SDK consumers without manual plumbing. Also improves test isolation by preventing locally installed plugins from affecting test runs. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4)]:
  - @salesforce/b2c-tooling-sdk@0.5.3

## 0.4.2

### Patch Changes

- Updated dependencies [[`a9db7da`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a9db7daf60a9071244c8e2e098dbd4f8fc58495d), [`dc7a25a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/dc7a25aedef047190250b696421e4a25c00cba15)]:
  - @salesforce/b2c-tooling-sdk@0.5.2

## 0.4.1

### Patch Changes

- [#199](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/199) [`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542) - Rename `--working-directory` flag to `--project-directory`. The old flag name `--working-directory` is still accepted as an alias. Primary env var is now `SFCC_PROJECT_DIRECTORY`; `SFCC_WORKING_DIRECTORY` continues to work as a deprecated fallback. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542)]:
  - @salesforce/b2c-tooling-sdk@0.5.1

## 0.4.0

### Minor Changes

- [#133](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/133) [`1485923`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1485923581c6f1cb01c48a2e560e369843952020) - # Add new MCP tools (Thanks [@yhsieh1](https://github.com/yhsieh1)!)
  - `scapi-schemas-list`: List and fetch SCAPI schemas (standard and custom)
  - `scapi-custom-apis-status`: Check custom API endpoint registration status
  - `mrt_bundle_push`: Push and deploy a pre-built Storefront Next PWA Kit project to Managed Runtime
  - `cartridge_deploy`: Find and deploy cartridges to a B2C Commerce instance via WebDAV
  - `storefront_next_development_guidelines`: Get critical architecture rules, coding standards, and best practices for Storefront Next development

### Patch Changes

- Updated dependencies [[`55c81c3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/55c81c3b3cdd8b85edfe5eb0070e28a96752ac83), [`87321c0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/87321c0051c171d35ca53760d4cffa3f9ebe406c), [`556f916`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/556f916f74c43373c0da125af1b53721b2c193ec), [`1485923`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1485923581c6f1cb01c48a2e560e369843952020)]:
  - @salesforce/b2c-tooling-sdk@0.5.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`ca9dcf0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca9dcf0e9242dce408cf0c8e9cf1920d5ad40157)]:
  - @salesforce/b2c-tooling-sdk@0.4.1

## 0.3.1

### Patch Changes

- Updated dependencies [[`1a3117c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1a3117c42211e4db6629928d1f8a58395a0cadc7), [`7a3015f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7a3015f05183ad09c55e20dfe64ce7f3b8f1ca50), [`59fe546`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59fe54612e35530ccb000e0b16afba5c62eed429), [`44b67f0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/44b67f00ded0ab3a458f91f55b00b7106fb371be), [`91593f2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91593f28cb25b9a466c6ef0db1504b39f3590c7a), [`0d29262`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d292625f4238fef9fb1ca530ab370fdc6e190d8), [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81), [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81), [`8592727`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/859272776afa5a9d6b94f96b13de97a7af9814eb), [`908be47`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/908be47541f5d3d88b209f69ede488c9464606cb)]:
  - @salesforce/b2c-tooling-sdk@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [[`ddee52e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ddee52e2c61991dbcc4d3aeed00ee802530a0e7c), [`6859880`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6859880195d2da4cd6363451c79224878917abb7), [`6b89ed6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6b89ed622a1f59e91cfd6dad643a5e834d8d7470), [`c34103b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c34103b594dee29198de3ae6fe0077ff12cd3f93)]:
  - @salesforce/b2c-tooling-sdk@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`4e90f16`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4e90f161f8456ff89c4e99522ae83ae6a7352a44)]:
  - @salesforce/b2c-tooling-sdk@0.2.1

## 0.2.0

### Patch Changes

- Updated dependencies [[`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34), [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570), [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26), [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2), [`a14c741`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a14c7419b99f3185002f8c7f63565ed8bc2eea90)]:
  - @salesforce/b2c-tooling-sdk@0.2.0

## 0.1.0

### Patch Changes

- Updated dependencies [[`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a)]:
  - @salesforce/b2c-tooling-sdk@0.1.0
