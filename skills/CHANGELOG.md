# @salesforce/b2c-agent-plugins

## 1.4.5

### Patch Changes

- [#545](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/545) [`ed1e214`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ed1e21405f69503e693c7bcadb8b9cc1f4a09ddf) - Stop MCP debug tools from routinely suggesting the session cookie (`dwsid`). The cookie is only needed in the rare multi-app-server production instance group case where a breakpoint is never hit — it is now surfaced as a troubleshooting hint on breakpoint timeout instead of in the `debug_start_session`/`debug_list_sessions` descriptions. Also clarifies that the debugger needs standard Basic auth (account password or a `WebDAV File Access and UX Studio` access key) with no separate Business Manager enablement step. (Thanks [@clavery](https://github.com/clavery)!)

- [#546](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/546) [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1) - Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` (CLI), the `docs_*` MCP tools, and the SDK docs module. Documentation search now spans Script API reference, standard job steps, Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), and this tooling's own guides, with content-aware ranking and workspace-aware results tuned to the detected project type. (Thanks [@clavery](https://github.com/clavery)!)

- [#553](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/553) [`31ec679`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31ec679ca6058d2ba7f453528af873163a5baeff) - Reworked the MCP Server documentation to be leaner and human-focused: trimmed internal implementation prose from the tool reference pages, reorganized the nav around toolsets and logical tool groups (combined the two log pages and the two SCAPI custom-API pages, with client-side redirects from the old URLs), corrected the project-type auto-detection table, and removed agent-directed prompting guidance. Renamed the homepage/header "Agent Skills" entry to "Agent Plugins" and grouped the MCP plugin with the core plugins in the install instructions. The `b2c-docs` skill now notes that the MCP `docs_*` tools offer the same coverage as the CLI. (Thanks [@clavery](https://github.com/clavery)!)

  The `tooling` documentation corpus (the CLI/MCP/SDK guides available via `docs search`/`read`) no longer bundles a copy of each page's markdown in the SDK — like the Developer Center guides, its content is now fetched online from the docs site at read time (with an offline fallback to the indexed summary). This shrinks the package and stops doc edits from duplicating content into the SDK.

## 1.4.4

### Patch Changes

- [#524](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/524) [`2ecbad7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/2ecbad7e44d71d15272e497dda16fac487779bfb) - Clarify SCAPI Admin OAuth scopes in the custom API and Account Manager skills. The custom-api-development, scapi-admin, scapi-custom, and config skills now consistently document that Admin API tokens (system and custom) require both the tenant scope `SALESFORCE_COMMERCE_API:<tenant_id>` and the API-specific scopes, that `b2c auth token` accepts multiple `--auth-scope` values, and that — unlike the SCAPI subcommands — `b2c auth token` does not auto-inject the tenant scope. Also fixes a broken admin token curl example and an invalid `--scope` flag reference in the testing docs. (Thanks [@clavery](https://github.com/clavery)!)

- [#528](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/528) [`4efd453`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4efd4533afac785934a52b24db623f53dae58cfd) - Document headless order-failure essentials in the `b2c` agent skills. The `b2c-hooks` skill now explains the `dw.ocapi.shop.order.afterPOST` hook in depth — it runs inside a platform transaction (so wrapping `OrderMgr.placeOrder`/`failOrder` in your own `Transaction.wrap` rolls the change back and surfaces an opaque `HTTP 400: An error occurred in ExtensionPoint…`), it owns the `CREATED → NEW`/`FAILED` transition for SCAPI orders, and it must log its own decline reason — plus a canonical example that authorizes payment instruments via `app.payment.processor.*` Authorize hooks, fails the order on decline, and places it when fully paid. `b2c-custom-job-steps` gains a `jobs.xml` reference covering how to author and import (`b2c job import`) a job definition (job/flow/step structure, the `type` vs `@type-id` distinction, and the required `<triggers>` element). (Thanks [@clavery](https://github.com/clavery)!)

- [#530](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/530) [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88) - Document the standard (system) job steps that B2C Commerce ships for Business Manager job flows. The bundled docs corpus now includes the full catalog of standard job step type IDs (e.g. `ImportCatalog`, `ExportCatalog`, `ExecutePreconfiguredDataReplicationProcess`, `SearchReindex`) with each step's purpose, scope, and configuration parameters — sourced from the public B2C Commerce Job Step API documentation and searchable through `b2c docs search`/`b2c docs read` (and the `docs_search`/`docs_read` MCP tools) with no new commands. Read the catalog with `b2c docs read job-steps` or a specific step with `b2c docs read <TypeID>`. The job and custom-job-step skills now cover referencing an IMPEX-staged file from a prior step, chaining custom and standard steps in one flow, and choosing an in-flow system step vs. the CLI equivalent (e.g. a standard catalog import vs. `b2c job import`). (Thanks [@clavery](https://github.com/clavery)!)

## 1.4.3

### Patch Changes

- [#522](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/522) [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019) - Expose the script debugger session cookie (`dwsid`) so you can route a triggering request to the same app server holding the debug session — required to reliably hit breakpoints on multi-app-server instances. (Thanks [@clavery](https://github.com/clavery)!)
  - **SDK:** new `SdapiClient.getCookie(name)` and `DebugSessionManager.getSessionCookie()`; the cookie is also logged at info level when the session connects.
  - **MCP:** `debug_start_session` and `debug_list_sessions` now return a `session_cookie` field.
  - **VS Code:** a new **Copy Debugger Session ID (dwsid)** command (available while a debug session is active) copies the cookie to the clipboard.

  Send your triggering request (storefront page load, SCAPI/OCAPI call) with `Cookie: dwsid=<value>`.

## 1.4.2

### Patch Changes

- [#518](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/518) [`7a55915`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7a5591524e8374413cc92303b907e164f1b172f3) - Refocus the Commerce Apps (CAP) documentation on the B2C CLI workflow and recommend the `b2c-cli`, `b2c`, and `cap-dev` agent skills plugins (the latter from the `SalesforceCommerceCloud/commerce-apps` marketplace). The guide now links to the official Commerce Apps ISV Developer Guide as the authoritative spec rather than duplicating it, and corrects several details against canon and the CLI source: the tax extension point is `sfcc.app.tax.calculate`, the install upload path is `Impex/commerce-apps/`, the lifecycle states are `INSTALLING → INSTALLED → NOT_CONFIGURED → CONFIGURING → CONFIGURED`, and `cap package` produces `{id}-v{version}.zip`. The `b2c-cap` skill and CAP CLI reference gain WebDAV auth, icon-naming, and registry-vs-local-validation clarifications. (Thanks [@clavery](https://github.com/clavery)!)

## 1.4.1

### Patch Changes

- [#494](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/494) [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1) - Update the b2c-cip agent skill to cover the new technical/developer CIP reports (SCAPI/OCAPI/controller latency, error-rate, and cache analytics) and the `b2c cip report list` discovery command. (Thanks [@clavery](https://github.com/clavery)!)

## 1.4.0

### Minor Changes

- [#489](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/489) [`0b19efe`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0b19efec7d361ae0a5c226fc71d66368c3a3e1aa) - Add Storefront Next design-system skills and a new `storefront-next-figma` plugin. (Thanks [@pav-ui](https://github.com/pav-ui)!)
  - New `sfnext-create-vertical` skill (storefront-next): create a brand theme / storefront variant through the brand token layer, with typography, dark-mode contrast checks, fixture-based local development, and the extension-vs-base decision.
  - New `sfnext-create-component` skill (storefront-next): design-system component authoring — layer model, extend-before-create gate, CVA variants bound to semantic tokens, `data-slot`, accessibility, and Storybook coverage (complements `sfnext-components`).
  - Enhanced `sfnext-extensions` skill with a base-audit decision gate (deciding whether to extend at all vs a token/variant override or a base slot) plus a `BASE-AUDIT.md` reference.
  - New `storefront-next-figma` plugin with the `sfnext-create-figma-kit` skill: duplicate the Figma kit for a vertical, sync Brand variables from `brand.css`, edit components at the correct layer, and publish Code Connect. Requires the Figma MCP server.

  Together these add the design-system / theming / Figma layer that the existing `storefront-next` plugin did not cover.

### Patch Changes

- [`0c9eeab`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0c9eeab3aae624eb8e834e81620b0bc82e3356f3) - Release packaging now reads the list of agent plugins from `skills/plugins.json`. To publish a new plugin, add its `skills/<name>/` directory and list its name in that manifest — no changes to the publish workflow are required. (Thanks [@clavery](https://github.com/clavery)!)

- [`aa48c8e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/aa48c8e441cb5c85eb94d9d63bb0d92d0e68baf0) - Fix the Business Manager extensions skill (`b2c-business-manager-extensions`) to match the authoritative `bmext.xsd` schema. The previous guidance used the wrong namespace and element shapes (resource-key `name`/`icon` attributes, `xp-ref`, a `bm_extensions.properties` bundle) that would not load on a real instance. The skill now documents the `bmmodules/2007-12-11` schema with inline localized `name`/`description` elements, correct `dialogaction`/`formextension` structures, the `NoPermissionCheck` idiom for permission-free endpoints, ascending `position` ordering, and the core BM menu-id table for attaching to existing menus. All XML examples validate against the schema. (Thanks [@clavery](https://github.com/clavery)!)

- [#493](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/493) [`e803346`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e8033465e50d57dd7d87afa400d8caadb82280aa) - Skills now consistently document that the CLI auto-discovers configuration (instance, credentials, tenantId, etc.) from `dw.json`, `SFCC_*` env vars, `~/.mobify`, and `package.json` — flags like `--server`, `--client-id`, and `--client-secret` are usually unnecessary. Each instance-touching skill points agents at `b2c setup inspect` for resolved values and sources, and back to `b2c-config` for setup troubleshooting. (Thanks [@clavery](https://github.com/clavery)!)

  The `b2c-config` skill has been broadened to be the fallback whenever CLI setup or authentication is unclear, with general configuration guidance (including the fact that `dw.json` keys accept both camelCase and kebab-case) and a richer troubleshooting section.

  The `b2c-custom-api-development` skill now describes Custom API cartridge-path lookup correctly: storefront `siteId` resolves through that site's cartridge path, while `siteId=Sites-Site` (the system-defined BM/organization site identifier) and an omitted `siteId` resolve through the Business Manager cartridge path. The skill shows how to manage paths with `b2c sites cartridges` and clarifies when `b2c code deploy --reload` is required (registration, contract, or cartridge-path changes) versus when a plain redeploy suffices (implementation-only edits to an already-registered endpoint).

## 1.3.3

### Patch Changes

- [#485](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/485) [`e6cec0a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e6cec0a704c65d9f0241fa9771fed37017eb7b1a) - Fix `value-definition` element order in the b2c-metadata and b2c-site-import-export skills. The B2C `metadata.xsd` requires `<display>` to appear before `<value>` inside each `<value-definition>`; the skill examples had them reversed, which caused enum/set attribute imports to fail site-archive validation with `cvc-complex-type.2.4.d`. Examples now use the correct order and call out the requirement. (Thanks [@clavery](https://github.com/clavery)!)

- [#484](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/484) [`80e63fc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80e63fca888d9b83efd53c9c0054247fb2aa31b3) - `b2c job import` now supports `--split` for importing directories larger than the instance archive size limit. With `--split` (and optional `--max-size`, default `190mb`), the import is broken into several smaller archives: order-sensitive metadata/XML is imported first — kept together when it fits, otherwise split at data-unit boundaries in dependency order — followed by static assets packed by compressed size. A normal import that exceeds the limit now warns and recommends `--split`. (Thanks [@clavery](https://github.com/clavery)!)

  Example: `b2c job import ./big-site-data --split --max-size 150mb`

  The SDK adds a corresponding `siteArchiveImportSplit()` operation.

## 1.3.2

### Patch Changes

- [#428](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/428) [`db7b330`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db7b330cf60debf05d681b9e1dbb4e025d8eec02) - `b2c job import` now accepts an optional list of paths or globs after the directory `TARGET`, allowing you to import a subset of a site export. Paths are resolved literally first (so shell-expanded globs work) and fall back to root-relative or internal glob expansion when the literal path doesn't exist. The archive preserves each path's layout under `TARGET`. (Thanks [@clavery](https://github.com/clavery)!)

  Example: `b2c job import ./my-site-data sites/RefArch libraries/mylib`

  The SDK's `siteArchiveImport` operation gains a corresponding `paths` option for directory targets.

## 1.3.1

### Patch Changes

- [`ac0da1b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ac0da1b42699613e6d7c22503676641df3a31201) - Exclude per-skill `evals/` directories from the released skills zip artifacts so end users don't receive eval fixtures. (Thanks [@clavery](https://github.com/clavery)!)

## 1.3.0

### Minor Changes

- [#408](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/408) [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29) - Added a new `b2c-bm-users-roles` skill covering all `b2c bm` instance commands — `bm roles`, `bm users`, `bm whoami`, and `bm access-key`. The existing `b2c-am` skill now defers to it for Business Manager content and stays focused on Account Manager (cross-instance) administration. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#395](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/395) [`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe) - Add debug command documentation and b2c-debug agent skill covering interactive REPL, RPC mode, and DAP usage. (Thanks [@clavery](https://github.com/clavery)!)

- [#394](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/394) [`5ae3691`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5ae369114e33f8b24d54f0c233dd71d50fbb92d4) - Improve skill trigger accuracy: rewrite b2c-scapi-admin and b2c-site-import-export descriptions, merge b2c-users-roles into b2c-am, fix weak eval prompts for b2c-job (Thanks [@clavery](https://github.com/clavery)!)

- [#405](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/405) [`b1600fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b1600fa014f9bd23c93488155b37ac2cc5c91fd2) - Document new MRT environment clone, bundle delete, organization member, and organization certificate commands in the `b2c-mrt` skill. (Thanks [@clavery](https://github.com/clavery)!)

## 1.2.0

### Minor Changes

- [#377](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/377) [`cb66b56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb66b563d5d5ca6a0f584d9007629ba392cb3424) - Add `storefront-next` plugin with 14 skills covering the full Storefront Next development lifecycle — project setup, routing, data fetching, components, Page Designer, authentication, i18n, extensions, testing, performance, and deployment to Managed Runtime. (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.3

### Patch Changes

- [`485ef63`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/485ef63b901d91f7b08c56366d1f1756a03f60dc) - Fix skills artifact download by publishing zip assets to dedicated agent-plugins releases (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.2

### Patch Changes

- [`453f9e1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/453f9e18a328807c631ded9be94d6db47044f06c) - Add Commerce Apps Dev (cap-dev) skill set to Claude Code and Codex marketplace configurations (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.1

### Patch Changes

- [`bad9034`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bad903469353654a4b3cdbafecf2cbce5a863ea1) - Improved CAP skill with better guidance and UX refinements (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.0

### Minor Changes

- [#365](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/365) [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859) - Initial release. This package tracks the version of the B2C Commerce agent skills plugins (`b2c-cli` and `b2c`). Its version is stamped into the Claude Code marketplace entries and the Codex plugin manifests at release time, and skills-only changes get a dedicated `b2c-agent-plugins@X.Y.Z` GitHub release tag with updated skills zips attached. Target this package in a changeset when you change skills under `skills/b2c-cli/skills/` or `skills/b2c/skills/`. (Thanks [@clavery](https://github.com/clavery)!)
