# Install the B2C CLI

The B2C CLI (`b2c`) drives deploys, log tailing, sandbox management, and more from the terminal. The VS Code extension uses it under the hood for some commands.

> **Optional.** You can use the extension's Cartridges, WebDAV, and Sandbox views without the CLI. Install it when you want to script the same operations from the terminal or CI.

## Prerequisites

- **Node.js** — v22.0.0 or newer required
- **npm** — included with Node.js (used for global install)
- **npx** — included with Node.js (used for one-off runs)
- **Homebrew** — optional, alternative install method on macOS/Linux

## Install

Pick whichever fits your toolchain. The published docs list these three:

- **npm** — `npm install -g @salesforce/b2c-cli`
- **Homebrew** — `brew install salesforcecommercecloud/tools/b2c-cli`
- **npx** — `npx @salesforce/b2c-cli --help`

## Verify

After install, confirm the CLI is on your PATH with `b2c --version`.

Or click **Verify CLI** above — the extension detects the installed version and checks for updates automatically.

## What it unlocks

- `b2c code:deploy` — same flow the Cartridges view uses, scriptable from CI.
- `b2c sandbox:*` — create/start/stop/delete sandboxes from the terminal.
- `b2c log:tail` — stream instance logs.
- `b2c auth:*` — non-interactive OAuth client login for pipelines.

## Troubleshooting

- **Command not found after `npm install -g`** — your global npm prefix isn't on PATH. Run `npm config get prefix` and add `<prefix>/bin` to PATH.
- **EACCES on install** — use a Node version manager (`nvm`, `fnm`, `volta`) instead of `sudo npm`. Avoid `sudo`.
- **Old version behaves oddly** — run **Update CLI** (or `npm install -g @salesforce/b2c-cli@latest`) to pin to the latest published release.

[Full installation guide on the docs site](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/installation.html)
