---
description: The official Salesforce B2C Commerce VS Code Extension — sandbox management, cartridge code sync, WebDAV browser, content libraries, SCAPI API browser, script debugger, and project scaffolding.
---

# Salesforce B2C Commerce VS Code Extension

The **official Salesforce B2C Commerce extension for VS Code**, published by Salesforce. Manage your B2C Commerce sandboxes, sync cartridges, browse content libraries and SCAPI schemas, debug server-side scripts, and scaffold new projects — all from inside VS Code. If your project already works with the [B2C CLI](../guide/), the extension picks up the same connection automatically.

[![Salesforce B2C Commerce activity bar](./images/overview.png)](./images/overview.png)

## Highlights

### ISML and Script API Editor Support

Write storefront code with ISML syntax highlighting, snippets, formatting, tag completion, diagnostics, and Emmet support. Cartridge JavaScript files automatically provide autocomplete and hover documentation for `dw/*` modules without writing a `jsconfig.json` into your project. See the [Script API IntelliSense guide](../guide/ide-integration#script-api-intellisense) for more detail.

### B2C Script Debugger

Step through anything that runs server-side: cartridge controllers, jobs, custom scripts, SCAPI hooks, and Custom APIs. Set breakpoints, drop log points, watch variables, and step in and out — the full debugger experience you'd expect from any other Node project.

[![B2C Script Debugger](./images/script-debugger.png)](./images/script-debugger.png)

On multi-app-server environments, a breakpoint only fires when the triggering request reaches the app server the debugger is attached to. While a debug session is active, run **Copy Debugger Session ID (dwsid)** from the Command Palette to copy the session cookie, then send your triggering request (e.g. in the browser) with `Cookie: dwsid=<value>`. See the [Script Debugger guide](../guide/script-debugger#server-affinity-hitting-breakpoints) for details.

### Scaffolding

Generate new cartridges, controllers, hooks, jobs, and other boilerplate from a curated set of templates. Available from **File → New File...** or by right-clicking a folder in the Explorer.

### Sandbox Realm Explorer

Spin up, start, stop, clone, and clean up your on-demand sandboxes from a tree view. Cloned sandboxes are clearly marked, and the right-click menu only shows actions that make sense for the sandbox's current state.

[![Sandbox Realm Explorer](./images/sandbox-explorer.png)](./images/sandbox-explorer.png)

### Library Explorer

Find Page Designer pages and components fast, with one-click export (with assets, without assets, or assets only), live editing of component XML, and round-trip imports of site archives. The library tree is filterable when you have hundreds of pages.

[![Library Explorer](./images/library-explorer.png)](./images/library-explorer.png)

### Cartridge Management and Code Watch/Upload

Edit cartridges locally and have changes show up on your sandbox automatically. Deploy on demand, diff against the active code version, and manage code versions without leaving the editor.

### SCAPI API Explorer

Explore every SCAPI API your instance exposes and try requests against them in a built-in Swagger UI. Authentication is handled for you using the same credentials your CLI already has.

[![SCAPI API Explorer](./images/api-browser.png)](./images/api-browser.png)

### WebDAV Browser

Browse your sandbox's catalogs, libraries, and IMPEX folders right inside VS Code. Open remote files like local ones, drag-and-drop to upload, or mount a remote folder as a workspace folder.

### Log Tailing

Stream live `error-*.log`, `warn-*.log`, and `info-*.log` files from your sandbox into a VS Code output channel. Use **Start Tailing Logs** to begin and **Stop Tailing Logs** to end.

### Active Instance Status Bar

The bottom-left of the window shows your active instance — the name, the hostname, and a pin icon if you've locked a particular folder as the project root. Click it to switch instances; every view updates instantly.

### B2C CLI Plugin Support

The extension runs the [B2C CLI](../guide/) under the hood, so any plugin you've installed via `b2c plugins install` automatically applies here too. Add a plugin that introduces a new config source, a custom sandbox command, or middleware, and the extension picks it up the next time the workspace loads — no separate plugin registry. (The MCP server works the same way; see the [MCP plugins note](../mcp/#plugins).)

## Next Steps

- [Installation](./installation) — download and install the extension.
- [Connecting to your sandbox](./configuration#connecting-to-a-b2c-instance) — what each feature needs.
