---
description: Agentic B2C Developer Toolkit — AI agent skills and plugins that teach Agentforce Vibes, Claude Code, Codex, Cursor, and GitHub Copilot the full B2C Commerce stack.
---

# Agent Skills & Plugins

Turn your coding agent into a B2C Commerce specialist. Skills cover the full platform — storefront and headless development, operational workflows, and everything in between — so your agent knows both how B2C Commerce works and which CLI commands to run.

Skills follow the open [Agent Skills](https://agentskills.io/home) standard and work with Agentforce Vibes, Claude Code, Cursor, GitHub Copilot (VS Code and CLI), Codex, OpenCode, and others.

## Quick Start

Pick your tool and install the skill plugins. For full per-IDE detail, scopes, update/uninstall, and install locations, see **[Installing Skills](/guide/install-skills)**.

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

## Browse the Skills Catalog

Every skill is tagged by **persona** (Developer, Operator/Admin), grouped into **categories**, and labeled with cross-cutting **tags** (SCAPI, SLAS, Page Designer, diagnostics, headless, and more). Click a persona, category, or tag to filter; copy a ready-to-run `curl` command for any skill, or all matching skills at once.

<skills-catalog />

## Fetch Skills Directly (for Agents & CI) {#fetch-skills-directly}

Every skill is hosted as raw, curl-able markdown — no install required. This is ideal for cold agents, CI jobs, or ephemeral environments that just need the guidance.

```bash
# The full machine-readable index (every skill with its URL, persona, and tags)
curl -sL https://salesforcecommercecloud.github.io/b2c-developer-tooling/skills-index.json

# A human/agent-readable index with copy-paste curl commands
curl -sL https://salesforcecommercecloud.github.io/b2c-developer-tooling/skills.txt

# A single skill (and any sibling references it links)
curl -sL https://salesforcecommercecloud.github.io/b2c-developer-tooling/skills/b2c-cli/skills/b2c-logs/SKILL.md
```

::: tip Use `curl -sL`, not a summarizing fetch
Skills are precise operational instructions — fetch them verbatim with `curl -sL`, not a tool that paraphrases or summarizes. b2c-cli skills describe commands of the local `b2c` CLI, so you still need it installed (`npm i -g @salesforce/b2c-cli`) to run them.
:::

## What Is a Skill?

A skill is a folder containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, and our taxonomy keys `persona`/`category`/`tags`) plus optional `references/`, `scripts/`, and `assets/`. Your agent reads the `description` to decide when a skill applies, then loads the body for step-by-step guidance. Skills are bundled into **plugins** you install from a marketplace or with the B2C CLI.

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
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-operator/skills"><code>b2c-operator</code></a></td>
      <td>Operator/Admin bundle — a curated set of the operational skills (deploys, sandboxes, jobs, logs, debugging, edge/MRT, access administration) drawn from across <code>b2c-cli</code> and <code>b2c</code>, for those who run instances rather than author feature code</td>
    </tr>
    <tr>
      <td><a href="/mcp/"><code>b2c-dx-mcp</code></a></td>
      <td>Automatic project type detection and B2C Commerce workflows for your AI assistant. See <a href="/mcp/installation">MCP Installation</a></td>
    </tr>
  </tbody>
</table>

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

- **[Installing Skills](/guide/install-skills)** — full per-IDE setup (Claude Code, Codex, Cursor, Copilot, Agentforce Vibes), scopes, updates, and install locations.
- **[MCP Server](/mcp/)** — project-aware tooling that complements the skills.
- **[Setup Commands](/cli/setup)** — `b2c setup skills` reference.
