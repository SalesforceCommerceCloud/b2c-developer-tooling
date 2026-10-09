---
description: Introduction to the Agentic B2C Developer Toolkit — CLI, Agent Skills, MCP Server, IDE extension, and SDK for Salesforce B2C Commerce.
---

# Introduction

The Agentic B2C Developer Toolkit helps you and your AI assistant build, deploy, and operate Salesforce B2C Commerce from your terminal or IDE.

- **B2C CLI** — commands for cartridge deployment, jobs, sandboxes, Managed Runtime, WebDAV, and administration.
- **MCP Server** — documentation, skills, debugging, deployment, and B2C Commerce API access for your AI assistant.
- **Agent Skills** — B2C Commerce, B2C CLI, and Storefront Next guidance, included with the MCP or available as standalone plugins.
- **IDE Extension** — sandbox management, cartridge code sync, content libraries, SCAPI explorer, and a server-side script debugger.
- **Tooling SDK** — typed TypeScript APIs for custom integrations and automation.

## CLI Install

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

See the [CLI Installation Guide](./installation) for more options and [Configuration](./configuration) to set up your projects and instances.

## MCP Install

Choose your assistant. Use the **B2C MCP plugin** where supported.

<!--@include: ../_partials/mcp-plugin-install.md-->

Start a new session in your project. For **Copilot in VS Code**, other clients,
and manual setup, see [installation](../mcp/#setup).

Documentation and skills work immediately without B2C Commerce credentials.
Connected tasks use your [existing B2C configuration](../mcp/configuration).

The MCP includes the B2C Commerce, B2C CLI, and Storefront Next skills from our
[agent skills plugins](./agent-skills). No need to install those skills plugins separately.

## IDE Extension Install

The Salesforce B2C Commerce IDE Extension brings sandbox management, code sync, content libraries, the SCAPI explorer, and a server-side debugger into VS Code, Cursor, and other compatible editors. Open the Extensions view in your editor and search for **Salesforce B2C Commerce** — VS Code installs from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Salesforce.b2c-vs-extension), while Cursor, VSCodium, Windsurf, and other VS Code–compatible editors install from the [Open VSX Registry](https://open-vsx.org/extension/salesforce/b2c-vs-extension).

See the [IDE Extension](/vscode-extension/) section for the full overview, [installation](/vscode-extension/installation), and [configuration](/vscode-extension/configuration).

## Next Steps

- [Authentication](./authentication) — Set up credentials for connected tasks.
- [Configuration](./configuration) — Configure projects and named instances.
- [Guides](./workflows) — Find development, deployment, and administration workflows.
- [CLI Reference](../cli/) — Browse commands and options.
- [MCP Tools](../mcp/toolsets) — Explore available tools and toolsets.
- [SDK](../api/) — Build custom integrations.
