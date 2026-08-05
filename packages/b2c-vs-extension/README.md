# Salesforce B2C Commerce for VS Code

Manage Salesforce B2C Commerce sandboxes, sync cartridges, browse content and APIs, debug server-side scripts, and work with ISML—all without leaving VS Code.

See the [extension documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/) for setup and feature guides, or go directly to [connecting a B2C Commerce instance](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/configuration#connecting-to-a-b2c-instance).

[![Salesforce B2C Commerce activity bar showing the extension's developer tools](https://raw.githubusercontent.com/SalesforceCommerceCloud/b2c-developer-tooling/main/docs/vscode-extension/images/overview.png)](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/)

## Highlights
> **Marketplace publishing happens out of [`forcedotcom/b2c-dx`](https://github.com/forcedotcom/b2c-dx).** All extension development, issues, and pull requests stay in this monorepo; the `forcedotcom/b2c-dx` repo holds the marketplace landing page, governance files, and the workflows that publish each release to VS Code Marketplace and Open VSX. See [PUBLISHING.md](./PUBLISHING.md) for the publish flow and the manual fallback.

## Features (overview)

### Write B2C code with editor support

- ISML syntax highlighting, snippets, formatting, tag completion, diagnostics, and Emmet support
- Script API IntelliSense and hover documentation for `dw/*` modules without adding files to your workspace
- XSD-based validation, completion, and hover documentation for B2C metadata XML files
- Scaffolds for cartridges, controllers, hooks, jobs, Page Designer components, and other common project files

### Debug server-side scripts

Set breakpoints and log points, inspect variables, and step through cartridge controllers, jobs, hooks, custom scripts, and Custom APIs with the built-in B2C Script Debugger.

[![B2C Script Debugger](https://raw.githubusercontent.com/SalesforceCommerceCloud/b2c-developer-tooling/main/docs/vscode-extension/images/script-debugger.png)](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/script-debugger)

### Manage sandbox realms

Create, start, stop, restart, clone, extend, and delete on-demand sandboxes from the Sandbox Realm Explorer. Context menus adapt to each sandbox's current state.

[![Sandbox Realm Explorer](https://raw.githubusercontent.com/SalesforceCommerceCloud/b2c-developer-tooling/main/docs/vscode-extension/images/sandbox-explorer.png)](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/)

### Sync cartridges and manage code versions

Deploy cartridges on demand or watch local files and upload changes automatically. Compare local and remote files, download remote changes, and activate or remove code versions from the editor.

### Browse WebDAV and content libraries

Work with remote WebDAV files as if they were local. Browse Page Designer pages and components, filter large libraries, export content with or without assets, edit component XML, and import site archives.

[![Content Library Explorer](https://raw.githubusercontent.com/SalesforceCommerceCloud/b2c-developer-tooling/main/docs/vscode-extension/images/library-explorer.png)](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/)

### Explore SCAPI

Browse the SCAPI schemas available to your instance and try requests in an integrated Swagger UI. The extension handles authentication with your configured credentials.

[![SCAPI API Explorer](https://raw.githubusercontent.com/SalesforceCommerceCloud/b2c-developer-tooling/main/docs/vscode-extension/images/api-browser.png)](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/)

### Stay in the development flow

Tail sandbox logs into a VS Code output channel, install Commerce App Packages, manage jobs, and keep the active B2C instance visible in the status bar. Preview features such as Job History, site export, analytics, and guided onboarding can be enabled from the `b2c-dx.features.*` settings.

## Get started

1. Open a B2C Commerce project in VS Code.
2. Add a `dw.json` file at the project root or use an existing B2C CLI configuration. The project can be nested inside an open workspace folder.
3. Select the active instance from the cloud icon in the status bar.
4. Open an extension view from the activity bar or run an extension command from the Command Palette.

Different features require different credentials. WebDAV workflows can use a Business Manager username and access key, while sandbox and API workflows require OAuth configuration. See [Connecting to a B2C instance](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/configuration#connecting-to-a-b2c-instance) for the per-feature requirements and an example `dw.json`.

The [B2C CLI](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/installation) is optional. Install it when you want to run the same workflows from a terminal or CI environment.

## Requirements

- VS Code 1.105.1 or later
- Access to a Salesforce B2C Commerce instance for remote workflows
- The [Red Hat XML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml) for B2C metadata XML validation; the extension offers to install it when needed

## Documentation and support

- [Extension documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/)
- [Authentication setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication)
- [Configuration reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/configuration)
- [Report an issue](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues)
- [Release notes](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/packages/b2c-vs-extension/CHANGELOG.md)

## Telemetry

The extension sends anonymous lifecycle and broad feature-category events to help improve the product. It honors VS Code's global `telemetry.telemetryLevel` setting and can also be disabled with `b2c-dx.telemetry.enabled`.

## Contributing

Development, testing, and packaging instructions are available in [DEVELOPMENT.md](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/packages/b2c-vs-extension/DEVELOPMENT.md).

## License

Copyright (c) 2026, Salesforce, Inc. Licensed under the [Apache License 2.0](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt).
