---
description: Prerequisites and setup for Figma-to-component tools (workflow orchestrator, generate component, map tokens).
---

# Figma-to-Component Tools Setup

Prerequisites and setup for using the Figma workflow tools: `storefront_next_figma_to_component_workflow`, `storefront_next_generate_component`, and `storefront_next_map_tokens_to_theme`.

## Overview

The Figma-to-component workflow uses **two MCP servers** that must both be enabled in your MCP client:

1. **b2c-dx-mcp** - Workflow orchestration, component analysis (REUSE/EXTEND/CREATE), and token mapping
2. **Figma MCP** (external) - Fetches design context, screenshots, and metadata from Figma files

For full end-to-end conversion from Figma design to Storefront Next component, both servers must be configured and enabled.

## B2C DX MCP Configuration

Ensure the b2c-dx-mcp server is configured with:

- **`--project-directory`** - Must point to your Storefront Next project root. Required for:
  - `storefront_next_map_tokens_to_theme` - Theme file discovery (`app.css`)
  - `storefront_next_generate_component` - Workspace context
- **`--allow-non-ga-tools`** - Figma tools are preview; this flag is required to enable them
- **Storefront Next project** - Must have `app.css` or `src/app.css` for token mapping (or pass `themeFilePath` explicitly)

See [Installation](./installation) for MCP client setup (Cursor, Claude Desktop, etc.).

## Figma MCP Setup

The workflow calls Figma MCP tools to fetch design data. These come from a **separate Figma MCP server** that you must enable in your MCP client.

**Figma MCP tools used by the workflow:**

| Tool | Purpose |
|------|---------|
| `get_design_context` | Generates UI code from the design and returns asset URLs |
| `get_screenshot` | Provides a visual reference image of the design |
| `get_metadata` | Retrieves node hierarchy, layer types, names, positions, and sizes |

See the [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server) for official setup and tool details.

Figma provides two connection options. Check the [Figma MCP catalog](https://www.figma.com/mcp-catalog/) to see which your client supports, then follow the matching installation:

### Desktop MCP (Local)

Runs through the Figma desktop app on your machine. No API token required; uses your Figma app session.

- Requires the Figma desktop application to be installed and running
- See [Figma MCP - Local Server Installation](https://developers.figma.com/docs/figma-mcp-server/local-server-installation/)

### Remote MCP (Hosted)

Connects directly to Figma's hosted endpoint. Does not require the desktop app but **requires a Figma Personal Access Token**.

- See [Figma MCP - Remote Server Installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)

#### Creating a Figma Personal Access Token

1. Log in to [Figma](https://www.figma.com)
2. Click your profile icon (top-left) → **Settings**
3. Go to **Settings → Security → Personal Access Tokens**
4. Click **Generate New Token** and give it a name (e.g., "MCP")
5. Select **read-only** access for all scopes
6. Click **Generate token** and **copy the token immediately** — Figma shows it only once

#### Storing the Token

Store the token in an environment variable (e.g., `FIGMA_API_KEY` or `FIGMA_ACCESS_TOKEN`). Do not hardcode it in configuration files or commit it to version control.

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "figma": {
      "command": "...",
      "env": {
        "FIGMA_API_KEY": "your-token-here"
      }
    }
  }
}
```

Refer to your Figma MCP provider's documentation for the exact environment variable name and configuration.

## Figma Design File

### File Access

You must have **view access** (or higher) to the Figma file. The file cannot be restricted in a way that blocks API access.

### URL with node-id

The workflow requires a Figma URL that includes the `node-id` query parameter. This identifies the specific frame or component to convert.

**How to get a URL with node-id:**

1. Open the Figma file
2. Select the frame or component you want to convert
3. Right-click → **Copy link to selection** (or use the share menu)
4. The copied URL will include `?node-id=1-2` (or similar)

**Supported URL formats:**

- `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
- `https://www.figma.com/design/:fileKey/:fileName?node-id=1-2`
- `https://figma.com/file/:fileKey/:fileName?node-id=1-2`

### No Special Figma Configuration

The basic workflow does not require:

- Figma Dev Mode
- Code Connect
- Plugins
- Special file structure

## Verification

To confirm both servers are working:

1. **b2c-dx-mcp** - List tools in your MCP client; you should see `storefront_next_figma_to_component_workflow`, `storefront_next_generate_component`, and `storefront_next_map_tokens_to_theme`
2. **Figma MCP** - List tools; you should see `mcp__figma__get_design_context`, `mcp__figma__get_screenshot`, and `mcp__figma__get_metadata` (or similar names per your Figma MCP provider)

If the Figma MCP server is not enabled, the workflow tool will still return instructions and parsed parameters, but the AI assistant will not be able to fetch design data. Inform the user that the Figma MCP server must be enabled for full conversion.

## Related Documentation

- [storefront_next_figma_to_component_workflow](./tools/storefront-next-figma-to-component-workflow) - Workflow orchestrator (call first)
- [storefront_next_generate_component](./tools/storefront-next-generate-component) - REUSE/EXTEND/CREATE recommendation
- [storefront_next_map_tokens_to_theme](./tools/storefront-next-map-tokens-to-theme) - Token mapping
- [STOREFRONTNEXT Toolset](./toolsets#storefrontnext) - Overview of Storefront Next tools
- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server) - Official Figma MCP setup
