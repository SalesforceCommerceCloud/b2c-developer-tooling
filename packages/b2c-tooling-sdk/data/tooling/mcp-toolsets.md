
# Toolsets & Tools

The B2C DX MCP Server provides six toolsets with specialized tools for different B2C Commerce development workflows, plus one deprecated toolset retained for backward compatibility.


## Overview

Toolsets are collections of related tools that work together to support specific development workflows. The server automatically enables toolsets based on your project type, or you can manually select toolsets using the `--toolsets` flag.

**Available toolsets:**
- [CARTRIDGES](#cartridges) - Cartridge deployment and code version management
- [DIAGNOSTICS](#diagnostics) - Script debugger, log inspection, and bundled documentation
- [MRT](#mrt) - Managed Runtime bundle operations
- [PWAV3](#pwav3) - PWA Kit v3 development tools
- [SCAPI](#scapi) - Salesforce Commerce API discovery
- [STOREFRONTNEXT](#storefrontnext) - Storefront Next development support (MRT, SCAPI, cartridges)

**Deprecated toolset:**
- [STOREFRONTNEXT_DEPRECATED](#storefrontnext-deprecated) - Legacy `sfnext_*` tools, superseded by the [`storefront-next`/`storefront-next-figma` agent-skills plugins](../guide/agent-skills). Opt-in only; never auto-enabled and excluded from `--toolsets ALL`.

**Note:** With auto-discovery, the `SCAPI` and `DIAGNOSTICS` toolsets are always included. When using `--toolsets` or `--tools`, only the specified toolsets/tools are enabled.

## CARTRIDGES

Cartridge development, deployment, and code version management.

**Status:** ✅ Generally Available

**Auto-enabled for:** Cartridge projects (detected by `.project` file)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`cartridge_deploy`](./tools/cartridge-deploy) | Deploy cartridges to a B2C Commerce instance | [View details](./tools/cartridge-deploy) |

## DIAGNOSTICS

Script debugger, runtime log inspection, and bundled Script API / XSD documentation lookup.

**Status:** ✅ Generally Available

**Always enabled** - Base toolset available for all projects. The log and debugger tools also appear in `CARTRIDGES` and `SCAPI`; the documentation tools appear in every toolset.

### Script Debugger

| Tool | Description | Documentation |
|------|-------------|---------------|
| `debug_start_session` / `debug_end_session` / `debug_list_sessions` | Manage SDAPI debugger sessions | [View details](./tools/diagnostics) |
| `debug_set_breakpoints` | Set breakpoints in cartridge scripts | [View details](./tools/diagnostics) |
| `debug_wait_for_stop` / `debug_continue` / `debug_step_into` / `debug_step_over` / `debug_step_out` | Control execution flow | [View details](./tools/diagnostics) |
| `debug_get_stack` / `debug_get_variables` / `debug_evaluate` | Inspect stack frames, variables, and evaluate expressions | [View details](./tools/diagnostics) |
| `debug_capture_at_breakpoint` | One-shot capture of stack + variables at a breakpoint | [View details](./tools/diagnostics) |

### Logs

| Tool | Description | Documentation |
|------|-------------|---------------|
| `logs_list_files` | List log files on the instance via WebDAV | [View details](./tools/logs) |
| `logs_get_recent` | Fetch recent log entries in a single request | [View details](./tools/logs) |
| `logs_watch_start` / `logs_watch_poll` / `logs_watch_stop` / `logs_watch_list` | Buffered log watch lifecycle so entries aren't missed between calls | [View details](./tools/logs) |
| `mrt_logs_watch_start` / `mrt_logs_watch_poll` / `mrt_logs_watch_stop` / `mrt_logs_watch_list` | Buffered tail of Managed Runtime (MRT) application logs over a WebSocket | [View details](./tools/mrt-logs) |

### Documentation

| Tool | Description | Documentation |
|------|-------------|---------------|
| `docs_search` / `docs_read` / `docs_list` | Search and read bundled Script API documentation | [View details](./tools/docs) |
| `docs_schema_search` / `docs_schema_read` / `docs_schema_list` | Search and read bundled XSD schemas | [View details](./tools/docs) |

## MRT

Managed Runtime operations for PWA Kit and Storefront Next deployments.

**Status:** ✅ Generally Available

**Auto-enabled for:** PWA Kit v3 and Storefront Next projects

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |

> **Note:** the MRT log-tail tools (`mrt_logs_watch_*`) are available in the `DIAGNOSTICS`, `PWAV3`, and `STOREFRONTNEXT` toolsets — not the `MRT` toolset. See [MRT Log Tools](./tools/mrt-logs).

## PWAV3

PWA Kit v3 development tools for building headless storefronts.

**Status:** ✅ Generally Available

**Auto-enabled for:** PWA Kit v3 projects (detected by `@salesforce/pwa-kit-*` dependencies, `@salesforce/retail-react-app`, or `ccExtensibility` field in package.json)

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`pwakit_get_guidelines`](./tools/pwakit-get-guidelines) | Get PWA Kit v3 development guidelines and best practices | [View details](./tools/pwakit-get-guidelines) |
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_generate_scaffold`](./tools/scapi-custom-api-generate-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-generate-scaffold) |
| [`scapi_custom_apis_get_status`](./tools/scapi-custom-apis-get-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-get-status) |
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |
| `mrt_logs_watch_start` / `mrt_logs_watch_poll` / `mrt_logs_watch_stop` / `mrt_logs_watch_list` | Tail Managed Runtime application logs over a WebSocket | [View details](./tools/mrt-logs) |

## SCAPI

Salesforce Commerce API discovery and exploration.

**Status:** ✅ Generally Available

**Always enabled** - Base toolset available for all projects.

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_generate_scaffold`](./tools/scapi-custom-api-generate-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-generate-scaffold) |
| [`scapi_custom_apis_get_status`](./tools/scapi-custom-apis-get-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-get-status) |

## STOREFRONTNEXT

Storefront Next development support.

**Status:** ✅ Generally Available

**Auto-enabled for:** Storefront Next projects (detected by `@salesforce/storefront-next*` dependencies, package name starting with `storefront-next`, or workspace packages with these indicators)

When a Storefront Next project is detected, the server enables `MRT` and `CARTRIDGES` (plus the base `SCAPI` and `DIAGNOSTICS` toolsets), giving you `mrt_bundle_push`, SCAPI discovery/scaffolding, and the shared diagnostics tools. The legacy `sfnext_*` tools have moved to the deprecated [STOREFRONTNEXT_DEPRECATED](#storefrontnext-deprecated) toolset (see below) — use the agent-skills plugins instead.

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`mrt_bundle_push`](./tools/mrt-bundle-push) | Build, push bundle (optionally deploy) | [View details](./tools/mrt-bundle-push) |
| `mrt_logs_watch_start` / `mrt_logs_watch_poll` / `mrt_logs_watch_stop` / `mrt_logs_watch_list` | Tail Managed Runtime application logs over a WebSocket | [View details](./tools/mrt-logs) |
| [`scapi_schemas_list`](./tools/scapi-schemas-list) | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. | [View details](./tools/scapi-schemas-list) |
| [`scapi_custom_api_generate_scaffold`](./tools/scapi-custom-api-generate-scaffold) | Generate a new custom SCAPI endpoint (schema, api.json, script.js) in an existing cartridge. | [View details](./tools/scapi-custom-api-generate-scaffold) |
| [`scapi_custom_apis_get_status`](./tools/scapi-custom-apis-get-status) | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. | [View details](./tools/scapi-custom-apis-get-status) |

## STOREFRONTNEXT_DEPRECATED

::: warning DEPRECATED — use the agent-skills plugins instead
The `sfnext_*` MCP tools below are **deprecated** and **not compatible with the Storefront Next 1.0 GA release**. They have been superseded by the [`storefront-next`](../guide/agent-skills) and [`storefront-next-figma`](../guide/agent-skills) agent-skills plugins, which are kept up to date with the GA release. **These tools will be removed in a future release.**

Migrate to the skills plugins — see the [Agent Skills guide](../guide/agent-skills) for installation. This toolset is **never auto-enabled** and is **excluded from `--toolsets ALL`**; to use it you must request it explicitly _and_ pass `--allow-non-ga-tools`:

```json
{ "args": ["--toolsets", "STOREFRONTNEXT_DEPRECATED", "--allow-non-ga-tools"] }
```
:::

**Status:** ⛔ Deprecated — opt-in only, requires `--allow-non-ga-tools`.

**Auto-enabled for:** Never. Must be explicitly requested via `--toolsets STOREFRONTNEXT_DEPRECATED`.

### Tools

| Tool | Description | Documentation |
|------|-------------|---------------|
| [`sfnext_get_guidelines`](./tools/sfnext-get-guidelines) | Get Storefront Next development guidelines and best practices | [View details](./tools/sfnext-get-guidelines) |
| [`sfnext_start_figma_workflow`](./tools/sfnext-start-figma-workflow) | Workflow orchestrator for Figma-to-component conversion. Parses Figma URL, returns step-by-step instructions for subsequent tool calls | [View details](./tools/sfnext-start-figma-workflow) |
| [`sfnext_analyze_component`](./tools/sfnext-analyze-component) | Analyze design and discovered components to recommend REUSE, EXTEND, or CREATE strategy | [View details](./tools/sfnext-analyze-component) |
| [`sfnext_match_tokens_to_theme`](./tools/sfnext-match-tokens-to-theme) | Map design tokens to existing theme tokens in app.css with confidence scores and suggestions | [View details](./tools/sfnext-match-tokens-to-theme) |
| [`sfnext_add_page_designer_decorator`](./tools/sfnext-add-page-designer-decorator) | Add Page Designer decorators to Storefront Next components | [View details](./tools/sfnext-add-page-designer-decorator) |
| [`sfnext_configure_theme`](./tools/sfnext-configure-theme) | Get theming guidelines, questions, and WCAG color validation for Storefront Next | [View details](./tools/sfnext-configure-theme) |

## Tool Deduplication

Some tools appear in multiple toolsets (for example, `mrt_bundle_push`, the `mrt_logs_watch_*` tools, `scapi_schemas_list`, `scapi_custom_api_generate_scaffold`, `scapi_custom_apis_get_status`). When using multiple toolsets, tools are automatically deduplicated, so you'll only see each tool once.

## Next Steps

- [Configuration](./configuration) - Configure credentials, environment variables, MCP flags, toolset selection, and logging
- [Installation](./installation) - Set up the MCP server
- [MCP Server Overview](./) - Learn more about the MCP server
