---
description: Install and configure the B2C DX MCP Server for Claude Code, Cursor, GitHub Copilot, and other MCP clients.
---

# Installation

This guide covers installing and configuring the B2C DX MCP Server for various MCP clients.

## Prerequisites

- Node.js 22.0.0 or higher
- A B2C Commerce project (for project-specific toolsets)
- MCP client (Claude Code, Cursor, GitHub Copilot, or compatible client)

> **Note:** For Figma-to-component tools, you also need an external Figma MCP server enabled. See [Figma-to-Component Tools Setup](./figma-tools-setup) for details.

The MCP server is installed via `npx`, which downloads and runs the latest version on demand. For project directory and project type detection details, see [MCP Server Overview](./#usage).

## Claude Code

Claude Code supports MCP servers via CLI installation:

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

See the [Claude Code MCP documentation](https://docs.claude.com/en/docs/claude-code/mcp) for details on scope options and configuration.

## Cursor

Cursor supports project-level configuration via `.cursor/mcp.json` in your project root.

### Project-Level Configuration (Recommended)

Project-level configuration automatically detects your project location and can be shared with your team via version control.

1. Create or edit `.cursor/mcp.json` in your project root
2. Add the following configuration:

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
    }
  }
}
```

3. Restart Cursor or reload the MCP server

With project-level configuration, the server automatically detects your project location without requiring the `--project-directory` flag. See the [Cursor MCP documentation](https://cursor.com/docs/context/mcp#configuration-locations) for details.

### Quick Install (User-Level)

Alternatively, use the "Add to Cursor" link to add to user-level configuration:

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBzYWxlc2ZvcmNlL2IyYy1keC1tY3BAbGF0ZXN0IiwiLS1wcm9qZWN0LWRpcmVjdG9yeSIsIiR7d29ya3NwYWNlRm9sZGVyfSIsIi0tYWxsb3ctbm9uLWdhLXRvb2xzIl19)

**Manual Configuration (Windows or if link doesn't work):**

1. Open or create `~/.cursor/mcp.json` (on Windows: `C:\Users\<your-username>\.cursor\mcp.json`)
2. Add the following configuration:

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--project-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
    }
  }
}
```

> **Note:** Cursor uses `"mcpServers"` as the top-level key. For GitHub Copilot/VS Code, use `"servers"` instead (see [GitHub Copilot](#github-copilot) section). The `${workspaceFolder}` variable automatically expands to your current workspace, so no manual updates are needed when switching projects.

## GitHub Copilot

GitHub Copilot supports MCP servers via configuration in your workspace. See the [GitHub Copilot MCP documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers#_configure-the-mcpjson-file) for setup instructions.

Copilot supports project-level configuration. Create the MCP config file in your workspace (`.vscode/mcp.json`):

```json
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
```

> **Note:** GitHub Copilot/VS Code uses `"servers"` (not `"mcpServers"`) and requires `"type": "stdio"` for stdio-based servers. The `"inputs"` array is optional but included for consistency with VS Code's format.

With project-level configuration, the server automatically detects your project location.

## Troubleshooting

### Server Not Starting

- Verify Node.js version: `node --version` (must be 22.0.0+)
- Check that `npx` is available and working

### "Could not determine executable to run" Error (Windows)

This error occurs when npx uses a cached broken version (`0.0.1`) instead of the latest version. npx's cache-first behavior can reuse an older cached version even when newer versions are available.

**Solution:**

1. **Update your MCP configuration** to use `@latest`:
   ```json
   {
     "mcpServers": {
       "b2c-dx-mcp": {
         "command": "npx",
         "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
       }
     }
   }
   ```

2. **Clear the npx cache** if the issue persists:
   ```bash
   npm cache clean --force
   ```

**Prevention:** Always use `@latest` in your MCP configuration to ensure npx fetches the latest version from the registry instead of using cached versions.

### Tools Not Available

- Ensure `--allow-non-ga-tools` flag is included (required for preview tools)
- Verify project type detection by checking your `package.json` or project structure
- If using user-level Cursor configuration, ensure `--project-directory "${workspaceFolder}"` is included

### Configuration Not Loading

- Ensure `dw.json` exists in your project root
- Verify you're using project-level configuration (recommended)
- Check file permissions on `dw.json`

## Next Steps

- [Configuration](./configuration) - Configure credentials, flags, and toolset selection
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
