---
description: Agentic B2C Developer Toolkit — CLI, Agent Skills, MCP Server, SDK, and IDE extensions for Salesforce B2C Commerce.
layout: b2c-home
isHome: true

hero:
  name: Agentic B2C Developer Toolkit
  text: ''
  tagline: CLI, Agent Skills, MCP Server, and the Salesforce B2C Commerce VS Code Extension — everything you and your coding agent need to build, deploy, and operate B2C Commerce together.
  image:
    src: /hero-collage.png
    alt: Agentic B2C Developer Toolkit — CLI, Agentforce Vibes, and Claude Code
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Agent Plugins
      link: /guide/agent-skills
    - theme: alt
      text: VS Code
      link: /vscode-extension/
    - theme: alt
      text: MCP
      link: /mcp/

features:
  - icon:
      src: /icons/cli.svg
      width: 48
      height: 48
    title: CLI for Every Workflow
    details: Deploy cartridges, run jobs, manage ODS and MRT, import/export site archives, work with WebDAV, and automate CI/CD — all from the terminal. The foundation everything else builds on.
    link: /guide/
    linkText: Get started
  - icon:
      src: /icons/skills.svg
      width: 48
      height: 48
    title: Coding Skills for Your AI Agent
    details: 30+ preconfigured skills teach Claude Code, Cursor, Agentforce Vibes, Copilot, and Codex how B2C Commerce works — SCAPI, SLAS, SFRA, ISML, Page Designer, hooks, custom objects — and which CLI commands to run when.
    link: /guide/agent-skills
    linkText: Install skills
  - icon:
      src: /icons/mcp.svg
      width: 48
      height: 48
    title: MCP Server
    details: A focused set of MCP tools that complement the CLI for agent-driven workflows. Pairs naturally with skills.
    link: /mcp/
    linkText: MCP Server
  - icon:
      src: /icons/cli.svg
      width: 48
      height: 48
    title: VS Code Extension
    details: Activity-bar tools for sandbox lifecycle, cartridge code sync, WebDAV, content libraries, SCAPI, and a B2C script debugger — all driven by the same dw.json the CLI uses.
    link: /vscode-extension/
    linkText: VS Code Extension
---

## Install the CLI

::: code-group

```bash [npm]
npm install -g @salesforce/b2c-cli
```

```bash [npx]
npx @salesforce/b2c-cli --help
```

```bash [Homebrew]
brew install SalesforceCommerceCloud/tools/b2c-cli
```

:::

## Install Agent Plugins

Detailed setup: [Claude Code](/guide/agent-skills#claude-code) · [Codex](/guide/agent-skills#codex) · [Cursor](/guide/agent-skills#cursor) · [Copilot](/guide/agent-skills#copilot) · [Agentforce Vibes](/guide/agent-skills#agentforce-vibes) · [All IDEs](/guide/agent-skills)

::: code-group

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Use --scope project to install for current project only

# Core: CLI + platform skills + MCP server
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install b2c-dx-mcp

# Storefront Next (only for Storefront Next projects)
claude plugin install storefront-next
# storefront-next-figma adds Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
```

```bash [Codex]
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Then in Codex, run /plugins, select the "B2C Developer Tooling"
# marketplace, and select and install the desired plugins.
```

```bash [Cursor]
# Cursor auto-loads skills from Claude Code paths — if you've already
# installed via `claude plugin install`, Cursor picks them up too.
# Otherwise, install directly to .cursor/skills/:
npx @salesforce/b2c-cli setup skills --ide cursor
```

```text [Copilot (VS Code)]
In VS Code, open the Command Palette (Cmd/Ctrl+Shift+P) and run:
  Chat: Install Plugin from Source
Then enter:
  SalesforceCommerceCloud/b2c-developer-tooling
```

```bash [Copilot CLI]
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling

# Core: CLI + platform skills
copilot plugin install b2c-cli@b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
# For the MCP server on Copilot, install it directly — see /mcp/installation

# Storefront Next (only for Storefront Next projects)
copilot plugin install storefront-next@b2c-developer-tooling
copilot plugin install storefront-next-figma@b2c-developer-tooling
```

```bash [Agentforce Vibes]
# Marketplace install coming soon. For now, use the B2C CLI:
npx @salesforce/b2c-cli setup skills --ide agentforce-vibes
```

```bash [B2C CLI]
npx @salesforce/b2c-cli setup skills
```

:::

## Install the VS Code Extension

Install [Salesforce B2C Commerce](https://marketplace.visualstudio.com/items?itemName=Salesforce.b2c-vs-extension) from the Visual Studio Marketplace or run:

```bash
code --install-extension Salesforce.b2c-vs-extension
```

Detailed setup: [Installation](/vscode-extension/installation) · [Configuration](/vscode-extension/configuration)
