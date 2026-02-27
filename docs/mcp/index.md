---
description: MCP Server for Salesforce B2C Commerce - AI-assisted development tools for Claude, Cursor, and other AI assistants.
---

# MCP Server

The B2C DX MCP Server enables AI assistants (like Cursor, Claude Desktop, and others) to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

> ⚠️ **Preview Release**: This package is in preview. Tools are functional but require `--allow-non-ga-tools` to enable. Additional tools will be added in future releases.

## Overview

The MCP server automatically detects your project type and enables relevant tools. It reads configuration from your project's configuration files and provides AI assistants with context-aware tools to help you:

- Discover and explore Salesforce Commerce APIs (both standard and custom APIs).
- Deploy cartridges and manage code versions on your B2C instances.
- Build and deploy bundles to Managed Runtime for PWA Kit and Storefront Next projects.
- Get development guidelines and best practices for PWA Kit v3 and Storefront Next.
- Generate components, pages, and scaffold new features with framework-specific patterns.

## Quick Start

### Installation

See the [Installation Guide](./installation) for detailed setup instructions for Cursor, Claude Desktop, and other MCP clients.

**Cursor** (supports `${workspaceFolder}`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--project-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
    }
  }
}
```

**Claude Desktop** (use explicit path):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--project-directory", "/path/to/your/project", "--allow-non-ga-tools"]
    }
  }
}
```

### Configuration

The server automatically detects your project type and loads configuration from `dw.json` in your project root. See the [Configuration Guide](./configuration) for details on:

- Credential management (config files, environment variables, flags)
- Project type detection
- Toolset selection (auto-discovery vs manual)
- Required credentials per toolset

For authentication setup instructions, see the [Authentication Setup guide](../guide/authentication) which covers API client creation, WebDAV access, SCAPI authentication, and MRT API keys.

### Available Toolsets

The server provides five toolsets with specialized tools for different development workflows:

- [CARTRIDGES](./toolsets#cartridges) - Cartridge deployment and code version management
- [MRT](./toolsets#mrt) - Managed Runtime bundle operations
- [PWAV3](./toolsets#pwav3) - PWA Kit v3 development tools
- [SCAPI](./toolsets#scapi) - Salesforce Commerce API discovery
- [STOREFRONTNEXT](./toolsets#storefrontnext) - Storefront Next development tools

See the [Toolsets & Tools Reference](./toolsets) for detailed descriptions of each toolset and its tools.

## Usage

### Project Directory

The most important flag is **`--project-directory`** (or env var `SFCC_PROJECT_DIRECTORY`). It tells the server where your project is located, enabling:

1. **Auto-discovery** - Detects your project type and enables appropriate toolsets.
2. **Configuration loading** - Reads [`dw.json`](../guide/configuration#configuration-file) from your project for credentials.
3. **Scaffolding** - Creates new files in the correct location.

> **Important:** MCP clients like Cursor and Claude Desktop spawn servers from the home directory (`~`), not your project. Always set `--project-directory`.

### Project Type Detection

The server analyzes your project directory and enables toolsets based on what it finds:

| Project Type | Detection | Toolsets Enabled |
|--------------|-----------|------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` in package.json | PWAV3, MRT, SCAPI |
| **Storefront Next** | Root or a workspace package has `@salesforce/storefront-next*` dependency, or package name starting with `storefront-next`. | STOREFRONTNEXT, MRT, CARTRIDGES, SCAPI |
| **Cartridges** | `.project` file in cartridge directory | CARTRIDGES, SCAPI |
| **No project detected** | No B2C markers found | SCAPI (base toolset only) |

The **SCAPI** toolset is always enabled. Hybrid projects (e.g., cartridges + PWA Kit) get combined toolsets.

### Prompting Tips

AI assistants automatically decide which MCP tools to use based on your prompts. To get the best results:

> ⚠️ **IMPORTANT**: **Explicitly mention "Use the MCP tool"** in your prompts for reliable tool usage. While AI assistants can automatically select MCP tools based on context, explicit instructions ensure the assistant prioritizes MCP tools over general knowledge, especially when multiple approaches are possible.

#### Best Practices

1. **Always explicitly request MCP tool usage**: Start prompts with "Use the MCP tool to..." or include "Use the MCP tool" in your request
2. **Be specific about your goal**: Instead of "help me with Storefront Next", say "Use the MCP tool to show me how to build a product detail page with authentication"
3. **Mention the tool or domain explicitly**: Reference the framework (Storefront Next, PWA Kit), operation (deploy, discover), or domain (SCAPI, cartridges)
4. **Use natural language**: Describe what you want to achieve, not the tool name
5. **Provide context**: Mention your project type, what you're building, or what you need to learn
6. **Ask for guidelines first**: When starting a new project or learning a framework, ask for development guidelines before writing code
7. **Combine related topics**: Ask for multiple related sections in one request (e.g., "Use the MCP tool to show me data fetching and component patterns for Storefront Next")
8. **Specify operations clearly**: For deployment operations, mention the target and what to deploy (for example, "Use the MCP tool to deploy my cartridges to the sandbox instance")

#### Example Prompts

**Storefront Next Development:**
- ✅ "I'm new to Storefront Next. Use the MCP tool to show me the critical rules I need to know."
- ✅ "I need to build a product detail page. Use the MCP tool to show me best practices for data fetching and component patterns."
- ✅ "I want to apply my brand colors to my Storefront Next site. Use the MCP tool to help me."

**SCAPI Discovery:**
- ✅ "Use the MCP tool to list all available SCAPI schemas."
- ✅ "Use the MCP tool to get the OpenAPI schema for shopper-baskets v1."

**Cartridge Deployment:**
- ✅ "Use the MCP tool to deploy my cartridges to the sandbox instance."

**MRT Bundle Operations:**
- ✅ "Use the MCP tool to build and push my Storefront Next bundle to staging."

See the [Toolsets & Tools Reference](./toolsets) for more prompting examples for each toolset.

## Telemetry

The MCP server collects anonymous usage telemetry to help improve the developer experience. Telemetry is enabled by default.

**Development mode**: Telemetry is automatically disabled when using `bin/dev.js`, so local development and testing won't pollute production data.

### Configuring Telemetry

Set options in the `env` object of your server entry in `.cursor/mcp.json` or `~/.cursor/mcp.json`:

- **Disable**: `SF_DISABLE_TELEMETRY=true` or `SFCC_DISABLE_TELEMETRY=true`
- **Custom endpoint**: `SFCC_APP_INSIGHTS_KEY=your-key`

### What We Collect

- **Server lifecycle events**: When the server starts, stops, or encounters errors
- **Tool usage**: Which tools are called and their execution time (not the arguments or results)
- **Command metrics**: Command duration and success/failure status
- **Environment info**: Platform, architecture, Node.js version, and package version

### What We Don't Collect

- **No credentials**: No API keys, passwords, or secrets
- **No business data**: No product data, customer information, or site content
- **No tool arguments**: No input parameters or output results from tool calls
- **No file contents**: No source code, configuration files, or project data

## Next Steps

- [Installation Guide](./installation) - Set up Cursor, Claude Desktop, or other MCP clients
- [Configuration](./configuration) - Configure credentials, flags, and toolset selection
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [CLI Reference](../cli/) - Learn about the B2C CLI commands
- [API Reference](../api/) - Explore the SDK API
