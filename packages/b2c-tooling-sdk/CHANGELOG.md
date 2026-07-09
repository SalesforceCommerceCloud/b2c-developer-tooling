# @salesforce/b2c-tooling-sdk

## 1.19.1

### Patch Changes

- [#557](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/557) [`71dfe3a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/71dfe3a86b7e752ffad9f3d44f1e7c6357e431fa) - Fix costly recursive filesystem scan on MCP server startup. Workspace auto-discovery previously did an unbounded `**/.project` walk from the launch directory, which could hang startup when the server was spawned from a home directory (as Cursor and Claude Code often do). Discovery is now skipped entirely when explicit `--toolsets`/`--tools` are provided, skipped for home and root directories, and otherwise depth-bounded and short-circuited at the first match. `findCartridges` gains optional `maxDepth` and `firstMatchOnly` options for callers that need a bounded search (existing callers are unaffected). (Thanks [@clavery](https://github.com/clavery)!)

## 1.19.0

### Minor Changes

- [#552](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/552) [`fdf3c5f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/fdf3c5fe570ff71fddfc4aa0d83c9e3a05be5406) - Add Metrics API support (**CLOSED BETA**). The new SCAPI Observability Metrics API (`observability/metrics/v1`) is now available across the tooling: (Thanks [@clavery](https://github.com/clavery)!)
  - **SDK:** a typed `createMetricsClient` plus `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, and `getMetricsByCategory` operations that fetch operational time-series metrics for an organization. Admin OAuth scope `sfcc.metrics` is handled automatically. Time bounds accept a `Date` or epoch milliseconds and are sent to the API as epoch seconds; response timestamps are normalized to epoch milliseconds. Optional `enrichMetricsTags`/`parseSeriesTags` helpers add a structured `tags` object (`realm`, `environment`, applied filters, and per-series dimensions like `apiFamily`/`host`/`cacheStatus`) to each series, so consumers can group and filter by dimension instead of parsing the packed series id.
  - **CLI:** a new `metrics` topic with per-category commands (`b2c metrics overall`, `b2c metrics scapi`, `b2c metrics ocapi`, etc.) and `b2c metrics list` — with table and `--json` output. The time window is set with `--from`/`--to` (relative like `1h`/`7d` or ISO 8601) and an optional `--window` duration (e.g. `--from 7d --window 1h` for a one-hour window seven days ago). Any open bound defaults to a 24-hour window (the API caps a window at 24 hours), so requests always send an explicit range. Category-specific filter flags (`--api-family`, `--api-name`, `--ocapi-category`, `--ocapi-api`, `--third-party-service-id`) live only on the command they apply to. Each series is enriched with a structured `tags` object by default; use `--no-tags` for the raw API shape.
  - **MCP:** a `metrics_get` tool in the SCAPI toolset (gated as non-GA; requires `--allow-non-ga-tools`). Series are returned with the structured `tags` object.

  This is a closed beta feature: it must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.

## 1.18.0

### Minor Changes

- [#546](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/546) [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1) - Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` (CLI), the `docs_*` MCP tools, and the SDK docs module. Documentation search now spans Script API reference, standard job steps, Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), and this tooling's own guides, with content-aware ranking and workspace-aware results tuned to the detected project type. (Thanks [@clavery](https://github.com/clavery)!)

- [#542](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/542) [`b62b00b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b62b00b47855273dfedea62f932696cc24ef148f) - Add optional `preview` property to the page-type JSON Schema to mirror ECOM W-23233931. (Thanks [@favour-onukogu](https://github.com/favour-onukogu)!)

### Patch Changes

- [#550](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/550) [`04b02f3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/04b02f3b4b1c1e4c353ad081fc41304276c8bdb2) - Clarified SFCC_SHORTCODE vs SFCC_SHORT_CODE env var usage (Thanks [@patricksullivansf](https://github.com/patricksullivansf)!)

- [#525](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/525) [`3d0c4aa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3d0c4aae7a2c6c33cd82ad94cde35e4cdb5155ca) - Improve "configuration required" errors and error telemetry: (Thanks [@clavery](https://github.com/clavery)!)
  - When a command needs instance/auth configuration but no source is found at all (no flags, environment variables, or dw.json), the error now points to the configuration guide (https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html) so first-time users know where to start. When a config source is present, the existing message (which lists the specific flag/env var to set) is unchanged.
  - Command-error telemetry now tags each error with a category (`validation`, `guardrail`, or `runtime`) so expected user/config errors and safety-guard blocks can be separated from genuine runtime failures when measuring reliability.
  - All telemetry events now include an `isCI` flag indicating whether they originated from a CI/automation environment, so automation traffic can be distinguished from interactive developer usage.

- [#554](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/554) [`7055134`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7055134e755c391cd7839c11c99d66df18672866) - Bound the online documentation fetch (Developer Center guides read via `docs_read`) with a 10s timeout. Previously a stalled or unreachable connection would hang the read indefinitely; it now falls back to the indexed offline summary once the timeout elapses. (Thanks [@clavery](https://github.com/clavery)!)

- [#546](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/546) [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1) - Documentation entries now expose both a human-facing `url` (the rendered `.html` page, for citing/opening in a browser) and a machine-readable `sourceUrl` (the raw `.md`). Content is always sourced from `.md`, and Script API reference entries gain durable `developer.salesforce.com` permalinks (previously only guides had URLs). Surface them in the CLI with `--columns url,sourceUrl` (or `-x`) and in the MCP `docs_search` `verbose` output. (Thanks [@clavery](https://github.com/clavery)!)

- [#551](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/551) [`9418f08`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9418f088d7abfff01d41f4339beb62be29df7810) - Fix OAuth client authentication failing for client secrets containing `+` (or other reserved characters). Per RFC 6749 §2.3.1, the client ID and secret are now form-url-encoded before being Base64-encoded into the HTTP Basic `Authorization` header, matching how they are already encoded when sent in the request body. Previously a raw `+` in a secret was decoded to a space by Account Manager, causing `invalid_client` errors on Basic auth even though the same credential worked via the request body. Affects the client-credentials/password grants (`b2c auth client`, token renewal) and SLAS private-client flows. (Thanks [@j-256](https://github.com/j-256)!)

- [#546](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/546) [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1) - Fix Storefront Next workspace detection misclassifying PWA Kit projects. A PWA Kit app that depends on `@salesforce/storefront-next-runtime` (now common) was incorrectly detected as Storefront Next as well. Detection now keys on the `@salesforce/storefront-next-dev` toolchain dependency, and a positive PWA Kit signal rules out Storefront Next. (Thanks [@clavery](https://github.com/clavery)!)

- [#553](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/553) [`31ec679`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31ec679ca6058d2ba7f453528af873163a5baeff) - Reworked the MCP Server documentation to be leaner and human-focused: trimmed internal implementation prose from the tool reference pages, reorganized the nav around toolsets and logical tool groups (combined the two log pages and the two SCAPI custom-API pages, with client-side redirects from the old URLs), corrected the project-type auto-detection table, and removed agent-directed prompting guidance. Renamed the homepage/header "Agent Skills" entry to "Agent Plugins" and grouped the MCP plugin with the core plugins in the install instructions. The `b2c-docs` skill now notes that the MCP `docs_*` tools offer the same coverage as the CLI. (Thanks [@clavery](https://github.com/clavery)!)

  The `tooling` documentation corpus (the CLI/MCP/SDK guides available via `docs search`/`read`) no longer bundles a copy of each page's markdown in the SDK — like the Developer Center guides, its content is now fetched online from the docs site at read time (with an offline fallback to the indexed summary). This shrinks the package and stops doc edits from duplicating content into the SDK.

- [#543](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/543) [`31324e1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31324e16fd0fb5402a3da1340f3575708c336661) - Refresh bundled Script API docs, XSD schemas, Page Designer content schemas, and standard job-step data to platform version DWAPP 26.7. The `content validate` command now matches the current platform rules for Page Designer component types — `component_id` accepts the full platform character set and is only valid on embedded components (`embedded: true`). (Thanks [@clavery](https://github.com/clavery)!)

- [#538](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/538) [`cab53af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cab53af8c1190f749adf2ab8d70c01f79d7d2dbc) - Fix `b2c slas token` registered-customer login failing against a private SLAS client with `HTTP 400 code_verifier is required`. The registered login flow is always PKCE-protected, so the token exchange now always sends the `code_verifier` with the `authorization_code_pkce` grant — and, for private clients, additionally authenticates with the client secret via HTTP Basic. Registered login now works on both public and private clients; guest and `client_credentials` flows are unchanged. (Thanks [@clavery](https://github.com/clavery)!)

## 1.17.0

### Minor Changes

- [#536](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/536) [`2f79d71`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/2f79d711475add9707ee2474f6dfab416dd88ba6) - Add optional `description` field to `regiondefinition.json` schema, matching the field added to the ECOM platform schema in W-22617900. (Thanks [@sf-emmyzhang](https://github.com/sf-emmyzhang)!)

- [#530](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/530) [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88) - Document the standard (system) job steps that B2C Commerce ships for Business Manager job flows. The bundled docs corpus now includes the full catalog of standard job step type IDs (e.g. `ImportCatalog`, `ExportCatalog`, `ExecutePreconfiguredDataReplicationProcess`, `SearchReindex`) with each step's purpose, scope, and configuration parameters — sourced from the public B2C Commerce Job Step API documentation and searchable through `b2c docs search`/`b2c docs read` (and the `docs_search`/`docs_read` MCP tools) with no new commands. Read the catalog with `b2c docs read job-steps` or a specific step with `b2c docs read <TypeID>`. The job and custom-job-step skills now cover referencing an IMPEX-staged file from a prior step, chaining custom and standard steps in one flow, and choosing an in-flow system step vs. the CLI equivalent (e.g. a standard catalog import vs. `b2c job import`). (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#530](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/530) [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88) - Update the bundled Script API documentation and XSD schemas to version 26.7. (Thanks [@clavery](https://github.com/clavery)!)

## 1.16.0

### Minor Changes

- [#522](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/522) [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019) - Expose the script debugger session cookie (`dwsid`) so you can route a triggering request to the same app server holding the debug session — required to reliably hit breakpoints on multi-app-server instances. (Thanks [@clavery](https://github.com/clavery)!)
  - **SDK:** new `SdapiClient.getCookie(name)` and `DebugSessionManager.getSessionCookie()`; the cookie is also logged at info level when the session connects.
  - **MCP:** `debug_start_session` and `debug_list_sessions` now return a `session_cookie` field.
  - **VS Code:** a new **Copy Debugger Session ID (dwsid)** command (available while a debug session is active) copies the cookie to the clipboard.

  Send your triggering request (storefront page load, SCAPI/OCAPI call) with `Cookie: dwsid=<value>`.

### Patch Changes

- [#519](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/519) [`3958d6e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3958d6eb568a1e91061f4203c986a124c480e12f) - Network errors during `b2c code deploy` and other WebDAV operations are now classified (timeout, connection reset, DNS, TLS, etc.) with actionable error messages including the operation, host, and remediation hints — no more bare "fetch failed". The server-side unzip step now has an explicit timeout, and if the connection drops it reports a clear error noting the server may still be extracting the archive (so it is not silently re-run, which could corrupt the code version) and leaves the uploaded archive in place for verification. (Thanks [@clavery](https://github.com/clavery)!)

- [#522](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/522) [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019) - Script debugger (SDAPI) client now honors session cookies (e.g. `dwsid`) returned by the server, replaying them on subsequent requests. This is required for server affinity on multi-app-server instances so debugger requests reach the app server holding the session. The client also now logs full request and response headers, status, and body at trace level, matching the rest of the HTTP clients. (Thanks [@clavery](https://github.com/clavery)!)

## 1.15.1

### Patch Changes

- [#509](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/509) [`3bc78c4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bc78c422d57b590b2435fd6ae0a31fffc4bd7e7) - Surface Managed Runtime deploy warnings (including the x86 environment deprecation notice) when pushing or deploying a bundle. The warning is informational and does not block the deploy. (Thanks [@sf-rahul-kumawat](https://github.com/sf-rahul-kumawat)!)

## 1.15.0

### Minor Changes

- [#512](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/512) [`3bce44e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bce44e2e6d4cea3cf64e34eff1246d86e459b73) - Add a `--create-pr` flag to `cap install`. When a Commerce App includes Storefront Next content and a repository is connected to the storefront, this opens a pull request with the app's storefront changes instead of applying them directly. Off by default. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#514](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/514) [`0d97ad1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d97ad1856d6a45d9349a3609c7e425d2b5e874a) - Replace the `applicationinsights` dependency with a tiny built-in telemetry client that posts directly to the Application Insights ingestion endpoint using Node's native `fetch`. This removes ~270 transitive packages (the OpenTelemetry, Azure SDK, and gRPC trees that the v3 SDK pulled in for auto-collection features we never used) and shrinks the published packages and the VS Code extension bundle. Telemetry behavior is unchanged — the same events and exceptions are reported — and the machine-identifying cloud role instance is now correctly suppressed for GDPR. A new optional `flushIntervalMs` option enables periodic delivery for long-lived hosts; the VS Code extension uses it so a session's usage events are not lost on a non-clean shutdown. No public SDK API change. (Thanks [@clavery](https://github.com/clavery)!)

## 1.14.1

### Patch Changes

- [#510](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/510) [`1575070`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/15750709ca6b23838bb9fd954d6c09e8dbb67ed3) - Resolve all critical and high severity dependency advisories reported by `pnpm audit`. (Thanks [@clavery](https://github.com/clavery)!)

  Direct dependencies of the published packages were bumped in package.json so that consumers installing the SDK, CLI, or MCP server receive the patched versions: the SDK raises `js-yaml`, `minimatch`, `protobufjs`, and `undici`, and the MCP server raises `yaml` and `postcss`. The SDK also upgrades `applicationinsights` from 2.x to 3.x to pick up a non-vulnerable `@opentelemetry/core`; this is an internal telemetry change with no public API impact.

  Remaining transitive advisories with no direct-dependency lever are pinned to patched releases (within their existing major versions) via workspace overrides: fast-xml-parser, hono, @hono/node-server, ws, vite, rollup, form-data, http-proxy-middleware, path-to-regexp, serialize-javascript, lodash, underscore, flatted, fast-uri, tmp, express-rate-limit, brace-expansion, shell-quote, and @opentelemetry/core.

## 1.14.0

### Minor Changes

- [#494](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/494) [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1) - Expand the curated CIP analytics report catalog with 16 new pre-built reports, with a focus on technical/developer analytics. New reports include SCAPI traffic & latency, SCAPI error rate by status class, SCAPI latency distribution (slow-tail/SLA percentage from the response-time histogram), SCAPI cache hit ratio, OCAPI usage by client, SFRA controller health scorecard, controller error-rate trend, and remote-include performance — plus revenue-by-channel, new-vs-returning buyer revenue, discount-depth breakdown, promotion ROI leaderboard, recommender effectiveness, zero-result searches, checkout funnel drop-off, and inventory stockout by location. (Thanks [@clavery](https://github.com/clavery)!)

  Also adds `b2c cip report list` to discover the catalog grouped by category (no credentials required), and report parameters now support enum (`--status-class 4xx|5xx`) and default values. Run `b2c cip report <name> --describe` to see each report's flags.

### Patch Changes

- [#494](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/494) [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1) - Fix `cip tables` and `cip describe` returning empty rows on some tenants. The CIP metadata mapping assumed camelCase JDBC column labels (`tableName`, `columnName`), but some tenants' drivers return the standard uppercase labels (`TABLE_NAME`, `COLUMN_NAME`), which produced blank table names, schemas, types, and column metadata. Metadata columns are now matched case-insensitively. (Thanks [@clavery](https://github.com/clavery)!)

## 1.13.0

### Minor Changes

- [`19f059e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/19f059e7ba928d1070d7960920770f1256dfae73) - Add `storefront-next-figma` as a skill set for `b2c setup skills`. You can now install the Figma design-kit skills with `b2c setup skills storefront-next-figma` (or select it interactively) for any supported IDE. These skills require the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) to be configured in your AI tool. (Thanks [@clavery](https://github.com/clavery)!)

## 1.12.0

### Minor Changes

- [#420](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/420) [`de8d40b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/de8d40b54dc923c5805fac2ef587db8b86349a6b) - Add MCP tools for log inspection and documentation lookup. Logs: `logs_list_files`, `logs_get_recent`, and a `logs_watch_start` / `logs_watch_poll` / `logs_watch_stop` / `logs_watch_list` lifecycle that buffers entries between polls so agents don't miss logs produced between tool calls. Docs: `docs_search`, `docs_read`, `docs_list`, `docs_schema_search`, `docs_schema_read`, `docs_schema_list` for the bundled Script API and XSD schema corpora. Adds a new `DIAGNOSTICS` toolset that groups the script debugger and log tools; like `SCAPI`, it is always enabled (auto-discovered for every project type). SDK now also exports the log filter helpers (`parseSinceTime`, `filterBySince`, `filterByLevel`, `filterBySearch`, `matchesLevel`, `matchesSearch`) for reuse. (Thanks [@clavery](https://github.com/clavery)!)

  The log watch buffers `logs_watch_start` defaults to `last_entries: 0` (capture only new entries, matching the "start before triggering" workflow), bounds the entry buffer by bytes as well as count, reports each discovered file only once per poll, stops the underlying tail if a concurrent-start hostname race loses registration, and makes `logs_watch_stop` truly idempotent.

- [#484](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/484) [`80e63fc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80e63fca888d9b83efd53c9c0054247fb2aa31b3) - `b2c job import` now supports `--split` for importing directories larger than the instance archive size limit. With `--split` (and optional `--max-size`, default `190mb`), the import is broken into several smaller archives: order-sensitive metadata/XML is imported first — kept together when it fits, otherwise split at data-unit boundaries in dependency order — followed by static assets packed by compressed size. A normal import that exceeds the limit now warns and recommends `--split`. (Thanks [@clavery](https://github.com/clavery)!)

  Example: `b2c job import ./big-site-data --split --max-size 150mb`

  The SDK adds a corresponding `siteArchiveImportSplit()` operation.

### Patch Changes

- [#473](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/473) [`b723939`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b72393951bb95b64f3291cd3cb76197e280a6a37) - Documentation audit and repair pass: corrected stale CLI flag and command references across the CLI reference and guides, fixed broken examples (e.g. eCDN mTLS, sandbox `--no-*` flags, WebDAV `get` arguments), aligned SDK JSDoc with current signatures, and added the missing `operations/cap` typedoc entry point so the Commerce App SDK module appears in the API reference. Filled in JSDoc for previously undocumented public exports across the SDK (auth, clients, instance, logging, ods, mrt, cap, cip, debug, scaffold, schemas, skills, etc.) so the generated API docs cover the full public surface. (Thanks [@clavery](https://github.com/clavery)!)

- [#474](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/474) [`21bbed0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/21bbed0ea1b42e8750d4259669370f8bcf562c10) - Make mTLS / self-signed client certificates robust against Node's bundled undici version. The TLS dispatcher is an undici `Agent` from the `undici` npm package, but it was handed to `global.fetch`, which is backed by whatever undici Node bundles internally — a version that drifts across Node releases and can be a different major than the npm package. Because undici's request-handler interface changed across majors (and the cross-version compatibility shim is removed in undici 8), pairing a foreign Agent with `global.fetch` can fail and silently drop the client certificate. Requests that carry a dispatcher now use undici's own `fetch` so the Agent and fetch always share one undici instance, regardless of Node version. Applies to all auth strategies (basic, client-credentials, JWT, implicit, API key), so staging deploys with `--certificate`/`--selfsigned` keep working as Node updates its bundled undici. (Thanks [@clavery](https://github.com/clavery)!)

- [#470](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/470) [`c8e0b60`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c8e0b602e1a8da88f7e6620e5d5614f3a55689bd) - Remove the CAP validation warning that flagged a root directory not matching the `{id}-v{version}` naming convention. This convention is no longer required, so the check has been dropped from `b2c cap validate` (and `b2c cap install`). (Thanks [@clavery](https://github.com/clavery)!)

## 1.11.1

### Patch Changes

- [`b8dcf74`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b8dcf741c253fee0df4219400bfa10a79c704e98) - Document Cursor as a first-class skills target, including its compatibility with Claude Code and Codex skill paths so plugins installed via `claude plugin install` are auto-picked-up by Cursor. (Thanks [@clavery](https://github.com/clavery)!)

## 1.11.0

### Minor Changes

- [#444](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/444) [`5d62ac2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5d62ac21a505c3ae4c58507fe0ffe65a5ee89087) - Add `embedded` and `component_id` properties to the component type schema with conditional validation requiring `component_id` when `embedded` is `true`. Improve validation error messages to show human-readable output instead of raw JSON Schema subschema references. (Thanks [@mjuraschik](https://github.com/mjuraschik)!)

- [#428](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/428) [`db7b330`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db7b330cf60debf05d681b9e1dbb4e025d8eec02) - `b2c job import` now accepts an optional list of paths or globs after the directory `TARGET`, allowing you to import a subset of a site export. Paths are resolved literally first (so shell-expanded globs work) and fall back to root-relative or internal glob expansion when the literal path doesn't exist. The archive preserves each path's layout under `TARGET`. (Thanks [@clavery](https://github.com/clavery)!)

  Example: `b2c job import ./my-site-data sites/RefArch libraries/mylib`

  The SDK's `siteArchiveImport` operation gains a corresponding `paths` option for directory targets.

- [#425](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/425) [`5e43132`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5e43132ab1b10da33517a697b32e22737d2f9bb4) - The SDK is now ESM-only — the dual-format `dist/cjs` build has been removed and the package exports map exposes only ESM. CommonJS consumers that previously did `require('@salesforce/b2c-tooling-sdk')` from a CJS package must either switch to `import` or rely on Node's `require(esm)` (Node ≥22.12). The VS Code extension has been converted to a `"type": "module"` package; its bundled entry is now `dist/extension.cjs`. (Thanks [@clavery](https://github.com/clavery)!)

## 1.10.0

### Minor Changes

- [#422](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/422) [`e4b8238`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b82385bfddb93a17f874f34315e4ab73e7c84a) - The `libraries` config field now accepts `{id, siteLibrary?}` objects in addition to bare strings (mixed forms allowed in the same array). This lets you mark site-private libraries in `dw.json` or `package.json` so `b2c content list` / `content export` can default `--site-library` based on which library you target, and the VS Code Content Libraries tree auto-loads every configured library on activation. To upgrade, optionally replace `"libraries": ["RefArchSharedLibrary"]` with `"libraries": ["RefArchSharedLibrary", {"id": "SiteGenesis", "siteLibrary": true}]`. The existing string-only form continues to work unchanged. Also adds `libraries`, `assetQuery`, and `realm` to the documented `package.json` allowed fields list (already supported in code). (Thanks [@clavery](https://github.com/clavery)!)

## 1.9.0

### Minor Changes

- [#395](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/395) [`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe) - Add `resolveBreakpointPath` utility that normalizes user-provided file paths to SDAPI script paths. Accepts server paths, absolute/relative local paths, and cartridge-name-prefixed paths with helpful error messages on failure. (Thanks [@clavery](https://github.com/clavery)!)

- [#399](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/399) [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c) - Support `assetQuery` as a first-class config field. Set it in `dw.json` (per-instance), in `package.json` under `b2c`, or via `SFCC_ASSET_QUERY` to control which JSON dot-paths are extracted as assets during content library parsing. The VS Code Content Libraries tree and `b2c content export` both honor it automatically; the `--asset-query` flag still wins when provided, and the fallback remains `["image.path"]`. (Thanks [@clavery](https://github.com/clavery)!)

- [#408](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/408) [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29) - Added `b2c bm users` command topic for managing instance-level Business Manager users via the OCAPI Data API: `list`, `get`, `search`, `whoami`, `update`, and `delete`. Also added `b2c bm users access-keys` (`get`, `create`, `set`, `delete`) for provisioning and rotating WebDAV/OCAPI/SCAPI access keys for externally-managed (AM/SSO) users. The SDK now exposes a matching `@salesforce/b2c-tooling-sdk/operations/bm-users` module. (Thanks [@clavery](https://github.com/clavery)!)

- [#408](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/408) [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29) - Added `--columns` and `--extended` flags to all list and search commands for consistent column selection across the CLI. Roughly 30 commands that previously had no column-customization support — including `bm roles list`, `webdav ls`, `cap list`, `code list`, `content list`, `docs search`, `job search`, `logs list`, `sites list`, `slas client list`, all `mrt` list commands, plus several `setup` and `scaffold` commands — now accept `-c id,name,...` to pick columns and `-x` to include extended fields (e.g. `webdav ls --extended` exposes the previously-hidden `modified` and `contentType` columns). (Thanks [@clavery](https://github.com/clavery)!)

  The SDK now exposes shared `columnFlagsFor()` / `selectColumns()` helpers (replacing 22 duplicated implementations) and a `printFieldsBlock()` helper for rendering "label / value" detail blocks.

- [#405](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/405) [`b1600fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b1600fa014f9bd23c93488155b37ac2cc5c91fd2) - Refresh the MRT admin API schema and add new commands: (Thanks [@clavery](https://github.com/clavery)!)
  - `b2c mrt env clone` — clone an environment from an existing source, optionally copying redirects, environment variables, and B2C target info
  - `b2c mrt bundle delete` — delete one or more bundles (uses bulk-delete when more than one ID is supplied)
  - `b2c mrt org member list|add|get|update|remove` — manage organization-level members
  - `b2c mrt org cert list|get|create|delete|restart-validation` — manage custom domain certificates referenced by environments

### Patch Changes

- [#407](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/407) [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d) - Hardened auth and long-running operation paths: (Thanks [@clavery](https://github.com/clavery)!)
  - Token store now writes atomically (temp file + rename) so concurrent CLI invocations cannot corrupt `auth-session.json`.
  - `OAuthStrategy.getAccessToken()` coalesces concurrent refreshes onto a single in-flight request, preventing token-endpoint stampedes.
  - Debug session cleans up its keepalive/poll timers if `connect()` fails after starting them.
  - `downloadCartridges` and `deployCartridges` use try/finally around progress timers so an aborted or failing request can no longer leak intervals.
  - New `@salesforce/b2c-tooling-sdk/ux` export surfaces the canonical `confirm()` prompt; CLI re-exports from here.
  - New `auth/jwt-utils` consolidates JWT `exp`/`scope` decoding previously duplicated across three auth strategies.
  - Better error message when the implicit-OAuth port is already in use (suggests `SFCC_OAUTH_LOCAL_PORT`).

- [#392](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/392) [`51aed02`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/51aed020426f1ce3869b3d260d9af796db8a19e7) - Fix `active: true` on `configs[]` instances being ignored unless the root object also has `active: false` (Thanks [@clavery](https://github.com/clavery)!)

- [`b53d75e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b53d75e196a6808b4fc9cac249c4495da2471846) - Fix `bm users search` returning only `login` and `link` fields. The underlying SDK `searchBmUsers()` now sends `select=(**)` (matching `listBmUsers()`), so `--sort-by`, `--columns`, and the default table now work as expected. A new `select` option is also exposed for callers that want a narrower projection. (Thanks [@clavery](https://github.com/clavery)!)

## 1.8.0

### Minor Changes

- [#382](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/382) [`4f30de7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4f30de783a049e33a121ec80a2cbd1c455f5d4e8) - Add `uploadFiles` and `downloadSingleCartridge` functions for efficient per-file and per-cartridge operations. Extract batch upload pipeline from `watchCartridges` into reusable `uploadFiles` function. `downloadCartridges` now downloads individual cartridges when `include` filter is specified instead of zipping the entire code version. Add `autoUpload` config field for IDE auto-sync. (Thanks [@clavery](https://github.com/clavery)!)

## 1.7.0

### Minor Changes

- [#377](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/377) [`cb66b56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb66b563d5d5ca6a0f584d9007629ba392cb3424) - Add `storefront-next` skill set to `b2c setup skills`. Install Storefront Next development skills with `b2c setup skills storefront-next`, or via the plugin marketplace with `claude plugin install storefront-next`. (Thanks [@clavery](https://github.com/clavery)!)

## 1.6.1

### Patch Changes

- [`485ef63`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/485ef63b901d91f7b08c56366d1f1756a03f60dc) - Fix skills version resolution to correctly parse release tags and invalidate cached version on download errors (Thanks [@clavery](https://github.com/clavery)!)

## 1.6.0

### Minor Changes

- [#373](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/373) [`1dc1ee5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1dc1ee55642f0d478d260867d538f02e32057d7e) - Add support for Commerce Apps (CAP) development skills via `b2c setup skills cap-dev`. Introduces a skill source registry to support external skill repositories alongside existing release-artifact sources. (Thanks [@clavery](https://github.com/clavery)!)

## 1.5.0

### Minor Changes

- [#370](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/370) [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a) - Add `cap` command topic for Commerce App Package (CAP) management. (Thanks [@clavery](https://github.com/clavery)!)

  New commands:
  - `b2c cap validate` — validates CAP structure, manifest, and cartridge rules locally
  - `b2c cap package` — packages a CAP directory into a distributable `.zip`
  - `b2c cap install` — installs a CAP on an instance via WebDAV + `sfcc-install-commerce-app` job
  - `b2c cap uninstall` — uninstalls a CAP via `sfcc-uninstall-commerce-app` job

  New SDK exports in `@salesforce/b2c-tooling-sdk/operations/cap`: `validateCap`, `commerceAppInstall`, `commerceAppUninstall`, `commerceAppPackage`.

  The VS Code extension gains CAP directory detection (badge decoration) and an "Install Commerce App (CAP)" context menu action.

- [#370](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/370) [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a) - Add `cap list`, `cap tasks`, and `cap pull` commands for managing installed Commerce Apps (Thanks [@clavery](https://github.com/clavery)!)
  - `cap list` exports and parses `commerce_feature_states` to show installed features with type, source, status, and version
  - `cap tasks` displays configuration tasks for an installed app with clickable Business Manager links
  - `cap pull` downloads and extracts installed app source packages for cartridge deployment or Storefront Next development
  - Standardize all cap commands to use `--site-id` flag (with `--site` as alias)
  - `cap uninstall` no longer requires `--domain` — looks it up automatically from the feature state
  - `cap install` now keeps the archive on the instance by default (use `--clean-archive` to remove)

## 1.4.0

### Minor Changes

- [#366](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/366) [`59dd584`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59dd584479cc024fa6eed365c7c91f64dc4110be) - Add `b2c code download` command to download cartridge code from a B2C Commerce instance, with support for cartridge filtering, mirror mode, and progress reporting (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#355](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/355) [`3dedc05`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3dedc05ade10f6d748b4168daef0e4c2fdaf1501) - `b2c setup skills` now prompts to overwrite already-installed skills in interactive mode instead of silently skipping them with a "use --update to overwrite" message. The existing `--update` and `--force` flags still work non-interactively. (Thanks [@clavery](https://github.com/clavery)!)

- [#365](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/365) [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859) - Skills installer (`b2c setup skills`) now resolves the latest skills release by querying GitHub for releases that actually carry skills zips, instead of relying on GitHub's opinionated "latest release" endpoint. Falls back to a CDN-backed lookup when the GitHub API is rate-limited. Zip downloads continue to use the GitHub release CDN with no API calls. Resolved versions are cached locally for 1 hour to keep consecutive installs fast. (Thanks [@clavery](https://github.com/clavery)!)

## 1.3.2

### Patch Changes

- [`1b0b4ce`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b0b4ce2af63862438c0dae74df2efb35262139a) - Add `--wait` / `--no-wait` flag to `b2c job import` command. Import waits for completion by default (preserving existing behavior); use `--no-wait` to return immediately after the job starts. Also adds `--poll-interval` flag for controlling poll frequency. (Thanks [@clavery](https://github.com/clavery)!)

## 1.3.1

### Patch Changes

- [`30de66b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/30de66bf59c250c5382a7427ba475049c68566cd) - Fix broken Agentforce skills documentation URL (Thanks [@clavery](https://github.com/clavery)!)

## 1.3.0

### Minor Changes

- [#337](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/337) [`c04bbcb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c04bbcbb179d733bedc42f4d0eee2dff2256789e) - Add Agentforce Vibes (`--ide agentforce-vibes`) as a supported IDE target for `setup skills`, installing to `.a4drules/skills/`. Add `--directory` flag for custom installation paths. Change `manual` default directory to `.agents/skills/`. (Thanks [@clavery](https://github.com/clavery)!)

## 1.2.0

### Minor Changes

- [`464b9db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/464b9dbc3cf498e585d81ba5eb7ed0f17ff60a46) - Add B2C Commerce script debugger with SDAPI 2.0 DAP adapter (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#331](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/331) [`e6c6226`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e6c6226c256b8d181917cc8c66fa4d7bf992e106) - Fix `code watch` WebDAV lock conflicts by serializing upload and delete operations so only one batch runs at a time. Failed uploads are now retried automatically. (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.0

### Minor Changes

- [#318](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/318) [`6880a84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6880a846aacd029a1eb510023aa76f4b844ec26e) - Added per-instance safety configuration with rule-based actions (allow/block/confirm) and interactive confirmation mode. Safety can now be configured in `dw.json` with granular rules for HTTP paths, job IDs, and CLI commands. (Thanks [@clavery](https://github.com/clavery)!)

## 1.0.1

### Patch Changes

- [`e597e61`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e597e6131b9965e88ef75954a935695fa7f6d70f) - Add `--activate` flag to `code deploy` for activating a code version after deploy without the toggle behavior of `--reload`. Both `--activate` and `--reload` now error on failure instead of silently continuing. (Thanks [@clavery](https://github.com/clavery)!)

## 1.0.0

### Major Changes

- [#303](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/303) [`c24e920`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c24e9204a5f253b773c43c0b30c064c7f4dec34a) - Release v1.0 — B2C Tooling SDK is now Generally Available. Added `./operations/ods`, `./safety`, and `./i18n` subpath exports. Consolidated all error types in `@salesforce/b2c-tooling-sdk/errors`. (Thanks [@clavery](https://github.com/clavery)!)

### Minor Changes

- [#305](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/305) [`7ad490a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ad490a508b7f993292bd8a326f7a6c49c92d70c) - Add `--wait` flag to `mrt bundle deploy` to poll until deployment completes, and align all SDK wait functions (`waitForJob`, `waitForEnv`) to a consistent pattern with structured `onPoll` callbacks, seconds-based options, and injectable `sleep` for testing. (Thanks [@clavery](https://github.com/clavery)!)

## 0.13.0

### Minor Changes

- [#293](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/293) [`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e) - Add Business Manager role management commands (`bm roles`) for instance-level access role CRUD, user assignment, and permissions via OCAPI Data API (Thanks [@clavery](https://github.com/clavery)!)

- [#285](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/285) [`cb74ce4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb74ce4c78a91cc49556f464be5124981a24c3ea) - Add `openBrowser` and `redirectUri` options to OAuth strategy creation, allowing callers to customize how the browser is opened and which redirect URI is used during implicit auth. The VS Code extension now uses `vscode.env.openExternal` and `vscode.env.asExternalUri` so implicit OAuth works in Codespaces and other remote environments. (Thanks [@clavery](https://github.com/clavery)!)

- [#295](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/295) [`b7f78ca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b7f78ca6d2468e274b911c4fd1fc7c03a9e6b4fb) - Add site cartridge path management commands (`sites cartridges list|add|remove|set`) with `--bm` flag for Business Manager support and automatic fallback to site archive import when OCAPI permissions are unavailable (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#292](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/292) [`c10ddad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c10ddadf7277c93196c956b73af694f4f065a149) - Use a host-specific default public client ID for account-pod5.demandware.net Account Manager (Thanks [@clavery](https://github.com/clavery)!)

## 0.12.0

### Minor Changes

- [`f7229b4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f7229b4372bb23d8e107db75f722575c33f4a007) - Add `SFCC_REDIRECT_URI` environment variable to support implicit OAuth flow behind a proxy. Set this to your proxy URL when `localhost:8080` isn't directly reachable by the browser. (Thanks [@clavery](https://github.com/clavery)!)

## 0.11.0

### Minor Changes

- [#278](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/278) [`8c31081`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c31081b47e57e6a21e62425e6f19da036fc3e34) - Add `content validate` command to validate Page Designer metadefinition JSON files against bundled schemas. Supports auto-detection of schema types from file paths and content, or explicit `--type` flag. Includes glob pattern support for validating multiple files. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#274](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/274) [`e4b5094`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b5094d9c1c2a60e1214bc236ce7ed84c5d158b) - Replace `archiver` with `tar-fs` for MRT bundle creation, removing deprecated `glob@10.5.0` from the production dependency tree (Thanks [@clavery](https://github.com/clavery)!)

## 0.10.0

### Minor Changes

- [#167](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/167) [`caa568e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/caa568e9de3e8c9d3f2e7b17e5f96c1a0ae3ca73) - Introduces stateful authentication: `auth login` (browser/implicit), `auth logout`, `auth client` (client_credentials/password), `auth client renew`, and `auth client token`. Sessions are stored as a JSON file in the CLI data directory; when a valid session exists, all OAuth commands use it automatically without requiring credentials on every invocation. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

  **Note:** Sessions are not shared with `sfcc-ci`. Re-authenticate with `b2c auth login` or `b2c auth client` after upgrading. Existing stateless auth (env vars, `dw.json`) is unaffected.

### Patch Changes

- [`b30e427`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b30e427f25807840dbcceef6c0005e2d9fd1be53) - Add `--path` flag to `b2c docs schema` to print the filesystem path to a schema file instead of its content, enabling use with tools like `xmllint` for XML validation. (Thanks [@clavery](https://github.com/clavery)!)

- [#272](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/272) [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc) - Added sfcc-ci migration guide with command mappings and CI/CD migration instructions. Added backward-compatible sfcc-ci command aliases (`client:auth`, `code:deploy`, `code:list`, `code:activate`, `job:run`, etc.) and environment variable aliases (`SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET`, `SFCC_LOGIN_URL`). (Thanks [@clavery](https://github.com/clavery)!)

## 0.9.0

### Minor Changes

- [#263](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/263) [`16bd9d6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/16bd9d6a1c658d6ba3de04fa3acf89295e1e5e06) - `resolveConfig()` and the `ConfigSource` interface are now async. This enables config sources that perform async I/O such as keychain lookups, credential vaults, or network-based config stores. (Thanks [@clavery](https://github.com/clavery)!)

  **Breaking:** `resolveConfig()` now returns `Promise<ResolvedB2CConfig>` — callers must `await` the result. The `ConfigSource.load()` method return type is now `MaybePromise<ConfigLoadResult | undefined>`, so existing sync source implementations continue to work without changes.

### Patch Changes

- [`4cf7249`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4cf72497f5e01d627de7aae80290d072f4c914f6) - Add `cartridges` config option to specify which cartridges to deploy/watch. Supports comma or colon-separated strings, or arrays in dw.json. Also accepts `cartridgesPath` as an alias. The `-c` flag still takes precedence when provided. (Thanks [@clavery](https://github.com/clavery)!)

- [#264](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/264) [`9996eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9996eba2a8fe53a27bf52fb208eb722d618cd282) - Fix multiple issues with the hook scaffold (#247): (Thanks [@clavery](https://github.com/clavery)!)

- [#262](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/262) [`d50bf6b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d50bf6b91dcd40314f10c8c97a28805039161213) - Replace @salesforce/telemetry with direct applicationinsights dependency to eliminate the punycode deprecation warning on Node 21+ (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.3

### Patch Changes

- [`760a6cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/760a6cbe144ffcd7c72b32b05df861626d3d5a2c) - Strip `development` export conditions from package.json during publish. Fixes `MODULE_NOT_FOUND` errors when plugins or consumers install the SDK from npm, where the `src/` directory is not included. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.2

### Patch Changes

- [`d4423bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d4423bb218af3991396286b4900c3b051666e06b) - Add MRT environment variable support to EnvSource (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN` and their `SFCC_MRT_*` variants). The `setup inspect` command now shows values from SFCC\_\* environment variables as a config source. (Thanks [@clavery](https://github.com/clavery)!)

- [`69a98dc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/69a98dc21f3a326f551929fcd530741b9f0ca126) - Fix `--server` override dropping config from non-instance-bound sources. Previously, overriding the server hostname discarded all config values including credentials from global sources like config plugins. Now only values from the source that provided the conflicting hostname are dropped. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.1

### Patch Changes

- [#249](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/249) [`e790dfa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e790dfa8d5375fde7936ae4a10b2f3fd722ec087) - Add `--wait` flag to `sandbox clone create` command to poll until the clone completes, matching the behavior of `sandbox create --wait`. Also fixes the status check hint to display the correct command name instead of a raw template string. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.0

### Minor Changes

- [#244](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/244) [`b26ebeb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b26ebebd2b5dbff19689bdfadd5b9864597fbfb1) - Add API Browser with Swagger UI for interactive SCAPI exploration. Proxy requests through extension host to avoid CORS, pre-fill parameters and auth tokens, and expand custom properties in schemas. (Thanks [@clavery](https://github.com/clavery)!)

## 0.7.0

### Minor Changes

- [#241](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/241) [`3758114`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3758114c328fcfffc54fb32a935df23503fc0ba2) - Add `EnvSource` config source that maps `SFCC_*` environment variables to config fields (Thanks [@clavery](https://github.com/clavery)!)

- [#232](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/232) [`732d4ad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/732d4ad1e52dd1e0f0676cee87305464ccf4ca9e) - Add `slas token` command to retrieve SLAS shopper access tokens for API testing. Supports public (PKCE) and private (client_credentials) client flows, guest and registered customer authentication, and auto-discovery of public SLAS clients. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [`1b9b477`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b9b4773110a5d97bfe81d37a093158088d94cee) - Fix `b2c setup skills` serving stale cached skills when downloading latest release (Thanks [@clavery](https://github.com/clavery)!)

## 0.6.0

### Minor Changes

- [#230](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/230) [`8faf831`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8faf831b4e4827e252e48242b2a2b2155157f3c2) - Add `detectSourceFromPath()` for context-aware scaffold parameter detection, `cartridgePathForDestination()` export, and `builtInScaffoldsDir` option on `createScaffoldRegistry()` for bundled consumers (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.5

### Patch Changes

- [`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc) - MRT environment variables now use non-prefixed names (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN`) as primary. The `SFCC_`-prefixed versions continue to work as fallbacks. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.4

### Patch Changes

- [`f9ebb56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9ebb562d0c894aed9f0498b78ca01fce70db352) - Fix duplicate config source registration in `ConfigSourceRegistry` when multiple discovery paths find the same plugins (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.3

### Patch Changes

- [#206](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/206) [`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4) - Add `globalConfigSourceRegistry` for automatic plugin config source inclusion in `resolveConfig()`, matching the existing middleware registry pattern. Plugin config sources are now picked up automatically by all SDK consumers without manual plumbing. Also improves test isolation by preventing locally installed plugins from affecting test runs. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.2

### Patch Changes

- [`a9db7da`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a9db7daf60a9071244c8e2e098dbd4f8fc58495d) - Add legacy env var fallbacks for MRT flags: `MRT_PROJECT` for --project and `MRT_TARGET` for --environment (Thanks [@clavery](https://github.com/clavery)!)

- [#186](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/186) [`dc7a25a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/dc7a25aedef047190250b696421e4a25c00cba15) - Add `@salesforce/b2c-tooling-sdk/plugins` module for discovering and loading b2c-cli plugins outside of oclif. Enables the VS Code extension and other non-CLI consumers to use installed plugins (keychain managers, config sources, middleware) without depending on `@oclif/core`. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.1

### Patch Changes

- [#199](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/199) [`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542) - Rename `--working-directory` flag to `--project-directory`. The old flag name `--working-directory` is still accepted as an alias. Primary env var is now `SFCC_PROJECT_DIRECTORY`; `SFCC_WORKING_DIRECTORY` continues to work as a deprecated fallback. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.0

### Minor Changes

- [#155](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/155) [`55c81c3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/55c81c3b3cdd8b85edfe5eb0070e28a96752ac83) - Add a new `cip` command topic for Commerce Intelligence platform (CCAC - Commerce Cloud Analytics) with `cip query` for raw SQL and curated `cip report <report-name>` subcommands for analytics workflows, including CIP host override support and tenant-based CIP instance targeting. (Thanks [@clavery](https://github.com/clavery)!)

- [#163](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/163) [`87321c0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/87321c0051c171d35ca53760d4cffa3f9ebe406c) - `--json` no longer switches log output to JSONL. Logs are always human-readable on stderr; `--json` only controls the structured result on stdout. Use the new `--jsonl` flag (or `SFCC_JSON_LOGS` env var) to get machine-readable log lines. (Thanks [@clavery](https://github.com/clavery)!)

- [#133](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/133) [`1485923`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1485923581c6f1cb01c48a2e560e369843952020) - # Add new MCP tools (Thanks [@yhsieh1](https://github.com/yhsieh1)!)
  - `scapi-schemas-list`: List and fetch SCAPI schemas (standard and custom)
  - `scapi-custom-apis-status`: Check custom API endpoint registration status
  - `mrt_bundle_push`: Push and deploy a pre-built Storefront Next PWA Kit project to Managed Runtime
  - `cartridge_deploy`: Find and deploy cartridges to a B2C Commerce instance via WebDAV
  - `storefront_next_development_guidelines`: Get critical architecture rules, coding standards, and best practices for Storefront Next development

### Patch Changes

- [#181](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/181) [`556f916`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/556f916f74c43373c0da125af1b53721b2c193ec) - Fix `--no-download` flag on `job export` to actually skip downloading the archive from the instance (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.1

### Patch Changes

- [#143](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/143) [`ca9dcf0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca9dcf0e9242dce408cf0c8e9cf1920d5ad40157) - Fix AM role ID mapping between API internal/external formats and improve user display output. Role grant/revoke now correctly handle mixed formats (role IDs in roles array, enum names in roleTenantFilter). User display shows role descriptions, resolves org names, and detects auth errors with actionable --user-auth suggestions. Commands accepting org IDs now also accept friendly org names. (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.0

### Minor Changes

- [#117](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/117) [`59fe546`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59fe54612e35530ccb000e0b16afba5c62eed429) - Add `content export` and `content list` commands for exporting Page Designer pages with components and static assets from content libraries. Supports filtering by page ID (exact or regex), folder classification, offline mode, and dry-run preview. (Thanks [@clavery](https://github.com/clavery)!)

- [`44b67f0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/44b67f00ded0ab3a458f91f55b00b7106fb371be) - Embed a default public client ID for implicit OAuth flows. Account Manager, Sandbox, and SLAS commands now work without requiring a pre-configured client ID — the CLI will automatically use a built-in public client for browser-based authentication. (Thanks [@clavery](https://github.com/clavery)!)

- [#98](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/98) [`91593f2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91593f28cb25b9a466c6ef0db1504b39f3590c7a) - Add `setup instance` commands for managing B2C Commerce instance configurations (create, list, remove, set-active). (Thanks [@clavery](https://github.com/clavery)!)

- [#125](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/125) [`0d29262`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d292625f4238fef9fb1ca530ab370fdc6e190d8) - Add `mrt tail-logs` command to stream real-time application logs from Managed Runtime environments. Supports level filtering, regex search with match highlighting, and JSON output. (Thanks [@clavery](https://github.com/clavery)!)

- [#112](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/112) [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81) - Accept both camelCase and kebab-case for all field names in dw.json and package.json `b2c` config. For example, `clientId` and `client-id` are now equivalent everywhere. Legacy aliases like `server`, `passphrase`, and `selfsigned` continue to work. (Thanks [@clavery](https://github.com/clavery)!)

- [#102](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/102) [`8592727`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/859272776afa5a9d6b94f96b13de97a7af9814eb) - Add scaffolding framework for generating B2C Commerce components from templates. Includes 7 built-in scaffolds (cartridge, controller, hook, service, custom-api, job-step, page-designer-component) and support for custom project/user scaffolds. SDK provides programmatic API for IDE integrations and MCP servers. (Thanks [@clavery](https://github.com/clavery)!)

- [#120](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/120) [`908be47`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/908be47541f5d3d88b209f69ede488c9464606cb) - Add `--user-auth` flag for simplified browser-based authentication. AM commands now use standard auth method order; enhanced error messages provide role-specific guidance for Account Manager operations. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#63](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/63) [`1a3117c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1a3117c42211e4db6629928d1f8a58395a0cadc7) - Account Manager (AM) topic with `users`, `roles`, and `orgs` subtopics. Use `b2c am users`, `b2c am roles`, and `b2c am orgs` for user, role, and organization management. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

- [#103](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/103) [`7a3015f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7a3015f05183ad09c55e20dfe64ce7f3b8f1ca50) - Add automatic 401 retry with token refresh to openapi-fetch middleware. This ensures API clients (OCAPI, SLAS, SCAPI, etc.) automatically refresh expired tokens during long-running operations. (Thanks [@clavery](https://github.com/clavery)!)

- [#112](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/112) [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81) - Support `sandbox-api-host` in dw.json and other config sources (previously only worked as a CLI flag or environment variable) (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.0

### Minor Changes

- [#83](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/83) [`ddee52e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ddee52e2c61991dbcc4d3aeed00ee802530a0e7c) Thanks [@clavery](https://github.com/clavery)! - Add support for realm-instance format in ODS commands. You can now use `zzzv-123` or `zzzv_123` instead of full UUIDs for `ods get`, `ods start`, `ods stop`, `ods restart`, and `ods delete` commands.

- [#77](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/77) [`6859880`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6859880195d2da4cd6363451c79224878917abb7) Thanks [@clavery](https://github.com/clavery)! - Add log tailing, listing, and retrieval commands for viewing B2C Commerce instance logs. See `b2c logs` topic.

- [#85](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/85) [`6b89ed6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6b89ed622a1f59e91cfd6dad643a5e834d8d7470) Thanks [@clavery](https://github.com/clavery)! - Surface config source errors as warnings. When a config source (like dw.json) has malformed content, the error is now displayed as a warning instead of being silently ignored.

- [#94](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/94) [`c34103b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c34103b594dee29198de3ae6fe0077ff12cd3f93) Thanks [@clavery](https://github.com/clavery)! - Add two-factor client certificate (mTLS) support for WebDAV operations

## 0.2.1

### Patch Changes

- [`4e90f16`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4e90f161f8456ff89c4e99522ae83ae6a7352a44) Thanks [@clavery](https://github.com/clavery)! - dw.json format bug fix

## 0.2.0

### Minor Changes

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Adds complete MRT CLI coverage organized by scope: `mrt project` (CRUD, members, notifications), `mrt env` (CRUD, variables, redirects, access-control, cache invalidation, B2C connections), `mrt bundle` (deploy, list, history, download), `mrt org` (list, B2C instances), and `mrt user` (profile, API key, email preferences).

- [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26) Thanks [@clavery](https://github.com/clavery)! - Add `b2c setup skills` command for installing agent skills to AI-powered IDEs (Claude Code, Cursor, Windsurf, VS Code/Copilot, Codex, OpenCode)

- [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2) Thanks [@clavery](https://github.com/clavery)! - Add `b2c ecdn` commands for managing eCDN zones, certificates, WAF, caching, security settings, and related configurations.

- [#66](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/66) [`a14c741`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a14c7419b99f3185002f8c7f63565ed8bc2eea90) Thanks [@clavery](https://github.com/clavery)! - Add User-Agent header to all HTTP requests. Sets both `User-Agent` and `sfdc_user_agent` headers with the SDK or CLI version (e.g., `b2c-cli/0.1.0` or `b2c-tooling-sdk/0.1.0`).

### Patch Changes

- [#64](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/64) [`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34) Thanks [@clavery](https://github.com/clavery)! - Fix HTML response bodies appearing in ERROR log lines. When API requests fail with non-JSON responses (like HTML error pages), error messages now show the HTTP status code (e.g., "HTTP 521 Web Server Is Down") instead of serializing the entire response body.

  Added `getApiErrorMessage(error, response)` utility that extracts clean error messages from ODS, OCAPI, and SCAPI error patterns with HTTP status fallback.

## 0.1.0

### Minor Changes

- [`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a) Thanks [@clavery](https://github.com/clavery)! - Initial developer preview release
