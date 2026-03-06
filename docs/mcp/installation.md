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

## Installation Method

The MCP server is installed via `npx`, which downloads and runs the latest version on demand.

### Project Directory

The server automatically detects your project location to enable:

1. **Auto-discovery** - Detects your project type and enables appropriate toolsets
2. **Configuration loading** - Reads [`dw.json`](../guide/configuration#configuration-file) from your project root for B2C credentials
3. **Scaffolding** - Creates new files in the correct location based on your project structure

**Detection methods:**
- **Cursor (project-level)**: Automatically detected from the MCP config file location
- **Cursor (user-level)**: Requires `--project-directory "${workspaceFolder}"` in the args array
- **Claude Code**: Automatically detected from the current working directory (cd into project root before installation)
- **GitHub Copilot**: Automatically detected from the workspace location

### Project Type Detection

The server automatically detects your project type:

| Project Type | Detection Criteria | Enabled Toolsets |
|--------------|-------------------|------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` in package.json | PWAV3, MRT, SCAPI |
| **Storefront Next** | Root or workspace package has `@salesforce/storefront-next*` dependency, or package name starting with `storefront-next` | STOREFRONTNEXT, MRT, CARTRIDGES, SCAPI |
| **Cartridges** | `.project` file in cartridge directory | CARTRIDGES, SCAPI |
| **No project detected** | No B2C markers found | SCAPI (base toolset only) |

Hybrid projects (e.g., cartridges + PWA Kit) get combined toolsets.

## Claude Code

Claude Code supports MCP servers via CLI installation:

1. Navigate to your project root directory:
   ```bash
   cd /path/to/your/project
   ```

2. Install the MCP server:
   ```bash
   claude mcp add --transport stdio b2c-dx -- npx -y @salesforce/b2c-dx-mcp --allow-non-ga-tools
   ```

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
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--allow-non-ga-tools"]
    }
  }
}
```

3. Restart Cursor or reload the MCP server

With project-level configuration, the server automatically detects your project location without requiring the `--project-directory` flag. See the [Cursor MCP documentation](https://cursor.com/docs/context/mcp#configuration-locations) for details.

### Quick Install (User-Level)

Alternatively, use the "Add to Cursor" link to add to user-level configuration:

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBzYWxlc2ZvcmNlL2IyYy1keC1tY3AiLCItLXByb2plY3QtZGlyZWN0b3J5IiwiJHt3b3Jrc3BhY2VGb2xkZXJ9IiwiLS1hbGxvdy1ub24tZ2EtdG9vbHMiXX0=)

**Note:** The install link adds to user-level configuration (`~/.cursor/mcp.json`) with `--project-directory "${workspaceFolder}"`. The `${workspaceFolder}` variable automatically expands to your current workspace, so no manual updates are needed when switching projects.

## GitHub Copilot

GitHub Copilot supports MCP servers via configuration in your workspace. See the [GitHub Copilot MCP documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers#_configure-the-mcpjson-file) for setup instructions.

Copilot supports project-level configuration. Create the MCP config file in your workspace:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--allow-non-ga-tools"]
    }
  }
}
```

With project-level configuration, the server automatically detects your project location.

## Troubleshooting

### Server Not Starting

- Verify Node.js version: `node --version` (must be 22.0.0+)
- Check that `npx` is available and working

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
