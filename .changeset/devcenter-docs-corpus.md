---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` search/read (CLI), the `docs_search`/`docs_read`/`docs_list` MCP tools, and the SDK docs module. Documentation search now spans multiple corpora — Script API reference, standard job steps, Developer Center guides (commerce-api, pwa-kit-managed-runtime, sfnext, sfra, b2c-commerce), and this tooling's own guides — with content-aware ranking (upgraded from title-only matching) so natural-language queries surface the right prose guide.

Filter by corpus with the new `--category` flag (`b2c docs search`) or `category` parameter (MCP tools), and triage results using the `category`, `summary`, `keywords`, and `url` fields now returned by search and list. Guide content is fetched from its published URL on read (with an offline summary fallback); Script API and job-step content remain bundled and offline.
