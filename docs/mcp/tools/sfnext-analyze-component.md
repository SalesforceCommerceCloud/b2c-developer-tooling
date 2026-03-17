---
description: Analyze design and discovered components to recommend REUSE, EXTEND, or CREATE strategy.
---

# sfnext_analyze_component

Analyzes design and discovered components to recommend a component generation strategy. Returns a REUSE, EXTEND, or CREATE action with confidence score, key differences, and suggested implementation approach.

> **Note:** 🚧 This MCP tool is for Storefront Next. Storefront Next is part of a closed pilot and isn't available for general use.

## Overview

The `sfnext_analyze_component` tool compares design React code (e.g., from Figma, design handoff, or other sources) against existing components discovered in the codebase. It analyzes differences across styling, structure, behavior, and props, then recommends the best approach:

- **REUSE**: Use existing component with props or minor styling adjustments
- **EXTEND**: Extend existing component via props, variant, or composition pattern
- **CREATE**: Create a new component (reference existing patterns if applicable)

**Workflow position:** Call this tool **after** retrieving design data and discovering similar components. It is a required step in the Figma-to-component workflow.

This tool is part of the STOREFRONTNEXT toolset.

## Prerequisites

- Design React code (from Figma MCP, design handoff, or other sources)
- Component discovery performed before calling
- Storefront Next project

See [Figma-to-Component Tools Setup](../figma-tools-setup) for complete prerequisites and configuration.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `figmaMetadata` | string | Yes | JSON string containing design metadata (from Figma MCP or empty). Can be empty string if metadata was not fetched. |
| `figmaCode` | string | Yes | React code from design (e.g., from Figma `mcp__figma__get_design_context`, or design handoff). |
| `componentName` | string | Yes | Suggested name for the component extracted from the design. |
| `discoveredComponents` | array | Yes | Array of similar components discovered using Glob/Grep/Read. Pass empty array if no similar components found. |
| `workspacePath` | string | No | Optional workspace root path. Defaults to the MCP server project directory. |

### Discovered Component Schema

Each item in `discoveredComponents` must have:

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Absolute file path to the component |
| `name` | string | Component name |
| `similarity` | number | Similarity score (0–100) |
| `matchType` | string | One of `'name'`, `'structure'`, `'visual'` |
| `code` | string | Full source code of the component |

## Usage Examples

### With Figma design URL

```
I have a Figma design at [URL]. Use the MCP tool to fetch the design code, search the codebase for similar components, then analyze and recommend whether to reuse, extend, or create a component.
```

### With design code already fetched

```
Use the MCP tool to analyze this design and recommend reuse, extend, or create. Design code: [paste React/JSX from Figma or design handoff]. Search the codebase for similar components first, then call the tool with the discovered components.
```

### Agent workflow note

When the agent searches the codebase and finds no similar components, it should still call the tool with `discoveredComponents: []` to get a CREATE recommendation. The user does not need to specify this—the agent discovers it during the workflow.

## Output

Returns a formatted recommendation including:

- **Decision**: REUSE, EXTEND, or CREATE
- **Confidence**: Percentage (0–100)
- **Matched Component**: Path, name, similarity (if applicable)
- **Key Differences**: List of difference descriptions
- **Suggested Approach**: Implementation guidance
- **Next Steps**: Action-specific instructions

## Related Tools

- [`sfnext_start_figma_workflow`](./sfnext-start-figma-workflow) - Call first to get workflow instructions and Figma parameters
- [`sfnext_match_tokens_to_theme`](./sfnext-match-tokens-to-theme) - Match design tokens to theme variables
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [Figma-to-Component Tools Setup](../figma-tools-setup) - Prerequisites and Figma MCP configuration
- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
