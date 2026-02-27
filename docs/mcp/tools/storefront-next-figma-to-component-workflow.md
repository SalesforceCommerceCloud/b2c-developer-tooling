---
description: Workflow orchestrator for Figma-to-component conversion. Parses Figma URL, returns step-by-step instructions for subsequent tool calls.
---

# storefront_next_figma_to_component_workflow

Workflow orchestrator for converting Figma designs to Storefront Next components. Call this tool **first** when converting Figma designs. It parses the Figma URL to extract `fileKey` and `nodeId`, then returns step-by-step workflow instructions and parameters for subsequent tool calls.

## Overview

The `storefront_next_figma_to_component_workflow` tool is a **workflow orchestrator** that provides instructions only. It does **not** fetch design data or generate components.

After calling this tool, you **must** continue executing the complete workflow:

1. Call Figma MCP tools to fetch design data
2. Discover similar components using Glob/Grep/Read
3. Call `storefront_next_generate_component` for REUSE/EXTEND/CREATE recommendation
4. Call `storefront_next_map_tokens_to_theme` for token mapping
5. Show both outputs to the user, then implement the recommended approach

**Important:** Do not stop after receiving workflow instructions. Execute all steps to complete the conversion.

This tool is part of the STOREFRONTNEXT toolset.

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

Returns a workflow guide containing:

- **Figma Design Parameters**: Extracted `fileKey`, `nodeId`, and original URL as JSON
- **Workflow Guidelines**: Step-by-step instructions for the conversion process
- **Next Steps Reminder**: Critical reminder to execute all subsequent tool calls

**Expected final output from the full workflow:** A recommendation with confidence score from `storefront_next_generate_component` and a token mapping summary from `storefront_next_map_tokens_to_theme`.

## Usage Examples

### Basic Workflow Start

```
Use the MCP tool to convert this Figma design to a Storefront Next component: https://figma.com/design/abc123/MyDesign?node-id=1-2
```

### Custom Workflow File

```
Use the MCP tool to start the Figma-to-component workflow with a custom workflow file at /path/to/custom-workflow.md
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

When executing the workflow, call these Figma MCP tools with the extracted parameters. Always include `clientLanguages="typescript"` and `clientFrameworks="react"`:

- `mcp__figma__get_design_context` (REQUIRED) - Generates UI code and returns asset URLs
- `mcp__figma__get_screenshot` (REQUIRED) - Provides visual reference of the design
- `mcp__figma__get_metadata` (OPTIONAL) - Retrieves node hierarchy, layer types, names, positions, and sizes

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
