---
description: Map Figma design tokens to existing theme tokens in app.css with confidence scores and suggestions.
---

# storefront_next_map_tokens_to_theme

Maps Figma design tokens (colors, spacing, radius, etc.) to your Storefront Next theme tokens in `app.css`. Helps you identify which Figma tokens match existing theme variables and suggests new token names for values that don't have matches.

> **Note:** 🚧 This MCP tool is for Storefront Next. Storefront Next is part of a closed pilot and isn't available for general use.

## Overview

The `storefront_next_map_tokens_to_theme` tool helps you use theme tokens instead of hardcoded values in your components. After retrieving design tokens from Figma, use this tool to map them to your Storefront Next theme.

The tool reads your `app.css` theme file (or you can specify a custom path) and compares Figma tokens against your existing theme variables. It returns a report with instructions showing which tokens match, which are similar, and which need new theme variables created. **The tool does not modify files**—it provides recommendations and instructions for you to apply.

This tool is part of the STOREFRONTNEXT toolset.

## Prerequisites

- Storefront Next project with `app.css` (or provide `themeFilePath` explicitly)
- Figma tokens extracted from design (colors, spacing, radius, etc.)

See [Figma-to-Component Tools Setup](../figma-tools-setup) for complete prerequisites and configuration.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `figmaTokens` | array | Yes | Array of design tokens extracted from Figma. |
| `themeFilePath` | string | No | Optional absolute path to theme CSS file. If not provided, searches for `app.css` in common locations. |

### Figma Token Schema

Each token in `figmaTokens` must have:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Token name from Figma (e.g., `"Primary/Blue"`, `"Spacing/Large"`). |
| `value` | string | Yes | Token value (e.g., `"#2563eb"`, `"16px"`, `"0.5rem"`). |
| `type` | string | Yes | One of: `color`, `spacing`, `radius`, `opacity`, `fontSize`, `fontFamily`, `other`. |
| `description` | string | No | Optional description from Figma. |


## Output

Returns a report (does not modify files) showing:
- Which Figma tokens match existing theme variables (exact matches)
- Which tokens are similar to existing variables (suggested matches)
- Which tokens need new theme variables created (with suggested names)
- Instructions for using the matched tokens in components and adding new tokens to your theme file

## Usage Examples

**Map Figma tokens to your theme:**
```
Use the MCP tool to map these Figma tokens to my theme: Primary/Blue #2563eb (color), Spacing/Large 16px (spacing).
```

**With custom theme file path:**
```
Use the MCP tool to map Figma design tokens to my theme file at /path/to/app.css.
```


## Related Tools

- [`storefront_next_figma_to_component_workflow`](./storefront-next-figma-to-component-workflow) - Workflow orchestrator; call first
- [`storefront_next_generate_component`](./storefront-next-generate-component) - REUSE/EXTEND/CREATE recommendation
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [Figma-to-Component Tools Setup](../figma-tools-setup) - Prerequisites and Figma MCP configuration
- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
