---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add MCP tools for log inspection and documentation lookup. Logs: `logs_list_files`, `logs_get_recent`, and a `logs_watch_start` / `logs_watch_poll` / `logs_watch_stop` / `logs_watch_list` lifecycle that buffers entries between polls so agents don't miss logs produced between tool calls. Docs: `docs_search`, `docs_read`, `docs_list`, `docs_schema_search`, `docs_schema_read`, `docs_schema_list` for the bundled Script API and XSD schema corpora. Adds a new `DIAGNOSTICS` toolset that groups the script debugger and log tools; like `SCAPI`, it is always enabled (auto-discovered for every project type). SDK now also exports the log filter helpers (`parseSinceTime`, `filterBySince`, `filterByLevel`, `filterBySearch`, `matchesLevel`, `matchesSearch`) for reuse.

The log watch buffers `logs_watch_start` defaults to `last_entries: 0` (capture only new entries, matching the "start before triggering" workflow), bounds the entry buffer by bytes as well as count, reports each discovered file only once per poll, stops the underlying tail if a concurrent-start hostname race loses registration, and makes `logs_watch_stop` truly idempotent.
