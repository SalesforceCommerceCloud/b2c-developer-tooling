# @salesforce/b2c-cli

## 1.17.4

### Patch Changes

- Updated dependencies [[`31324e1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31324e16fd0fb5402a3da1340f3575708c336661)]:
  - @salesforce/b2c-tooling-sdk@1.17.1

## 1.17.3

### Patch Changes

- Updated dependencies [[`2f79d71`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/2f79d711475add9707ee2474f6dfab416dd88ba6), [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88), [`6cfb9bd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6cfb9bd4b2a45ad838df86371f85e31c425caf88)]:
  - @salesforce/b2c-tooling-sdk@1.17.0

## 1.17.2

### Patch Changes

- [#519](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/519) [`3958d6e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3958d6eb568a1e91061f4203c986a124c480e12f) - Network errors during `b2c code deploy` and other WebDAV operations are now classified (timeout, connection reset, DNS, TLS, etc.) with actionable error messages including the operation, host, and remediation hints — no more bare "fetch failed". The server-side unzip step now has an explicit timeout, and if the connection drops it reports a clear error noting the server may still be extracting the archive (so it is not silently re-run, which could corrupt the code version) and leaves the uploaded archive in place for verification. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019), [`3958d6e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3958d6eb568a1e91061f4203c986a124c480e12f), [`11b84b1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11b84b19da380cd02f5049babd8cf2794d8ca019)]:
  - @salesforce/b2c-tooling-sdk@1.16.0

## 1.17.1

### Patch Changes

- [#509](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/509) [`3bc78c4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bc78c422d57b590b2435fd6ae0a31fffc4bd7e7) - Surface Managed Runtime deploy warnings (including the x86 environment deprecation notice) when pushing or deploying a bundle. The warning is informational and does not block the deploy. (Thanks [@sf-rahul-kumawat](https://github.com/sf-rahul-kumawat)!)

- Updated dependencies [[`3bc78c4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bc78c422d57b590b2435fd6ae0a31fffc4bd7e7)]:
  - @salesforce/b2c-tooling-sdk@1.15.1

## 1.17.0

### Minor Changes

- [#512](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/512) [`3bce44e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bce44e2e6d4cea3cf64e34eff1246d86e459b73) - Add a `--create-pr` flag to `cap install`. When a Commerce App includes Storefront Next content and a repository is connected to the storefront, this opens a pull request with the app's storefront changes instead of applying them directly. Off by default. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`3bce44e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3bce44e2e6d4cea3cf64e34eff1246d86e459b73), [`0d97ad1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d97ad1856d6a45d9349a3609c7e425d2b5e874a)]:
  - @salesforce/b2c-tooling-sdk@1.15.0

## 1.16.1

### Patch Changes

- [#510](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/510) [`1575070`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/15750709ca6b23838bb9fd954d6c09e8dbb67ed3) - Resolve all critical and high severity dependency advisories reported by `pnpm audit`. (Thanks [@clavery](https://github.com/clavery)!)

  Direct dependencies of the published packages were bumped in package.json so that consumers installing the SDK, CLI, or MCP server receive the patched versions: the SDK raises `js-yaml`, `minimatch`, `protobufjs`, and `undici`, and the MCP server raises `yaml` and `postcss`. The SDK also upgrades `applicationinsights` from 2.x to 3.x to pick up a non-vulnerable `@opentelemetry/core`; this is an internal telemetry change with no public API impact.

  Remaining transitive advisories with no direct-dependency lever are pinned to patched releases (within their existing major versions) via workspace overrides: fast-xml-parser, hono, @hono/node-server, ws, vite, rollup, form-data, http-proxy-middleware, path-to-regexp, serialize-javascript, lodash, underscore, flatted, fast-uri, tmp, express-rate-limit, brace-expansion, shell-quote, and @opentelemetry/core.

- Updated dependencies [[`1575070`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/15750709ca6b23838bb9fd954d6c09e8dbb67ed3)]:
  - @salesforce/b2c-tooling-sdk@1.14.1

## 1.16.0

### Minor Changes

- [#494](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/494) [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1) - Expand the curated CIP analytics report catalog with 16 new pre-built reports, with a focus on technical/developer analytics. New reports include SCAPI traffic & latency, SCAPI error rate by status class, SCAPI latency distribution (slow-tail/SLA percentage from the response-time histogram), SCAPI cache hit ratio, OCAPI usage by client, SFRA controller health scorecard, controller error-rate trend, and remote-include performance — plus revenue-by-channel, new-vs-returning buyer revenue, discount-depth breakdown, promotion ROI leaderboard, recommender effectiveness, zero-result searches, checkout funnel drop-off, and inventory stockout by location. (Thanks [@clavery](https://github.com/clavery)!)

  Also adds `b2c cip report list` to discover the catalog grouped by category (no credentials required), and report parameters now support enum (`--status-class 4xx|5xx`) and default values. Run `b2c cip report <name> --describe` to see each report's flags.

### Patch Changes

- Updated dependencies [[`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1), [`f630103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f630103e4c55fbdf68896db2f870851efe390ac1)]:
  - @salesforce/b2c-tooling-sdk@1.14.0

## 1.15.0

### Minor Changes

- [`19f059e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/19f059e7ba928d1070d7960920770f1256dfae73) - Add `storefront-next-figma` as a skill set for `b2c setup skills`. You can now install the Figma design-kit skills with `b2c setup skills storefront-next-figma` (or select it interactively) for any supported IDE. These skills require the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) to be configured in your AI tool. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`19f059e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/19f059e7ba928d1070d7960920770f1256dfae73)]:
  - @salesforce/b2c-tooling-sdk@1.13.0

## 1.14.1

### Patch Changes

- [`76f1059`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/76f10593646b94b0f3560614ef63bf987ca0e184) - Fix the npm publish failing during `prepack`. `oclif manifest` defaults to `--jit`, which downloads each JIT plugin and reads its `oclif.manifest.json`; the `@salesforce/storefront-next-dev` JIT plugin does not ship that file, so manifest generation aborted and the CLI failed to publish. The prepack now runs `oclif manifest --no-jit`. (Thanks [@clavery](https://github.com/clavery)!)

## 1.14.0

### Minor Changes

- [#452](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/452) [`9e44bee`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9e44bee20a6a1aa1439b530e37965e35594189a9) - Add `ecdn firewall` commands (`list`, `get`, `create`, `update`, `delete`, (Thanks [@charithaT07](https://github.com/charithaT07)!)
  `reorder`) for managing custom firewall rules on a CDN zone via the existing
  cdn-zones v1 APIs (`/firewall-custom/rules`). Supports partial updates,
  `--json` output (with table column flags on `list`), and routes destructive
  operations (`delete`, `reorder`) through the same safety guard the rest of
  the CLI uses.

- [#484](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/484) [`80e63fc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80e63fca888d9b83efd53c9c0054247fb2aa31b3) - `b2c job import` now supports `--split` for importing directories larger than the instance archive size limit. With `--split` (and optional `--max-size`, default `190mb`), the import is broken into several smaller archives: order-sensitive metadata/XML is imported first — kept together when it fits, otherwise split at data-unit boundaries in dependency order — followed by static assets packed by compressed size. A normal import that exceeds the limit now warns and recommends `--split`. (Thanks [@clavery](https://github.com/clavery)!)

  Example: `b2c job import ./big-site-data --split --max-size 150mb`

  The SDK adds a corresponding `siteArchiveImportSplit()` operation.

### Patch Changes

- Updated dependencies [[`b723939`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b72393951bb95b64f3291cd3cb76197e280a6a37), [`21bbed0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/21bbed0ea1b42e8750d4259669370f8bcf562c10), [`de8d40b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/de8d40b54dc923c5805fac2ef587db8b86349a6b), [`80e63fc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80e63fca888d9b83efd53c9c0054247fb2aa31b3), [`c8e0b60`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c8e0b602e1a8da88f7e6620e5d5614f3a55689bd)]:
  - @salesforce/b2c-tooling-sdk@1.12.0

## 1.13.0

### Minor Changes

- [#455](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/455) [`420400a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/420400a28b17549717956f8c47adc2043fe3bfea) - Add `b2c sfnext` topic via JIT plugin (`@salesforce/storefront-next-dev`). On first use the plugin auto-installs at the latest published version; inside a scaffolded Storefront Next project the project-pinned version is preferred automatically. Bootstrap a new project with `npx @salesforce/b2c-cli sfnext create-storefront`. Update later with `b2c plugins update`. (Thanks [@clavery](https://github.com/clavery)!)

## 1.12.1

### Patch Changes

- Updated dependencies [[`b8dcf74`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b8dcf741c253fee0df4219400bfa10a79c704e98)]:
  - @salesforce/b2c-tooling-sdk@1.11.1

## 1.12.0

### Minor Changes

- [#451](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/451) [`665b2a1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/665b2a1144aa4c66ab7bf4f98294662bd55877a0) - Add Script API IntelliSense for cartridge JavaScript: `dw/*`, cartridge-style requires, and SFCC globals (`session`, `request`, `response`, `customer`, etc.) are typed automatically. The VS Code extension wires this up out of the box; for other editors, run `b2c setup ide tsserver-plugin` (LSP plugin) or `b2c setup ide vscode-types` (jsconfig). See the IDE Integration guide for details. (Thanks [@clavery](https://github.com/clavery)!)

## 1.11.0

### Minor Changes

- [#428](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/428) [`db7b330`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db7b330cf60debf05d681b9e1dbb4e025d8eec02) - `b2c job import` now accepts an optional list of paths or globs after the directory `TARGET`, allowing you to import a subset of a site export. Paths are resolved literally first (so shell-expanded globs work) and fall back to root-relative or internal glob expansion when the literal path doesn't exist. The archive preserves each path's layout under `TARGET`. (Thanks [@clavery](https://github.com/clavery)!)

  Example: `b2c job import ./my-site-data sites/RefArch libraries/mylib`

  The SDK's `siteArchiveImport` operation gains a corresponding `paths` option for directory targets.

### Patch Changes

- Updated dependencies [[`5d62ac2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5d62ac21a505c3ae4c58507fe0ffe65a5ee89087), [`db7b330`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db7b330cf60debf05d681b9e1dbb4e025d8eec02), [`5e43132`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5e43132ab1b10da33517a697b32e22737d2f9bb4)]:
  - @salesforce/b2c-tooling-sdk@1.11.0

## 1.10.0

### Minor Changes

- [#422](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/422) [`e4b8238`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b82385bfddb93a17f874f34315e4ab73e7c84a) - The `libraries` config field now accepts `{id, siteLibrary?}` objects in addition to bare strings (mixed forms allowed in the same array). This lets you mark site-private libraries in `dw.json` or `package.json` so `b2c content list` / `content export` can default `--site-library` based on which library you target, and the VS Code Content Libraries tree auto-loads every configured library on activation. To upgrade, optionally replace `"libraries": ["RefArchSharedLibrary"]` with `"libraries": ["RefArchSharedLibrary", {"id": "SiteGenesis", "siteLibrary": true}]`. The existing string-only form continues to work unchanged. Also adds `libraries`, `assetQuery`, and `realm` to the documented `package.json` allowed fields list (already supported in code). (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [`7b3524f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7b3524f1f545b290861784396897c537cb631df3) - `b2c slas:client:get` now displays redirect URIs and callback URIs as lists (one per line) instead of the raw pipe-delimited strings returned by the SLAS API, matching the formatting used for scopes. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`e4b8238`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b82385bfddb93a17f874f34315e4ab73e7c84a)]:
  - @salesforce/b2c-tooling-sdk@1.10.0

## 1.9.0

### Minor Changes

- [#395](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/395) [`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe) - Add `b2c debug cli` command for interactive terminal-based script debugging. Includes a REPL with commands for breakpoints, stepping, variable inspection, and expression evaluation. Use `--rpc` for JSONL-over-stdio mode suitable for headless scripts and agents. (Thanks [@clavery](https://github.com/clavery)!)

- [#399](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/399) [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c) - Support `assetQuery` as a first-class config field. Set it in `dw.json` (per-instance), in `package.json` under `b2c`, or via `SFCC_ASSET_QUERY` to control which JSON dot-paths are extracted as assets during content library parsing. The VS Code Content Libraries tree and `b2c content export` both honor it automatically; the `--asset-query` flag still wins when provided, and the fallback remains `["image.path"]`. (Thanks [@clavery](https://github.com/clavery)!)

- [#408](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/408) [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29) - Added `b2c bm users` command topic for managing instance-level Business Manager users via the OCAPI Data API: `list`, `get`, `search`, `whoami`, `update`, and `delete`. Also added `b2c bm users access-keys` (`get`, `create`, `set`, `delete`) for provisioning and rotating WebDAV/OCAPI/SCAPI access keys for externally-managed (AM/SSO) users. The SDK now exposes a matching `@salesforce/b2c-tooling-sdk/operations/bm-users` module. (Thanks [@clavery](https://github.com/clavery)!)

- [#408](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/408) [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29) - Added `--columns` and `--extended` flags to all list and search commands for consistent column selection across the CLI. Roughly 30 commands that previously had no column-customization support — including `bm roles list`, `webdav ls`, `cap list`, `code list`, `content list`, `docs search`, `job search`, `logs list`, `sites list`, `slas client list`, all `mrt` list commands, plus several `setup` and `scaffold` commands — now accept `-c id,name,...` to pick columns and `-x` to include extended fields (e.g. `webdav ls --extended` exposes the previously-hidden `modified` and `contentType` columns). (Thanks [@clavery](https://github.com/clavery)!)

  The SDK now exposes shared `columnFlagsFor()` / `selectColumns()` helpers (replacing 22 duplicated implementations) and a `printFieldsBlock()` helper for rendering "label / value" detail blocks.

- [#405](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/405) [`b1600fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b1600fa014f9bd23c93488155b37ac2cc5c91fd2) - Refresh the MRT admin API schema and add new commands: (Thanks [@clavery](https://github.com/clavery)!)
  - `b2c mrt env clone` — clone an environment from an existing source, optionally copying redirects, environment variables, and B2C target info
  - `b2c mrt bundle delete` — delete one or more bundles (uses bulk-delete when more than one ID is supplied)
  - `b2c mrt org member list|add|get|update|remove` — manage organization-level members
  - `b2c mrt org cert list|get|create|delete|restart-validation` — manage custom domain certificates referenced by environments

- [#328](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/328) [`31e136b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31e136b2cd3affd6ecfb53c949aa4374c82561ad) - ODS CLI: **`b2c sandbox create`** adds **`--emails`** for notification addresses; **`b2c sandbox update`** adds **`--start-scheduler`**, **`--stop-scheduler`**, **`--clear-start-scheduler`**, and **`--clear-stop-scheduler`**; **`b2c realm update`** adds **`--emails`**, **`--start-scheduler`**, **`--stop-scheduler`**, **`--clear-start-scheduler`**, and **`--clear-stop-scheduler`**. (Thanks [@charithaT07](https://github.com/charithaT07)!)

  Sandbox API: **`b2c sandbox operations list`** and **`b2c sandbox operations get`** (inspect lifecycle operations); **`b2c sandbox alias get`** (get one alias by ID, same endpoint as **`alias list --alias-id`**).

  User guide updated for scheduling flags, sandbox operations, and **`b2c sandbox alias get`**.

### Patch Changes

- [#407](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/407) [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d) - CLI cleanup and correctness fixes: (Thanks [@clavery](https://github.com/clavery)!)
  - `b2c cip query`, `cip describe`, `cip tables`, and `cip report *` now stream output through oclif's `ux.stdout` instead of writing directly to `process.stdout`. This restores the `--json` flag and makes output capturable by tests and CI.
  - Long-running commands (`code:watch`, `logs:tail`, `mrt:tail-logs`) now deregister their SIGINT/SIGTERM handlers when finished, so re-invocations no longer stack handlers on the same process.
  - Hook and signal-handler errors that were previously swallowed (`job:run` afterOperation hooks, `logs:tail` stop, `setup:ide:prophet` console fallbacks) now log at debug instead of disappearing.
  - AM list commands (`am clients|roles|users list`) share a single `amPageSizeFlag` definition.
  - Removed deprecated `LocalSourceResult` re-export.

- [`3cefda3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3cefda324bce7a22183245162303df236f70be7d) - `b2c debug --help` now deep-links to the Debug command reference page on the docs site. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe), [`6be308a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6be308a4f8f24dd433bfa557a98038c7392d149c), [`f1a4ac0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f1a4ac0f9ccd8034e6e26ab1598f52516ecf471d), [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29), [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29), [`51aed02`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/51aed020426f1ce3869b3d260d9af796db8a19e7), [`b53d75e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b53d75e196a6808b4fc9cac249c4495da2471846), [`b1600fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b1600fa014f9bd23c93488155b37ac2cc5c91fd2)]:
  - @salesforce/b2c-tooling-sdk@1.9.0

## 1.8.1

### Patch Changes

- Updated dependencies [[`4f30de7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4f30de783a049e33a121ec80a2cbd1c455f5d4e8)]:
  - @salesforce/b2c-tooling-sdk@1.8.0

## 1.8.0

### Minor Changes

- [#377](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/377) [`cb66b56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb66b563d5d5ca6a0f584d9007629ba392cb3424) - Add `storefront-next` skill set to `b2c setup skills`. Install Storefront Next development skills with `b2c setup skills storefront-next`, or via the plugin marketplace with `claude plugin install storefront-next`. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`cb66b56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb66b563d5d5ca6a0f584d9007629ba392cb3424)]:
  - @salesforce/b2c-tooling-sdk@1.7.0

## 1.7.1

### Patch Changes

- Updated dependencies [[`485ef63`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/485ef63b901d91f7b08c56366d1f1756a03f60dc)]:
  - @salesforce/b2c-tooling-sdk@1.6.1

## 1.7.0

### Minor Changes

- [#373](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/373) [`1dc1ee5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1dc1ee55642f0d478d260867d538f02e32057d7e) - Add support for Commerce Apps (CAP) development skills via `b2c setup skills cap-dev`. Introduces a skill source registry to support external skill repositories alongside existing release-artifact sources. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`1dc1ee5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1dc1ee55642f0d478d260867d538f02e32057d7e)]:
  - @salesforce/b2c-tooling-sdk@1.6.0

## 1.6.0

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

### Patch Changes

- Updated dependencies [[`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a), [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a)]:
  - @salesforce/b2c-tooling-sdk@1.5.0

## 1.5.0

### Minor Changes

- [#366](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/366) [`59dd584`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59dd584479cc024fa6eed365c7c91f64dc4110be) - Add `b2c code download` command to download cartridge code from a B2C Commerce instance, with support for cartridge filtering, mirror mode, and progress reporting (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#355](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/355) [`3dedc05`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3dedc05ade10f6d748b4168daef0e4c2fdaf1501) - `b2c setup skills` now prompts to overwrite already-installed skills in interactive mode instead of silently skipping them with a "use --update to overwrite" message. The existing `--update` and `--force` flags still work non-interactively. (Thanks [@clavery](https://github.com/clavery)!)

- [#355](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/355) [`3dedc05`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3dedc05ade10f6d748b4168daef0e4c2fdaf1501) - Refine b2c CLI skills (`scapi-schemas`, `scapi-custom`, `slas`, `ecdn`, `cip`, `users-roles`) to show config-first idiomatic usage. Examples now assume values like `tenantId`, `shortCode`, and `clientId` are resolved from `dw.json` / `SFCC_*` env vars, with flags shown only as overrides. This prevents coding agents from prompting users for values that are already configured. (Thanks [@clavery](https://github.com/clavery)!)

- [#365](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/365) [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859) - Broaden skills-plugin install support and improve the installation docs. (Thanks [@clavery](https://github.com/clavery)!)
  - Add a Codex plugin marketplace so the three plugins (`b2c-cli`, `b2c`, `b2c-dx-mcp`) can be installed directly from Codex CLI's plugin directory.
  - Add a new `b2c-onboarding` skill (in the `b2c` plugin) that walks new developers through CLI verify, `dw.json` setup, sandbox connect, and first cartridge deploy, then hands off to the topic-specific skill for the user's goal.
  - Add per-plugin READMEs with install instructions for each supported client.
  - Document Copilot CLI + VS Code Copilot install paths and the Codex marketplace install path.
  - Remove the `b2c-experimental` plugin from the public marketplace.

- Updated dependencies [[`59dd584`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59dd584479cc024fa6eed365c7c91f64dc4110be), [`3dedc05`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3dedc05ade10f6d748b4168daef0e4c2fdaf1501), [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859)]:
  - @salesforce/b2c-tooling-sdk@1.4.0

## 1.4.0

### Minor Changes

- [#308](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/308) [`d5c9125`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d5c91252922145309cc973441dc65962d46f5fa9) - Add `b2c mrt env var push` command. Reads a local `.env` file, computes a diff against the current remote MRT environment variables, and pushes new or changed variables in a single batch request (with per-variable fallback). Supports `--file`, `--exclude-prefix`, and `--yes` flags. (Thanks [@vmarta](https://github.com/vmarta)!)

### Patch Changes

- [`52d7a6d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/52d7a6dd12e3ba53ae3cf729ddf71a7f225f7b6e) - Fix inaccurate flags and commands in CLI skill documentation for job, ecdn, am, and users-roles skills (Thanks [@clavery](https://github.com/clavery)!)

- [`1b0b4ce`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b0b4ce2af63862438c0dae74df2efb35262139a) - Add `--wait` / `--no-wait` flag to `b2c job import` command. Import waits for completion by default (preserving existing behavior); use `--no-wait` to return immediately after the job starts. Also adds `--poll-interval` flag for controlling poll frequency. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`1b0b4ce`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b0b4ce2af63862438c0dae74df2efb35262139a)]:
  - @salesforce/b2c-tooling-sdk@1.3.2

## 1.3.2

### Patch Changes

- Updated dependencies [[`30de66b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/30de66bf59c250c5382a7427ba475049c68566cd)]:
  - @salesforce/b2c-tooling-sdk@1.3.1

## 1.3.1

### Patch Changes

- [`7333370`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7333370a750978a27d552b144914d8adc46a9097) - Improved skill trigger descriptions across all 37 B2C skills for better Claude Code skill invocation. Expanded eval sets from 5 to 10 queries per skill with realistic, organic test prompts. (Thanks [@clavery](https://github.com/clavery)!)

## 1.3.0

### Minor Changes

- [#337](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/337) [`c04bbcb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c04bbcbb179d733bedc42f4d0eee2dff2256789e) - Add Agentforce Vibes (`--ide agentforce-vibes`) as a supported IDE target for `setup skills`, installing to `.a4drules/skills/`. Add `--directory` flag for custom installation paths. Change `manual` default directory to `.agents/skills/`. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`c04bbcb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c04bbcbb179d733bedc42f4d0eee2dff2256789e)]:
  - @salesforce/b2c-tooling-sdk@1.3.0

## 1.2.0

### Minor Changes

- [`464b9db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/464b9dbc3cf498e585d81ba5eb7ed0f17ff60a46) - Add B2C Commerce script debugger with SDAPI 2.0 DAP adapter (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`464b9db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/464b9dbc3cf498e585d81ba5eb7ed0f17ff60a46), [`e6c6226`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e6c6226c256b8d181917cc8c66fa4d7bf992e106)]:
  - @salesforce/b2c-tooling-sdk@1.2.0

## 1.1.0

### Minor Changes

- [#315](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/315) [`6771d7a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6771d7a8c2db7db259bf00d8d4d0d6393aa14fe6) - Add ODS sandbox management enhancements, including sandbox storage and settings commands, multi-realm usage reporting, and dedicated realm configuration support. (Thanks [@charithaT07](https://github.com/charithaT07)!)

  Keep sandbox realm workflows under `b2c sandbox realm` / `b2c ods realm` by removing top-level `b2c realm` aliases.

- [#318](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/318) [`6880a84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6880a846aacd029a1eb510023aa76f4b844ec26e) - Added per-instance safety configuration with rule-based actions (allow/block/confirm) and interactive confirmation mode. Safety can now be configured in `dw.json` with granular rules for HTTP paths, job IDs, and CLI commands. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`6880a84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6880a846aacd029a1eb510023aa76f4b844ec26e)]:
  - @salesforce/b2c-tooling-sdk@1.1.0

## 1.0.1

### Patch Changes

- [`e597e61`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e597e6131b9965e88ef75954a935695fa7f6d70f) - Add `--activate` flag to `code deploy` for activating a code version after deploy without the toggle behavior of `--reload`. Both `--activate` and `--reload` now error on failure instead of silently continuing. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`e597e61`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e597e6131b9965e88ef75954a935695fa7f6d70f)]:
  - @salesforce/b2c-tooling-sdk@1.0.1

## 1.0.0

### Major Changes

- [#303](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/303) [`c24e920`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c24e9204a5f253b773c43c0b30c064c7f4dec34a) - Release v1.0 — B2C CLI is now Generally Available. (Thanks [@clavery](https://github.com/clavery)!)

### Minor Changes

- [#305](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/305) [`7ad490a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ad490a508b7f993292bd8a326f7a6c49c92d70c) - Add `--wait` flag to `mrt bundle deploy` to poll until deployment completes, and align all SDK wait functions (`waitForJob`, `waitForEnv`) to a consistent pattern with structured `onPoll` callbacks, seconds-based options, and injectable `sleep` for testing. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`7ad490a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ad490a508b7f993292bd8a326f7a6c49c92d70c), [`c24e920`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c24e9204a5f253b773c43c0b30c064c7f4dec34a)]:
  - @salesforce/b2c-tooling-sdk@1.0.0

## 0.11.0

### Minor Changes

- [#293](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/293) [`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e) - Add Business Manager role management commands (`bm roles`) for instance-level access role CRUD, user assignment, and permissions via OCAPI Data API (Thanks [@clavery](https://github.com/clavery)!)

- [#286](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/286) [`5a6ab56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5a6ab56a2842065b7f1815539bc5a70911826e9c) - Add `mrt save-credentials` command to save MRT API credentials to the ~/.mobify file (Thanks [@clavery](https://github.com/clavery)!)

- [#295](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/295) [`b7f78ca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b7f78ca6d2468e274b911c4fd1fc7c03a9e6b4fb) - Add site cartridge path management commands (`sites cartridges list|add|remove|set`) with `--bm` flag for Business Manager support and automatic fallback to site archive import when OCAPI permissions are unavailable (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#292](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/292) [`c10ddad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c10ddadf7277c93196c956b73af694f4f065a149) - Use a host-specific default public client ID for account-pod5.demandware.net Account Manager (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e), [`cb74ce4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cb74ce4c78a91cc49556f464be5124981a24c3ea), [`c10ddad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c10ddadf7277c93196c956b73af694f4f065a149), [`b7f78ca`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b7f78ca6d2468e274b911c4fd1fc7c03a9e6b4fb)]:
  - @salesforce/b2c-tooling-sdk@0.13.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`f7229b4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f7229b4372bb23d8e107db75f722575c33f4a007)]:
  - @salesforce/b2c-tooling-sdk@0.12.0

## 0.10.0

### Minor Changes

- [#278](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/278) [`8c31081`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c31081b47e57e6a21e62425e6f19da036fc3e34) - Add `content validate` command to validate Page Designer metadefinition JSON files against bundled schemas. Supports auto-detection of schema types from file paths and content, or explicit `--type` flag. Includes glob pattern support for validating multiple files. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`8c31081`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c31081b47e57e6a21e62425e6f19da036fc3e34), [`e4b5094`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b5094d9c1c2a60e1214bc236ce7ed84c5d158b)]:
  - @salesforce/b2c-tooling-sdk@0.11.0

## 0.9.0

### Minor Changes

- [#167](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/167) [`caa568e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/caa568e9de3e8c9d3f2e7b17e5f96c1a0ae3ca73) - Introduces stateful authentication: `auth login` (browser/implicit), `auth logout`, `auth client` (client_credentials/password), `auth client renew`, and `auth client token`. Sessions are stored as a JSON file in the CLI data directory; when a valid session exists, all OAuth commands use it automatically without requiring credentials on every invocation. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

  **Note:** Sessions are not shared with `sfcc-ci`. Re-authenticate with `b2c auth login` or `b2c auth client` after upgrading. Existing stateless auth (env vars, `dw.json`) is unaffected.

### Patch Changes

- [`b30e427`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b30e427f25807840dbcceef6c0005e2d9fd1be53) - Add `--path` flag to `b2c docs schema` to print the filesystem path to a schema file instead of its content, enabling use with tools like `xmllint` for XML validation. (Thanks [@clavery](https://github.com/clavery)!)

- [#272](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/272) [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc) - Added sfcc-ci migration guide with command mappings and CI/CD migration instructions. Added backward-compatible sfcc-ci command aliases (`client:auth`, `code:deploy`, `code:list`, `code:activate`, `job:run`, etc.) and environment variable aliases (`SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET`, `SFCC_LOGIN_URL`). (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`b30e427`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b30e427f25807840dbcceef6c0005e2d9fd1be53), [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc), [`caa568e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/caa568e9de3e8c9d3f2e7b17e5f96c1a0ae3ca73)]:
  - @salesforce/b2c-tooling-sdk@0.10.0

## 0.8.0

### Minor Changes

- [#268](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/268) [`0c4e288`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0c4e288ff2609a13983ef883f5675e69ac7cc452) - Add `job log` command to retrieve and display job execution logs. Supports fetching logs for a specific execution or automatically finding the most recent (or most recent failed) execution with a log file. (Thanks [@clavery](https://github.com/clavery)!)

## 0.7.4

### Patch Changes

- [`4cf7249`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4cf72497f5e01d627de7aae80290d072f4c914f6) - Add `cartridges` config option to specify which cartridges to deploy/watch. Supports comma or colon-separated strings, or arrays in dw.json. Also accepts `cartridgesPath` as an alias. The `-c` flag still takes precedence when provided. (Thanks [@clavery](https://github.com/clavery)!)

- [#264](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/264) [`9996eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9996eba2a8fe53a27bf52fb208eb722d618cd282) - Fix multiple issues with the hook scaffold (#247): (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`16bd9d6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/16bd9d6a1c658d6ba3de04fa3acf89295e1e5e06), [`4cf7249`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4cf72497f5e01d627de7aae80290d072f4c914f6), [`9996eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9996eba2a8fe53a27bf52fb208eb722d618cd282), [`d50bf6b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d50bf6b91dcd40314f10c8c97a28805039161213)]:
  - @salesforce/b2c-tooling-sdk@0.9.0

## 0.7.3

### Patch Changes

- Updated dependencies [[`760a6cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/760a6cbe144ffcd7c72b32b05df861626d3d5a2c)]:
  - @salesforce/b2c-tooling-sdk@0.8.3

## 0.7.2

### Patch Changes

- [`d4423bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d4423bb218af3991396286b4900c3b051666e06b) - Add MRT environment variable support to EnvSource (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN` and their `SFCC_MRT_*` variants). The `setup inspect` command now shows values from SFCC\_\* environment variables as a config source. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`d4423bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d4423bb218af3991396286b4900c3b051666e06b), [`69a98dc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/69a98dc21f3a326f551929fcd530741b9f0ca126)]:
  - @salesforce/b2c-tooling-sdk@0.8.2

## 0.7.1

### Patch Changes

- [#249](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/249) [`e790dfa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e790dfa8d5375fde7936ae4a10b2f3fd722ec087) - Add `--wait` flag to `sandbox clone create` command to poll until the clone completes, matching the behavior of `sandbox create --wait`. Also fixes the status check hint to display the correct command name instead of a raw template string. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`e790dfa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e790dfa8d5375fde7936ae4a10b2f3fd722ec087)]:
  - @salesforce/b2c-tooling-sdk@0.8.1

## 0.7.0

### Minor Changes

- [`d7b2eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d7b2ebab077690cd5eb63dd6daff3c8935b22aec) - Added `sandbox update` command to update sandbox TTL, auto-scheduling, tags, and notification emails via the PATCH API (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`b26ebeb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b26ebebd2b5dbff19689bdfadd5b9864597fbfb1)]:
  - @salesforce/b2c-tooling-sdk@0.8.0

## 0.6.0

### Minor Changes

- [#232](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/232) [`732d4ad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/732d4ad1e52dd1e0f0676cee87305464ccf4ca9e) - Add `slas token` command to retrieve SLAS shopper access tokens for API testing. Supports public (PKCE) and private (client_credentials) client flows, guest and registered customer authentication, and auto-discovery of public SLAS clients. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- Updated dependencies [[`3758114`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3758114c328fcfffc54fb32a935df23503fc0ba2), [`1b9b477`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b9b4773110a5d97bfe81d37a093158088d94cee), [`732d4ad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/732d4ad1e52dd1e0f0676cee87305464ccf4ca9e)]:
  - @salesforce/b2c-tooling-sdk@0.7.0

## 0.5.6

### Patch Changes

- [`d6b8c57`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d6b8c575b62ada6073d89fe03beedc18004e3073) - Fix GitHub Actions for external repository usage by replacing relative `./actions/setup` and `./actions/run` references with fully qualified `SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1` and `SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1` in all composite actions. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`8faf831`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8faf831b4e4827e252e48242b2a2b2155157f3c2)]:
  - @salesforce/b2c-tooling-sdk@0.6.0

## 0.5.5

### Patch Changes

- [`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc) - MRT environment variables now use non-prefixed names (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN`) as primary. The `SFCC_`-prefixed versions continue to work as fallbacks. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc)]:
  - @salesforce/b2c-tooling-sdk@0.5.5

## 0.5.4

### Patch Changes

- Updated dependencies [[`f9ebb56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9ebb562d0c894aed9f0498b78ca01fce70db352)]:
  - @salesforce/b2c-tooling-sdk@0.5.4

## 0.5.3

### Patch Changes

- [#206](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/206) [`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4) - Add `globalConfigSourceRegistry` for automatic plugin config source inclusion in `resolveConfig()`, matching the existing middleware registry pattern. Plugin config sources are now picked up automatically by all SDK consumers without manual plumbing. Also improves test isolation by preventing locally installed plugins from affecting test runs. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4)]:
  - @salesforce/b2c-tooling-sdk@0.5.3

## 0.5.2

### Patch Changes

- Updated dependencies [[`a9db7da`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a9db7daf60a9071244c8e2e098dbd4f8fc58495d), [`dc7a25a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/dc7a25aedef047190250b696421e4a25c00cba15)]:
  - @salesforce/b2c-tooling-sdk@0.5.2

## 0.5.1

### Patch Changes

- [#199](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/199) [`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542) - Rename `--working-directory` flag to `--project-directory`. The old flag name `--working-directory` is still accepted as an alias. Primary env var is now `SFCC_PROJECT_DIRECTORY`; `SFCC_WORKING_DIRECTORY` continues to work as a deprecated fallback. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542)]:
  - @salesforce/b2c-tooling-sdk@0.5.1

## 0.5.0

### Minor Changes

- [#155](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/155) [`55c81c3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/55c81c3b3cdd8b85edfe5eb0070e28a96752ac83) - Add a new `cip` command topic for Commerce Intelligence platform (CCAC - Commerce Cloud Analytics) with `cip query` for raw SQL and curated `cip report <report-name>` subcommands for analytics workflows, including CIP host override support and tenant-based CIP instance targeting. (Thanks [@clavery](https://github.com/clavery)!)

- [#163](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/163) [`87321c0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/87321c0051c171d35ca53760d4cffa3f9ebe406c) - Add GitHub Actions for CI/CD automation: setup, run, code-deploy, mrt-deploy, job-run, and webdav-upload actions with starter workflow templates (Thanks [@clavery](https://github.com/clavery)!)

- [#151](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/151) [`f12984e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f12984e60fe49f366b946aae155f04bd5e212617) - Add `b2c setup ide prophet` to generate a Prophet-compatible `dw.js` script from resolved CLI configuration (including plugin-resolved values), plus new IDE integration docs and setup command reference. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#181](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/181) [`556f916`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/556f916f74c43373c0da125af1b53721b2c193ec) - Fix `--no-download` flag on `job export` to actually skip downloading the archive from the instance (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`55c81c3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/55c81c3b3cdd8b85edfe5eb0070e28a96752ac83), [`87321c0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/87321c0051c171d35ca53760d4cffa3f9ebe406c), [`556f916`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/556f916f74c43373c0da125af1b53721b2c193ec), [`1485923`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1485923581c6f1cb01c48a2e560e369843952020)]:
  - @salesforce/b2c-tooling-sdk@0.5.0

## 0.4.1

### Patch Changes

- [#143](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/143) [`ca9dcf0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca9dcf0e9242dce408cf0c8e9cf1920d5ad40157) - Fix AM role ID mapping between API internal/external formats and improve user display output. Role grant/revoke now correctly handle mixed formats (role IDs in roles array, enum names in roleTenantFilter). User display shows role descriptions, resolves org names, and detects auth errors with actionable --user-auth suggestions. Commands accepting org IDs now also accept friendly org names. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`ca9dcf0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca9dcf0e9242dce408cf0c8e9cf1920d5ad40157)]:
  - @salesforce/b2c-tooling-sdk@0.4.1

## 0.4.0

### Minor Changes

- [#117](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/117) [`59fe546`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59fe54612e35530ccb000e0b16afba5c62eed429) - Add `content export` and `content list` commands for exporting Page Designer pages with components and static assets from content libraries. Supports filtering by page ID (exact or regex), folder classification, offline mode, and dry-run preview. (Thanks [@clavery](https://github.com/clavery)!)

- [`44b67f0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/44b67f00ded0ab3a458f91f55b00b7106fb371be) - Embed a default public client ID for implicit OAuth flows. Account Manager, Sandbox, and SLAS commands now work without requiring a pre-configured client ID — the CLI will automatically use a built-in public client for browser-based authentication. (Thanks [@clavery](https://github.com/clavery)!)

- [#98](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/98) [`91593f2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91593f28cb25b9a466c6ef0db1504b39f3590c7a) - Add `setup instance` commands for managing B2C Commerce instance configurations (create, list, remove, set-active). (Thanks [@clavery](https://github.com/clavery)!)

- [#125](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/125) [`0d29262`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d292625f4238fef9fb1ca530ab370fdc6e190d8) - Add `mrt tail-logs` command to stream real-time application logs from Managed Runtime environments. Supports level filtering, regex search with match highlighting, and JSON output. (Thanks [@clavery](https://github.com/clavery)!)

- [#113](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/113) [`0a6b8c8`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0a6b8c8c80fd114bca034e26907a0f815bfcaf43) - Rename `ods` topic to `sandbox` (with `ods` alias for backward compatibility). Add `--permissions-client-id`, `--ocapi-settings`, `--webdav-settings`, `--start-scheduler`, and `--stop-scheduler` flags to `sandbox create`. (Thanks [@clavery](https://github.com/clavery)!)

- [#102](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/102) [`8592727`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/859272776afa5a9d6b94f96b13de97a7af9814eb) - Add scaffolding framework for generating B2C Commerce components from templates. Includes 7 built-in scaffolds (cartridge, controller, hook, service, custom-api, job-step, page-designer-component) and support for custom project/user scaffolds. SDK provides programmatic API for IDE integrations and MCP servers. (Thanks [@clavery](https://github.com/clavery)!)

- [#120](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/120) [`908be47`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/908be47541f5d3d88b209f69ede488c9464606cb) - Add `--user-auth` flag for simplified browser-based authentication. AM commands now use standard auth method order; enhanced error messages provide role-specific guidance for Account Manager operations. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [`e116ce4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e116ce4ac1f7de705207c6c91eee0979be0ace65) - Add update notifications that warn users when a newer version of the CLI is available (Thanks [@clavery](https://github.com/clavery)!)

- [#63](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/63) [`1a3117c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1a3117c42211e4db6629928d1f8a58395a0cadc7) - Account Manager (AM) topic with `users`, `roles`, and `orgs` subtopics. Use `b2c am users`, `b2c am roles`, and `b2c am orgs` for user, role, and organization management. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

- [`f879d99`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f879d999c6290fc4cf8d69bd072ab0378ce2e781) - Rename `setup config` to `setup inspect` to better reflect its read-only purpose. `setup config` continues to work as an alias. (Thanks [@clavery](https://github.com/clavery)!)

- [#138](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/138) [`631ec23`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/631ec2361cba2ac9a44ea80f9eca214719e348dc) - `slas client list` now returns an empty list instead of erroring when the SLAS tenant doesn't exist yet. (Thanks [@clavery](https://github.com/clavery)!)

- Updated dependencies [[`1a3117c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1a3117c42211e4db6629928d1f8a58395a0cadc7), [`7a3015f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7a3015f05183ad09c55e20dfe64ce7f3b8f1ca50), [`59fe546`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59fe54612e35530ccb000e0b16afba5c62eed429), [`44b67f0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/44b67f00ded0ab3a458f91f55b00b7106fb371be), [`91593f2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91593f28cb25b9a466c6ef0db1504b39f3590c7a), [`0d29262`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d292625f4238fef9fb1ca530ab370fdc6e190d8), [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81), [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81), [`8592727`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/859272776afa5a9d6b94f96b13de97a7af9814eb), [`908be47`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/908be47541f5d3d88b209f69ede488c9464606cb)]:
  - @salesforce/b2c-tooling-sdk@0.4.0

## 0.3.0

### Minor Changes

- [`d772003`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d772003c7614f4e5ec2fe95fe7ed7f7ec6559a9c) Thanks [@clavery](https://github.com/clavery)! - consistent command doc structure; better auth page; online links in examples for all topics/cmds

- [#83](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/83) [`ddee52e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ddee52e2c61991dbcc4d3aeed00ee802530a0e7c) Thanks [@clavery](https://github.com/clavery)! - Add support for realm-instance format in ODS commands. You can now use `zzzv-123` or `zzzv_123` instead of full UUIDs for `ods get`, `ods start`, `ods stop`, `ods restart`, and `ods delete` commands.

- [#77](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/77) [`6859880`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6859880195d2da4cd6363451c79224878917abb7) Thanks [@clavery](https://github.com/clavery)! - Add log tailing, listing, and retrieval commands for viewing B2C Commerce instance logs. See `b2c logs` topic.

- [#94](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/94) [`c34103b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c34103b594dee29198de3ae6fe0077ff12cd3f93) Thanks [@clavery](https://github.com/clavery)! - Add two-factor client certificate (mTLS) support for WebDAV operations

### Patch Changes

- [`d772003`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d772003c7614f4e5ec2fe95fe7ed7f7ec6559a9c) Thanks [@clavery](https://github.com/clavery)! - bugfix code deploy to not require oauth unless needed

- [`d772003`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d772003c7614f4e5ec2fe95fe7ed7f7ec6559a9c) Thanks [@clavery](https://github.com/clavery)! - mrt bundle commands now relay warnings from the bundle such as out of date node versions

- Updated dependencies [[`ddee52e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ddee52e2c61991dbcc4d3aeed00ee802530a0e7c), [`6859880`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6859880195d2da4cd6363451c79224878917abb7), [`6b89ed6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6b89ed622a1f59e91cfd6dad643a5e834d8d7470), [`c34103b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c34103b594dee29198de3ae6fe0077ff12cd3f93)]:
  - @salesforce/b2c-tooling-sdk@0.3.0

## 0.2.1

### Patch Changes

- [`4e90f16`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4e90f161f8456ff89c4e99522ae83ae6a7352a44) Thanks [@clavery](https://github.com/clavery)! - dw.json format bug fix

- Updated dependencies [[`4e90f16`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4e90f161f8456ff89c4e99522ae83ae6a7352a44)]:
  - @salesforce/b2c-tooling-sdk@0.2.1

## 0.2.0

### Minor Changes

- [#62](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/62) [`269de20`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/269de20e7f90fc684818bab805d612f7a77f5838) Thanks [@clavery](https://github.com/clavery)! - Add `setup config` command to display resolved configuration with source tracking.

  Shows all configuration values organized by category (Instance, Authentication, SCAPI, MRT) and indicates which source file or environment variable provided each value. Sensitive values are masked by default; use `--unmask` to reveal them.

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Reorganizes MRT commands by scope: project-level commands under `mrt project`, environment-level under `mrt env`, and deployment commands under `mrt bundle`. The `mrt bundle download` command now downloads files by default instead of just printing the URL.

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Adds complete MRT CLI coverage organized by scope: `mrt project` (CRUD, members, notifications), `mrt env` (CRUD, variables, redirects, access-control, cache invalidation, B2C connections), `mrt bundle` (deploy, list, history, download), `mrt org` (list, B2C instances), and `mrt user` (profile, API key, email preferences).

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Replaces `mrt push` with `mrt bundle deploy`. The new command supports both pushing local builds and deploying existing bundles by ID.

- [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26) Thanks [@clavery](https://github.com/clavery)! - Add `b2c setup skills` command for installing agent skills to AI-powered IDEs (Claude Code, Cursor, Windsurf, VS Code/Copilot, Codex, OpenCode)

- [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2) Thanks [@clavery](https://github.com/clavery)! - Add `b2c ecdn` commands for managing eCDN zones, certificates, WAF, caching, security settings, and related configurations.

### Patch Changes

- [`97f4b68`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/97f4b68be15dedeff0fe91782f97a5eeddb7b36c) Thanks [@clavery](https://github.com/clavery)! - code deploy archive deletion is not a hard error

- [#64](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/64) [`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34) Thanks [@clavery](https://github.com/clavery)! - Fix HTML response bodies appearing in ERROR log lines. When API requests fail with non-JSON responses (like HTML error pages), error messages now show the HTTP status code (e.g., "HTTP 521 Web Server Is Down") instead of serializing the entire response body.

  Added `getApiErrorMessage(error, response)` utility that extracts clean error messages from ODS, OCAPI, and SCAPI error patterns with HTTP status fallback.

- Updated dependencies [[`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34), [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570), [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26), [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2), [`a14c741`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a14c7419b99f3185002f8c7f63565ed8bc2eea90)]:
  - @salesforce/b2c-tooling-sdk@0.2.0

## 0.1.0

### Minor Changes

- [`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a) Thanks [@clavery](https://github.com/clavery)! - Initial developer preview release

### Patch Changes

- Updated dependencies [[`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a)]:
  - @salesforce/b2c-tooling-sdk@0.1.0
