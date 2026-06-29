# storefront-next-figma

Agent skills for keeping a Salesforce B2C **Storefront Next** project in sync with its **Figma** design kit — duplicate the official kit for a new vertical, sync Brand variable collections from `brand.css`, edit components at the correct layer, and publish Figma Code Connect mappings.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace. This is the design-kit companion to the [`storefront-next`](../storefront-next) plugin — use them together when theming a vertical.

## ⚠️ Prerequisite: Figma MCP server

**These skills require the [Figma MCP server](https://www.figma.com/developers) to be configured in your AI tool.** The workflow reads and edits Figma files through MCP tools. Without it, the skill can only act as a manual checklist.

Before using this plugin:

1. Add the Figma MCP server to your AI tool's MCP configuration (see your IDE's MCP docs).
2. Have a Figma URL with a `node-id` parameter for the frame or component you want to work with — in Figma, right-click a frame → **Copy/Paste as → Copy link**; the URL contains `node-id=<value>`.
3. Confirm you have edit access to the target Figma file.

If the Figma MCP server is not connected, stop and configure it first.

## Installation

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install storefront-next-figma@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install storefront-next-figma@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

**Codex:** open the repo as a workspace, restart Codex, then install from the **B2C Developer Tooling** marketplace in the plugin directory.

For file-copy install to any supported IDE, use `b2c setup skills storefront-next-figma`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for details.

## What's included

- **`sfnext-create-figma-kit`** — duplicate the official Storefront Next Figma kit for a new vertical, update Brand variables from `src/theme/tokens/brand.css`, edit components at the correct layer (primitive vs composition), and publish Code Connect stubs

See [`skills/`](./skills/) for the full list.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
