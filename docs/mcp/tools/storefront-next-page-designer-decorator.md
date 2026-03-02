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

## Authentication

No authentication required. This tool operates on local files only.

**Requirements:**
- `--project-directory` flag or `SFCC_PROJECT_DIRECTORY` environment variable (for component discovery)
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

### Auto Mode

Auto mode generates decorators immediately with sensible defaults:

- Automatically selects suitable props (excludes complex types, UI-only props)
- Infers types from TypeScript interfaces
- Generates decorator code without user confirmation

**Usage:**

```
Use the MCP tool to add Page Designer decorators to my ProductItem component with auto mode.
```

**Example:**

```json
{
  "component": "ProductItem",
  "autoMode": true
}
```

### Interactive Mode

Interactive mode provides a multi-step workflow for fine-tuned control:

1. **Analyze** (`step: "analyze"`) - Analyze component and review props
2. **Select Props** (`step: "select_props"`) - Choose which props to expose
3. **Configure Attributes** (`step: "configure_attrs"`) - Configure types, defaults, and values
4. **Configure Regions** (`step: "configure_regions"`) - Configure nested content areas
5. **Confirm Generation** (`step: "confirm_generation"`) - Generate final decorator code

**Usage:**

```
Use the MCP tool to add Page Designer decorators to my ProductTile component interactively.
```

**Example:**

```json
{
  "component": "ProductTile",
  "conversationContext": {
    "step": "analyze"
  }
}
```

## Component Discovery

The tool automatically searches for components in these locations (in order):

1. `src/components/**` (PascalCase and kebab-case)
2. `app/components/**`
3. `components/**`
4. `src/**` (broader search)
5. Custom paths (if provided via `searchPaths`)

**Project Directory:**
Component discovery uses the project directory from `--project-directory` flag or `SFCC_PROJECT_DIRECTORY` environment variable. This ensures searches start from the correct project directory, especially when MCP clients spawn servers from the home directory.

**Examples:**

- `"ProductItem"` → finds `src/components/product-item/index.tsx` or `ProductItem.tsx`
- `"ProductTile"` → finds `src/components/product-tile/ProductTile.tsx` or `product-tile/index.tsx`
- `"product-item"` → finds `src/components/product-item.tsx` or `product-item/index.tsx`

**Tips:**

- Use component name for portability
- Use path for unusual locations
- Add `searchPaths` for monorepos or non-standard structures
- Ensure `--project-directory` flag or `SFCC_PROJECT_DIRECTORY` env var is set correctly

## Usage Examples

### Basic Auto Mode

Add Page Designer support with auto-generated defaults:

```
Use the MCP tool to add Page Designer decorators to my ProductItem component.
```

### Auto Mode with Custom Search Paths

Search in custom directories:

```
Use the MCP tool to add Page Designer decorators to ProductItem, searching in packages/retail/src and app/features.
```

### Interactive Mode - Start Analysis

Begin interactive workflow:

```
Use the MCP tool to analyze my ProductTile component for Page Designer decorators.
```

### Path-Based Usage

Specify exact component path:

```
Use the MCP tool to add Page Designer decorators to src/components/ProductItem.tsx with auto mode.
```

## Output

The tool returns generated decorator code that includes:

- **Imports**: Required Page Designer decorator imports
- **@Component Decorator**: Component metadata (id, name, description, group)
- **@AttributeDefinition Decorators**: Attribute definitions for each prop
- **@RegionDefinition Decorator**: Region definitions (if configured)

**Example Output:**

```typescript
import { Component, AttributeDefinition, RegionDefinition } from '@salesforce/page-designer';

@Component({
  id: 'product-item',
  name: 'Product Item',
  description: 'Displays product information',
  group: 'Commerce'
})
export class ProductItemMetadata {
  @AttributeDefinition({
    id: 'product-id',
    name: 'Product ID',
    type: 'string',
    required: true
  })
  productId: string;

  @AttributeDefinition({
    id: 'show-price',
    name: 'Show Price',
    type: 'boolean',
    defaultValue: true
  })
  showPrice: boolean;
}
```

## Requirements

- Storefront Next project
- React component with TypeScript interfaces
- `--project-directory` flag or `SFCC_PROJECT_DIRECTORY` environment variable set
- Component must be discoverable in standard directories or via `searchPaths`

## Features

- **Name-Based Lookup**: Find components by name without knowing paths
- **Auto-Discovery**: Automatically searches common component directories
- **Type-Safe**: Full TypeScript type inference for all contexts
- **Fast**: Direct function execution, no file I/O or compilation overhead
- **Flexible Input**: Supports component names or file paths
- **Two Modes**: Auto mode for quick setup, Interactive mode for fine-tuned control

## Related Tools

- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects
- Related: [`storefront_next_generate_page_designer_metadata`](../toolsets#storefrontnext) - Generate Page Designer metadata

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Configuration](../configuration) - Configure project directory
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
