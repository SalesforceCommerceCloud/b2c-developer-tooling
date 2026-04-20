---
description: AI agent skills and plugins for Salesforce B2C Commerce — teach Agentforce Vibes, Claude Code, Codex, Cursor, and GitHub Copilot the full B2C Commerce stack.
---

# Agent Skills & Plugins

Turn your coding agent into a B2C Commerce specialist. Skills give Claude Code, Cursor, Agentforce Vibes, Copilot, and Codex deep platform expertise across the full stack — **SCAPI Custom APIs, SLAS authentication, SFRA controllers and forms, ISML, Page Designer, hooks, custom objects, custom job steps, web services** — and operational workflows like **deploying cartridges, running jobs, debugging 404s and logs, managing On-Demand Sandboxes, MRT/PWA Kit, eCDN, site archives, and IMPEX metadata XML**.

Skills follow the open [Agent Skills](https://agentskills.io/home) standard and work with [Agentforce Vibes](#installation-with-agentforce-vibes), [Claude Code](https://claude.ai/code), Cursor, GitHub Copilot, VS Code, Codex, OpenCode, and others. Skills teach your agent how B2C Commerce works and which B2C CLI commands to run and when — the CLI does the actual work against your instance.

Install from your IDE's plugin system (Claude Code below), the B2C CLI (`b2c setup skills`), or by dropping skills into your IDE's skills directory manually.

## Quick Start

Install via your IDE's plugin marketplace where supported — otherwise use the B2C CLI installer:

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

For additional IDEs (Agentforce Vibes, Cursor, Windsurf, OpenCode) and full B2C CLI options see [Installation with B2C CLI](#installation-with-b2c-cli), [Installation with Agentforce Vibes](#installation-with-agentforce-vibes), or [Installation with Other IDEs](#installation-with-other-ides).

## Available Plugins

<table>
  <colgroup>
    <col style="width: 12rem" />
    <col style="width: 6rem" />
    <col />
  </colgroup>
  <thead>
    <tr><th>Plugin</th><th>Type</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-cli/skills"><code>b2c-cli</code></a></td>
      <td>Skills</td>
      <td>B2C CLI commands and operations — code deployment, job execution, site archives, WebDAV, On-Demand Sandbox management</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c/skills"><code>b2c</code></a></td>
      <td>Skills</td>
      <td>B2C Commerce development patterns — controllers, ISML, forms, localization, logging, metadata, web services, custom job steps, Page Designer, Business Manager extensions, Custom APIs</td>
    </tr>
    <tr>
      <td><a href="/mcp/"><code>b2c-dx-mcp</code></a></td>
      <td>MCP</td>
      <td>MCP server for AI-assisted B2C Commerce development with project-aware tooling. See <a href="/mcp/installation">MCP Installation</a></td>
    </tr>
  </tbody>
</table>

## Install Claude Plugin

Add the marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

Install plugins at your preferred scope:

::: code-group

```bash [Project Scope]
claude plugin install b2c-cli --scope project
claude plugin install b2c --scope project
claude plugin install b2c-dx-mcp --scope project
```

```bash [User Scope]
claude plugin install b2c-cli --scope user
claude plugin install b2c --scope user
claude plugin install b2c-dx-mcp --scope user
```

:::

Verify, update, or uninstall:

```bash
claude plugin list
claude plugin marketplace update
claude plugin update b2c-cli@b2c-developer-tooling
claude plugin uninstall b2c-cli@b2c-developer-tooling
claude plugin marketplace remove b2c-developer-tooling
```

## Installation with B2C CLI

Interactive — select skillsets and IDEs:

```bash
b2c setup skills
```

List available skills:

```bash
b2c setup skills b2c --list
b2c setup skills b2c-cli --list
```

Install to specific IDEs:

::: code-group

```bash [Project Scope]
b2c setup skills b2c --ide cursor
b2c setup skills b2c-cli --ide windsurf
b2c setup skills b2c --ide cursor --ide windsurf
```

```bash [User Scope]
b2c setup skills b2c --ide cursor --global
b2c setup skills b2c-cli --ide vscode --global
```

:::

Install specific skills only:

```bash
b2c setup skills b2c-cli --skill b2c-code --skill b2c-webdav --ide cursor
```

Update existing skills:

```bash
b2c setup skills b2c --ide cursor --update
```

Non-interactive (CI/CD):

```bash
b2c setup skills b2c-cli --ide cursor --global --force
```

See [Setup Commands](/cli/setup) for full documentation.

## Installation with Agentforce Vibes

See [Skills in Agentforce Vibes](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/skills.html) for platform details.

```bash
b2c setup skills b2c --ide agentforce-vibes
b2c setup skills b2c-cli --ide agentforce-vibes
b2c setup skills b2c --ide agentforce-vibes --global
```

Manual install directories:

| Location | Scope |
|----------|-------|
| `.a4drules/skills/` | Project |
| `~/Library/Application Support/Code/User/globalStorage` | Global (macOS) |
| `~/.config/Code/User/globalStorage` | Global (Linux) |
| `%APPDATA%\Code\User\globalStorage` | Global (Windows) |

## Installation with Other IDEs

::: tip
Use [`b2c setup skills`](/cli/setup) for any supported IDE.
:::

| IDE | Flag | Project | User |
|-----|------|---------|------|
| [Cursor](https://cursor.com/docs/context/skills) | `--ide cursor` | `.cursor/skills/` | `~/.cursor/skills/` |
| [Windsurf](https://docs.windsurf.com/) | `--ide windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| [VS Code / Copilot](https://code.visualstudio.com/docs/copilot/customization/agent-skills) | `--ide vscode` | `.github/skills/` | `~/.copilot/skills/` |
| [Codex CLI](https://github.com/openai/codex) | `--ide codex` | `.codex/skills/` | `~/.codex/skills/` |
| [OpenCode](https://opencode.ai/) | `--ide opencode` | `.opencode/skills/` | `~/.config/opencode/skills/` |

### Manual Installation

Install to `.agents/skills/` (default) or a custom directory:

```bash
b2c setup skills b2c --ide manual
b2c setup skills b2c --ide manual --directory ./my-skills
```

Or download skill zips from the [latest release](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases/latest):

```bash
curl -LO https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases/latest/download/b2c-cli-skills.zip
curl -LO https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases/latest/download/b2c-skills.zip
unzip b2c-cli-skills.zip -d /path/to/your/ide/skills/
unzip b2c-skills.zip -d /path/to/your/ide/skills/
```

## Usage Examples

Once installed, ask your AI assistant:

- "Deploy the cartridges in ./cartridges to my sandbox"
- "List all code versions on my instance and show which one is active"
- "Run the reindex job on my sandbox"
- "Download the latest log files from my instance"
- "Create a new On-Demand Sandbox with TTL of 48 hours"
- "Help me create a Custom API for loyalty information"
- "Add logging to my checkout controller"
- "Create an HTTP service to call the payment gateway API"
