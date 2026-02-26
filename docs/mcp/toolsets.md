---
description: Available toolsets and tools in the B2C DX MCP Server for SCAPI, CARTRIDGES, MRT, PWAV3, and STOREFRONTNEXT development.
---

# Toolsets & Tools

The B2C DX MCP Server provides five toolsets with specialized tools for different B2C Commerce development workflows.

> **Note:** Tools require `--allow-non-ga-tools` to enable (preview release).

## Overview

Toolsets are collections of related tools that work together to support specific development workflows. The server automatically enables toolsets based on your project type, or you can manually select toolsets using the `--toolsets` flag.

**Available toolsets:**
- [CARTRIDGES](#cartridges) - Cartridge deployment and code version management
- [MRT](#mrt) - Managed Runtime bundle operations
- [PWAV3](#pwav3) - PWA Kit v3 development tools
- [SCAPI](#scapi) - Salesforce Commerce API discovery
- [STOREFRONTNEXT](#storefrontnext) - Storefront Next development tools

**Note:** The `SCAPI` toolset is always enabled, even if not explicitly specified.

## CARTRIDGES

Cartridge development, deployment, and code version management.

**Status:** 🚧 Early Access

**Auto-enabled for:** Cartridge projects (detected by `.project` file)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`cartridge_deploy`](./tools/cartridge-deploy) | Deploy cartridges to a B2C Commerce instance | [View details](./tools/cartridge-deploy) |

## MRT

Managed Runtime operations for PWA Kit and Storefront Next deployments.

**Status:** 🚧 Early Access

**Auto-enabled for:** PWA Kit v3 and Storefront Next projects

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |

## PWAV3

PWA Kit v3 development tools for building headless storefronts.

**Status:** 🚧 Early Access (PWA Kit-specific tools planned)

**Auto-enabled for:** PWA Kit v3 projects (detected by `@salesforce/pwa-kit-*` dependencies)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_scaffold`](./tools/scapi-custom-api-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-scaffold) |
| [`scapi_custom_apis_status`](./tools/scapi-custom-apis-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-status) |
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |

## SCAPI

Salesforce Commerce API discovery and exploration.

**Status:** 🚧 Early Access

**Always enabled** - Base toolset available for all projects.

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_scaffold`](./tools/scapi-custom-api-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-scaffold) |
| [`scapi_custom_apis_status`](./tools/scapi-custom-apis-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-status) |

## STOREFRONTNEXT

Storefront Next development tools for building modern storefronts.

**Status:** 🚧 Early Access

**Auto-enabled for:** Storefront Next projects (detected by `@salesforce/storefront-next*` dependencies)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| `storefront_next_development_guidelines` | Get Storefront Next development guidelines and best practices | — |
| [`storefront_next_page_designer_decorator`](./tools/storefront-next-page-designer-decorator) | Add Page Designer decorators to Storefront Next components | [View details](./tools/storefront-next-page-designer-decorator) |
| [`storefront_next_site_theming`](./tools/storefront-next-site-theming) | Get theming guidelines, questions, and WCAG color validation for Storefront Next | [View details](./tools/storefront-next-site-theming) |
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_scaffold`](./tools/scapi-custom-api-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-scaffold) |
| [`scapi_custom_apis_status`](./tools/scapi-custom-apis-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-status) |
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |

## Tool Deduplication

Some tools appear in multiple toolsets (for example, `mrt_bundle_push`, `scapi_schemas_list`, `scapi_custom_api_scaffold`, `scapi_custom_apis_status`). When using multiple toolsets, tools are automatically deduplicated, so you'll only see each tool once.

## Next Steps

- [Configuration](./configuration) - Configure credentials and toolset selection
- [Installation](./installation) - Set up the MCP server
- [MCP Server Overview](./) - Learn more about the MCP server
