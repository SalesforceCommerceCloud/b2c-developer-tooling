---
description: MCP Server for Salesforce B2C Commerce - AI-assisted development tools for Claude, Cursor, and other AI assistants.
---

# MCP Server

The B2C DX MCP Server enables AI assistants (like Claude Code, Cursor, GitHub Copilot, and others) to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

## Quick Start

1. **Install** — set up the MCP server for your client. See the [Installation Guide](./installation) for Claude Code, Cursor, GitHub Copilot, and other clients.

2. **Configure credentials** — create a [`dw.json`](./configuration#dw-json) or [`.env`](./configuration#env-file) file in your project root. No changes to `mcp.json` needed.

3. **Start using tools** — the server auto-detects your project type and enables relevant [toolsets](./toolsets).

For authentication setup instructions, see the [Authentication Setup guide](../guide/authentication) which covers API client creation, WebDAV access, SCAPI authentication, and MRT API keys.

## Project Type Detection

The **SCAPI** and **DIAGNOSTICS** toolsets are always enabled. On top of those, the server analyzes your project directory and enables additional toolsets based on what it finds:

| Project Type            | Detection                                                                                                                          | Toolsets Added                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Cartridges**          | `.project` file in a cartridge directory                                                                                           | CARTRIDGES                      |
| **SFRA**                | An `app_storefront_base` cartridge (or `paths.base` in `package.json`)                                                             | CARTRIDGES                      |
| **PWA Kit v3**          | `@salesforce/pwa-kit-*` or `@salesforce/retail-react-app` dependency, or `ccExtensibility` in `package.json`                       | PWAV3, MRT                      |
| **Storefront Next**     | `@salesforce/storefront-next-dev` dependency or a package name starting with `storefront-next`, in the root or a workspace package | STOREFRONTNEXT, MRT, CARTRIDGES |
| **No project detected** | No B2C markers found                                                                                                               | _(base only)_                   |

Every configuration also includes the always-on base toolsets (**SCAPI** + **DIAGNOSTICS**). Hybrid projects (e.g. cartridges + PWA Kit) get the union of the matching rows. You can also [manually select toolsets](./configuration#toolset-selection).

::: warning Storefront Next `sfnext_*` tools are deprecated
The legacy Storefront Next MCP tools (`sfnext_*`) are **not compatible with the Storefront Next 1.0 GA release** and have been superseded by the [`storefront-next` and `storefront-next-figma` agent-skills plugins](../guide/agent-skills). They no longer auto-enable for Storefront Next projects and have moved to the opt-in [`STOREFRONTNEXT_DEPRECATED`](./toolsets#storefrontnext-deprecated) toolset. Install the skills plugins instead — see the [Agent Skills guide](../guide/agent-skills).
:::

## Plugins

The MCP server uses the B2C CLI under the hood, so CLI plugins automatically extend MCP functionality. See the [CLI Plugin documentation](../guide/extending) for details.

## Next Steps

- [Installation Guide](./installation) - Set up Claude Code, Cursor, GitHub Copilot, or other MCP clients
- [Configuration](./configuration) - Configure credentials, environment variables, MCP flags, toolset selection, and logging
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [CLI Reference](../cli/) - Learn about the B2C CLI commands
- [API Reference](../api/) - Explore the SDK API
