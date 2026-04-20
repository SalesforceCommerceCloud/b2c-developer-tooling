# b2c-cli

Agent skills for driving the Salesforce B2C Commerce CLI — deploy cartridges, run jobs, manage On-Demand Sandboxes, stream logs, and perform WebDAV operations from your AI assistant.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.

## Installation

**Claude Code** and **GitHub Copilot CLI** both read the same `.claude-plugin/` marketplace:

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-cli@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-cli@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

**Codex:** open the repo as a workspace, restart Codex, then install from the **B2C Developer Tooling** marketplace in the plugin directory.

For file-copy install to any supported IDE, use `b2c setup skills b2c-cli`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for details.

## What's included

Skills covering the major B2C CLI surfaces:

- **`b2c-code`** — cartridge deploy, code version management, watch mode
- **`b2c-sandbox`** — On-Demand Sandbox lifecycle
- **`b2c-job`** — job execution and monitoring
- **`b2c-logs`** — log streaming and log file management
- **`b2c-webdav`** — WebDAV file operations
- **`b2c-site-import-export`** — site archive import/export
- **`b2c-config`** — CLI configuration, auth, and troubleshooting
- **`b2c-scapi-custom`** — SCAPI Custom API management

See [`skills/`](./skills/) for the full list.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
