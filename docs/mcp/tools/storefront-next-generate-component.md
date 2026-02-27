---
description: Analyze Figma design and discovered components to recommend REUSE, EXTEND, or CREATE strategy.
---

# storefront_next_generate_component

Analyzes Figma design and discovered components to recommend a component generation strategy. Returns a REUSE, EXTEND, or CREATE action with confidence score, key differences, and suggested implementation approach.

## Overview

The `storefront_next_generate_component` tool compares Figma-generated React code against existing components discovered in the codebase. It analyzes differences across styling, structure, behavior, and props, then recommends the best approach:

- **REUSE**: Use existing component with props or minor styling adjustments
- **EXTEND**: Extend existing component via props, variant, or composition pattern
- **CREATE**: Create a new component (reference existing patterns if applicable)

**Workflow position:** Call this tool **after** retrieving Figma design data and discovering similar components. It is a required step in the Figma-to-component workflow.

This tool is part of the STOREFRONTNEXT toolset.

## Prerequisites

- Figma design data retrieved via Figma MCP tools
- Component discovery performed (Glob/Grep/Read) before calling
- `--project-directory` set for workspace context (optional but recommended)

See [Figma-to-Component Tools Setup](../figma-tools-setup) for complete prerequisites and configuration.

## Authentication

No authentication required. This tool operates on provided input data and workspace context.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `figmaMetadata` | string | Yes | JSON string containing Figma design metadata from `mcp__figma__get_metadata`. Can be empty string if metadata was not fetched. |
| `figmaCode` | string | Yes | Generated React code from Figma (from `mcp__figma__get_design_context`). |
| `componentName` | string | Yes | Suggested name for the component extracted from the Figma design. |
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

## Analysis Logic

The tool analyzes differences in four categories:

- **Styling**: Tailwind classes, inline styles, theme tokens
- **Structural**: JSX hierarchy, elements, nesting, root element changes
- **Behavioral**: Hooks, event handlers, client/server rendering (`use client`)
- **Props**: Interface/prop definitions, new props, type changes

**Decision thresholds:**

- **REUSE**: Difference score ≤ 2, no breaking changes
- **EXTEND**: Moderate differences; strategy chosen from props, variant, or composition
- **CREATE**: Difference score > 10, or more than 2 breaking changes

**Extend strategies:**

- **Props**: Add new optional props (1–3 new props, backward compatible)
- **Variant**: Add visual variants (styling-focused changes)
- **Composition**: Create wrapper component that composes the base component

## Output

Returns a formatted recommendation including:

- **Decision**: REUSE, EXTEND, or CREATE
- **Confidence**: Percentage (0–100)
- **Matched Component**: Path, name, similarity (if applicable)
- **Key Differences**: List of difference descriptions
- **Suggested Approach**: Implementation guidance
- **Next Steps**: Action-specific instructions

**Example output structure:**

```markdown
# Component Generation Recommendation

**Decision:** EXTEND
**Confidence:** 78%

**Matched Component:**
- `PrimaryButton` at `src/components/ui/PrimaryButton.tsx`
- Similarity: 85%

**Recommendation:** The existing component "PrimaryButton" can be extended to support the Figma design.

**Key Differences:**
1. New Tailwind classes: rounded-lg, shadow-md
2. Figma design includes event handlers (onClick, onChange, etc.)

## Suggested Approach
...
## Next Steps
...
```

**Example prompts:**
- ✅ "Use the MCP tool to analyze the Figma design and recommend whether to reuse, extend, or create a component. I've discovered PrimaryButton and SecondaryButton as similar components."
- ✅ "Use the MCP tool to analyze the Figma design. No similar components were found in the codebase."

## Usage Examples

### With Discovered Components

```
Use the MCP tool to analyze the Figma design and recommend whether to reuse, extend, or create a component. I've discovered PrimaryButton and SecondaryButton as similar components.
```

### No Similar Components

```
Use the MCP tool to analyze the Figma design. No similar components were found in the codebase.
```

## Requirements

- Figma design data retrieved via Figma MCP tools
- Component discovery performed (Glob/Grep/Read) before calling
- `discoveredComponents` array (can be empty)

## Error Handling

The tool returns a formatted error message if analysis fails:

```
# Error: Component Generation Failed

<error message>

Please check the input parameters and try again.
```

## Related Tools

- [`storefront_next_figma_to_component_workflow`](./storefront-next-figma-to-component-workflow) - Call first to get workflow instructions and Figma parameters
- [`storefront_next_map_tokens_to_theme`](./storefront-next-map-tokens-to-theme) - Map Figma design tokens to theme variables
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [Figma-to-Component Tools Setup](../figma-tools-setup) - Prerequisites and Figma MCP configuration
- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
