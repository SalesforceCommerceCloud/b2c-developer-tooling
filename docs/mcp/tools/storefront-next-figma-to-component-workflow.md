---
description: Workflow orchestrator for Figma-to-component conversion. Parses your Figma URL and guides you through design-to-component conversion.
---

# storefront_next_figma_to_component_workflow

Workflow orchestrator for converting Figma designs to Storefront Next components. Provide a Figma design URL to start the workflow, which extracts design data, analyzes your codebase, and produces component recommendations.

> **Note:** 🚧 This MCP tool is for Storefront Next. Storefront Next is part of a closed pilot and isn't available for general use.

## Overview

When you provide a Figma design URL, the workflow will:

- Fetch design context and screenshots from Figma
- Ask for your approval before exporting images (photos, logos, icons)
- Discover similar components in your project
- Recommend whether to REUSE, EXTEND, or CREATE a component
- Map Figma design tokens to your theme variables

You receive a component recommendation with confidence score and a token mapping summary when the workflow completes.

This tool is part of the STOREFRONTNEXT toolset.

## Prerequisites

- **B2C DX MCP** configured with `--allow-non-ga-tools`
- **Figma MCP server** (external) enabled in your MCP client
- **Valid Figma URL** with `node-id` query parameter (obtain by right-clicking a frame in Figma → Copy link to selection)

See [Figma-to-Component Tools Setup](../figma-tools-setup) for complete prerequisites and configuration.

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


## Related Tools

- [`storefront_next_generate_component`](./storefront-next-generate-component) - Analyzes design and discovered components; recommends REUSE/EXTEND/CREATE
- [`storefront_next_map_tokens_to_theme`](./storefront-next-map-tokens-to-theme) - Maps Figma design tokens to theme variables
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [Figma-to-Component Tools Setup](../figma-tools-setup) - Prerequisites and Figma MCP configuration
- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
