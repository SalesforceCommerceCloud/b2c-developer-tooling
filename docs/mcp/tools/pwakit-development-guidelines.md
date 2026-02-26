---
description: Get PWA Kit v3 development guidelines and best practices for React, Chakra UI, and Commerce API.
---

# pwakit_development_guidelines

Returns critical architecture rules, coding standards, and best practices for building PWA Kit v3 applications with React, Chakra UI, and Commerce API. **Use this tool first** before writing any PWA Kit code.

## Overview

The `pwakit_development_guidelines` tool provides essential development guidance for PWA Kit v3. It:

1. Returns comprehensive guidelines by default (quick-reference plus key sections).
2. Supports retrieving specific topic sections on demand.
3. Loads content from markdown files covering components, data fetching, routing, configuration, and more.

**Important:** This tool is the **essential first step** for PWA Kit v3 development. Use it before writing any code to understand non-negotiable patterns for React components, data fetching, routing, configuration, and framework constraints.

This tool is part of the PWAV3 toolset and is auto-enabled for PWA Kit v3 projects (detected by `@salesforce/pwa-kit-*` dependencies).

## Authentication

No authentication required. This tool operates on local content only—guidelines are loaded from markdown files bundled with the MCP server.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sections` | string[] | No | `['quick-reference', 'components', 'data-fetching', 'routing']` | Optional array of specific sections to retrieve. If not specified, returns comprehensive guidelines. Pass an empty array to return an empty string. |

### Available Sections

| Section | Topics Covered |
|---------|----------------|
| `quick-reference` | Critical rules, architecture principles, quick patterns |
| `components` | Component patterns, Chakra UI, special components (_app, _app-config, _error), React Hooks |
| `data-fetching` | commerce-sdk-react hooks, useCustomQuery/useCustomMutation, React Query, custom APIs, caching |
| `routing` | Express.js, React Router, configureRoutes, SSR/CSR navigation, withReactQuery, getProps patterns |
| `config` | Configuration files, environment variables, file precedence, proxy setup, multi-site |
| `state-management` | Context API, useReducer, Redux integration, AppConfig methods |
| `extensibility` | Template extension, ccExtensibility configuration, overrides directory |
| `testing` | Jest, React Testing Library, MSW, test organization, coverage |
| `i18n` | React Intl, translation extraction/compilation, multi-locale support |
| `styling` | Chakra UI theming, Emotion CSS-in-JS, responsive design |

## Usage Examples

### Default (Comprehensive Guidelines)

Get the default comprehensive set (quick-reference, components, data-fetching, routing):

```
Use the MCP tool to get PWA Kit development guidelines before I start coding.
```

### Single Section

Retrieve a specific topic:

```
Use the MCP tool to get PWA Kit guidelines for data-fetching patterns.
```

### Multiple Related Sections

Combine related sections in one call:

```
Use the MCP tool to get PWA Kit guidelines for components, routing, and config.
```

### All Sections

Retrieve all available sections:

```
Use the MCP tool to get all PWA Kit development guidelines.
```

## Output

Returns text content with guidelines for the requested section(s):

- **Single section**: Returns content directly (no separators or instructions).
- **Multiple sections**: Returns content with `---` separators between sections, prefixed with instructions to display full content without summarization.

The returned content includes:

- Critical rules and best practices
- Code examples (correct ✅ and incorrect ❌ patterns)
- Quick reference snippets
- Framework-specific patterns for React, Chakra UI, and commerce-sdk-react

## Content Structure

Content is loaded from markdown files in the MCP package (`packages/b2c-dx-mcp/content/pwav3/`). Each section is a separate file (~100–200 lines), enabling:

- **Token efficiency**: Returns only relevant content (200–500 lines vs 20K+ full doc).
- **Modular access**: Request specific sections as needed.
- **Multi-select**: Combine related sections in a single call for contextual learning.

## Requirements

- PWA Kit v3 project or general PWA Kit development context
- No credentials or instance configuration needed

## Related Tools

- Part of the [PWAV3](../toolsets#pwav3) toolset
- Auto-enabled for PWA Kit v3 projects (detected by `@salesforce/pwa-kit-*` dependencies)
- [`mrt_bundle_push`](./mrt-bundle-push) - Build and push bundles to Managed Runtime

## See Also

- [PWAV3 Toolset](../toolsets#pwav3) - Overview of PWA Kit v3 tools
- [Configuration](../configuration) - Configure MCP server and toolset selection
