---
description: Map Figma design tokens to existing theme tokens in app.css with confidence scores and suggestions.
---

# storefront_next_map_tokens_to_theme

Maps Figma design tokens to existing Storefront Next theme tokens in `app.css`. Analyzes Figma tokens (colors, spacing, radius, etc.), finds exact and fuzzy matches with confidence scores, suggests new token names for unmatched values, and recommends where to add new tokens in the CSS file.

## Overview

The `storefront_next_map_tokens_to_theme` tool ensures components use theme tokens instead of hardcoded values. Use it after retrieving design variables from Figma MCP to map Figma tokens to your Storefront Next theme.

**Features:**

- **Exact matching**: Hex color values matched against theme tokens
- **Fuzzy matching**: Name similarity, semantic meaning, and value similarity (for colors)
- **Confidence scores**: 0–100% for each match
- **Suggestions**: New token names and insertion points for unmatched values
- **Theme awareness**: Light, dark, and shared theme sections

**Theme file discovery:** When `themeFilePath` is not provided, the tool searches for `app.css` in `src/app.css` or `app.css` relative to the workspace root.

This tool is part of the STOREFRONTNEXT toolset.

## Authentication

No authentication required. This tool operates on local theme files.

**Requirements:**

- `--project-directory` flag or `SFCC_PROJECT_DIRECTORY` / `SFCC_WORKING_DIRECTORY` environment variable (for theme file discovery)
- Storefront Next project with `app.css` containing theme tokens

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

## Matching Logic

**Exact match (colors):** Hex values are normalized (lowercase, 6-digit) and compared. Exact matches receive 100% confidence.

**Fuzzy match:** Combines:

- Name similarity (40% weight) – Levenshtein distance
- Semantic similarity (30% weight) – Keywords like `primary`, `background`, `border`, `muted`, etc.
- Value similarity (30% weight) – For colors, Euclidean distance in RGB space

**No match:** When no good match is found (fuzzy score < 50), the tool suggests new token names and insertion points based on existing naming patterns.

## Theme File Parsing

The tool uses PostCSS to parse theme CSS and extract tokens from:

- `@theme inline` blocks (shared tokens)
- `:root` and `[data-theme="light"]` (light theme)
- `.dark` and `[data-theme="dark"]` (dark theme)

`var()` references are resolved recursively. Unresolved references produce warnings and are excluded from matching.

## Output

Returns a formatted report containing:

- **Summary**: Total tokens, exact/fuzzy/no matches, high/low confidence counts
- **Detailed Mapping Results**: Per-token match type, confidence, matched token, reason, suggestions
- **Recommendations**: Create new tokens or review low-confidence matches
- **Usage Instructions**: How to use matched tokens in components and add new tokens

**Example output structure:**

```markdown
# Figma Design Tokens → StorefrontNext Theme Mapping

## Summary

- **Total Tokens**: 5
- **Exact Matches**: 2
- **Fuzzy Matches**: 2
- **No Matches**: 1
...

### ✅ Exact Matches (Use these tokens directly)
- `Primary/Blue` → `--color-primary`

### ⚠️ High Confidence Fuzzy Matches (Review and confirm)
- `Spacing/Large` → `--spacing-4` (85%)

### ❌ No Matches (New tokens needed)
- `Accent/Teal`: #0d9488
  - Suggested: `--color-accent-teal`

## Detailed Mapping Results
...
## 💡 Usage Instructions
...
```

## Usage Examples

### Basic Token Mapping

```
Use the MCP tool to map these Figma tokens to my theme: Primary/Blue #2563eb (color), Spacing/Large 16px (spacing).
```

### With Custom Theme Path

```
Use the MCP tool to map Figma design tokens to my theme file at /path/to/app.css.
```

## Requirements

- Storefront Next project with `app.css` (or valid `themeFilePath`)
- `--project-directory` set when theme path is not explicitly provided
- Figma tokens extracted from design (colors, spacing, radius, etc.)

## Error Handling

The tool returns a formatted error if:

- Theme file (`app.css`) is not found
- Theme file path is invalid or inaccessible

**Example error:**

```
# Error: Token Mapping Failed

Theme file (app.css) not found. Please provide the themeFilePath parameter.

Please ensure the theme file path is correct and accessible.
```

## Related Tools

- [`storefront_next_figma_to_component_workflow`](./storefront-next-figma-to-component-workflow) - Workflow orchestrator; call first
- [`storefront_next_generate_component`](./storefront-next-generate-component) - REUSE/EXTEND/CREATE recommendation
- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
