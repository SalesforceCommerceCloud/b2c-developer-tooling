# VS Code Extension Development

Contributor guidance for the Salesforce B2C Commerce VS Code extension. See [README.md](./README.md) for the user-facing extension overview.

## Prerequisites

- Node.js 22 or later
- pnpm 10.17.1
- VS Code 1.105.1 or later

## Build and test

From the monorepo root:

```bash
pnpm install
pnpm --filter b2c-vs-extension run build
pnpm --filter b2c-vs-extension run lint
pnpm --filter b2c-vs-extension run format
pnpm --filter b2c-vs-extension run test
```

### Tests

The test suite uses **Mocha** and **`@vscode/test-cli`**, which wraps `@vscode/test-electron`. It has two layers:

- **Unit tests** (`src/test/*.test.ts`) cover pure helpers and avoid importing `vscode` where possible. They run inside the Extension Host but don't require a workspace.
- **Integration tests** (`src/test/integration/*.test.ts`) launch an Extension Development Host with a fixture workspace and exercise activation, command registration, and tree providers.

```bash
# Run all tests (downloads VS Code on first run)
pnpm --filter b2c-vs-extension run test

# Generate text and lcov coverage reports (no thresholds yet)
pnpm --filter b2c-vs-extension exec c8 vscode-test
```

`.vscode-test.mjs` configures the Mocha runner, and `tsconfig.test.json` compiles `src/**/*` to `out/`. The `out/test/**/*.test.js` glob keeps the runner scoped to test files.

> **Coverage note:** `c8` instruments the parent Node.js process, but the VS Code Extension Host runs in a child Electron process that is not instrumented by default. Reported coverage is therefore a lower bound and currently serves as a smoke check.

The build bundles `@salesforce/b2c-tooling-sdk` into `dist/extension.cjs` with esbuild, so an installed `.vsix` does not require a separate `node_modules` installation.

## Development workflow

To iterate on both the extension and SDK without rebuilding:

1. Start the watcher from the extension package:

   ```bash
   cd packages/b2c-vs-extension
   pnpm run watch
   ```

   The watcher uses the `development` condition to resolve SDK imports directly to TypeScript source files, so no separate SDK build is needed.

2. Open `packages/b2c-vs-extension` in VS Code and select the **Run Extension (Dev)** launch configuration (F5). This launches an Extension Development Host without a pre-launch task, so it does not overwrite the watcher output.

3. After making changes, press **Cmd+Shift+F5** (macOS) or **Ctrl+Shift+F5** (Windows/Linux) to restart the extension host and load the new bundle.

The **Run Extension** launch configuration performs a production build as a pre-launch task and overwrites `dist/extension.cjs` without the `development` condition. Use **Run Extension (Dev)** while working with watch mode.

## Manual verification: Jobs Explorer

1. Configure `dw.json` with OAuth credentials and scopes that allow `/job_execution_search` and `/jobs/*/executions*`.
2. Enable `b2c-dx.features.jobsExplorer`, launch the extension host, and open **B2C-DX Operations → Jobs**.
3. Confirm that jobs appear with status, last execution time, and duration.
   - Tune `b2c-dx.jobs.discoveryExecutionScanLimit` to scan more executions and discover additional job IDs.
   - Optionally define `b2c-dx.jobs.knownJobIds` to provide quick-pick suggestions before history is populated.
4. Expand a job and verify its execution history and step-level details.
5. Run **Run Job**, **Re-Run Job**, and **Stop Execution** from the view context menu.
6. Run **Create Job Scaffold** and verify that it creates `jobs.xml`, `README.md`, and a script stub under `b2c-jobs/<job-id>/`.
7. Run **Deploy Job Scaffold**, select the generated `jobs.xml`, confirm the target instance, and verify that deployment completes.
8. Open **Business Manager Jobs** from the success prompt and confirm that the new job definition is present and disabled by default.
9. For a failed execution, run **Open Failure Log** and verify that the editor opens the matching error in the log.

## Package the extension

From the extension package directory:

```bash
pnpm run package
```

This runs a production build, creates the `.vsix` with `vsce`, and injects the bundled Script API types. `README.md` is packaged as the extension details page and is used as the Visual Studio Marketplace listing when the extension is published.
