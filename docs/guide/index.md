---
description: Introduction to the B2C CLI, MCP Server, and SDK for Salesforce Commerce Cloud B2C code deployment, site management, and sandbox operations.
---

# Introduction

The B2C Developer Tooling provides command-line and AI-assisted development tools for Salesforce Commerce Cloud B2C.

- **B2C CLI**: Command-line interface that you can use to deploy code, manage sandboxes, run jobs, and so on from the terminal.
- **MCP Server**: AI-assisted development tools for Cursor, Claude Desktop, and other AI assistants.

## Quick CLI Install

::: code-group

```bash [npm]
npm install -g @salesforce/b2c-cli
```

```bash [npx]
npx @salesforce/b2c-cli --help
```

```bash [Homebrew]
brew install SalesforceCommerceCloud/tools/b2c-cli
```

:::

See the [CLI Installation Guide](./installation) for more installation options.

## Quick MCP Install

The B2C DX MCP Server enables AI assistants to help with B2C Commerce development tasks. Install it in your MCP client configuration:

**Cursor** (supports `${workspaceFolder}`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--working-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
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
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--working-directory", "/path/to/your/project", "--allow-non-ga-tools"]
    }
  }
}
```

See the [MCP Server Installation Guide](/mcp/installation) for detailed setup instructions.

## Next Steps

- [Authentication Setup](./authentication) - Set up Account Manager, OCAPI, and WebDAV
- [Analytics Reports (CIP/CCAC)](./analytics-reports-cip-ccac) - Run curated analytics reports and SQL queries
- [Configuration](./configuration) - Configure instances and credentials
- [IDE Integration](./ide-integration) - Connect Prophet VS Code to B2C CLI configuration
- [MCP Server](/mcp/) - AI-assisted development with Model Context Protocol
- [CLI Reference](/cli/) - Browse available commands
- [Tools Reference](/mcp/toolsets) - Explore MCP tools for cartridges, MRT, SCAPI, and so on
- [API Reference](/api/) - Explore the SDK API
