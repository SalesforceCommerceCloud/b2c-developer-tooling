---
description: Get Storefront Next development guidelines and best practices for React Server Components, data loading, and framework constraints.
---

# storefront_next_development_guidelines

Returns critical architecture rules, coding standards, and best practices for building Storefront Next applications with React Server Components. **Use this tool first** before writing any Storefront Next code.

## Overview

The `storefront_next_development_guidelines` tool provides essential development guidance for Storefront Next. It:

1. Returns comprehensive guidelines by default (quick-reference plus key sections).
2. Supports retrieving specific topic sections on demand.
3. Loads content from markdown files covering architecture, data fetching, components, testing, and more.

**Important:** This tool is the **essential first step** for Storefront Next development. Use it before writing any code to understand non-negotiable patterns for React Server Components, data loading, and framework constraints.

This tool is part of the STOREFRONTNEXT toolset and is auto-enabled for Storefront Next projects (detected by `@salesforce/storefront-next*` dependencies).

## Authentication

No authentication required. This tool operates on local content only—guidelines are loaded from markdown files bundled with the MCP server.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sections` | string[] | No | `['quick-reference', 'data-fetching', 'components', 'testing']` | Optional array of specific sections to retrieve. If not specified, returns comprehensive guidelines. Pass an empty array to return an empty string. |

### Available Sections

| Section | Topics Covered |
|---------|----------------|
| `quick-reference` | Critical rules, architecture principles, quick patterns |
| `data-fetching` | Server-only data loading (no client loaders), synchronous loaders for streaming, data fetching patterns |
| `state-management` | State management patterns |
| `auth` | Authentication and session management |
| `config` | Configuration system |
| `i18n` | i18n patterns and internationalization |
| `components` | Component best practices |
| `styling` | Tailwind CSS 4, Shadcn/ui, styling guidelines |
| `page-designer` | Page Designer integration |
| `performance` | Performance optimization |
| `testing` | Testing strategies |
| `extensions` | Framework extensions |
| `pitfalls` | Common pitfalls to avoid |

## Usage Examples

### Default (Comprehensive Guidelines)

Get the default comprehensive set (quick-reference, data-fetching, components, testing):

```
Use the MCP tool to get Storefront Next development guidelines before I start coding.
```

### Single Section

Retrieve a specific topic:

```
Use the MCP tool to get Storefront Next guidelines for data-fetching patterns.
```

### Multiple Related Sections

Combine related sections in one call:

```
Use the MCP tool to get Storefront Next guidelines for data-fetching, components, and performance.
```

### All Sections

Retrieve all available sections:

```
Use the MCP tool to get all Storefront Next development guidelines.
```

## Output

Returns text content with guidelines for the requested section(s):

- **Single section**: Returns content directly (no separators or instructions).
- **Multiple sections**: Returns content with `---` separators between sections, prefixed with instructions to display full content without summarization.

The returned content includes:

- Critical rules and best practices
- Code examples (correct ✅ and incorrect ❌ patterns)
- Quick reference snippets
- Framework-specific patterns for React Server Components

## Requirements

- Storefront Next project or general Storefront Next development context
- No credentials or instance configuration needed

## Related Tools

- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects
- [`storefront_next_page_designer_decorator`](./storefront-next-page-designer-decorator) - Add Page Designer decorators to components

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next tools
- [Storefront Next Guide](../../guide/storefront-next) - User guide for Storefront Next
- [Configuration](../configuration) - Configure MCP server and toolset selection
