---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` (CLI), the `docs_*` MCP tools, and the SDK docs module. Documentation search now spans Script API reference, standard job steps, Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), and this tooling's own guides, with content-aware ranking so natural-language queries find the right prose guide.

Results carry `category`, `summary`, `keywords`, and `url` for triage, and can be filtered by category. Search is workspace-aware: it auto-detects the project type (cartridges, SFRA, PWA Kit, or Storefront Next) and boosts that workspace's relevant docs, or you can target one or more explicitly with `--workspace` (CLI) / the `workspace` param (MCP). Restrict which categories are available at all with `--topics` / `SFCC_DOCS_TOPICS` (CLI) or `--docs-topics` (MCP server). Guide content is fetched from its published URL on read (with an offline fallback); Script API and job-step content stays bundled and offline.
