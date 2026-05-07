# Install the B2C CLI

The B2C CLI (`b2c`) drives deploys, log tailing, sandbox management, and more from the terminal. The VS Code extension uses it under the hood for some commands.

> **Optional.** You can use the extension's Cartridges, WebDAV, and Sandbox views without the CLI. Install it when you want to script the same operations from the terminal or CI.

## Install

Pick whichever fits your toolchain. The published docs list these three:

```bash
npm install -g @salesforce/b2c-cli
```

```bash
brew install salesforcecommercecloud/tools/b2c-cli
```

```bash
npx @salesforce/b2c-cli --help
```

`npm` requires **Node.js 22.0.0 or newer**.

## Verify

After install, confirm the CLI is on your PATH:

```bash
b2c --version
```

Or run **B2C DX - Getting Started: Verify B2C CLI Installation** from the Command Palette — the extension shells out to `b2c --version` for you and ticks the walkthrough step on success.

## What it unlocks

- `b2c code:deploy` — same flow the Cartridges view uses, scriptable from CI.
- `b2c sandbox:*` — create/start/stop/delete sandboxes from the terminal.
- `b2c log:tail` — stream instance logs.
- `b2c auth:*` — non-interactive OAuth client login for pipelines.

## Troubleshooting

- **Command not found after `npm install -g`** — your global npm prefix isn't on PATH. Run `npm config get prefix` and add `<prefix>/bin` to PATH.
- **EACCES on install** — use a Node version manager (`nvm`, `fnm`, `volta`) instead of `sudo npm`. Avoid `sudo`.
- **Old version behaves oddly** — run **B2C DX - Getting Started: Update B2C CLI to Latest** (or `npm install -g @salesforce/b2c-cli@latest`) to pin to the latest published release. The walkthrough's *Verify CLI* action queries the npm registry once every 6 hours and surfaces an "Update CLI" prompt automatically when a newer version is available.

[Full installation guide on the docs site](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/installation.html)
