# B2C DX - VS Code Extension

VS Code extension for B2C Commerce Cloud developer experience: Page Designer assistant, B2C CLI integration, and Cursor agent prompts.

**Full documentation:** [IDE Support](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/ide-support.html) in the B2C Developer Tooling docs (VitePress).

## Features

- **Page Designer Assistant** — Create Storefront Next page files with PageType and Region definitions via a guided webview UI.
- **Prompt Agent** — Send a prompt to the Cursor agent from the command palette (Cursor only).
- **List WebDAV** — List WebDAV (Impex) via the B2C SDK; output in the B2C DX output channel.

## Commands

| Command | Description |
|--------|-------------|
| **B2C DX: Open Page Designer Assistant UI** | Opens the Page Designer Assistant webview. |
| **B2C DX: Prompt Agent** | Prompts for text and opens Cursor chat with that prompt. |
| **B2C DX: List WebDAV** | Lists WebDAV contents (default: Impex) in the B2C DX output channel. |

## Development

From the monorepo root:

```bash
pnpm install
pnpm --filter @salesforce/b2c-vs-extension run build
pnpm --filter @salesforce/b2c-vs-extension run lint
pnpm --filter @salesforce/b2c-vs-extension run format
pnpm --filter @salesforce/b2c-vs-extension run test
```

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

## Requirements

- VS Code ^1.105.1
- [B2C CLI](https://www.npmjs.com/package/@salesforce/b2c-cli) installed (for WebDAV and other CLI commands)

## License

Apache-2.0. See [license.txt](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt) in the repo root.
