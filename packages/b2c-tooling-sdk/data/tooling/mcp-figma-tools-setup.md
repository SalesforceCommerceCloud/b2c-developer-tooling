
# Figma-to-Component Tools Setup

::: warning DEPRECATED — use the agent-skills plugins instead
The Figma workflow MCP tools described on this page are **deprecated** and **not compatible with the Storefront Next 1.0 GA release**. They have been superseded by the [`storefront-next` and `storefront-next-figma`](../guide/agent-skills) agent-skills plugins, which stay current with the GA release. They now live in the opt-in [`STOREFRONTNEXT_DEPRECATED`](./toolsets#storefrontnext-deprecated) toolset and **will be removed in a future release**. For Figma design-kit workflows, install the [`storefront-next-figma` plugin](../guide/agent-skills) instead.
:::

Prerequisites and setup for using the Figma workflow tools: `sfnext_start_figma_workflow`, `sfnext_analyze_component`, and `sfnext_match_tokens_to_theme`.

## Overview

The Figma-to-component workflow requires an **external Figma MCP server** to fetch design data from Figma. The b2c-dx-mcp server handles workflow orchestration, component analysis, and token mapping, but it needs the Figma MCP server to access Figma designs.

**Prerequisites:**

- b2c-dx-mcp configured with `--allow-non-ga-tools` flag (Figma tools are preview)
- Storefront Next project
- `app.css` theme file (required for `sfnext_match_tokens_to_theme` tool; optional path can be provided)
- External Figma MCP server enabled in your MCP client

See [Installation](./installation) for b2c-dx-mcp setup.

## Figma MCP Setup

The workflow requires a **separate Figma MCP server** to fetch design data from Figma. Enable it in your MCP client following the [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server).

Figma provides two connection options:

- **Desktop MCP (Local)** - Uses the Figma desktop app (no API token needed)
- **Remote MCP (Hosted)** - Requires a Figma Personal Access Token

Check the [Figma MCP catalog](https://www.figma.com/mcp-catalog/) to see which option your MCP client supports, then follow the installation instructions in the Figma documentation.

## Figma Design File

You must have **view access** (or higher) to the Figma file. The workflow requires a Figma URL that includes the `node-id` query parameter to identify the specific frame or component to convert.

**To get a URL with node-id:**

1. Open the Figma file
2. Select the frame or component you want to convert
3. Right-click → **Copy link to selection**

The workflow supports standard Figma URL formats with `node-id` parameter. No special Figma configuration (Dev Mode, Code Connect, plugins) is required.

## Verification

To confirm the Figma MCP server is working, list tools in your MCP client. You should see Figma MCP tools available (exact names may vary by provider).

If the Figma MCP server is not enabled, the workflow tool will still return instructions and parsed parameters, but design data cannot be fetched from Figma.

## Related Documentation

- [sfnext_start_figma_workflow](./tools/sfnext-start-figma-workflow) - Workflow orchestrator (call first)
- [sfnext_analyze_component](./tools/sfnext-analyze-component) - REUSE/EXTEND/CREATE recommendation
- [sfnext_match_tokens_to_theme](./tools/sfnext-match-tokens-to-theme) - Token mapping
- [STOREFRONTNEXT Toolset](./toolsets#storefrontnext) - Overview of Storefront Next tools
- [`storefront-next-figma` plugin](/guide/agent-skills#available-plugins) - Agent skills for managing the Figma design kit (duplicate the kit, sync brand variables, publish Code Connect); also requires the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server) - Official Figma MCP setup
