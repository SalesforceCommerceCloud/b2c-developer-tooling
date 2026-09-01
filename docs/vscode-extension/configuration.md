---
description: Connect the Salesforce B2C Commerce VS Code Extension to a B2C Commerce instance — credentials, OAuth, telemetry, and the b2c-dx.* settings reference.
---

# Configuration

The extension shares the [B2C CLI](../guide/configuration)'s configuration system. This page focuses on the extension's connection requirements, project selection, and settings.

This page covers:

- [Connecting to a B2C Instance](#connecting-to-a-b2c-instance) — credentials per feature.
- [How the Extension Chooses a Project](#how-the-extension-chooses-a-project) — parent folders and multi-root workspaces.
- [Selecting an Instance](#selecting-an-instance) — workspace-specific and shared defaults.
- [Settings Reference](#settings-reference) — the `b2c-dx.*` toggles and verbosity controls.

## Connecting to a B2C Instance

The extension uses the same configuration resolver as the B2C CLI. Environment variables, a project `.env`, `dw.json`, supported settings under `package.json#b2c`, shared CLI credential storage, and configuration sources added by installed B2C CLI plugins are all honored. The shared [Configuration guide](../guide/configuration) is the reference for available fields and precedence.

**A `dw.json` at your project root is the conventional setup** and is the easiest way for the extension to locate a B2C project nested inside a larger workspace. It is not required when another configuration source provides what you need.

For the selected project, the extension loads all variables from its `.env` and supports a relative `.env` `SFCC_CONFIG` path. Process environment variables take priority over project `.env` values. Configuration files are selected in this order:

1. Process `SFCC_CONFIG`
2. Project `.env` `SFCC_CONFIG`
3. Project-local `dw.json`
4. The shared global default set with `b2c setup default-config set <path>`

The global default is the same fallback used by the CLI and MCP server. The extension automatically refreshes when that shared setting changes.

The extension's instance picker combines instances from the primary and global files. Same-name primary entries shadow global entries, and each instance remains a complete entry rather than having fields merged across files. Switching an instance updates the file that owns it and clears the previous active selection across the catalog.

### Per-feature requirements

A summary by feature, regardless of which configuration source provides the values:

| Feature                    | Required configuration                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Sandbox Realm Explorer** | OAuth (browser login by default; `client-id` + `client-secret` for headless). `Sandbox API User` role with a tenant filter. |
| **WebDAV Browser**         | `hostname`, `username`, `password` (WebDAV access key). OAuth (`client-id` + `client-secret`) also accepted.                |
| **Content Libraries**      | Same as WebDAV. Optionally `contentLibrary` (or `libraries`) to seed the tree.                                              |
| **Cartridge Code Sync**    | WebDAV for transfer **and** OCAPI (`client-id` + `client-secret`) for code-version operations.                              |
| **SCAPI API Browser**      | `client-id`, `client-secret`, `short-code`, `tenant-id`.                                                                    |
| **B2C Script Debugger**    | WebDAV (for source-mapping).                                                                                                |
| **Log Tailing**            | WebDAV (logs are read from `Logs/`).                                                                                        |
| **CAP install**            | WebDAV; some apps additionally require OAuth client credentials.                                                            |
| **Scaffold**               | None — local-only.                                                                                                          |

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
  "contentLibrary": "your-library-id",
}
```

See the [Authentication Setup guide](../guide/authentication) for OAuth scope requirements and Account Manager API client setup.

<!-- TODO(screenshot): replace ./images/settings.svg with ./images/settings.png — Settings UI filtered to b2c-dx -->

## How the Extension Chooses a Project

You do not need to open the exact project directory for the extension to find it. These common layouts work automatically:

- **Project folder open:** configuration is resolved from that folder using all supported sources.
- **Parent folder open:** the extension searches its subfolders. For example, a workspace containing `react/` and `sfra/dw.json` uses `sfra/` as the B2C project.
- **Multi-root workspace:** folders containing `dw.json` are checked in the order shown in Explorer. If none contains one, root-level `.env` and `package.json#b2c` configuration are also considered.

If one workspace folder contains more than one B2C project, the project closest to that workspace folder is selected. Open the intended project directly when sibling projects are equally close.

`dw.json` is the conventional nested-project discovery signal. When a project uses only environment variables, `.env`, `package.json`, or a plugin-provided source, open that project as a workspace folder so the extension has the correct project root.

To keep a particular project directory selected, right-click that folder in Explorer and choose **B2C DX > Use as B2C Commerce Root**. This works for nested folders such as `sfra/` as well as top-level folders in a multi-root workspace. Run **B2C DX: Reset B2C Commerce Root to Auto-Detect** from the Command Palette to return to automatic selection.

## Selecting an Instance

When your configuration defines multiple named instances (the recommended pattern for working across dev / staging / sandbox), click the cloud icon in the status bar to open a quick pick. Selecting an instance applies it only to the current VS Code workspace and refreshes every extension view. Other VS Code workspaces, the CLI, and MCP continue using their own selection or the shared default.

The picker distinguishes the instance **selected for this workspace** with a check mark and the shared **default instance** with a star. Use the star action on a row—or run **B2C DX: Set Default Instance**—to intentionally change the default used by other consumers. Run **B2C DX: Follow Default Instance** to remove the workspace-specific selection.

For named entries, setting the default writes `active: true`; a root configuration without an explicit `active` value remains an implicit default. This is equivalent to running `b2c setup instance set-active <name>` and is separate from selecting an instance only for VS Code.

## Settings Reference

These VS Code settings live under the `b2c-dx.*` namespace. **You usually don't need to change any of them** — they exist for niche cases like disabling a feature you don't use, or quieting the log channel for a bug report. To browse: **Settings** (Cmd+,) → search for `b2c-dx`.

### Feature toggles

Each feature is enabled by default. Set to `false` to skip its activation entirely (no tree views, no commands, no context-menu entries). Useful for trimming the UI, isolating activation issues, or running in a project where a feature isn't applicable.

| Setting                            | Default |
| ---------------------------------- | ------- |
| `b2c-dx.features.sandboxExplorer`  | `true`  |
| `b2c-dx.features.webdavBrowser`    | `true`  |
| `b2c-dx.features.contentLibraries` | `true`  |
| `b2c-dx.features.codeSync`         | `true`  |
| `b2c-dx.features.logTailing`       | `true`  |
| `b2c-dx.features.scaffold`         | `true`  |
| `b2c-dx.features.apiBrowser`       | `true`  |
| `b2c-dx.features.cap`              | `true`  |

The B2C Script Debugger registers regardless of these toggles — it activates only when a `b2c-script` launch configuration is used.

### Verbosity, polling, telemetry

| Setting                          | Default | Description                                                                                                                                                                                     |
| -------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b2c-dx.logLevel`                | `info`  | Verbosity for the extension output channel. Allowed: `trace`, `debug`, `info`, `warn`, `error`, `silent`. Applied immediately on change. Drop to `debug` or `trace` when filing a bug.          |
| `b2c-dx.sandbox.pollingInterval` | `10`    | Seconds between polls while a sandbox is in a transitional state (`creating`, `starting`, `stopping`, `deleting`, `cloning`). Range: 2–300. Polling stops automatically once the realm settles. |
| `b2c-dx.telemetry.enabled`       | `true`  | Send anonymous usage telemetry. Honors VS Code's `telemetry.telemetryLevel` — disabling that disables this regardless of this setting.                                                          |

### XML schema validation

The extension contributes XSD-based validation for B2C metadata XML files via the [Red Hat XML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml), which is declared as an extension dependency and installed automatically. When a file path matches one of the contributed globs, diagnostics, autocomplete, and hover docs are driven by the corresponding B2C schema.

Both common workspace conventions are recognized:

- **Canonical site-archive layout** — `sites/<site-id>/`, `catalogs/<id>/`, `libraries/<id>/`, `customer_lists/<id>/`, `pricebooks/`, `inventory_lists/`, `meta/`.
- **Exploded `metadata/` workspace layout** — `metadata/sites/<id>/*.xml`, `metadata/catalogs/*.xml`, `metadata/promotions/*.xml`, etc.

Schemas covered include catalog, promotion, slot, customer-group, customer-list, custom-object, inventory, library, payment-method, payment-processor, preference, pricebook, redirect-url, search/search2, shipping, site, sourcecode, store, url-rule, jobs, services, schedules, ab-test (and participants), assignment, cache-settings, commerce-feature-state, coupon (and redemption), csrf-allowlist, customer, customer-cdn-settings, dcext, form, geolocation, gift-certificate, locales, meta (system/custom-objecttype-extensions), oauth-providers, page-meta-tags, price-adjustment-limits, product-list, sitemap-configuration, sorting-rules, storefronts, and tax. The full mapping is at `packages/b2c-vs-extension/resources/xsd-mappings.json`.

To disable XML validation globally in your workspace, set:

```jsonc
{
  "xml.validation.enabled": false,
}
```

To opt out of the Red Hat XML dependency entirely, uninstall this extension or pin to a release prior to the one that introduced XML validation.

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
  "b2c-dx.telemetry.enabled": true,
}
```

## Next Steps

- [Overview](./) — what the extension can do.
- [Authentication Setup](../guide/authentication) — Account Manager API clients, WebDAV access keys, OAuth scopes.
- [Configuration](../guide/configuration) — full `dw.json` reference and precedence rules.
