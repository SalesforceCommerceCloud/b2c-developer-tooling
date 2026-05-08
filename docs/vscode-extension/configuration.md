---
description: Configure the B2C DX VS Code Extension — feature toggles, log level, sandbox polling, and project root pinning.
---

# Configuration

The extension reads B2C Commerce credentials from the same sources as the [B2C CLI](../guide/configuration) (`dw.json`, `SFCC_*` environment variables, `~/.dw.json`, etc.). This page covers the **VS Code-specific** settings under the `b2c-dx.*` namespace, configurable via **Settings** (Cmd+,) → search for `b2c-dx`, or directly in `settings.json`.

<!-- TODO(screenshot): settings.png — Settings UI filtered to b2c-dx -->
![B2C DX settings](./images/settings.png)

## Feature Toggles

Each feature is enabled by default. Disable any toggle to hide its tree views, commands, and context-menu entries — useful when you want a leaner UI or are debugging activation issues.

| Setting | Default | What it controls |
| ------- | ------- | ---------------- |
| `b2c-dx.features.sandboxExplorer` | `true` | Sandbox Realm Explorer view + lifecycle commands |
| `b2c-dx.features.webdavBrowser` | `true` | WebDAV Browser tree + `b2c-webdav://` filesystem provider |
| `b2c-dx.features.contentLibraries` | `true` | Content Libraries tree + export/import commands |
| `b2c-dx.features.codeSync` | `true` | Cartridges view, watch/deploy, code-version commands |
| `b2c-dx.features.logTailing` | `true` | Log tail commands + B2C DX log output channel |
| `b2c-dx.features.scaffold` | `true` | "New from Scaffold..." command and file/newFile menu entry |
| `b2c-dx.features.apiBrowser` | `true` | SCAPI API Browser view + Swagger UI panel |
| `b2c-dx.features.cap` | `true` | Commerce App Package install command + file decorations |

```jsonc
// .vscode/settings.json
{
  "b2c-dx.features.sandboxExplorer": true,
  "b2c-dx.features.codeSync": true,
  "b2c-dx.features.apiBrowser": false
}
```

The B2C Script Debugger registers regardless of these toggles — it activates only when a `b2c-script` launch configuration is used.

## Log Level

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `b2c-dx.logLevel` | `info` | Verbosity for the **B2C DX** output channel |

Allowed values: `trace`, `debug`, `info`, `warn`, `error`, `silent`. The setting is applied immediately on change — no reload needed.

<!-- TODO(screenshot): output-channel.png — B2C DX output channel showing log stream -->
![B2C DX output channel](./images/output-channel.png)

The output channel surfaces SDK logs (request/response summaries, safety-mode evaluations, polling events) plus extension lifecycle events. Drop to `debug` or `trace` when filing a bug report.

## Sandbox Polling Interval

| Setting | Default | Range | Description |
| ------- | ------- | ----- | ----------- |
| `b2c-dx.sandbox.pollingInterval` | `10` | 2–300 | Seconds between polls while a sandbox is in a transitional state |

The Sandbox Realm Explorer auto-polls a realm only when at least one sandbox is in a transitional state (`creating`, `starting`, `stopping`, `deleting`, `cloning`). Once the realm is fully settled, polling stops.

```jsonc
{
  "b2c-dx.sandbox.pollingInterval": 5
}
```

## Project Root Pinning

In a multi-root workspace, the extension auto-detects the project root by walking up from the active editor (or the first workspace folder) looking for `dw.json` / `package.json` markers. Two commands let you override the auto-detected root:

- **B2C DX: Use as B2C Commerce Root** — only available on a workspace-root folder when more than one folder is open in the workspace. Right-click that folder in the Explorer and select the command to pin it. While a pin is active, the status bar shows a `$(pinned)` indicator.
- **B2C DX: Reset B2C Commerce Root to Auto-Detect** — clears the pin and returns to auto-detection. Run from the Command Palette (this command has no Explorer context-menu entry).

The pin is workspace-scoped (stored in workspace state). Pin a specific folder when you have multiple cartridge projects in a single workspace and want to keep CLI commands targeting one of them.

## Next Steps

- [Features](./features) — full feature tour.
- [Authentication Setup](../guide/authentication) — credential formats, OAuth scopes, MRT API keys.
