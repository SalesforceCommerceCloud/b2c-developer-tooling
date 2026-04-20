# b2c

Agent skills for Salesforce B2C Commerce development patterns — controllers, ISML, hooks, Custom APIs, services, Page Designer, and more.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.

## Installation

**Claude Code** and **GitHub Copilot CLI** both read the same `.claude-plugin/` marketplace:

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

**Codex:** open the repo as a workspace, restart Codex, then install from the **B2C Developer Tooling** marketplace in the plugin directory.

For file-copy install to any supported IDE, use `b2c setup skills b2c`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for details.

## What's included

Skills covering B2C Commerce development patterns:

- **`b2c-onboarding`** — first-time setup guide for new B2C Commerce developers
- **`b2c-controllers`** — SFRA controllers and routing
- **`b2c-isml`** — ISML template authoring
- **`b2c-custom-api-development`** — SCAPI Custom API contracts, implementations, mappings
- **`b2c-hooks`** — OCAPI and SCAPI hooks
- **`b2c-webservices`** — HTTP/SOAP/FTP services via the Service Framework
- **`b2c-metadata`** — object extensions, custom objects, site preferences
- **`b2c-page-designer`** — Page Designer components and types

See [`skills/`](./skills/) for the full list.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
