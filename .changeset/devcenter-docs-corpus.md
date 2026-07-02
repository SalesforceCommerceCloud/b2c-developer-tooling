---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Add B2C Commerce Developer Center guides and tooling docs to `b2c docs` search/read (CLI), the `docs_search`/`docs_read`/`docs_list` MCP tools, and the SDK docs module. Documentation search now spans multiple corpora — Script API reference, standard job steps, Developer Center guides (commerce-api, pwa-kit-managed-runtime, sfnext, sfra, b2c-commerce), and this tooling's own guides — with content-aware ranking (upgraded from title-only matching) so natural-language queries surface the right prose guide.

Filter by corpus with the new `--category` flag (`b2c docs search`) or `category` parameter (MCP tools), and triage results using the `category`, `summary`, `keywords`, and `url` fields now returned by search. Search is also storefront-aware: it auto-detects the workspace's storefront framework and favors the relevant guides (SFRA, PWA Kit, or Storefront Next), with an opt-in `filter` mode to hide other frameworks' docs entirely. Guide content is fetched from its published URL on read (with an offline summary fallback); Script API and job-step content remain bundled and offline.

The MCP docs tools are tuned for compact, agent-friendly payloads: `docs_search` returns a small default result set with only triage fields (pass `verbose` for keywords/url), `docs_list` returns a table of contents (and just a category directory when unfiltered) with pagination, and `docs_read` truncates long documents to a bounded length with `offset`/`maxLength` paging.

You can bound the entire available documentation corpus to specific topics with the `--topics` flag / `SFCC_DOCS_TOPICS` env var (CLI `docs search`/`docs read`) or the `--docs-topics` startup flag (MCP server) — an allowlist that pins which categories are exposed, within which `--category`/`--storefront` still apply. This lets a team surface only the docs relevant to their storefront rather than relying on storefront boosting alone.
