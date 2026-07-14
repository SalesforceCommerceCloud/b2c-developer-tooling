---
description: Agentic B2C Developer Toolkit — AI agent skills, plugins, and the MCP server that teach Agentforce Vibes, Claude Code, Codex, Cursor, and GitHub Copilot the full B2C Commerce stack.
---

# Agent Skills + MCP

Turn your coding agent into a B2C Commerce specialist. **Skills** teach your agent how the platform works and which CLI commands to run; the **MCP server** adds project-aware tooling (live logs, debugging, scaffolding). Together they cover the full stack — storefront and headless development, operational workflows, and everything in between.

Skills follow the open [Agent Skills](https://agentskills.io/home) standard and work with Agentforce Vibes, Claude Code, Cursor, GitHub Copilot (VS Code and CLI), Codex, OpenCode, and others.

## Quick Start

Pick your tool and install the skill plugins. For full per-IDE detail, scopes, the MCP server, update/uninstall, and install locations, see **[Installing Agent Plugins](/guide/install-skills)**.

::: code-group

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install storefront-next
```

```bash [Codex]
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Then run /plugins, select the "B2C Developer Tooling" marketplace, and install.
```

```bash [Cursor]
# Cursor auto-discovers Claude Code / Codex skills, or install directly:
npx @salesforce/b2c-cli setup skills --ide cursor
```

```text [Copilot (VS Code)]
Command Palette (Cmd/Ctrl+Shift+P) → "Chat: Install Plugin from Source"
→ SalesforceCommerceCloud/b2c-developer-tooling
```

```bash [Copilot CLI]
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-cli@b2c-developer-tooling
```

```bash [Agentforce Vibes]
npx @salesforce/b2c-cli setup skills --ide agentforce-vibes
```

```bash [B2C CLI]
npx @salesforce/b2c-cli setup skills
```

:::

<a id="available-plugins"></a>

## Browse the Skills Catalog

Explore what your agent can do. Search by **keyword** and filter by **persona** (Developer, Operator/Admin), then open any skill to read exactly what it teaches. The best way to use these day to day is to [install the plugins](/guide/install-skills) — but you can also copy a one-click instruction from any card to have your agent fetch a single skill on demand.

<skills-catalog />

## Use Skills Without Installing

For everyday use, **[installing the plugins](/guide/install-skills) is the recommended path** — your agent gets every skill automatically and always has them in context.

If you can't install (a cold agent, a CI job, an ephemeral environment), every skill is also hosted as raw markdown your agent can fetch on demand. You don't run these commands yourself — you **paste the instruction to your AI assistant**, and it fetches and follows the skill.

Point your agent at the index to discover what's available:

```text
Use curl to download, read, and follow:
https://salesforcecommercecloud.github.io/b2c-developer-tooling/skills.txt
```

Or hand it a specific skill directly:

```text
Use curl to download, read, and follow:
https://salesforcecommercecloud.github.io/b2c-developer-tooling/skills/b2c-cli/skills/b2c-logs/SKILL.md
```

There is also a machine-readable [`skills-index.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/skills-index.json) listing every skill with its URL, persona, and tags.

::: tip Why `curl`, and why not WebFetch?
Skills are detailed operational instructions meant to be read **verbatim**. Summarizing fetch tools (like WebFetch) often drop critical flags and steps — `curl -sL` guarantees the full content. b2c-cli skills describe commands of the local `b2c` CLI, so your agent still needs it installed (`npm i -g @salesforce/b2c-cli`) to run them.
:::

## What Is a Skill?

A skill is a folder containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, and our taxonomy keys `persona`/`category`/`tags`) plus optional `references/`, `scripts/`, and `assets/`. Your agent reads the `description` to decide when a skill applies, then loads the body for step-by-step guidance. Skills are bundled into **plugins** you install from a marketplace or with the B2C CLI:

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
      <td>MCP server — automatic project type detection and B2C Commerce workflows for your AI assistant. See <a href="/mcp/installation">MCP Installation</a></td>
    </tr>
  </tbody>
</table>

## Persona Plugins

Beyond the per-area plugins above, some plugins target a specific **role** with higher-level **runbook** skills that orchestrate the underlying commands into a complete procedure.

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
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-operator/skills"><code>b2c-operator</code></a></td>
      <td>Operator/Admin runbooks for people who run instances — a safe <strong>production release &amp; rollback</strong> procedure and a <strong>production incident triage</strong> flow. These compose the <code>b2c-cli</code> commands (code, logs, debugger, analytics) into guided, guard-railed workflows.</td>
    </tr>
  </tbody>
</table>

::: tip Pair with the underlying commands
The operator runbooks orchestrate the `b2c` CLI, so install **`b2c-operator` alongside `b2c-cli`** (or the individual CLI skills) so your agent has the underlying commands available.
:::

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

## Next Steps

- **[Installing Agent Plugins](/guide/install-skills)** — full per-IDE setup (Claude Code, Codex, Cursor, Copilot, Agentforce Vibes), the MCP server, scopes, updates, and install locations.
- **[MCP Server](/mcp/)** — project-aware tooling that complements the skills.
- **[Setup Commands](/cli/setup)** — `b2c setup skills` reference.
