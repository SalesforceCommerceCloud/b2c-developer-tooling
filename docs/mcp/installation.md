---
description: Install and configure the B2C DX MCP Server for Claude Code, Cursor, GitHub Copilot, and other MCP clients.
---

# Installation

This guide covers installing and configuring the B2C DX MCP Server for various MCP clients.

## Prerequisites

- Node.js 22.0.0 or higher (`npx` is included with Node.js and must be accessible from the MCP client's process environment)
- A B2C Commerce project (for project-specific toolsets)
- MCP client (Claude Code, Cursor, GitHub Copilot, or compatible client)

> **Note:** For Figma-to-component tools, you also need an external Figma MCP server enabled. See [Figma-to-Component Tools Setup](./figma-tools-setup) for details.

The MCP server is installed via `npx`, which downloads and runs the latest version on demand. For project type detection details, see [MCP Server Overview](./#project-type-detection).

## Claude Code

### Plugin Marketplace

Install from the Claude Code plugin marketplace:

```bash
cd /path/to/your/project
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp --scope project
```

> **Note:** For plugin marketplace installs, MCP server configuration is managed by the plugin. For credentials and settings, use [`dw.json`](./configuration#dw-json) or [`.env`](./configuration#env-file) in your project root.

### CLI

Add the MCP server directly via the Claude Code CLI:

::: code-group

```bash [Project Scope]
cd /path/to/your/project
claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --allow-non-ga-tools
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

## After Installation

With the default `mcp.json`, the server auto-detects your project type and loads credentials from your project's `dw.json` or `.env` file. No additional changes to `mcp.json` are needed.

See [Configuration](./configuration) for setting up `dw.json`, `.env`, and toolset selection.

## Troubleshooting

### Server Not Starting

- Verify Node.js version: `node --version` (must be 22.0.0+)
- Check that `npx` is available and working

### `spawn npx ENOENT` Error

This error means the MCP client cannot find `npx` in its process PATH. This commonly happens when opening Cursor or VS Code from a desktop shortcut, Finder (macOS), or Start Menu (Windows) — the app may not inherit your terminal's PATH where Node.js is installed.

**Solutions:**

- **macOS/Linux:** Open Cursor or VS Code from the terminal (`cursor .` or `code .`) so it inherits your shell PATH, or add the Node.js bin directory to your system PATH so it's available in GUI-launched apps.
- **Windows:** Ensure the Node.js installer added `npm`/`npx` to your system PATH (not just user PATH). You may need to restart after installing Node.js.
- **nvm/fnm users:** Version managers set PATH in your shell profile, which GUI apps don't source. Either launch from terminal or create a symlink to the Node.js binary in a system-wide location (e.g., `/usr/local/bin/node`).

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

- Ensure `dw.json` or `.env` exists in your project root
- Verify you're using project-level configuration (recommended)
- Check file permissions on `dw.json` or `.env`
- If using user-level Cursor config, ensure `--project-directory "${workspaceFolder}"` is in the args array

## Next Steps

- [Configuration](./configuration) - Configure credentials, environment variables, MCP flags, toolset selection, and logging
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
