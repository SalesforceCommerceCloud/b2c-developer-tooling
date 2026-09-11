---
description: Connect your AI assistant to B2C Commerce tools, documentation, skills, and APIs.
---

# MCP (Model Context Protocol)

Give your AI assistant B2C Commerce documentation, development skills, debugging, deployment, and API access.

## Set up with a plugin <span class="recommended VPBadge">Recommended</span> {#plugin-setup}

Install the **B2C MCP plugin** for your client. It includes the B2C Commerce,
B2C CLI, and Storefront Next skills. **No need to install those skills plugins separately.**

<!--@include: ../_partials/mcp-plugin-install.md-->

Start a new session in your project. Documentation and skills work without B2C Commerce credentials.

## Manual setup

For Cursor, Claude Desktop, and other clients, or for a custom configuration, use
[manual installation](./installation). You get the same tools, documentation, and skills.

## Developer Tasks

- **Build:** find platform documentation and apply B2C Commerce development patterns.
- **Debug:** investigate logs, set cartridge breakpoints, and inspect variables.
- **Deploy:** publish cartridges and Managed Runtime storefront bundles.

> Investigate this sandbox error using logs and local cartridge source. Explain the cause before changing code.

## Administrator and Merchant Tasks

[SCAPI code mode](./toolsets#scapi-code-mode) covers nearly 600 Salesforce Commerce API operations.
Review campaigns and promotions, investigate job failures, or create products and assign catalog categories.

> Show failed job executions from the last 24 hours, grouped by job. Highlight recurring failures.

> Summarize the promotions in campaign spring-sale. Flag schedule conflicts and disabled promotions.

Standard and custom Admin APIs support live requests. Shopper APIs are available for reference.

## Configuration and access

Connected tasks use your [B2C Commerce configuration](./configuration) and account permissions.
See [authentication](../guide/authentication) for credential setup and [Security and Access](./security)
for approvals, credential handling, and Safety Mode.

The default installation includes all toolsets. [Advanced configuration](./configuration#toolset-selection)
lets you choose specific tools or toolsets for manual installations.

## Tools and skills

Browse [MCP Tools](./toolsets) for capabilities and tool names, or [Agent Skills](../guide/agent-skills)
for the included expertise. Use [Plugins](../guide/agent-plugins) to explore optional additions.
