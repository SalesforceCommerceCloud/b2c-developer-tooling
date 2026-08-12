---
description: Introduction to the Agentic B2C Developer Toolkit — CLI, Agent Skills, MCP Server, VS Code extension, and SDK for Salesforce Agentforce Commerce.
---

# Introduction

The Agentic B2C Developer Toolkit exposes the B2C Commerce platform as commands, MCP tools, and coding skills — so you and your AI agents can build, deploy, and operate storefronts from the terminal or directly inside your IDE. No clicking through Business Manager to deploy, no context-switching to run a job, no manual copy-paste when your agent needs to touch a live sandbox.

- **B2C CLI** — a single command for every workflow: cartridge deploys, jobs, ODS/MRT, WebDAV, site archives, SLAS, eCDN, Account Manager, CI/CD.
- **Agent Skills** — 30+ preconfigured skills that teach your coding agent (Claude Code, Cursor, Agentforce Vibes, Copilot, Codex) how B2C Commerce works — SCAPI Custom APIs, SLAS, SFRA controllers and forms, ISML, Page Designer, hooks, custom objects — and which CLI commands to run when.
- **MCP Server** — a focused set of MCP tools that complement the CLI for agent-driven workflows.
- **VS Code Extension** — sandbox management, cartridge code sync, content libraries, SCAPI explorer, and a server-side script debugger right inside VS Code.
- **Tooling SDK** — everything the CLI does, available as a typed TypeScript SDK for custom integrations.

## Quick CLI Install

::: code-group

```bash [npm]
npm install -g @salesforce/b2c-cli
```

```bash [npx]
npx @salesforce/b2c-cli --help
```

```bash [Homebrew]
brew install salesforcecommercecloud/tools/b2c-cli
```

:::

See the [CLI Installation Guide](./installation) for more installation options.

## Quick MCP Install

The B2C DX MCP Server enables AI assistants to help with B2C Commerce development tasks.

### Claude Code (Project Scope)

1. Open your project root in Claude Code.
2. Install the plugin marketplace entry:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp --scope project
```

### Cursor (Project Scope)

1. Open your project root.
2. Create or edit `.cursor/mcp.json`.
3. Add this entry under `mcpServers` (merge with existing config, do not replace the full file):

```json
"b2c-dx-mcp": {
  "command": "npx",
  "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
}
```

### GitHub Copilot (Project Scope)

1. Open your project root.
2. Create or edit `.vscode/mcp.json`.
3. Add this entry under `servers` (merge with existing config, do not replace the full file):

```json
"b2c-dx-mcp": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
}
```

See the [MCP Server Installation Guide](/mcp/installation) for full setup steps and troubleshooting.

## Quick VS Code Extension Install

The Salesforce B2C Commerce VS Code Extension brings sandbox management, code sync, content libraries, the SCAPI explorer, and a server-side debugger into VS Code. Open the Extensions view in your editor and search for **Salesforce B2C Commerce** — VS Code installs from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Salesforce.b2c-vs-extension), while Cursor, VSCodium, Windsurf, and other VS Code–compatible editors install from the [Open VSX Registry](https://open-vsx.org/extension/salesforce/b2c-vs-extension).

See the [VS Code Extension](/vscode-extension/) section for the full overview, [installation](/vscode-extension/installation), and [configuration](/vscode-extension/configuration).

## Next Steps

- [Authentication Setup](./authentication) - Set up Account Manager, OCAPI, and WebDAV
- [Analytics Reports (CIP/CCAC)](./analytics-reports-cip-ccac) - Run curated analytics reports and SQL queries
- [Configuration](./configuration) - Configure instances and credentials
- [IDE Integration](./ide-integration) - Connect third-party IDE tooling to B2C CLI configuration and enable Script API IntelliSense
- [MCP Server](/mcp/) - AI-assisted development with Model Context Protocol
- [VS Code Extension](/vscode-extension/) - Sandbox management, code sync, and the script debugger inside VS Code
- [CLI Reference](/cli/) - Browse available commands
- [MCP Tools](/mcp/toolsets) - Explore MCP tools for cartridges, MRT, SCAPI, and so on
- [SDK Reference](/api/) - Explore the SDK
