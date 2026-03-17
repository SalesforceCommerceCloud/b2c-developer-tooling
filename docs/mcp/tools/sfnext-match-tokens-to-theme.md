---
description: Match Figma design tokens to existing theme tokens in app.css with confidence scores and suggestions.
---

# sfnext_match_tokens_to_theme

Matches Figma design tokens (colors, spacing, radius, etc.) to your Storefront Next theme tokens in `app.css`. Helps you identify which design tokens match existing theme variables and suggests new token names for values that don't have matches.

> **Note:** 🚧 This MCP tool is for Storefront Next. Storefront Next is part of a closed pilot and isn't available for general use.

## Overview

The `sfnext_match_tokens_to_theme` tool helps you use theme tokens instead of hardcoded values in your components. After retrieving design tokens (from Figma, design handoff, or other sources), use this tool to match them against your Storefront Next theme.

The tool reads your `app.css` theme file (or you can specify a custom path) and compares Figma design tokens against your existing theme variables. It returns a report with instructions showing which tokens match, which are similar, and which need new theme variables created. **The tool does not modify files**—it provides recommendations and instructions for you to apply.

This tool is part of the STOREFRONTNEXT toolset.

## Prerequisites

- Storefront Next project with `app.css` (or provide `themeFilePath` explicitly)
- Design tokens extracted (from Figma, design system, or other sources)

See [Figma-to-Component Tools Setup](../figma-tools-setup) for complete prerequisites and configuration.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `figmaTokens` | array | Yes | Array of design tokens (e.g., from Figma, design system, or style guide). |
| `themeFilePath` | string | No | Optional absolute path to theme CSS file. If not provided, searches for `app.css` in common locations. |

### Figma Token Schema

Each token in `figmaTokens` must have:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Token name from Figma (e.g., `"Primary/Blue"`, `"Spacing/Large"`). |
| `value` | string | Yes | Token value (e.g., `"#2563eb"`, `"16px"`, `"0.5rem"`). |
| `type` | string | Yes | One of: `color`, `spacing`, `radius`, `opacity`, `fontSize`, `fontFamily`, `other`. |
| `description` | string | No | Optional description from Figma. |

## Usage Examples

**Match design tokens to your theme (default app.css):**
```
Use the MCP tool to match these design tokens to my theme: Primary/Blue #2563eb (color), Spacing/Large 16px (spacing).
```

**Match design tokens with custom theme file path:**
```
Use the MCP tool to match these design tokens to my theme at /path/to/app.css:
- Primary/Blue #2563eb (color)
- Spacing/Large 16px (spacing)
```

## Output

Returns a report (does not modify files) showing:
- Which Figma design tokens match existing theme variables (exact matches)
- Which tokens are similar to existing variables (suggested matches)
- Which tokens need new theme variables created (with suggested names)
- Instructions for using the matched tokens in components and adding new tokens to your theme file

## Related Tools

- [`sfnext_start_figma_workflow`](./sfnext-start-figma-workflow) - Workflow orchestrator; call first
- [`sfnext_analyze_component`](./sfnext-analyze-component) - REUSE/EXTEND/CREATE recommendation
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [Figma-to-Component Tools Setup](../figma-tools-setup) - Prerequisites and Figma MCP configuration
- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
