# Change Log

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
