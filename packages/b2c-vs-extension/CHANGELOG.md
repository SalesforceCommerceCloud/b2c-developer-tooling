# Change Log

## 1.0.2

### Patch Changes

- [#579](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/579) [`17d8eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/17d8eba792ab02bd708a13b7ef6996cee22b2bed) - Prepare the VS Code extension for its 1.0 Marketplace launch with a public-facing README, feature tour, setup guidance, Marketplace installation instructions, and support links. Contributor build, test, and packaging instructions now live in `DEVELOPMENT.md`. (Thanks [@clavery](https://github.com/clavery)!)

- [#549](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/549) [`4f3ac11`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4f3ac110ec5dc7364643bb1ff4d4c529c4f8cd63) - Point the extension's marketplace repository URL at `forcedotcom/b2c-dx`. The extension is published from a separate Salesforce-owned repository under open-source governance (public OSS lives under a `forcedotcom`/`salesforce` org); development, issues, and pull requests continue in this monorepo. See `packages/b2c-vs-extension/PUBLISHING.md` for the publish flow. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

## 1.0.1

### Patch Changes

- [#578](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/578) [`b6aedd2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b6aedd2f2329f0e9511bdf4e3a799d286fd9b262) - Add a Marketplace/Open VSX listing icon. The extension previously published with the default placeholder tile; it now ships a 256x256 branded icon (Salesforce cloud + B2C Commerce cart) via the top-level `icon` manifest field. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

- Updated dependencies [[`f169fa1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f169fa153f75f4f3b76622b4300c11631deb50b0), [`633f3cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/633f3cb7d409132f107b012e26448ab7812ed506)]:
  - @salesforce/b2c-tooling-sdk@1.21.0

## 1.0.0

### Major Changes

- [#570](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/570) [`a524534`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a5245345c319d88cc515fd414b2e228a41712770) - Release the B2C Commerce VS Code extension 1.0. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`3b1152f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3b1152f4a21bf167b1c647677f36c1507d0a476c)]:
  - @salesforce/b2c-tooling-sdk@1.20.1

## 0.11.0

### Minor Changes

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Surface **Custom Step Types** as a third category under each cartridge in the **Cartridges** explorer, alongside Hooks and Job Steps. (Thanks [@clavery](https://github.com/clavery)!)
  - Custom step types are parsed from any `steptypes.json` under the cartridge (both `script-module-step` and `chunk-script-module-step` categories are supported, and the legacy flat-array shape is tolerated).
  - **Clicking a step type opens its module implementation** (the `.js` file referenced by the `module` field) — resolving across sibling cartridges when the module lives in a different cartridge from where it's registered.
  - **Right-click → Show Step Type Definition** jumps to the `@type-id` line inside `steptypes.json` for the alternate navigation target.
  - Nodes for step types whose module cannot be resolved on disk fall back to opening the JSON definition, so the click always does something useful.

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Add B2C-DX Analytics (CIP/CCAC) feature to the VS Code extension. Surfaces three webview panels: (Thanks [@clavery](https://github.com/clavery)!)
  - **Query Builder** — visual SELECT/FROM/WHERE/ORDER BY/LIMIT composer with raw-SQL toggle and a workspace-scoped Saved Queries library tagged per tenant.
  - **Tables Browser** — schema explorer for the active CIP warehouse tenant.
  - **Curated Reports** — parameter forms for every `cip report …` command with date pickers, validation, sortable result grid, and CSV/JSON export.

  Adds multi-realm management (group, add, edit, switch, remove) so a single workspace can target multiple tenants. CIP commands now route through `registerSafeCommand` so SafetyGuard policies are enforced and a `cipAnalytics` feature category is recorded by usage telemetry. The shared webview stylesheet is copied into `dist/cip-analytics/` at build time so the packaged extension no longer reaches into `src/` for runtime assets.

- [#559](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/559) [`91947b0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91947b0646c04007049ce2bc321ca2ac76aa7a2c) - The extension no longer activates on every VS Code startup. It now activates on demand when you open a B2C Commerce workspace (detected via `dw.json`, `.project`, `cartridge/*.properties`, or `commerce-app.json`), open a B2C view, or run a B2C command — reducing startup overhead in unrelated projects. (Thanks [@clavery](https://github.com/clavery)!)

  Adds an opt-in `b2c-dx.features.sandboxFilesystem` setting (default off) that automatically mounts the active instance's WebDAV filesystem as a workspace folder.

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Add an interactive Export view to the VS Code extension for building site impex (site archive) exports. Check the data units you want — sites (with per-site flags), global data, catalogs, inventory lists, libraries, customer lists, and price books — then run Export to download and extract the archive locally. Sites, catalogs, and inventory lists are discovered from the instance automatically; libraries, customer lists, and price books are added by ID. The SDK gains a `discoverExportableUnits` helper that lists the exportable sites, catalogs, and inventory lists on an instance. (Thanks [@clavery](https://github.com/clavery)!)

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Improve ISML diagnostics and hover help: (Thanks [@clavery](https://github.com/clavery)!)
  - Add four diagnostics that catch common structural mistakes: `<iselse>`/`<iselseif>` outside an `<isif>`, `<isbreak>`/`<isnext>`/`<iscontinue>` outside an `<isloop>`, `<isreplace>` outside an `<isdecorate>`, and `<isprint>` setting both `style` and `formatter`.
  - The `encoding="off"` output-escaping warning (stored-XSS risk) is now on by default and fires for every tag with an `encoding` attribute (previously it was opt-in and only checked a subset of tags). Silence it per line with `<iscomment> b2c-dx-disable-next-line encoding-off </iscomment>` or globally via `b2c-dx.isml.diagnostics.disabledRules`.
  - Correct and expand tag hover text (fixes an inaccurate `<isscript>` tip, documents `<isloop>` status properties, `<isprint>` style/formatter, and `<iscontent>` placement).

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Add ISML document formatting and expand ISML diagnostics. (Thanks [@clavery](https://github.com/clavery)!)

  **Formatting.** ISML files now support Format Document and Format Selection, powered by the same engine as VS Code's built-in HTML formatter (`vscode-html-languageservice`). `<isscript>` bodies and `${...}` expressions are preserved verbatim, and void ISML tags are normalized to `<isxxx/>`. Configurable via `b2c-dx.isml.format.*` and gated by `b2c-dx.features.ismlFormatting`.

  **Diagnostics.** Added required-attribute checks (e.g. `<isif>` needs `condition`, `<isloop>` needs an iterator and an alias, `<isinclude>` needs `template` or `url`) and an opt-in `encoding="off"` output-escaping warning. Every diagnostic now carries a stable rule code shown in the Problems panel.

  **Suppression & configuration.** Individual lines can be suppressed inline with an ISML comment directive — `<iscomment> b2c-dx-disable-next-line <code> </iscomment>` (or `b2c-dx-disable-line`, or no code to suppress all rules on the line) — offered as a quick fix on any diagnostic. Rules can be disabled project-wide via `b2c-dx.isml.diagnostics.disabledRules` (the `encoding-off` warning is disabled by default).

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Highlight ISML tags (`<isif>`, `<isloop>`, `<isprint>`, `<isscript>`, etc.) distinctly from plain HTML tags so ISML directives are easier to spot at a glance. Controlled by the `b2c-dx.isml.highlightTags` setting (on by default); disable it to render ISML tags in the normal HTML tag color. The color follows the active theme and never modifies your settings. (Thanks [@clavery](https://github.com/clavery)!)

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Add ISML language support in the VS Code extension, including `.isml` file association, grammar and snippets, auto-close and linked editing for tags, diagnostics and quick fixes, symbols/folding/hover, semantic completions (`Resource.msg`, `URLUtils`, `res.render`, `require`), and template path links/definitions/references across cartridges. (Thanks [@clavery](https://github.com/clavery)!)

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Consolidate the B2C Operations (Jobs) experience into the primary **B2C-DX** sidebar based on review feedback: (Thanks [@clavery](https://github.com/clavery)!)
  - **Single Job History view** under the existing `b2c-dx` container (collapsed by default). The standalone "B2C-DX Operations" sidebar and the React-based Job History table webview have been removed — all controls now live in the tree's title bar.
  - **No fetch on activation.** The view shows a load hint until you press **Refresh** (or enable the new **Auto-Refresh** toggle). A new `b2c-dx.jobs.autoRefresh` setting (off by default) and a title-bar toggle control opt-in polling.
  - **Chronological-first root view.** Job History now defaults to a BM-style flat timeline of recent executions, with a title-bar toggle to switch to the previous "group by job" view. New `b2c-dx.jobs.defaultGrouping` setting controls the default.
  - **Default status filter is `all`**, fixing the empty-view-on-first-load defect (previously required clicking the filter before anything appeared).
  - **Inline name filter** in the title bar (BM-style job-name search).
  - **Open in Business Manager** deep-links directly to _Administration › Operations › Jobs_ instead of the BM landing page.
  - **Job Definitions view removed.** Its useful action — **Create Job Scaffold** — moves to a right-click on a cartridge in the **Cartridges** explorer.
  - **Cartridges explorer broadened** to expand each cartridge into **Hooks** and **Job Steps** child nodes (parsed from `hooks.json` and `cartridge/scripts/jobsteps/`). Click a file to open it.

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Add a B2C Operations (Jobs) experience to the VS Code extension: (Thanks [@clavery](https://github.com/clavery)!)
  - **Job History** — view execution history from the connected instance, including jobs that are currently running (shown live with a spinner and auto-refresh), with a table to search, filter (status, job, user, date, time presets), sort, and export runs to CSV/JSON. Each run has inline actions to open its log, view details, and re-run.
  - **Job Definitions** — view the jobs (`jobs.xml`) and custom step types (`steptypes.json`) defined in your workspace cartridges, with actions to run, deploy, and open the source files.
  - **Run / Re-run** — trigger a job (optionally with parameters), poll it to completion, and open its log automatically. Re-run reuses the original execution's parameters.
  - **Create Job Scaffold** — generate a custom job step script, its `steptypes.json` registration, and a matching `jobs.xml` that references the registered `custom.*` step type.
  - **Deploy Job Definition** — deploy a `jobs.xml` to register the job in Business Manager.

  System (`sfcc-*`) jobs are distinguished from custom jobs, and actions that don't apply to them are disabled with an explanation.

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Add XSD-based validation, autocomplete, and hover docs for B2C metadata XML files, backed by ~50 bundled schemas (catalogs, promotions, jobs, services, A/B tests, page-meta-tags, sorting rules, source codes, content libraries, event routing, and more). (Thanks [@clavery](https://github.com/clavery)!)

  **Namespace-based association.** Validation is matched by the document's declared XML namespace, not by filename or folder layout, so a metadata file validates against the correct schema wherever it lives — in a canonical site-archive (`sites/<id>/…`), an exploded `metadata/` workspace, or anywhere else. The extension ships an XML catalog and registers it with the Red Hat XML language server at runtime; no changes are written to your `settings.json`.

  **Optional companion extension.** Validation is powered by the Red Hat XML extension (`redhat.vscode-xml`), a _soft_ dependency — it is not force-installed and no Java runtime is required. When you open a B2C metadata XML file, the extension offers to install it (with a "Don't ask again" option); until then the extension is unaffected. You can trigger setup any time via the **B2C DX: Set Up Metadata XML Validation** command, and disable the whole feature with the `b2c-dx.features.xmlValidation` setting. Teams whose policies block third-party extensions can simply decline the prompt.

### Patch Changes

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Fix the VS Code extension failing to activate when ISML support is enabled. The `src/isml/scanner.ts` module loaded `vscode-html-languageservice` via runtime `require()` calls that esbuild left unbundled. Because the VSIX is packaged with `vsce --no-dependencies`, the deep submodule paths could not be resolved at runtime and activation crashed silently — no "B2C DX" output channel, no instance selector, no commands. Switched to direct ESM imports so esbuild inlines the scanner code into the bundle. (Thanks [@clavery](https://github.com/clavery)!)

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Harden ISML language support: (Thanks [@clavery](https://github.com/clavery)!)
  - Treat `<isslot>`, `<ismodule>`, and `<iscomponent>` as empty (self-closing) elements, so auto-close no longer inserts invalid closing tags and diagnostics no longer report them as "not closed".
  - Ignore markup inside `<iscomment>` and `<isscript>` bodies — commented-out ISML and `<` characters in scripts no longer produce false diagnostics, folding, or symbols.
  - Debounce diagnostics so large templates are not re-linted on every keystroke.
  - Guard the "create template" command against being run directly from the command palette.
  - Resolve template links without the `vscode-html-languageservice` dependency, removing a fragile deep import into that package's internals.

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Gate the developer onboarding walkthrough behind a new `b2c-dx.features.onboarding` setting (Preview, off by default). The guided walkthrough, role-based deep-dive panel, and their palette commands no longer appear — and the walkthrough no longer auto-opens on first activation — unless the setting is enabled. Set `b2c-dx.features.onboarding` to `true` to opt in while the feature is still in development. (Thanks [@clavery](https://github.com/clavery)!)

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Make the VS Code extension resilient offline and when an instance is unreachable. A malformed `dw.json` no longer prevents the extension from activating, so local code browsing — cartridge discovery, Script API IntelliSense, cartridge-path require resolution, CAP detection, and scaffolding — keeps working without a connection. Connection-dependent views (WebDAV, Content, Sandbox, Logs) now collapse repeated "instance unreachable" errors into a single notification instead of flooding, and the Sandbox view explains when Account Manager OAuth credentials are the missing piece. The SDK's `listInstances()` now tolerates a malformed `dw.json` (returning no instances) rather than throwing. (Thanks [@clavery](https://github.com/clavery)!)

- [#565](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/565) [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767) - Stop bundling development-only files into the published extension. The packaged VSIX no longer includes the `test-workspace/` sample cartridges or local `.claude/` editor settings, reducing package size and removing files that were never meant to ship. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`9fb332d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9fb332d92cc3289d2796c97a4c70f839dfe5f999), [`9fb332d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9fb332d92cc3289d2796c97a4c70f839dfe5f999), [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767), [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767), [`54d69bc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/54d69bc3e439d0252f6a1456e9aa8a307e7a2767)]:
  - @salesforce/b2c-tooling-sdk@1.20.0

## 0.10.4

### Patch Changes

- Updated dependencies [[`71dfe3a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/71dfe3a86b7e752ffad9f3d44f1e7c6357e431fa)]:
  - @salesforce/b2c-tooling-sdk@1.19.1

## 0.10.3

### Patch Changes

- Updated dependencies [[`fdf3c5f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/fdf3c5fe570ff71fddfc4aa0d83c9e3a05be5406)]:
  - @salesforce/b2c-tooling-sdk@1.19.0

## 0.10.2

### Patch Changes

- [#517](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/517) [`6882d5d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6882d5d3e153bf97191e5e1d494f34f36cbc0f6b) - Improve the B2C Logs view when tailing. Log entries are now color-coded by level (error, warn, info, debug) with a built-in level filter, each entry is tagged with its source log prefix (e.g. `[error]`, `[customerror]`), and multi-line stack traces are indented so each entry reads as a single block. Uses the same "B2C Logs" output channel — no new panel or command. (Thanks [@charithaT07](https://github.com/charithaT07)!)

- [#525](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/525) [`3d0c4aa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3d0c4aae7a2c6c33cd82ad94cde35e4cdb5155ca) - Telemetry for MCP tool failures and VS Code extension activation failures now records the underlying error message (and cause, when present), instead of an empty value. Previously these failure events carried no error detail, which made it impossible to diagnose why a tool call or activation failed. No new data beyond the error text is collected, matching what the CLI already reports for command errors. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`04b02f3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/04b02f3b4b1c1e4c353ad081fc41304276c8bdb2), [`3d0c4aa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3d0c4aae7a2c6c33cd82ad94cde35e4cdb5155ca), [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1), [`7055134`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7055134e755c391cd7839c11c99d66df18672866), [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1), [`9418f08`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9418f088d7abfff01d41f4339beb62be29df7810), [`85e6ca1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/85e6ca110de162d3d574cf425bf3c0fdbb2834f1), [`31ec679`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31ec679ca6058d2ba7f453528af873163a5baeff), [`b62b00b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b62b00b47855273dfedea62f932696cc24ef148f), [`31324e1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31324e16fd0fb5402a3da1340f3575708c336661), [`cab53af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cab53af8c1190f749adf2ab8d70c01f79d7d2dbc)]:
  - @salesforce/b2c-tooling-sdk@1.18.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`2f79d71`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/2f79d711475add9707ee2474f6dfab416dd88ba6), [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88), [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88)]:
  - @salesforce/b2c-tooling-sdk@1.17.0

## 0.10.0

### Minor Changes

- [#522](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/522) [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019) - Expose the script debugger session cookie (`dwsid`) so you can route a triggering request to the same app server holding the debug session — required to reliably hit breakpoints on multi-app-server instances. (Thanks [@clavery](https://github.com/clavery)!)
  - **SDK:** new `SdapiClient.getCookie(name)` and `DebugSessionManager.getSessionCookie()`; the cookie is also logged at info level when the session connects.
  - **MCP:** `debug_start_session` and `debug_list_sessions` now return a `session_cookie` field.
  - **VS Code:** a new **Copy Debugger Session ID (dwsid)** command (available while a debug session is active) copies the cookie to the clipboard.

  Send your triggering request (storefront page load, SCAPI/OCAPI call) with `Cookie: dwsid=<value>`.

### Patch Changes

- Updated dependencies [[`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019), [`3958d6e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3958d6eb568a1e91061f4203c986a124c480e12f), [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019)]:
  - @salesforce/b2c-tooling-sdk@1.16.0

## 0.9.5

### Patch Changes

- Updated dependencies [[`3bc78c4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bc78c422d57b590b2435fd6ae0a31fffc4bd7e7)]:
  - @salesforce/b2c-tooling-sdk@1.15.1

## 0.9.4

### Patch Changes

- [#514](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/514) [`0d97ad1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d97ad1856d6a45d9349a3609c7e425d2b5e874a) - Replace the `applicationinsights` dependency with a tiny built-in telemetry client that posts directly to the Application Insights ingestion endpoint using Node's native `fetch`. This removes ~270 transitive packages (the OpenTelemetry, Azure SDK, and gRPC trees that the v3 SDK pulled in for auto-collection features we never used) and shrinks the published packages and the VS Code extension bundle. Telemetry behavior is unchanged — the same events and exceptions are reported — and the machine-identifying cloud role instance is now correctly suppressed for GDPR. A new optional `flushIntervalMs` option enables periodic delivery for long-lived hosts; the VS Code extension uses it so a session's usage events are not lost on a non-clean shutdown. No public SDK API change. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`3bce44e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bce44e2e6d4cea3cf64e34eff1246d86e459b73), [`0d97ad1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d97ad1856d6a45d9349a3609c7e425d2b5e874a)]:
  - @salesforce/b2c-tooling-sdk@1.15.0

## 0.9.3

### Patch Changes

- Updated dependencies [[`1575070`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/15750709ca6b23838bb9fd954d6c09e8dbb67ed3)]:
  - @salesforce/b2c-tooling-sdk@1.14.1

## 0.9.2

### Patch Changes

- Updated dependencies [[`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1), [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1)]:
  - @salesforce/b2c-tooling-sdk@1.14.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`19f059e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/19f059e7ba928d1070d7960920770f1256dfae73)]:
  - @salesforce/b2c-tooling-sdk@1.13.0

## 0.9.0

### Minor Changes

- [#457](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/457) [`8aa076e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8aa076e367b5f99ad3c0a5e7c0926c464a7f5a83) - API Browser: right-click a Shopper schema to run `pnpm sfnext scapi add` in an integrated terminal. The action is only shown when the workspace is detected as a Storefront Next project. (Thanks [@clavery](https://github.com/clavery)!)

- [#467](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/467) [`ce0c0b5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ce0c0b5c3961faa86dc446f061316100bf4ecbcc) - Remove the Page Designer Assistant webview and its "Open Page Designer Assistant UI" command from the VS Code extension. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#458](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/458) [`637df9e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/637df9ed4d02d4b9ba6cfb68a149dddce6dba8d5) - Fix VS Code API Browser handling of Custom APIs and shopper-named system APIs. Custom APIs now show endpoint paths with the required `/organizations/{organizationId}/...` prefix, and the Shopper/Admin classification is now derived from the spec's declared security schemes (ShopperToken / AmOAuth2 / BearerToken) rather than the API family name — fixing token selection for shopper-named APIs that live under non-shopper families (e.g. `product/shopper-products`, `checkout/shopper-baskets`) and for Custom APIs which can be either type. Resolves #453. (Thanks [@clavery](https://github.com/clavery)!)

- [#475](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/475) [`0363dca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0363dca90f1eb3822d0c750d29ace743e82afcaf) - Harden the extension build and packaging pipeline. The esbuild bundle now minifies, drops debugger statements, targets Node 22 (matching VS Code 1.105's runtime), and inlines `require('@salesforce/b2c-tooling-sdk/package.json')` at SDK source-load time so minification can no longer break the substitution. SDK data directories that the runtime expects (`cip-proto`, `script-api`, `content-schemas`, `scaffolds`) are all staged into `dist/data/` instead of just `scaffolds`. The `inject-script-types` step that adds the bundled TypeScript Server plugin to the VSIX now uses pure-Node JSZip instead of shelling out to `zip`/`unzip`, removing the host-binary requirement (Windows CI compatibility) and fixing a regression where `[Content_Types].xml` entries for the injected plugin were emitted without their leading dot. The extension version and telemetry connection string are now injected as build-time constants, eliminating a runtime `readFileSync(package.json)`. `vscode:prepublish` now builds `@salesforce/b2c-script-types` before the extension bundle so a stale plugin tree can no longer ship. (Thanks [@clavery](https://github.com/clavery)!)

- [#475](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/475) [`0363dca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0363dca90f1eb3822d0c750d29ace743e82afcaf) - Correctness and UX hardening pass across the extension: (Thanks [@clavery](https://github.com/clavery)!)
  - **Content libraries**: `ContentFileSystemProvider.stat()` now returns a stable `mtime` instead of `Date.now()` per call. VS Code no longer believes content files are constantly mutating, eliminating phantom "file modified externally" prompts and silent buffer reloads that could clobber unsaved edits.
  - **WebDAV explorer**: F2-rename now works. The `rename()` method delegates to the SDK's `webdav.move` (already used by drag-and-drop) instead of throwing `NoPermissions`. Cross-root attempts and 412 conflicts are mapped to the right `vscode.FileSystemError`.
  - **Activation performance**: replaced sync `fs.readFileSync` / `existsSync` / `statSync` on the activation hot path (`B2CExtensionConfig`) and in the per-paint CAP file-decoration provider with `vscode.workspace.fs` async equivalents and a Set lookup, respectively. CAP decorations now answer in O(1) without filesystem syscalls.
  - **Cancellation**: long-running operations (sandbox clone polling, CAP install, deploy, content export, Swagger UI proxy fetches) now show a working Cancel button. Cancelling stops the local poll/wait; aborting the server-side operation requires SDK `AbortSignal` support which is a separate change.
  - **Tree state stability**: every tree provider (sandbox, WebDAV, content libraries, API browser, cartridges) now sets a stable `TreeItem.id`, so expand/collapse state survives refresh and `treeView.reveal()` works without try/catch fallback.
  - **Safety + telemetry coverage**: 11 contributed commands previously bypassed `registerSafeCommand`, including `b2c-dx.sandbox.clone` (a billable operation). All now route through the safety guard and feature-usage telemetry. Added a `scriptTypes` feature category and command-prefix mapping.
  - **Dead code removal**: removed an unused `createDeleteAndDeployCommand`, the unused `tempDirs` cleanup loop in `cartridge-commands`, the dead `openExternal` branch in the Page Designer webview message handler, and the never-implemented `b2c-dx.codeSync.diffCartridge` command.

- Updated dependencies [[`b723939`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b72393951bb95b64f3291cd3cb76197e280a6a37), [`21bbed0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/21bbed0ea1b42e8750d4259669370f8bcf562c10), [`de8d40b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/de8d40b54dc923c5805fac2ef587db8b86349a6b), [`80e63fc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80e63fca888d9b83efd53c9c0054247fb2aa31b3), [`c8e0b60`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c8e0b602e1a8da88f7e6620e5d5614f3a55689bd)]:
  - @salesforce/b2c-tooling-sdk@1.12.0

## 0.8.2

### Patch Changes

- [#461](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/461) [`3fe804f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3fe804f34e98fdf4a46c189561c89389e6bce5f0) - Make the published VSIX OPC-compliant by declaring a content type for `.ts` files (introduced by the bundled Script API types). The packaging step now patches `[Content_Types].xml` after injection so every file extension in the archive has a registered content type. Strict OPC consumers — observed on some Windows installs — may otherwise reject the package. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.1

### Patch Changes

- Updated dependencies [[`b8dcf74`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b8dcf741c253fee0df4219400bfa10a79c704e98)]:
  - @salesforce/b2c-tooling-sdk@1.11.1

## 0.8.0

### Minor Changes

- [#451](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/451) [`665b2a1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/665b2a1144aa4c66ab7bf4f98294662bd55877a0) - Add Script API IntelliSense for cartridge JavaScript: `dw/*`, cartridge-style requires, and SFCC globals (`session`, `request`, `response`, `customer`, etc.) are typed automatically. The VS Code extension wires this up out of the box; for other editors, run `b2c setup ide tsserver-plugin` (LSP plugin) or `b2c setup ide vscode-types` (jsconfig). See the IDE Integration guide for details. (Thanks [@clavery](https://github.com/clavery)!)

## 0.7.1

### Patch Changes

- [#425](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/425) [`5e43132`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5e43132ab1b10da33517a697b32e22737d2f9bb4) - The SDK is now ESM-only — the dual-format `dist/cjs` build has been removed and the package exports map exposes only ESM. CommonJS consumers that previously did `require('@salesforce/b2c-tooling-sdk')` from a CJS package must either switch to `import` or rely on Node's `require(esm)` (Node ≥22.12). The VS Code extension has been converted to a `"type": "module"` package; its bundled entry is now `dist/extension.cjs`. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`5d62ac2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5d62ac21a505c3ae4c58507fe0ffe65a5ee89087), [`db7b330`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db7b330cf60debf05d681b9e1dbb4e025d8eec02), [`5e43132`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5e43132ab1b10da33517a697b32e22737d2f9bb4)]:
  - @salesforce/b2c-tooling-sdk@1.11.0

## 0.7.0

### Minor Changes

- [#422](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/422) [`e4b8238`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b82385bfddb93a17f874f34315e4ab73e7c84a) - The `libraries` config field now accepts `{id, siteLibrary?}` objects in addition to bare strings (mixed forms allowed in the same array). This lets you mark site-private libraries in `dw.json` or `package.json` so `b2c content list` / `content export` can default `--site-library` based on which library you target, and the VS Code Content Libraries tree auto-loads every configured library on activation. To upgrade, optionally replace `"libraries": ["RefArchSharedLibrary"]` with `"libraries": ["RefArchSharedLibrary", {"id": "SiteGenesis", "siteLibrary": true}]`. The existing string-only form continues to work unchanged. Also adds `libraries`, `assetQuery`, and `realm` to the documented `package.json` allowed fields list (already supported in code). (Thanks [@clavery](https://github.com/clavery)!)

- [#409](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/409) [`ec31234`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ec312342e14080fb5d51b72243e763030c429f80) - Add anonymous usage telemetry (extension activation/deactivation lifecycle, broad feature-category usage, exceptions) to help prioritize fixes during the Developer Preview. Sending is non-blocking. Honors the new `b2c-dx.telemetry.enabled` setting (default `true`), VS Code's `telemetry.telemetryLevel`, and the `SFCC_DISABLE_TELEMETRY` / `SF_DISABLE_TELEMETRY` environment variables. No credentials, hostnames, or business data are collected. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`e4b8238`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b82385bfddb93a17f874f34315e4ab73e7c84a)]:
  - @salesforce/b2c-tooling-sdk@1.10.0

## 0.6.0

### Minor Changes

- [#399](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/399) [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c) - Support `assetQuery` as a first-class config field. Set it in `dw.json` (per-instance), in `package.json` under `b2c`, or via `SFCC_ASSET_QUERY` to control which JSON dot-paths are extracted as assets during content library parsing. The VS Code Content Libraries tree and `b2c content export` both honor it automatically; the `--asset-query` flag still wins when provided, and the fallback remains `["image.path"]`. (Thanks [@clavery](https://github.com/clavery)!)

- [#399](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/399) [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c) - Enforce Safety Mode in the VS Code extension. Destructive operations initiated from the extension (sandbox delete/stop/restart, WebDAV writes, jobs, etc.) now honor `SFCC_SAFETY_LEVEL`, `SFCC_SAFETY_CONFIRM`, `SFCC_SAFETY_CONFIG`, and the per-instance `safety` block in `dw.json`, consistent with the CLI. Every extension command is also evaluated against command rules (e.g. `{ "command": "b2c-dx.sandbox.delete", "action": "block" }`), and confirmation-mode policies surface a native VS Code modal before the command runs. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#407](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/407) [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d) - VS Code extension reliability fixes: (Thanks [@clavery](https://github.com/clavery)!)
  - Swagger API Browser webview no longer attempts `postMessage` after the panel has been disposed (previously could throw on token refresh or proxy responses arriving after close).
  - Sandbox tree polling no longer stacks "stop-check" timers when the configured polling interval is shorter than the 3-second stabilization window.
  - Code Sync now drains pending uploads/deletes before tearing down its file watchers, so saves immediately preceding a stop are no longer dropped.

- [#399](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/399) [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c) - Fix Content Libraries tree not updating when switching instances. The tree previously kept libraries from the old instance; it now re-seeds from the newly active instance's configured `contentLibrary` on switch. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe), [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c), [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d), [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29), [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29), [`51aed02`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/51aed020426f1ce3869b3d260d9af796db8a19e7), [`b53d75e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b53d75e196a6808b4fc9cac249c4495da2471846), [`b1600fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b1600fa014f9bd23c93488155b37ac2cc5c91fd2)]:
  - @salesforce/b2c-tooling-sdk@1.9.0

## 0.5.0

### Minor Changes

- [#382](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/382) [`4f30de7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4f30de783a049e33a121ec80a2cbd1c455f5d4e8) - Add Code Sync feature: file watcher with automatic upload to instance, deploy command, cartridge tree view with download/upload/site path management, and code version management. Includes status bar toggle, per-instance state persistence, and `autoUpload` dw.json support. Move API Browser to separate SCAPI sidebar. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`4f30de7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4f30de783a049e33a121ec80a2cbd1c455f5d4e8)]:
  - @salesforce/b2c-tooling-sdk@1.8.0

## 0.4.4

### Patch Changes

- Updated dependencies [[`cb66b56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb66b563d5d5ca6a0f584d9007629ba392cb3424)]:
  - @salesforce/b2c-tooling-sdk@1.7.0

## 0.4.3

### Patch Changes

- [`63bcb49`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/63bcb4907585bea7ea41a6be483e7078a2cf5113) - Activate extension on startup so the instance selector status bar appears without needing to open the B2C sidebar first (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`485ef63`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/485ef63b901d91f7b08c56366d1f1756a03f60dc)]:
  - @salesforce/b2c-tooling-sdk@1.6.1

## 0.4.2

### Patch Changes

- Updated dependencies [[`1dc1ee5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1dc1ee55642f0d478d260867d538f02e32057d7e)]:
  - @salesforce/b2c-tooling-sdk@1.6.0

## 0.4.1

### Patch Changes

- [`bad9034`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bad903469353654a4b3cdbafecf2cbce5a863ea1) - Improved CAP skill with better guidance and UX refinements (Thanks [@clavery](https://github.com/clavery)!)

- [`1b07a5d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b07a5d400a3c684c391940bbd44c0dfa80d5dc9) - Fix OAuth redirect URI trailing slash mismatch that caused authentication failures in VS Code (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.0

### Minor Changes

- [#370](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/370) [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a) - Add `cap` command topic for Commerce App Package (CAP) management. (Thanks [@clavery](https://github.com/clavery)!)

  New commands:
  - `b2c cap validate` — validates CAP structure, manifest, and cartridge rules locally
  - `b2c cap package` — packages a CAP directory into a distributable `.zip`
  - `b2c cap install` — installs a CAP on an instance via WebDAV + `sfcc-install-commerce-app` job
  - `b2c cap uninstall` — uninstalls a CAP via `sfcc-uninstall-commerce-app` job

  New SDK exports in `@salesforce/b2c-tooling-sdk/operations/cap`: `validateCap`, `commerceAppInstall`, `commerceAppUninstall`, `commerceAppPackage`.

  The VS Code extension gains CAP directory detection (badge decoration) and an "Install Commerce App (CAP)" context menu action.

### Patch Changes

- Updated dependencies [[`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a), [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a)]:
  - @salesforce/b2c-tooling-sdk@1.5.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`59dd584`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59dd584479cc024fa6eed365c7c91f64dc4110be), [`3dedc05`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3dedc05ade10f6d748b4168daef0e4c2fdaf1501), [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859)]:
  - @salesforce/b2c-tooling-sdk@1.4.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`1b0b4ce`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b0b4ce2af63862438c0dae74df2efb35262139a)]:
  - @salesforce/b2c-tooling-sdk@1.3.2

## 0.3.2

### Patch Changes

- Updated dependencies [[`30de66b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/30de66bf59c250c5382a7427ba475049c68566cd)]:
  - @salesforce/b2c-tooling-sdk@1.3.1

## 0.3.1

### Patch Changes

- Updated dependencies [[`c04bbcb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c04bbcbb179d733bedc42f4d0eee2dff2256789e)]:
  - @salesforce/b2c-tooling-sdk@1.3.0

## 0.3.0

### Minor Changes

- [`464b9db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/464b9dbc3cf498e585d81ba5eb7ed0f17ff60a46) - Add B2C Commerce script debugger with SDAPI 2.0 DAP adapter (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`464b9db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/464b9dbc3cf498e585d81ba5eb7ed0f17ff60a46), [`e6c6226`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e6c6226c256b8d181917cc8c66fa4d7bf992e106)]:
  - @salesforce/b2c-tooling-sdk@1.2.0

## 0.2.11

### Patch Changes

- Updated dependencies [[`6880a84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6880a846aacd029a1eb510023aa76f4b844ec26e)]:
  - @salesforce/b2c-tooling-sdk@1.1.0

## 0.2.10

### Patch Changes

- Updated dependencies [[`e597e61`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e597e6131b9965e88ef75954a935695fa7f6d70f)]:
  - @salesforce/b2c-tooling-sdk@1.0.1

## 0.2.9

### Patch Changes

- Updated dependencies [[`7ad490a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ad490a508b7f993292bd8a326f7a6c49c92d70c), [`c24e920`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c24e9204a5f253b773c43c0b30c064c7f4dec34a)]:
  - @salesforce/b2c-tooling-sdk@1.0.0

## 0.2.8

### Patch Changes

- [#285](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/285) [`cb74ce4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb74ce4c78a91cc49556f464be5124981a24c3ea) - Add `openBrowser` and `redirectUri` options to OAuth strategy creation, allowing callers to customize how the browser is opened and which redirect URI is used during implicit auth. The VS Code extension now uses `vscode.env.openExternal` and `vscode.env.asExternalUri` so implicit OAuth works in Codespaces and other remote environments. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e), [`cb74ce4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb74ce4c78a91cc49556f464be5124981a24c3ea), [`c10ddad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c10ddadf7277c93196c956b73af694f4f065a149), [`b7f78ca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b7f78ca6d2468e274b911c4fd1fc7c03a9e6b4fb)]:
  - @salesforce/b2c-tooling-sdk@0.13.0

## 0.2.7

### Patch Changes

- Updated dependencies [[`f7229b4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f7229b4372bb23d8e107db75f722575c33f4a007)]:
  - @salesforce/b2c-tooling-sdk@0.12.0

## 0.2.6

### Patch Changes

- Updated dependencies [[`8c31081`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c31081b47e57e6a21e62425e6f19da036fc3e34), [`e4b5094`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b5094d9c1c2a60e1214bc236ce7ed84c5d158b)]:
  - @salesforce/b2c-tooling-sdk@0.11.0

## 0.2.5

### Patch Changes

- Updated dependencies [[`b30e427`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b30e427f25807840dbcceef6c0005e2d9fd1be53), [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc), [`caa568e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/caa568e9de3e8c9d3f2e7b17e5f96c1a0ae3ca73)]:
  - @salesforce/b2c-tooling-sdk@0.10.0

## 0.2.4

### Patch Changes

- Updated dependencies [[`16bd9d6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/16bd9d6a1c658d6ba3de04fa3acf89295e1e5e06), [`4cf7249`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4cf72497f5e01d627de7aae80290d072f4c914f6), [`9996eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9996eba2a8fe53a27bf52fb208eb722d618cd282), [`d50bf6b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d50bf6b91dcd40314f10c8c97a28805039161213)]:
  - @salesforce/b2c-tooling-sdk@0.9.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`760a6cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/760a6cbe144ffcd7c72b32b05df861626d3d5a2c)]:
  - @salesforce/b2c-tooling-sdk@0.8.3

## 0.2.2

### Patch Changes

- Updated dependencies [[`d4423bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d4423bb218af3991396286b4900c3b051666e06b), [`69a98dc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/69a98dc21f3a326f551929fcd530741b9f0ca126)]:
  - @salesforce/b2c-tooling-sdk@0.8.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`e790dfa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e790dfa8d5375fde7936ae4a10b2f3fd722ec087)]:
  - @salesforce/b2c-tooling-sdk@0.8.1

## 0.2.0

### Minor Changes

- [#244](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/244) [`b26ebeb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b26ebebd2b5dbff19689bdfadd5b9864597fbfb1) - Add API Browser with Swagger UI for interactive SCAPI exploration. Proxy requests through extension host to avoid CORS, pre-fill parameters and auth tokens, and expand custom properties in schemas. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`b26ebeb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b26ebebd2b5dbff19689bdfadd5b9864597fbfb1)]:
  - @salesforce/b2c-tooling-sdk@0.8.0

## 0.1.2

### Patch Changes

- [`6915771`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/69157717ce8eba1771687ab800306b2bf6421b18) - Add `b2c-vs-extension@latest` moving tag that updates with each release and fix dedicated VS Code extension release to always trigger independently of other package publishes (Thanks [@clavery](https://github.com/clavery)!)

## 0.1.1

### Patch Changes

- [`b45aa8e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b45aa8e0e6172668e174f896d817e094387a6e6f) - Add `b2c-vs-extension@latest` moving tag that updates with each release (Thanks [@clavery](https://github.com/clavery)!)

## 0.1.0

### Minor Changes

- [#241](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/241) [`3758114`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3758114c328fcfffc54fb32a935df23503fc0ba2) - Add `.env` file loading, `SFCC_*` env var support, and smart workspace folder detection for multi-root workspaces (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`3758114`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3758114c328fcfffc54fb32a935df23503fc0ba2), [`1b9b477`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b9b4773110a5d97bfe81d37a093158088d94cee), [`732d4ad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/732d4ad1e52dd1e0f0676cee87305464ccf4ca9e)]:
  - @salesforce/b2c-tooling-sdk@0.7.0

## 0.0.10

### Patch Changes

- Updated dependencies [[`8faf831`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8faf831b4e4827e252e48242b2a2b2155157f3c2)]:
  - @salesforce/b2c-tooling-sdk@0.6.0

## 0.0.9

### Patch Changes

- Updated dependencies [[`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc)]:
  - @salesforce/b2c-tooling-sdk@0.5.5

## 0.0.8

### Patch Changes

- Updated dependencies [[`f9ebb56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9ebb562d0c894aed9f0498b78ca01fce70db352)]:
  - @salesforce/b2c-tooling-sdk@0.5.4

## 0.0.7

### Patch Changes

- Updated dependencies [[`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4)]:
  - @salesforce/b2c-tooling-sdk@0.5.3

## 0.0.6

### Patch Changes

- Updated dependencies [[`a9db7da`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a9db7daf60a9071244c8e2e098dbd4f8fc58495d), [`dc7a25a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/dc7a25aedef047190250b696421e4a25c00cba15)]:
  - @salesforce/b2c-tooling-sdk@0.5.2

## 0.0.5

### Patch Changes

- Updated dependencies [[`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542)]:
  - @salesforce/b2c-tooling-sdk@0.5.1

## 0.0.4

### Patch Changes

- Updated dependencies [[`55c81c3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/55c81c3b3cdd8b85edfe5eb0070e28a96752ac83), [`87321c0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/87321c0051c171d35ca53760d4cffa3f9ebe406c), [`556f916`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/556f916f74c43373c0da125af1b53721b2c193ec), [`1485923`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1485923581c6f1cb01c48a2e560e369843952020)]:
  - @salesforce/b2c-tooling-sdk@0.5.0

## 0.0.3

### Patch Changes

- Updated dependencies [[`ca9dcf0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca9dcf0e9242dce408cf0c8e9cf1920d5ad40157)]:
  - @salesforce/b2c-tooling-sdk@0.4.1

## 0.0.2

### Patch Changes

- Updated dependencies [[`1a3117c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1a3117c42211e4db6629928d1f8a58395a0cadc7), [`7a3015f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7a3015f05183ad09c55e20dfe64ce7f3b8f1ca50), [`59fe546`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59fe54612e35530ccb000e0b16afba5c62eed429), [`44b67f0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/44b67f00ded0ab3a458f91f55b00b7106fb371be), [`91593f2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91593f28cb25b9a466c6ef0db1504b39f3590c7a), [`0d29262`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d292625f4238fef9fb1ca530ab370fdc6e190d8), [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81), [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81), [`8592727`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/859272776afa5a9d6b94f96b13de97a7af9814eb), [`908be47`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/908be47541f5d3d88b209f69ede488c9464606cb)]:
  - @salesforce/b2c-tooling-sdk@0.4.0

All notable changes to the "wei-first-extension" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release
