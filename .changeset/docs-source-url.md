---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
---

Documentation entries now expose both a human-facing `url` (the rendered `.html` page, for citing/opening in a browser) and a machine-readable `sourceUrl` (the raw `.md`). Content is always sourced from `.md`, and Script API reference entries gain durable `developer.salesforce.com` permalinks (previously only guides had URLs). Surface them in the CLI with `--columns url,sourceUrl` (or `-x`) and in the MCP `docs_search` `verbose` output.
