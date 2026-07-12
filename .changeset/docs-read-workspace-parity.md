---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
---

`docs read` / `docs_read` now apply the same workspace-aware ranking as `docs search` when resolving a **fuzzy** query, so a fuzzy read (e.g. `productmgr`) returns the same top result that search ranks first for the current project. Exact id lookups (e.g. `dw.catalog.ProductMgr`) are unaffected — they resolve deterministically. The CLI gains a `--workspace` flag on `docs read` (defaults to auto-detect; `all` opts out); the MCP `docs_read` uses the server's detected workspace.
