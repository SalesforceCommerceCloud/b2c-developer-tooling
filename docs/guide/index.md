---
description: Introduction to the B2C CLI, MCP Server, and SDK for Salesforce B2C Commerce code deployment, site management, and sandbox operations.
---

# Introduction

The B2C Developer Tooling provides command-line and AI-assisted development tools for Salesforce B2C Commerce.

- **B2C CLI**: Command-line interface that you can use to deploy code, manage sandboxes, run jobs, and so on from the terminal.
- **MCP Server**: AI-assisted development tools for Claude Code, Cursor, GitHub Copilot, and other AI assistants.

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

The B2C DX MCP Server enables AI assistants to help with B2C Commerce development tasks.

::: code-group

```bash [Claude Code]
cd /path/to/your/project
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp --scope project
```

```bash [Cursor]
cd /path/to/your/project
mkdir -p .cursor
cat > .cursor/mcp.json <<'EOF'
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
    }
  }
}
EOF
```

```bash [GitHub Copilot]
cd /path/to/your/project
mkdir -p .vscode
cat > .vscode/mcp.json <<'EOF'
{
  "servers": {
    "b2c-dx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
    }
  },
  "inputs": []
}
EOF
```

:::

See the [MCP Server Installation Guide](/mcp/installation) for full setup steps and troubleshooting.

## Next Steps

- [Authentication Setup](./authentication) - Set up Account Manager, OCAPI, and WebDAV
- [Analytics Reports (CIP/CCAC)](./analytics-reports-cip-ccac) - Run curated analytics reports and SQL queries
- [Configuration](./configuration) - Configure instances and credentials
- [IDE Integration](./ide-integration) - Connect Prophet VS Code to B2C CLI configuration
- [MCP Server](/mcp/) - AI-assisted development with Model Context Protocol
- [CLI Reference](/cli/) - Browse available commands
- [MCP Tools](/mcp/toolsets) - Explore MCP tools for cartridges, MRT, SCAPI, and so on
- [SDK Reference](/api/) - Explore the SDK
