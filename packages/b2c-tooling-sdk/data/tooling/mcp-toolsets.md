
# Toolsets & Tools

Toolsets are collections of related tools for a development workflow. The server auto-enables toolsets based on your [detected project type](./#project-type-detection), or you can select them manually with `--toolsets`. **SCAPI** and **DIAGNOSTICS** are always enabled.

Each tool below links to its full reference (parameters, authentication, usage). Some tools appear in more than one toolset; when multiple toolsets are active, tools are deduplicated so each is exposed once.

## CARTRIDGES

Cartridge deployment and code version management. **Auto-enabled for** cartridge projects (detected by a `.project` file).

- [`cartridge_deploy`](./tools/cartridge-deploy) — deploy cartridges to an instance via WebDAV, with optional code-version reload

## DIAGNOSTICS

Script debugger, runtime log inspection, and multi-corpus documentation search. **Always enabled.** The debugger and log tools also appear in `CARTRIDGES` and `SCAPI`; the documentation tools appear in every toolset.

- [Script Debugger](./tools/diagnostics) — `debug_*` tools: manage SDAPI sessions, set breakpoints, step execution, inspect stack/variables, and capture at a breakpoint
- [Instance logs](./tools/logs#instance-logs) — `logs_*` tools: list files, fetch recent entries, and run buffered watches
- [MRT logs](./tools/logs#mrt-logs) — `mrt_logs_*` tools: buffered tail of Managed Runtime application logs over a WebSocket
- [Documentation](./tools/docs) — `docs_*` and `docs_schema_*` tools: search and read Script API, Developer Center guides, tooling docs, job steps, and XSD schemas

## MRT

Managed Runtime operations for PWA Kit and Storefront Next deployments. **Auto-enabled for** PWA Kit v3 and Storefront Next projects.

- [`mrt_bundle_push`](./tools/mrt-bundle-push) — build and push a bundle, optionally deploying to an environment

> **Note:** the MRT log-tail tools (`mrt_logs_watch_*`) live in the `DIAGNOSTICS`, `PWAV3`, and `STOREFRONTNEXT` toolsets — not `MRT`. See [MRT logs](./tools/logs#mrt-logs).

## PWAV3

PWA Kit v3 development tools for headless storefronts. **Auto-enabled for** PWA Kit v3 projects.

- [`pwakit_get_guidelines`](./tools/pwakit-get-guidelines) — PWA Kit v3 architecture rules and best practices
- [`scapi_schemas_list`](./tools/scapi-schemas-list) — list or fetch SCAPI schemas (standard and custom)
- [Custom APIs](./tools/scapi-custom-apis) — scaffold custom endpoints and check their registration status
- [`mrt_bundle_push`](./tools/mrt-bundle-push) — build and push a bundle
- [MRT logs](./tools/logs#mrt-logs) — `mrt_logs_*` tools

## SCAPI

Salesforce Commerce API discovery and exploration. **Always enabled.**

- [`scapi_schemas_list`](./tools/scapi-schemas-list) — list or fetch SCAPI schemas (standard and custom)
- [Custom APIs](./tools/scapi-custom-apis) — scaffold custom endpoints and check their registration status

## STOREFRONTNEXT

Storefront Next development support. **Auto-enabled for** Storefront Next projects; enables the `MRT` and `CARTRIDGES` toolsets alongside the base `SCAPI` and `DIAGNOSTICS`. The legacy `sfnext_*` tools are deprecated — use the [`storefront-next` / `storefront-next-figma` agent-skills plugins](../guide/agent-skills) instead.

- [`mrt_bundle_push`](./tools/mrt-bundle-push) — build and push a bundle
- [MRT logs](./tools/logs#mrt-logs) — `mrt_logs_*` tools
- [`scapi_schemas_list`](./tools/scapi-schemas-list) — list or fetch SCAPI schemas (standard and custom)
- [Custom APIs](./tools/scapi-custom-apis) — scaffold custom endpoints and check their registration status

## STOREFRONTNEXT_DEPRECATED

::: warning DEPRECATED — use the agent-skills plugins instead
The `sfnext_*` MCP tools are **deprecated** and **not compatible with the Storefront Next 1.0 GA release**. They have been superseded by the [`storefront-next`](../guide/agent-skills) and [`storefront-next-figma`](../guide/agent-skills) agent-skills plugins, which stay current with the GA release. **These tools will be removed in a future release.**

This toolset is **never auto-enabled** and is **excluded from `--toolsets ALL`**; to use it you must request it explicitly _and_ pass `--allow-non-ga-tools`:

```json
{"args": ["--toolsets", "STOREFRONTNEXT_DEPRECATED", "--allow-non-ga-tools"]}
```

:::

- [`sfnext_get_guidelines`](./tools/sfnext-get-guidelines)
- [`sfnext_start_figma_workflow`](./tools/sfnext-start-figma-workflow)
- [`sfnext_analyze_component`](./tools/sfnext-analyze-component)
- [`sfnext_match_tokens_to_theme`](./tools/sfnext-match-tokens-to-theme)
- [`sfnext_add_page_designer_decorator`](./tools/sfnext-add-page-designer-decorator)
- [`sfnext_configure_theme`](./tools/sfnext-configure-theme)

## Next Steps

- [Configuration](./configuration) — credentials, environment variables, MCP flags, toolset selection, and logging
- [Installation](./installation) — set up the MCP server
- [MCP Server Overview](./) — project-type detection and how toolsets are enabled
