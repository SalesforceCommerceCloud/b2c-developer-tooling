---
description: Give your coding assistant B2C Commerce skills, documentation, deployment, debugging, and log access.
---

# B2C Commerce MCP Server

Connect your coding assistant to Salesforce B2C Commerce. The B2C DX MCP Server
supports Codex, Claude Code, Cursor, GitHub Copilot, and other MCP clients.
It supports MCP 2026-07-28 and earlier clients over local stdio; your client
selects the protocol automatically.

Use it to:

- Find Commerce documentation and workflow skills while developing.
- Deploy cartridges and publish Managed Runtime bundles.
- Investigate server-side code with breakpoints, variables, and logs.
- Discover SCAPI schemas and check custom API registration.
- Create and manage Commerce records through SCAPI code mode (preview).

[Browse capabilities](./toolsets) to see what is available and which operations
need credentials or can change your environment.

## Get started

1. [Install the server](./installation) in your coding assistant.
2. [Select your project and tools](./configuration). Skills and documentation
   can be used without Commerce credentials.
3. [Configure access](./security) for the environments and operations you need.

For example, ask your assistant to explain a Commerce API, help prepare a
cartridge deployment, or investigate a sandbox error. The included
[workflow skills](./skills) covers B2C CLI, Commerce development, and
Storefront Next.

## Choose the tools you expose {#project-type-detection}

All toolsets are enabled by default, regardless of the project's storefront
framework or the directory where your client starts the server. Use
[explicit tool selection](./configuration#toolset-selection) to customize the
capabilities available to your assistant.

The project directory still determines which configuration and files a task
uses. Shared tools support PWA Kit and Storefront Next projects; set the intended
project in [configuration](./configuration#project-directory).
