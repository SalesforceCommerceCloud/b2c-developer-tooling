---
description: Optional project recommendations for working with the Agentic B2C Developer Toolkit and your AI assistant.
---

# Project Setup

Adapt the toolkit to your project's workflows and team conventions. These
recommendations are optional and work with the [B2C MCP](../mcp/),
[standalone Agent Skills](./agent-skills), or both.

For installation, start with the [Introduction](./index). Instance settings and
credentials are covered in [Configuration](./configuration) and
[Authentication](./authentication).

## Give your assistant project context

Your assistant's project instructions can describe when to use B2C tools and
skills. Add the following example to `AGENTS.md` for Codex, `CLAUDE.md` for
Claude Code, or your assistant's equivalent instructions file. Merge it with
any existing instructions and adapt the task examples to your project.

```markdown
## Salesforce B2C Commerce

Use available B2C Commerce skills and MCP tools for relevant tasks:

- Development: platform documentation, storefront development, debugging,
  logs, and deployment.
- Administration and merchandising: job and checkout investigations,
  products, promotions, site operations, and analytics.

Consult relevant skills and operational runbooks. When the B2C MCP is
connected, discover its tools before using shell commands, direct HTTP
requests, or browser automation. Prefer dedicated tools. For documentation,
runbooks and skills use `skills_read`, and the `docs_*` tools. For other supported
API operations, use `scapi_search` to discover APIs and inspect schemas, then
`scapi_execute` to call APIs, compose workflows, and filter results. If the
MCP is unavailable or lacks a capability, follow available skills and use
the B2C CLI where appropriate.

Use existing project configuration. Ask if the target instance or site
is unclear. Confirm destructive or irreversible operations with the user
before proceeding.
```

The example does not install tools or skills, connect an instance, or grant
permission to change data.

## Add your team's conventions

Keep project instructions short and specific to your work. Useful additions include:

- **Project layout:** the storefront framework, cartridge locations, and relevant repositories.
- **Development checks:** your build, test, and lint commands.
- **Operational boundaries:** which environments are used for testing and which changes need review.
- **Team handoffs:** where to record findings and who owns jobs, integrations, or incident response.

Link to existing team documentation instead of copying it. Keep credentials in
your [B2C configuration](./configuration), outside shared project instructions.
For administrator and operator workflows, see [Operations](./operations).
