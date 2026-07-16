# B2C DX - VS Code Extension

VS Code extension for B2C Commerce developer experience: sandbox realm explorer, cartridge code sync, WebDAV browser, content libraries, SCAPI API browser, B2C script debugger, scaffold/CAP install, log tailing, CIP analytics (Query Builder + curated reports), and ISML language support.

**User-facing documentation:** [B2C DX VS Code Extension](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/) — overview, installation, configuration, and feature tour.

This README is the source of truth for repo-level developer info (build/watch, launch configs, packaging, tests). End-user documentation lives in the docs site above.

> **Marketplace publishing happens out of [`forcedotcom/b2c-dx`](https://github.com/forcedotcom/b2c-dx).** All extension development, issues, and pull requests stay in this monorepo; the `forcedotcom/b2c-dx` repo holds the marketplace landing page, governance files, and the workflows that publish each release to VS Code Marketplace and Open VSX. See [PUBLISHING.md](./PUBLISHING.md) for the publish flow and the manual fallback.

## Features (overview)

- Sandbox Realm Explorer — create / start / stop / restart / clone / extend / view / open BM / delete.
- Cartridge Code Sync — watch, deploy, upload/download, diff, code-version management.
- WebDAV Browser + `b2c-webdav://` filesystem provider.
- Content Libraries — browse, export (with/without assets), filter, import site archive.
- SCAPI API Browser — Swagger UI panel.
- B2C Script Debugger (debug type `b2c-script`).
- Scaffold (`New from Scaffold...`) and CAP install.
- Log tailing into a dedicated output channel.
- Jobs Explorer — monitor recent job executions, drill into steps, run/re-run/stop jobs, scaffold `jobs.xml`, deploy scaffolded jobs, and open execution logs.
- B2C-DX Analytics — CIP/CCAC Query Builder, Tables Browser, curated reports, multi-realm support, saved-query library.
- ISML language support — syntax highlighting, language configuration (comments, brackets, auto-close), snippets, automatic closing-tag insertion, and Emmet support for `.isml` files.

See the [docs site](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/features) for the full tour.

## Development

From the monorepo root:

```bash
pnpm install
pnpm --filter b2c-vs-extension run build
pnpm --filter b2c-vs-extension run lint
pnpm --filter b2c-vs-extension run format
pnpm --filter b2c-vs-extension run test
```

### Tests

The test suite uses **Mocha** + **`@vscode/test-cli`** (which wraps `@vscode/test-electron`). Two layers:

- **Unit tests** (`src/test/*.test.ts`) — pure helpers, no `vscode` import where avoidable. Run inside the Extension Host but don't need a workspace.
- **Integration tests** (`src/test/integration/*.test.ts`) — launch a real Extension Development Host with a fixture workspace and exercise activation, command registration, and tree providers.

```bash
# Run all tests (downloads VS Code on first run)
pnpm --filter b2c-vs-extension run test

# Coverage (text + lcov, no thresholds yet)
pnpm --filter b2c-vs-extension exec c8 vscode-test
```

`.vscode-test.mjs` configures the Mocha runner; `tsconfig.test.json` compiles `src/**/*` to `out/`. The test glob (`out/test/**/*.test.js`) keeps the runner scoped to test files only.

> **Note on coverage:** `c8` instruments the parent Node process, but the actual VS Code Extension Host runs in a child Electron process that is not instrumented out-of-the-box. The reported numbers are therefore a low-bound. For now we use coverage as a smoke check; richer instrumentation (e.g. via `nyc` injected through `extensionTestsEnv`) is a follow-up.

The build bundles `@salesforce/b2c-tooling-sdk` into `dist/extension.js` with esbuild, so the extension works when installed from a `.vsix` without requiring a separate `node_modules` install (unlike the CLI, which declares the SDK as an npm dependency).

### Dev workflow (watch mode)

For iterating on both the extension and the SDK without rebuilding:

1. Start the watcher in a terminal:
   ```bash
   cd packages/b2c-vs-extension
   pnpm run watch
   ```
   This uses esbuild with the `development` condition, resolving SDK imports to source `.ts` files directly — no SDK rebuild needed.

2. Open `packages/b2c-vs-extension` in VS Code and select the **Run Extension (Dev)** launch configuration (F5). This launches an Extension Development Host without a preLaunchTask so it won't overwrite the watch output.

3. After making changes, press **Cmd+Shift+F5** (Restart Debugging) to restart the extension host and pick up the new bundle.

> **Note:** The **Run Extension** launch config runs a production build (`pnpm run build`) as a preLaunchTask, which overwrites `dist/extension.js` without the `development` condition. Use **Run Extension (Dev)** when iterating with watch mode.

### Manual verification (Jobs Explorer)

1. Configure `dw.json` with OAuth credentials and scopes that allow `/job_execution_search` and `/jobs/*/executions*`.
2. Launch the extension host and open **B2C-DX Operations → Jobs**.
3. Confirm jobs appear with status, last execution time, and duration, and auto-refresh every `b2c-dx.jobs.refreshInterval` seconds.
   - Tune `b2c-dx.jobs.discoveryExecutionScanLimit` to scan more recent executions and discover additional job IDs.
   - Tune `b2c-dx.jobs.historyLimit` to show deeper per-job execution history when expanding a job.
   - Optionally define `b2c-dx.jobs.knownJobIds` to get quick-pick suggestions when running jobs before history is populated.
4. Expand a job to verify execution history and step-level status/details.
5. Run **Run Job**, **Re-Run Job**, and **Stop Execution** from the view context menu.
6. Run **Create Job Scaffold**, complete the wizard, and verify files are generated under `b2c-jobs/<job-id>/` (`jobs.xml`, `README.md`, and script stub).
7. Run **Deploy Job Scaffold**, select a generated `jobs.xml`, confirm target instance, and verify deployment completes.
8. After deploy, open **Business Manager Jobs** from the success prompt and confirm the new job definition is present (disabled by default).
9. For a failed execution, run **Open Failure Log** and verify the editor jumps to a matching error message in the opened log.

## Requirements

- VS Code ^1.105.1
- [B2C CLI](https://www.npmjs.com/package/@salesforce/b2c-cli) installed (for WebDAV and other CLI commands)

## License

Apache-2.0. See [license.txt](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt) in the repo root.
