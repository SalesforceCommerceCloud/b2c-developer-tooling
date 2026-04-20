---
description: Developer tools for Salesforce B2C Commerce — CLI, MCP Server, Agent Skills, and SDK. Build and operate B2C Commerce from the terminal or with AI coding agents.
layout: b2c-home
isHome: true

hero:
  name: B2C DX
  text: Developer tools for Salesforce B2C Commerce
  tagline: The full power of B2C Commerce, available as a CLI, Agent Skills, and IDE extensions — so you and your coding agent can build, deploy, and operate together.
  image:
    src: /hero-collage.png
    alt: B2C DX — CLI, Agentforce Vibes, and Claude Code
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Agent Skills
      link: /guide/agent-skills
    - theme: alt
      text: MCP Server
      link: /mcp/
    - theme: alt
      text: Reference
      link: /cli/

features:
  - icon: "\u26A1"
    title: CLI for Every Workflow
    details: Deploy cartridges, run jobs, manage ODS and MRT, import/export site archives, work with WebDAV, and automate CI/CD — all from the terminal. The foundation everything else builds on.
    link: /cli/
    linkText: CLI reference
  - icon: "\U0001F9E0"
    title: Coding Skills for Your AI Agent
    details: 30+ preconfigured skills teach Claude Code, Cursor, Agentforce Vibes, Copilot, and Codex how B2C Commerce works — SCAPI, SLAS, SFRA, ISML, Page Designer, hooks, custom objects — and which CLI commands to run when.
    link: /guide/agent-skills
    linkText: Install skills
  - icon: "\U0001F916"
    title: MCP Server
    details: A focused set of MCP tools that complement the CLI for agent-driven workflows. Pairs naturally with skills.
    link: /mcp/
    linkText: MCP Server
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

## Install Agent Skills

Detailed setup: [Agentforce Vibes](/guide/agent-skills#installation-with-agentforce-vibes) · [Claude Code](/guide/agent-skills#install-claude-plugin) · [Copilot](/guide/agent-skills#installation-with-other-ides) · [Codex](/guide/agent-skills#installation-with-other-ides) · [All IDEs](/guide/agent-skills)

::: code-group

```bash [Agentforce Vibes]
# Marketplace install coming soon. For now, use the B2C CLI:
npx @salesforce/b2c-cli setup skills --ide agentforce-vibes
```

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Use --scope user to install globally (available in all projects)
claude plugin install b2c-cli --scope project
claude plugin install b2c --scope project
```

```text [Copilot (VS Code)]
In VS Code, open the Command Palette (Cmd/Ctrl+Shift+P) and run:
  Chat: Install Plugin from Source
Then enter:
  SalesforceCommerceCloud/b2c-developer-tooling
```

```bash [Copilot CLI]
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-cli@b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
```

```bash [Codex]
# Marketplace install coming soon. For now, use the B2C CLI:
npx @salesforce/b2c-cli setup skills --ide codex
```

```bash [B2C CLI]
npx @salesforce/b2c-cli setup skills
```

:::
