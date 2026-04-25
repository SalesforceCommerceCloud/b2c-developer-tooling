---
description: Agentic B2C Developer Toolkit — CLI, Agent Skills, MCP Server, SDK, and IDE extensions for Salesforce B2C Commerce.
layout: b2c-home
isHome: true

renameNotice:
  title: Formerly B2C DX
  text: "The project previously known as B2C DX (B2C Developer Tooling) is now the Agentic B2C Developer Toolkit. The CLI package name (@salesforce/b2c-cli), commands, and configuration remain the same."

hero:
  name: Agentic B2C Developer Toolkit
  text: ""
  tagline: CLI, Agent Skills, MCP Server, and IDE extensions for Salesforce Agentforce Commerce — everything you and your coding agent need to build, deploy, and operate B2C Commerce together.
  image:
    src: /hero-collage.png
    alt: Agentic B2C Developer Toolkit — CLI, Agentforce Vibes, and Claude Code
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

Detailed setup: [Claude Code](/guide/agent-skills#claude-code) · [Codex](/guide/agent-skills#codex) · [Copilot](/guide/agent-skills#other-ides) · [Agentforce Vibes](/guide/agent-skills#agentforce-vibes) · [All IDEs](/guide/agent-skills)

::: code-group

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Use --scope project to install for current project only
claude plugin install b2c-cli
claude plugin install b2c
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
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Then in Codex, run /plugins, select the "B2C Developer Tooling"
# marketplace, and select and install the desired plugins.
```

```bash [Agentforce Vibes]
# Marketplace install coming soon. For now, use the B2C CLI:
npx @salesforce/b2c-cli setup skills --ide agentforce-vibes
```


```bash [B2C CLI]
npx @salesforce/b2c-cli setup skills
```

:::

