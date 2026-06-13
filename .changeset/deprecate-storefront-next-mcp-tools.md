---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-dx-docs': patch
---

Deprecate the Storefront Next MCP tools (`sfnext_*`) in favor of the `storefront-next` and `storefront-next-figma` agent-skills plugins. These tools are not compatible with the Storefront Next 1.0 GA release and will be removed in a future release.

The six `sfnext_*` tools have moved to a new `STOREFRONTNEXT_DEPRECATED` toolset that is never auto-enabled by project detection and is excluded from `--toolsets all`. To keep using them, request the toolset explicitly: `--toolsets STOREFRONTNEXT_DEPRECATED --allow-non-ga-tools`. Storefront Next projects still auto-enable the `STOREFRONTNEXT` toolset (MRT bundle push, SCAPI discovery/scaffolding, and diagnostics). Migrate to the agent-skills plugins — see the Agent Skills guide for installation.
