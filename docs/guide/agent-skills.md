---
description: Agentic B2C Developer Toolkit — AI agent skills and plugins that teach Agentforce Vibes, Claude Code, Codex, Cursor, Gemini, Google Antigravity, and GitHub Copilot the full B2C Commerce stack.
---

# Agent Skills & Plugins

Turn your coding agent into a B2C Commerce specialist. Skills cover the full platform — storefront and headless development, operational workflows, and everything in between — so your agent knows both how B2C Commerce works and which CLI commands to run.

Skills follow the open [Agent Skills](https://agentskills.io/home) standard and work with Agentforce Vibes, Claude Code, Cursor, GitHub Copilot (VS Code and CLI), Gemini CLI, Google Antigravity (IDE/CLI/SDK), Codex, OpenCode, and others. Install from your IDE's plugin marketplace or the B2C CLI (`b2c setup skills`).

## Quick Start

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
# Cursor reads skills from .cursor/skills/, .agents/skills/, and from
# Claude Code / Codex skill paths (.claude/skills/, .codex/skills/).
# If you've already installed via the Claude Code marketplace, Cursor
# will auto-discover those skills. Otherwise, install with the B2C CLI:
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

```bash [Gemini CLI]
# One command installs the MCP server + project context:
gemini extensions install https://github.com/SalesforceCommerceCloud/b2c-developer-tooling

# Then add the agent skills (discovered from .gemini/skills):
npx @salesforce/b2c-cli setup skills b2c --ide gemini-cli
npx @salesforce/b2c-cli setup skills b2c-cli --ide gemini-cli
```

```bash [Antigravity]
# Google Antigravity (IDE/CLI/SDK) reads skills from .agents/skills:
npx @salesforce/b2c-cli setup skills b2c --ide antigravity
npx @salesforce/b2c-cli setup skills b2c-cli --ide antigravity
# For the MCP server on Antigravity, see /mcp/installation
```

```bash [Agentforce Vibes]
# Marketplace install coming soon. For now, use the B2C CLI:
npx @salesforce/b2c-cli setup skills --ide agentforce-vibes
```

```bash [B2C CLI]
npx @salesforce/b2c-cli setup skills
```

:::

## Available Plugins

<table>
  <colgroup>
    <col style="width: 12rem" />
    <col />
  </colgroup>
  <thead>
    <tr><th>Plugin</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-cli/skills"><code>b2c-cli</code></a></td>
      <td>B2C CLI commands and operations — code deployment, job execution, site archives, WebDAV, On-Demand Sandbox management</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c/skills"><code>b2c</code></a></td>
      <td>B2C Commerce development patterns — controllers, ISML, forms, localization, logging, metadata, web services, custom job steps, Page Designer, Business Manager extensions, Custom APIs</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/storefront-next/skills"><code>storefront-next</code></a></td>
      <td>Storefront Next development — project setup, routing, data fetching, components, Page Designer, authentication, i18n, extensions, testing, and deployment to Managed Runtime</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/storefront-next-figma/skills"><code>storefront-next-figma</code></a></td>
      <td>Figma design-kit workflows for Storefront Next verticals — duplicate the kit, sync brand variables from <code>brand.css</code>, edit components, and publish Code Connect. Requires the <a href="https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server">Figma MCP server</a></td>
    </tr>
    <tr>
      <td><a href="/mcp/"><code>b2c-dx-mcp</code></a></td>
      <td>Automatic project type detection and B2C Commerce workflows for your AI assistant. See <a href="/mcp/installation">MCP Installation</a></td>
    </tr>
  </tbody>
</table>

## Claude Code

Add the marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

Install plugins at your preferred scope:

::: code-group

```bash [User Scope (default)]
# Core: CLI + platform skills + MCP server
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install b2c-dx-mcp

# Storefront Next (only for Storefront Next projects)
claude plugin install storefront-next
# storefront-next-figma adds Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
```

```bash [Project Scope]
# Core: CLI + platform skills + MCP server
claude plugin install b2c-cli --scope project
claude plugin install b2c --scope project
claude plugin install b2c-dx-mcp --scope project

# Storefront Next (only for Storefront Next projects)
claude plugin install storefront-next --scope project
# storefront-next-figma adds Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma --scope project
```

:::

Verify, update, or uninstall:

```bash
claude plugin list
claude plugin marketplace update
claude plugin update b2c-cli@b2c-developer-tooling
claude plugin update storefront-next@b2c-developer-tooling
claude plugin uninstall b2c-cli@b2c-developer-tooling
claude plugin marketplace remove b2c-developer-tooling
```

## Codex

Add the marketplace:

```bash
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

Then in Codex run `/plugins`, select the **B2C Developer Tooling** marketplace, and select and install the desired plugins.

Codex does not yet support installing plugins from the command line — installs happen from the interactive `/plugins` picker. You can also point Codex at a local marketplace directory by running `codex plugin marketplace add <path-to-dir>`.

Upgrade or remove the marketplace later with:

```bash
codex plugin marketplace upgrade b2c-developer-tooling
codex plugin marketplace remove b2c-developer-tooling
```

> **Note:** The `b2c-dx-mcp` plugin is available only for Claude Code. For other clients, install the MCP server directly — see [MCP Installation](/mcp/installation).

> **Note:** The `storefront-next-figma` plugin requires the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) to be configured in your AI tool — its skills drive the Figma design kit (duplicating the kit, syncing brand variables, and publishing Code Connect) through Figma's MCP tools. Install it alongside `storefront-next` when you also manage the design system in Figma.

## Cursor

Cursor follows the open [Agent Skills](https://cursor.com/docs/skills) standard. Each skill is a folder containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, optional `paths` for glob scoping, and optional `disable-model-invocation`). Optional `scripts/`, `references/`, and `assets/` subdirectories live alongside `SKILL.md`.

### Skill Discovery Locations

Cursor automatically loads skills from these locations:

| Path                | Scope   | Source                    |
| ------------------- | ------- | ------------------------- |
| `.cursor/skills/`   | Project | Native Cursor             |
| `.agents/skills/`   | Project | Native Cursor             |
| `~/.cursor/skills/` | User    | Native Cursor             |
| `~/.agents/skills/` | User    | Native Cursor             |
| `.claude/skills/`   | Project | Claude Code compatibility |
| `~/.claude/skills/` | User    | Claude Code compatibility |
| `.codex/skills/`    | Project | Codex compatibility       |
| `~/.codex/skills/`  | User    | Codex compatibility       |

Because Cursor reads from Claude Code and Codex paths too, **any plugin you've already installed via `claude plugin install` or `codex plugin install` is automatically picked up by Cursor** — no separate install needed.

### Install with the B2C CLI

::: code-group

```bash [Project Scope]
b2c setup skills b2c --ide cursor
b2c setup skills b2c-cli --ide cursor
b2c setup skills storefront-next --ide cursor
```

```bash [User Scope]
b2c setup skills b2c --ide cursor --global
b2c setup skills b2c-cli --ide cursor --global
b2c setup skills storefront-next --ide cursor --global
```

:::

This writes skills to `.cursor/skills/` (project) or `~/.cursor/skills/` (user). For monorepos, a `.cursor/skills/` folder placed in a nested project directory is auto-scoped to files within that directory — no `paths` field required in `SKILL.md`.

### Reuse Claude Code Plugin Installs

If you also use Claude Code, install once and Cursor will see the same skills:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling

# Core: CLI + platform skills + MCP server
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install b2c-dx-mcp

# Storefront Next (only for Storefront Next projects)
claude plugin install storefront-next
# storefront-next-figma adds Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
```

## Copilot

GitHub Copilot supports skills in both VS Code and the Copilot CLI.

### Copilot (VS Code)

In VS Code, open the Command Palette (Cmd/Ctrl+Shift+P) and run **Chat: Install Plugin from Source**, then enter:

```
SalesforceCommerceCloud/b2c-developer-tooling
```

::: tip Updating Copilot skills in VS Code
To pull the latest skills, open the **Extensions** view, click the **`···`** menu, and select **Check for Extension Updates**.
:::

### Copilot CLI

```bash
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling

# Core: CLI + platform skills
copilot plugin install b2c-cli@b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
# For the MCP server on Copilot, install it directly — see /mcp/installation

# Storefront Next (only for Storefront Next projects)
copilot plugin install storefront-next@b2c-developer-tooling
copilot plugin install storefront-next-figma@b2c-developer-tooling
```

::: warning Microsoft Copilot desktop app is not the same product
The **Microsoft 365 / Microsoft Copilot desktop app** for Mac and Windows is a productivity assistant — it does **not** run local MCP servers or read repo Agent Skills (its extensibility is limited to tenant-published agents and connected apps). For B2C Commerce development, use **GitHub Copilot in VS Code** or the **Copilot CLI** above; those are GitHub Copilot's desktop surfaces and both are supported here.
:::

## Gemini

Skills and the `b2c-dx-mcp` MCP server work with **Gemini CLI** and **Gemini Code Assist** (VS Code / JetBrains).

### Gemini CLI

The fastest path is the Gemini CLI extension, which bundles the MCP server and B2C project context (`GEMINI.md`) in a single install:

```bash
gemini extensions install https://github.com/SalesforceCommerceCloud/b2c-developer-tooling
```

Update or remove it later with:

```bash
gemini extensions update b2c-developer-tooling
gemini extensions uninstall b2c-developer-tooling
```

The extension does **not** bundle the agent skills (the repo's skills are plugin-grouped, not laid out at the extension root). Install them with the B2C CLI — they land in the directories Gemini CLI discovers automatically:

::: code-group

```bash [Project Scope]
b2c setup skills b2c --ide gemini-cli
b2c setup skills b2c-cli --ide gemini-cli
```

```bash [User Scope]
b2c setup skills b2c --ide gemini-cli --global
b2c setup skills b2c-cli --ide gemini-cli --global
```

:::

This writes to `.gemini/skills/` (project) or `~/.gemini/skills/` (user). Gemini CLI also reads `.agents/skills/`.

### Gemini Code Assist (VS Code / JetBrains)

Gemini Code Assist shares configuration with the Gemini CLI. In **VS Code**, once you've installed the extension (or added the MCP server to `~/.gemini/settings.json`), the `b2c-dx-mcp` tools are available in agent mode. In **JetBrains**, configure the MCP server via the IDE's MCP settings and use `GEMINI.md` / `AGENT.md` for context. See [MCP Installation](/mcp/installation) for the exact server configuration.

::: warning Gemini desktop app (Mac/Windows) is not supported
The standalone **Gemini app** for Mac and Windows is a consumer assistant. It supports only Gems and Google-curated connected apps — it does **not** run local MCP servers or read repo Agent Skills. For B2C Commerce development, use **Gemini CLI**, **Gemini Code Assist**, or **Google Antigravity** instead.
:::

## Google Antigravity

[Google Antigravity](https://antigravity.google/) is an agent-first development platform available as an **IDE**, a **CLI**, and a **Python SDK**. It implements the same open [Agent Skills](https://antigravity.google/docs/skills) standard (`SKILL.md` folders) and supports MCP servers over stdio, so the B2C skills and `b2c-dx-mcp` work across all three surfaces.

Install the skills with the B2C CLI:

::: code-group

```bash [Project Scope]
b2c setup skills b2c --ide antigravity
b2c setup skills b2c-cli --ide antigravity
```

```bash [User Scope]
b2c setup skills b2c --ide antigravity --global
b2c setup skills b2c-cli --ide antigravity --global
```

:::

This writes to `.agents/skills/` (workspace) or `~/.gemini/config/skills/` (global) — the locations Antigravity discovers. For the `b2c-dx-mcp` MCP server, add it to `.agents/mcp_config.json` (workspace) or `~/.gemini/config/mcp_config.json` (global); see [MCP Installation](/mcp/installation).

## B2C CLI

Interactive — select skillsets and IDEs:

```bash
b2c setup skills
```

List available skills:

```bash
b2c setup skills b2c --list
b2c setup skills b2c-cli --list
b2c setup skills storefront-next --list
b2c setup skills storefront-next-figma --list
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

## Agentforce Vibes

See [Skills in Agentforce Vibes](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/skills.html) for platform details.

```bash
b2c setup skills b2c --ide agentforce-vibes
b2c setup skills b2c-cli --ide agentforce-vibes
b2c setup skills b2c --ide agentforce-vibes --global
```

## Other IDEs

::: tip
Use [`b2c setup skills`](/cli/setup) for any supported IDE.
:::

| IDE                                                                                        | Flag                |
| ------------------------------------------------------------------------------------------ | ------------------- |
| [Cursor](https://cursor.com/docs/skills)                                                   | `--ide cursor`      |
| [Windsurf](https://docs.windsurf.com/)                                                     | `--ide windsurf`    |
| [VS Code / Copilot](https://code.visualstudio.com/docs/copilot/customization/agent-skills) | `--ide vscode`      |
| [Codex CLI](https://github.com/openai/codex)                                               | `--ide codex`       |
| [OpenCode](https://opencode.ai/)                                                           | `--ide opencode`    |
| [Gemini CLI](https://google-gemini.github.io/gemini-cli/)                                  | `--ide gemini-cli`  |
| [Google Antigravity](https://antigravity.google/docs/skills)                               | `--ide antigravity` |

### Manual Installation

Install to `.agents/skills/` (default) or a custom directory:

```bash
b2c setup skills b2c --ide manual
b2c setup skills b2c --ide manual --directory ./my-skills
```

For reference, the install locations each `--ide` flag writes to:

| IDE                | Project             | User                          |
| ------------------ | ------------------- | ----------------------------- |
| Cursor             | `.cursor/skills/`   | `~/.cursor/skills/`           |
| Windsurf           | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| VS Code / Copilot  | `.github/skills/`   | `~/.copilot/skills/`          |
| Codex CLI          | `.codex/skills/`    | `~/.codex/skills/`            |
| OpenCode           | `.opencode/skills/` | `~/.config/opencode/skills/`  |
| Gemini CLI         | `.gemini/skills/`   | `~/.gemini/skills/`           |
| Google Antigravity | `.agents/skills/`   | `~/.gemini/config/skills/`    |
| Agentforce Vibes   | `.a4drules/skills/` | IDE's global storage          |

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
- "Set up a new Storefront Next project"
- "Add a new route with a loader to my Storefront Next app"
- "Deploy my Storefront Next storefront to Managed Runtime"
- "Add Page Designer support to my storefront component"
