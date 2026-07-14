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
  tagline: CLI, Agent Skills, MCP Server, and the B2C DX VS Code Extension for Salesforce Agentforce Commerce — everything you and your coding agent need to build, deploy, and operate B2C Commerce together.
  image:
    src: /hero-collage.png
    alt: Agentic B2C Developer Toolkit — CLI, Agentforce Vibes, and Claude Code
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Agent Skills + MCP
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
    title: VS Code Extension (Developer Preview)
    details: B2C DX activity-bar containers for sandbox lifecycle, cartridge code sync, WebDAV, content libraries, SCAPI, and a B2C script debugger — all driven by the same dw.json the CLI uses.
    link: /vscode-extension/
    linkText: VS Code Extension
---

<script setup>
import {data as vsxRelease} from './vscode-extension/release.data.ts';
</script>

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

## Install Agent Skills + MCP

Detailed setup: [Claude Code](/guide/install-skills#claude-code) · [Codex](/guide/install-skills#codex) · [Cursor](/guide/install-skills#cursor) · [Copilot](/guide/install-skills#copilot) · [Agentforce Vibes](/guide/install-skills#agentforce-vibes) · [All IDEs](/guide/install-skills)

::: code-group

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Use --scope project to install for current project only
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install storefront-next
# Install storefront-next-figma for Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
# Install b2c-dx-mcp if you want the MCP server installed
claude plugin install b2c-dx-mcp
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
copilot plugin install b2c-cli@b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
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

## Install the VS Code Extension <Badge type="warning" text="Developer Preview" />

The extension is not yet published to the VS Code Marketplace — install the latest pre-built `.vsix` from GitHub releases.

<div v-if="!vsxRelease.unavailable" class="b2c-vsx-install">
  <p>
    Latest release: <strong>{{ vsxRelease.version }}</strong>
    <span> · </span>
    <a :href="vsxRelease.vsixDownloadUrl">Download {{ vsxRelease.vsixAssetName }}</a>
    <span> · </span>
    <a :href="vsxRelease.releasePageUrl">Release notes</a>
  </p>
  <p>Then install with:</p>
  <pre><code>code --install-extension {{ vsxRelease.vsixAssetName }}
# or, in Cursor:
cursor --install-extension {{ vsxRelease.vsixAssetName }}</code></pre>
</div>
<div v-else>

Browse the [GitHub releases page]({{ vsxRelease.fallbackUrl }}) for `b2c-vs-extension@*` tags and install the `.vsix` via `code --install-extension <file>.vsix`.

</div>

Detailed setup: [Installation](/vscode-extension/installation) · [Configuration](/vscode-extension/configuration)

