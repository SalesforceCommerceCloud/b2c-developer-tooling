---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Log commands and tools can now access logs in `Logs/` subdirectories (such as `internal/`). Pass a path-like `--filter`/`prefixes` value containing a `/` — e.g. `--filter internal/server` to target `server-*.log` files under `internal/`, or `--filter internal/` for everything in that subdirectory. Plain prefix filters (and the default listing) are unchanged and still only scan the top-level `Logs/` directory, so there is no performance impact unless you opt in with a path filter. Works across `logs list`, `logs get`, `logs tail`, and the corresponding MCP tools.
