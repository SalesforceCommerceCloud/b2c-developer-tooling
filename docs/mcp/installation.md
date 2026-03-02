---
description: Install and configure the B2C DX MCP Server for Cursor, Claude Desktop, and other MCP clients.
---

# Installation

This guide covers installing and configuring the B2C DX MCP Server for various MCP clients.

## Prerequisites

- Node.js 22.0.0 or higher
- A B2C Commerce project (for project-specific toolsets)
- MCP client (Cursor, Claude Desktop, or compatible client)

**Figma-to-component tools:** If you use the Figma workflow tools (`storefront_next_figma_to_component_workflow`, `storefront_next_generate_component`, `storefront_next_map_tokens_to_theme`), you also need an external Figma MCP server enabled. See [Figma-to-Component Tools Setup](./figma-tools-setup) for prerequisites and configuration.

## Install via npm (Recommended)

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

## Cursor Configuration

Cursor supports the `${workspaceFolder}` variable, which automatically resolves to your current workspace directory.

### Setup Steps

1. Open Cursor settings (Cmd/Ctrl + ,)
2. Search for "MCP" or navigate to MCP settings
3. Add the following configuration to `.cursor/mcp.json` (workspace) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--project-directory",
        "${workspaceFolder}",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

4. Restart Cursor or reload the MCP server

### Project Directory

The `--project-directory` flag is critical. Cursor spawns MCP servers from your home directory (`~`), not your project directory. The `${workspaceFolder}` variable ensures the server knows where your project is located.

**Why this matters:**
- Enables **auto-discovery** of your project type
- Loads configuration from `dw.json` in your project root
- Ensures that scaffolding creates files in the correct location

## Claude Desktop Configuration

Claude Desktop doesn't support workspace variables, so you must use an explicit path.

### Setup Steps

1. Open Claude Desktop settings
2. Navigate to MCP servers configuration (usually in `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS)
3. Add the following configuration:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--project-directory",
        "/absolute/path/to/your/project",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

4. Replace path `/absolute/path/to/your/project` with actual absolute path to your B2C Commerce project.
5. Restart Claude Desktop.

### Per-Project Configuration

If you work with multiple projects, you can create separate MCP server entries for each:

```json
{
  "mcpServers": {
    "b2c-dx-project1": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--project-directory",
        "/path/to/project1",
        "--allow-non-ga-tools"
      ]
    },
    "b2c-dx-project2": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--project-directory",
        "/path/to/project2",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

## Project Directory Setup

The `--project-directory` flag tells the server where your project is located. This enables:

### 1. Auto-Discovery

The server analyzes your project directory to detect the project type:

| Project Type | Detection Criteria |
|--------------|-------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` in package.json |
| **Storefront Next** | Root or workspace package has `@salesforce/storefront-next*` dependency, or package name starting with `storefront-next` |
| **Cartridges** | `.project` file in cartridge directory |
| **No project detected** | No B2C markers found |

Based on detection, the server automatically enables relevant toolsets.

### 2. Configuration Loading

The server reads [`dw.json`](../guide/configuration#configuration-file) from your project root for B2C credentials:

```json
{
  "hostname": "xxx.demandware.net",
  "username": "...",
  "password": "...",
  "client-id": "...",
  "client-secret": "..."
}
```

See the [Authentication Setup guide](../guide/authentication) for detailed instructions on setting up API clients, WebDAV access, and SCAPI authentication.

### 3. Scaffolding

When creating new files (components, pages, cartridges), the server uses the project directory to place files in the correct location based on your project structure.

## Project Type Detection

The server automatically detects your project type by analyzing the project directory:

### PWA Kit v3

Detected when:
- `package.json` contains `@salesforce/pwa-kit-*` dependencies
- `package.json` contains `@salesforce/retail-react-app`
- `package.json` contains `ccExtensibility` field

**Enabled toolsets:** PWAV3, MRT, SCAPI

### Storefront Next

Detected when:
- Root `package.json` has `@salesforce/storefront-next*` dependency
- Any workspace package has `@salesforce/storefront-next*` dependency
- Package name starts with `storefront-next`

**Enabled toolsets:** STOREFRONTNEXT, MRT, CARTRIDGES, SCAPI

### Cartridges

Detected when:
- A `.project` file exists in a cartridge directory

**Enabled toolsets:** CARTRIDGES, SCAPI

### No Project Detected

If no B2C markers are found:
- Only the **SCAPI** toolset is enabled (base toolset)

### Hybrid Projects

Projects with multiple markers (e.g., cartridges + PWA Kit) get combined toolsets. For example:
- Cartridges + PWA Kit → CARTRIDGES, PWAV3, MRT, SCAPI

## Troubleshooting

### Server Not Starting

- Verify Node.js version: `node --version` (must be 22.0.0+).
- Check that the path to `bin/dev.js` is correct and absolute.
- Ensure that the script is executable: `chmod +x bin/dev.js`.

### Tools Not Available

- Ensure `--allow-non-ga-tools` flag is included (required for placeholder tools).
- Check that `--project-directory` points to a valid project directory.
- Verify project type detection by checking your `package.json` or project structure.

### Configuration Not Loading

- Ensure `dw.json` exists in your project root
- Verify `--project-directory` points to the correct directory
- Check file permissions on `dw.json`

## Next Steps

- [Configuration](./configuration) - Configure credentials, flags, and toolset selection
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
