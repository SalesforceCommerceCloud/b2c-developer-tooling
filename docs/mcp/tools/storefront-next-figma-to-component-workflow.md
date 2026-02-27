---
description: Workflow orchestrator for Figma-to-component conversion. Parses your Figma URL and guides your AI assistant through design-to-component conversion.
---

# storefront_next_figma_to_component_workflow

Workflow orchestrator for converting Figma designs to Storefront Next components. When you ask your AI assistant to convert a Figma design, it starts with this workflow tool, which parses your URL and guides the assistant through the conversion.

## Overview

When you provide a Figma design URL, your AI assistant uses this tool to extract the file and node identifiers, then follows the workflow to fetch design data, analyze your codebase, and produce recommendations. The assistant will:

- Fetch design context and screenshots from Figma
- **Ask for your approval before exporting images** — when the design contains image assets (photos, logos, icons), the assistant presents the list and waits for you to confirm before exporting
- Discover similar components in your project
- Recommend whether to REUSE, EXTEND, or CREATE a component
- Map Figma design tokens to your theme variables

You receive a component recommendation with confidence score and a token mapping summary when the workflow completes.

This tool is part of the STOREFRONTNEXT toolset.

## Prerequisites

- **B2C DX MCP** configured with `--project-directory` pointing to your Storefront Next project and `--allow-non-ga-tools`
- **Figma MCP server** (external) enabled in your MCP client for full workflow execution
- **Valid Figma URL** with `node-id` query parameter (obtain by right-clicking a frame in Figma → Copy link to selection)

See [Figma-to-Component Tools Setup](../figma-tools-setup) for complete prerequisites and configuration.

## Authentication

No authentication required. This tool operates on local workflow files and URL parsing only.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `figmaUrl` | string | Yes | The Figma design URL to convert. Must be a valid URL and include the `node-id` query parameter. |
| `workflowFilePath` | string | No | Optional absolute path to a custom workflow `.md` file. If not provided, uses the default built-in workflow. |

## Supported Figma URL Formats

The parser supports these URL formats:

- `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
- `https://www.figma.com/design/:fileKey/:fileName?node-id=1-2`
- `https://figma.com/file/:fileKey/:fileName?node-id=1-2`

The `node-id` parameter accepts hyphen format (`1-2`) or colon format (`1:2`). The parser converts hyphens to colons for Figma MCP compatibility.

## Output

The workflow returns a guide with extracted Figma parameters (`fileKey`, `nodeId`, and original URL). After the full workflow completes, you receive a component recommendation (REUSE/EXTEND/CREATE) with confidence score and a token mapping summary.

**Example prompts:**
- ✅ "Use the MCP tool to convert this Figma design to a Storefront Next component: [Figma URL with node-id]"
- ✅ "Use the MCP tool to create this homepage from the Figma design: [Figma URL with node-id]. Create new components or update existing components using the MCP tool if necessary, then update the home page. The expected result should be that the homepage matches as closely as possible to the provided Figma design."
- ✅ "Use the MCP tool to start the Figma-to-component workflow with a custom workflow file at /path/to/custom-workflow.md"

## Usage Examples

### Basic Workflow Start

```
Use the MCP tool to convert this Figma design to a Storefront Next component: [Figma URL with node-id]
```

### Custom Workflow File

```
Use the MCP tool to start the Figma-to-component workflow with a custom workflow file at /path/to/custom-workflow.md
```

### Full Homepage Implementation

Create a homepage from a Figma design, creating or updating components as needed:

```
Use the MCP tool to create this homepage from the Figma design: [Figma URL with node-id]. Create new components or update existing components using the MCP tool if necessary, then update the home page. The expected result should be that the homepage matches as closely as possible to the provided Figma design.
```

## Requirements

- Valid Figma URL from figma.com
- URL must include `node-id` query parameter
- For custom workflow: file must exist at the provided path

## Error Handling

The tool returns formatted error messages if:

- **Invalid URL**: URL is not from figma.com, or `fileKey`/`node-id` cannot be extracted
- **Workflow file not found**: Custom `workflowFilePath` is provided but the file does not exist

**Example error format:**

```
# Error: Invalid Figma URL

Could not extract node-id from URL. Expected query parameter: ?node-id=1-2

Please provide a valid Figma URL in the format:
https://figma.com/design/:fileKey/:fileName?node-id=1-2
```

## Related Tools

- [`storefront_next_generate_component`](./storefront-next-generate-component) - Analyzes design and discovered components; recommends REUSE/EXTEND/CREATE
- [`storefront_next_map_tokens_to_theme`](./storefront-next-map-tokens-to-theme) - Maps Figma design tokens to theme variables
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## Figma MCP Tools (External)

The workflow relies on your AI assistant having access to Figma MCP tools to fetch design data:

- **get_design_context** - Generates UI code from the design and returns asset URLs
- **get_screenshot** - Provides a visual reference image of the design
- **get_metadata** - Retrieves node hierarchy, layer types, names, positions, and sizes

### Image Export and User Approval

The workflow requires the assistant to **ask for your approval before exporting any image assets**. The assistant will:

1. Call `get_design_context` **without** `dirForAssetWrites` on the initial call (never export on first call)
2. Identify image-containing nodes (photos, banners, **logos**, **brand assets**, icons)
3. Present the list of nodes to you
4. Ask once: "Should I export these N image assets now? (yes/no)"
5. Wait for your explicit "yes" before calling `get_design_context` with `dirForAssetWrites` to export

You are prompted **once per batch**—not per image. This ensures you control when assets are written to disk. Logo and brand assets are explicitly included in the identification criteria so they are not missed.

Ensure the Figma MCP server is enabled in your MCP client. See [Figma-to-Component Tools Setup](../figma-tools-setup) for configuration and the [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server) for official setup and tool details.

## See Also

- [Figma-to-Component Tools Setup](../figma-tools-setup) - Prerequisites and Figma MCP configuration
- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
