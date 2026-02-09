# B2C DX - VS Code Extension

VS Code extension for B2C Commerce Cloud developer experience: Page Designer assistant, B2C CLI integration, and Cursor agent prompts.

**Full documentation:** [IDE Support](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/ide-support.html) in the B2C Developer Tooling docs (VitePress).

## Features

- **Page Designer Assistant** — Create Storefront Next page files with PageType and Region definitions via a guided webview UI.
- **Prompt Agent** — Send a prompt to the Cursor agent from the command palette (Cursor only).
- **List WebDAV** — Run `b2c webdav ls` in the integrated terminal.

## Commands

| Command | Description |
|--------|-------------|
| **B2C DX: Open Page Designer Assistant UI** | Opens the Page Designer Assistant webview. |
| **B2C DX: Prompt Agent** | Prompts for text and opens Cursor chat with that prompt. |
| **B2C DX: List WebDAV** | Opens a terminal and runs `b2c webdav ls`. |

## Development

From the monorepo root:

```bash
pnpm install
pnpm --filter @salesforce/b2c-vs-extension run build
pnpm --filter @salesforce/b2c-vs-extension run lint
pnpm --filter @salesforce/b2c-vs-extension run format
pnpm --filter @salesforce/b2c-vs-extension run test
```

Press **F5** in VS Code (with `packages/b2c-vs-extension` or the repo root open) to launch an Extension Development Host.

## Requirements

- VS Code ^1.105.1
- [B2C CLI](https://www.npmjs.com/package/@salesforce/b2c-cli) installed (for WebDAV and other CLI commands)

## License

Apache-2.0. See [license.txt](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt) in the repo root.
