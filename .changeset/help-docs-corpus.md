---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
---

Add a Salesforce Help documentation corpus to `docs search`/`docs read` (and the MCP docs tools), covering Business Manager administration and merchandising content from help.salesforce.com. It is split into two categories — `help-admin` (import/export, jobs, replication, security, Account Manager, permissions, logs, inventory) and `help-merchant` (catalogs, products, promotions, search, content, analytics, SEO) — so you can search platform-administration and merchandising topics alongside the existing Script API, Developer Center, and tooling docs.

You can scope the whole docs corpus to chosen categories with the new `docsCategories` config field, sourced from `dw.json` (`docs-categories`), the `SFCC_DOCS_CATEGORIES` env var, or `package.json` — in addition to the existing `--topics` / `--docs-topics` flags (which still override config). For example, set `"docs-categories": ["script-api", "job-step", "help-admin", "tooling"]` in dw.json to expose only developer + admin docs.
