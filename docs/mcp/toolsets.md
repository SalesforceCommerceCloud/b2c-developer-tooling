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

**Note:** With auto-discovery, the `SCAPI` toolset is always included. When using `--toolsets` or `--tools`, only the specified toolsets/tools are enabled.

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

**Auto-enabled for:** PWA Kit v3 projects (detected by `@salesforce/pwa-kit-*` dependencies, `@salesforce/retail-react-app`, or `ccExtensibility` field in package.json)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`pwakit_get_guidelines`](./tools/pwakit-get-guidelines) | Get PWA Kit v3 development guidelines and best practices | [View details](./tools/pwakit-get-guidelines) |
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_generate_scaffold`](./tools/scapi-custom-api-generate-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-generate-scaffold) |
| [`scapi_custom_apis_get_status`](./tools/scapi-custom-apis-get-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-get-status) |
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |

## SCAPI

Salesforce Commerce API discovery and exploration.

**Status:** 🚧 Early Access

**Always enabled** - Base toolset available for all projects.

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_generate_scaffold`](./tools/scapi-custom-api-generate-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-generate-scaffold) |
| [`scapi_custom_apis_get_status`](./tools/scapi-custom-apis-get-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-get-status) |

## STOREFRONTNEXT

Storefront Next development tools for building modern storefronts.

**Status:** 🚧 Early Access. Storefront Next is part of a closed pilot and isn't available for general use.

**Auto-enabled for:** Storefront Next projects (detected by `@salesforce/storefront-next*` dependencies, package name starting with `storefront-next`, or workspace packages with these indicators)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`sfnext_get_guidelines`](./tools/sfnext-get-guidelines) | Get Storefront Next development guidelines and best practices | [View details](./tools/sfnext-get-guidelines) |
| [`sfnext_start_figma_workflow`](./tools/sfnext-start-figma-workflow) | Workflow orchestrator for Figma-to-component conversion. Parses Figma URL, returns step-by-step instructions for subsequent tool calls | [View details](./tools/sfnext-start-figma-workflow) |
| [`sfnext_analyze_component`](./tools/sfnext-analyze-component) | Analyze design and discovered components to recommend REUSE, EXTEND, or CREATE strategy | [View details](./tools/sfnext-analyze-component) |
| [`sfnext_match_tokens_to_theme`](./tools/sfnext-match-tokens-to-theme) | Map design tokens to existing theme tokens in app.css with confidence scores and suggestions | [View details](./tools/sfnext-match-tokens-to-theme) |
| [`sfnext_add_page_designer_decorator`](./tools/sfnext-add-page-designer-decorator) | Add Page Designer decorators to Storefront Next components | [View details](./tools/sfnext-add-page-designer-decorator) |
| [`sfnext_configure_theme`](./tools/sfnext-configure-theme) | Get theming guidelines, questions, and WCAG color validation for Storefront Next | [View details](./tools/sfnext-configure-theme) |
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_generate_scaffold`](./tools/scapi-custom-api-generate-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-generate-scaffold) |
| [`scapi_custom_apis_get_status`](./tools/scapi-custom-apis-get-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-get-status) |
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |

**Figma-to-component tools** (`sfnext_start_figma_workflow`, `sfnext_analyze_component`, `sfnext_match_tokens_to_theme`) require additional setup: an external Figma MCP server and a valid Figma URL with `node-id`. See [Figma-to-Component Tools Setup](./figma-tools-setup) for prerequisites and configuration.

## Tool Deduplication

Some tools appear in multiple toolsets (for example, `mrt_bundle_push`, `scapi_schemas_list`, `scapi_custom_api_generate_scaffold`, `scapi_custom_apis_get_status`). When using multiple toolsets, tools are automatically deduplicated, so you'll only see each tool once.

## Next Steps

- [Configuration](./configuration) - Configure credentials, environment variables, MCP flags, toolset selection, and logging
- [Installation](./installation) - Set up the MCP server
- [MCP Server Overview](./) - Learn more about the MCP server
