---
'b2c-vs-extension': minor
---

Add B2C-DX Analytics (CIP/CCAC) feature to the VS Code extension. Surfaces three webview panels:

- **Query Builder** — visual SELECT/FROM/WHERE/ORDER BY/LIMIT composer with raw-SQL toggle and a workspace-scoped Saved Queries library tagged per tenant.
- **Tables Browser** — schema explorer for the active CIP warehouse tenant.
- **Curated Reports** — parameter forms for every `cip report …` command with date pickers, validation, sortable result grid, and CSV/JSON export.

Adds multi-realm management (group, add, edit, switch, remove) so a single workspace can target multiple tenants. CIP commands now route through `registerSafeCommand` so SafetyGuard policies are enforced and a `cipAnalytics` feature category is recorded by usage telemetry. The shared webview stylesheet is copied into `dist/cip-analytics/` at build time so the packaged extension no longer reaches into `src/` for runtime assets.
