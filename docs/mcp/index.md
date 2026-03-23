---
description: MCP Server for Salesforce B2C Commerce - AI-assisted development tools for Claude, Cursor, and other AI assistants.
---

# MCP Server

The B2C DX MCP Server enables AI assistants (like Claude Code, Cursor, GitHub Copilot, and others) to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

> ⚠️ **Preview Release**: This package is in preview. Tools are functional but require `--allow-non-ga-tools` to enable. Additional tools will be added in future releases.

## Overview

The MCP server automatically detects your project type and enables relevant tools. It reads configuration from your project's configuration files and provides AI assistants with context-aware tools to help you:

- Discover and explore Salesforce Commerce APIs
- Deploy code and manage B2C instances
- Build and deploy applications to Managed Runtime
- Get development guidelines and best practices
- Generate components and scaffold new features

## Quick Start

### Installation

**Claude Code:**

::: code-group

```bash [Project Scope (Recommended)]
cd /path/to/your/project
claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --allow-non-ga-tools
```

```bash [Plugin Marketplace (Alternative)]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp --scope project
```

```bash [User Scope]
claude mcp add --transport stdio --scope user b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --allow-non-ga-tools
```

:::

**Cursor:** [Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBzYWxlc2ZvcmNlL2IyYy1keC1tY3BAbGF0ZXN0IiwiLS1wcm9qZWN0LWRpcmVjdG9yeSIsIiR7d29ya3NwYWNlRm9sZGVyfSIsIi0tYWxsb3ctbm9uLWdhLXRvb2xzIl19)

See the [Installation Guide](./installation) for detailed setup instructions for Claude Code, Cursor, GitHub Copilot, and other MCP clients.

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

With project-level installation (recommended), the server automatically detects your project location from the MCP config file location. This enables:

1. **Auto-discovery** - Detects your project type and enables appropriate toolsets.
2. **Configuration loading** - Reads [`dw.json`](../guide/configuration#configuration-file) from your project for credentials.
3. **Scaffolding** - Creates new files in the correct location.

**Note:** If using user-level configuration on Cursor, add `--project-directory "${workspaceFolder}"` to the args array. Claude Code and GitHub Copilot don't require this flag.

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

**Figma-to-Component:**
- ✅ "Use the MCP tool to convert this Figma design to a Storefront Next component: [Figma URL with node-id]"
- ✅ "Use the MCP tool to create this homepage from the Figma design: [Figma URL with node-id]. Create new components or update existing components using the MCP tool if necessary, then update the home page. The expected result should be that the homepage matches as closely as possible to the provided Figma design."
- ✅ "Use the MCP tool to map Figma design tokens to my theme."

See the [Toolsets & Tools Reference](./toolsets) for more prompting examples for each toolset.

## Plugins

The MCP server uses the B2C CLI under the hood, so CLI plugins automatically extend MCP functionality. Plugins can add new commands, provide custom configuration sources, integrate with external systems, and more.

See the [CLI Plugin documentation](../guide/extending) for details on creating plugins and [Third-Party Plugins](../guide/third-party-plugins) for available community plugins.

## Next Steps

- [Installation Guide](./installation) - Set up Claude Code, Cursor, GitHub Copilot, or other MCP clients
- [Configuration](./configuration) - Configure credentials, flags, and toolset selection
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [CLI Reference](../cli/) - Learn about the B2C CLI commands
- [API Reference](../api/) - Explore the SDK API
