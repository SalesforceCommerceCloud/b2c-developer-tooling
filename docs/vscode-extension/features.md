---
description: B2C DX VS Code Extension feature tour — sandbox explorer, code sync, WebDAV, content libraries, SCAPI API browser, debugger, scaffold, CAP install, and CLI plugin support.
---

# Features

A guided tour of what the extension can do. Each feature lists exactly which `dw.json` fields it needs in a **Requires** callout. All commands are reachable from the Command Palette under the **B2C DX** category — this page focuses on what each feature is *for* and the actions you can only reach through tree-view right-clicks.

**Jump to:** [Sandbox Realm Explorer](#sandbox-realm-explorer) · [WebDAV Browser](#webdav-browser) · [Content Libraries](#content-libraries) · [Cartridge Code Sync](#cartridge-code-sync) · [SCAPI API Browser](#scapi-api-browser) · [B2C Script Debugger](#b2c-script-debugger) · [Scaffold & CAP install](#scaffold-cap-install) · [Page Designer Assistant](#page-designer-assistant) · [Log Tailing](#log-tailing) · [Active Instance Status Bar](#active-instance-status-bar) · [B2C CLI Plugin Support](#b2c-cli-plugin-support)

For credential setup, see [Connecting to a B2C Instance](./configuration#connecting-to-a-b2c-instance) and the CLI's [Authentication Setup guide](../guide/authentication).

## Sandbox Realm Explorer

Browse and manage on-demand sandboxes (ODS) for one or more realms in a dedicated activity-bar container (**B2C-DX Sandboxes**). The tree groups sandboxes by realm, and each row carries a state-derived context value so the right-click menu only offers actions that make sense for the current state.

::: tip Requires
Account Manager **OAuth** with the `Sandbox API User` role on a tenant filter for the realm(s) you want to manage. The extension uses the CLI's built-in browser login by default — no API client config needed for interactive use. For headless sessions, set `client-id` and `client-secret` in `dw.json`.
:::

**Lifecycle commands** (palette + right-click): create, start, stop, restart, clone, view details, view clone details, extend expiration, open Business Manager, delete.

**Cloned sandbox indicators** — clones are tagged in the tree. While a clone is being set up, the source sandbox is shown as `cloning` and the new (target) sandbox is shown as `setting up`. Once the clone stabilizes, both rows display their actual states (`started`, `stopped`, etc.) and the cloned target keeps a visual marker so you can tell it apart from a freshly created sandbox.

<!-- TODO(screenshot): replace ./images/sandbox-explorer.svg with ./images/sandbox-explorer.png — started + cloned sandbox in the tree -->
![Sandbox Realm Explorer](./images/sandbox-explorer.svg)

<!-- TODO(screenshot): replace ./images/sandbox-context-menu.svg with ./images/sandbox-context-menu.png — right-click context menu over a started sandbox -->
![Sandbox context menu](./images/sandbox-context-menu.svg)

Polling cadence is controlled by [`b2c-dx.sandbox.pollingInterval`](./configuration#settings-reference).

## WebDAV Browser

A tree of WebDAV catalogs and libraries plus a registered file-system provider (`b2c-webdav://`) so you can mount a remote folder as a workspace folder.

::: tip Requires
**WebDAV access** — `hostname` plus either `username` + `password` (Basic auth, recommended) or `client-id` + `client-secret` (OAuth). The `password` is your **WebDAV access key** generated in Business Manager → Access Keys, not your Business Manager login password.
:::

**Tree-only actions** (right-click on a catalog, library, or directory):

- **New File / New Folder / Upload File** — create or push directly to the instance.
- **Open as Workspace Folder** — adds the WebDAV path as a workspace folder backed by the `b2c-webdav://` filesystem provider so it behaves like a local folder.
- **Drag & drop** — drag files from your local Explorer into a WebDAV directory to upload.
- **Add Catalog / Add Library** — register additional virtual roots for browsing.

<!-- TODO(screenshot): replace ./images/webdav-browser.svg with ./images/webdav-browser.png — catalogs and libraries expanded -->
![WebDAV Browser](./images/webdav-browser.svg)

<!-- TODO(screenshot): replace ./images/webdav-mounted.svg with ./images/webdav-mounted.png — "Open as Workspace Folder" result -->
![WebDAV mounted as workspace folder](./images/webdav-mounted.svg)

## Content Libraries

A focused view for Page Designer pages and components stored in your content libraries — filtered, exportable, and importable without leaving the editor.

::: tip Requires
Same as [WebDAV Browser](#webdav-browser). Plus a `contentLibrary` (or one entry in `libraries`) in `dw.json` to seed the tree.
:::

**Tree-only actions**:

- **Export / Export without Assets / Export Assets Only** — three single-click exports for any page, content asset, or component.
- **Filter / Clear Filter** — quick filter across the library tree when you have hundreds of pages.
- **Browse in WebDAV** — jump from a library entry to the corresponding WebDAV path.
- **Import Site Archive** — right-click a folder in the Explorer to import it as a site archive.

<!-- TODO(screenshot): replace ./images/content-libraries.svg with ./images/content-libraries.png — content tree with the export context menu -->
![Content Libraries](./images/content-libraries.svg)

## Cartridge Code Sync

A **Cartridges** tree view (under the **B2C-DX** activity-bar container) lists every cartridge detected in your workspace. From there you can watch, deploy, and manage code versions per-cartridge — no all-or-nothing sync.

::: tip Requires
**WebDAV access** for transfer (same as the [WebDAV Browser](#webdav-browser)). Code-version operations (list / create / activate) additionally require **OCAPI** access — `client-id` + `client-secret` configured against the instance's OCAPI permissions.
:::

**Title-bar actions**: **Refresh Cartridges**, **Deploy Cartridges**, **Code Versions** (list / create / activate).

**Per-cartridge right-click actions**: **Upload Cartridge**, **Download from Instance**, **Add to Site Cartridge Path**, **Remove from Site Cartridge Path**.

**Workspace toggles**: **Toggle Code Sync** / **Start Code Sync** / **Stop Code Sync** start a watcher that uploads on save. **Upload to Instance** is also available from the file Explorer's context menu when a code-sync session is active.

<!-- TODO(screenshot): replace ./images/code-sync.svg with ./images/code-sync.png — Cartridges view with code-version dropdown -->
![Cartridge Code Sync](./images/code-sync.svg)

## SCAPI API Browser

Browse SCAPI OpenAPI schemas for your instance and open a Swagger UI panel for any endpoint.

::: tip Requires
Account Manager OAuth client with `client-id`, `client-secret`, `short-code`, and `tenant-id` in `dw.json`. The CLI auto-requests the `sfcc.scapi-schemas` and `SALESFORCE_COMMERCE_API:<tenant_id>` scopes — see the CLI's [SCAPI Schemas authentication](../cli/scapi-schemas#authentication).
:::

The view lives in its own activity-bar container (**B2C-DX: SCAPI**). Use **Refresh** to reload schemas after changing instances, and **Open API Documentation** to launch the Swagger UI panel.

<!-- TODO(screenshot): replace ./images/api-browser.svg with ./images/api-browser.png — Swagger UI panel -->
![SCAPI API Browser](./images/api-browser.svg)

## B2C Script Debugger

Registered as debug type `b2c-script`. Add a launch configuration to `.vscode/launch.json` to step through server-side B2C scripts.

::: tip Requires
**WebDAV access** to download cartridge sources for source-mapping (same as the [WebDAV Browser](#webdav-browser)). The Script Debugger also requires the instance's debugger to be reachable on the configured `hostname`.
:::

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "b2c-script",
      "request": "launch",
      "name": "B2C Script Debugger"
    }
  ]
}
```

`cartridgePath` is auto-detected from the workspace; override it explicitly only if the cartridges live outside the workspace root.

<!-- TODO(screenshot): replace ./images/script-debugger.svg with ./images/script-debugger.png — paused on a breakpoint -->
![B2C Script Debugger](./images/script-debugger.svg)

## Scaffold & CAP install

::: tip Requires
**Scaffold** is local-only — no credentials. **CAP install** uses the same WebDAV access as the [WebDAV Browser](#webdav-browser) plus, depending on the app, OAuth client credentials.
:::

**Scaffold** (`b2c-dx.scaffold.generate`) — quick-pick over the SDK's scaffold templates; appears in the **File → New File...** picker and as **New from Scaffold...** when you right-click a folder in the Explorer.

**CAP install** (`b2c-dx.cap.install`) — appears on the right-click menu of a folder in the Explorer when the folder contains a `commerce-app.json`. Activation is also wired to `workspaceContains:**/commerce-app.json` so the extension auto-activates when you open a CAP project.

<!-- TODO(screenshot): replace ./images/scaffold-picker.svg with ./images/scaffold-picker.png — "New from Scaffold..." quick-pick -->
![Scaffold quick-pick](./images/scaffold-picker.svg)

## Page Designer Assistant

::: tip Requires
None — local file generation only.
:::

`b2c-dx.openUI` opens a guided webview UI for scaffolding a Storefront Next page (PageType + Region definitions). The generated `.tsx` file is written to your workspace's `routes/` folder when one exists, or to a path you pick when the workspace has no routes folder.

<!-- TODO(screenshot): replace ./images/page-designer-assistant.svg with ./images/page-designer-assistant.png -->
![Page Designer Assistant](./images/page-designer-assistant.svg)

## Log Tailing

::: tip Requires
**WebDAV access** (same as the [WebDAV Browser](#webdav-browser)). Logs are read from `Logs/` over WebDAV.
:::

**Start Tailing Logs** / **Stop Tailing Logs** stream B2C log files into the editor (instance-side error/warn/info logs from `error-*.log`, `warn-*.log`, etc.). Output goes to a dedicated VS Code output channel; use [`b2c-dx.logLevel`](./configuration#settings-reference) to control extension log verbosity separately.

## Active Instance Status Bar

A status-bar item in the bottom-left shows the active B2C instance name, hostname, and a `$(pinned)` icon when project-root pinning is active. Clicking it runs **Switch Active Instance** — a quick-pick over instances declared in `dw.json` that updates the active instance and refreshes every view.

## B2C CLI Plugin Support

The extension uses the [B2C CLI](../guide/) under the hood for most of its operations. As a side effect, **any plugin you've installed via `b2c plugins install` propagates into the extension's behavior automatically** — there's no separate VS Code-side plugin registry. A plugin that adds a custom config source, a sandbox subcommand, or a middleware hook is honored by the corresponding extension features the next time the workspace loads.

This mirrors the same plugin propagation already documented for the [MCP server](../mcp/#plugins).

See:

- [Custom Plugins](../guide/extending) — author your own CLI plugin.
- [3rd Party Plugins](../guide/third-party-plugins) — community plugins (e.g., `b2c-plugin-intellij-sfcc-config`).
