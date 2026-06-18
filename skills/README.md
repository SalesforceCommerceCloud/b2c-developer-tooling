# B2C Agent Skills & Plugins

This directory contains the agent skills and skills-based plugins that turn an AI coding agent into a Salesforce B2C Commerce specialist — covering storefront and headless development, operational CLI workflows, and the Figma design-system layer.

These skills follow the open [Agent Skills](https://agentskills.io/home) standard and work with multiple agentic tools including Claude Code, Cursor, GitHub Copilot (VS Code and CLI), OpenAI Codex, OpenCode, and Salesforce Agentforce Vibes.

> **Full user documentation:** [Agent Skills & Plugins guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills). This README is the contributor-facing overview of what lives in this directory.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [`b2c`](./b2c) | B2C Commerce development patterns — controllers, ISML, forms, hooks, localization, logging, metadata, web services, custom job steps, custom objects/caches, Page Designer, Business Manager extensions, SCAPI/Custom APIs, querying, ordering, and SLAS auth patterns |
| [`b2c-cli`](./b2c-cli) | B2C CLI commands and operations — code deployment, jobs, site import/export, WebDAV, On-Demand Sandboxes, log streaming, MRT, SLAS, Account Manager, eCDN, CIP, and SCAPI custom APIs/schemas |
| [`storefront-next`](./storefront-next) | Storefront Next development — project setup, routing, data fetching, components, design-system component authoring, vertical/theme creation, Page Designer, authentication, hybrid storefronts, i18n, state management, extensions, performance, testing, and Managed Runtime deployment |
| [`storefront-next-figma`](./storefront-next-figma) | Figma design-kit workflows for Storefront Next verticals — duplicate the kit, sync Brand variables from `brand.css`, edit components at the correct layer, and publish Code Connect. **Requires the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server).** |

`b2c-dx-mcp` is also published as a plugin from this repository, but it is an **MCP server plugin**, not a skills plugin — its skills are not in this directory. For installation and configuration, see the [MCP Installation Guide](../docs/mcp/installation.md) and [MCP Overview](../docs/mcp/index.md).

The `cap-dev` skill set (Commerce App Package development) is installable via the B2C CLI and the marketplace but lives in the [`commerce-apps`](https://github.com/SalesforceCommerceCloud/commerce-apps) repository, not here.

## Installation

End users install these plugins from their IDE's plugin marketplace or with the B2C CLI. See the [Agent Skills & Plugins guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for per-IDE instructions.

### Claude Code (marketplace)

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
# Use --scope project to install for the current project only
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install storefront-next
# Requires the Figma MCP server (see plugin note above)
claude plugin install storefront-next-figma
```

### B2C CLI (any supported IDE)

```bash
# Interactive — pick skill sets and IDEs
b2c setup skills

# Or install a specific skill set to a specific IDE
b2c setup skills storefront-next --ide cursor
b2c setup skills storefront-next-figma --ide cursor
```

## Repository Layout

Each plugin is a directory containing a `.codex-plugin/plugin.json` manifest and a `skills/` subdirectory. Every skill is a folder with a `SKILL.md` file (instructions + frontmatter), optionally alongside `references/`, `assets/`, and `evals/`.

```
skills/
├── plugins.json                    # Manifest of plugins packaged on release
├── b2c/skills/                     # B2C Commerce development skills
├── b2c-cli/skills/                 # B2C CLI operation skills
├── storefront-next/skills/         # Storefront Next skills
└── storefront-next-figma/skills/   # Figma design-kit skill(s)
```

Plugins listed in [`plugins.json`](./plugins.json) are zipped to `<name>-skills.zip` and attached to the `b2c-agent-plugins` GitHub release; the B2C CLI downloads those artifacts for `b2c setup skills`. Adding a plugin there is all that's needed for the release workflow to package it.

## For Contributors

- When modifying CLI commands, update the corresponding skill in `b2c-cli/skills/b2c-<topic>/SKILL.md` to keep guidance in sync.
- When changing development patterns, update the relevant `b2c/skills/<topic>/SKILL.md`.
- To make a new plugin installable via the B2C CLI, add it to [`plugins.json`](./plugins.json) and register a source in `packages/b2c-tooling-sdk/src/skills/sources.ts` (plus the `SkillSet` type in `types.ts`).
- Add a changeset targeting `@salesforce/b2c-agent-plugins` for any skill content changes.

See the repository [CLAUDE.md](../CLAUDE.md) and the [documentation skill](../.claude/skills/documentation/SKILL.md) for full contributor guidance.

## Learn More

- [Agent Skills Standard](https://agentskills.io/home)
- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [B2C Developer Tooling Documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/)
