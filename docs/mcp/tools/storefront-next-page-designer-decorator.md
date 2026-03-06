---
description: Add Page Designer decorators to React components for Storefront Next to make them available in Page Designer.
---

# storefront_next_page_designer_decorator

Adds Page Designer decorators (`@Component`, `@AttributeDefinition`, `@RegionDefinition`) to React components to make them available in Page Designer for Storefront Next.

## Overview

The `storefront_next_page_designer_decorator` tool analyzes React components and generates Page Designer decorators that enable components to be used in Page Designer. It supports two modes:

1. **Auto Mode**: Quick setup with sensible defaults-automatically selects suitable props, infers types, and generates decorators immediately.
2. **Interactive Mode**: Multi-step workflow for fine-tuned control over decorator configuration.

The tool uses component discovery to find components by name (e.g., "ProductItem", "ProductTile") without requiring exact file paths, making it easy to add Page Designer support to existing components.

## Prerequisites

- Storefront Next project with React components

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `component` | string | Yes | Component name (for example, `"ProductItem"`, `"ProductTile"`) or file path (for example, `"src/components/ProductItem.tsx"`). When a name is provided, the tool automatically searches common component directories. |
| `searchPaths` | string[] | No | Additional directories to search for components (for example, `["packages/retail/src", "app/features"]`). Only used when a component is specified by name (not path). |
| `autoMode` | boolean | No | Auto-generate all configurations with sensible defaults (skip interactive workflow). When enabled, automatically selects suitable props, infers types, and generates decorators without user confirmation. |
| `componentId` | string | No | Override component ID (default: auto-generated from component name). |
| `conversationContext` | object | No | Context for interactive mode workflow. See [Interactive Mode](#interactive-mode) for details. |

### Conversation Context (Interactive Mode)

When using interactive mode, provide `conversationContext` with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `step` | `"analyze"` \| `"select_props"` \| `"configure_attrs"` \| `"configure_regions"` \| `"confirm_generation"` | Current step in the conversation workflow |
| `componentInfo` | object | Cached component analysis from previous step |
| `selectedProps` | string[] | Props from component interface selected to expose in Page Designer |
| `newAttributes` | object[] | New attributes to add (not in existing props) |
| `attributeConfig` | object | Configuration for each attribute (explicit types, names, defaults, etc.) |
| `componentMetadata` | object | Component decorator configuration (id, name, description, group) |
| `regionConfig` | object | Region configuration (enabled, regions array) |

## Operation Modes

The tool supports two modes:

1. **Auto Mode**: Quick setup with sensible defaults—automatically selects suitable props, infers types, and generates decorators immediately.
2. **Interactive Mode**: Multi-step workflow for fine-tuned control over decorator configuration.

## Component Discovery

The tool automatically searches for components in these locations (in order):

1. `src/components/**` (PascalCase and kebab-case)
2. `app/components/**`
3. `components/**`
4. `src/**` (broader search)
5. Custom paths (if provided via `searchPaths`)

**Examples:**

- `"ProductItem"` → finds `src/components/product-item/index.tsx` or `ProductItem.tsx`
- `"ProductTile"` → finds `src/components/product-tile/ProductTile.tsx` or `product-tile/index.tsx`
- `"product-item"` → finds `src/components/product-item.tsx` or `product-item/index.tsx`

**Tips:**

- Use component name for portability
- Use path for unusual locations
- Add `searchPaths` for monorepos or non-standard structures

## Usage Examples

**Auto mode (quick setup):**
```
Use the MCP tool to add Page Designer decorators to my ProductItem component.
```

**Interactive mode (fine-tuned control):**
```
Use the MCP tool to add Page Designer decorators to my ProductTile component interactively.
```

**With custom search paths:**
```
Use the MCP tool to add Page Designer decorators to ProductItem, searching in packages/retail/src and app/features.
```

**Using component path:**
```
Use the MCP tool to add Page Designer decorators to src/components/ProductItem.tsx.
```

## Output

The tool returns generated Page Designer decorator code that you can add to your component file. The decorators include component metadata, attribute definitions for props, and region definitions (if configured).


## Related Tools

- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
