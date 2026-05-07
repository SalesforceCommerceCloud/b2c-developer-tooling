---
description: MCP Server for Salesforce B2C Commerce - AI-assisted development tools for Claude, Cursor, and other AI assistants.
---

# MCP Server

The B2C DX MCP Server enables AI assistants (like Claude Code, Cursor, GitHub Copilot, and others) to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

> **Note:** 🚧 The STOREFRONTNEXT MCP tool is for Storefront Next. Storefront Next is part of a closed pilot and isn't available for general use.

## Quick Start

1. **Install** — set up the MCP server for your client. See the [Installation Guide](./installation) for Claude Code, Cursor, GitHub Copilot, and other clients.

2. **Configure credentials** — create a [`dw.json`](./configuration#dw-json) or [`.env`](./configuration#env-file) file in your project root. No changes to `mcp.json` needed.

3. **Start using tools** — the server auto-detects your project type and enables relevant [toolsets](./toolsets).

For authentication setup instructions, see the [Authentication Setup guide](../guide/authentication) which covers API client creation, WebDAV access, SCAPI authentication, and MRT API keys.

## Project Type Detection

The server analyzes your project directory and enables toolsets based on what it finds:

| Project Type | Detection | Toolsets Enabled |
|--------------|-----------|------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` in package.json | PWAV3, MRT, SCAPI |
| **Storefront Next** | Root or a workspace package has `@salesforce/storefront-next*` dependency, or package name starting with `storefront-next`. | STOREFRONTNEXT, MRT, CARTRIDGES, SCAPI |
| **Cartridges** | `.project` file in cartridge directory | CARTRIDGES, SCAPI |
| **No project detected** | No B2C markers found | SCAPI (base toolset only) |

With auto-discovery, the **SCAPI** toolset is always included. Hybrid projects (e.g., cartridges + PWA Kit) get combined toolsets. You can also [manually select toolsets](./configuration#toolset-selection).

## Prompting Tips

> ⚠️ **Explicitly mention "Use the MCP tool"** in your prompts for reliable tool usage. This ensures the assistant prioritizes MCP tools over general knowledge.

**Examples:**
- "I'm new to Storefront Next. **Use the MCP tool** to show me the critical rules I need to know."
- "**Use the MCP tool** to list all available SCAPI schemas."
- "**Use the MCP tool** to deploy my cartridges to the sandbox instance."
- "**Use the MCP tool** to build and push my Storefront Next bundle to staging."
- "**Use the MCP tool** to convert this Figma design to a Storefront Next component: [Figma URL with node-id]"

Other tips: be specific about your goal, mention the framework or domain, use natural language, and ask for guidelines first when learning a new framework.

## Plugins

The MCP server uses the B2C CLI under the hood, so CLI plugins automatically extend MCP functionality. See the [CLI Plugin documentation](../guide/extending) for details.

## Next Steps

- [Installation Guide](./installation) - Set up Claude Code, Cursor, GitHub Copilot, or other MCP clients
- [Configuration](./configuration) - Configure credentials, environment variables, MCP flags, toolset selection, and logging
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [CLI Reference](../cli/) - Learn about the B2C CLI commands
- [API Reference](../api/) - Explore the SDK API
