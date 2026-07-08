---
description: Get PWA Kit v3 development guidelines and best practices for React, Chakra UI, and Commerce API.
---

# PWA Kit Development Guidelines

MCP tools that provide PWA Kit v3 development guidance. Available in the **PWAV3** toolset and auto-enabled for PWA Kit v3 projects (detected by `@salesforce/pwa-kit-*` dependencies).

## pwakit_get_guidelines

Returns critical architecture rules, coding standards, and best practices for building PWA Kit v3 applications with React, Chakra UI, and Commerce API — covering the non-negotiable patterns for React components, data fetching, routing, configuration, and framework constraints. It gives an AI agent the framework's ground rules before it writes PWA Kit code.

### Authentication

No authentication required; content is bundled with the MCP server.

### Parameters

| Parameter  | Type     | Required | Default                                                         | Description                                                                                                                                         |
| ---------- | -------- | -------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections` | string[] | No       | `['quick-reference', 'components', 'data-fetching', 'routing']` | Optional array of specific sections to retrieve. If not specified, returns comprehensive guidelines. Pass an empty array to return an empty string. |

#### Available Sections

| Section            | Topics Covered                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `quick-reference`  | Critical rules, architecture principles, quick patterns                                          |
| `components`       | Component patterns, Chakra UI, special components (\_app, \_app-config, \_error), React Hooks    |
| `data-fetching`    | React Query, commerce-sdk-react hooks, useCustomQuery/useCustomMutation, custom APIs, caching    |
| `routing`          | Express.js, React Router, configureRoutes, SSR/CSR navigation, withReactQuery, getProps patterns |
| `config`           | Configuration files, environment variables, file precedence, proxy setup, multi-site             |
| `state-management` | Context API, useReducer, Redux integration, AppConfig methods                                    |
| `extensibility`    | Template extension, ccExtensibility configuration, overrides directory                           |
| `testing`          | Jest, React Testing Library, MSW, test organization, coverage                                    |
| `i18n`             | React Intl, translation extraction/compilation, multi-locale support                             |
| `styling`          | Chakra UI theming, Emotion CSS-in-JS, responsive design                                          |

### Usage

#### Default (Comprehensive Guidelines)

```
Get PWA Kit development guidelines before I start coding.
```

Returns the default comprehensive set (quick-reference, components, data-fetching, routing).

#### Single or Multiple Sections

```
Get PWA Kit guidelines for data-fetching patterns.
```

```
Get PWA Kit guidelines for components, routing, and config.
```

**Returns:** Guideline text for the requested section(s), including critical rules, code examples (correct ✅ and incorrect ❌ patterns), and framework-specific patterns for React, Chakra UI, and commerce-sdk-react.

## See Also

- [PWAV3 Toolset](../toolsets#pwav3) - Overview of PWA Kit v3 tools
- [Configuration](../configuration) - Configure MCP server and toolset selection
