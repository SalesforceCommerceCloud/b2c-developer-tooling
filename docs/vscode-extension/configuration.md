---
description: Connect the B2C DX VS Code Extension to a B2C Commerce instance — credentials, OAuth, telemetry, and the b2c-dx.* settings reference.
---

# Configuration

The extension reuses the [B2C CLI](../guide/configuration)'s configuration system, so anything that works with `b2c` works here — `dw.json`, `SFCC_*` environment variables, and active-instance selection.

This page covers:

- [Connecting to a B2C Instance](#connecting-to-a-b2c-instance) — credentials per feature.
- [Switching the Active Instance](#switching-the-active-instance) — single-workspace, multi-instance.
- [Settings Reference](#settings-reference) — the `b2c-dx.*` toggles and verbosity controls.

## Connecting to a B2C Instance

The extension needs different credentials depending on which feature you use. **A `dw.json` at your workspace root is the recommended setup** — populate the fields each feature needs, and the extension picks them up automatically.

### Per-feature requirements

A summary by feature:

| Feature | Required `dw.json` fields |
| ------- | ------------------------- |
| **Sandbox Realm Explorer** | OAuth (browser login by default; `client-id` + `client-secret` for headless). `Sandbox API User` role with a tenant filter. |
| **WebDAV Browser** | `hostname`, `username`, `password` (WebDAV access key). OAuth (`client-id` + `client-secret`) also accepted. |
| **Content Libraries** | Same as WebDAV. Optionally `contentLibrary` (or `libraries`) to seed the tree. |
| **Cartridge Code Sync** | WebDAV for transfer **and** OCAPI (`client-id` + `client-secret`) for code-version operations. |
| **SCAPI API Browser** | `client-id`, `client-secret`, `short-code`, `tenant-id`. |
| **B2C Script Debugger** | WebDAV (for source-mapping). |
| **Log Tailing** | WebDAV (logs are read from `Logs/`). |
| **CAP install** | WebDAV; some apps additionally require OAuth client credentials. |
| **Scaffold**, **Page Designer Assistant** | None — local-only. |

### Example `dw.json`

```jsonc
{
  // WebDAV (Code Sync, WebDAV Browser, Content Libraries, Log Tailing, Debugger)
  "hostname": "abcd-001.dx.commercecloud.salesforce.com",
  "username": "your-bm-username",
  "password": "your-webdav-access-key",
  "code-version": "version1",

  // OCAPI / OAuth (Sandbox API, Code Versions, CAP)
  "client-id": "...",
  "client-secret": "...",

  // SCAPI (API Browser)
  "short-code": "...",
  "tenant-id": "...",

  // Optional — content tree seed
  "contentLibrary": "your-library-id"
}
```

You can also set any of these via `SFCC_*` environment variables (`SFCC_SERVER`, `SFCC_USERNAME`, `SFCC_CLIENT_ID`, `SFCC_TENANT_ID`, etc.). See the [CLI Configuration guide](../guide/configuration) for the complete list and precedence rules, and the [Authentication Setup guide](../guide/authentication) for OAuth scope requirements and Account Manager API client setup.

<!-- TODO(screenshot): replace ./images/settings.svg with ./images/settings.png — Settings UI filtered to b2c-dx -->

## Switching the Active Instance

When `dw.json` defines multiple named instances (the recommended pattern for working across dev / staging / sandbox), click the cloud icon in the status bar to run **B2C DX: Switch Active Instance** — a quick-pick over the configured instances. Selecting a new one updates the underlying `dw.json` active-instance pointer and refreshes every view.

The same pointer is shared with the CLI: switching here is equivalent to running `b2c setup instance set-active <name>`.

## Settings Reference

These VS Code settings live under the `b2c-dx.*` namespace. **You usually don't need to change any of them** — they exist for niche cases like disabling a feature you don't use, or quieting the log channel for a bug report. To browse: **Settings** (Cmd+,) → search for `b2c-dx`.

### Feature toggles

Each feature is enabled by default. Set to `false` to skip its activation entirely (no tree views, no commands, no context-menu entries). Useful for trimming the UI, isolating activation issues, or running in a project where a feature isn't applicable.

| Setting | Default |
| ------- | ------- |
| `b2c-dx.features.sandboxExplorer` | `true` |
| `b2c-dx.features.webdavBrowser` | `true` |
| `b2c-dx.features.contentLibraries` | `true` |
| `b2c-dx.features.codeSync` | `true` |
| `b2c-dx.features.logTailing` | `true` |
| `b2c-dx.features.scaffold` | `true` |
| `b2c-dx.features.apiBrowser` | `true` |
| `b2c-dx.features.cap` | `true` |

The B2C Script Debugger registers regardless of these toggles — it activates only when a `b2c-script` launch configuration is used.

### Verbosity, polling, telemetry

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `b2c-dx.logLevel` | `info` | Verbosity for the **B2C DX** output channel. Allowed: `trace`, `debug`, `info`, `warn`, `error`, `silent`. Applied immediately on change. Drop to `debug` or `trace` when filing a bug. |
| `b2c-dx.sandbox.pollingInterval` | `10` | Seconds between polls while a sandbox is in a transitional state (`creating`, `starting`, `stopping`, `deleting`, `cloning`). Range: 2–300. Polling stops automatically once the realm settles. |
| `b2c-dx.telemetry.enabled` | `true` | Send anonymous usage telemetry. Honors VS Code's `telemetry.telemetryLevel` — disabling that disables this regardless of this setting. |

### XML schema validation

The extension contributes XSD-based validation for common metadata XML files (via the VS Code XML extension). When a file path matches one of these folders, diagnostics are validated against the corresponding B2C schema:

- `**/metadata/catalogs/*.xml`
- `**/metadata/customer-groups/*.xml`
- `**/metadata/customer-lists/*.xml`
- `**/metadata/custom-objects/*.xml`
- `**/metadata/inventory-lists/*.xml`
- `**/metadata/libraries/*.xml`
- `**/metadata/payment-methods/*.xml`
- `**/metadata/payment-processors/*.xml`
- `**/metadata/preferences/*.xml`
- `**/metadata/pricebooks/*.xml`
- `**/metadata/promotions/*.xml`
- `**/metadata/redirect-urls/*.xml`
- `**/metadata/search/*.xml`
- `**/metadata/shipping/*.xml`
- `**/metadata/sites/*.xml`
- `**/metadata/slots/*.xml`
- `**/metadata/sourcecodes/*.xml`
- `**/metadata/stores/*.xml`
- `**/metadata/url-rules/*.xml`

To disable XML validation globally in your workspace, set:

```jsonc
{
  "xml.validation.enabled": false
}
```

### Complete defaults (copy-paste)

```jsonc
// .vscode/settings.json
{
  "b2c-dx.features.sandboxExplorer": true,
  "b2c-dx.features.webdavBrowser": true,
  "b2c-dx.features.contentLibraries": true,
  "b2c-dx.features.codeSync": true,
  "b2c-dx.features.logTailing": true,
  "b2c-dx.features.scaffold": true,
  "b2c-dx.features.apiBrowser": true,
  "b2c-dx.features.cap": true,
  "b2c-dx.logLevel": "info",
  "b2c-dx.sandbox.pollingInterval": 10,
  "b2c-dx.telemetry.enabled": true
}
```

## Next Steps

- [Overview](./) — what the extension can do.
- [Authentication Setup](../guide/authentication) — Account Manager API clients, WebDAV access keys, OAuth scopes.
- [CLI Configuration](../guide/configuration) — full `dw.json` reference and precedence rules.
