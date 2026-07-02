---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` (CLI), the `docs_*` MCP tools, and the SDK docs module. Documentation search now spans Script API reference, standard job steps, Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), and this tooling's own guides, with content-aware ranking so natural-language queries find the right prose guide.

Results carry `category`, `summary`, `keywords`, and `url` for triage, and can be filtered by category or favored toward the workspace's detected storefront. Restrict which categories are available with `--topics` / `SFCC_DOCS_TOPICS` (CLI) or `--docs-topics` (MCP server). Guide content is fetched from its published URL on read (with an offline fallback); Script API and job-step content stays bundled and offline.
